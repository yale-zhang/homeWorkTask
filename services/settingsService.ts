
import { AppSettings, EventType, EventNode, SchoolNode } from '../types';

const GLOBAL_SETTINGS_KEY = 'intellitask_app_settings';
const CURRENT_USER_ID_KEY = 'intellitask_current_uid';

const defaultSchools: SchoolNode[] = [
  { id: 'sch_default', name: '默认学校', order: 0 }
];

const defaultEventNodes: EventNode[] = [
  { id: 'node_hw', name: '课后作业', type: EventType.HOMEWORK, order: 0, schoolId: 'sch_default' },
  { id: 'node_quiz', name: '单周测试', type: EventType.WEEKLY_QUIZ, order: 1, schoolId: 'sch_default' },
  { id: 'node_monthly', name: '月度测试', type: EventType.MONTHLY_TEST, order: 2, schoolId: 'sch_default' },
  { id: 'node_mid', name: '期中考试', type: EventType.MIDTERM, order: 3, schoolId: 'sch_default' },
  { id: 'node_final', name: '期末考试', type: EventType.FINAL, order: 4, schoolId: 'sch_default' },
];

const defaultSettings: AppSettings = {
  schools: defaultSchools,
  eventNodes: defaultEventNodes
};

export const settingsService = {
  getSettings(): AppSettings {
    const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
    const key = userId ? `itask_settings_${userId}` : GLOBAL_SETTINGS_KEY;
    
    const saved = localStorage.getItem(key);
    if (!saved) return { ...defaultSettings };
    try {
      const parsed = JSON.parse(saved);
      return { 
        ...defaultSettings, 
        ...parsed,
        schools: parsed.schools || defaultSchools,
        eventNodes: parsed.eventNodes || defaultEventNodes
      };
    } catch {
      return { ...defaultSettings };
    }
  },

  saveSettings(settings: AppSettings, userId?: string | null): void {
    const targetUserId = userId || localStorage.getItem(CURRENT_USER_ID_KEY);
    const key = targetUserId ? `itask_settings_${targetUserId}` : GLOBAL_SETTINGS_KEY;
    
    localStorage.setItem(key, JSON.stringify(settings));
    
    window.dispatchEvent(new CustomEvent('app-settings-updated', { 
      detail: { settings, userId: targetUserId } 
    }));
  },

  reset(): void {
    const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
    const key = userId ? `itask_settings_${userId}` : GLOBAL_SETTINGS_KEY;
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent('app-settings-updated', { detail: defaultSettings }));
  }
};
