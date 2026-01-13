
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { LearningPlan, HomeworkTask, LearningTask } from '../types';
import { BookOpen, Video, FileText, CheckCircle2, Play, ArrowRight, Loader2, Sparkles, AlertCircle, Check, X, Clock, BarChart, ListChecks, RotateCcw } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Props {
  tasks: HomeworkTask[];
  savedPlan: LearningPlan | null;
  onUpdatePlan: (plan: LearningPlan | null) => void;
  onAddNotification: (message: string) => void;
}

const TaskDetailModal = ({ task, onClose, onToggleComplete, isCompleted }: { 
  task: LearningTask; 
  onClose: () => void; 
  onToggleComplete: () => void;
  isCompleted: boolean;
}) => {
  const { language } = useTranslation();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`p-8 ${
          task.type === 'video' ? 'bg-rose-50' : 
          task.type === 'exercise' ? 'bg-indigo-50' : 'bg-amber-50'
        }`}>
          <div className="flex justify-between items-start mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              task.type === 'video' ? 'bg-rose-100 text-rose-600' : 
              task.type === 'exercise' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {task.type === 'video' ? <Video size={28} /> : 
               task.type === 'exercise' ? <FileText size={28} /> : <BookOpen size={28} />}
            </div>
            <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{task.title}</h2>
          <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-full ${
            task.type === 'video' ? 'bg-rose-100 text-rose-700' : 
            task.type === 'exercise' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {task.type}
          </span>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-slate-600 leading-relaxed">
            {task.description}
          </p>

          <div className="grid grid-cols-2 gap-4">
            {task.metadata?.duration && (
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                <Clock className="text-slate-400" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{language === 'zh' ? '时长' : 'Duration'}</p>
                  <p className="text-sm font-bold text-slate-700">{task.metadata.duration}</p>
                </div>
              </div>
            )}
            {task.metadata?.readingTime && (
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                <Clock className="text-slate-400" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{language === 'zh' ? '预计用时' : 'Est. Time'}</p>
                  <p className="text-sm font-bold text-slate-700">{task.metadata.readingTime}</p>
                </div>
              </div>
            )}
            {task.metadata?.questionsCount && (
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                <ListChecks className="text-slate-400" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{language === 'zh' ? '题目数量' : 'Questions'}</p>
                  <p className="text-sm font-bold text-slate-700">{task.metadata.questionsCount}</p>
                </div>
              </div>
            )}
            {task.metadata?.difficulty && (
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                <BarChart className="text-slate-400" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{language === 'zh' ? '难度' : 'Difficulty'}</p>
                  <p className="text-sm font-bold text-slate-700">{task.metadata.difficulty}</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              onClick={() => { onToggleComplete(); onClose(); }}
              className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                isCompleted 
                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'
              }`}
            >
              <CheckCircle2 size={20} />
              {isCompleted ? (language === 'zh' ? '已完成' : 'Completed') : (language === 'zh' ? '标记完成' : 'Mark as Done')}
            </button>
            <button className="px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors">
              {task.type === 'video' ? <Play size={20} /> : <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LearningHub: React.FC<Props> = ({ tasks, savedPlan, onUpdatePlan, onAddNotification }) => {
  const { t, language } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LearningTask | null>(null);

  // Find the most recently graded task to get real weaknesses
  const gradedTasks = [...tasks]
    .filter(t => t.status === 'graded' && t.result)
    .sort((a, b) => b.timestamp - a.timestamp);
  
  const latestGraded = gradedTasks[0];

  const fetchNewPlan = async () => {
    setIsLoading(true);
    try {
      const weaknesses = latestGraded?.result?.weaknesses || ['General Review', 'Active Learning'];
      const res = await geminiService.generatePlan(weaknesses, language);
      const newPlan: LearningPlan = {
        ...res,
        createdAt: Date.now()
      };
      onUpdatePlan(newPlan);
      onAddNotification(t('notif_plan_ready', { focus: res.focusArea }));
    } catch (error) {
      console.error("Plan generation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If no plan exists but we have graded tasks, auto-generate first time
    if (!savedPlan && latestGraded) {
      fetchNewPlan();
    }
  }, [latestGraded?.id]);

  const toggleTask = (taskId: string) => {
    if (!savedPlan) return;
    const updatedTasks = savedPlan.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdatePlan({ ...savedPlan, tasks: updatedTasks });
  };

  const totalTasks = savedPlan?.tasks.length || 0;
  const completedCount = savedPlan?.tasks.filter(t => t.completed).length || 0;
  const progressPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // SVG Circular Progress Constants
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercentage / 100) * circumference;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-medium">{language === 'zh' ? 'AI 正在为您精心定制学习路径...' : 'AI is crafting your tailored study path...'}</p>
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
          <h2 className="text-xl font-bold text-slate-800 mb-2">{language === 'zh' ? '暂无学习计划' : 'No Learning Plan Yet'}</h2>
          <p className="text-slate-500 max-w-sm mx-auto">{language === 'zh' ? '首先在“AI 批改”中提交您的作业，AI 将根据您的表现生成专属路径。' : 'Submit your homework in AI Scanner first, and AI will generate a personalized roadmap for you.'}</p>
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
          {latestGraded && (
            <p className="text-slate-500 mt-2">
              {language === 'zh' ? '基于您在' : 'Based on your'} <span className="font-semibold text-slate-800">{t(latestGraded.subject)}</span> {language === 'zh' ? '的表现' : 'performance'}: <span className="text-indigo-600">{savedPlan?.focusArea}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-right mr-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'zh' ? '最后更新时间' : 'LAST UPDATED'}</p>
            <p className="text-xs font-semibold text-slate-600">{savedPlan ? new Date(savedPlan.createdAt).toLocaleString() : 'N/A'}</p>
          </div>
          <button 
            onClick={fetchNewPlan}
            disabled={isLoading}
            className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw size={16} />
            {language === 'zh' ? '重新生成计划' : 'Regenerate Plan'}
          </button>
        </div>
      </header>

      {latestGraded?.result?.weaknesses && latestGraded.result.weaknesses.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-rose-500" size={20} />
          <div className="text-sm text-rose-800">
            <span className="font-bold">{t('focus_areas')}:</span> {latestGraded.result.weaknesses.join(', ')}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {savedPlan?.tasks.map((task, idx) => {
          const isCompleted = !!task.completed;
          return (
            <div 
              key={task.id || idx} 
              onClick={() => setSelectedTask(task)}
              className={`bg-white rounded-2xl border cursor-pointer ${isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'} p-6 flex flex-col shadow-sm group hover:shadow-md hover:border-indigo-200 transition-all relative`}
            >
              {isCompleted && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white p-1 rounded-full animate-in zoom-in duration-300">
                  <Check size={14} strokeWidth={4} />
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                isCompleted ? 'bg-emerald-100 text-emerald-600' :
                task.type === 'video' ? 'bg-rose-100 text-rose-600' : 
                task.type === 'exercise' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {task.type === 'video' ? <Video size={24} /> : 
                 task.type === 'exercise' ? <FileText size={24} /> : <BookOpen size={24} />}
              </div>
              
              <h3 className={`text-lg font-bold mb-2 transition-colors ${isCompleted ? 'text-emerald-900' : 'text-slate-800 group-hover:text-indigo-600'}`}>{task.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1 line-clamp-2">{task.description}</p>
              
              <div className="flex items-center gap-4 mt-auto pt-4 border-t border-slate-50">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {task.type === 'video' ? <Clock size={12} /> : task.type === 'exercise' ? <ListChecks size={12} /> : <Clock size={12} />}
                  <span>
                    {task.metadata?.duration || task.metadata?.readingTime || (task.metadata?.questionsCount ? `${task.metadata.questionsCount} items` : 'N/A')}
                  </span>
                </div>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                className={`w-full mt-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                  isCompleted ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                  'bg-slate-50 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : <CheckCircle2 size={18} />}
                <span>{isCompleted ? (language === 'zh' ? '已完成' : 'Done') : (language === 'zh' ? '标记完成' : 'Complete')}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md relative shrink-0">
            <div className="text-center">
              <span className="text-4xl font-black">{progressPercentage}%</span>
              <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-tighter">{t('plan_progress')}</p>
            </div>
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle 
                cx="80" cy="80" r={radius} 
                stroke="currentColor" strokeWidth="8" fill="transparent" 
                className="text-white/10" 
              />
              <circle 
                cx="80" cy="80" r={radius} 
                stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={circumference} 
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="text-white transition-all duration-700 ease-out" 
              />
            </svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-3">
              {progressPercentage === 100 
                ? (language === 'zh' ? "太棒了！您已完成所有内容！ 🎉" : "Amazing! You've finished everything! 🎉") 
                : (language === 'zh' ? "您正在取得巨大进步！" : "You're making great progress!")}
            </h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6 max-w-xl">
              {progressPercentage === 100 
                ? (language === 'zh' ? "您已成功解决了所有已识别的薄弱点。做得好，保持专注！" : "You have successfully addressed all your identified learning gaps. Great job staying focused!")
                : (language === 'zh' ? `坚持是关键。您已完成 ${totalTasks} 个目标任务中的 ${completedCount} 个。达到 100% 以完全弥补知识漏洞。` : `Consistency is key. You've completed ${completedCount} out of ${totalTasks} targeted actions. Reach 100% to fully bridge your knowledge gaps.`)
              }
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-xl shadow-indigo-900/20 flex items-center gap-2 hover:bg-indigo-50 transition-colors">
                {progressPercentage === 100 ? (language === 'zh' ? "回顾已完成的任务" : "Review Completed Work") : (language === 'zh' ? "继续进度" : "Continue Progress")} <ArrowRight size={18} />
              </button>
              <button className="bg-indigo-500/50 text-white border border-indigo-400/30 px-6 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-colors">
                {language === 'zh' ? "成就馆" : "Achievement Gallery"}
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
      </div>

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onToggleComplete={() => toggleTask(selectedTask.id)}
          isCompleted={!!selectedTask.completed}
        />
      )}
    </div>
  );
};

export default LearningHub;
