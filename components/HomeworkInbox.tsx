
import React, { useState, useRef, useMemo } from 'react';
import { apiService } from '../services/apiService';
import { HomeworkTask, Subject, AssignmentCategory, EventNode, UserProfile } from '../types';
import { MessageSquare, Send, Bot, Loader2, Plus, ArrowRight, X, Calendar as CalendarIcon, Tag, Upload, Sparkles, Type as TypeIcon, ChevronDown, ChevronUp, Layers, CheckCircle } from 'lucide-react';
import { useTranslation } from '../i18n';
import { settingsService } from '../services/settingsService';

interface Props {
  onNewTask: (task: HomeworkTask) => void;
  user?: UserProfile | null;
}

const HomeworkInbox: React.FC<Props> = ({ onNewTask, user }) => {
  const { t, language } = useTranslation();
  const settings = settingsService.getSettings();
  
  // Filter events based on the user's current school
  const currentSchool = settings.schools.find(s => s.name === user?.school);
  const eventNodes = useMemo(() => {
    if (!currentSchool) return settings.eventNodes;
    return settings.eventNodes.filter(n => n.schoolId === currentSchool.id);
  }, [settings.eventNodes, currentSchool]);

  const [messages, setMessages] = useState([
    { id: '1', sender: 'Teacher Li', text: 'Class 101, math homework is page 45-46. Due Friday.', time: '10:05 AM', group: 'School Group 101' },
    { id: '2', sender: 'Science Dept', text: 'Physics lab report draft must be submitted by tonight.', time: '11:20 AM', group: 'Science Lab' },
  ]);
  const [parsingId, setParsingId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [isImageParsing, setIsImageParsing] = useState(false);
  const [manualImage, setManualImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [manualTask, setManualTask] = useState({
    title: '',
    subject: Subject.MATH,
    category: eventNodes[0]?.name || 'Homework',
    content: '',
    deadline: ''
  });

  const handleParse = async (msg: typeof messages[0]) => {
    setParsingId(msg.id);
    try {
      const result = await apiService.extractHomeworkFromMessage(msg.text, language);
      
      let matchedCategory = eventNodes[0]?.name || 'Homework';
      const aiCat = result.category?.toLowerCase() || '';
      const matchedNode = eventNodes.find(n => aiCat.includes(n.name.toLowerCase()) || n.name.toLowerCase().includes(aiCat));
      if (matchedNode) matchedCategory = matchedNode.name;

      const newTask: HomeworkTask = {
        id: Math.random().toString(36).substr(2, 9),
        title: result.title || (language === 'zh' ? '新消息任务' : 'New Message Task'),
        source: msg.group,
        subject: result.subject as Subject || Subject.MATH,
        category: matchedCategory,
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

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setManualImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageExtract = async () => {
    if (!manualImage) return;
    setIsImageParsing(true);
    try {
      const base64Data = manualImage.split(',')[1];
      const result = await apiService.extractHomeworkFromImage(base64Data, language);
      
      let matchedCategory = manualTask.category;
      const aiCat = result.category?.toLowerCase() || '';
      const matchedNode = eventNodes.find(n => aiCat.includes(n.name.toLowerCase()) || n.name.toLowerCase().includes(aiCat));
      if (matchedNode) matchedCategory = matchedNode.name;

      setManualTask(prev => ({
        ...prev,
        title: result.title || prev.title,
        subject: (result.subject as Subject) || prev.subject,
        category: matchedCategory,
        content: result.content || prev.content,
        deadline: result.deadline || prev.deadline
      }));
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
      title: manualTask.title || (language === 'zh' ? '手动录入作业' : 'Manual Entry'),
      source: 'Manual Entry',
      subject: manualTask.subject,
      category: manualTask.category,
      content: manualTask.content,
      deadline: manualTask.deadline,
      status: 'pending',
      timestamp: Date.now(),
      submissionImage: manualImage || undefined
    };

    onNewTask(newTask);
    setShowManualForm(false);
    setManualTask({ title: '', subject: Subject.MATH, category: eventNodes[0]?.name || 'Homework', content: '', deadline: '' });
    setManualImage(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('inbox_title')}</h1>
          <p className="text-slate-500 mt-2">{t('inbox_desc')}</p>
        </div>
        <button onClick={() => setShowManualForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
          <Plus size={20} /> {t('add_manual')}
        </button>
      </header>

      {showManualForm && (
        <div className="bg-white rounded-[2.5rem] border-2 border-indigo-100 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Plus className="text-indigo-600" size={24} /> {t('create_new')}
            </h2>
            <button onClick={() => { setShowManualForm(false); setManualImage(null); }} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
          </div>
          
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'zh' ? '作业标题' : 'Title'}</label>
                <div className="relative"><input type="text" placeholder="Unit 5 exercise..." value={manualTask.title} onChange={e => setManualTask({...manualTask, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-500" /><TypeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /></div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('due_date')}</label>
                <div className="relative"><input type="date" required value={manualTask.deadline} onChange={e => setManualTask({...manualTask, deadline: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-500" /><CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('subject')}</label>
                <select value={manualTask.subject} onChange={e => setManualTask({...manualTask, subject: e.target.value as Subject})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500">
                  {Object.values(Subject).map(s => <option key={s} value={s}>{t(s)}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('category')}</label>
                <select value={manualTask.category} onChange={e => setManualTask({...manualTask, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600">
                  {eventNodes.length > 0 ? eventNodes.map(node => <option key={node.id} value={node.name}>{node.name}</option>) : <option value="Homework">Homework</option>}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'zh' ? '任务附件 / 扫描件' : 'Attachment'}</label>
              <div className="flex gap-4">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                  {manualImage ? <img src={manualImage} className="w-full h-full object-cover rounded-2xl" alt="" /> : <><Upload size={24} /><span className="text-[10px] font-black uppercase">{t('upload_photo')}</span></>}
                </button>
                {manualImage && (
                  <button type="button" onClick={handleImageExtract} disabled={isImageParsing} className="w-32 bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center justify-center gap-2 font-black text-[10px] hover:bg-indigo-100 transition-all">
                    {isImageParsing ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />} {t('ai_extract')}
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleManualFileChange} className="hidden" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('details')}</label>
              <textarea required value={manualTask.content} onChange={e => setManualTask({...manualTask, content: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => { setShowManualForm(false); setManualImage(null); }} className="flex-1 py-4 font-black text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">{t('cancel')}</button>
              <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">{t('add_btn')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Message Inbox */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><MessageSquare size={18} /></div>
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{language === 'zh' ? '学校群聊任务' : 'Group Chat Tasks'}</h3>
          </div>
          <span className="text-[10px] font-black bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-400 uppercase tracking-tighter">{messages.length} Pending</span>
        </div>

        <div className="divide-y divide-slate-100">
          {messages.length > 0 ? messages.map((msg) => (
            <div key={msg.id} className="p-8 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-slate-50/50 transition-colors group">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800 text-sm leading-none">{msg.sender}</span>
                  <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">{msg.group}</span>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl text-slate-600 italic leading-relaxed text-sm">"{msg.text}"</div>
              </div>
              <button onClick={() => handleParse(msg)} disabled={!!parsingId} className="w-full md:w-auto shrink-0 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 flex items-center justify-center gap-2 transition-all">
                {parsingId === msg.id ? <Loader2 className="animate-spin" size={20} /> : <Bot size={20} />}
                {t('ai_extract')}
              </button>
            </div>
          )) : (
            <div className="p-20 text-center opacity-40">
               <div className="p-6 bg-slate-100 rounded-full inline-block mb-4"><CheckCircle size={40} className="text-slate-400" /></div>
               <p className="font-bold text-slate-500 uppercase text-xs tracking-widest">Inbox is clear</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeworkInbox;
