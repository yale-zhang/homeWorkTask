
import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  BarChart, Bar, Cell
} from 'recharts';
import { Download, Calendar, ArrowUp, ArrowDown, Target, AlertTriangle } from 'lucide-react';
import { HomeworkTask } from '../types';
import { useTranslation } from '../i18n';

interface Props {
  tasks: HomeworkTask[];
}

const DEFAULT_RADAR_DATA = [
  { subject: 'Algebra', A: 90, fullMark: 100 },
  { subject: 'Geometry', A: 65, fullMark: 100 },
  { subject: 'Physics', A: 85, fullMark: 100 },
  { subject: 'Literature', A: 95, fullMark: 100 },
  { subject: 'History', A: 70, fullMark: 100 }
];

const Reports: React.FC<Props> = ({ tasks }) => {
  const { t, language } = useTranslation();

  // Process real tasks for radar chart data
  const radarData = useMemo(() => {
    const graded = tasks.filter(t => t.status === 'graded' && t.result);
    if (graded.length === 0) return DEFAULT_RADAR_DATA;

    const subjectStats: Record<string, { total: number, count: number }> = {};
    graded.forEach(t => {
      const subject = t.subject;
      const knowledgePoints = t.result?.knowledgePoints || [];
      if (knowledgePoints.length === 0) return;
      
      const masteryAvg = knowledgePoints.reduce((acc, kp) => acc + kp.mastery, 0) / knowledgePoints.length;
      if (!subjectStats[subject]) subjectStats[subject] = { total: 0, count: 0 };
      subjectStats[subject].total += masteryAvg;
      subjectStats[subject].count += 1;
    });

    return Object.entries(subjectStats).map(([subject, stats]) => ({
      subject, // Keep original key for t() mapping
      A: Math.round(stats.total / stats.count),
      fullMark: 100
    }));
  }, [tasks]);

  // Identify specific knowledge gaps (mastery < 70)
  const knowledgeGaps = useMemo(() => {
    const gaps: Record<string, number> = {};
    tasks.filter(t => t.status === 'graded' && t.result).forEach(t => {
      t.result!.knowledgePoints.forEach(kp => {
        if (kp.mastery < 70) {
          gaps[kp.point] = gaps[kp.point] !== undefined ? Math.min(gaps[kp.point], kp.mastery) : kp.mastery;
        }
      });
    });

    return Object.entries(gaps)
      .map(([name, mastery]) => ({ name, mastery }))
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 5); 
  }, [tasks]);

  const weeklyData = [
    { name: t('Mon'), score: 82, completion: 90 },
    { name: t('Tue'), score: 85, completion: 80 },
    { name: t('Wed'), score: 78, completion: 100 },
    { name: t('Thu'), score: 92, completion: 85 },
    { name: t('Fri'), score: 88, completion: 95 },
    { name: t('Sat'), score: 95, completion: 70 },
    { name: t('Sun'), score: 90, completion: 60 }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('reports_title')}</h1>
          <p className="text-slate-500 mt-2">{t('reports_desc')}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            <Calendar size={18} /> {t('last_7_days')}
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors">
            <Download size={18} /> {t('export_pdf')}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Chart */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">{t('score_completion_trend')}</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-xs font-semibold text-slate-500 uppercase">{t('avg_score_label')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-xs font-semibold text-slate-500 uppercase">{t('completion_label')}</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value, name) => [value + '%', name === 'score' ? t('avg_score_label') : t('completion_label')]}
                />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="completion" stroke="#10b981" strokeWidth={4} strokeDasharray="5 5" dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Knowledge Radar */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">{t('subject_proficiency_map')}</h3>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Target size={20} />
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tickFormatter={(val) => t(val)} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                <Radar name={t('student_proficiency')} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                <Legend iconType="circle" formatter={(value) => t('student_proficiency')} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [value, t('student_proficiency')]}
                  labelFormatter={(label) => t(label)}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Knowledge Gaps Visualization */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{t('critical_gaps')}</h3>
              <p className="text-xs text-slate-500">{t('critical_gaps_desc')}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('diagnostic_level')}</span>
          </div>
        </div>

        <div className="h-[300px]">
          {knowledgeGaps.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={knowledgeGaps} margin={{ left: 40, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={120}
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(val) => [`${val}%`, t('mastery_level')]}
                />
                <Bar dataKey="mastery" radius={[0, 4, 4, 0]} barSize={24}>
                  {knowledgeGaps.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.mastery < 40 ? '#ef4444' : entry.mastery < 60 ? '#f59e0b' : '#6366f1'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
                <Target size={32} />
              </div>
              <div>
                <p className="font-bold text-slate-800">{t('no_critical_gaps')}</p>
                <p className="text-sm text-slate-500 max-w-xs">{t('no_critical_gaps_desc')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{t('time_spent')}</p>
            <h4 className="text-2xl font-black text-slate-800">14.5 {language === 'zh' ? '小时' : 'hrs'}</h4>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
            <ArrowDown size={14} /> 5% <span className="text-slate-400 font-normal ml-1">{t('vs_last_week')}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{t('mistake_rate')}</p>
            <h4 className="text-2xl font-black text-slate-800">12%</h4>
          </div>
          <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-full text-xs font-bold">
            <ArrowUp size={14} /> 2% <span className="text-slate-400 font-normal ml-1">{t('vs_last_week')}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{t('peer_rank')}</p>
            <h4 className="text-2xl font-black text-slate-800">{language === 'zh' ? '前 5%' : 'Top 5%'}</h4>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
             {t('steady')}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl">
        <h3 className="font-bold text-lg text-slate-800 mb-4">{t('strategic_recommendation')}</h3>
        <p className="text-slate-600 leading-relaxed italic">
          {knowledgeGaps.length > 0 
            ? t('recommendation_gap', { gap: knowledgeGaps[0].name })
            : t('recommendation_solid', { hours: 14.5, subject: t(radarData[0]?.subject || 'Mathematics') })}
        </p>
      </div>
    </div>
  );
};

export default Reports;
