
import { AIProvider, AppSettings } from '../types';

const GLOBAL_SETTINGS_KEY = 'intellitask_app_settings';
const CURRENT_USER_ID_KEY = 'intellitask_current_uid';

// 辅助函数：清理环境变量中的冒号（解决 .env 格式问题）
const getEnv = (key: string) => {
  const val = process.env[key];
  if (!val) return '';
  return val.replace(/^[:\s]+/, '').trim();
};

const defaultSettings: AppSettings = {
  aiProvider: AIProvider.GEMINI,
  deepseekApiKey: '',
  deepseekBaseUrl: 'https://api.deepseek.com',
  deepseekModel: 'deepseek-chat',
  supabaseUrl: getEnv('SUPABASE_URL'),
  supabaseKey: getEnv('SUPABASE_KEY')
};

export const settingsService = {
  /**
   * 获取当前活跃用户的配置
   */
  getSettings(): AppSettings {
    const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
    const key = userId ? `itask_settings_${userId}` : GLOBAL_SETTINGS_KEY;
    
    const saved = localStorage.getItem(key);
    if (!saved) return { ...defaultSettings };
    try {
      const parsed = JSON.parse(saved);
      // 深度合并，确保即使本地保存了旧配置，新添加的字段也能有默认值
      return { 
        ...defaultSettings, 
        ...parsed,
        // 如果本地没存 URL/Key，则使用环境变量兜底
        supabaseUrl: parsed.supabaseUrl || defaultSettings.supabaseUrl,
        supabaseKey: parsed.supabaseKey || defaultSettings.supabaseKey
      };
    } catch {
      return { ...defaultSettings };
    }
  },

  /**
   * 为特定用户保存配置
   */
  saveSettings(settings: AppSettings, userId?: string | null): void {
    const targetUserId = userId || localStorage.getItem(CURRENT_USER_ID_KEY);
    const key = targetUserId ? `itask_settings_${targetUserId}` : GLOBAL_SETTINGS_KEY;
    
    localStorage.setItem(key, JSON.stringify(settings));
    
    console.log(`📡 Settings updated for ${targetUserId || 'global'}`);
    
    window.dispatchEvent(new CustomEvent('app-settings-updated', { 
      detail: { settings, userId: targetUserId } 
    }));
  },

  /**
   * 彻底重置当前用户的配置
   */
  reset(): void {
    const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
    const key = userId ? `itask_settings_${userId}` : GLOBAL_SETTINGS_KEY;
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent('app-settings-updated', { detail: defaultSettings }));
  }
};
