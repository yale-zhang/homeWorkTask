
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, ScanLine, BookOpen, BarChart3, Bell, User, MessageSquare, Languages, X, CheckCircle, LogOut, RefreshCcw, QrCode, Loader2, ChevronRight } from 'lucide-react';
import Dashboard from './components/Dashboard';
import HomeworkInbox from './components/HomeworkInbox';
import Scanner from './components/Scanner';
import LearningHub from './components/LearningHub';
import Reports from './components/Reports';
import { HomeworkTask, LearningPlan, UserProfile } from './types';
import { LanguageProvider, useTranslation } from './i18n';

// Constants for per-user storage
const USERS_LIST_KEY = 'intellitask_users_list';
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedUid = localStorage.getItem(CURRENT_USER_ID_KEY);
    const usersList = JSON.parse(localStorage.getItem(USERS_LIST_KEY) || '[]');
    return usersList.find((u: UserProfile) => u.id === savedUid) || null;
  });
  
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>(() => {
    return JSON.parse(localStorage.getItem(USERS_LIST_KEY) || '[]');
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showAccountCenter, setShowAccountCenter] = useState(false);

  // Per-User Task State
  const tasksKey = useMemo(() => currentUser ? `intellitask_tasks_${currentUser.id}` : 'guest_tasks', [currentUser]);
  const planKey = useMemo(() => currentUser ? `intellitask_plan_${currentUser.id}` : 'guest_plan', [currentUser]);

  const [tasks, setTasks] = useState<HomeworkTask[]>([]);
  const [currentPlan, setCurrentPlan] = useState<LearningPlan | null>(null);

  // Load data when user changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_ID_KEY, currentUser.id);
      const savedTasks = localStorage.getItem(tasksKey);
      const savedPlan = localStorage.getItem(planKey);
      setTasks(savedTasks ? JSON.parse(savedTasks) : []);
      setCurrentPlan(savedPlan ? JSON.parse(savedPlan) : null);
    } else {
      setTasks([]);
      setCurrentPlan(null);
    }
  }, [currentUser, tasksKey, planKey]);

  // Save data when state changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(tasksKey, JSON.stringify(tasks));
    }
  }, [tasks, tasksKey, currentUser]);

  useEffect(() => {
    if (currentUser && currentPlan) {
      localStorage.setItem(planKey, JSON.stringify(currentPlan));
    } else if (currentUser) {
      localStorage.removeItem(planKey);
    }
  }, [currentPlan, planKey, currentUser]);

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

  const handleAddTask = (task: HomeworkTask) => setTasks(prev => [task, ...prev]);
  const handleUpdateTask = (updatedTask: HomeworkTask) => setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

  // Mock WeChat Login
  const handleWeChatAuth = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      const mockUsers = [
        { id: 'wx_1001', nickname: 'Alex Student', avatar: 'https://picsum.photos/seed/user1/100/100', grade: language === 'zh' ? '11年级 A班' : 'Grade 11, Section A' },
        { id: 'wx_1002', nickname: 'Emily Wang', avatar: 'https://picsum.photos/seed/user2/100/100', grade: language === 'zh' ? '9年级 C班' : 'Grade 9, Section C' },
        { id: 'wx_1003', nickname: 'Kevin Zhang', avatar: 'https://picsum.photos/seed/user3/100/100', grade: language === 'zh' ? '12年级 特长班' : 'Grade 12, Honors' },
      ];
      const newUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      
      setAvailableUsers(prev => {
        const exists = prev.find(u => u.id === newUser.id);
        if (exists) return prev;
        const newList = [...prev, newUser];
        localStorage.setItem(USERS_LIST_KEY, JSON.stringify(newList));
        return newList;
      });

      setCurrentUser(newUser);
      setIsLoggingIn(false);
      setIsAuthModalOpen(false);
      addNotification(`${language === 'zh' ? '授权成功，欢迎' : 'Authorized successfully, welcome'} ${newUser.nickname}`);
    }, 1500);
  };

  const switchAccount = (user: UserProfile) => {
    setCurrentUser(user);
    setShowAccountCenter(false);
    addNotification(`${language === 'zh' ? '已切换至' : 'Switched to'} ${user.nickname}`);
  };

  const handleLogout = () => {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
    setCurrentUser(null);
    setShowAccountCenter(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 -left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 relative z-10 animate-in zoom-in-95 duration-500 border border-white/20">
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
                className="w-full bg-[#07C160] hover:bg-[#06ae56] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-70"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" size={24} /> : <RefreshCcw size={22} />}
                <span className="text-lg">{isLoggingIn ? t('auth_loading') : t('wechat_login')}</span>
              </button>
              
              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-slate-100"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{language === 'zh' ? '或使用二维码' : 'OR USE QR CODE'}</span>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl flex items-center justify-center aspect-square max-w-[200px] mx-auto group cursor-pointer hover:border-emerald-500 transition-colors">
                <QrCode size={120} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 font-medium">
              By logging in, you agree to our <span className="underline">Terms of Service</span>
            </p>
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
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{t('account_center')}</h3>
              <button onClick={() => setShowAccountCenter(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {availableUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => switchAccount(user)}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                    currentUser.id === user.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt={user.nickname} />
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{user.nickname}</p>
                    <p className="text-xs text-slate-500">{user.grade}</p>
                  </div>
                  {currentUser.id === user.id && <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>}
                </button>
              ))}
              
              <button 
                onClick={handleWeChatAuth}
                className="w-full p-4 rounded-2xl flex items-center gap-4 border border-dashed border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <RefreshCcw size={20} />
                </div>
                <span className="font-bold text-sm">{language === 'zh' ? '添加新账号' : 'Add Account'}</span>
              </button>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4">
              <button 
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
              >
                <LogOut size={18} /> {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {activeToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-10 duration-500">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700/50 backdrop-blur-xl">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <CheckCircle size={20} />
            </div>
            <p className="text-sm font-bold">{activeToast}</p>
            <button onClick={() => setActiveToast(null)} className="text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
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
              <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Avatar" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{currentUser.nickname}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">{currentUser.grade}</p>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <h2 className="text-lg font-semibold text-slate-800">{t('workspace')}</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors mr-2 border border-slate-200"
            >
              <Languages size={18} />
              <span className="text-xs font-bold uppercase">{language === 'en' ? '中文' : 'EN'}</span>
            </button>

            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  if (!showNotifMenu) setNotifications(prev => prev.map(n => ({...n, read: true})));
                }}
                className={`relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors ${showNotifMenu ? 'bg-slate-100' : ''}`}
              >
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              {showNotifMenu && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">{t('notif_title')}</span>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} className="text-[10px] text-indigo-600 font-bold hover:underline">CLEAR ALL</button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {notifications.map(n => (
                          <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-2 block">
                              {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-sm text-slate-400">{t('notif_empty')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard tasks={tasks} />} />
            <Route path="/inbox" element={<HomeworkInbox onNewTask={handleAddTask} />} />
            <Route path="/scanner" element={<Scanner tasks={tasks} onUpdateTask={handleUpdateTask} />} />
            <Route path="/learning" element={<LearningHub tasks={tasks} savedPlan={currentPlan} onUpdatePlan={setCurrentPlan} onAddNotification={addNotification} />} />
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
