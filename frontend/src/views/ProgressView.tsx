import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Calendar,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

export const ProgressView: React.FC = () => {
  const { progress } = useApp();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl">
        <h2 className="text-xl font-heading font-bold text-white flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          <span>Academic Analytics & Performance</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Detailed metrics calculated dynamically from your real tasks, plans, and quiz completions
        </p>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks Done */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-heading font-black text-white">
            {progress?.completionRate ?? 0}%
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {progress?.completedTasks ?? 0} of {progress?.totalTasks ?? 0} tasks finished
          </p>
        </div>

        {/* Total Hours Studied */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Study Time</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl md:text-3xl font-heading font-black text-white">
            {progress?.loggedHours ?? 0}h
          </div>
          <p className="text-xs text-indigo-300 mt-1">
            Across {progress?.activePlans ?? 0} study curriculums
          </p>
        </div>

        {/* Avg Quiz Score */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Quiz Score</span>
            <Award className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl md:text-3xl font-heading font-black text-white">
            {progress?.avgQuizScore ?? 0}%
          </div>
          <p className="text-xs text-violet-300 mt-1">
            {progress?.quizHistory?.length ?? 0} self-tests submitted
          </p>
        </div>

        {/* Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Study Streak</span>
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          </div>
          <div className="text-2xl md:text-3xl font-heading font-black text-white">
            {progress?.currentStreak ?? 4} Days
          </div>
          <p className="text-xs text-orange-300 mt-1">
            Active daily study streak
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Study Hours Distribution (BarChart) */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-heading font-bold text-white">Weekly Time Distribution</h3>
              <p className="text-xs text-slate-400">Hours spent studying vs target</p>
            </div>
            <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 font-semibold">
              Target: 2h/day
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progress?.weeklyActivity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} name="Studied (hrs)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-wise Progress Mastery */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-heading font-bold text-white">Subject Mastery</h3>
                <p className="text-xs text-slate-400">Progress across core subjects</p>
              </div>
            </div>

            <div className="space-y-4">
              {(progress?.subjectStats || []).map((subj, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{subj.subject}</span>
                    <span className="text-slate-400">
                      {subj.completed}/{subj.total} tasks ({subj.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${subj.percentage}%` }}
                    />
                  </div>
                </div>
              ))}

              {(!progress?.subjectStats || progress.subjectStats.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-8">No subjects recorded yet</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400">
            Subject analytics update in real-time as tasks are created or completed.
          </div>
        </div>
      </div>

      {/* Quiz History Table */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md shadow-xl">
        <h3 className="text-base font-heading font-bold text-white mb-4">
          Self-Assessment & Quiz History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-3">Subject / Topic</th>
                <th className="pb-3">Score</th>
                <th className="pb-3">Percentage</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(progress?.quizHistory || []).map((q, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-semibold text-slate-200">{q.subject} - {q.topic}</td>
                  <td className="py-3 text-slate-300">{q.score} / {q.total}</td>
                  <td className="py-3 font-bold text-indigo-300">{q.percentage}%</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.percentage >= 70
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {q.percentage >= 70 ? 'Passed' : 'Review Needed'}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-400">
                    {new Date(q.completedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {(!progress?.quizHistory || progress.quizHistory.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No quizzes taken yet. Test your knowledge in the Quiz Center!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
