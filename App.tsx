
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, LayoutDashboard, Inbox, ScanLine, BookOpen, BarChart3, Bell, User, MessageSquare } from 'lucide-react';
import Dashboard from './components/Dashboard';
import HomeworkInbox from './components/HomeworkInbox';
import Scanner from './components/Scanner';
import LearningHub from './components/LearningHub';
import Reports from './components/Reports';
import { HomeworkTask } from './types';

const STORAGE_KEY = 'intellitask_data_v1';

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

const App: React.FC = () => {
  // 1. 初始化时从 localStorage 加载数据
  const [tasks, setTasks] = useState<HomeworkTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
      return [];
    }
  });

  const [notificationCount, setNotificationCount] = useState(2);

  // 2. 监听 tasks 变化，同步到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (task: HomeworkTask) => {
    setTasks(prev => [task, ...prev]);
  };

  const handleUpdateTask = (updatedTask: HomeworkTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50">
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
                <p className="text-xs text-slate-500 truncate">Grade 11, Section A</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
            <h2 className="text-lg font-semibold text-slate-800">Workspace</h2>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                    {notificationCount}
                  </span>
                )}
              </button>
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
              <Route path="/learning" element={<LearningHub tasks={tasks} />} />
              <Route path="/reports" element={<Reports tasks={tasks} />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

const NavLinks = () => {
  const location = useLocation();
  const links = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Inbox, label: 'Assignments', path: '/inbox' },
    { icon: ScanLine, label: 'AI Scanner', path: '/scanner' },
    { icon: MessageSquare, label: 'Learning Hub', path: '/learning' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
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

export default App;
