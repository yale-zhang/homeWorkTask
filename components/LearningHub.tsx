
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { LearningPlan, HomeworkTask } from '../types';
import { BookOpen, Video, FileText, CheckCircle2, Play, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  tasks: HomeworkTask[];
}

const LearningHub: React.FC<Props> = ({ tasks }) => {
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Find the most recently graded task to get real weaknesses
  const gradedTasks = [...tasks]
    .filter(t => t.status === 'graded' && t.result)
    .sort((a, b) => b.timestamp - a.timestamp);
  
  const latestGraded = gradedTasks[0];

  useEffect(() => {
    const fetchPlan = async () => {
      setIsLoading(true);
      try {
        const weaknesses = latestGraded?.result?.weaknesses || ['General Review', 'Active Learning'];
        const res = await geminiService.generatePlan(weaknesses);
        setPlan(res);
      } catch (error) {
        console.error("Plan generation failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, [latestGraded?.id]); // Refresh if a new task is graded

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-medium">AI is crafting your tailored study path...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-indigo-600" size={20} />
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Personalized AI Roadmap</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Adaptive Learning Plan</h1>
          {latestGraded ? (
            <p className="text-slate-500 mt-2">
              Based on your <span className="font-semibold text-slate-800">{latestGraded.subject}</span> performance: <span className="text-indigo-600">{plan?.focusArea}</span>
            </p>
          ) : (
            <p className="text-slate-500 mt-2">Start scanning assignments to unlock personalized recommendations.</p>
          )}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          Regenerate Plan
        </button>
      </header>

      {latestGraded?.result?.weaknesses && latestGraded.result.weaknesses.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-rose-500" size={20} />
          <div className="text-sm text-rose-800">
            <span className="font-bold">Focus Areas:</span> {latestGraded.result.weaknesses.join(', ')}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plan?.tasks.map((task, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-sm group hover:shadow-md hover:border-indigo-100 transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
              task.type === 'video' ? 'bg-rose-100 text-rose-600' : 
              task.type === 'exercise' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {task.type === 'video' ? <Video size={24} /> : 
               task.type === 'exercise' ? <FileText size={24} /> : <BookOpen size={24} />}
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{task.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-1">{task.description}</p>
            
            <button className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
              task.type === 'video' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-50 text-slate-800 hover:bg-slate-200'
            }`}>
              {task.type === 'video' ? <Play size={18} /> : <CheckCircle2 size={18} />}
              <span>{task.type === 'video' ? 'Watch Lesson' : 'Complete Exercise'}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md relative shrink-0">
            <div className="text-center">
              <span className="text-4xl font-black">72%</span>
              <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-tighter">Plan Progress</p>
            </div>
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
              <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="452.3" strokeDashoffset="126.6" className="text-white" />
            </svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-3">You're making great progress!</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6 max-w-xl">
              Consistency is key. You've mastered 3 out of 5 core concepts identified recently. Complete these {plan?.tasks.length} targeted actions to reach your weekly milestone.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-xl shadow-indigo-900/20 flex items-center gap-2 hover:bg-indigo-50 transition-colors">
                Continue Last Task <ArrowRight size={18} />
              </button>
              <button className="bg-indigo-500/50 text-white border border-indigo-400/30 px-6 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-colors">
                Achievement Gallery
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
      </div>
    </div>
  );
};

export default LearningHub;
