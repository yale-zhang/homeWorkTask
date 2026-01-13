
import React from 'react';
import { HomeworkTask } from '../types';
import { Clock, CheckCircle2, AlertCircle, ArrowUpRight, BarChart3 } from 'lucide-react';

interface Props {
  tasks: HomeworkTask[];
}

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <span className="text-emerald-500 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
        <ArrowUpRight size={14} /> +12%
      </span>
    </div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
  </div>
);

const Dashboard: React.FC<Props> = ({ tasks }) => {
  const pending = tasks.filter(t => t.status === 'pending').length;
  const graded = tasks.filter(t => t.status === 'graded').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, Alex! 👋</h1>
        <p className="text-slate-500 mt-2">You have {pending} assignments to complete this week.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Pending Tasks" value={pending.toString()} icon={Clock} color="bg-amber-500" />
        <StatCard label="Completed" value={graded.toString()} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard label="Avg Score" value="88%" icon={BarChart3} color="bg-indigo-500" />
        <StatCard label="Knowledge Gaps" value="4" icon={AlertCircle} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Recent Assignments</h2>
            <button className="text-indigo-600 text-sm font-semibold hover:underline">View All</button>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {tasks.length > 0 ? tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                  {task.subject[0]}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800">{task.subject}</h4>
                  <p className="text-sm text-slate-500 line-clamp-1">{task.content}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    task.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {task.status}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">Due {task.deadline}</p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-500">
                No active assignments. Check your inbox!
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Learning Tips</h2>
          <div className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Focus on Calculus</h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                Your last 3 assignments show a trend in integration errors. Try the recommended video lesson in your Learning Hub.
              </p>
              <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors">
                Start Review
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
