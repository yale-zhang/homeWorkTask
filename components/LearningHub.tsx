
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/apiService';
import { LearningPlan, HomeworkTask, LearningTask, Subject } from '../types';
// Fixed: Added Target to the lucide-react import list to resolve the "Cannot find name 'Target'" error.
import { BookOpen, Video, FileText, CheckCircle2, Play, ArrowRight, Loader2, Sparkles, AlertCircle, Check, X, Clock, BarChart, ListChecks, RotateCcw, Quote, BrainCircuit, ChevronLeft, ChevronRight, History, Search, Filter, Book, Layers, MoreHorizontal, Target } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Props {
  tasks: HomeworkTask[];
  savedPlan: LearningPlan | null;
  onUpdatePlan: (plan: LearningPlan | null) => void;
  onAddNotification: (message: string) => void;
}

const LearningHub: React.FC<Props> = ({ tasks, savedPlan, onUpdatePlan, onAddNotification }) => {
  const { t, language } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<LearningTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState<Subject | 'all'>('all');

  // 获取所有已批改或正在生成计划的任务
  const gradedTasks = useMemo(() => {
    return [...tasks]
      .filter(t => (t.status === 'graded' || t.isGeneratingPlan) && t.result)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [tasks]);

  // 按科目分组任务
  const tasksBySubject = useMemo(() => {
    const groups: Record<string, HomeworkTask[]> = {};
    gradedTasks.forEach(task => {
      if (!groups[task.subject]) groups[task.subject] = [];
      groups[task.subject].push(task);
    });
    return groups;
  }, [gradedTasks]);

  // 默认选中最近的一个任务
  const [activeGradedTaskId, setActiveGradedTaskId] = useState<string | null>(gradedTasks[0]?.id || null);
  const activeGradedTask = gradedTasks.find(t => t.id === activeGradedTaskId);

  // 状态同步
  const isGeneratingInBackground = activeGradedTask?.isGeneratingPlan;

  const loadPlanForTask = useCallback(async (taskId: string) => {
    const userId = localStorage.getItem('intellitask_current_uid');
    if (!userId) return;

    setIsLoading(true);
    setError(null);
    try {
      const plan = await apiService.getPlan(userId, taskId);
      onUpdatePlan(plan);
    } catch (err) {
      console.error("Failed to load specific plan", err);
      setError(language === 'zh' ? '加载计划失败' : 'Failed to load plan');
    } finally {
      setIsLoading(false);
    }
  }, [onUpdatePlan, language]);

  useEffect(() => {
    if (activeGradedTaskId) {
      if (!savedPlan || savedPlan.sourceTaskId !== activeGradedTaskId) {
        loadPlanForTask(activeGradedTaskId);
      }
    }
  }, [activeGradedTaskId, loadPlanForTask]);

  const fetchNewPlan = async () => {
    if (!activeGradedTask) return;
    setIsLoading(true);
    setError(null);
    try {
      const weaknesses = activeGradedTask.result?.weaknesses || ['General Review'];
      const res = await apiService.generatePlan(weaknesses, language);
      
      const newPlan: LearningPlan = {
        id: Math.random().toString(36).substr(2, 9),
        focusArea: res.focusArea,
        deepAnalysis: res.deepAnalysis,
        tasks: res.tasks,
        createdAt: Date.now(),
        sourceTaskId: activeGradedTask.id,
        sourceTaskTitle: activeGradedTask.title,
        sourceTaskSubject: activeGradedTask.subject
      };
      onUpdatePlan(newPlan);
      onAddNotification(t('notif_plan_ready', { focus: res.focusArea }));
    } catch (error: any) {
      console.error("Plan generation failed", error);
      setError(language === 'zh' ? '学习计划生成失败' : 'Failed to generate plan');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    if (!savedPlan) return;
    const updatedTasks = savedPlan.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdatePlan({ ...savedPlan, tasks: updatedTasks });
  };

  if (gradedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
          <BookOpen size={40} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{language === 'zh' ? '暂无可用学习计划' : 'No Plans Available'}</h2>
          <p className="text-slate-500 mt-2 max-w-xs">{language === 'zh' ? '在批改扫描中完成任务，系统将自动生成方案。' : 'Grade an assignment to unlock your roadmap.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-20 animate-in fade-in duration-500">
      
      {/* Left Sidebar: Assignment Navigator */}
      <aside className="lg:w-80 shrink-0 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[85vh]">
          <div className="p-6 border-b border-slate-100 space-y-4 bg-slate-50/50">
            <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm uppercase tracking-widest">
              <Layers size={18} className="text-indigo-600" /> {language === 'zh' ? '作业索引' : 'Assignments'}
            </h3>
            <div className="relative">
              <input 
                type="text" 
                placeholder={language === 'zh' ? '搜索作业...' : 'Search...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-6">
            {Object.entries(tasksBySubject).map(([subject, subjectTasks]) => {
              const filtered = subjectTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
              if (filtered.length === 0) return null;

              return (
                <div key={subject} className="space-y-2">
                  <div className="px-3 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t(subject)}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{filtered.length}</span>
                  </div>
                  <div className="space-y-1">
                    {filtered.map(task => (
                      <button
                        key={task.id}
                        onClick={() => setActiveGradedTaskId(task.id)}
                        className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 relative group ${
                          activeGradedTaskId === task.id 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${task.isGeneratingPlan ? 'bg-amber-400 animate-pulse' : (activeGradedTaskId === task.id ? 'bg-white' : 'bg-slate-200')}`}></div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${activeGradedTaskId === task.id ? 'text-white' : 'text-slate-800'}`}>{task.title}</p>
                          <p className={`text-[10px] mt-0.5 ${activeGradedTaskId === task.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {new Date(task.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        {activeGradedTaskId === task.id && <ChevronRight size={14} className="mt-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Right Main Panel: Plan Display */}
      <div className="flex-1 min-w-0">
        {(isLoading || isGeneratingInBackground) ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 h-[70vh] flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <Loader2 className="animate-spin text-indigo-600" size={64} />
              <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={24} />
            </div>
            <div className="text-center">
              <p className="text-slate-900 font-bold text-lg">{isGeneratingInBackground ? t('generating_plan') : (language === 'zh' ? '正在加载...' : 'Loading plan...')}</p>
              <p className="text-slate-400 text-sm mt-1">{language === 'zh' ? 'AI 正在分析您的作业表现' : 'AI is analyzing your performance'}</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 h-[70vh] flex flex-col items-center justify-center space-y-6 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
              <AlertCircle size={40} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{error}</h2>
              <p className="text-slate-500 mt-2">{language === 'zh' ? '可能由于网络原因，无法加载该学习计划' : 'Connection issue, could not load plan'}</p>
            </div>
            <button onClick={fetchNewPlan} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-500 transition-all">
               {language === 'zh' ? '重试生成' : 'Retry'}
            </button>
          </div>
        ) : !savedPlan ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 h-[70vh] flex flex-col items-center justify-center space-y-6 text-center px-10">
             <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
               <Sparkles size={48} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-800">{language === 'zh' ? '该任务尚未生成学习计划' : 'No Plan Generated Yet'}</h2>
               <p className="text-slate-500 mt-3 max-w-sm mx-auto leading-relaxed">
                 {language === 'zh' ? 'AI 将深入分析此作业中的错题和知识漏洞，为您定制个性化的提升方案。' : 'AI will deep-dive into this specific task to find your knowledge gaps and tailor a plan.'}
               </p>
             </div>
             <button onClick={fetchNewPlan} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
               {language === 'zh' ? '立即生成智能计划' : 'Generate Smart Plan'}
             </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            {/* Header section of the report */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="flex items-center gap-5">
                 <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl">
                   <Target size={32} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-slate-900">{savedPlan.sourceTaskTitle}</h2>
                   <div className="flex items-center gap-2 mt-1">
                     <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">{t(savedPlan.sourceTaskSubject || '')}</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{savedPlan.focusArea}</span>
                   </div>
                 </div>
               </div>
               <button onClick={fetchNewPlan} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm transition-colors group">
                 <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" /> {language === 'zh' ? '重新生成' : 'Regenerate'}
               </button>
            </div>

            {/* Deep Analysis Content */}
            <div className="bg-white rounded-[2.5rem] border border-indigo-100 overflow-hidden shadow-sm relative">
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
              <div className="p-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-100">AI</div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{language === 'zh' ? '学情诊断报告' : 'AI Diagnostic Report'}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{language === 'zh' ? '生成的深度分析' : 'S-Tier Expert Analysis'}</p>
                  </div>
                </div>
                
                <div className="prose prose-slate max-w-none">
                  <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 relative group italic leading-loose text-slate-600 text-lg">
                    <Quote className="absolute top-4 left-4 opacity-10 text-indigo-900" size={48} />
                    <p className="relative z-10 whitespace-pre-wrap">{savedPlan.deepAnalysis}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Structured Tasks flow */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                   <ListChecks className="text-indigo-600" /> {language === 'zh' ? '分阶学习任务' : 'Step-by-Step Missions'}
                 </h3>
                 <div className="text-xs font-bold text-slate-400">
                    {savedPlan.tasks.filter(t => t.completed).length} / {savedPlan.tasks.length} {language === 'zh' ? '已完成' : 'Completed'}
                 </div>
              </div>

              <div className="space-y-4">
                {savedPlan.tasks.map((task, idx) => {
                  const isCompleted = !!task.completed;
                  const taskType = (task.type || 'exercise').toLowerCase();
                  
                  // Difficulty badge color
                  const diffColor = task.metadata?.difficulty === 'Advanced' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                   task.metadata?.difficulty === 'Basic' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                   'bg-amber-50 text-amber-600 border-amber-100';

                  return (
                    <div 
                      key={task.id || idx} 
                      onClick={() => setSelectedTask(task)}
                      className={`group relative flex flex-col md:flex-row items-center gap-6 p-6 bg-white rounded-3xl border transition-all cursor-pointer ${
                        isCompleted ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/50'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${
                        isCompleted ? 'bg-emerald-500 text-white' : 
                        taskType === 'video' ? 'bg-rose-100 text-rose-600' : 
                        taskType === 'reading' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {isCompleted ? <Check size={28} strokeWidth={3} /> : (taskType === 'video' ? <Video size={28} /> : taskType === 'reading' ? <FileText size={28} /> : <BrainCircuit size={28} />)}
                      </div>

                      <div className="flex-1 min-w-0 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                          <h4 className={`font-black text-lg ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</h4>
                          <span className={`self-center md:self-auto text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-tighter ${diffColor}`}>
                            {task.metadata?.difficulty || 'Standard'}
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed line-clamp-2 ${isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>{task.description}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                         <div className="hidden md:block text-right">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.metadata?.duration || '15 min'}</p>
                           <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{task.metadata?.topic || 'General'}</p>
                         </div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                            className={`p-3 rounded-2xl transition-all ${
                              isCompleted ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white'
                            }`}
                         >
                            {isCompleted ? <RotateCcw size={20} /> : <CheckCircle2 size={20} />}
                         </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><BookOpen size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedTask.title}</h3>
                  <p className="text-indigo-500 text-xs uppercase font-black tracking-[0.2em]">{selectedTask.type}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-8">
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-inner">
                 <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
                   <Sparkles size={16} className="text-indigo-500" /> {language === 'zh' ? '任务指南' : 'Mission Brief'}
                 </h4>
                 <p className="text-slate-600 leading-relaxed text-lg italic">{selectedTask.description}</p>
               </div>
               <div className="grid grid-cols-3 gap-6">
                 <div className="p-6 rounded-2xl bg-slate-50 text-center space-y-2">
                   <Clock size={20} className="mx-auto text-indigo-400" />
                   <p className="text-[10px] font-black text-slate-400 uppercase">{language === 'zh' ? '建议时长' : 'Duration'}</p>
                   <p className="font-black text-slate-800">{selectedTask.metadata?.duration || '20m'}</p>
                 </div>
                 <div className="p-6 rounded-2xl bg-slate-50 text-center space-y-2">
                   <BarChart size={20} className="mx-auto text-amber-400" />
                   <p className="text-[10px] font-black text-slate-400 uppercase">{language === 'zh' ? '难度系数' : 'Difficulty'}</p>
                   <p className="font-black text-slate-800">{selectedTask.metadata?.difficulty || 'Medium'}</p>
                 </div>
                 <div className="p-6 rounded-2xl bg-slate-50 text-center space-y-2">
                   <ListChecks size={20} className="mx-auto text-emerald-400" />
                   <p className="text-[10px] font-black text-slate-400 uppercase">{language === 'zh' ? '核心主题' : 'Topic'}</p>
                   <p className="font-black text-slate-800 truncate">{selectedTask.metadata?.topic || 'Core'}</p>
                 </div>
               </div>
            </div>
            <div className="p-10 bg-slate-50 flex gap-4">
               <button onClick={() => setSelectedTask(null)} className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                 {language === 'zh' ? '开始执行任务' : 'Accept Mission'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningHub;
