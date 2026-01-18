
import React, { useState, useEffect, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { LearningPlan, HomeworkTask, LearningTask } from '../types';
import { BookOpen, Video, FileText, CheckCircle2, Play, ArrowRight, Loader2, Sparkles, AlertCircle, Check, X, Clock, BarChart, ListChecks, RotateCcw, Quote, BrainCircuit, ChevronLeft, ChevronRight, History } from 'lucide-react';
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
  
  const gradedTasks = [...tasks]
    .filter(t => t.status === 'graded' && t.result)
    .sort((a, b) => b.timestamp - a.timestamp);
  
  // 当前正在查看计划所对应的作业 ID，默认为最新一个批改的作业
  const [activeGradedTaskId, setActiveGradedTaskId] = useState<string | null>(gradedTasks[0]?.id || null);

  const activeGradedTask = gradedTasks.find(t => t.id === activeGradedTaskId);

  // 核心：根据 taskId 切换计划
  const loadPlanForTask = useCallback(async (taskId: string) => {
    const userId = localStorage.getItem('intellitask_current_uid');
    if (!userId) return;

    setIsLoading(true);
    setError(null);
    try {
      const plan = await apiService.getPlan(userId, taskId);
      // 如果数据库里有，直接同步到 App 状态
      onUpdatePlan(plan);
    } catch (err) {
      console.error("Failed to load specific plan", err);
      setError(language === 'zh' ? '加载计划失败' : 'Failed to load plan');
    } finally {
      setIsLoading(false);
    }
  }, [onUpdatePlan, language]);

  // 当外部任务列表刷新或主动切换当前作业 ID 时触发
  useEffect(() => {
    if (activeGradedTaskId) {
      // 如果当前保存的计划 ID 不匹配选中的作业 ID，则尝试从库里读
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
      const res = await geminiService.generatePlan(weaknesses, language);
      
      if (!res.focusArea || !res.tasks) {
        throw new Error("Invalid response format from AI");
      }

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
      setError(language === 'zh' ? '学习计划生成失败，请重试' : 'Failed to generate plan, please try again');
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

  if (!activeGradedTaskId && gradedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
          <BookOpen size={40} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{language === 'zh' ? '开启您的自适应学习计划' : 'Start Your Adaptive Plan'}</h2>
          <p className="text-slate-500 mt-2 max-w-xs">{language === 'zh' ? '在 AI 批改中完成一项作业，系统将自动为您生成个性化学习方案。' : 'Complete a grading in the scanner to unlock your personalized roadmap.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-indigo-600" size={20} />
              <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{t('roadmap')}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{t('plan_title')}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchNewPlan} disabled={isLoading || !activeGradedTaskId} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
              <RotateCcw size={16} /> {language === 'zh' ? '刷新计划' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* 作业切换导航栏 */}
        <div className="relative group">
           <div className="flex items-center gap-2 mb-3 text-slate-400">
              <History size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{language === 'zh' ? '选择关联作业进行切换' : 'Switch Associated Assignment'}</span>
           </div>
           <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
             {gradedTasks.map((task) => (
               <button
                key={task.id}
                onClick={() => setActiveGradedTaskId(task.id)}
                className={`flex-shrink-0 px-5 py-3 rounded-2xl border-2 transition-all flex flex-col gap-1 min-w-[160px] relative ${
                  activeGradedTaskId === task.id 
                  ? 'border-indigo-600 bg-indigo-50 shadow-md scale-105 z-10' 
                  : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
               >
                 <span className={`text-[9px] font-black uppercase tracking-tighter ${activeGradedTaskId === task.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                   {t(task.subject)}
                 </span>
                 <span className={`text-sm font-bold truncate w-full ${activeGradedTaskId === task.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                   {task.title}
                 </span>
                 {activeGradedTaskId === task.id && (
                   <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white animate-pulse"></div>
                 )}
               </button>
             ))}
           </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-80 space-y-4">
          <div className="relative">
            <Loader2 className="animate-spin text-indigo-600" size={64} />
            <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={24} />
          </div>
          <div className="text-center">
            <p className="text-slate-900 font-bold text-lg">{language === 'zh' ? '正在为您打造深度学习路径...' : 'Crafting your deep learning roadmap...'}</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-80 space-y-6 text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{error}</h2>
          <button onClick={fetchNewPlan} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2">
            <RotateCcw size={20} /> {language === 'zh' ? '重新尝试' : 'Try Again'}
          </button>
        </div>
      ) : !savedPlan ? (
        <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[2.5rem] p-12 text-center space-y-6">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
             <Sparkles size={40} />
           </div>
           <div>
             <h2 className="text-xl font-bold text-slate-800">{language === 'zh' ? '该作业尚未生成学习计划' : 'No Plan for This Assignment'}</h2>
             <p className="text-slate-500 mt-2 max-w-sm mx-auto">{language === 'zh' ? '点击下方按钮，AI 将根据您在该作业中的具体漏洞定制学习路径。' : 'Click the button below to generate a tailored roadmap based on your performance in this specific task.'}</p>
           </div>
           <button onClick={fetchNewPlan} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-500 transition-all active:scale-95">
             {language === 'zh' ? '立即生成专属计划' : 'Generate Plan Now'}
           </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* 深度分析区域 */}
          {savedPlan.deepAnalysis && (
            <div className="bg-white rounded-3xl border border-indigo-100 p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Quote size={120} className="text-indigo-900" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-indigo-200">AI</div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {language === 'zh' ? '学情深度剖析报告' : 'Deep Performance Analysis'}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{savedPlan.focusArea}</p>
                  </div>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                    {savedPlan.deepAnalysis}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {savedPlan.tasks.map((task, idx) => {
              const isCompleted = !!task.completed;
              const taskType = (task.type || 'exercise').toLowerCase();
              return (
                <div key={task.id || idx} onClick={() => setSelectedTask(task)} className={`bg-white rounded-2xl border cursor-pointer transition-all relative group ${isCompleted ? 'border-emerald-200 bg-emerald-50/20 opacity-80' : 'border-slate-200 p-6 flex flex-col shadow-sm hover:shadow-md hover:border-indigo-200'}`}>
                  {!isCompleted && <div className="p-6 h-full flex flex-col">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${taskType === 'video' ? 'bg-rose-100 text-rose-600' : taskType === 'reading' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {taskType === 'video' ? <Video size={24} /> : taskType === 'reading' ? <FileText size={24} /> : <BrainCircuit size={24} />}
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-slate-800 line-clamp-1">{task.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4">{task.description}</p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{task.metadata?.duration || '15 min'}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${task.metadata?.difficulty === 'Advanced' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
                        {task.metadata?.difficulty || 'Standard'}
                      </span>
                    </div>
                  </div>}

                  {isCompleted && <div className="p-6 h-full flex flex-col items-center justify-center text-center">
                     <div className="bg-emerald-500 text-white p-3 rounded-full mb-4 shadow-lg shadow-emerald-200"><Check size={24} strokeWidth={4} /></div>
                     <h3 className="font-bold text-slate-400">{task.title}</h3>
                     <p className="text-xs text-emerald-600 font-black uppercase mt-1">Mastered</p>
                  </div>}

                  <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }} className={`w-full mt-4 py-3 rounded-b-2xl flex items-center justify-center gap-2 font-bold transition-all ${isCompleted ? 'bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-slate-50 text-slate-800 hover:bg-indigo-600 hover:text-white'}`}>
                    <CheckCircle2 size={18} /> {isCompleted ? (language === 'zh' ? '撤销完成' : 'Undo') : (language === 'zh' ? '标记完成' : 'Done')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><BookOpen size={24} /></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedTask.title}</h3>
                  <p className="text-slate-500 text-sm uppercase font-bold tracking-widest">{selectedTask.type}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                 <h4 className="font-bold text-slate-700 mb-2 italic flex items-center gap-2">
                   <Sparkles size={16} className="text-indigo-500" />
                   {language === 'zh' ? 'AI 学习导师建议' : 'AI Mentor Guidance'}
                 </h4>
                 <p className="text-slate-600 leading-relaxed">{selectedTask.description}</p>
               </div>
               <div className="grid grid-cols-3 gap-4">
                 <div className="p-4 rounded-xl border border-slate-100 text-center">
                   <Clock size={20} className="mx-auto mb-2 text-indigo-400" />
                   <p className="text-[10px] text-slate-400 font-bold uppercase">{language === 'zh' ? '建议时长' : 'Duration'}</p>
                   <p className="font-bold text-slate-800">{selectedTask.metadata?.duration || '20m'}</p>
                 </div>
                 <div className="p-4 rounded-xl border border-slate-100 text-center">
                   <BarChart size={20} className="mx-auto mb-2 text-amber-400" />
                   <p className="text-[10px] text-slate-400 font-bold uppercase">{language === 'zh' ? '挑战等级' : 'Difficulty'}</p>
                   <p className="font-bold text-slate-800">{selectedTask.metadata?.difficulty || 'Medium'}</p>
                 </div>
                 <div className="p-4 rounded-xl border border-slate-100 text-center">
                   <ListChecks size={20} className="mx-auto mb-2 text-emerald-400" />
                   <p className="text-[10px] text-slate-400 font-bold uppercase">{language === 'zh' ? '知识主题' : 'Topic'}</p>
                   <p className="font-bold text-slate-800 truncate">{selectedTask.metadata?.topic || 'Core'}</p>
                 </div>
               </div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
               <button onClick={() => setSelectedTask(null)} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">{language === 'zh' ? '开始执行' : 'Start Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningHub;
