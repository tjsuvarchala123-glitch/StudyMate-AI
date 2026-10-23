import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Mic,
  Flame,
  Bell,
  Sparkles,
  Calendar,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';

interface HeaderProps {
  setMobileOpen: (val: boolean) => void;
  isCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ setMobileOpen, isCollapsed }) => {
  const {
    currentView,
    setCurrentView,
    progress,
    startListening,
    isListening,
    autoSpeak,
    setAutoSpeak,
    backendStatus
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Friendly title mapping
  const viewTitles: Record<string, { title: string; subtitle: string }> = {
    home: { title: 'Study Dashboard', subtitle: 'Personalized study schedule & assistant' },
    assistant: { title: 'Alexa+ Student Assistant', subtitle: 'Natural language agentic study copilot' },
    plans: { title: 'Study Plans', subtitle: 'Structured multi-day curricula & milestones' },
    tasks: { title: 'My Tasks & Reminders', subtitle: 'Actionable student tasks with smart deadlines' },
    quizzes: { title: 'Quiz Center', subtitle: 'Self-assessment drills & interview questions' },
    progress: { title: 'Progress Analytics', subtitle: 'Real-time performance and study statistics' },
    settings: { title: 'Preferences & System', subtitle: 'Voice controls, notifications, and AI setup' }
  };

  const current = viewTitles[currentView] || { title: 'Dashboard', subtitle: '' };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 h-20 px-4 md:px-8 flex items-center justify-between bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/5">
      {/* Left: Mobile Menu & Title */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-white/5"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg md:text-xl font-heading font-bold text-white tracking-tight flex items-center space-x-2">
            <span>{current.title}</span>
            {currentView === 'assistant' && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-cyan-300 border border-indigo-500/30">
                Agent Active
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Stats, Date, Quick Voice, Notifications */}
      <div className="flex items-center space-x-2.5 sm:space-x-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>{todayStr}</span>
        </div>

        {/* Study Streak Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-orange-500/20 text-xs font-semibold text-amber-300">
          <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          <span>{progress?.currentStreak || 4} Day Streak</span>
        </div>

        {/* Auto Voice Speak Toggle */}
        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          className={`p-2 rounded-xl text-xs font-medium border transition-colors hidden sm:flex items-center space-x-1.5 ${
            autoSpeak
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
          }`}
          title={autoSpeak ? 'Voice response read-aloud enabled' : 'Voice response read-aloud muted'}
        >
          {autoSpeak ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Quick Voice Assistant Mic Button */}
        <button
          onClick={() => startListening()}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shadow-md ${
            isListening
              ? 'bg-cyan-500 text-slate-950 animate-pulse shadow-cyan-500/40'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
          }`}
        >
          <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-bounce' : ''}`} />
          <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Alexa+ Voice'}</span>
        </button>

        {/* System & Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/5 transition-colors relative"
            title="Recent Activity & Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 p-3 rounded-2xl bg-[#0F172A] border border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Assistant Activity</span>
                <span className="text-[10px] text-cyan-400 font-medium">Real-time sync</span>
              </div>
              <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                {progress?.recentActivity && progress.recentActivity.length > 0 ? (
                  progress.recentActivity.map((act, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-900/70 border border-white/5 text-xs">
                      <p className="text-slate-200 font-medium">{act.description}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No recent activity logged</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
