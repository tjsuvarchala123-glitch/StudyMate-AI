import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskStatus, CompletionType, StudyPlan, ProgressStats, ChatMessage, AssistantAction } from '../types';
import { api, fsEnsureInitialData } from '../services/api';
import { soundEffects } from '../utils/audio';

type ViewType = 'home' | 'assistant' | 'plans' | 'tasks' | 'quizzes' | 'progress' | 'settings';

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  tasks: Task[];
  studyPlans: StudyPlan[];
  progress: ProgressStats | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isAssistantThinking: boolean;
  backendStatus: { mode: string; provider: string };
  // Voice states & controls
  isListening: boolean;
  isSpeaking: boolean;
  voiceTranscript: string;
  voiceSupported: boolean;
  voiceError: string | null;
  clearVoiceError: () => void;
  autoSpeak: boolean;
  setAutoSpeak: (val: boolean) => void;
  startListening: (onTranscript?: (text: string) => void) => Promise<void>;
  stopListening: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  // Browser notifications
  notificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  sendNotification: (title: string, body: string) => void;
  // CRUD & Actions
  sendMessage: (text: string) => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
  completeTaskWithEvidence: (id: string, completionType: CompletionType, evidenceText?: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createStudyPlan: (plan: { title: string; subject: string; duration_days: number; daily_hours: number; topics: string[] }) => Promise<void>;
  togglePlanSubtask: (planId: string, dayNumber: number, taskId: string, completed: boolean) => Promise<void>;
  deleteStudyPlan: (id: string) => Promise<void>;
  submitQuizResult: (payload: { subject: string; topic: string; score: number; total_questions: number }) => Promise<void>;
  refreshData: () => Promise<void>;
  resetAllData: () => Promise<void>;
  clearChatHistory: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [progress, setProgress] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAssistantThinking, setIsAssistantThinking] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<{ mode: string; provider: string }>({
    mode: 'demo',
    provider: 'Checking engine...'
  });

  // Voice & Speech
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceSupported, setVoiceSupported] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    return localStorage.getItem('sm_auto_speak') === 'true';
  });

  // Browser notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  });

  // Conversation history
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: "Hey there! I am **StudyMate AI**, your personal student companion inspired by Alexa+.\n\nYou can ask me to create customized multi-day study plans, schedule timed study reminders, generate concept quizzes on any topic, or explain complex technical subjects. What would you like to conquer today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Create a 5-day DSA study plan. I can study 2 hours daily.',
          'Remind me to practice arrays at 6 PM.',
          'Explain the difference between a stack and a queue.',
          'Create a quiz about Python AsyncIO.'
        ]
      }
    ];
  });

  const recognitionRef = useRef<any>(null);
  const activeVoiceCallbackRef = useRef<((text: string) => void) | null>(null);

  // Check Web Speech API capability on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognition));
  }, []);

  // Save autoSpeak setting
  useEffect(() => {
    localStorage.setItem('sm_auto_speak', autoSpeak ? 'true' : 'false');
  }, [autoSpeak]);

  // Load initial data
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Seed Firestore on first run (no-op if data already exists)
      await fsEnsureInitialData();

      const [healthRes, tasksRes, plansRes, progRes] = await Promise.all([
        api.getHealth(),
        api.getTasks('all'),
        api.getStudyPlans(),
        api.getProgress()
      ]);

      if (healthRes.agent) {
        setBackendStatus(healthRes.agent);
      }
      setTasks(tasksRes);
      setStudyPlans(plansRes);
      setProgress(progRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Text to Speech
  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Strip markdown formatting, symbols, and code blocks for natural speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*`_~]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\|.*?\|/g, '')
      .replace(/[-+*]\s+/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const clearVoiceError = useCallback(() => {
    setVoiceError(null);
  }, []);

  // Voice Listening Controls
  const startListening = useCallback(async (onTranscript?: (text: string) => void) => {
    setVoiceError(null);
    stopSpeaking();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari, or type your message below.");
      return;
    }

    // Abort any existing instance to avoid stuck state or InvalidStateError
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    // Verify microphone permission explicitly if getUserMedia is available
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (permErr: any) {
      console.warn("Microphone permission check failed:", permErr);
      setVoiceError("Microphone access was denied. Please allow microphone permissions in your browser address bar.");
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      activeVoiceCallbackRef.current = onTranscript || null;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
        soundEffects.playMicStart();
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setVoiceTranscript(transcript);
        if (activeVoiceCallbackRef.current) {
          activeVoiceCallbackRef.current(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError("Microphone permission was blocked. Please enable microphone permissions in your browser.");
        } else if (event.error === 'no-speech') {
          setVoiceError("No speech detected. Please speak closer to your microphone.");
        } else if (event.error === 'audio-capture') {
          setVoiceError("No microphone found. Please connect an audio input device.");
        } else if (event.error === 'network') {
          setVoiceError("Network connection error during voice recognition.");
        } else if (event.error !== 'aborted') {
          setVoiceError(`Voice recognition encountered an issue (${event.error}).`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Speech recognition start failed:", err);
      setVoiceError("Could not start speech recognition: " + (err.message || 'unknown error'));
      setIsListening(false);
    }
  }, [stopSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    activeVoiceCallbackRef.current = null;
  }, []);

  // Notification helper
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setNotificationsEnabled(granted);
      return granted;
    } catch {
      return false;
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (notificationsEnabled && typeof Notification !== 'undefined') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.svg'
        });
      } catch (err) {
        console.warn('Notification failed:', err);
      }
    }
  };

  // Conversational Assistant Messaging & Action Execution
  const sendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setIsAssistantThinking(true);

    try {
      const responseData = await api.sendChatMessage(userText);

      // Play success chime
      soundEffects.playSuccess();

      // If action executed, re-sync state immediately
      if (responseData.action) {
        await refreshData();
        sendNotification(
          'StudyMate AI Action',
          responseData.response.substring(0, 80) + '...'
        );
      }

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: responseData.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: responseData.action,
        suggestions: responseData.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (autoSpeak) {
        speakText(responseData.response);
      }
    } catch (err) {
      console.error('Assistant response error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I encountered a hiccup processing your request. Please ensure the backend is connected or try rephrasing.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  // Task Actions
  const createTask = async (taskData: Partial<Task>) => {
    const newTask = await api.createTask(taskData);
    soundEffects.playSuccess();
    await refreshData();
    sendNotification('New Task Added', `"${newTask.title}" set for ${newTask.dueTime}`);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    await api.updateTask(id, updates);
    soundEffects.playTick();
    await refreshData();
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const isNowDone = !task.completed && task.status !== 'Completed';
    soundEffects.playTick();
    const updated = await api.updateTask(id, {
      completed: isNowDone,
      status: isNowDone ? 'Completed' : 'In progress',
      completedAt: isNowDone ? new Date().toISOString() : undefined,
      completionType: isNowDone ? 'self_reported' : undefined
    });
    if (updated.completed) {
      soundEffects.playSuccess();
    }
    await refreshData();
  };

  const reopenTask = async (id: string) => {
    soundEffects.playTick();
    await api.updateTask(id, {
      completed: false,
      status: 'In progress',
      completedAt: undefined,
      completionType: undefined,
      completionEvidence: undefined
    });
    await refreshData();
  };

  const completeTaskWithEvidence = async (id: string, completionType: CompletionType, evidenceText?: string) => {
    soundEffects.playSuccess();
    await api.updateTask(id, {
      completed: true,
      status: 'Completed',
      completedAt: new Date().toISOString(),
      completionType,
      completionEvidence: evidenceText || ''
    });
    await refreshData();
  };

  const deleteTask = async (id: string) => {
    await api.deleteTask(id);
    await refreshData();
  };

  // Study Plan Actions
  const createStudyPlan = async (planData: { title: string; subject: string; duration_days: number; daily_hours: number; topics: string[] }) => {
    await api.createStudyPlan(planData);
    soundEffects.playSuccess();
    await refreshData();
    sendNotification('Study Plan Created', `New plan: ${planData.title}`);
  };

  const togglePlanSubtask = async (planId: string, dayNumber: number, taskId: string, completed: boolean) => {
    soundEffects.playTick();
    await api.togglePlanTask(planId, dayNumber, taskId, completed);
    if (completed) soundEffects.playSuccess();
    await refreshData();
  };

  const deleteStudyPlan = async (id: string) => {
    await api.deleteStudyPlan(id);
    await refreshData();
  };

  // Quiz Actions
  const submitQuizResult = async (payload: { subject: string; topic: string; score: number; total_questions: number }) => {
    await api.submitQuiz(payload);
    soundEffects.playSuccess();
    await refreshData();
  };

  const resetAllData = async () => {
    await api.resetData();
    await refreshData();
    setMessages([
      {
        id: 'msg-welcome-reset',
        sender: 'assistant',
        text: "All study data has been refreshed to the initial hackathon sample state! What would you like to work on?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Create a 5-day DSA study plan',
          'Remind me to practice arrays at 6 PM',
          'Quiz me on Java OOP'
        ]
      }
    ]);
  };

  const clearChatHistory = () => {
    setMessages([
      {
        id: 'msg-cleared',
        sender: 'assistant',
        text: "Chat transcript cleared. How can I assist you with your studies right now?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: ['Create a study plan', 'Plan my day', 'Quiz me', 'Review my progress']
      }
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        tasks,
        studyPlans,
        progress,
        messages,
        isLoading,
        isAssistantThinking,
        backendStatus,
        isListening,
        isSpeaking,
        voiceTranscript,
        voiceSupported,
        voiceError,
        clearVoiceError,
        autoSpeak,
        setAutoSpeak,
        startListening,
        stopListening,
        speakText,
        stopSpeaking,
        notificationsEnabled,
        requestNotificationPermission,
        sendNotification,
        sendMessage,
        createTask,
        updateTask,
        toggleTaskComplete,
        reopenTask,
        completeTaskWithEvidence,
        deleteTask,
        createStudyPlan,
        togglePlanSubtask,
        deleteStudyPlan,
        submitQuizResult,
        refreshData,
        resetAllData,
        clearChatHistory
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
