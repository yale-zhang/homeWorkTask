
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { LearningPlan, HomeworkTask, LearningTask } from '../types';
import { BookOpen, Video, FileText, CheckCircle2, Play, ArrowRight, Loader2, Sparkles, AlertCircle, Check, X, Clock, BarChart, ListChecks, RotateCcw, Quote, BrainCircuit } from 'lucide-react';
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
  
  const latestGraded = gradedTasks[0];

  const fetchNewPlan = async () => {
    if (!latestGraded) return;
    setIsLoading(true);
    setError(null);
    try {
      const weaknesses = latestGraded.result?.weaknesses || ['General Review'];
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
        sourceTaskId: latestGraded.id, // 关键：记录来源作业 ID
        sourceTaskTitle: latestGraded.title,
        sourceTaskSubject: latestGraded.subject
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

  useEffect(() => {
    // 逻辑：如果没有保存的计划 OR 保存的计划不是针对最新作业生成的
    const needsNewPlan = !savedPlan || (latestGraded && savedPlan.sourceTaskId !== latestGraded.id);
    
    if (needsNewPlan && latestGraded && !isLoading && !error) {
      fetchNewPlan();
    }
  }, [latestGraded?.id, savedPlan?.id, savedPlan?.sourceTaskId]);

  const toggleTask = (taskId: string) => {
    if (!savedPlan) return;
    const updatedTasks = savedPlan.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdatePlan({ ...savedPlan, tasks: updatedTasks });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative">
          <Loader2 className="animate-spin text-indigo-600" size={64} />
          <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={24} />
        </div>
        <div className="text-center">
          <p className="text-slate-900 font-bold text-lg">{language === 'zh' ? '正在为您打造深度学习路径...' : 'Crafting your deep learning roadmap...'}</p>
          <p className="text-slate-400 text-sm mt-1">{language === 'zh' ? 'AI 正在分析您的知识漏洞并匹配最优资源' : 'AI is analyzing your gaps and matching best resources'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
          <AlertCircle size={40} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{error}</h2>
          <p className="text-slate-500 mt-2 max-w-xs">{language === 'zh' ? '可能是由于网络波动或 AI 服务繁忙导致。' : 'This might be due to network issues or service traffic.'}</p>
        </div>
        <button onClick={fetchNewPlan} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2">
          <RotateCcw size={20} /> {language === 'zh' ? '重新尝试' : 'Try Again'}
        </button>
      </div>
    );
  }

  if (!savedPlan && !latestGraded) {
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-indigo-600" size={20} />
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{t('roadmap')}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{t('plan_title')}</h1>
          {savedPlan?.sourceTaskTitle && (
            <p className="text-slate-500 mt-2 bg-indigo-50 px-4 py-2 rounded-xl inline-block border border-indigo-100 shadow-sm">
              {language === 'zh' ? '针对作业：' : 'For Assignment: '}
              <span className="font-bold text-indigo-700">{savedPlan.sourceTaskTitle}</span>
              <span className="mx-2 text-indigo-300">|</span>
              <span className="text-indigo-600 font-semibold">{t(savedPlan.sourceTaskSubject || 'Mathematics')}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={fetchNewPlan} disabled={isLoading || !latestGraded} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
            <RotateCcw size={16} /> {language === 'zh' ? '刷新计划' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* 深度分析区域 */}
      {savedPlan?.deepAnalysis && (
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
        {savedPlan?.tasks.map((task, idx) => {
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
