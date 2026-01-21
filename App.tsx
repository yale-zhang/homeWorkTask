
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, ScanLine, BookOpen, BarChart3, Bell, User, MessageSquare, Languages, X, CheckCircle, LogOut, RefreshCcw, QrCode, Loader2, ChevronRight, AlertCircle, Cloud, CloudOff, Github, Settings, Database, Cpu, Save, RotateCw, Key, UserPlus, History, Mail, Lock, Eye, EyeOff, Square, CheckSquare } from 'lucide-react';
import Dashboard from './components/Dashboard';
import HomeworkInbox from './components/HomeworkInbox';
import Scanner from './components/Scanner';
import LearningHub from './components/LearningHub';
import Reports from './components/Reports';
import { HomeworkTask, LearningPlan, UserProfile, AIProvider, AppSettings } from './types';
import { LanguageProvider, useTranslation } from './i18n';
import { apiService } from './services/apiService';
import { geminiService } from './services/geminiService';
import { settingsService } from './services/settingsService';

const CURRENT_USER_ID_KEY = 'intellitask_current_uid';
const REMEMBERED_EMAIL_KEY = 'itask_remembered_email';
const REMEMBERED_PASSWORD_KEY = 'itask_remembered_password';

const SidebarItem: React.FC<{ icon: any; label: string; path: string; active: boolean }> = ({ icon: Icon, label, path, active }) => (
  <Link
    to={path}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const SettingsModal: React.FC<{ user: UserProfile, onClose: () => void, onSaved: (msg: string) => void }> = ({ user, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(settingsService.getSettings());
  const [activeTab, setActiveTab] = useState<'ai' | 'supabase'>('ai');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      settingsService.saveSettings(settings, user.id);
      try {
        await apiService.syncUser(user);
      } catch (e) {
        console.warn("Could not sync user profile to cloud yet");
      }
      await apiService.saveCloudSettings(user.id, settings);
      onSaved(t('settings_saved'));
      onClose();
    } catch (err) {
      console.error("Failed to sync settings", err);
      onSaved(t('settings_saved') + " (Local)");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    settingsService.reset();
    setSettings(settingsService.getSettings());
    onSaved(t('reset_settings'));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="" />
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('settings')}</h3>
              <p className="text-slate-500 text-xs">Configuring for <span className="text-indigo-600 font-bold">{user.nickname}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
        </div>
        
        <div className="flex border-b border-slate-100">
          <button onClick={() => setActiveTab('ai')} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'ai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}><Cpu size={18} /> {t('ai_config')}</button>
          <button onClick={() => setActiveTab('supabase')} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'supabase' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}><Database size={18} /> {t('supabase_config')}</button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">{t('ai_provider')}</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setSettings({...settings, aiProvider: AIProvider.GEMINI})} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${settings.aiProvider === AIProvider.GEMINI ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100'}`}><div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">G</div><span className="font-bold text-sm">Gemini</span></button>
                  <button onClick={() => setSettings({...settings, aiProvider: AIProvider.DEEPSEEK})} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${settings.aiProvider === AIProvider.DEEPSEEK ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100'}`}><div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">D</div><span className="font-bold text-sm">DeepSeek</span></button>
                </div>
              </div>

              {settings.aiProvider === AIProvider.DEEPSEEK && (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('deepseek_key')}</label>
                    <input type="password" value={settings.deepseekApiKey} onChange={e => setSettings({...settings, deepseekApiKey: e.target.value})} placeholder="sk-..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('deepseek_url')}</label>
                    <input type="text" value={settings.deepseekBaseUrl} onChange={e => setSettings({...settings, deepseekBaseUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('deepseek_model')}</label>
                    <input type="text" value={settings.deepseekModel} onChange={e => setSettings({...settings, deepseekModel: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'supabase' && (
            <div className="space-y-6">
              <div className="space-y-2"><label className="text-xs font-bold text-slate-500">{t('sb_url')}</label><input type="text" value={settings.supabaseUrl} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" /></div>
              <div className="space-y-2"><label className="text-xs font-bold text-slate-500">{t('sb_key')}</label><input type="password" value={settings.supabaseKey} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" /></div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 flex gap-4">
          <button onClick={handleReset} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-100"><RotateCw size={18} /></button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-70">{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}{t('save_settings')}</button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState<'traditional' | 'wechat' | 'github' | null>(null);
  const [showAccountCenter, setShowAccountCenter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loginView, setLoginView] = useState<'signin' | 'signup' | 'select'>('signin');
  
  // Traditional login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [tasks, setTasks] = useState<HomeworkTask[]>([]);
  const [currentPlan, setCurrentPlan] = useState<LearningPlan | null>(null);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const addNotification = useCallback((message: string) => {
    setActiveToast(message);
    setTimeout(() => setActiveToast(null), 5000);
  }, []);

  const refreshUsers = useCallback(async () => {
    setIsSyncing(true);
    try {
      const users = await apiService.fetchUsers();
      setAvailableUsers(users);
      return users;
    } catch (err) {
      console.error("Refresh users failed", err);
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const users = await refreshUsers();
      const savedUid = localStorage.getItem(CURRENT_USER_ID_KEY);
      
      // Load remembered credentials
      const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      const rememberedPassword = localStorage.getItem(REMEMBERED_PASSWORD_KEY);
      if (rememberedEmail) setEmail(rememberedEmail);
      if (rememberedPassword) setPassword(rememberedPassword);
      if (rememberedEmail || rememberedPassword) setRememberMe(true);

      if (savedUid) {
        const user = users.find(u => u.id === savedUid);
        if (user) {
          setCurrentUser(user);
          return;
        }
      }
      
      if (users.length > 0) {
        setLoginView('select');
      } else {
        setLoginView('signin');
      }
    };
    init();
  }, [refreshUsers]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        setTasks([]);
        setCurrentPlan(null);
        return;
      }
      
      setIsSyncing(true);
      setTasks([]);
      setCurrentPlan(null);
      localStorage.setItem(CURRENT_USER_ID_KEY, currentUser.id);
      
      try {
        const cloudSettings = await apiService.getCloudSettings(currentUser.id);
        if (cloudSettings) {
          settingsService.saveSettings(cloudSettings, currentUser.id);
        }

        const [userTasks, userPlan] = await Promise.all([
          apiService.getTasks(currentUser.id),
          apiService.getPlan(currentUser.id)
        ]);
        
        setTasks(userTasks || []);
        setCurrentPlan(userPlan || null);
        setIsCloudConnected(true);
      } catch (err) {
        console.error("Failed to load account data:", err);
        setIsCloudConnected(false);
        const localTasks = await apiService.getTasks(currentUser.id);
        const localPlan = await apiService.getPlan(currentUser.id);
        setTasks(localTasks || []);
        setCurrentPlan(localPlan || null);
      } finally {
        setIsSyncing(false);
      }
    };
    loadUserData();
  }, [currentUser?.id]);

  /**
   * Handle learning plan updates and persistence
   */
  const onUpdatePlan = useCallback(async (plan: LearningPlan | null) => {
    if (!currentUser) return;
    setCurrentPlan(plan);
    if (plan) {
      try {
        await apiService.savePlan(currentUser.id, plan);
      } catch (e) {
        console.error("Failed to save learning plan:", e);
      }
    }
  }, [currentUser]);

  /**
   * AI Processing Pipeline with Synchronization Mechanism
   * This handles concurrent grading and plan generation for multiple tasks.
   */
  const processTaskWithAI = useCallback(async (taskId: string) => {
    if (!currentUser) return;
    
    // 1. Update task state to 'processing'
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'processing' } : t));

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.submissionImage) {
        throw new Error("Task missing required data for AI processing");
      }

      const imgData = task.submissionImage.includes(',') ? task.submissionImage.split(',')[1] : task.submissionImage;
      
      // 2. AI Grading
      const result = await geminiService.gradeSubmission(imgData, task.content, language);
      
      // 3. Update task with result and 'graded' status
      const updatedTask: HomeworkTask = { ...task, status: 'graded', result, isGeneratingPlan: true };
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      await apiService.upsertTask(currentUser.id, updatedTask);

      // 4. Trigger Learning Plan Generation (Synchronized chain)
      const planRes = await geminiService.generatePlan(result.weaknesses || ['General Review'], language);
      const newPlan: LearningPlan = {
        id: Math.random().toString(36).substr(2, 9),
        focusArea: planRes.focusArea,
        deepAnalysis: planRes.deepAnalysis,
        tasks: planRes.tasks,
        createdAt: Date.now(),
        sourceTaskId: taskId,
        sourceTaskTitle: task.title,
        sourceTaskSubject: task.subject
      };

      await apiService.savePlan(currentUser.id, newPlan);
      
      // 5. Final state update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isGeneratingPlan: false } : t));
      
      // If the current viewed plan is this one, update the hub
      if (!currentPlan || currentPlan.sourceTaskId === taskId) {
        setCurrentPlan(newPlan);
      }
      
      addNotification(t('notif_plan_ready', { focus: planRes.focusArea }));
    } catch (error) {
      console.error(`AI pipeline failed for task ${taskId}:`, error);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending', isGeneratingPlan: false } : t));
    }
  }, [currentUser, tasks, language, currentPlan, addNotification, t]);

  const handleBatchGrade = async (taskIds: string[]) => {
    // Process multiple tasks concurrently
    await Promise.all(taskIds.map(id => processTaskWithAI(id)));
  };

  const handleAccountSwitch = (user: UserProfile) => {
    localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
    setCurrentUser(user);
    setShowAccountCenter(false);
    addNotification(t('login_success'));
  };

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    if (rememberMe) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      localStorage.setItem(REMEMBERED_PASSWORD_KEY, password);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
    }

    setIsLoggingIn('traditional');
    try {
      if (loginView === 'signin') {
        const user = await apiService.verifyCredentials(email, password);
        if (user) {
          handleAccountSwitch(user);
        } else {
          addNotification(t('invalid_creds'));
        }
      } else {
        const targetUid = `email_${email}`;
        const existingUser = await apiService.getUser(targetUid);
        if (existingUser) {
           addNotification(t('email_exists'));
           setLoginView('signin');
           return;
        }

        const newUser: UserProfile = {
          id: targetUid,
          nickname: email.split('@')[0],
          avatar: `https://ui-avatars.com/api/?name=${email}&background=6366f1&color=fff`,
          grade: language === 'zh' ? '10年级' : 'Grade 10',
          password: password
        };
        await apiService.syncUser(newUser);
        await refreshUsers();
        addNotification(t('signup_success'));
        handleAccountSwitch(newUser);
      }
    } catch (err) {
      console.error("Auth process failed:", err);
      addNotification(language === 'zh' ? '认证服务异常' : 'Auth service error');
    } finally {
      setIsLoggingIn(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
    setCurrentUser(null);
    setLoginView('signin');
    setShowAccountCenter(false);
  };

  const openAccountCenter = async () => {
    setShowAccountCenter(true);
    await refreshUsers();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 relative z-10 border border-white/20">
          <div className="flex flex-col items-center">
            <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl mb-6"><BookOpen size={40} /></div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">
              {loginView === 'signin' ? t('login_welcome') : loginView === 'signup' ? t('login_signup_btn') : (language === 'zh' ? '欢迎回来' : 'Welcome Back')}
            </h1>
            <p className="text-slate-500 text-sm mb-8 text-center">
              {loginView === 'select' ? (language === 'zh' ? '请选择一个已有的账号并验证密码' : 'Please select an account and verify password') : t('login_desc')}
            </p>
            {loginView === 'select' ? (
              <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {availableUsers.map(user => (
                    <button key={user.id} onClick={() => {
                        if (user.id.startsWith('email_')) {
                          setEmail(user.id.replace('email_', ''));
                          setPassword('');
                          setLoginView('signin');
                        } else {
                          handleAccountSwitch(user);
                        }
                      }} className="w-full p-4 rounded-2xl flex items-center gap-4 bg-slate-50 border border-transparent hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group">
                      <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate group-hover:text-indigo-600">{user.nickname}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{user.grade}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1" />
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Verify</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <button onClick={() => setLoginView('signin')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    <UserPlus size={18} /> {language === 'zh' ? '使用其他账号登录' : 'Other Account'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleTraditionalLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t('login_email')}</label>
                    <div className="relative">
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pl-11 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t('login_password')}</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pl-11 pr-11 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group">
                      {rememberMe ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-slate-300 group-hover:text-indigo-300" />}
                      <span className="text-xs font-bold">{t('login_remember_me')}</span>
                    </button>
                  </div>
                  <button type="submit" disabled={!!isLoggingIn} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 disabled:opacity-70 transition-all flex items-center justify-center gap-2">
                    {isLoggingIn === 'traditional' ? <Loader2 className="animate-spin" size={20} /> : null}
                    {loginView === 'signin' ? t('login_signin_btn') : t('login_signup_btn')}
                  </button>
                </form>
                <div className="text-center">
                   <p className="text-sm text-slate-500">
                     {loginView === 'signin' ? t('login_no_account') : t('login_has_account')}{' '}
                     <button onClick={() => setLoginView(loginView === 'signin' ? 'signup' : 'signin')} className="text-indigo-600 font-bold hover:underline">
                       {loginView === 'signin' ? t('login_signup_btn') : t('login_signin_btn')}
                     </button>
                   </p>
                </div>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-slate-300 uppercase tracking-widest">{t('login_other_methods')}</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={async () => {
                      setIsLoggingIn('wechat');
                      const mockOpenId = `wx_${Math.floor(Math.random() * 9000) + 1000}`;
                      const newUser: UserProfile = { id: mockOpenId, nickname: 'WX_User_' + mockOpenId.split('_')[1], avatar: `https://picsum.photos/seed/${mockOpenId}/100/100`, grade: language === 'zh' ? '10年级' : 'Grade 10' };
                      try { await apiService.syncUser(newUser); await refreshUsers(); } catch(e) {}
                      handleAccountSwitch(newUser);
                      setIsLoggingIn(null);
                    }} disabled={!!isLoggingIn} className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-3 px-4 rounded-2xl font-bold text-sm border border-emerald-100 hover:bg-emerald-100 transition-all">
                    {isLoggingIn === 'wechat' ? <Loader2 className="animate-spin" size={16} /> : <QrCode size={18} />}
                    {t('wechat_login')}
                  </button>
                  <button onClick={async () => {
                      setIsLoggingIn('github');
                      const mockGhId = `gh_${Math.floor(Math.random() * 9000) + 1000}`;
                      const newUser: UserProfile = { id: mockGhId, nickname: 'GH_User_' + mockGhId.split('_')[1], avatar: `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 100000)}?v=4`, grade: language === 'zh' ? '12年级' : 'Grade 12' };
                      try { await apiService.syncUser(newUser); await refreshUsers(); } catch(e) {}
                      handleAccountSwitch(newUser);
                      setIsLoggingIn(null);
                    }} disabled={!!isLoggingIn} className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 px-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all">
                    {isLoggingIn === 'github' ? <Loader2 className="animate-spin" size={16} /> : <Github size={18} />}
                    {t('github_login')}
                  </button>
                </div>
                {availableUsers.length > 0 && (
                  <button onClick={() => setLoginView('select')} className="w-full py-2 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 hover:text-slate-600 transition-colors">
                    <History size={14} /> {language === 'zh' ? '返回账号列表' : 'Return to List'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {showAccountCenter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-sm shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{t('account_center')}</h3>
                {isSyncing && <Loader2 className="animate-spin text-indigo-400" size={16} />}
              </div>
              <button onClick={() => setShowAccountCenter(false)} className="text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {availableUsers.map(user => (
                <button key={user.id} onClick={() => handleAccountSwitch(user)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${currentUser.id === user.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent hover:border-slate-100'}`}>
                  <img src={user.avatar} className="w-12 h-12 rounded-full border border-white" alt="" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{user.nickname}</p>
                    <p className="text-xs text-slate-500">{user.grade}</p>
                  </div>
                  {currentUser.id === user.id && <CheckCircle className="text-indigo-600" size={16} />}
                </button>
              ))}
            </div>
            <div className="p-6 bg-slate-50 flex flex-col gap-3">
               <button onClick={handleLogout} className="w-full py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
                <LogOut size={18} /> {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && <SettingsModal user={currentUser} onClose={() => setShowSettings(false)} onSaved={addNotification} />}

      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><BookOpen size={24} /></div>
          <h1 className="text-xl font-bold text-slate-800 italic">IntelliTask</h1>
        </div>
        <nav className="flex-1 space-y-2"><NavLinks /></nav>
        <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-all group"><Settings size={20} className="group-hover:rotate-45" /><span className="font-medium">{t('settings')}</span></button>
          <button onClick={openAccountCenter} className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-100 transition-all group border border-transparent hover:border-slate-100">
            <div className="relative">
              <img src={currentUser.avatar} className="w-10 h-10 rounded-full border border-white" alt="" />
              <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${isCloudConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-slate-800 truncate">{currentUser.nickname}</p>
              <div className="flex items-center gap-1">
                 {isSyncing ? <Loader2 size={8} className="animate-spin text-slate-400" /> : <Cloud size={8} className={isCloudConnected ? 'text-emerald-500' : 'text-slate-400'} />}
                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">{isCloudConnected ? 'Cloud Sync On' : 'Sync Offline'}</p>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-slate-800">{t('workspace')}</h2><span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{currentUser.id.slice(0, 6)}</span></div>
          <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-xs">{language === 'en' ? '中文' : 'EN'}</button>
        </header>
        <div className="flex-1 p-8 overflow-y-auto" key={currentUser.id}>
          <Routes>
            <Route path="/" element={<Dashboard user={currentUser} tasks={tasks} />} />
            <Route path="/inbox" element={<HomeworkInbox onNewTask={async (t) => {
              setTasks(prev => [t, ...prev]);
              await apiService.upsertTask(currentUser.id, t);
              addNotification(language === 'zh' ? '作业已入库' : 'Assignment Added');
            }} />} />
            <Route path="/scanner/:taskId?" element={<Scanner tasks={tasks} onGradeTask={processTaskWithAI} onBatchGrade={handleBatchGrade} />} />
            <Route path="/learning" element={<LearningHub tasks={tasks} savedPlan={currentPlan} onUpdatePlan={onUpdatePlan} onAddNotification={addNotification} />} />
            <Route path="/reports" element={<Reports tasks={tasks} />} />
          </Routes>
        </div>
      </main>
      {activeToast && <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-4 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-xl border border-white/10"><CheckCircle className="text-emerald-400" size={20} /><p className="text-sm font-bold">{activeToast}</p></div>}
    </div>
  );
};

const NavLinks = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const links = [
    { icon: LayoutDashboard, label: t('nav_dashboard'), path: '/' },
    { icon: Inbox, label: t('nav_inbox'), path: '/inbox' },
    { icon: ScanLine, label: t('nav_scanner'), path: '/scanner' },
    { icon: MessageSquare, label: t('nav_learning'), path: '/learning' },
    { icon: BarChart3, label: t('nav_reports'), path: '/reports' },
  ];
  return <>{links.map(link => <SidebarItem key={link.path} icon={link.icon} label={link.label} path={link.path} active={location.pathname === link.path} />)}</>;
}

const App: React.FC = () => (
  <LanguageProvider>
    <HashRouter>
      <AppContent />
    </HashRouter>
  </LanguageProvider>
);

export default App;
