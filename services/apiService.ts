import { HomeworkTask, LearningPlan, UserProfile, AppSettings, GradingResult } from '../types';

const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || '/api';
const API_ROOT = API_BASE.replace(/\/$/, '');
const API_V1 = `${API_ROOT}/v1`;

const ACCESS_TOKEN_KEY = 'intellitask_access_token';
const REFRESH_TOKEN_KEY = 'intellitask_refresh_token';
const CURRENT_USER_ID_KEY = 'intellitask_current_uid';

const LocalDB = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const data = localStorage.getItem(`ldb_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key: string, value: any) => localStorage.setItem(`ldb_${key}`, JSON.stringify(value))
};

const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY) || '';
const setTokens = (accessToken: string, refreshToken?: string) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

const getAuthHeaders = () => {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  } as Record<string, string>;
};

async function handleJson<T>(response: Response, context: string): Promise<T> {
  if (!response.ok) {
    let info = 'Unknown Error';
    try {
      const data = await response.json();
      info = JSON.stringify(data);
    } catch {
      info = await response.text();
    }
    console.error(`API Error [${context}]:`, { status: response.status, info });
    throw new Error(`API Error: ${response.status} - ${info}`);
  }
  return response.json() as Promise<T>;
}

function toUserProfile(user: any): UserProfile {
  return {
    id: user.id,
    nickname: user.nickname || user.username || 'Student',
    avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname || user.username || 'Student')}&background=6366f1&color=fff`,
    grade: user.grade || 'Grade 10',
    school: user.school
  };
}

function toHomeworkTask(dto: any): HomeworkTask {
  let result: GradingResult | undefined;
  if (dto.result) {
    try { result = typeof dto.result === 'string' ? JSON.parse(dto.result) : dto.result; } catch { result = undefined; }
  }
  return {
    id: dto.id,
    title: dto.title || 'Untitled Task',
    source: dto.source || 'Unknown',
    subject: dto.subject,
    category: dto.category,
    content: dto.content || '',
    deadline: dto.deadline || '',
    status: dto.status,
    timestamp: dto.timestamp ? new Date(dto.timestamp).getTime() : Date.now(),
    submissionImage: dto.submissionImage || dto.submission_image,
    result
  };
}

function toLearningPlan(dto: any): LearningPlan {
  let tasks = [];
  try { tasks = dto.tasks ? (typeof dto.tasks === 'string' ? JSON.parse(dto.tasks) : dto.tasks) : []; } catch { tasks = []; }
  return {
    id: dto.id,
    focusArea: dto.focusArea || dto.focus_area,
    deepAnalysis: dto.deepAnalysis || dto.deep_analysis,
    tasks,
    createdAt: dto.createdAt ? new Date(dto.createdAt).getTime() : (dto.created_at ? new Date(dto.created_at).getTime() : Date.now()),
    sourceTaskId: dto.sourceTaskId || dto.source_task_id,
    sourceTaskTitle: dto.sourceTaskTitle || dto.source_task_title,
    sourceTaskSubject: dto.sourceTaskSubject || dto.source_task_subject
  };
}

export const apiService = {
  async login(email: string, password: string): Promise<UserProfile> {
    const response = await fetch(`${API_V1}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });
    const data = await handleJson<any>(response, 'login');
    const payload = data.data || data;
    setTokens(payload.accessToken, payload.refreshToken);

    const user = toUserProfile(payload.user || {});
    localStorage.setItem(CURRENT_USER_ID_KEY, user.id);

    const users = LocalDB.get<UserProfile[]>('users', []);
    LocalDB.set('users', [user, ...users.filter(u => u.id !== user.id)]);

    // Ensure user profile exists in backend
    try { await this.syncUser(user); } catch { /* ignore */ }
    return user;
  },

  async register(email: string, password: string): Promise<UserProfile> {
    const username = email;
    const nickname = email.split('@')[0];
    const response = await fetch(`${API_V1}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, nickname, grade: 'Grade 10' })
    });
    const data = await handleJson<any>(response, 'register');
    const payload = data.data || data;
    setTokens(payload.accessToken, payload.refreshToken);

    const user = toUserProfile(payload.user || { username, nickname, grade: 'Grade 10' });
    localStorage.setItem(CURRENT_USER_ID_KEY, user.id);

    const users = LocalDB.get<UserProfile[]>('users', []);
    LocalDB.set('users', [user, ...users.filter(u => u.id !== user.id)]);

    try { await this.syncUser(user); } catch { /* ignore */ }
    return user;
  },

  async fetchUsers(): Promise<UserProfile[]> {
    return LocalDB.get('users', []);
  },

  async getUser(id: string): Promise<UserProfile | null> {
    const users = LocalDB.get<UserProfile[]>('users', []);
    return users.find(u => u.id === id) || null;
  },

  async verifyCredentials(email: string, pass: string): Promise<UserProfile | null> {
    try {
      return await this.login(email, pass);
    } catch {
      return null;
    }
  },

  async syncUser(user: UserProfile): Promise<void> {
    const users = LocalDB.get<UserProfile[]>('users', []);
    LocalDB.set('users', [user, ...users.filter(u => u.id !== user.id)]);

    const response = await fetch(`${API_V1}/user_profiles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        grade: user.grade,
        school: user.school
      })
    });
    await handleJson<any>(response, 'syncUser');
  },

  async getTasks(userId: string): Promise<HomeworkTask[]> {
    const response = await fetch(`${API_V1}/homework_tasks?user_id=${encodeURIComponent(userId)}`, {
      headers: getAuthHeaders()
    });
    const data = await handleJson<any>(response, 'getTasks');
    const payload = data.data || data;
    const mapped = Array.isArray(payload) ? payload.map(toHomeworkTask) : [];
    LocalDB.set(`tasks_${userId}`, mapped);
    return mapped;
  },

  async upsertTask(userId: string, task: HomeworkTask): Promise<void> {
    const payload = {
      id: task.id,
      userId,
      title: task.title,
      subject: task.subject,
      category: task.category,
      status: task.status,
      content: task.content,
      deadline: task.deadline,
      source: task.source,
      submissionImage: task.submissionImage || null,
      result: task.result ? JSON.stringify(task.result) : null,
      timestamp: new Date(task.timestamp).toISOString()
    };

    const response = await fetch(`${API_V1}/homework_tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    await handleJson<any>(response, 'upsertTask');
  },

  async getPlan(userId: string, taskId?: string): Promise<LearningPlan | null> {
    if (taskId) {
      const response = await fetch(`${API_V1}/learning_plans?source_task_id=${encodeURIComponent(taskId)}`, {
        headers: getAuthHeaders()
      });
      const data = await handleJson<any>(response, 'getPlanByTask');
      const payload = data.data || data;
      return payload ? toLearningPlan(payload) : null;
    }

    const response = await fetch(`${API_V1}/learning_plans/user/${encodeURIComponent(userId)}`, {
      headers: getAuthHeaders()
    });
    const data = await handleJson<any>(response, 'getPlanByUser');
    const payload = data.data || data;
    if (!Array.isArray(payload) || payload.length === 0) return null;

    const sorted = [...payload].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.created_at).getTime();
      const bTime = new Date(b.createdAt || b.created_at).getTime();
      return bTime - aTime;
    });

    return toLearningPlan(sorted[0]);
  },

  async savePlan(userId: string, plan: LearningPlan): Promise<void> {
    const payload = {
      id: plan.id,
      userId,
      sourceTaskId: plan.sourceTaskId,
      focusArea: plan.focusArea,
      deepAnalysis: plan.deepAnalysis,
      tasks: JSON.stringify(plan.tasks || []),
      createdAt: new Date(plan.createdAt).toISOString(),
      sourceTaskTitle: plan.sourceTaskTitle,
      sourceTaskSubject: plan.sourceTaskSubject
    };

    const response = await fetch(`${API_V1}/learning_plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    await handleJson<any>(response, 'savePlan');
  },

  async getCloudSettings(userId: string): Promise<AppSettings | null> {
    const response = await fetch(`${API_V1}/app_settings?id=${encodeURIComponent(userId)}`, {
      headers: getAuthHeaders()
    });
    const data = await handleJson<any>(response, 'getCloudSettings');
    const payload = data.data || data;
    if (!payload || !payload.settings) return null;
    try { return JSON.parse(payload.settings); } catch { return null; }
  },

  async saveCloudSettings(userId: string, settings: AppSettings): Promise<void> {
    const response = await fetch(`${API_V1}/app_settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id: userId, settings: JSON.stringify(settings) })
    });
    await handleJson<any>(response, 'saveCloudSettings');
  },

  async extractHomeworkFromMessage(message: string, lang: 'en' | 'zh' = 'zh') {
    const body = new URLSearchParams({ message, lang });
    const response = await fetch(`${API_V1}/ai/extract-homework`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await handleJson<any>(response, 'extractHomeworkFromMessage');
    const payload = data.data || data;
    return typeof payload === 'string' ? JSON.parse(payload) : payload;
  },

  async extractHomeworkFromImage(imageBase64: string, lang: 'en' | 'zh' = 'zh') {
    const body = new URLSearchParams({ imageBuffer: imageBase64, lang });
    const response = await fetch(`${API_V1}/ai/extract-homework-image`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await handleJson<any>(response, 'extractHomeworkFromImage');
    const payload = data.data || data;
    return typeof payload === 'string' ? JSON.parse(payload) : payload;
  },

  async gradeSubmission(imageBase64: string, prompt: string, lang: 'en' | 'zh' = 'zh') {
    const body = new URLSearchParams({ imageBuffer: imageBase64, prompt, lang });
    const response = await fetch(`${API_V1}/ai/grade-submission`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await handleJson<any>(response, 'gradeSubmission');
    const payload = data.data || data;
    return typeof payload === 'string' ? JSON.parse(payload) : payload;
  },

  async generatePlan(weaknesses: string[], lang: 'en' | 'zh' = 'zh') {
    const body = new URLSearchParams();
    weaknesses.forEach(w => body.append('weaknesses', w));
    body.append('lang', lang);
    const response = await fetch(`${API_V1}/ai/generate-plan`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await handleJson<any>(response, 'generatePlan');
    const payload = data.data || data;
    return typeof payload === 'string' ? JSON.parse(payload) : payload;
  },

  async generateMilestoneAdvice(eventTitle: string, eventType: string, tasksSummary: string, lang: 'en' | 'zh' = 'zh') {
    const body = new URLSearchParams({ eventTitle, eventType, tasksSummary, lang });
    const response = await fetch(`${API_V1}/ai/milestone-advice`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await handleJson<any>(response, 'generateMilestoneAdvice');
    const payload = data.data || data;
    return typeof payload === 'string' ? payload : JSON.stringify(payload);
  }
};
