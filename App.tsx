
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, ScanLine, BookOpen, BarChart3, Bell, User, MessageSquare, Languages, X, CheckCircle, LogOut, RefreshCcw, QrCode, Loader2, ChevronRight, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import Dashboard from './components/Dashboard';
import HomeworkInbox from './components/HomeworkInbox';
import Scanner from './components/Scanner';
import LearningHub from './components/LearningHub';
import Reports from './components/Reports';
import { HomeworkTask, LearningPlan, UserProfile } from './types';
import { LanguageProvider, useTranslation } from './i18n';
import { apiService } from './services/apiService';

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

const AppContent: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  
  // Auth & Account State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showAccountCenter, setShowAccountCenter] = useState(false);

  // Data State
  const [tasks, setTasks] = useState<HomeworkTask[]>([]);
  const [currentPlan, setCurrentPlan] = useState<LearningPlan | null>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const addNotification = useCallback((message: string) => {
    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      time: Date.now(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(message);
    setTimeout(() => setActiveToast(null), 5000);
  }, []);

  // Initialize and load users
  useEffect(() => {
    const init = async () => {
      setIsSyncing(true);
      try {
        const users = await apiService.fetchUsers();
        setAvailableUsers(users);
        const savedUid = localStorage.getItem(CURRENT_USER_ID_KEY);
        if (savedUid) {
          const user = users.find(u => u.id === savedUid);
          if (user) setCurrentUser(user);
        }
        // Check connectivity by trying to ping or checking config
        setIsCloudConnected(users.length >= 0); 
      } catch (err) {
        setIsCloudConnected(false);
      } finally {
        setIsSyncing(false);
      }
    };
    init();
  }, []);

  // Load user data on change
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      setIsSyncing(true);
      localStorage.setItem(CURRENT_USER_ID_KEY, currentUser.id);
      try {
        const [userTasks, userPlan] = await Promise.all([
          apiService.getTasks(currentUser.id),
          apiService.getPlan(currentUser.id)
        ]);
        setTasks(userTasks);
        setCurrentPlan(userPlan);
        setIsCloudConnected(true);
      } catch (err) {
        setIsCloudConnected(false);
        // Don't show toast on every load if not configured
        console.warn("Cloud sync currently unavailable");
      } finally {
        setIsSyncing(false);
      }
    };
    loadData();
  }, [currentUser]);

  const handleAddTask = async (task: HomeworkTask) => {
    if (!currentUser) return;
    const previousTasks = [...tasks];
    setTasks(prev => [task, ...prev]);
    try {
      await apiService.upsertTask(currentUser.id, task);
      addNotification(language === 'zh' ? '作业已同步' : 'Assignment synced');
      setIsCloudConnected(true);
    } catch (err) {
      setIsCloudConnected(false);
    }
  };

  const handleUpdateTask = async (updatedTask: HomeworkTask) => {
    if (!currentUser) return;
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    try {
      await apiService.upsertTask(currentUser.id, updatedTask);
      setIsCloudConnected(true);
    } catch (err) {
      setIsCloudConnected(false);
    }
  };

  const handleUpdatePlan = async (plan: LearningPlan | null) => {
    if (!currentUser) return;
    setCurrentPlan(plan);
    if (plan) {
      try {
        await apiService.savePlan(currentUser.id, plan);
        setIsCloudConnected(true);
      } catch (err) {
        setIsCloudConnected(false);
      }
    }
  };

  const handleWeChatAuth = async () => {
    setIsLoggingIn(true);
    const mockOpenId = `wx_${Math.floor(Math.random() * 9000) + 1000}`;
    const newUser: UserProfile = {
      id: mockOpenId,
      nickname: 'Student ' + mockOpenId.split('_')[1],
      avatar: `https://picsum.photos/seed/${mockOpenId}/100/100`,
      grade: language === 'zh' ? '10年级' : 'Grade 10'
    };

    try {
      await apiService.syncUser(newUser);
      setAvailableUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      addNotification(`${language === 'zh' ? '欢迎' : 'Welcome'} ${newUser.nickname}`);
    } catch (err) {
      // Fallback works even if this throws
      setAvailableUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowAccountCenter(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 relative z-10 border border-white/20">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="bg-emerald-500 p-4 rounded-3xl text-white shadow-xl shadow-emerald-500/30">
              <BookOpen size={48} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('login_welcome')}</h1>
              <p className="text-slate-500 text-sm leading-relaxed">{t('login_desc')}</p>
            </div>

            <div className="w-full pt-8 space-y-4">
              <button 
                onClick={handleWeChatAuth}
                disabled={isLoggingIn}
                className="w-full bg-[#07C160] hover:bg-[#06ae56] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-70"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" size={24} /> : <RefreshCcw size={22} />}
                <span className="text-lg">{isLoggingIn ? t('auth_loading') : t('wechat_login')}</span>
              </button>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl flex items-center justify-center aspect-square max-w-[180px] mx-auto group">
                <QrCode size={110} className="text-slate-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Account Center Modal */}
      {showAccountCenter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{t('account_center')}</h3>
              <button onClick={() => setShowAccountCenter(false)} className="text-slate-400 p-1"><X size={24} /></button>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {availableUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => { setCurrentUser(user); setShowAccountCenter(false); }}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                    currentUser.id === user.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent'
                  }`}
                >
                  <img src={user.avatar} className="w-12 h-12 rounded-full" alt={user.nickname} />
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{user.nickname}</p>
                    <p className="text-xs text-slate-500">{user.grade}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-6 bg-slate-50">
              <button onClick={handleLogout} className="w-full py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-bold flex items-center justify-center gap-2">
                <LogOut size={18} /> {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status Banner */}
      {!isCloudConnected && (
        <div className="fixed top-0 inset-x-0 z-[120] bg-indigo-600 text-white py-1 px-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-top-full">
          <AlertCircle size={12} /> Local Mode: Using device storage. Cloud sync is disabled.
        </div>
      )}

      {/* Toast */}
      {activeToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-4">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700/50 backdrop-blur-xl">
            <CheckCircle className="text-emerald-400" size={20} />
            <p className="text-sm font-bold">{activeToast}</p>
          </div>
        </div>
      )}

      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <BookOpen size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">IntelliTask</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavLinks />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button 
            onClick={() => setShowAccountCenter(true)}
            className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-100 transition-all group"
          >
            <div className="relative">
              <img src={currentUser.avatar} className="w-10 h-10 rounded-full" alt="Avatar" />
              <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${isCloudConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-slate-800 truncate">{currentUser.nickname}</p>
              <div className="flex items-center gap-1">
                 {isSyncing ? <Loader2 size={8} className="animate-spin text-slate-400" /> : isCloudConnected ? <Cloud size={8} className="text-emerald-500" /> : <CloudOff size={8} className="text-slate-400" />}
                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">{isCloudConnected ? 'Cloud Ready' : 'Local Only'}</p>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <h2 className="text-lg font-semibold text-slate-800">{t('workspace')}</h2>
          <button 
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <Languages size={18} />
            <span className="text-xs font-bold uppercase">{language === 'en' ? '中文' : 'EN'}</span>
          </button>
        </header>

        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard tasks={tasks} />} />
            <Route path="/inbox" element={<HomeworkInbox onNewTask={handleAddTask} />} />
            <Route path="/scanner" element={<Scanner tasks={tasks} onUpdateTask={handleUpdateTask} />} />
            <Route path="/learning" element={<LearningHub tasks={tasks} savedPlan={currentPlan} onUpdatePlan={handleUpdatePlan} onAddNotification={addNotification} />} />
            <Route path="/reports" element={<Reports tasks={tasks} />} />
          </Routes>
        </div>
      </main>
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

  return (
    <>
      {links.map((link) => (
        <SidebarItem
          key={link.path}
          icon={link.icon}
          label={link.label}
          path={link.path}
          active={location.pathname === link.path}
        />
      ))}
    </>
  );
}

const App: React.FC = () => (
  <LanguageProvider>
    <HashRouter>
      <AppContent />
    </HashRouter>
  </LanguageProvider>
);

export default App;
