
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { HomeworkTask, Subject, AssignmentCategory } from '../types';
import { MessageSquare, Send, Bot, Loader2, Plus, ArrowRight, X, Calendar as CalendarIcon, Tag, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Props {
  onNewTask: (task: HomeworkTask) => void;
}

const HomeworkInbox: React.FC<Props> = ({ onNewTask }) => {
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState([
    { id: '1', sender: 'Teacher Li', text: 'Class 101, math homework is page 45-46. Due Friday.', time: '10:05 AM', group: 'School Group 101' },
    { id: '2', sender: 'Science Dept', text: 'Physics lab report draft must be submitted by tonight.', time: '11:20 AM', group: 'Science Lab' },
  ]);
  const [parsingId, setParsingId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [isImageParsing, setIsImageParsing] = useState(false);
  const [manualImage, setManualImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manual Form State
  const [manualTask, setManualTask] = useState({
    subject: Subject.MATH,
    category: AssignmentCategory.HOMEWORK,
    content: '',
    deadline: ''
  });

  const handleParse = async (msg: typeof messages[0]) => {
    setParsingId(msg.id);
    try {
      const result = await geminiService.extractHomeworkFromMessage(msg.text, language);
      
      const category = mapCategory(result.category);

      const newTask: HomeworkTask = {
        id: Math.random().toString(36).substr(2, 9),
        source: msg.group,
        subject: result.subject as Subject || Subject.MATH,
        category: category,
        content: result.content || msg.text,
        deadline: result.deadline || 'Upcoming',
        status: 'pending',
        timestamp: Date.now(),
      };
      onNewTask(newTask);
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    } catch (error) {
      console.error("Failed to parse", error);
    } finally {
      setParsingId(null);
    }
  };

  const mapCategory = (catStr: string = '') => {
    const extractedCat = catStr.toLowerCase();
    if (extractedCat.includes('major')) return AssignmentCategory.MAJOR_GRADE;
    if (extractedCat.includes('quiz')) return AssignmentCategory.QUIZ;
    if (extractedCat.includes('practice') || extractedCat.includes('daily')) return AssignmentCategory.PRACTICE;
    return AssignmentCategory.HOMEWORK;
  };

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageExtract = async () => {
    if (!manualImage) return;
    setIsImageParsing(true);
    try {
      const base64Data = manualImage.split(',')[1];
      const result = await geminiService.extractHomeworkFromImage(base64Data, language);
      
      setManualTask({
        subject: (result.subject as Subject) || manualTask.subject,
        category: mapCategory(result.category),
        content: result.content || '',
        deadline: result.deadline || ''
      });
    } catch (error) {
      console.error("AI Image Extraction failed", error);
    } finally {
      setIsImageParsing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTask.content || !manualTask.deadline) return;

    const newTask: HomeworkTask = {
      id: Math.random().toString(36).substr(2, 9),
      source: 'Manual Entry',
      subject: manualTask.subject,
      category: manualTask.category,
      content: manualTask.content,
      deadline: manualTask.deadline,
      status: 'pending',
      timestamp: Date.now(),
      submissionImage: manualImage || undefined // 保存上传的图片以便后续自动批改
    };

    onNewTask(newTask);
    setShowManualForm(false);
    setManualTask({ subject: Subject.MATH, category: AssignmentCategory.HOMEWORK, content: '', deadline: '' });
    setManualImage(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('inbox_title')}</h1>
          <p className="text-slate-500 mt-2">{t('inbox_desc')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowManualForm(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Plus size={18} /> {t('add_manual')}
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-semibold border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            {t('active_monitoring')}
          </div>
        </div>
      </header>

      {showManualForm && (
        <div className="bg-white rounded-2xl border-2 border-indigo-100 p-8 shadow-xl shadow-indigo-100/50 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Plus className="text-indigo-600" size={24} /> {t('create_new')}
            </h2>
            <button onClick={() => { setShowManualForm(false); setManualImage(null); }} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleManualSubmit} className="space-y-6">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{language === 'zh' ? '上传任务图片 (AI 识别)' : 'Upload Task Image (AI Extract)'}</label>
              <div className="flex gap-4 items-start">
                <div className="flex-1 relative">
                  {!manualImage ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                    >
                      <Upload size={24} className="group-hover:text-indigo-500" />
                      <span className="text-xs font-bold uppercase">{t('upload_photo')}</span>
                    </button>
                  ) : (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={manualImage} alt="Task Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setManualImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleManualFileChange}
                    className="hidden"
                  />
                </div>
                {manualImage && (
                  <button
                    type="button"
                    onClick={handleImageExtract}
                    disabled={isImageParsing}
                    className="h-32 px-5 bg-indigo-600 text-white rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-indigo-700 transition-colors font-bold disabled:bg-slate-300 shadow-lg shadow-indigo-100"
                  >
                    {isImageParsing ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Sparkles size={24} />
                    )}
                    <span className="text-[10px] uppercase tracking-wider text-center">{t('ai_extract')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('subject')}</label>
                <select 
                  value={manualTask.subject}
                  onChange={(e) => setManualTask({...manualTask, subject: e.target.value as Subject})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  {Object.values(Subject).map(s => (
                    <option key={s} value={s}>{t(s)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('category')}</label>
                <select 
                  value={manualTask.category}
                  onChange={(e) => setManualTask({...manualTask, category: e.target.value as AssignmentCategory})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  {Object.values(AssignmentCategory).map(c => (
                    <option key={c} value={c}>{t(c)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('due_date')}</label>
                <div className="relative">
                  <input 
                    type="date"
                    required
                    value={manualTask.deadline}
                    onChange={(e) => setManualTask({...manualTask, deadline: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t('details')}</label>
              <textarea 
                required
                placeholder={language === 'zh' ? '描述任务内容 (例如：阅读第五章，完成课后习题 1-10)' : 'Describe the task (e.g., Read chapter 5, solve exercises 1-10)'}
                value={manualTask.content}
                onChange={(e) => setManualTask({...manualTask, content: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-h-[120px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => { setShowManualForm(false); setManualImage(null); }}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                type="submit"
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                {t('add_btn')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <MessageSquare size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">{language === 'zh' ? '未处理的消息' : 'Unprocessed Messages'}</span>
          </div>
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
            {messages.length} NEW
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {messages.map((msg) => (
            <div key={msg.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-slate-50/50 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Send size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-800">{msg.sender}</span>
                  <span className="text-[10px] text-slate-400">• {msg.group}</span>
                  <span className="text-[10px] text-slate-400">• {msg.time}</span>
                </div>
                <p className="text-slate-600 italic">"{msg.text}"</p>
              </div>
              <button
                onClick={() => handleParse(msg)}
                disabled={!!parsingId}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-md shadow-indigo-100 disabled:bg-indigo-400"
              >
                {parsingId === msg.id ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Bot size={18} />
                )}
                <span>{t('ai_extract')}</span>
              </button>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Plus size={32} />
              </div>
              <p className="text-slate-500 font-medium">{language === 'zh' ? '消息已全部处理。等待更新...' : 'All messages processed. Waiting for new updates...'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">{language === 'zh' ? '连接已激活' : 'Integration Active'}</h3>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              {language === 'zh' ? 'IntelliTask 当前已连接 4 个学校群。我们会自动标记“作业”、“考试”和“任务”等关键词。' : 'IntelliTask is currently connected to 4 school groups. We automatically flag keywords like "homework", "exam", and "assignment".'}
            </p>
          </div>
          <button className="flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-100 transition-colors whitespace-nowrap">
            {language === 'zh' ? '管理连接器' : 'Manage Connectors'} <ArrowRight size={18} />
          </button>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mb-32 -mr-32 blur-3xl"></div>
      </div>
    </div>
  );
};

export default HomeworkInbox;
