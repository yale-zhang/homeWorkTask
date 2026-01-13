
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import { HomeworkTask, GradingResult, AssignmentCategory } from '../types';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, X, ChevronRight, FileText, Eye, Tag, Info, Trophy, Target, Zap, Sparkles, Image as ImageIcon, History, ListFilter } from 'lucide-react';
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
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [activeKPIndex, setActiveKPIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 批改核心逻辑
  const processGrading = useCallback(async (imgToUse: string, taskToUse: HomeworkTask) => {
    if (!imgToUse || !taskToUse) return;
    setIsScanning(true);
    try {
      const base64Data = imgToUse.includes(',') ? imgToUse.split(',')[1] : imgToUse;
      const res = await geminiService.gradeSubmission(base64Data, taskToUse.content, language);
      setResult(res);
      onUpdateTask({
        ...taskToUse,
        status: 'graded',
        result: res
      });
    } catch (error) {
      console.error("Grading failed", error);
    } finally {
      setIsScanning(false);
    }
  }, [language, onUpdateTask]);

  // 当任务被选择时
  useEffect(() => {
    if (!selectedTask) {
      setResult(null);
      setImage(null);
      return;
    }

    if (selectedTask.status === 'graded' && selectedTask.result) {
      // 如果是已批改的记录，直接显示结果
      setResult(selectedTask.result);
      if (selectedTask.submissionImage) setImage(selectedTask.submissionImage);
    } else if (selectedTask.submissionImage && selectedTask.status === 'pending') {
      // 如果有图片但未批改，自动启动
      setImage(selectedTask.submissionImage);
      processGrading(selectedTask.submissionImage, selectedTask);
    }
  }, [selectedTask, processGrading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        setOcrPreview(null);
        if (selectedTask) {
           processGrading(base64, selectedTask);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOcrPreview = async () => {
    if (!image) return;
    setIsOcrLoading(true);
    try {
      const base64Data = image.includes(',') ? image.split(',')[1] : image;
      const text = await geminiService.extractTextFromImage(base64Data, language);
      setOcrPreview(text);
    } catch (error) {
      console.error("OCR failed", error);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const getCategoryColor = (category: AssignmentCategory) => {
    switch (category) {
      case AssignmentCategory.MAJOR_GRADE: return 'bg-rose-100 text-rose-700 border-rose-200';
      case AssignmentCategory.QUIZ: return 'bg-amber-100 text-amber-700 border-amber-200';
      case AssignmentCategory.HOMEWORK: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case AssignmentCategory.PRACTICE: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getMasteryStatus = (mastery: number) => {
    if (mastery >= 85) return { label: 'Mastered', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Trophy, desc: language === 'zh' ? '出色！你已经牢固掌握了这个概念。' : 'Excellent work! You have a solid grasp of this concept.' };
    if (mastery >= 60) return { label: 'Proficient', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Zap, desc: language === 'zh' ? '表现良好，只有一些小错误。' : 'Good progress. A few minor errors were detected.' };
    if (mastery >= 40) return { label: 'Improving', color: 'text-amber-600', bg: 'bg-amber-50', icon: Target, desc: language === 'zh' ? '继续练习。核心逻辑还需要更多关注。' : 'Keep practicing. Some core logic needs more focus.' };
    return { label: 'Needs Focus', color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle, desc: language === 'zh' ? '检测到核心漏洞。建议回顾基础规则。' : 'Critical gaps detected. Consider reviewing the fundamental rules.' };
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const gradedTasks = tasks.filter(t => t.status === 'graded').sort((a, b) => b.timestamp - a.timestamp);

  if (result) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 text-white p-2 rounded-xl">
               <History size={20} />
             </div>
             <h1 className="text-3xl font-bold text-slate-900">{selectedTask?.status === 'graded' ? (language === 'zh' ? '历史批改记录' : 'Historical Record') : t('grading_analysis')}</h1>
          </div>
          <button 
            onClick={() => { setSelectedTask(null); setResult(null); setImage(null); setOcrPreview(null); setActiveKPIndex(null); }} 
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm"
          >
            <X size={20} /> {language === 'zh' ? '返回列表' : 'Back to List'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
            <p className="text-slate-500 text-sm font-semibold mb-2 uppercase tracking-wider relative z-10">{t('final_score')}</p>
            <div className="text-6xl font-black text-indigo-600 mb-2 relative z-10">
              {result.score}<span className="text-2xl text-slate-300">/{result.totalScore}</span>
            </div>
            <div className="bg-indigo-50 text-indigo-700 py-1 px-3 rounded-full text-xs font-bold inline-block relative z-10">
              {((result.score / (result.totalScore || 100)) * 100).toFixed(0)}% {language === 'zh' ? '准确率' : 'ACCURACY'}
            </div>
            {selectedTask?.timestamp && (
              <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">{language === 'zh' ? '批改于' : 'GRADED ON'}: {new Date(selectedTask.timestamp).toLocaleDateString()}</p>
            )}
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20} /> {t('strengths')}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.strengths?.map((s, i) => (
                <li key={i} className="text-sm text-slate-600 bg-emerald-50/30 px-3 py-2 rounded-lg border border-emerald-100/50">{s}</li>
              ))}
            </ul>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 pt-2">
              <AlertCircle className="text-rose-500" size={20} /> {t('weaknesses')}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.weaknesses?.map((w, i) => (
                <li key={i} className="text-sm text-slate-600 bg-rose-50/30 px-3 py-2 rounded-lg border border-rose-100/50">{w}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">{t('breakdown')}</h2>
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
              <Info size={14} /> {language === 'zh' ? '点击查看见解' : 'Click points for insights'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {result.knowledgePoints?.map((kp, i) => (
                <button
                  key={i}
                  onClick={() => setActiveKPIndex(activeKPIndex === i ? null : i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
                    activeKPIndex === i 
                    ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/10' 
                    : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-700">{kp.point}</span>
                    <span className={kp.mastery > 70 ? 'text-emerald-600' : 'text-rose-600'}>{kp.mastery}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-200/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        kp.mastery > 70 ? 'bg-emerald-500' : kp.mastery > 40 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} 
                      style={{ width: `${kp.mastery}%` }}
                    ></div>
                  </div>
                </button>
              ))}
            </div>

            <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl p-6 bg-slate-50/20">
              {activeKPIndex !== null ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full space-y-4">
                  {(() => {
                    const kp = result.knowledgePoints[activeKPIndex];
                    const status = getMasteryStatus(kp.mastery);
                    const StatusIcon = status.icon;
                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${status.bg} ${status.color}`}>
                            <StatusIcon size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{kp.point}</h4>
                            <span className={`text-xs font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>
                          </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                          <p className="text-sm text-slate-600 leading-relaxed italic">
                            "{status.desc}"
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center space-y-2 opacity-50">
                  <Target className="mx-auto text-slate-300" size={40} />
                  <p className="text-sm font-medium text-slate-500">{language === 'zh' ? '选择一个知识点查看详情' : 'Select a knowledge point to see mastery details'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedTask?.submissionImage && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <ImageIcon size={20} className="text-slate-400" /> {language === 'zh' ? '原始作业图片' : 'Original Submission'}
             </h3>
             <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
               <img src={selectedTask.submissionImage} alt="Historical Submission" className="max-h-full object-contain" />
             </div>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button 
            onClick={() => { setSelectedTask(null); setResult(null); setImage(null); setOcrPreview(null); setActiveKPIndex(null); }} 
            className="px-6 py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-colors"
          >
            {language === 'zh' ? '返回列表' : 'Back to List'}
          </button>
          <button 
            onClick={() => navigate('/learning')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            {t('view_plan')} <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">{t('scanner_title')}</h1>
        <p className="text-slate-500 mt-2">{t('scanner_desc')}</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
              activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ListFilter size={18} /> {language === 'zh' ? '待批改任务' : 'To Grade'} 
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'pending' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
              {pendingTasks.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
              activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <History size={18} /> {language === 'zh' ? '历史记录' : 'History'}
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'history' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
              {gradedTasks.length}
            </span>
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeTab === 'pending' ? (
              pendingTasks.length > 0 ? pendingTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="text-left p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all group relative overflow-hidden"
                >
                  {task.submissionImage && (
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 animate-pulse">
                      <ImageIcon size={10} /> {language === 'zh' ? '图片就绪' : 'IMG READY'}
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{t(task.subject)}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryColor(task.category)}`}>
                      {t(task.category)}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 mt-1 mb-2 group-hover:text-indigo-900">{task.content}</h3>
                  <p className="text-xs text-slate-400">{t('due_date')}: {task.deadline}</p>
                </button>
              )) : (
                <div className="col-span-2 py-12 text-center text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="mx-auto mb-3 opacity-20" size={48} />
                  {language === 'zh' ? '目前没有待批改的任务。' : 'No pending assignments to grade.'}
                </div>
              )
            ) : (
              gradedTasks.length > 0 ? gradedTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="text-left p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all group relative"
                >
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-black shadow-sm">
                      {task.result?.score}/{task.result?.totalScore}
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t(task.subject)}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryColor(task.category)}`}>
                      {t(task.category)}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 mt-1 mb-2 group-hover:text-indigo-900 truncate">{task.content}</h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    <span>{new Date(task.timestamp).toLocaleDateString()}</span>
                    <span className="text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">{language === 'zh' ? '查看报告' : 'View Report'} <ChevronRight size={10} /></span>
                  </div>
                </button>
              )) : (
                <div className="col-span-2 py-12 text-center text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <History className="mx-auto mb-3 opacity-20" size={48} />
                  {language === 'zh' ? '暂无批改记录。' : 'No historical records found.'}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {!selectedTask && activeTab === 'pending' && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4">
           <div className="bg-indigo-600 text-white p-2 rounded-lg">
             <Zap size={20} />
           </div>
           <div>
             <h4 className="font-bold text-indigo-900">{language === 'zh' ? '快速提示' : 'Quick Tip'}</h4>
             <p className="text-sm text-indigo-700 leading-relaxed mt-1">
               {language === 'zh' ? '在“作业采集”中上传了图片的作业会在这里显示“图片就绪”。点击后 AI 将立即开始自动分析，无需重复操作。' : 'Assignments with images uploaded in the Inbox will show "IMG READY". AI will start auto-analysis immediately upon clicking.'}
             </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
