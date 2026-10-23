import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  CalendarDays,
  Flame,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Award,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    tasks,
    studyPlans,
    progress,
    sendMessage,
    startListening,
    isListening,
    isAssistantThinking,
    toggleTaskComplete,
    setCurrentView
  } = useApp();

  const [promptInput, setPromptInput] = useState('');

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptInput.trim()) {
      sendMessage(promptInput.trim());
      setPromptInput('');
      setCurrentView('assistant');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
    setCurrentView('assistant');
  };

  // Filter today's tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === todayStr);

  const completedToday = todayTasks.filter(t => t.completed).length;
  const totalToday = todayTasks.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Hero Greeting & Prominent AI Prompt Area */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-[#0F172A]/90 to-purple-950/70 border border-indigo-500/20 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        {/* Futuristic background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulated Alexa+ Natural Language Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-white tracking-tight leading-tight">
            Hey there! Ready to make today count?
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-300">
            Your personal AI study companion. Plan schedules, generate custom curriculums, and master complex computer science concepts.
          </p>

          {/* Assistant Prompt Input Box */}
          <form onSubmit={handlePromptSubmit} className="mt-6">
            <div className="relative flex items-center rounded-2xl bg-slate-900/90 border border-indigo-500/40 shadow-inner focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all p-1.5">
              <input
                type="text"
                value={promptInput}
                onChange={e => setPromptInput(e.target.value)}
                placeholder="Ask me: 'Create a 5-day DSA study plan' or 'Remind me to study at 6 PM'..."
                className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none"
              />

              <div className="flex items-center space-x-2 pr-1.5">
                <button
                  type="button"
                  onClick={() => startListening((text) => setPromptInput(text))}
                  className={`p-2.5 rounded-xl transition-all ${
                    isListening
                      ? 'bg-cyan-500 text-slate-950 animate-pulse'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Voice input into prompt box"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={!promptInput.trim() || isAssistantThinking}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-40"
                >
                  <span>Ask StudyMate</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Quick Suggested Prompts */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
              Suggestions:
            </span>
            {[
              'Create a 5-day DSA study plan',
              'Remind me to practice arrays at 6 PM',
              'Quiz me on Java OOP',
              'Plan my daily schedule',
              'Review my progress'
            ].map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(sug)}
                className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-white/5 transition-all hover:border-indigo-500/30"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Key Academic Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasks Completed */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 transition-all backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasks Completed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-heading font-black text-white">
              {progress?.completedTasks ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              of {progress?.totalTasks ?? 0} tasks
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress?.completionRate ?? 0}%` }}
            />
          </div>
        </div>

        {/* Study Time */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 transition-all backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Logged Study</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-heading font-black text-white">
              {progress?.loggedHours ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">hours</span>
          </div>
          <p className="mt-3 text-xs text-indigo-300 font-medium flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Target: 2.0h / day</span>
          </p>
        </div>

        {/* Active Study Plans */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 transition-all backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Plans</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-heading font-black text-white">
              {studyPlans.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">curriculums</span>
          </div>
          <button
            onClick={() => setCurrentView('plans')}
            className="mt-3 text-xs text-purple-300 hover:text-purple-200 font-medium flex items-center space-x-1"
          >
            <span>Browse plans</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Current Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 transition-all backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Study Streak</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-heading font-black text-white">
              {progress?.currentStreak ?? 0}
            </span>
            <span className="text-xs text-orange-300 font-medium">days in a row</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Calculated from verified task & quiz dates
          </p>
        </div>
      </div>

      {/* 3. Main Dashboard Grid: Today's Schedule & Weekly Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Today's Schedule */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-heading font-bold text-white flex items-center space-x-2">
                  <span>Today's Daily Schedule</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {completedToday} of {totalToday} done
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Scheduled study milestones for today</p>
              </div>
              <button
                onClick={() => setCurrentView('tasks')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Manage all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tasks list for today */}
            <div className="space-y-2.5">
              {todayTasks.length > 0 ? (
                todayTasks.map(t => {
                  const isDone = t.completed || t.status === 'Completed';
                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-slate-900/40 border-white/5 opacity-70'
                          : 'bg-slate-800/50 hover:bg-slate-800 border-white/10 hover:border-indigo-500/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Explicit Complete Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskComplete(t.id);
                          }}
                          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                              : 'border-slate-500 hover:border-emerald-400'
                          }`}
                          title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h4
                              className={`text-xs md:text-sm font-semibold transition-all ${
                                isDone ? 'text-slate-400 line-through' : 'text-slate-100'
                              }`}
                            >
                              {t.title}
                            </h4>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.2 rounded-full uppercase ${
                                t.status === 'Completed' || isDone
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : t.status === 'In progress'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {t.status || (isDone ? 'Completed' : 'Not started')}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span className="px-1.5 py-0.2 rounded bg-slate-700/60 text-slate-300 font-medium">
                              {t.subject}
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{t.dueTime}</span>
                            </span>

                            {t.resourceUrl && (
                              <>
                                <span>•</span>
                                <a
                                  href={t.resourceUrl.startsWith('http') ? t.resourceUrl : `https://${t.resourceUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-cyan-400 hover:underline flex items-center space-x-1"
                                >
                                  <span>Resource</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            t.priority === 'High'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : t.priority === 'Medium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700/60 text-slate-300'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 rounded-xl bg-slate-900/30 border border-dashed border-white/10 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 font-medium">No pending tasks scheduled for today!</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ask StudyMate AI: "Add a task to study DBMS at 5 PM"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Tasks and resources must be completed explicitly with verification</span>
            <button
              onClick={() => {
                sendMessage("Help organize my daily schedule");
                setCurrentView('assistant');
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Optimize with AI ✨
            </button>
          </div>
        </div>

        {/* Right 1 Col: Weekly Activity Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-heading font-bold text-white">Weekly Study Hours</h3>
              <span className="text-xs font-semibold text-indigo-400">Past 7 Days</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Hours logged vs daily 2h target</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progress?.weeklyActivity || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hourGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '12px' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#818cf8" strokeWidth={2.5} fillOpacity={1} fill="url(#hourGlow)" name="Hours Studied" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total this week:</span>
            <span className="font-bold text-white font-mono">
              {(progress?.weeklyActivity || []).reduce((acc, d) => acc + d.hours, 0).toFixed(1)} hrs
            </span>
          </div>
        </div>
      </div>

      {/* 4. Active Study Plan Preview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Study Plan highlight */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/60 border border-indigo-500/20 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-heading font-bold text-white">Featured Study Plan</h3>
            </div>
            <button
              onClick={() => setCurrentView('plans')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View all plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {studyPlans.length > 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{studyPlans[0].title}</h4>
                    {studyPlans[0].isSample && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        SAMPLE DATA
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {studyPlans[0].subject} • {studyPlans[0].durationDays} Days ({studyPlans[0].dailyHours} hrs daily)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-cyan-300">{studyPlans[0].progress}% Done</div>
                  <div className="text-[11px] text-slate-400">
                    {studyPlans[0].completedTasks} of {studyPlans[0].totalTasks} items completed
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${studyPlans[0].progress}%` }}
                />
              </div>

              {/* Day roadmap pills */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                {studyPlans[0].days.slice(0, 5).map(day => (
                  <div key={day.day} className="p-2 rounded-lg bg-slate-800/60 border border-white/5 text-center">
                    <span className="text-[10px] font-bold text-indigo-300 block">Day {day.day}</span>
                    <span className="text-xs text-slate-200 font-medium truncate block">{day.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No study plans created yet. Ask StudyMate to create one!</p>
          )}
        </div>

        {/* Recent Assistant Activity */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Award className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-heading font-bold text-white">Recent Activity</h3>
            </div>

            <div className="space-y-3">
              {(progress?.recentActivity || []).slice(0, 4).map((act, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-200 font-medium">{act.description}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <button
              onClick={() => setCurrentView('assistant')}
              className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Open AI Assistant Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
