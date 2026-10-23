import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Bot,
  CalendarDays,
  CheckSquare,
  HelpCircle,
  BarChart3,
  Settings,
  Sparkles,
  Mic,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const { currentView, setCurrentView, startListening, isListening, backendStatus } = useApp();

  interface NavItem {
    id: 'home' | 'assistant' | 'plans' | 'tasks' | 'quizzes' | 'progress' | 'settings';
    label: string;
    icon: any;
    badge?: string;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, badge: 'Alexa+' },
    { id: 'plans', label: 'Study Plans', icon: CalendarDays },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'quizzes', label: 'Quiz Center', icon: HelpCircle },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (viewId: any) => {
    setCurrentView(viewId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#0F172A]/95 border-r border-indigo-900/30 backdrop-blur-2xl transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/5">
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all">
              <div className="absolute inset-0.5 rounded-[10px] bg-[#0F172A]/80 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                  StudyMate<span className="text-cyan-400">.ai</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400/80">
                  Alexa+ Student
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center rounded-xl font-medium text-sm transition-all duration-200 group relative
                  ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-3 space-x-3'}
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/40 shadow-md shadow-indigo-950/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_10px_#22d3ee]" />
                )}

                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="tracking-wide">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-indigo-500/20 text-cyan-300 border border-indigo-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Voice Assistant Widget */}
        <div className="p-3 border-t border-white/5">
          {!isCollapsed ? (
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/70 via-slate-900/60 to-purple-950/50 border border-indigo-500/30 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                  Simulated Alexa+
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Hands-free voice student actions & explanations
              </p>
              <button
                onClick={() => startListening()}
                disabled={isListening}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
              >
                <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce text-cyan-300' : ''}`} />
                <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => startListening()}
              className="w-full p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30"
              title="Voice Assistant"
            >
              <Mic className="w-5 h-5 text-cyan-300" />
            </button>
          )}

          {/* Hackathon simulated experience notice */}
          {!isCollapsed && (
            <div className="mt-2 text-center">
              <span className="text-[10px] text-slate-500 font-medium">
                Amazon Developer Hackathon Sim
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
