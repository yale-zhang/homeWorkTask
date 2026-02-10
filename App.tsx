
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, ScanLine, BookOpen, BarChart3, Bell, User, MessageSquare, Languages, X, CheckCircle, LogOut, Loader2, ChevronRight, AlertCircle, Cloud, CloudOff, Settings, Save, RotateCw, UserPlus, History, Mail, Lock, Eye, EyeOff, Square, CheckSquare, Pencil, School, UserCircle, Image, GraduationCap, ArrowLeft, Camera, TrendingUp, ListPlus, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import Dashboard from './components/Dashboard';
import HomeworkInbox from './components/HomeworkInbox';
import Scanner from './components/Scanner';
import LearningHub from './components/LearningHub';
import Reports from './components/Reports';
import ExamCenter from './components/ExamCenter';
import { HomeworkTask, LearningPlan, UserProfile, AppSettings, EventNode, EventType, SchoolNode } from './types';
import { LanguageProvider, useTranslation } from './i18n';
import { apiService } from './services/apiService';
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
  const [activeTab, setActiveTab] = useState<'milestones'>('milestones');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSchoolId, setExpandedSchoolId] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      settingsService.saveSettings(settings, user.id);
      try { await apiService.syncUser(user); } catch (e) {}
      await apiService.saveCloudSettings(user.id, settings);
      onSaved(t('settings_saved'));
      onClose();
    } catch (err) {
      onSaved(t('settings_saved') + " (Local)");
      onClose();
    } finally { setIsSaving(false); }
  };

  const addSchool = () => {
    const newSchool: SchoolNode = {
      id: `sch_${Date.now()}`,
      name: t('new_school'),
      order: settings.schools.length
    };
    setSettings({ ...settings, schools: [...settings.schools, newSchool] });
    setExpandedSchoolId(newSchool.id);
  };

  const removeSchool = (id: string) => {
    setSettings({
      ...settings,
      schools: settings.schools.filter(s => s.id !== id),
      eventNodes: settings.eventNodes.filter(n => n.schoolId !== id)
    });
  };

  const addNode = (schoolId: string) => {
    const newNode: EventNode = {
      id: `node_${Date.now()}`,
      name: t('new_event'),
      type: EventType.HOMEWORK,
      order: settings.eventNodes.filter(n => n.schoolId === schoolId).length,
      schoolId
    };
    setSettings({ ...settings, eventNodes: [...settings.eventNodes, newNode] });
  };

  const removeNode = (id: string) => {
    setSettings({ ...settings, eventNodes: settings.eventNodes.filter(n => n.id !== id) });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
        
        <div className="flex border-b border-slate-100 overflow-x-auto whitespace-nowrap">
          <button onClick={() => setActiveTab('milestones')} className="flex-1 py-4 px-6 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-all border-indigo-600 text-indigo-600"><TrendingUp size={18} /> {t('milestone_manage')}</button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('milestone_nodes')}</p>
                <button onClick={addSchool} className="flex items-center gap-1 text-indigo-600 font-bold text-xs hover:bg-indigo-50 px-3 py-1.5 rounded-lg"><School size={14} /> {t('add_school')}</button>
              </div>
              <div className="space-y-4">
                {settings.schools.map((school) => (
                  <div key={school.id} className="border border-slate-100 rounded-[1.5rem] overflow-hidden bg-slate-50/50">
                    <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100">
                       <div className="flex items-center gap-3 flex-1">
                          <button onClick={() => setExpandedSchoolId(expandedSchoolId === school.id ? null : school.id)} className="text-slate-400 hover:text-indigo-600">
                             {expandedSchoolId === school.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                          <input 
                            type="text" 
                            value={school.name} 
                            onChange={e => {
                              const newSchools = [...settings.schools];
                              const idx = newSchools.findIndex(s => s.id === school.id);
                              newSchools[idx].name = e.target.value;
                              setSettings({ ...settings, schools: newSchools });
                            }}
                            className="bg-transparent border-none font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
                          />
                       </div>
                       <div className="flex items-center gap-2">
                          {/* Fixed: Added missing Plus icon import */}
                          <button onClick={() => addNode(school.id)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"><Plus size={18} /></button>
                          <button onClick={() => removeSchool(school.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl"><Trash2 size={18} /></button>
                       </div>
                    </div>
                    
                    {expandedSchoolId === school.id && (
                      <div className="p-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
                        {settings.eventNodes.filter(n => n.schoolId === school.id).map((node, nIdx) => (
                          <div key={node.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 group">
                            <input 
                              type="text" 
                              value={node.name} 
                              onChange={e => {
                                const newNodes = [...settings.eventNodes];
                                const idx = newNodes.findIndex(n => n.id === node.id);
                                newNodes[idx].name = e.target.value;
                                setSettings({ ...settings, eventNodes: newNodes });
                              }}
                              className="flex-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <select 
                              value={node.type} 
                              onChange={e => {
                                const newNodes = [...settings.eventNodes];
                                const idx = newNodes.findIndex(n => n.id === node.id);
                                newNodes[idx].type = e.target.value as EventType;
                                setSettings({ ...settings, eventNodes: newNodes });
                              }}
                              className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] outline-none"
                            >
                              {Object.values(EventType).map(et => <option key={et} value={et}>{et}</option>)}
                            </select>
                            <button onClick={() => removeNode(node.id)} className="p-2 text-slate-300 hover:text-rose-600"><X size={14} /></button>
                          </div>
                        ))}
                        {settings.eventNodes.filter(n => n.schoolId === school.id).length === 0 && (
                          <p className="text-center text-[10px] text-slate-400 py-4 italic">{t('no_nodes_yet')}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="p-8 bg-slate-50 flex gap-4">
          <button onClick={() => { settingsService.reset(); setSettings(settingsService.getSettings()); onSaved(t('reset_settings')); }} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-100"><RotateCw size={18} /></button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-70">{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}{t('save_settings')}</button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(settingsService.getSettings());

  useEffect(() => {
    const handleSettingsUpdate = () => { setSettings(settingsService.getSettings()); };
    window.addEventListener('app-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('app-settings-updated', handleSettingsUpdate);
  }, []);
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState<'traditional' | 'wechat' | 'github' | null>(null);
  const [showAccountCenter, setShowAccountCenter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loginView, setLoginView] = useState<'signin' | 'signup' | 'select'>('signin');
  
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
    } catch (err) { return []; } finally { setIsSyncing(false); }
  }, []);

  useEffect(() => {
    const init = async () => {
      const users = await refreshUsers();
      const savedUid = localStorage.getItem(CURRENT_USER_ID_KEY);
      const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      const rememberedPassword = localStorage.getItem(REMEMBERED_PASSWORD_KEY);
      if (rememberedEmail) setEmail(rememberedEmail);
      if (rememberedPassword) setPassword(rememberedPassword);
      if (rememberedEmail || rememberedPassword) setRememberMe(true);

      if (savedUid) {
        const user = users.find(u => u.id === savedUid);
        if (user) { setCurrentUser(user); return; }
      }
      setLoginView(users.length > 0 ? 'select' : 'signin');
    };
    init();
  }, [refreshUsers]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) { setTasks([]); setCurrentPlan(null); return; }
      setIsSyncing(true);
      setTasks([]);
      setCurrentPlan(null);
      localStorage.setItem(CURRENT_USER_ID_KEY, currentUser.id);
      try {
        const cloudSettings = await apiService.getCloudSettings(currentUser.id);
        if (cloudSettings) settingsService.saveSettings(cloudSettings, currentUser.id);
        const [userTasks, userPlan] = await Promise.all([ apiService.getTasks(currentUser.id), apiService.getPlan(currentUser.id) ]);
        setTasks(userTasks || []);
        setCurrentPlan(userPlan || null);
        setIsCloudConnected(true);
      } catch (err) {
        setIsCloudConnected(false);
        setTasks([]);
        setCurrentPlan(null);
      } finally { setIsSyncing(false); }
    };
    loadUserData();
  }, [currentUser?.id]);

  const onUpdatePlan = useCallback(async (plan: LearningPlan | null) => {
    if (!currentUser) return;
    setCurrentPlan(plan);
    if (plan) {
      try { await apiService.savePlan(currentUser.id, plan); } catch (e) {}
    }
  }, [currentUser]);

  const processTaskWithAI = useCallback(async (taskId: string) => {
    if (!currentUser) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'processing' } : t));
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.submissionImage) throw new Error("Task missing required data");
      const imgData = task.submissionImage.includes(',') ? task.submissionImage.split(',')[1] : task.submissionImage;
      const result = await apiService.gradeSubmission(imgData, task.content, language);
      const updatedTask: HomeworkTask = { ...task, status: 'graded', result, isGeneratingPlan: true };
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      await apiService.upsertTask(currentUser.id, updatedTask);
      const planRes = await apiService.generatePlan(result.weaknesses || ['General Review'], language);
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
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isGeneratingPlan: false } : t));
      if (!currentPlan || currentPlan.sourceTaskId === taskId) setCurrentPlan(newPlan);
      addNotification(t('notif_plan_ready', { focus: planRes.focusArea }));
    } catch (error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending', isGeneratingPlan: false } : t));
    }
  }, [currentUser, tasks, language, currentPlan, addNotification, t]);

  const handleBatchGrade = async (taskIds: string[]) => { await Promise.all(taskIds.map(id => processTaskWithAI(id))); };

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
        if (user) handleAccountSwitch(user); else addNotification(t('invalid_creds'));
      } else {
        const user = await apiService.register(email, password);
        await refreshUsers();
        addNotification(t('signup_success'));
        handleAccountSwitch(user);
      }
    } catch (err) { addNotification(language === 'zh' ? '认证服务异常' : 'Auth service error'); } finally { setIsLoggingIn(null); }
  };

  const handleLogout = () => {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
    localStorage.removeItem('intellitask_access_token');
    localStorage.removeItem('intellitask_refresh_token');
    setCurrentUser(null);
    setLoginView('signin');
    setShowAccountCenter(false);
  };
  const openAccountCenter = async () => { setShowAccountCenter(true); await refreshUsers(); };
  const handleSaveProfile = async () => {
    if (!editingUser) return;
    setIsSavingProfile(true);
    try {
      await apiService.syncUser(editingUser);
      if (currentUser && currentUser.id === editingUser.id) setCurrentUser(editingUser);
      await refreshUsers(); setEditingUser(null); addNotification(language === 'zh' ? '资料已更新' : 'Profile Updated');
    } catch (err) { addNotification(language === 'zh' ? '保存失败' : 'Save failed'); } finally { setIsSavingProfile(false); }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 relative z-10">
          <div className="flex flex-col items-center">
            <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl mb-6"><BookOpen size={40} /></div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">{loginView === 'signin' ? t('login_welcome') : loginView === 'signup' ? t('login_signup_btn') : (language === 'zh' ? '欢迎回来' : 'Welcome Back')}</h1>
            <p className="text-slate-500 text-sm mb-8 text-center">{loginView === 'select' ? (language === 'zh' ? '请选择一个已有的账号并验证密码' : 'Please select an account and verify password') : t('login_desc')}</p>
            {loginView === 'select' ? (
              <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {availableUsers.map(user => (
                    <button key={user.id} onClick={() => { if (user.id.startsWith('email_')) { setEmail(user.id.replace('email_', '')); setPassword(''); setLoginView('signin'); } else { handleAccountSwitch(user); } }} className="w-full p-4 rounded-2xl flex items-center gap-4 bg-slate-50 border border-transparent hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group">
                      <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="" />
                      <div className="text-left flex-1 min-w-0"><p className="font-bold text-slate-800 truncate group-hover:text-indigo-600">{user.nickname}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{user.grade}</p></div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <button onClick={() => setLoginView('signin')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"><UserPlus size={18} /> {language === 'zh' ? '使用其他账号登录' : 'Other Account'}</button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleTraditionalLogin} className="space-y-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t('login_email')}</label><div className="relative"><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pl-11 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" /><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /></div></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t('login_password')}</label><div className="relative"><input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pl-11 pr-11 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" /><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                  <div className="flex items-center justify-between px-1"><button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group">{rememberMe ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-slate-300" />}<span className="text-xs font-bold">{t('login_remember_me')}</span></button></div>
                  <button type="submit" disabled={!!isLoggingIn} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-70 transition-all flex items-center justify-center gap-2">{isLoggingIn === 'traditional' ? <Loader2 className="animate-spin" size={20} /> : null}{loginView === 'signin' ? t('login_signin_btn') : t('login_signup_btn')}</button>
                </form>
                <div className="text-center"><p className="text-sm text-slate-500">{loginView === 'signin' ? t('login_no_account') : t('login_has_account')}{' '}<button onClick={() => setLoginView(loginView === 'signin' ? 'signup' : 'signin')} className="text-indigo-600 font-bold hover:underline">{loginView === 'signin' ? t('login_signup_btn') : t('login_signin_btn')}</button></p></div>
                <div className="relative flex items-center py-2"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink mx-4 text-xs font-bold text-slate-300 uppercase tracking-widest">{t('login_other_methods')}</span><div className="flex-grow border-t border-slate-100"></div></div>
                <p className="text-xs text-slate-400 text-center">{language === 'zh' ? '当前仅支持邮箱登录' : 'Only email login is supported right now.'}</p>
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
          <div className={`bg-white rounded-[2.5rem] w-full transition-all duration-500 shadow-2xl overflow-hidden animate-in zoom-in-95 ${editingUser ? 'max-w-2xl' : 'max-w-md'}`}>
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">{editingUser ? ( <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"><ArrowLeft size={20} /></button> ) : ( <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><User size={20} /></div> )} <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingUser ? t('edit_profile') : t('account_center')}</h3></div>
              <button onClick={() => { setShowAccountCenter(false); setEditingUser(null); }} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="relative min-h-[500px] flex flex-col">
               {!editingUser && (
                 <div className="p-6 space-y-3 flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-left-4">
                   {availableUsers.map(user => (
                     <div key={user.id} className={`group p-4 rounded-[1.5rem] flex items-center gap-4 transition-all border-2 ${currentUser.id === user.id ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-transparent hover:border-slate-100 hover:bg-white'}`}>
                       <button onClick={() => handleAccountSwitch(user)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
                         <div className="relative shrink-0"><img src={user.avatar} className="w-14 h-14 rounded-2xl border-2 border-white shadow-sm object-cover" alt="" />{currentUser.id === user.id && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>}</div>
                         <div className="flex-1 min-w-0"><p className="font-black text-slate-800 truncate leading-tight">{user.nickname}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.grade}{user.school ? ` · ${user.school}` : ''}</p></div>
                       </button>
                       <button onClick={() => setEditingUser({...user})} className="opacity-0 group-hover:opacity-100 p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all shadow-sm border border-slate-100"><Pencil size={18} /></button>
                     </div>
                   ))}
                 </div>
               )}
               {editingUser && (
                 <div className="flex-1 flex flex-col md:flex-row animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="md:w-64 bg-slate-50 border-r border-slate-100 p-8 flex flex-col items-center justify-center gap-6"><div className="relative group cursor-pointer"><img src={editingUser.avatar} className="w-32 h-32 rounded-[2rem] border-4 border-white shadow-xl object-cover" alt="" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] flex items-center justify-center text-white"><Camera size={24} /></div></div><div className="text-center space-y-1"><p className="font-black text-slate-900 text-lg">{editingUser.nickname || 'Student'}</p><div className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{editingUser.grade || 'No Grade'}</div>{editingUser.school && ( <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{editingUser.school}</p> )}</div></div>
                    <div className="flex-1 p-10 space-y-6 overflow-y-auto">
                       <div className="grid grid-cols-1 gap-6">
                         <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('nickname')}</label><div className="relative group"><input type="text" value={editingUser.nickname} onChange={e => setEditingUser({...editingUser, nickname: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" /><UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /></div></div>
                         <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('current_grade')}</label><div className="relative group"><input type="text" value={editingUser.grade} onChange={e => setEditingUser({...editingUser, grade: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" /><GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /></div></div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('school')}</label>
                           <div className="relative group">
                             <select 
                               value={editingUser.school || ''} 
                               onChange={e => setEditingUser({...editingUser, school: e.target.value})} 
                               className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none"
                             >
                               <option value="">{language === 'zh' ? '-- 选择学校 --' : '-- Select School --'}</option>
                               {settings.schools.map(sch => <option key={sch.id} value={sch.name}>{sch.name}</option>)}
                             </select>
                             <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                           </div>
                         </div>
                         <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('avatar_url')}</label><div className="relative group"><input type="text" value={editingUser.avatar} onChange={e => setEditingUser({...editingUser, avatar: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" /><Image className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /></div></div>
                       </div>
                       <div className="flex gap-4 pt-4"><button onClick={() => setEditingUser(null)} className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors">{t('cancel')}</button><button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex-[2] py-4 px-6 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-70 transition-all flex items-center justify-center gap-2">{isSavingProfile ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}{t('save_changes')}</button></div>
                    </div>
                 </div>
               )}
            </div>
            {!editingUser && ( <div className="p-8 bg-slate-50 flex flex-col gap-3"><button onClick={handleLogout} className="w-full py-5 rounded-[1.5rem] border-2 border-rose-100 bg-white text-rose-600 font-black flex items-center justify-center gap-2 hover:bg-rose-50 transition-all shadow-sm"><LogOut size={20} /> {t('logout')}</button></div> )}
          </div>
        </div>
      )}

      {showSettings && <SettingsModal user={currentUser} onClose={() => setShowSettings(false)} onSaved={addNotification} />}

      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2"><div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg"><BookOpen size={24} /></div><h1 className="text-xl font-bold text-slate-800 italic tracking-tight">IntelliTask</h1></div>
        <nav className="flex-1 space-y-2"><NavLinks /></nav>
        <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-all group"><Settings size={20} className="group-hover:rotate-45" /><span className="font-medium">{t('settings')}</span></button>
          <button onClick={openAccountCenter} className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-100 transition-all group border border-transparent">
            <div className="relative"><img src={currentUser.avatar} className="w-10 h-10 rounded-full border border-white" alt="" /><div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${isCloudConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}></div></div>
            <div className="flex-1 min-w-0 text-left"><p className="text-sm font-bold text-slate-800 truncate">{currentUser.nickname}</p><div className="flex items-center gap-1">{isSyncing ? <Loader2 size={8} className="animate-spin text-slate-400" /> : <Cloud size={8} className={isCloudConnected ? 'text-emerald-500' : 'text-slate-400'} />}<p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">{isCloudConnected ? 'Cloud Sync On' : 'Sync Offline'}</p></div></div>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30"><div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-slate-800">{t('workspace')}</h2><span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase tracking-tighter">{currentUser.id.slice(0, 6)}</span></div><button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-xs">{language === 'en' ? '中文' : 'EN'}</button></header>
        <div className="flex-1 p-8 overflow-y-auto" key={currentUser.id}>
          <Routes>
            <Route path="/" element={<Dashboard user={currentUser} tasks={tasks} />} />
            <Route path="/inbox" element={<HomeworkInbox onNewTask={async (t) => { setTasks(prev => [t, ...prev]); await apiService.upsertTask(currentUser.id, t); addNotification(language === 'zh' ? '作业已入库' : 'Assignment Added'); }} />} />
            <Route path="/scanner/:taskId?" element={<Scanner tasks={tasks} onGradeTask={processTaskWithAI} onBatchGrade={handleBatchGrade} user={currentUser} />} />
            <Route path="/learning" element={<LearningHub tasks={tasks} savedPlan={currentPlan} onUpdatePlan={onUpdatePlan} onAddNotification={addNotification} />} />
            <Route path="/reports" element={<Reports tasks={tasks} />} />
            <Route path="/exams" element={<ExamCenter tasks={tasks} />} />
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
    { icon: TrendingUp, label: t('nav_exams'), path: '/exams' },
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
