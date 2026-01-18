
import { HomeworkTask, LearningPlan, UserProfile } from '../types';

// 这些变量由 vite.config.ts 从 .env 注入
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const isConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_KEY && 
  SUPABASE_URL.startsWith('http') &&
  !SUPABASE_URL.includes('your-project-id')
);

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
};

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

const transformers = {
  taskToDb: (task: HomeworkTask, userId: string) => ({
    id: task.id,
    user_id: userId,
    source: task.source,
    subject: task.subject,
    category: task.category,
    content: task.content,
    deadline: task.deadline,
    status: task.status,
    timestamp: task.timestamp,
    submission_image: task.submissionImage || null,
    result: task.result || null
  }),
  dbToTask: (dbTask: any): HomeworkTask => ({
    id: dbTask.id,
    source: dbTask.source,
    subject: dbTask.subject,
    category: dbTask.category,
    content: dbTask.content,
    deadline: dbTask.deadline,
    status: dbTask.status,
    timestamp: dbTask.timestamp,
    submissionImage: dbTask.submission_image,
    result: dbTask.result
  }),
  planToDb: (plan: LearningPlan, userId: string) => ({
    id: plan.id,
    user_id: userId,
    focus_area: plan.focusArea,
    tasks: plan.tasks,
    created_at: plan.createdAt
  }),
  dbToPlan: (dbPlan: any): LearningPlan => ({
    id: dbPlan.id,
    focusArea: dbPlan.focus_area,
    tasks: dbPlan.tasks,
    createdAt: dbPlan.created_at
  })
};

// 辅助函数：处理响应并打印详细错误
async function handleResponse(response: Response, context: string) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`Supabase Error [${context}]:`, {
      status: response.status,
      statusText: response.statusText,
      details: errorData.details,
      message: errorData.message,
      hint: errorData.hint
    });
    throw new Error(errorData.message || `Supabase request failed: ${context}`);
  }
  return response;
}

export const apiService = {
  async fetchUsers(): Promise<UserProfile[]> {
    if (!isConfigured) return LocalDB.get('users', []);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=*`, { headers });
      await handleResponse(response, 'fetchUsers');
      const data = await response.json();
      LocalDB.set('users', data);
      return data;
    } catch (error) {
      console.warn("Using local users fallback");
      return LocalDB.get('users', []);
    }
  },

  async syncUser(user: UserProfile): Promise<void> {
    const localUsers = LocalDB.get<UserProfile[]>('users', []);
    const updatedUsers = [user, ...localUsers.filter(u => u.id !== user.id)];
    LocalDB.set('users', updatedUsers);

    if (!isConfigured) return;
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: { 
          ...headers, 
          'Prefer': 'resolution=merge-duplicates' 
        },
        body: JSON.stringify(user)
      });
      await handleResponse(response, 'syncUser');
    } catch (error) {
      console.error("Cloud syncUser failed", error);
    }
  },

  async getTasks(userId: string): Promise<HomeworkTask[]> {
    if (!isConfigured) return LocalDB.get(`tasks_${userId}`, []);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/homework_tasks?user_id=eq.${userId}&select=*&order=timestamp.desc`, { headers });
      await handleResponse(response, 'getTasks');
      const data = await response.json();
      const mappedData = data.map(transformers.dbToTask);
      LocalDB.set(`tasks_${userId}`, mappedData);
      return mappedData;
    } catch (error) {
      return LocalDB.get(`tasks_${userId}`, []);
    }
  },

  async upsertTask(userId: string, task: HomeworkTask): Promise<void> {
    const localTasks = LocalDB.get<HomeworkTask[]>(`tasks_${userId}`, []);
    const updatedTasks = [task, ...localTasks.filter(t => t.id !== task.id)];
    LocalDB.set(`tasks_${userId}`, updatedTasks);

    if (!isConfigured) return;
    try {
      const payload = transformers.taskToDb(task, userId);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/homework_tasks`, {
        method: 'POST',
        headers: { 
          ...headers, 
          'Prefer': 'resolution=merge-duplicates' 
        },
        body: JSON.stringify(payload)
      });
      await handleResponse(response, 'upsertTask');
    } catch (error) {
      throw error;
    }
  },

  async getPlan(userId: string): Promise<LearningPlan | null> {
    if (!isConfigured) return LocalDB.get(`plan_${userId}`, null);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/learning_plans?user_id=eq.${userId}&select=*&order=created_at.desc&limit=1`, { headers });
      await handleResponse(response, 'getPlan');
      const data = await response.json();
      const plan = data.length > 0 ? transformers.dbToPlan(data[0]) : null;
      if (plan) LocalDB.set(`plan_${userId}`, plan);
      return plan;
    } catch (error) {
      return LocalDB.get(`plan_${userId}`, null);
    }
  },

  async savePlan(userId: string, plan: LearningPlan): Promise<void> {
    LocalDB.set(`plan_${userId}`, plan);

    if (!isConfigured) return;
    try {
      const payload = transformers.planToDb(plan, userId);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/learning_plans`, {
        method: 'POST',
        headers: { 
          ...headers, 
          'Prefer': 'resolution=merge-duplicates' 
        },
        body: JSON.stringify(payload)
      });
      await handleResponse(response, 'savePlan');
    } catch (error) {
      console.error("Cloud savePlan failed", error);
    }
  }
};
