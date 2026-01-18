
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, ScanLine, BookOpen, BarChart3, Bell, User, MessageSquare, Languages, X, CheckCircle, LogOut, RefreshCcw, QrCode, Loader2, ChevronRight, AlertCircle, Cloud, CloudOff, Github, Settings, Database, Cpu, Save, RotateCw, Key, UserPlus, History } from 'lucide-react';
import Dashboard from './components/Dashboard';
import HomeworkInbox from './components/HomeworkInbox';
import Scanner from './components/Scanner';
import LearningHub from './components/LearningHub';
import Reports from './components/Reports';
import { HomeworkTask, LearningPlan, UserProfile, AIProvider, AppSettings } from './types';
import { LanguageProvider, useTranslation } from './i18n';
import { apiService } from './services/apiService';
import { settingsService } from './services/settingsService';

const CURRENT_USER_ID_KEY = 'intellitask_current_uid';

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

              {settings.aiProvider === AIProvider.GEMINI && (
                <div className="space-y-2 pt-4 border-t border-slate-100 animate-in fade-in">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-2"><Key size={14} /> Gemini API Key (Optional Override)</label>
                  <input type="password" value={settings.geminiApiKey || ''} onChange={e => setSettings({...settings, geminiApiKey: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="AIzaSy..." />
                </div>
              )}

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
  const [isLoggingIn, setIsLoggingIn] = useState<'wechat' | 'github' | null>(null);
  const [showAccountCenter, setShowAccountCenter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loginView, setLoginView] = useState<'select' | 'new'>('select');

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
      
      if (users.length > 0) {
        setLoginView('select');
        if (savedUid) {
          const user = users.find(u => u.id === savedUid);
          if (user) setCurrentUser(user);
        }
      } else {
        setLoginView('new');
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
      // 清理当前状态，防止旧账号数据闪现
      setTasks([]);
      setCurrentPlan(null);

      // 1. 更新本地 UID 保证 settingsService 能立即感知
      localStorage.setItem(CURRENT_USER_ID_KEY, currentUser.id);
      
      try {
        // 2. 加载云端设置
        const cloudSettings = await apiService.getCloudSettings(currentUser.id);
        if (cloudSettings) {
          settingsService.saveSettings(cloudSettings, currentUser.id);
        }

        // 3. 并行获取该账号下的任务和计划
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
        // 回退到本地缓存
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

  const handleAccountSwitch = (user: UserProfile) => {
    localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
    setCurrentUser(user);
    setShowAccountCenter(false);
    addNotification(language === 'zh' ? `已切换到 ${user.nickname}` : `Switched to ${user.nickname}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowAccountCenter(false);
    localStorage.removeItem(CURRENT_USER_ID_KEY);
    window.location.reload();
  };

  const openAccountCenter = async () => {
    setShowAccountCenter(true);
    await refreshUsers();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 relative z-10 border border-white/20">
          <div className="flex flex-col items-center text-center">
            <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl mb-6"><BookOpen size={40} /></div>
            
            <h1 className="text-2xl font-black text-slate-900 mb-2">
              {loginView === 'select' ? (language === 'zh' ? '欢迎回来' : 'Welcome Back') : t('login_welcome')}
            </h1>
            <p className="text-slate-500 text-sm mb-8">
              {loginView === 'select' ? (language === 'zh' ? '请选择一个已有的账号继续学习' : 'Please select an account to continue') : t('login_desc')}
            </p>

            {isSyncing && availableUsers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Searching Profiles...</p>
              </div>
            ) : loginView === 'select' && availableUsers.length > 0 ? (
              <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {availableUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleAccountSwitch(user)}
                      className="w-full p-4 rounded-2xl flex items-center gap-4 bg-slate-50 border border-transparent hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                    >
                      <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate group-hover:text-indigo-600">{user.nickname}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{user.grade}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button onClick={() => setLoginView('new')} className="w-full py-4 text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 rounded-2xl transition-all">
                    <UserPlus size={18} /> {language === 'zh' ? '使用新账号登录' : 'New Login'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                  onClick={async () => {
                    setIsLoggingIn('wechat');
                    const mockOpenId = `wx_${Math.floor(Math.random() * 9000) + 1000}`;
                    const newUser: UserProfile = { id: mockOpenId, nickname: 'Student ' + mockOpenId.split('_')[1], avatar: `https://picsum.photos/seed/${mockOpenId}/100/100`, grade: language === 'zh' ? '10年级' : 'Grade 10' };
                    try { await apiService.syncUser(newUser); await refreshUsers(); } catch(e) {}
                    handleAccountSwitch(newUser);
                    setIsLoggingIn(null);
                  }}
                  disabled={!!isLoggingIn}
                  className="w-full bg-[#07C160] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 shadow-lg"
                >
                  {isLoggingIn === 'wechat' ? <Loader2 className="animate-spin" size={24} /> : <RefreshCcw size={22} />}
                  <span className="text-lg">{isLoggingIn === 'wechat' ? t('auth_loading') : t('wechat_login')}</span>
                </button>

                <button 
                  onClick={async () => {
                    setIsLoggingIn('github');
                    const mockGhId = `gh_${Math.floor(Math.random() * 9000) + 1000}`;
                    const newUser: UserProfile = { id: mockGhId, nickname: 'GH_User_' + mockGhId.split('_')[1], avatar: `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 100000)}?v=4`, grade: language === 'zh' ? '12年级' : 'Grade 12' };
                    try { await apiService.syncUser(newUser); await refreshUsers(); } catch(e) {}
                    handleAccountSwitch(newUser);
                    setIsLoggingIn(null);
                  }}
                  disabled={!!isLoggingIn}
                  className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 shadow-lg"
                >
                  {isLoggingIn === 'github' ? <Loader2 className="animate-spin" size={24} /> : <Github size={22} />}
                  <span className="text-lg">{isLoggingIn === 'github' ? t('auth_loading') : t('github_login')}</span>
                </button>

                {availableUsers.length > 0 && (
                  <button onClick={() => setLoginView('select')} className="w-full py-3 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 hover:text-slate-800 transition-colors">
                    <History size={16} /> {language === 'zh' ? '返回历史账号' : 'Existing Accounts'}
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
                <button
                  key={user.id}
                  onClick={() => handleAccountSwitch(user)}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                    currentUser.id === user.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent hover:border-slate-100'
                  }`}
                >
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
        {/* 重要：添加 key={currentUser.id} 强制在账号切换时重置所有子组件状态 */}
        <div className="flex-1 p-8 overflow-y-auto" key={currentUser.id}>
          <Routes>
            <Route path="/" element={<Dashboard user={currentUser} tasks={tasks} />} />
            <Route path="/inbox" element={<HomeworkInbox onNewTask={async (t) => {
              setTasks(prev => [t, ...prev]);
              await apiService.upsertTask(currentUser.id, t);
              addNotification(language === 'zh' ? '作业已入库' : 'Assignment Added');
            }} />} />
            <Route path="/scanner" element={<Scanner tasks={tasks} onUpdateTask={async (t) => {
              setTasks(prev => prev.map(old => old.id === t.id ? t : old));
              await apiService.upsertTask(currentUser.id, t);
            }} />} />
            <Route path="/learning" element={<LearningHub tasks={tasks} savedPlan={currentPlan} onUpdatePlan={async (p) => {
              setCurrentPlan(p);
              if (p) await apiService.savePlan(currentUser.id, p);
            }} onAddNotification={addNotification} />} />
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
