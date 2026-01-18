
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import { HomeworkTask, GradingResult, AssignmentCategory } from '../types';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, X, ChevronRight, FileText, Eye, Tag, Info, Trophy, Target, Zap, Sparkles, Image as ImageIcon, History, ListFilter, Search } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Props {
  tasks: HomeworkTask[];
  onUpdateTask: (task: HomeworkTask) => void;
}

const Scanner: React.FC<Props> = ({ tasks, onUpdateTask }) => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [selectedTask, setSelectedTask] = useState<HomeworkTask | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [scanStep, setScanStep] = useState(0);

  const steps = language === 'zh' 
    ? ['正在识别手写内容...', '分析知识点覆盖率...', '评估解题逻辑...', '生成个性化反馈...']
    : ['Recognizing handwriting...', 'Analyzing knowledge points...', 'Evaluating logic...', 'Generating feedback...'];

  const processGrading = useCallback(async (imgToUse: string, taskToUse: HomeworkTask) => {
    if (!imgToUse || !taskToUse) return;
    setIsScanning(true);
    setScanStep(0);
    
    // 模拟处理步骤
    const stepInterval = setInterval(() => {
      setScanStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);

    try {
      const base64Data = imgToUse.includes(',') ? imgToUse.split(',')[1] : imgToUse;
      const res = await geminiService.gradeSubmission(base64Data, taskToUse.content, language);
      setResult(res);
      onUpdateTask({ ...taskToUse, status: 'graded', result: res });
    } catch (error) {
      console.error("Grading failed", error);
    } finally {
      clearInterval(stepInterval);
      setIsScanning(false);
    }
  }, [language, onUpdateTask, steps.length]);

  useEffect(() => {
    if (!selectedTask) {
      setResult(null);
      setImage(null);
      setIsScanning(false);
      return;
    }
    if (selectedTask.status === 'graded' && selectedTask.result) {
      setResult(selectedTask.result);
      if (selectedTask.submissionImage) setImage(selectedTask.submissionImage);
    } else if (selectedTask.submissionImage && selectedTask.status === 'pending') {
      setImage(selectedTask.submissionImage);
      processGrading(selectedTask.submissionImage, selectedTask);
    }
  }, [selectedTask, processGrading]);

  const getCategoryColor = (category: AssignmentCategory) => {
    switch (category) {
      case AssignmentCategory.MAJOR_GRADE: return 'bg-rose-100 text-rose-700 border-rose-200';
      case AssignmentCategory.QUIZ: return 'bg-amber-100 text-amber-700 border-amber-200';
      case AssignmentCategory.HOMEWORK: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case AssignmentCategory.PRACTICE: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const gradedTasks = tasks.filter(t => t.status === 'graded').sort((a, b) => b.timestamp - a.timestamp);

  // 1. 扫描执行中的 UI (Loading State)
  if (isScanning && selectedTask) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in duration-500">
        <div className="relative w-full max-w-md aspect-[3/4] bg-slate-200 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
          {image ? (
            <img src={image} className="w-full h-full object-cover opacity-60" alt="Scanning" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
              <ImageIcon size={64} className="text-slate-300" />
            </div>
          )}
          
          {/* 动态扫描线 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(79,70,229,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
          
          <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[1px]"></div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center bg-slate-900/40">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-full mb-6">
              <Loader2 className="animate-spin" size={40} />
            </div>
            <h2 className="text-2xl font-black mb-2">{language === 'zh' ? 'AI 正在深度阅卷' : 'AI Grading in Progress'}</h2>
            <div className="h-6 flex items-center">
               <p className="text-indigo-100 font-medium animate-pulse">{steps[scanStep]}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`w-8 h-1.5 rounded-full transition-all duration-500 ${i <= scanStep ? 'bg-indigo-600 w-12' : 'bg-slate-200'}`}></div>
            ))}
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Powered by Google Gemini 2.5 Pro</p>
        </div>

        <style>{`
          @keyframes scan {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
        `}</style>
      </div>
    );
  }

  // 2. 批改结果 UI (Result State)
  if (result && selectedTask) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 text-white p-2 rounded-xl"><History size={20} /></div>
             <div>
               <h1 className="text-3xl font-bold text-slate-900">{selectedTask.title}</h1>
               <p className="text-slate-500 text-sm">{t(selectedTask.subject)} • {t(selectedTask.category)}</p>
             </div>
          </div>
          <button onClick={() => { setSelectedTask(null); setResult(null); setImage(null); }} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <X size={20} /> {language === 'zh' ? '返回列表' : 'Back to List'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-sm relative overflow-hidden group flex flex-col justify-center items-center">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
            <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">{t('final_score')}</p>
            <div className="text-7xl font-black text-indigo-600 mb-2">{result.score}<span className="text-2xl text-slate-300">/{result.totalScore}</span></div>
            <div className="mt-4 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-tighter">
              {result.score / result.totalScore >= 0.9 ? 'Outstanding' : result.score / result.totalScore >= 0.7 ? 'Great Progress' : 'Needs Review'}
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-slate-900 flex items-center gap-2 mb-4 uppercase text-sm tracking-widest">
                <CheckCircle2 className="text-emerald-500" size={18} /> {t('strengths')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.strengths?.map((s, i) => (
                  <span key={i} className="text-sm font-medium text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
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
                  <span key={i} className="text-sm font-medium text-rose-700 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10"><Sparkles size={120} /></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl">
                 <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Target className="text-indigo-400" /> AI 学习计划已就绪</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">基于本次作业发现的漏洞，AI 已为你量身定制了一套提升方案，包含针对性练习和深度解析。</p>
              </div>
              <button onClick={() => navigate('/learning')} className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 hover:bg-indigo-500 active:scale-95 transition-all">
                {t('view_plan')} <ChevronRight size={20} />
              </button>
           </div>
        </div>
      </div>
    );
  }

  // 3. 任务列表 UI (List State)
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('scanner_title')}</h1>
          <p className="text-slate-500 mt-2">{t('scanner_desc')}</p>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
          <button onClick={() => setActiveTab('pending')} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <ListFilter size={18} /> {language === 'zh' ? '待批改' : 'To Grade'} 
            {pendingTasks.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white font-black">{pendingTasks.length}</span>}
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <History size={18} /> {language === 'zh' ? '批改历史' : 'History'} 
          </button>
        </div>

        <div className="p-8">
          {(activeTab === 'pending' ? pendingTasks : gradedTasks).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activeTab === 'pending' ? pendingTasks : gradedTasks).map(task => (
                <button key={task.id} onClick={() => setSelectedTask(task)} className="text-left p-6 rounded-3xl border-2 border-slate-50 bg-slate-50/30 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="text-indigo-600" />
                  </div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{t(task.subject)}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${getCategoryColor(task.category)}`}>{t(task.category)}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 group-hover:text-indigo-900 mb-2 truncate pr-6">{task.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1 italic">"{task.content}"</p>
                  
                  {activeTab === 'history' && (
                    <div className="mt-4 pt-4 border-t border-slate-100/50 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(task.timestamp).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1.5">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                         <div className="text-xs font-black text-slate-700">{task.result?.score}/{task.result?.totalScore}</div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'pending' && (
                    <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs">
                      <Zap size={14} /> {language === 'zh' ? '立即批改' : 'Grade Now'}
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
    </div>
  );
};

export default Scanner;
