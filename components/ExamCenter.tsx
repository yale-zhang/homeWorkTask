
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AcademicEvent, HomeworkTask, EventType, AssignmentCategory, EventNode } from '../types';
import { useTranslation } from '../i18n';
import { geminiService } from '../services/geminiService';
import { settingsService } from '../services/settingsService';
import { Target, Zap, GraduationCap, Clock, Calendar, BrainCircuit, Loader2, CheckCircle2, AlertCircle, TrendingUp, BarChart, ChevronRight, Info, Sparkles } from 'lucide-react';

interface Props {
  tasks: HomeworkTask[];
}

const ExamCenter: React.FC<Props> = ({ tasks }) => {
  const { t, language } = useTranslation();
  const location = useLocation();
  const settings = settingsService.getSettings();
  const [adviceCache, setAdviceCache] = useState<Record<string, { advice: string; loading: boolean }>>({});
  
  // Find current user's school events
  const currentUser = useMemo(() => {
    const uid = localStorage.getItem('intellitask_current_uid');
    // For simplicity, we assume we need to find the user's school. In a real app this is in props.
    return null; // This will be handled by identifying school from settings vs tasks
  }, []);

  const milestones = useMemo(() => {
    // Determine which school to show - ideally passed from App.tsx. 
    // Here we show all events for the first school found in settings as default or if matched.
    const defaultSchool = settings.schools[0];
    if (!defaultSchool) return [];
    
    return settings.eventNodes
      .filter(n => n.schoolId === defaultSchool.id)
      .map(n => ({
        id: n.id,
        type: n.type,
        title: n.name,
        date: 'Upcoming', // In a real app, dates might be in node or specific events
        level: (n.type === EventType.MIDTERM || n.type === EventType.FINAL) ? 'School' : 'Class' as any
      }));
  }, [settings.eventNodes, settings.schools]);

  const handleGenerateAdvice = async (event: any) => {
    if (adviceCache[event.id]?.loading) return;
    setAdviceCache(prev => ({ ...prev, [event.id]: { advice: '', loading: true } }));
    try {
      const prevTasks = tasks.filter(t => t.status === 'graded');
      const advice = await geminiService.generateMilestoneAdvice(event as any, prevTasks, language);
      setAdviceCache(prev => ({ ...prev, [event.id]: { advice, loading: false } }));
    } catch (err) {
      setAdviceCache(prev => ({ ...prev, [event.id]: { advice: 'Failed.', loading: false } }));
    }
  };

  const getEventIcon = (type: EventType) => {
    switch(type) {
      case EventType.HOMEWORK: return <Clock size={24} />;
      case EventType.WEEKLY_QUIZ: return <Target size={24} />;
      case EventType.MONTHLY_TEST: return <Zap size={24} />;
      case EventType.MIDTERM: case EventType.FINAL: return <GraduationCap size={24} />;
      default: return <Calendar size={24} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="bg-rose-600 text-white p-2.5 rounded-2xl shadow-lg shadow-rose-100"><TrendingUp size={28} /></div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('exam_center_title')}</h1>
          </div>
          <p className="text-slate-500 font-medium pl-1">{language === 'zh' ? '基于您自定义学校节点的个性化备考中心' : 'Personalized prep based on your school milestones'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {milestones.map((event) => (
          <div key={event.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col xl:flex-row hover:shadow-xl transition-all duration-500">
             <div className={`p-10 xl:w-80 flex flex-col justify-between ${event.level === 'School' ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}>
               <div>
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${event.level === 'School' ? 'bg-white/20' : 'bg-white text-indigo-600 shadow-slate-200'}`}>
                   {getEventIcon(event.type)}
                 </div>
                 <h3 className="text-2xl font-black mb-2">{event.title}</h3>
                 <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${event.level === 'School' ? 'bg-white/20 text-indigo-100' : 'bg-indigo-100 text-indigo-600'}`}>{t(event.level === 'School' ? 'milestone_school' : 'milestone_class')}</span>
               </div>
             </div>
             <div className="flex-1 p-10 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BrainCircuit size={16} className="text-indigo-500" /> {t('ai_strategy')}</h4>
                  {adviceCache[event.id] ? (
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 italic text-indigo-900 leading-relaxed font-medium">
                      {adviceCache[event.id].loading ? <Loader2 className="animate-spin" /> : adviceCache[event.id].advice}
                    </div>
                  ) : (
                    <button onClick={() => handleGenerateAdvice(event)} className="w-full p-8 border-2 border-dashed border-indigo-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-indigo-500 hover:bg-indigo-50 transition-all group">
                       <Sparkles size={32} className="group-hover:scale-110 transition-transform" />
                       <span className="text-sm font-black uppercase tracking-widest">{t('gen_advice')}</span>
                    </button>
                  )}
                </div>
             </div>
          </div>
        ))}
        {milestones.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300">
             <Info size={48} className="mx-auto mb-4" />
             <p className="font-black uppercase tracking-widest">{language === 'zh' ? '请先在设置中配置学校及学术事件' : 'Configure schools and events in settings first'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamCenter;
