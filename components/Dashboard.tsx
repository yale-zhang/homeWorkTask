
import React, { useState, useMemo } from 'react';
import { HomeworkTask, AssignmentCategory, Subject, UserProfile } from '../types';
import { Clock, CheckCircle2, AlertCircle, ArrowUpRight, BarChart3, Filter, X, Calendar } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Props {
  tasks: HomeworkTask[];
}

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <span className="text-emerald-500 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
        <ArrowUpRight size={14} /> +12%
      </span>
    </div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
  </div>
);

const Dashboard: React.FC<Props> = ({ tasks }) => {
  const { t } = useTranslation();
  
  // Get active user from storage context (simplification for this component)
  const activeUserRaw = localStorage.getItem('intellitask_current_uid');
  const usersListRaw = localStorage.getItem('intellitask_users_list');
  const activeUser = activeUserRaw && usersListRaw ? JSON.parse(usersListRaw).find((u: any) => u.id === activeUserRaw) : null;

  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const gradedCount = tasks.filter(t => t.status === 'graded').length;

  const getCategoryColor = (category: AssignmentCategory) => {
    switch (category) {
      case AssignmentCategory.MAJOR_GRADE: return 'bg-rose-50 text-rose-600 border-rose-100';
      case AssignmentCategory.QUIZ: return 'bg-amber-50 text-amber-600 border-amber-100';
      case AssignmentCategory.HOMEWORK: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case AssignmentCategory.PRACTICE: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSubject = subjectFilter === 'all' || task.subject === subjectFilter;
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      const matchesDate = !dateFilter || task.deadline.includes(dateFilter) || task.deadline === dateFilter;
      return matchesSubject && matchesCategory && matchesDate;
    });
  }, [tasks, subjectFilter, categoryFilter, dateFilter]);

  const clearFilters = () => {
    setSubjectFilter('all');
    setCategoryFilter('all');
    setDateFilter('');
  };

  const isFiltered = subjectFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== '';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">{t('welcome', { name: activeUser?.nickname || 'Student' })}</h1>
        <p className="text-slate-500 mt-2">{t('pending_desc', { count: pendingCount })}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t('stat_pending')} value={pendingCount.toString()} icon={Clock} color="bg-amber-500" />
        <StatCard label={t('stat_completed')} value={gradedCount.toString()} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard label={t('stat_avg_score')} value="88%" icon={BarChart3} color="bg-indigo-500" />
        <StatCard label={t('stat_gaps')} value="4" icon={AlertCircle} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800">{t('recent_assignments')}</h2>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select 
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                >
                  <option value="all">{t('all_subjects')}</option>
                  {Object.values(Subject).map(s => <option key={s} value={s}>{t(s)}</option>)}
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
              </div>

              <div className="relative">
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                >
                  <option value="all">{t('all_categories')}</option>
                  {Object.values(AssignmentCategory).map(c => <option key={c} value={c}>{t(c)}</option>)}
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
              </div>

              <div className="relative">
                <input 
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm min-w-[130px]"
                />
              </div>

              {isFiltered && (
                <button 
                  onClick={clearFilters}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                >
                  <X size={14} /> {t('clear_filters')}
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {filteredTasks.length > 0 ? filteredTasks.slice(0, 8).map((task) => (
              <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                  {t(task.subject)[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-semibold text-slate-800 truncate">{t(task.subject)}</h4>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${getCategoryColor(task.category)}`}>
                      {t(task.category)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{task.content}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    task.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {task.status}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 flex items-center justify-end gap-1">
                    <Calendar size={10} /> {task.deadline}
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <div className="p-3 bg-slate-50 rounded-full text-slate-300">
                  <Filter size={24} />
                </div>
                <p className="font-medium">{t('no_tasks')}</p>
                <button 
                  onClick={clearFilters}
                  className="text-indigo-600 text-sm font-bold hover:underline"
                >
                  {t('clear_filters')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">{t('Learning Hub')}</h2>
          <div className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">{t('Mathematics')}</h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                {t('focus_on_weakness', { subject: t('Mathematics') })}
              </p>
              <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors">
                {t('view_plan')}
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
