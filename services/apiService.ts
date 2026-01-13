
import { HomeworkTask, LearningPlan, UserProfile } from '../types';

// These variables are injected at build time via vite.config.ts from your .env file
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Check if the service is actually configured. 
// It considers configured if variables exist and are not the default placeholders.
const isConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_KEY && 
  !SUPABASE_URL.includes('your-project-id') && 
  SUPABASE_KEY !== 'your-anon-key'
);

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
};

/**
 * Local Storage Fallback Implementation
 */
const LocalDB = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const data = localStorage.getItem(`ldb_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key: string, value: any) => {
    localStorage.setItem(`ldb_${key}`, JSON.stringify(value));
  }
};

export const apiService = {
  async fetchUsers(): Promise<UserProfile[]> {
    if (!isConfigured) return LocalDB.get('users', []);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=*`, { headers });
      if (!response.ok) throw new Error('Supabase Error');
      const data = await response.json();
      LocalDB.set('users', data); // Cache locally
      return data;
    } catch (error) {
      console.warn("Cloud fetch failed, using local storage", error);
      return LocalDB.get('users', []);
    }
  },

  async syncUser(user: UserProfile): Promise<void> {
    const localUsers = LocalDB.get<UserProfile[]>('users', []);
    const updatedUsers = [user, ...localUsers.filter(u => u.id !== user.id)];
    LocalDB.set('users', updatedUsers);

    if (!isConfigured) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(user)
      });
    } catch (error) {
      console.error("Cloud syncUser failed", error);
    }
  },

  async getTasks(userId: string): Promise<HomeworkTask[]> {
    if (!isConfigured) return LocalDB.get(`tasks_${userId}`, []);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/homework_tasks?user_id=eq.${userId}&select=*&order=timestamp.desc`, { headers });
      if (!response.ok) throw new Error('Supabase Error');
      const data = await response.json();
      LocalDB.set(`tasks_${userId}`, data);
      return data;
    } catch (error) {
      console.warn("Cloud getTasks failed, using local cache", error);
      return LocalDB.get(`tasks_${userId}`, []);
    }
  },

  async upsertTask(userId: string, task: HomeworkTask): Promise<void> {
    const localTasks = LocalDB.get<HomeworkTask[]>(`tasks_${userId}`, []);
    const updatedTasks = [task, ...localTasks.filter(t => t.id !== task.id)];
    LocalDB.set(`tasks_${userId}`, updatedTasks);

    if (!isConfigured) return;
    try {
      const payload = { ...task, user_id: userId };
      await fetch(`${SUPABASE_URL}/rest/v1/homework_tasks`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Cloud upsertTask failed", error);
      throw error; // Let the UI handle the connection status
    }
  },

  async getPlan(userId: string): Promise<LearningPlan | null> {
    if (!isConfigured) return LocalDB.get(`plan_${userId}`, null);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/learning_plans?user_id=eq.${userId}&select=*&order=created_at.desc&limit=1`, { headers });
      if (!response.ok) throw new Error('Supabase Error');
      const data = await response.json();
      const plan = data.length > 0 ? data[0] : null;
      if (plan) LocalDB.set(`plan_${userId}`, plan);
      return plan;
    } catch (error) {
      console.warn("Cloud getPlan failed, using local cache", error);
      return LocalDB.get(`plan_${userId}`, null);
    }
  },

  async savePlan(userId: string, plan: LearningPlan): Promise<void> {
    LocalDB.set(`plan_${userId}`, plan);

    if (!isConfigured) return;
    try {
      const payload = { ...plan, user_id: userId };
      await fetch(`${SUPABASE_URL}/rest/v1/learning_plans`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Cloud savePlan failed", error);
    }
  }
};
