/**
 * firestoreApi.ts
 * ---------------
 * Replaces the localStorage fallback in api.ts with Firestore persistence.
 * This module mirrors the exact same function signatures used by api.ts so the
 * rest of the app (AppContext, views) needs zero changes.
 *
 * Architecture:
 *  - CRUD data (tasks, plans, quiz results) → Firestore
 *  - AI chat & quiz question generation     → FastAPI backend (unchanged)
 *
 * Collections:
 *  tasks/          – one document per task
 *  study_plans/    – one document per plan (with nested days array)
 *  quiz_results/   – one document per submitted quiz attempt
 *  activity_logs/  – one document per activity event (optional)
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, StudyPlan, QuizResult, ProgressStats } from '../types';

// ─── Collection helpers ────────────────────────────────────────────────────

const TASKS = 'tasks';
const PLANS = 'study_plans';
const QUIZ_RESULTS = 'quiz_results';
const ACTIVITY_LOGS = 'activity_logs';

// ─── Converters (Firestore ↔ app types) ────────────────────────────────────

function docToTask(id: string, data: DocumentData): Task {
  return {
    id,
    title: data.title ?? '',
    description: data.description ?? '',
    subject: data.subject ?? 'General Study',
    dueDate: data.dueDate ?? '',
    dueTime: data.dueTime ?? '',
    priority: data.priority ?? 'Medium',
    status: data.status ?? 'Not started',
    completed: data.completed ?? false,
    resourceUrl: data.resourceUrl ?? undefined,
    notes: data.notes ?? '',
    completedAt: data.completedAt ?? undefined,
    completionType: data.completionType ?? undefined,
    completionEvidence: data.completionEvidence ?? undefined,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt ?? new Date().toISOString()),
  };
}

function docToPlan(id: string, data: DocumentData): StudyPlan {
  return {
    id,
    title: data.title ?? '',
    subject: data.subject ?? '',
    durationDays: data.durationDays ?? 0,
    dailyHours: data.dailyHours ?? 0,
    totalHours: data.totalHours ?? 0,
    topics: data.topics ?? [],
    days: data.days ?? [],
    totalTasks: data.totalTasks ?? 0,
    completedTasks: data.completedTasks ?? 0,
    progress: data.progress ?? 0,
    isSample: data.isSample ?? false,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt ?? new Date().toISOString()),
  };
}

function docToQuizResult(id: string, data: DocumentData): QuizResult {
  return {
    id,
    subject: data.subject ?? '',
    topic: data.topic ?? '',
    score: data.score ?? 0,
    total: data.total ?? data.total_questions ?? 0,
    percentage: data.percentage ?? 0,
    completedAt: data.completedAt instanceof Timestamp
      ? data.completedAt.toDate().toISOString()
      : (data.completedAt ?? new Date().toISOString()),
  };
}

// ─── Activity logging (fire-and-forget) ────────────────────────────────────

export async function logActivity(type: string, description: string) {
  try {
    await addDoc(collection(db, ACTIVITY_LOGS), {
      type,
      description,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Activity logs are non-critical — never throw
  }
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

export async function fsTasks_getAll(filter: string = 'all'): Promise<Task[]> {
  const snap = await getDocs(
    query(collection(db, TASKS), orderBy('createdAt', 'desc'))
  );
  let tasks: Task[] = snap.docs.map(d => docToTask(d.id, d.data()));

  const todayStr = new Date().toISOString().split('T')[0];
  if (filter === 'today')       return tasks.filter(t => t.dueDate === todayStr);
  if (filter === 'upcoming')    return tasks.filter(t => t.dueDate > todayStr && !t.completed);
  if (filter === 'completed')   return tasks.filter(t => t.completed || t.status === 'Completed');
  if (filter === 'not_started') return tasks.filter(t => t.status === 'Not started');
  if (filter === 'in_progress') return tasks.filter(t => t.status === 'In progress');
  return tasks;
}

export async function fsTasks_create(task: Partial<Task>): Promise<Task> {
  const data = {
    title: task.title ?? 'New Task',
    description: task.description ?? task.notes ?? '',
    subject: task.subject ?? 'General Study',
    dueDate: task.dueDate ?? new Date().toISOString().split('T')[0],
    dueTime: task.dueTime ?? '18:00',
    priority: task.priority ?? 'Medium',
    status: task.status ?? 'Not started',
    completed: task.status === 'Completed' ? true : (task.completed ?? false),
    resourceUrl: task.resourceUrl ?? null,
    notes: task.notes ?? '',
    completedAt: task.completedAt ?? null,
    completionType: task.completionType ?? null,
    completionEvidence: task.completionEvidence ?? null,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, TASKS), data);
  await logActivity('task_created', `Created task: ${data.title}`);
  return { ...data, id: ref.id, createdAt: new Date().toISOString() } as Task;
}

export async function fsTasks_update(id: string, updates: Partial<Task>): Promise<Task> {
  const ref = doc(db, TASKS, id);
  const patch: Record<string, unknown> = {};

  if (updates.title !== undefined)             patch.title = updates.title;
  if (updates.description !== undefined)       patch.description = updates.description;
  if (updates.subject !== undefined)           patch.subject = updates.subject;
  if (updates.dueDate !== undefined)           patch.dueDate = updates.dueDate;
  if (updates.dueTime !== undefined)           patch.dueTime = updates.dueTime;
  if (updates.priority !== undefined)          patch.priority = updates.priority;
  if (updates.status !== undefined)            patch.status = updates.status;
  if (updates.completed !== undefined)         patch.completed = updates.completed;
  if (updates.resourceUrl !== undefined)       patch.resourceUrl = updates.resourceUrl ?? null;
  if (updates.completedAt !== undefined)       patch.completedAt = updates.completedAt ?? null;
  if (updates.completionType !== undefined)    patch.completionType = updates.completionType ?? null;
  if (updates.completionEvidence !== undefined) patch.completionEvidence = updates.completionEvidence ?? null;
  if (updates.notes !== undefined)             patch.notes = updates.notes;

  // Derived consistency
  if (updates.status === 'Completed') {
    patch.completed = true;
    if (!patch.completedAt) patch.completedAt = new Date().toISOString();
  } else if (updates.status !== undefined) {
    patch.completed = false;
    patch.completedAt = null;
  }

  await updateDoc(ref, patch);

  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Task not found after update');
  return docToTask(snap.id, snap.data());
}

export async function fsTasks_delete(id: string): Promise<void> {
  await deleteDoc(doc(db, TASKS, id));
  await logActivity('task_deleted', `Deleted task ${id}`);
}

// ─── Study Plans ────────────────────────────────────────────────────────────

export async function fsPlans_getAll(): Promise<StudyPlan[]> {
  const snap = await getDocs(
    query(collection(db, PLANS), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => docToPlan(d.id, d.data()));
}

export async function fsPlans_create(planData: {
  title: string;
  subject: string;
  duration_days: number;
  daily_hours: number;
  topics: string[];
  days?: StudyPlan['days'];
}): Promise<StudyPlan> {
  const days = planData.days ?? planData.topics.map((t, i) => ({
    day: i + 1,
    title: t,
    hours: planData.daily_hours,
    topics: [t, `Practice problem set ${i + 1}`],
    tasks: [
      { id: `t-${i + 1}-1`, title: `Study ${t}`, completed: false },
      { id: `t-${i + 1}-2`, title: `Solve practice problems for ${t}`, completed: false },
    ],
  }));

  const totalTasks = days.reduce((acc, d) => acc + d.tasks.length, 0);

  const data = {
    title: planData.title,
    subject: planData.subject,
    durationDays: planData.duration_days,
    dailyHours: planData.daily_hours,
    totalHours: planData.duration_days * planData.daily_hours,
    topics: planData.topics,
    days,
    totalTasks,
    completedTasks: 0,
    progress: 0,
    isSample: false,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, PLANS), data);
  await logActivity('plan_created', `Created study plan: ${data.title}`);
  return { ...data, id: ref.id, createdAt: new Date().toISOString() };
}

export async function fsPlans_toggleTask(
  planId: string,
  dayNumber: number,
  taskId: string,
  completed: boolean
): Promise<void> {
  const ref = doc(db, PLANS, planId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Plan not found');

  const plan = docToPlan(snap.id, snap.data());
  const day = plan.days.find(d => d.day === dayNumber);
  if (!day) throw new Error('Day not found in plan');

  const task = day.tasks.find(t => t.id === taskId);
  if (task) task.completed = completed;

  const total = plan.days.reduce((acc, d) => acc + d.tasks.length, 0);
  const done = plan.days.reduce((acc, d) => acc + d.tasks.filter(t => t.completed).length, 0);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  await updateDoc(ref, {
    days: plan.days,
    completedTasks: done,
    progress,
  });
}

export async function fsPlans_delete(planId: string): Promise<void> {
  await deleteDoc(doc(db, PLANS, planId));
  await logActivity('plan_deleted', `Deleted study plan ${planId}`);
}

// ─── Quiz Results ───────────────────────────────────────────────────────────

export async function fsQuiz_submit(payload: {
  subject: string;
  topic: string;
  score: number;
  total_questions: number;
}): Promise<QuizResult> {
  const pct = payload.total_questions > 0
    ? Math.round((payload.score / payload.total_questions) * 100)
    : 0;

  const data = {
    subject: payload.subject,
    topic: payload.topic,
    score: payload.score,
    total: payload.total_questions,
    percentage: pct,
    completedAt: new Date().toISOString(),
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, QUIZ_RESULTS), data);
  await logActivity('quiz_completed', `Completed quiz on ${payload.topic} — ${payload.score}/${payload.total_questions} (${pct}%)`);

  return { ...data, id: ref.id };
}

export async function fsQuiz_getHistory(): Promise<QuizResult[]> {
  const snap = await getDocs(
    query(collection(db, QUIZ_RESULTS), orderBy('createdAt', 'desc'), limit(50))
  );
  return snap.docs.map(d => docToQuizResult(d.id, d.data()));
}

// ─── Progress (computed from Firestore data) ────────────────────────────────

export async function fsProgress_get(): Promise<ProgressStats> {
  const [tasks, quizzes, plans] = await Promise.all([
    fsTasks_getAll('all'),
    fsQuiz_getHistory(),
    fsPlans_getAll(),
  ]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed || t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In progress').length;
  const notStartedTasks = tasks.filter(t => t.status === 'Not started').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const avgQuizScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((acc, q) => acc + q.percentage, 0) / quizzes.length)
    : 0;

  // Streak: count consecutive days with at least one completion going back from today
  const completionDays = new Set(
    tasks
      .filter(t => t.completedAt)
      .map(t => t.completedAt!.split('T')[0])
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (completionDays.has(ds)) streak++;
    else break;
  }

  // Subject breakdown
  const subjectMap: Record<string, { total: number; completed: number }> = {};
  tasks.forEach(t => {
    const s = t.subject || 'General';
    if (!subjectMap[s]) subjectMap[s] = { total: 0, completed: 0 };
    subjectMap[s].total++;
    if (t.completed || t.status === 'Completed') subjectMap[s].completed++;
  });
  const subjectStats = Object.entries(subjectMap).map(([subject, { total, completed }]) => ({
    subject,
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }));

  // Weekly activity (estimate: each completed task ≈ 1.5 hrs, each quiz ≈ 0.5 hrs)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyActivity = days.map(day => ({ day, hours: 0, target: 2.0 }));

  const recentActivity = [
    ...(quizzes.slice(0, 3).map(q => ({
      type: 'quiz_completed',
      description: `Completed quiz on ${q.topic} — ${q.score}/${q.total} (${q.percentage}%)`,
      timestamp: q.completedAt,
    }))),
    ...(tasks
      .filter(t => t.completedAt)
      .slice(0, 3)
      .map(t => ({
        type: 'task_completed',
        description: `Completed: ${t.title}`,
        timestamp: t.completedAt!,
      }))),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5);

  const totalSubtasks = plans.reduce((acc, p) => acc + p.totalTasks, 0);
  const completedSubtasks = plans.reduce((acc, p) => acc + p.completedTasks, 0);

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    notStartedTasks,
    completionRate,
    activePlans: plans.filter(p => p.progress < 100).length,
    totalSubtasks,
    completedSubtasks,
    loggedHours: Math.round(completedTasks * 1.5 + quizzes.length * 0.5),
    avgQuizScore,
    currentStreak: streak,
    weeklyActivity,
    subjectStats,
    quizHistory: quizzes,
    recentActivity,
  };
}

// ─── Seed initial data if Firestore is empty ────────────────────────────────

/**
 * Checks if there are any tasks in Firestore. If not, seeds a sample task and
 * a sample study plan so the dashboard doesn't appear completely empty on first visit.
 */
export async function fsEnsureInitialData(): Promise<void> {
  try {
    const taskSnap = await getDocs(query(collection(db, TASKS), limit(1)));
    if (!taskSnap.empty) return; // Data already exists — nothing to seed

    // Seed one sample task
    await addDoc(collection(db, TASKS), {
      title: 'Practice Two-Pointer Array problems',
      description: 'Solve 3 medium LeetCode questions on Two Sum II and Container With Most Water',
      subject: 'Data Structures',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '18:00',
      priority: 'High',
      status: 'Not started',
      completed: false,
      resourceUrl: 'https://leetcode.com/tag/two-pointers/',
      notes: 'Focus on Two Sum II and Container With Most Water',
      completedAt: null,
      completionType: null,
      completionEvidence: null,
      createdAt: serverTimestamp(),
    });

    // Seed one sample study plan
    await addDoc(collection(db, PLANS), {
      title: '5-Day DSA Master Plan (Sample)',
      subject: 'Data Structures & Algorithms',
      durationDays: 5,
      dailyHours: 2,
      totalHours: 10,
      topics: ['Arrays & Two Pointers', 'Binary Search', 'Stacks & Queues', 'Linked Lists', 'Trees & BST'],
      totalTasks: 10,
      completedTasks: 0,
      progress: 0,
      isSample: true,
      createdAt: serverTimestamp(),
      days: [
        { day: 1, title: 'Arrays & Two Pointers', hours: 2, topics: ['Dynamic Arrays', 'Prefix Sums', 'Two Pointers'], tasks: [{ id: 'd1-t1', title: 'Solve 2Sum & 3Sum', completed: false }, { id: 'd1-t2', title: 'Sliding Window Maximum', completed: false }] },
        { day: 2, title: 'Binary Search & Sorting', hours: 2, topics: ['Binary Search in Rotated Array', 'Merge Sort'], tasks: [{ id: 'd2-t1', title: 'Search in Rotated Sorted Array', completed: false }, { id: 'd2-t2', title: 'Kth Largest Element', completed: false }] },
        { day: 3, title: 'Stacks & Queues', hours: 2, topics: ['Monotonic Stack', 'Queue using Stacks'], tasks: [{ id: 'd3-t1', title: 'Daily Temperatures problem', completed: false }, { id: 'd3-t2', title: 'Valid Parentheses', completed: false }] },
        { day: 4, title: 'Linked Lists', hours: 2, topics: ["Floyd's Cycle Detection", 'Reverse Linked List'], tasks: [{ id: 'd4-t1', title: 'Detect & remove loop', completed: false }, { id: 'd4-t2', title: 'Palindrome linked list', completed: false }] },
        { day: 5, title: 'Trees & BST', hours: 2, topics: ['Tree Traversals', 'Validate BST'], tasks: [{ id: 'd5-t1', title: 'Level order traversal', completed: false }, { id: 'd5-t2', title: 'Lowest Common Ancestor', completed: false }] },
      ],
    });

    console.info('[StudyMate] Seeded initial Firestore data for new user.');
  } catch (err) {
    // Non-critical — app still works without seed data
    console.warn('[StudyMate] Firestore seed skipped:', err);
  }
}
