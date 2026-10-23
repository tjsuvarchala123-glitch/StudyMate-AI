import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ActionCard } from '../components/assistant/ActionCard';
import {
  Mic,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Trash2,
  Bot,
  User,
  CheckCircle2,
  Code,
  Copy,
  Check
} from 'lucide-react';

export const AssistantView: React.FC = () => {
  const {
    messages,
    sendMessage,
    isAssistantThinking,
    startListening,
    stopListening,
    isListening,
    speakText,
    isSpeaking,
    clearChatHistory,
    backendStatus
  } = useApp();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAssistantThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAssistantThinking) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleSuggestion = (sug: string) => {
    sendMessage(sug);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render markdown-like content cleanly with code block support
  const renderMessageContent = (text: string) => {
    // Check if message contains code blocks
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      parts.push({
        type: 'code',
        lang: match[1] || 'code',
        code: match[2].trim()
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    return (
      <div className="space-y-3">
        {parts.map((p, idx) => {
          if (p.type === 'code') {
            return (
              <div key={idx} className="my-2 rounded-xl overflow-hidden bg-slate-950 border border-indigo-900/40 text-xs">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-white/5 text-slate-400">
                  <span className="font-mono uppercase font-bold text-[10px] text-indigo-400">{p.lang}</span>
                  <button
                    onClick={() => handleCopyText(p.code || '', `code-${idx}`)}
                    className="flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    {copiedId === `code-${idx}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-slate-200 font-mono text-[11px] leading-relaxed">
                  <code>{p.code}</code>
                </pre>
              </div>
            );
          }

          // Format basic markdown styling for headings and lists
          const lines = p.content?.split('\n') || [];
          return (
            <div key={idx} className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-slate-200">
              {lines.map((line, lIdx) => {
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={lIdx} className="text-base font-bold text-white mt-2 mb-1">
                      {line.replace('### ', '')}
                    </h3>
                  );
                }
                if (line.startsWith('#### ')) {
                  return (
                    <h4 key={lIdx} className="text-sm font-semibold text-indigo-300 mt-2">
                      {line.replace('#### ', '')}
                    </h4>
                  );
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  const item = line.substring(2);
                  return (
                    <div key={lIdx} className="flex items-start space-x-2 pl-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        {item.split('**').map((seg, sIdx) =>
                          sIdx % 2 === 1 ? <strong key={sIdx} className="text-white font-semibold">{seg}</strong> : seg
                        )}
                      </span>
                    </div>
                  );
                }
                if (line.startsWith('|')) {
                  // simple table row rendering
                  const cells = line.split('|').filter(c => c.trim().length > 0 && !c.includes('---'));
                  if (cells.length === 0) return null;
                  return (
                    <div key={lIdx} className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1 px-2 rounded bg-slate-900/40 text-xs font-mono">
                      {cells.map((cell, cIdx) => (
                        <div key={cIdx} className="text-slate-300">{cell.trim()}</div>
                      ))}
                    </div>
                  );
                }
                return (
                  <p key={lIdx}>
                    {line.split('**').map((seg, sIdx) =>
                      sIdx % 2 === 1 ? <strong key={sIdx} className="text-white font-semibold">{seg}</strong> : seg
                    )}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in duration-300">
      {/* Assistant Header Bar */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#0F172A]/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md shadow-indigo-600/30">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-heading font-bold text-white">StudyMate Assistant</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-cyan-300 border border-indigo-500/30">
                Alexa+ Simulation
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Natural language student intent processor with real database actions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearChatHistory}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white'
                  : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble Container */}
            <div className={`max-w-[85%] md:max-w-2xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-[#1E293B]/80 border border-white/10 text-slate-200 rounded-tl-none'
                }`}
              >
                {renderMessageContent(msg.text)}

                {/* Embedded Action Card if action was executed */}
                {msg.action && <ActionCard action={msg.action} />}
              </div>

              {/* Message Footer: Timestamp, Voice TTS */}
              <div className="mt-1.5 flex items-center space-x-2 px-1 text-[11px] text-slate-400">
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="p-1 rounded hover:text-cyan-400 transition-colors"
                    title="Read aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggested Follow-up Chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {msg.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(sug)}
                      className="px-2.5 py-1 rounded-full text-xs bg-slate-800/80 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all hover:scale-[1.02]"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator when Assistant is processing */}
        {isAssistantThinking && (
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-[#1E293B]/80 border border-white/10 rounded-tl-none flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-400 font-medium ml-2">
                Simulated Alexa+ agent is evaluating action...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-[#0F172A]/90">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="flex-1 relative flex items-center rounded-2xl bg-slate-900 border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 p-1.5 transition-all">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type or speak a request (e.g. 'Create a 5-day DSA plan', 'Remind me to practice arrays')..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
            />

            <button
              type="button"
              onClick={isListening ? stopListening : () => startListening((transcript) => setInput(transcript))}
              className={`p-2 rounded-xl transition-all ${
                isListening
                  ? 'bg-cyan-500 text-slate-950 animate-pulse'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Voice input into chat"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isAssistantThinking}
            className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 text-center">
          <span className="text-[11px] text-slate-500">
            Simulated Alexa+ experience for Amazon Hackathon • Executes real tasks, plans, quizzes, and schedules
          </span>
        </div>
      </div>
    </div>
  );
};
