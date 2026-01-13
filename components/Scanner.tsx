
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { HomeworkTask, GradingResult } from '../types';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, X, ChevronRight } from 'lucide-react';

interface Props {
  tasks: HomeworkTask[];
  onUpdateTask: (task: HomeworkTask) => void;
}

const Scanner: React.FC<Props> = ({ tasks, onUpdateTask }) => {
  const [selectedTask, setSelectedTask] = useState<HomeworkTask | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<GradingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processGrading = async () => {
    if (!image || !selectedTask) return;
    setIsScanning(true);
    try {
      const base64Data = image.split(',')[1];
      const res = await geminiService.gradeSubmission(base64Data, selectedTask.content);
      
      // 更新本地展示状态
      setResult(res);

      // 同步更新到全局 tasks，实现持久化
      onUpdateTask({
        ...selectedTask,
        status: 'graded',
        result: res
      });
    } catch (error) {
      console.error("Grading failed", error);
    } finally {
      setIsScanning(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">Grading Analysis</h1>
          <button onClick={() => { setResult(null); setSelectedTask(null); setImage(null); }} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium">
            <X size={20} /> Done & Exit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
            <p className="text-slate-500 text-sm font-semibold mb-2">FINAL SCORE</p>
            <div className="text-6xl font-black text-indigo-600 mb-2">
              {result.score}<span className="text-2xl text-slate-300">/{result.totalScore}</span>
            </div>
            <div className="bg-indigo-50 text-indigo-700 py-1 px-3 rounded-full text-xs font-bold inline-block">
              {((result.score / (result.totalScore || 100)) * 100).toFixed(0)}% ACCURACY
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20} /> Key Strengths
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.strengths?.map((s, i) => (
                <li key={i} className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{s}</li>
              ))}
            </ul>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 pt-2">
              <AlertCircle className="text-rose-500" size={20} /> Areas to Improve
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.weaknesses?.map((w, i) => (
                <li key={i} className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{w}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Knowledge Point Breakdown</h2>
          <div className="space-y-6">
            {result.knowledgePoints?.map((kp, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-700">{kp.point}</span>
                  <span className={kp.mastery > 70 ? 'text-emerald-600' : 'text-rose-600'}>{kp.mastery}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      kp.mastery > 70 ? 'bg-emerald-500' : kp.mastery > 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`} 
                    style={{ width: `${kp.mastery}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button onClick={() => { setResult(null); setSelectedTask(null); setImage(null); }} className="px-6 py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-colors">
            Exit
          </button>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-colors">
            View Learning Plan <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">AI Homework Scanner</h1>
        <p className="text-slate-500 mt-2">Submit your completed work for instant grading and gap analysis.</p>
      </header>

      {!selectedTask ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Select an Assignment to Grade</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tasks.filter(t => t.status === 'pending').map(task => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="text-left p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all group"
              >
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{task.subject}</span>
                <h3 className="font-bold text-slate-800 mt-1 mb-2 group-hover:text-indigo-900">{task.content}</h3>
                <p className="text-xs text-slate-400">Due {task.deadline}</p>
              </button>
            ))}
            {tasks.filter(t => t.status === 'pending').length === 0 && (
              <div className="col-span-2 py-12 text-center text-slate-400 font-medium">
                No pending assignments to grade.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-lg font-bold">
                {selectedTask.subject[0]}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{selectedTask.subject}</h4>
                <p className="text-xs text-slate-500">{selectedTask.content}</p>
              </div>
            </div>
            <button onClick={() => { setSelectedTask(null); setImage(null); }} className="text-slate-400 hover:text-rose-500 transition-colors p-2">
              <X size={20} />
            </button>
          </div>

          {!image ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-white border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <Upload size={32} />
                </div>
                <span className="font-bold">Upload Photo</span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </button>

              <button className="aspect-square bg-white border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all group opacity-50 cursor-not-allowed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                  <Camera size={32} />
                </div>
                <span className="font-bold">Scan via Camera</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">(Desktop Sim Mode)</span>
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                <img src={image} alt="Submission" className="max-h-full object-contain" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 bg-slate-900/50 hover:bg-slate-900 text-white p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <button
                onClick={processGrading}
                disabled={isScanning}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:bg-slate-300"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>AI Analyzing Handwriting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={24} />
                    <span>Start AI Grading</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Scanner;
