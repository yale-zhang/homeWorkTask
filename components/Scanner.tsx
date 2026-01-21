
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HomeworkTask, EventNode, UserProfile } from '../types';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, X, ChevronRight, FileText, Eye, Tag, Info, Trophy, Target, Zap, Sparkles, Image as ImageIcon, History, ListFilter, Search, Layers, FileSearch, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../i18n';
import { settingsService } from '../services/settingsService';

interface Props {
  tasks: HomeworkTask[];
  onGradeTask: (taskId: string) => void;
  onBatchGrade: (taskIds: string[]) => void;
  user: UserProfile;
}

const Scanner: React.FC<Props> = ({ tasks, onGradeTask, onBatchGrade, user }) => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { t, language } = useTranslation();
  const settings = settingsService.getSettings();
  
  // 获取当前学校定义的事件节点
  const currentSchool = settings.schools.find(s => s.name === user.school);
  const schoolEventNodes = useMemo(() => {
    if (!currentSchool) return [];
    return settings.eventNodes
      .filter(n => n.schoolId === currentSchool.id)
      .sort((a, b) => a.order - b.order);
  }, [settings.eventNodes, currentSchool]);

  const [selectedTask, setSelectedTask] = useState<HomeworkTask | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  
  // 统一管理所有分类的展开/折叠状态
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // 基础过滤：待处理 vs 已批改
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'processing');
  const gradedTasks = tasks.filter(t => t.status === 'graded').sort((a, b) => b.timestamp - a.timestamp);

  // 核心：构建完全一致的分组数据结构
  const groupedTasks = useMemo(() => {
    const currentPool = activeTab === 'pending' ? pendingTasks : gradedTasks;
    const groups: Array<{ name: string; tasks: HomeworkTask[]; isDefault: boolean }> = [];
    
    // 1. 加入学校定义的节点分组
    schoolEventNodes.forEach(node => {
      groups.push({
        name: node.name,
        tasks: currentPool.filter(t => t.category === node.name),
        isDefault: true
      });
    });

    // 2. 收集“其他类型”（不匹配当前学校节点的历史数据）
    const otherTasks = currentPool.filter(t => !schoolEventNodes.some(n => n.name === t.category));
    if (otherTasks.length > 0) {
      groups.push({
        name: language === 'zh' ? '其他分类' : 'Other Categories',
        tasks: otherTasks,
        isDefault: false
      });
    }

    return groups;
  }, [activeTab, pendingTasks, gradedTasks, schoolEventNodes, language]);

  // 当切换页签或数据变化时，默认展开第一个有内容的组
  useEffect(() => {
    const firstNonEmpty = groupedTasks.find(g => g.tasks.length > 0);
    if (firstNonEmpty && Object.keys(expandedNodes).length === 0) {
      setExpandedNodes({ [firstNonEmpty.name]: true });
    }
  }, [activeTab, groupedTasks]);

  useEffect(() => {
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        if (task.status === 'graded') { setSelectedTask(task); setActiveTab('history'); }
        else { setSelectedTask(null); setActiveTab('pending'); }
      }
    } else { setSelectedTask(null); }
  }, [taskId, tasks]);

  const toggleNode = (nodeName: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeName]: !prev[nodeName] }));
  };

  const handleGrade = (task: HomeworkTask) => {
    if (task.status === 'processing') return;
    if (task.status === 'graded') { navigate(`/scanner/${task.id}`); return; }
    if (!task.submissionImage) { alert(language === 'zh' ? '请先上传作业图片' : 'Please upload image first'); return; }
    onGradeTask(task.id);
  };

  // 渲染批改详情页（保持原有逻辑）
  if (selectedTask && selectedTask.status === 'graded' && selectedTask.result) {
    const result = selectedTask.result;
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg"><History size={20} /></div>
             <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedTask.title}</h1>
               <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{t(selectedTask.subject)} • {selectedTask.category}</p>
             </div>
          </div>
          <button onClick={() => navigate('/scanner')} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-sm transition-all"><X size={20} /> {language === 'zh' ? '关闭' : 'Close'}</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"><div className="flex items-center gap-2 mb-3 px-2 text-slate-400 font-black text-[10px] uppercase tracking-widest"><ImageIcon size={14} /> {language === 'zh' ? '手稿' : 'Manuscript'}</div><div className="aspect-[3/4] rounded-3xl overflow-hidden bg-slate-100 border border-slate-100"><img src={selectedTask.submissionImage} className="w-full h-full object-cover" alt="" /></div></div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 text-center shadow-sm flex flex-col items-center relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div><p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{t('final_score')}</p><div className="text-8xl font-black text-slate-900 leading-none">{result.score}<span className="text-2xl text-slate-300">/{result.totalScore}</span></div><div className="mt-8 px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-tighter">{result.score / result.totalScore >= 0.9 ? 'Excellence' : result.score / result.totalScore >= 0.7 ? 'Solid' : 'Retake Advice'}</div></div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div><h3 className="font-black text-slate-900 flex items-center gap-2 mb-4 uppercase text-[10px] tracking-widest"><CheckCircle2 className="text-emerald-500" size={16} /> {t('strengths')}</h3><div className="flex flex-wrap gap-2">{result.strengths?.map((s, i) => ( <span key={i} className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">{s}</span> ))}</div></div>
                <div><h3 className="font-black text-slate-900 flex items-center gap-2 mb-4 uppercase text-[10px] tracking-widest"><AlertCircle className="text-rose-500" size={16} /> {t('weaknesses')}</h3><div className="flex flex-wrap gap-2">{result.weaknesses?.map((w, i) => ( <span key={i} className="text-xs font-bold text-rose-700 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100">{w}</span> ))}</div></div>
              </div>
              <div className="pt-10 border-t border-slate-100"><h3 className="font-black text-slate-900 flex items-center gap-2 mb-4 uppercase text-[10px] tracking-widest"><Quote className="text-indigo-500" size={16} /> Feedback</h3><div className="bg-slate-50 p-8 rounded-3xl text-slate-600 leading-relaxed text-lg italic">"{result.detailedFeedback}"</div></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 列表主视图
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('scanner_title')}</h1>
          <p className="text-slate-500 mt-2">{t('scanner_desc')}</p>
        </div>
        {activeTab === 'pending' && pendingTasks.some(t => t.status === 'pending' && t.submissionImage) && (
          <button onClick={() => onBatchGrade(pendingTasks.filter(t => t.status === 'pending' && t.submissionImage).map(t => t.id))} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2"><Layers size={20} /> {t('batch_grade')}</button>
        )}
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* 页签切换 */}
        <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
          <button onClick={() => setActiveTab('pending')} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <ListFilter size={18} /> {language === 'zh' ? '待批改' : 'Pending'} 
            {pendingTasks.filter(t => t.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white ml-1">{pendingTasks.filter(t => t.status === 'pending').length}</span>
            )}
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <History size={18} /> {language === 'zh' ? '批改历史' : 'History'}
            {/* Fix: Use gradedTasks.length instead of undefined variable gradedCount */}
            {gradedTasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-600 ml-1 font-black">{gradedTasks.length}</span>
            )}
          </button>
        </div>

        {/* 统一分类展示区 */}
        <div className="divide-y divide-slate-100">
          {groupedTasks.map((group) => {
            // 如果历史记录页签下该分类为空，且不是学校定义的预设节点，则隐藏
            if (activeTab === 'history' && group.tasks.length === 0 && !group.isDefault) return null;
            
            const isExpanded = !!expandedNodes[group.name];
            
            return (
              <div key={group.name} className="animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={() => toggleNode(group.name)}
                  className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm ${group.tasks.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                       <Target size={20} />
                     </div>
                     <div className="text-left">
                       <h3 className="font-black text-slate-800 text-sm">{group.name}</h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                         {group.tasks.length} {language === 'zh' ? '项作业' : 'Assignments'}
                       </p>
                     </div>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
                </button>

                {isExpanded && (
                  <div className="px-8 pb-8 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {group.tasks.length > 0 ? group.tasks.map(task => (
                      <button 
                        key={task.id} 
                        onClick={() => handleGrade(task)} 
                        disabled={task.status === 'processing'}
                        className={`text-left p-6 rounded-3xl border-2 transition-all group relative overflow-hidden ${task.status === 'processing' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 bg-slate-50 hover:border-indigo-600 hover:bg-white'}`}
                      >
                        {task.status === 'processing' && <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 animate-[loading_1.5s_infinite]"></div>}
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{t(task.subject)}</span>
                          {activeTab === 'history' && task.result && (
                            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                              <div className={`h-2 w-2 rounded-full ${task.result.score / task.result.totalScore >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                              <span className="text-[10px] font-black text-slate-700">{task.result.score}/{task.result.totalScore}</span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 group-hover:text-indigo-900 mb-2 truncate">{task.title}</h4>
                        
                        {task.status === 'processing' ? (
                          <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs animate-pulse">
                            <Loader2 size={14} className="animate-spin" /> {t('processing_tasks')}
                          </div>
                        ) : activeTab === 'history' ? (
                          <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>{new Date(task.timestamp).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1 text-indigo-600">{language === 'zh' ? '查看详情' : 'Details'} <ChevronRight size={10} /></span>
                          </div>
                        ) : (
                          <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest">
                            {task.submissionImage ? <Zap size={14} /> : <AlertCircle size={14} className="text-rose-400" />}
                            {task.submissionImage ? (language === 'zh' ? '立即批改' : 'Grade Now') : (language === 'zh' ? '待上传图片' : 'Upload Image')}
                          </div>
                        )}
                      </button>
                    )) : (
                      <div className="col-span-full py-10 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300">
                        <Info size={24} className="mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          {activeTab === 'pending' ? (language === 'zh' ? '该分类暂无待办' : 'No pending tasks') : (language === 'zh' ? '该分类暂无历史' : 'No history')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {groupedTasks.every(g => g.tasks.length === 0) && (
             <div className="py-32 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                 <Layers size={40} />
               </div>
               <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                 {activeTab === 'pending' ? (language === 'zh' ? '没有待批改作业' : 'No pending assignments') : (language === 'zh' ? '没有批改记录' : 'No history found')}
               </p>
             </div>
          )}
        </div>
      </div>
      <style>{` @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } `}</style>
    </div>
  );
};

export default Scanner;
