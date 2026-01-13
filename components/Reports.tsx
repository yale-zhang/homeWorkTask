
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  BarChart, Bar, Cell
} from 'recharts';
import { Download, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

const weeklyData = [
  { name: 'Mon', score: 82, completion: 90 },
  { name: 'Tue', score: 85, completion: 80 },
  { name: 'Wed', score: 78, completion: 100 },
  { name: 'Thu', score: 92, completion: 85 },
  { name: 'Fri', score: 88, completion: 95 },
  { name: 'Sat', score: 95, completion: 70 },
  { name: 'Sun', score: 90, completion: 60 },
];

const knowledgeData = [
  { subject: 'Algebra', A: 90, fullMark: 100 },
  { subject: 'Geometry', A: 65, fullMark: 100 },
  { subject: 'Physics', A: 85, fullMark: 100 },
  { subject: 'Literature', A: 95, fullMark: 100 },
  { subject: 'History', A: 70, fullMark: 100 },
];

const Reports: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Weekly Performance</h1>
          <p className="text-slate-500 mt-2">Aggregated data from March 4 - March 10, 2024</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            <Calendar size={18} /> Last 7 Days
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors">
            <Download size={18} /> Export PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Chart */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Score vs. Completion Trend</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Avg Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Completion</span>
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
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="completion" stroke="#10b981" strokeWidth={4} strokeDasharray="5 5" dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Knowledge Radar */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <h3 className="font-bold text-slate-800 mb-6 text-center">Skill Proficiency Map</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={knowledgeData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                <Radar name="Student Proficiency" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                <Legend iconType="circle" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Time Spent</p>
            <h4 className="text-2xl font-black text-slate-800">14.5 hrs</h4>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
            <ArrowDown size={14} /> 5% <span className="text-slate-400 font-normal ml-1">vs last week</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Mistake Rate</p>
            <h4 className="text-2xl font-black text-slate-800">12%</h4>
          </div>
          <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-full text-xs font-bold">
            <ArrowUp size={14} /> 2% <span className="text-slate-400 font-normal ml-1">vs last week</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Peer Rank</p>
            <h4 className="text-2xl font-black text-slate-800">Top 5%</h4>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
             Steady
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl">
        <h3 className="font-bold text-lg text-slate-800 mb-4">Strategic Recommendation</h3>
        <p className="text-slate-600 leading-relaxed italic">
          "Based on your 14.5 hours of focus, your efficiency in Mathematics has peaked, but Science lab reports are showing a delay in submission. We recommend allocating 30 minutes earlier to Science drafting on Tuesdays to balance your workload."
        </p>
      </div>
    </div>
  );
};

export default Reports;
