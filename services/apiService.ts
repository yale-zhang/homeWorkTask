
import { HomeworkTask, LearningPlan, UserProfile, AppSettings } from '../types';
import { settingsService } from './settingsService';

const getClientConfig = () => {
  const settings = settingsService.getSettings();
  const clean = (val: string | undefined) => val ? val.replace(/^[:\s]+/, '').trim() : '';
  const url = clean(settings.supabaseUrl) || clean(process.env.SUPABASE_URL);
  const key = clean(settings.supabaseKey) || clean(process.env.SUPABASE_KEY);
  const isConfigured = Boolean(url && key && url.startsWith('http') && !url.includes('your-project-id'));
  return { url, key, isConfigured };
};

const getHeaders = () => {
  const config = getClientConfig();
  return { 
    'Content-Type': 'application/json', 
    'apikey': config.key, 
    'Authorization': `Bearer ${config.key}` 
  };
};

const LocalDB = {
  get: <T>(key: string, defaultValue: T): T => {
    try { 
      const data = localStorage.getItem(`ldb_${key}`); 
      return data ? JSON.parse(data) : defaultValue; 
    } catch { return defaultValue; }
  },
  set: (key: string, value: any) => localStorage.setItem(`ldb_${key}`, JSON.stringify(value))
};

const transformers = {
  taskToDb: (task: HomeworkTask, userId: string) => ({
    id: task.id,
    user_id: userId,
    title: task.title,
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
    title: dbTask.title || 'Untitled Task',
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
    created_at: plan.createdAt,
    source_task_id: plan.sourceTaskId || null,
    source_task_title: plan.sourceTaskTitle,
    source_task_subject: plan.sourceTaskSubject,
    deep_analysis: plan.deepAnalysis || null
  }),
  dbToPlan: (dbPlan: any): LearningPlan => ({
    id: dbPlan.id,
    focusArea: dbPlan.focus_area,
    tasks: dbPlan.tasks,
    createdAt: dbPlan.created_at,
    sourceTaskId: dbPlan.source_task_id,
    sourceTaskTitle: dbPlan.source_task_title,
    sourceTaskSubject: dbPlan.source_task_subject,
    deepAnalysis: dbPlan.deep_analysis
  })
};

async function handleResponse(response: Response, context: string) {
  if (!response.ok) {
    let info = 'Unknown Error';
    try { const data = await response.json(); info = JSON.stringify(data); } catch { info = await response.text(); }
    console.error(`❌ API Error [${context}]:`, { status: response.status, info });
    throw new Error(`DB Error: ${response.status} - ${info}`);
  }
  return response;
}

export const apiService = {
  async fetchUsers(): Promise<UserProfile[]> {
    const config = getClientConfig();
    if (!config.isConfigured) return LocalDB.get('users', []);
    try {
      const response = await fetch(`${config.url}/rest/v1/user_profiles?select=*`, { 
        headers: getHeaders(),
        cache: 'no-store'
      });
      await handleResponse(response, 'fetchUsers');
      const data = await response.json();
      LocalDB.set('users', data);
      return data;
    } catch (error) { 
      console.warn("fetchUsers failed, falling back to local storage", error);
      return LocalDB.get('users', []); 
    }
  },
  async syncUser(user: UserProfile): Promise<void> {
    const config = getClientConfig();
    const local = LocalDB.get<UserProfile[]>('users', []);
    LocalDB.set('users', [user, ...local.filter(u => u.id !== user.id)]);
    if (!config.isConfigured) return;
    try {
      const response = await fetch(`${config.url}/rest/v1/user_profiles`, { 
        method: 'POST', 
        headers: { ...getHeaders(), 'Prefer': 'resolution=merge-duplicates' }, 
        body: JSON.stringify(user) 
      });
      await handleResponse(response, 'syncUser');
    } catch (error) { throw error; }
  },
  async getTasks(userId: string): Promise<HomeworkTask[]> {
    const config = getClientConfig();
    if (!config.isConfigured) return LocalDB.get(`tasks_${userId}`, []);
    try {
      const response = await fetch(`${config.url}/rest/v1/homework_tasks?user_id=eq.${userId}&select=*&order=timestamp.desc`, { headers: getHeaders() });
      await handleResponse(response, 'getTasks');
      const data = await response.json();
      const mapped = data.map(transformers.dbToTask);
      LocalDB.set(`tasks_${userId}`, mapped);
      return mapped;
    } catch (error) { return LocalDB.get(`tasks_${userId}`, []); }
  },
  async upsertTask(userId: string, task: HomeworkTask): Promise<void> {
    const config = getClientConfig();
    const local = LocalDB.get<HomeworkTask[]>(`tasks_${userId}`, []);
    LocalDB.set(`tasks_${userId}`, [task, ...local.filter(t => t.id !== task.id)]);
    if (!config.isConfigured) return;
    try {
      const payload = transformers.taskToDb(task, userId);
      const response = await fetch(`${config.url}/rest/v1/homework_tasks`, { 
        method: 'POST', 
        headers: { ...getHeaders(), 'Prefer': 'resolution=merge-duplicates' }, 
        body: JSON.stringify(payload) 
      });
      await handleResponse(response, 'upsertTask');
    } catch (error) { throw error; }
  },
  async getPlan(userId: string, taskId?: string): Promise<LearningPlan | null> {
    const config = getClientConfig();
    if (!config.isConfigured) return LocalDB.get(taskId ? `plan_${userId}_${taskId}` : `plan_${userId}_latest`, null);
    try {
      // 如果提供了 taskId，则查询特定作业的计划，否则查询该用户最新的一条计划
      const query = taskId ? `user_id=eq.${userId}&source_task_id=eq.${taskId}` : `user_id=eq.${userId}`;
      const response = await fetch(`${config.url}/rest/v1/learning_plans?${query}&select=*&order=created_at.desc&limit=1`, { headers: getHeaders() });
      await handleResponse(response, 'getPlan');
      const data = await response.json();
      const plan = data.length > 0 ? transformers.dbToPlan(data[0]) : null;
      if (plan) {
        LocalDB.set(taskId ? `plan_${userId}_${taskId}` : `plan_${userId}_latest`, plan);
      }
      return plan;
    } catch (error) { 
      return LocalDB.get(taskId ? `plan_${userId}_${taskId}` : `plan_${userId}_latest`, null); 
    }
  },
  async savePlan(userId: string, plan: LearningPlan): Promise<void> {
    const config = getClientConfig();
    // 双路缓存：既存最新也存特定作业
    LocalDB.set(`plan_${userId}_latest`, plan);
    if (plan.sourceTaskId) {
      LocalDB.set(`plan_${userId}_${plan.sourceTaskId}`, plan);
    }
    if (!config.isConfigured) return;
    try {
      const payload = transformers.planToDb(plan, userId);
      const response = await fetch(`${config.url}/rest/v1/learning_plans`, { 
        method: 'POST', 
        headers: { ...getHeaders(), 'Prefer': 'resolution=merge-duplicates' }, 
        body: JSON.stringify(payload) 
      });
      await handleResponse(response, 'savePlan');
    } catch (error) { throw error; }
  },
  async getCloudSettings(userId: string): Promise<AppSettings | null> {
    const config = getClientConfig();
    if (!config.isConfigured) return null;
    try {
      const response = await fetch(`${config.url}/rest/v1/app_settings?id=eq.${userId}&select=settings`, { headers: getHeaders() });
      await handleResponse(response, 'getCloudSettings');
      const data = await response.json();
      return data.length > 0 ? data[0].settings : null;
    } catch (error) { return null; }
  },
  async saveCloudSettings(userId: string, settings: AppSettings): Promise<void> {
    const config = getClientConfig();
    if (!config.isConfigured) return;
    try {
      const payload = { id: userId, settings, updated_at: Date.now() };
      const response = await fetch(`${config.url}/rest/v1/app_settings`, { 
        method: 'POST', 
        headers: { ...getHeaders(), 'Prefer': 'resolution=merge-duplicates' }, 
        body: JSON.stringify(payload) 
      });
      await handleResponse(response, 'saveCloudSettings');
    } catch (error) { throw error; }
  }
};
