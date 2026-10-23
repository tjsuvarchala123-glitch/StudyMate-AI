export type TaskStatus = 'Not started' | 'In progress' | 'Completed';
export type CompletionType = 'self_reported' | 'evidence_submitted' | 'quiz_verified';

export interface Task {
  id: string;
  title: string;
  description?: string;
  subject: string;
  dueDate: string;
  dueTime: string;
  priority: 'High' | 'Medium' | 'Low';
  status: TaskStatus;
  completed: boolean;
  resourceUrl?: string;
  completedAt?: string;
  completionType?: CompletionType;
  completionEvidence?: string;
  notes?: string;
  createdAt?: string;
}

export interface PlanSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface PlanDay {
  day: number;
  title: string;
  hours: number;
  topics: string[];
  tasks: PlanSubtask[];
}

export interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  durationDays: number;
  dailyHours: number;
  totalHours: number;
  topics: string[];
  days: PlanDay[];
  totalTasks: number;
  completedTasks: number;
  progress: number;
  isSample?: boolean;
  createdAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizResponse {
  id: string;
  subject: string;
  topic?: string;
  difficulty?: string;
  mode?: 'ai_generated' | 'curated_bank' | 'demo_fallback';
  provider?: string;
  notice?: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  id?: string;
  subject: string;
  topic: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
}

export interface AssistantAction {
  type: 'STUDY_PLAN_CREATED' | 'TASK_CREATED' | 'TASK_COMPLETED' | 'QUIZ_GENERATED' | 'SCHEDULE_ORGANIZED' | 'PROGRESS_SUMMARY';
  entity: string;
  data: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: AssistantAction;
  suggestions?: string[];
}

export interface ActivityLog {
  type: string;
  description: string;
  timestamp: string;
}

export interface ProgressStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks?: number;
  notStartedTasks?: number;
  completionRate: number;
  activePlans: number;
  totalSubtasks: number;
  completedSubtasks: number;
  loggedHours: number;
  avgQuizScore: number;
  currentStreak: number;
  weeklyActivity: { day: string; date?: string; hours: number; target: number }[];
  subjectStats: { subject: string; total: number; completed: number; percentage: number }[];
  quizHistory: QuizResult[];
  recentActivity: ActivityLog[];
}
