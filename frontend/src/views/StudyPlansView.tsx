import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarDays,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  BookOpen,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';

export const StudyPlansView: React.FC = () => {
  const {
    studyPlans,
    createStudyPlan,
    togglePlanSubtask,
    deleteStudyPlan,
    sendMessage,
    setCurrentView
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(studyPlans[0]?.id || null);

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [duration, setDuration] = useState(5);
  const [dailyHours, setDailyHours] = useState(2.0);
  const [topicsInput, setTopicsInput] = useState('');

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const topics = topicsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    await createStudyPlan({
      title: title.trim(),
      subject,
      duration_days: duration,
      daily_hours: dailyHours,
      topics: topics.length > 0 ? topics : [
        'Module 1: Foundations',
        'Module 2: Core Algorithms',
        'Module 3: Advanced Optimization',
        'Module 4: Edge Cases',
        'Module 5: Mock Exam Drills'
      ]
    });

    setTitle('');
    setTopicsInput('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-heading font-bold text-white flex items-center space-x-2">
            <CalendarDays className="w-6 h-6 text-indigo-400" />
            <span>Study Curriculums & Plans</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Structured roadmap breakdown with daily actionable milestones and progress tracking
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              sendMessage("Create a 5-day DSA study plan. I can study 2 hours daily.");
              setCurrentView('assistant');
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-white/10 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generate with AI</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-6">
        {studyPlans.map(plan => {
          const isExpanded = expandedPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className="rounded-3xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/30 transition-all backdrop-blur-xl overflow-hidden shadow-xl"
            >
              {/* Plan Header Card */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2.5">
                      <h3 className="text-lg font-heading font-bold text-white tracking-tight">
                        {plan.title}
                      </h3>
                      {plan.isSample && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Sample Data
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {plan.subject}
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{plan.dailyHours}h daily ({plan.totalHours}h total)</span>
                      </span>
                      <span>•</span>
                      <span>{plan.durationDays} Days</span>
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xl font-heading font-black text-cyan-300">
                        {plan.progress}%
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {plan.completedTasks} / {plan.totalTasks} tasks
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      title={isExpanded ? 'Collapse plan' : 'Expand plan'}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => deleteStudyPlan(plan.id)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${plan.progress}%` }}
                  />
                </div>
              </div>

              {/* Day Breakdown Timeline (Expanded) */}
              {isExpanded && (
                <div className="border-t border-white/5 bg-slate-950/40 p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Day-by-Day Timeline & Exercises
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plan.days.map(day => (
                      <div
                        key={day.day}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                              Day {day.day}
                            </span>
                            <span className="text-[11px] text-slate-400">{day.hours} hrs</span>
                          </div>
                          <h5 className="text-sm font-semibold text-white mb-2">{day.title}</h5>

                          {/* Day subtasks */}
                          <div className="space-y-1.5 mt-3">
                            {day.tasks.map(task => (
                              <div
                                key={task.id}
                                onClick={() => togglePlanSubtask(plan.id, day.day, task.id, !task.completed)}
                                className={`p-2 rounded-lg text-xs cursor-pointer flex items-center space-x-2 transition-colors ${
                                  task.completed
                                    ? 'bg-emerald-950/20 text-slate-400 line-through'
                                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-200'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                    task.completed
                                      ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                      : 'border-slate-500'
                                  }`}
                                >
                                  {task.completed && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="truncate">{task.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-2 border-t border-white/5 text-[11px] text-slate-500 flex justify-between">
                          <span>
                            {day.tasks.filter(t => t.completed).length} / {day.tasks.length} done
                          </span>
                          {day.tasks.every(t => t.completed) && (
                            <span className="text-emerald-400 font-medium">Day Complete!</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {studyPlans.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-white/10">
            <CalendarDays className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No active study plans</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create a personalized study roadmap manually or simply ask StudyMate AI to generate one.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Create Study Plan
            </button>
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl">
            <h3 className="text-lg font-heading font-bold text-white mb-1">
              Create Custom Study Plan
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your subject details and study parameters
            </p>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5-Day DBMS Master Sprint"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                    <option value="Java OOP">Java OOP</option>
                    <option value="DBMS">DBMS</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Computer Networks">Computer Networks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Daily Study Time (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={dailyHours}
                  onChange={e => setDailyHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Topics to Cover (comma-separated, optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Arrays, Binary Search, Stacks, Trees, Dynamic Programming"
                  value={topicsInput}
                  onChange={e => setTopicsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/30"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
