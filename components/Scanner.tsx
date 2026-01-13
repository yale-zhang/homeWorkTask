
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import { HomeworkTask, GradingResult, AssignmentCategory } from '../types';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, X, ChevronRight, FileText, Eye, Tag, Info, Trophy, Target, Zap } from 'lucide-react';

interface Props {
  tasks: HomeworkTask[];
  onUpdateTask: (task: HomeworkTask) => void;
}

const Scanner: React.FC<Props> = ({ tasks, onUpdateTask }) => {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<HomeworkTask | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [activeKPIndex, setActiveKPIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setOcrPreview(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOcrPreview = async () => {
    if (!image) return;
    setIsOcrLoading(true);
    try {
      const base64Data = image.split(',')[1];
      const text = await geminiService.extractTextFromImage(base64Data);
      setOcrPreview(text);
    } catch (error) {
      console.error("OCR failed", error);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const processGrading = async () => {
    if (!image || !selectedTask) return;
    setIsScanning(true);
    try {
      const base64Data = image.split(',')[1];
      const res = await geminiService.gradeSubmission(base64Data, selectedTask.content);
      setResult(res);
      onUpdateTask({
        ...selectedTask,
        status: 'graded',
        result: res
      });
    } catch (error) {
      console.error("Grading failed", error);
      alert("AI Grading failed. Please check your connection or API key.");
    } finally {
      setIsScanning(false);
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
    if (mastery >= 85) return { label: 'Mastered', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Trophy, desc: 'Excellent work! You have a solid grasp of this concept.' };
    if (mastery >= 60) return { label: 'Proficient', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Zap, desc: 'Good progress. A few minor errors were detected.' };
    if (mastery >= 40) return { label: 'Improving', color: 'text-amber-600', bg: 'bg-amber-50', icon: Target, desc: 'Keep practicing. Some core logic needs more focus.' };
    return { label: 'Needs Focus', color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle, desc: 'Critical gaps detected. Consider reviewing the fundamental rules.' };
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-20">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">Grading Analysis</h1>
          <button 
            onClick={() => { setResult(null); setSelectedTask(null); setImage(null); setOcrPreview(null); setActiveKPIndex(null); }} 
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <X size={20} /> Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
            <p className="text-slate-500 text-sm font-semibold mb-2 uppercase tracking-wider">Final Score</p>
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

        {result.extractedText && (
          <div className="bg-amber-50/30 p-8 rounded-2xl border border-amber-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="text-amber-600" size={22} /> Handwriting Transcript
            </h2>
            <div className="bg-white p-6 rounded-xl border border-slate-100 font-mono text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
              {result.extractedText}
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Knowledge Point Breakdown</h2>
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
              <Info size={14} /> Click points for insights
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
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          <span>Real-time Diagnostic</span>
                          <div className="h-px flex-1 bg-slate-100"></div>
                          <span>Targeted Recommendation</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center space-y-2 opacity-50">
                  <Target className="mx-auto text-slate-300" size={40} />
                  <p className="text-sm font-medium text-slate-500">Select a knowledge point to see mastery details</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button 
            onClick={() => { setResult(null); setSelectedTask(null); setImage(null); setOcrPreview(null); setActiveKPIndex(null); }} 
            className="px-6 py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-colors"
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate('/learning')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
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
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{task.subject}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryColor(task.category)}`}>
                    {task.category}
                  </span>
                </div>
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
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-lg font-bold">
                {selectedTask.subject[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800 text-sm">{selectedTask.subject}</h4>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryColor(selectedTask.category)}`}>
                    {selectedTask.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate max-w-[200px]">{selectedTask.content}</p>
              </div>
            </div>
            <button onClick={() => { setSelectedTask(null); setImage(null); setOcrPreview(null); }} className="text-slate-400 hover:text-rose-500 transition-colors p-2">
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
                <span className="font-bold text-lg">Upload Photo</span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </button>

              <button className="aspect-square bg-white border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-400 opacity-60 cursor-not-allowed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                  <Camera size={32} />
                </div>
                <span className="font-bold text-lg">Direct Scan</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">(In Development)</span>
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                <img src={image} alt="Submission" className="max-h-full object-contain" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 bg-slate-900/50 hover:bg-slate-900 text-white p-2 rounded-full transition-colors shadow-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {ocrPreview && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in zoom-in-95">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <FileText size={14} /> AI OCR Detection
                  </h5>
                  <p className="text-sm text-slate-700 font-mono italic">"{ocrPreview}"</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleOcrPreview}
                  disabled={isOcrLoading || isScanning}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  {isOcrLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                  <span>{ocrPreview ? 'Rescan Text' : 'Quick OCR'}</span>
                </button>
                <button
                  onClick={processGrading}
                  disabled={isScanning}
                  className="flex-[2] bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      <span>AI Grading in Progress...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={24} />
                      <span>Grade with Gemini Pro</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Scanner;
