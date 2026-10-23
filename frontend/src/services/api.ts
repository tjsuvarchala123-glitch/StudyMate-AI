/**
 * api.ts — StudyMate AI data access layer
 * ----------------------------------------
 * Routing strategy:
 *   • Tasks, Study Plans, Quiz Results, Progress  →  Firestore (primary)
 *   • AI chat, quiz question generation           →  FastAPI backend (fallback: client simulation)
 *
 * If Firestore is unreachable (e.g. network offline), operations throw and
 * the caller (AppContext) surfaces an appropriate error to the user.
 */

import {
  fsTasks_getAll,
  fsTasks_create,
  fsTasks_update,
  fsTasks_delete,
  fsPlans_getAll,
  fsPlans_create,
  fsPlans_toggleTask,
  fsPlans_delete,
  fsQuiz_submit,
  fsProgress_get,
  fsEnsureInitialData,
} from './firestoreApi';

import type {
  Task,
  StudyPlan,
  QuizQuestion,
  QuizResponse,
  QuizResult,
  ProgressStats,
  AssistantAction,
} from '../types';

export { fsEnsureInitialData };

const API_BASE = '/api';

// ─── Chat (FastAPI backend) ──────────────────────────────────────────────────

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'offline', agent: { mode: 'demo', provider: 'Client-side Simulated Engine' } };
    }
  },

  async sendChatMessage(message: string): Promise<{ response: string; action?: AssistantAction; suggestions?: string[] }> {
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error('Chat API failed');
      return await res.json();
    } catch (err) {
      console.warn('Backend chat unreachable, using client simulation', err);
      return {
        response: `I heard: "${message}". Connect the backend server for full AI responses. In demo mode, all data is saved to Firebase Firestore.`,
        suggestions: ['Create a 5-day DSA study plan', 'Quiz me on Java', 'Review my progress'],
      };
    }
  },

  // ─── Tasks → Firestore ─────────────────────────────────────────────────

  async getTasks(filter: string = 'all'): Promise<Task[]> {
    return fsTasks_getAll(filter);
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    return fsTasks_create(task);
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return fsTasks_update(id, updates);
  },

  async deleteTask(id: string): Promise<void> {
    return fsTasks_delete(id);
  },

  // ─── Study Plans → Firestore ───────────────────────────────────────────

  async getStudyPlans(): Promise<StudyPlan[]> {
    return fsPlans_getAll();
  },

  async createStudyPlan(planData: {
    title: string;
    subject: string;
    duration_days: number;
    daily_hours: number;
    topics: string[];
    days?: StudyPlan['days'];
  }): Promise<StudyPlan> {
    return fsPlans_create(planData);
  },

  async togglePlanTask(planId: string, dayNumber: number, taskId: string, completed: boolean): Promise<void> {
    return fsPlans_toggleTask(planId, dayNumber, taskId, completed);
  },

  async deleteStudyPlan(planId: string): Promise<void> {
    return fsPlans_delete(planId);
  },

  // ─── Quiz Questions → FastAPI backend (AI generation) ─────────────────

  async getQuizQuestions(
    subject: string = 'Data Structures & Algorithms',
    topic: string = '',
    difficulty: string = 'Intermediate',
    count: number = 5,
  ): Promise<QuizResponse> {
    try {
      const params = new URLSearchParams({ subject, difficulty, count: count.toString() });
      if (topic) params.append('topic', topic);

      const res = await fetch(`${API_BASE}/quizzes/questions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load quiz');
      return await res.json();
    } catch {
      // Offline fallback — transparent demo questions
      return {
        id: `quiz-${Date.now()}`,
        subject,
        topic: topic || subject,
        difficulty,
        mode: 'demo_fallback',
        provider: 'StudyMate Offline Question Generator (Demo Mode)',
        notice:
          'Generated using StudyMate offline curriculum generator. Configure OPENAI_API_KEY or GEMINI_API_KEY in backend/.env for live LLM questions.',
        questions: [
          {
            id: 'q-demo-1',
            question: `What is the primary fundamental objective or core principle behind ${topic || subject}?`,
            options: [
              `To systematically organize, optimize, and analyze patterns in ${topic || subject}`,
              'To replace all underlying hardware architectures with proprietary protocols',
              'To eliminate the need for error handling and boundary conditions',
              'To enforce strict sequential single-threaded execution',
            ],
            correctAnswer: 0,
            explanation: `In ${subject}, ${topic || subject} primarily focuses on structured problem modeling, resource efficiency, and correctness under varying operational constraints.`,
          },
          {
            id: 'q-demo-2',
            question: `When analyzing performance trade-offs in ${topic || subject}, which factor typically presents the greatest bottleneck?`,
            options: [
              'Constant optical clock skew across local CPU registers',
              'Time-space trade-offs between memory overhead, I/O latency, and computational complexity',
              'The operating system having zero available registers',
              'Display refresh rates causing logic instruction drops',
            ],
            correctAnswer: 1,
            explanation: `Across modern systems, optimizing ${topic || subject} requires balancing latency, memory footprint, cache locality, and throughput.`,
          },
          {
            id: 'q-demo-3',
            question: `Which of the following represents an essential best practice when implementing ${topic || subject}?`,
            options: [
              'Hardcoding magic constant offsets directly into production modules',
              'Bypassing data validation layers to maximize raw throughput',
              'Verifying boundary edge cases, validating preconditions, and maintaining invariants',
              'Disabling compiler warnings and type-checking mechanisms',
            ],
            correctAnswer: 2,
            explanation: `Robust implementations of ${topic || subject} mandate strict verification of boundary states (null references, overflow, empty collections, race conditions).`,
          },
        ],
      };
    }
  },

  // ─── Quiz Submit → Firestore ───────────────────────────────────────────

  async submitQuiz(payload: { subject: string; topic: string; score: number; total_questions: number }): Promise<QuizResult> {
    // Also try submitting to backend for server-side history (best-effort)
    try {
      const res = await fetch(`${API_BASE}/quizzes/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Backend quiz submit failed');
      // Even if backend succeeds, also save to Firestore as source of truth
    } catch {
      // Backend unavailable — Firestore will be the sole store
    }
    return fsQuiz_submit(payload);
  },

  // ─── Progress → computed from Firestore ───────────────────────────────

  async getProgress(): Promise<ProgressStats> {
    return fsProgress_get();
  },

  // ─── Reset ────────────────────────────────────────────────────────────

  async resetData(): Promise<void> {
    // Note: Full Firestore collection wipe would require listing & deleting each doc.
    // For safety, we only clear local storage and call the backend reset.
    // To fully reset Firestore, the user should use the Firebase console.
    try {
      await fetch(`${API_BASE}/reset`, { method: 'POST' });
    } catch {
      // Backend offline — silent
    }
    localStorage.removeItem('sm_tasks');
    localStorage.removeItem('sm_plans');
    localStorage.removeItem('sm_quiz_history');
  },
};
