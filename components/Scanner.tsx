
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HomeworkTask, GradingResult, AssignmentCategory } from '../types';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, X, ChevronRight, FileText, Eye, Tag, Info, Trophy, Target, Zap, Sparkles, Image as ImageIcon, History, ListFilter, Search, Layers, FileSearch, Quote } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Props {
  tasks: HomeworkTask[];
  onGradeTask: (taskId: string) => void;
  onBatchGrade: (taskIds: string[]) => void;
}

const Scanner: React.FC<Props> = ({ tasks, onGradeTask, onBatchGrade }) => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { t, language } = useTranslation();
  const [selectedTask, setSelectedTask] = useState<HomeworkTask | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'processing');
  const gradedTasks = tasks.filter(t => t.status === 'graded').sort((a, b) => b.timestamp - a.timestamp);

  // Sync selectedTask with URL parameter
  useEffect(() => {
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        if (task.status === 'graded') {
          setSelectedTask(task);
          setActiveTab('history');
        } else {
          setSelectedTask(null);
          setActiveTab('pending');
        }
      }
    } else {
      setSelectedTask(null);
    }
  }, [taskId, tasks]);

  const getCategoryColor = (category: AssignmentCategory) => {
    switch (category) {
      case AssignmentCategory.MAJOR_GRADE: return 'bg-rose-100 text-rose-700 border-rose-200';
      case AssignmentCategory.QUIZ: return 'bg-amber-100 text-amber-700 border-amber-200';
      case AssignmentCategory.HOMEWORK: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case AssignmentCategory.PRACTICE: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleGrade = (task: HomeworkTask) => {
    if (task.status === 'processing') return;
    if (task.status === 'graded') {
      navigate(`/scanner/${task.id}`);
      return;
    }
    if (!task.submissionImage) {
      alert(language === 'zh' ? '请先上传作业图片' : 'Please upload a submission image first');
      return;
    }
    onGradeTask(task.id);
  };

  const handleBatch = () => {
    const toGrade = pendingTasks.filter(t => t.status === 'pending' && t.submissionImage).map(t => t.id);
    if (toGrade.length === 0) return;
    onBatchGrade(toGrade);
  };

  const handleBackToList = () => {
    navigate('/scanner');
  };

  // If we're looking at a specific graded task's results
  if (selectedTask && selectedTask.status === 'graded' && selectedTask.result) {
    const result = selectedTask.result;
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 text-white p-2 rounded-xl"><History size={20} /></div>
             <div>
               <h1 className="text-3xl font-bold text-slate-900">{selectedTask.title}</h1>
               <p className="text-slate-500 text-sm">{t(selectedTask.subject)} • {t(selectedTask.category)}</p>
             </div>
          </div>
          <button 
            onClick={handleBackToList} 
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <X size={20} /> {language === 'zh' ? '返回列表' : 'Back to List'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Image & Score */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="flex items-center gap-2 mb-3 px-2">
                 <ImageIcon size={16} className="text-indigo-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{language === 'zh' ? '原始手稿' : 'Original Work'}</span>
               </div>
               <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative group">
                  <img 
                    src={selectedTask.submissionImage} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    alt="Submission" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold border border-white/30">{language === 'zh' ? '查看原图' : 'View Full Image'}</button>
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-sm relative overflow-hidden flex flex-col justify-center items-center">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
              <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">{t('final_score')}</p>
              <div className="text-7xl font-black text-indigo-600 mb-2">{result.score}<span className="text-2xl text-slate-300">/{result.totalScore}</span></div>
              <div className="mt-4 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-tighter">
                {result.score / result.totalScore >= 0.9 ? 'Outstanding' : result.score / result.totalScore >= 0.7 ? 'Great Progress' : 'Needs Review'}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Analysis */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-black text-slate-900 flex items-center gap-2 mb-4 uppercase text-sm tracking-widest">
                    <CheckCircle2 className="text-emerald-500" size={18} /> {t('strengths')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.strengths?.map((s, i) => (
                      <span key={i} className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 flex items-center gap-2 mb-4 uppercase text-sm tracking-widest">
                    <AlertCircle className="text-rose-500" size={18} /> {t('weaknesses')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.weaknesses?.map((w, i) => (
                      <span key={i} className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {result.detailedFeedback && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="font-black text-slate-900 flex items-center gap-2 mb-4 uppercase text-sm tracking-widest">
                    <Quote className="text-indigo-500" size={18} /> {language === 'zh' ? 'AI 详细评语' : 'AI Feedback'}
                  </h3>
                  <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 italic text-slate-600 leading-relaxed">
                    {result.detailedFeedback}
                  </div>
                </div>
              )}

              {result.extractedText && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="font-black text-slate-900 flex items-center gap-2 mb-4 uppercase text-sm tracking-widest">
                    <FileSearch className="text-amber-500" size={18} /> {t('transcript')}
                  </h3>
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 font-mono text-sm text-slate-500 max-h-48 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                    {result.extractedText}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700"><Sparkles size={120} /></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="max-w-xl">
                     <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Target className="text-indigo-400" /> AI 学习计划已就绪</h3>
                     <p className="text-slate-400 text-sm leading-relaxed">基于本次作业发现的漏洞，AI 已为你量身定制了一套提升方案。点击查看如何针对性突破。</p>
                  </div>
                  <button onClick={() => navigate('/learning')} className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 hover:bg-indigo-500 active:scale-95 transition-all">
                    {t('view_plan')} <ChevronRight size={20} />
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('scanner_title')}</h1>
          <p className="text-slate-500 mt-2">{t('scanner_desc')}</p>
        </div>
        {activeTab === 'pending' && pendingTasks.some(t => t.status === 'pending' && t.submissionImage) && (
          <button 
            onClick={handleBatch}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <Layers size={18} /> {t('batch_grade')}
          </button>
        )}
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
          <button onClick={() => setActiveTab('pending')} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <ListFilter size={18} /> {language === 'zh' ? '待批改' : 'To Grade'} 
            {pendingTasks.filter(t => t.status === 'pending').length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white font-black">{pendingTasks.filter(t => t.status === 'pending').length}</span>}
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <History size={18} /> {language === 'zh' ? '批改历史' : 'History'} 
          </button>
        </div>

        <div className="p-8">
          {(activeTab === 'pending' ? pendingTasks : gradedTasks).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activeTab === 'pending' ? pendingTasks : gradedTasks).map(task => (
                <button 
                  key={task.id} 
                  onClick={() => handleGrade(task)} 
                  disabled={task.status === 'processing'}
                  className={`text-left p-6 rounded-3xl border-2 transition-all group relative overflow-hidden ${
                    task.status === 'processing' 
                    ? 'border-indigo-600 bg-indigo-50/30' 
                    : 'border-slate-50 bg-slate-50/30 hover:border-indigo-600 hover:bg-indigo-50/50'
                  }`}
                >
                  {task.status === 'processing' && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 animate-[loading_1.5s_infinite]"></div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{t(task.subject)}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${getCategoryColor(task.category)}`}>{t(task.category)}</span>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 group-hover:text-indigo-900 mb-2 truncate pr-6">{task.title}</h3>
                  
                  {task.status === 'processing' ? (
                    <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs animate-pulse">
                      <Loader2 size={14} className="animate-spin" /> {t('processing_tasks')}
                    </div>
                  ) : activeTab === 'history' ? (
                    <div className="mt-4 pt-4 border-t border-slate-100/50 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(task.timestamp).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1.5">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                         <div className="text-xs font-black text-slate-700">{task.result?.score}/{task.result?.totalScore}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs">
                      {task.submissionImage ? <Zap size={14} /> : <AlertCircle size={14} className="text-rose-400" />} 
                      {task.submissionImage ? (language === 'zh' ? '立即批改' : 'Grade Now') : (language === 'zh' ? '等待上传图片' : 'Missing Image')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
               <div className="p-6 bg-slate-100 rounded-full mb-4">
                 <Search size={40} className="text-slate-400" />
               </div>
               <p className="font-bold text-slate-500">{language === 'zh' ? '暂无匹配任务' : 'No tasks found'}</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Scanner;
