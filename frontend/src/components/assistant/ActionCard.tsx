import React from 'react';
import { AssistantAction } from '../../types';
import { useApp } from '../../context/AppContext';
import { Calendar, CheckCircle2, Clock, BookOpen, Sparkles, ArrowRight, Award, ListTodo } from 'lucide-react';

interface ActionCardProps {
  action: AssistantAction;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action }) => {
  const { setCurrentView } = useApp();

  if (action.type === 'STUDY_PLAN_CREATED') {
    const data = action.data;
    return (
      <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 shadow-lg shadow-indigo-950/50 backdrop-blur-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">Study Plan Generated</span>
              <h4 className="text-sm font-semibold text-white">{data.title}</h4>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {data.duration} Days • {data.dailyHours}h/day
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
          <div><span className="text-slate-400">Total Commitment:</span> <strong className="text-indigo-200">{data.totalHours} hrs</strong></div>
          <div><span className="text-slate-400">Milestone Tasks:</span> <strong className="text-indigo-200">{data.totalTasks} exercises</strong></div>
        </div>

        <button
          onClick={() => setCurrentView('plans')}
          className="mt-3 w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-indigo-600/30"
        >
          <span>Open Full Study Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (action.type === 'TASK_CREATED') {
    const data = action.data;
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900/70 border border-emerald-500/30 shadow-md backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">Task Scheduled</span>
              <h4 className="text-xs font-semibold text-white">{data.title}</h4>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {data.priority}
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{data.dueDate} at {data.dueTime}</span>
          </div>
          <button
            onClick={() => setCurrentView('tasks')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
          >
            <span>View Tasks</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  if (action.type === 'TASK_COMPLETED') {
    const data = action.data;
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900/70 border border-cyan-500/30 shadow-md backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">Task Finished</span>
              <h4 className="text-xs font-semibold text-white line-through decoration-cyan-400/60">{data.title}</h4>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/30">
            {data.newPercentage}% Done
          </span>
        </div>

        <button
          onClick={() => setCurrentView('tasks')}
          className="mt-2.5 w-full py-1.5 rounded-lg bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-200 text-xs font-medium border border-cyan-500/30 flex items-center justify-center space-x-1.5 transition-all"
        >
          <span>Open Tasks Dashboard</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (action.type === 'QUIZ_GENERATED') {
    const data = action.data;
    return (
      <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-violet-950/60 to-fuchsia-950/40 border border-violet-500/30 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-violet-400 uppercase">Interactive Quiz</span>
              <h4 className="text-sm font-semibold text-white">{data.subject}</h4>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
            {data.totalQuestions} Questions
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-300">
          Curated practice sprint covering core interview and exam patterns.
        </p>

        <button
          onClick={() => setCurrentView('quizzes')}
          className="mt-3 w-full py-2 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-violet-600/30"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Quiz Center</span>
        </button>
      </div>
    );
  }

  if (action.type === 'SCHEDULE_ORGANIZED') {
    const schedule = action.data.schedule || [];
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-md">
        <div className="flex items-center space-x-2 mb-2.5">
          <ListTodo className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Today's Optimized Schedule</h4>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {schedule.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 text-xs border border-white/5">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-indigo-300 text-[11px] font-semibold">{item.time}</span>
                <span className="text-slate-200 truncate max-w-[180px]">{item.title}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                {item.completed ? 'Done' : item.priority}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setCurrentView('tasks')}
          className="mt-2.5 w-full py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium transition-all"
        >
          View Full Daily Schedule
        </button>
      </div>
    );
  }

  if (action.type === 'PROGRESS_SUMMARY') {
    const data = action.data;
    return (
      <div className="mt-3 p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Academic Metrics</span>
          <span className="text-xs text-slate-400">Streak: 🔥 {data.streak} days</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-slate-800/60 border border-white/5">
            <div className="text-lg font-bold text-white">{data.completionRate}%</div>
            <div className="text-[10px] text-slate-400">Tasks Completed</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/60 border border-white/5">
            <div className="text-lg font-bold text-indigo-300">{data.loggedHours}h</div>
            <div className="text-[10px] text-slate-400">Study Time</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/60 border border-white/5">
            <div className="text-lg font-bold text-violet-300">{data.avgQuizScore}%</div>
            <div className="text-[10px] text-slate-400">Avg Quiz Score</div>
          </div>
        </div>
        <button
          onClick={() => setCurrentView('progress')}
          className="mt-3 w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-all shadow-md shadow-cyan-600/30"
        >
          View Detailed Analytics
        </button>
      </div>
    );
  }

  return null;
};
