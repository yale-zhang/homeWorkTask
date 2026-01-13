
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, LayoutDashboard, Inbox, ScanLine, BookOpen, BarChart3, Bell, User, MessageSquare, Languages, X, CheckCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import HomeworkInbox from './components/HomeworkInbox';
import Scanner from './components/Scanner';
import LearningHub from './components/LearningHub';
import Reports from './components/Reports';
import { HomeworkTask, LearningPlan } from './types';
import { LanguageProvider, useTranslation } from './i18n';

const TASKS_STORAGE_KEY = 'intellitask_tasks_v1';
const PLAN_STORAGE_KEY = 'intellitask_plan_v1';

interface Notification {
  id: string;
  message: string;
  time: number;
  read: boolean;
}

interface SidebarItemProps {
  icon: any;
  label: string;
  path: string;
  active: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, active }) => (
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
  
  // Tasks Persistence
  const [tasks, setTasks] = useState<HomeworkTask[]>(() => {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Learning Plan Persistence
  const [currentPlan, setCurrentPlan] = useState<LearningPlan | null>(() => {
    try {
      const saved = localStorage.getItem(PLAN_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
    setTimeout(() => setActiveToast(null), 5000); // Hide toast after 5s
  }, []);

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (currentPlan) {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(currentPlan));
    } else {
      localStorage.removeItem(PLAN_STORAGE_KEY);
    }
  }, [currentPlan]);

  const handleAddTask = (task: HomeworkTask) => {
    setTasks(prev => [task, ...prev]);
  };

  const handleUpdateTask = (updatedTask: HomeworkTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Toast Notification */}
      {activeToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 duration-500">
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
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
              <img src="https://picsum.photos/seed/user1/40/40" alt="Avatar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">Alex Student</p>
              <p className="text-xs text-slate-500 truncate">{language === 'zh' ? '11年级 A班' : 'Grade 11, Section A'}</p>
            </div>
          </div>
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
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount}
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
            
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <User size={20} />
            </button>
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
