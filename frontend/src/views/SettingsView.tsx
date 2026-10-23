import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Mic,
  Volume2,
  Bell,
  Database,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Key
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    autoSpeak,
    setAutoSpeak,
    voiceSupported,
    notificationsEnabled,
    requestNotificationPermission,
    sendNotification,
    resetAllData,
    backendStatus,
    speakText
  } = useApp();

  const [testNotifSent, setTestNotifSent] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleTestNotification = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Notification permission was not granted by the browser.');
        return;
      }
    }
    sendNotification(
      'StudyMate AI Notification',
      'This is a simulated Alexa+ study alert for your scheduled milestones.'
    );
    setTestNotifSent(true);
    setTimeout(() => setTestNotifSent(false), 3000);
  };

  const handleReset = async () => {
    if (window.confirm('Reset all tasks, plans, and quiz history to initial hackathon sample data?')) {
      await resetAllData();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl">
        <h2 className="text-xl font-heading font-bold text-white flex items-center space-x-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          <span>System Preferences & Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize voice synthesis, notifications, backend connections, and hackathon simulation settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voice Experience Settings */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 mb-2">
            <Mic className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-heading font-bold text-white">Voice & Speech Experience</h3>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Browser Speech Recognition:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${voiceSupported ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {voiceSupported ? 'Supported' : 'Not Supported'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              {voiceSupported
                ? 'Web Speech API is active for hands-free voice commands.'
                : 'Your browser does not support Web Speech Recognition; keyboard input is active.'}
            </p>
          </div>

          {/* Auto Speak Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-white/5 text-xs">
            <div>
              <span className="font-semibold text-white block">Auto-read Assistant Responses</span>
              <span className="text-[11px] text-slate-400">Speak AI responses aloud using Text-to-Speech</span>
            </div>
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={e => setAutoSpeak(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <button
            onClick={() => speakText("Hello! This is StudyMate AI, your personal student assistant.")}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Text-to-Speech Voice</span>
          </button>
        </div>

        {/* Notifications Settings */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 mb-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-heading font-bold text-white">Browser Notifications</h3>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Notification Permission:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${notificationsEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Sends local in-app alerts and browser notifications when study milestones are due.
            </p>
          </div>

          <button
            onClick={handleTestNotification}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-amber-600/20"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{testNotifSent ? 'Test Notification Dispatched!' : 'Request & Test Notifications'}</span>
          </button>
        </div>
      </div>

      {/* AI Engine & Backend Configuration */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-heading font-bold text-white">AI Provider & Backend Status</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current AI Engine:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-cyan-300 border border-indigo-500/30">
                {backendStatus.mode === 'live' ? 'LIVE MODEL CONNECTED' : 'DEMO MODE (LOCAL SEMANTIC ENGINE)'}
              </span>
            </div>
            <p className="text-slate-300">
              Provider: <strong className="text-white">{backendStatus.provider}</strong>
            </p>
            <p className="text-slate-400 text-[11px]">
              The local semantic engine understands student requests, executes structured database actions, and returns rich Markdown and Action Cards.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
              <Key className="w-4 h-4" />
              <span>Configuring Optional LLM Providers</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              To connect OpenAI or Google Gemini, add your API key to <code className="text-indigo-300 font-mono">backend/.env</code>:
            </p>
            <pre className="p-2 rounded-lg bg-slate-900 text-slate-300 font-mono text-[10px]">
              OPENAI_API_KEY=sk-...<br />
              GEMINI_API_KEY=AIza...
            </pre>
          </div>
        </div>
      </div>

      {/* Data Management & Hackathon Compliance */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-heading font-bold text-white flex items-center space-x-2">
            <Database className="w-4 h-4 text-rose-400" />
            <span>Reset Demo & Sample Data</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Restores the initial sample 5-day DSA plan, tasks, and quiz logs for clean judging demonstrations.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-4 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-rose-600/20 whitespace-nowrap self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resetDone ? 'Sample Data Restored!' : 'Reset Sample Data'}</span>
        </button>
      </div>

      {/* Hackathon Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-400 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-200">
            Amazon Developer Hackathon Submission Notice
          </p>
          <p className="text-[11px] leading-relaxed">
            StudyMate AI is an independently branded simulated Alexa+ student copilot. It models conversational intent-to-action agentic flows directly within a modern web interface without proprietary Alexa assets.
          </p>
        </div>
      </div>
    </div>
  );
};
