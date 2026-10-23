import React from 'react';
import { useApp } from '../../context/AppContext';
import { Mic, MicOff, Volume2, VolumeX, Send, AlertCircle, X, Info } from 'lucide-react';

export const VoiceVisualizer: React.FC = () => {
  const {
    isListening,
    isSpeaking,
    voiceTranscript,
    voiceError,
    clearVoiceError,
    stopListening,
    stopSpeaking,
    sendMessage
  } = useApp();

  if (!isListening && !isSpeaking && !voiceError) return null;

  const handleSendTranscript = () => {
    if (voiceTranscript.trim()) {
      sendMessage(voiceTranscript.trim());
      stopListening();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-[#0F172A]/95 border border-indigo-500/50 shadow-2xl shadow-indigo-900/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Voice Error Banner */}
      {voiceError ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Voice Assistant Notice</span>
            </div>
            <button
              onClick={clearVoiceError}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed bg-rose-950/30 p-2.5 rounded-xl border border-rose-500/30">
            {voiceError}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center space-x-1">
              <Info className="w-3 h-3 text-cyan-400" />
              <span>Typed chat is always available below</span>
            </span>
            <button
              onClick={clearVoiceError}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              OK, Got it
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <span className="flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isListening ? 'bg-cyan-400' : 'bg-violet-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isListening ? 'bg-cyan-500' : 'bg-violet-500'}`}></span>
                </span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                {isListening ? 'Simulated Alexa+ Listening...' : 'StudyMate Speaking...'}
              </span>
            </div>

            {isListening ? (
              <button
                onClick={stopListening}
                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="Stop listening"
              >
                <MicOff className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={stopSpeaking}
                className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors"
                title="Mute voice"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Voice Frequency Waveform Visualization */}
          <div className="flex items-center justify-center space-x-1.5 h-12 my-2 bg-slate-900/80 rounded-xl px-4 border border-white/5">
            {[40, 75, 100, 60, 90, 45, 80, 100, 70, 50].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${isListening ? 'bg-cyan-400' : 'bg-violet-400'} wave-bar`}
                style={{
                  height: isListening || isSpeaking ? `${Math.max(15, h * (isListening ? 0.8 : 0.6))}%` : '20%',
                  animationDuration: `${0.8 + (i % 3) * 0.2}s`
                }}
              />
            ))}
          </div>

          {/* Transcript or Audio State */}
          <div className="mt-2 text-xs">
            {isListening ? (
              <div>
                <p className="text-slate-300 italic min-h-[36px] bg-slate-900/40 p-2 rounded-lg border border-white/5">
                  {voiceTranscript || 'Speak your request (e.g. "Create a 5-day DSA plan", "Remind me to study at 6 PM")...'}
                </p>
                {voiceTranscript && (
                  <button
                    onClick={handleSendTranscript}
                    className="mt-2 w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center space-x-1.5 transition-all text-xs shadow-md shadow-indigo-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Speech Request</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-slate-300 text-xs flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-violet-400 animate-pulse" />
                <span>Reading assistant response aloud...</span>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
