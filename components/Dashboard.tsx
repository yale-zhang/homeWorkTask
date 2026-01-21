
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeworkTask, Subject, UserProfile, AcademicEvent, EventType, EventNode } from '../types';
import { Clock, CheckCircle2, AlertCircle, ArrowUpRight, BarChart3, Filter, X, Calendar, ChevronRight, GraduationCap, CalendarDays, UserRound, Sparkles, School, Target, Zap, Info, TrendingUp } from 'lucide-react';
import { useTranslation } from '../i18n';
import { settingsService } from '../services/settingsService';

interface Props {
  user: UserProfile;
  tasks: HomeworkTask[];
}

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} shadow-lg shadow-current/10`}>
        <Icon size={22} className="text-white" />
      </div>
      <span className="text-emerald-500 text-[10px] font-black flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-tighter">
        <ArrowUpRight size={12} /> +12%
      </span>
    </div>
    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
    <h3 className="text-2xl font-black text-slate-800 mt-1">{value}</h3>
  </div>
);

const Dashboard: React.FC<Props> = ({ user, tasks }) => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const settings = settingsService.getSettings();
  
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Find user's school and milestones
  const userSchool = settings.schools.find(s => s.name === user.school);
  const userMilestones = useMemo(() => {
    if (!userSchool) return [];
    return settings.eventNodes
      .filter(n => n.schoolId === userSchool.id)
      .sort((a, b) => a.order - b.order);
  }, [settings.eventNodes, userSchool]);

  const countByCategory = (catName: string) => tasks.filter(tk => tk.category === catName).length;

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const gradedCount = tasks.filter(t => t.status === 'graded').length;

  const getEventIcon = (type: EventType) => {
    switch(type) {
      case EventType.HOMEWORK: return <Clock size={16} />;
      case EventType.WEEKLY_QUIZ: return <Target size={16} />;
      case EventType.MONTHLY_TEST: return <Zap size={16} />;
      case EventType.MIDTERM: case EventType.FINAL: return <GraduationCap size={16} />;
      default: return <Calendar size={16} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Student Profile Header */}
      <section className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-900/20">
        <div className="absolute top-0 right-0 p-12 opacity-10"><GraduationCap size={180} /></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-start sm:items-center gap-6">
            <div className="relative shrink-0">
              <img src={user.avatar} className="w-24 h-24 rounded-3xl border-4 border-white/10 shadow-xl object-cover" alt="" />
              <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white p-2 rounded-xl shadow-lg border-2 border-slate-900">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight">{user.nickname}</h1>
                <span className="bg-indigo-50/20 text-indigo-300 border border-indigo-50/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{user.grade}</span>
                {user.school && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 uppercase tracking-widest">
                    <School size={12} /> {user.school}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm font-medium">{language === 'zh' ? '欢迎回来，开始今天的学习之旅吧。' : 'Welcome back, let\'s start today\'s journey.'}</p>
            </div>
          </div>
          <div className="lg:w-72 space-y-3 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
             <div className="flex justify-between items-end"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('semester_progress')}</span><span className="text-lg font-black text-indigo-400">65%</span></div>
             <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-[65%] rounded-full"></div></div>
             <p className="text-[10px] text-slate-500 font-bold uppercase">{t('pending_desc', { count: pendingCount })}</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t('stat_pending')} value={pendingCount.toString()} icon={Clock} color="bg-amber-500" />
        <StatCard label={t('stat_completed')} value={gradedCount.toString()} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard label={t('stat_avg_score')} value="88%" icon={BarChart3} color="bg-indigo-500" />
        <StatCard label={t('stat_gaps')} value="4" icon={AlertCircle} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Dynamic Milestones Section */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-8">
               <TrendingUp size={20} className="text-indigo-600" /> {t('upcoming_milestones')}
            </h2>
            <div className="relative flex items-center justify-between px-4 pb-12">
              <div className="absolute left-4 right-4 h-1 bg-slate-100 top-[20px] z-0"></div>
              {userMilestones.length > 0 ? userMilestones.map((node) => (
                <button key={node.id} onClick={() => navigate('/exams')} className="relative z-10 flex flex-col items-center group">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-white border-2 border-slate-100 text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-sm`}>
                    {getEventIcon(node.type)}
                  </div>
                  <div className="mt-3 flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter text-center">{node.name}</span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 rounded-full mt-1">{countByCategory(node.name)}</span>
                  </div>
                </button>
              )) : (
                <div className="w-full text-center py-4 text-slate-400 text-xs italic">{t('no_nodes_yet')}</div>
              )}
            </div>
          </section>

          {/* Recent List */}
          <div className="bg-white rounded-[2rem] border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest"><Target size={16} className="text-indigo-600" /> {t('recent_assignments')}</h3>
              <button onClick={() => navigate('/scanner')} className="text-[10px] font-black text-indigo-600 hover:underline">{language === 'zh' ? '查看全部' : 'View All'}</button>
            </div>
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/scanner/${task.id}`)}>
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400">{t(task.subject)[0]}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate">{task.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{task.category}</p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${task.status === 'graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{task.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12"><Sparkles size={100} /></div>
             <h3 className="text-xl font-black mb-2">{language === 'zh' ? '备考建议' : 'Prep Strategy'}</h3>
             <p className="text-indigo-100 text-sm mb-6 leading-relaxed opacity-80">{language === 'zh' ? '点击里程碑可进入考试中心，查看 AI 针对您过往表现生成的专属提分策略。' : 'Click milestones to access AI strategies based on your past performance.'}</p>
             <button onClick={() => navigate('/exams')} className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md py-4 rounded-2xl font-black text-sm transition-all">{t('nav_exams')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
