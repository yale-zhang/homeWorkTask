
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'zh';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: Translations = {
  // Navigation
  nav_dashboard: { en: 'Dashboard', zh: '仪表盘' },
  nav_inbox: { en: 'Assignments', zh: '作业采集' },
  nav_scanner: { en: 'AI Scanner', zh: 'AI 批改' },
  nav_learning: { en: 'Learning Hub', zh: '学习中心' },
  nav_reports: { en: 'Reports', zh: '学情报告' },
  workspace: { en: 'Workspace', zh: '工作空间' },
  
  // Auth
  login_welcome: { en: 'Welcome to IntelliTask', zh: '欢迎使用 IntelliTask' },
  login_desc: { en: 'Sign in with WeChat to sync your learning data across devices.', zh: '使用微信登录以同步您的多端学习数据。' },
  wechat_login: { en: 'WeChat Login', zh: '微信授权登录' },
  switch_account: { en: 'Switch Account', zh: '切换账号' },
  logout: { en: 'Logout', zh: '退出登录' },
  auth_loading: { en: 'Authorizing...', zh: '正在授权...' },
  account_center: { en: 'Account Center', zh: '账号中心' },
  
  // Dashboard
  welcome: { en: 'Welcome back, {name}!', zh: '欢迎回来，{name}！' },
  pending_desc: { en: 'You have {count} assignments to complete this week.', zh: '你本周有 {count} 项作业待完成。' },
  stat_pending: { en: 'Pending Tasks', zh: '待处理任务' },
  stat_completed: { en: 'Completed', zh: '已完成' },
  stat_avg_score: { en: 'Avg Score', zh: '平均分' },
  stat_gaps: { en: 'Knowledge Gaps', zh: '知识薄弱点' },
  recent_assignments: { en: 'Recent Assignments', zh: '最近作业' },
  all_subjects: { en: 'All Subjects', zh: '全部科目' },
  all_categories: { en: 'All Categories', zh: '全部类型' },
  clear_filters: { en: 'Clear', zh: '清除' },
  no_tasks: { en: 'No assignments match your filters.', zh: '没有匹配筛选条件的作业。' },
  
  // Inbox
  inbox_title: { en: 'Assignment Inbox', zh: '作业采集箱' },
  inbox_desc: { en: 'Monitoring school group messages for upcoming homework.', zh: '实时监控学校群聊，提取最新作业。' },
  add_manual: { en: 'Add Manual', zh: '手动录入' },
  active_monitoring: { en: 'Active Monitoring', zh: '监控运行中' },
  ai_extract: { en: 'AI Extract', zh: 'AI 提取' },
  create_new: { en: 'Create New Assignment', zh: '创建新作业' },
  subject: { en: 'Subject', zh: '科目' },
  category: { en: 'Category', zh: '类型' },
  due_date: { en: 'Due Date', zh: '截止日期' },
  details: { en: 'Details', zh: '详情描述' },
  cancel: { en: 'Cancel', zh: '取消' },
  add_btn: { en: 'Add Assignment', zh: '添加作业' },
  upload_photo: { en: 'Upload Photo', zh: '上传照片' },
  
  // Scanner
  scanner_title: { en: 'AI Homework Scanner', zh: 'AI 作业扫描仪' },
  scanner_desc: { en: 'Submit your completed work for instant grading and gap analysis.', zh: '上传已完成的作业，获取即时批改与薄弱点分析。' },
  select_task: { en: 'Select an Assignment to Grade', zh: '选择要批改的作业' },
  grading_analysis: { en: 'Grading Analysis', zh: '批改分析报告' },
  final_score: { en: 'Final Score', zh: '最终得分' },
  strengths: { en: 'Key Strengths', zh: '核心优势' },
  weaknesses: { en: 'Areas to Improve', zh: '待改进领域' },
  transcript: { en: 'Handwriting Transcript', zh: '手写内容转录' },
  breakdown: { en: 'Knowledge Point Breakdown', zh: '知识点掌握分布' },
  view_plan: { en: 'View Learning Plan', zh: '查看学习计划' },
  
  // Learning Hub
  roadmap: { en: 'Personalized AI Roadmap', zh: '个性化 AI 学习路径' },
  plan_title: { en: 'Adaptive Learning Plan', zh: '自适应学习计划' },
  focus_areas: { en: 'Focus Areas', zh: '重点关注' },
  plan_progress: { en: 'Plan Progress', zh: '计划进度' },
  notif_plan_ready: { en: 'Success! Your custom learning plan for {focus} is ready.', zh: '成功！为您定制的针对 {focus} 的学习计划已就绪。' },
  notif_title: { en: 'Notifications', zh: '通知中心' },
  notif_empty: { en: 'No new notifications', zh: '暂无新通知' },
  
  // Reports
  reports_title: { en: 'Weekly Performance', zh: '周度学情报告' },
  reports_desc: { en: 'Aggregated data from your AI-graded assignments', zh: '基于 AI 批改结果的学情汇总' },
  export_pdf: { en: 'Export PDF', zh: '导出 PDF' },
  proficiency_map: { en: 'Subject Proficiency Map', zh: '科目能力图谱' },
  critical_gaps: { en: 'Critical Knowledge Gaps', zh: '核心知识漏洞' },
  recommendation: { en: 'Strategic Recommendation', zh: '学习策略建议' },

  Mathematics: { en: 'Mathematics', zh: '数学' },
  Science: { en: 'Science', zh: '科学' },
  English: { en: 'English', zh: '英语' },
  History: { en: 'History', zh: '历史' },
  Chinese: { en: 'Chinese', zh: '语文' },
  'Major Grade': { en: 'Major Grade', zh: '重要考试' },
  Quiz: { en: 'Quiz', zh: '小测验' },
  Homework: { en: 'Homework', zh: '普通作业' },
  'Daily Practice': { en: 'Daily Practice', zh: '日常练习' }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('itask_lang') as Language) || 'zh';
  });

  useEffect(() => {
    localStorage.setItem('itask_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>) => {
    let text = translations[key]?.[language] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v.toString());
      });
    }
    return text;
  };

  return React.createElement(
    LanguageContext.Provider,
    { value: { language, setLanguage, t } },
    children
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within a LanguageProvider');
  return context;
};
