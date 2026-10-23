import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task, TaskStatus, CompletionType } from '../types';
import {
  CheckSquare,
  Plus,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowUpDown,
  RotateCcw,
  BookOpen,
  FileText,
  HelpCircle,
  Award,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const {
    tasks,
    createTask,
    updateTask,
    reopenTask,
    completeTaskWithEvidence,
    deleteTask,
    sendMessage,
    setCurrentView,
    progress
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'in_progress' | 'not_started' | 'completed' | 'today' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'priority'>('time');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Evidence modal state
  const [evidenceModalTask, setEvidenceModalTask] = useState<Task | null>(null);
  const [completionType, setCompletionType] = useState<CompletionType>('self_reported');
  const [evidenceText, setEvidenceText] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);

  // Form states for creating task
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Data Structures');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('18:00');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Not started');
  const [resourceUrl, setResourceUrl] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const sanitizeAndValidateUrl = (urlStr: string): string | null => {
    if (!urlStr || !urlStr.trim()) return null;
    let trimmed = urlStr.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
    } catch {}
    return null;
  };

  const handleOpenResource = (rawUrl?: string) => {
    if (!rawUrl) return;
    const validated = sanitizeAndValidateUrl(rawUrl);
    if (validated) {
      setUrlValidationError(null);
      window.open(validated, '_blank', 'noopener,noreferrer');
    } else {
      setUrlValidationError(`Invalid URL: "${rawUrl}". Please provide a valid web address.`);
      setTimeout(() => setUrlValidationError(null), 4000);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let validResource: string | undefined = undefined;
    if (resourceUrl.trim()) {
      const v = sanitizeAndValidateUrl(resourceUrl.trim());
      if (v) validResource = v;
    }

    await createTask({
      title: title.trim(),
      description: description.trim(),
      subject,
      dueDate,
      dueTime,
      priority,
      status,
      resourceUrl: validResource,
      notes: description.trim()
    });

    setTitle('');
    setDescription('');
    setResourceUrl('');
    setIsModalOpen(false);
  };

  const handleOpenEvidenceModal = (task: Task) => {
    setEvidenceModalTask(task);
    if (task.resourceUrl) {
      setCompletionType('self_reported');
    } else if (progress?.quizHistory && progress.quizHistory.length > 0) {
      setCompletionType('evidence_submitted');
    } else {
      setCompletionType('self_reported');
    }
    setEvidenceText('');
    setSelectedQuizId('');
  };

  const handleConfirmCompletion = async () => {
    if (!evidenceModalTask) return;

    let finalEvidence = evidenceText.trim();
    if (completionType === 'quiz_verified') {
      const q = progress?.quizHistory?.find(item => item.completedAt === selectedQuizId);
      finalEvidence = q
        ? `Verified via ${q.subject} quiz (Score: ${q.score}/${q.total}, ${q.percentage}%)`
        : 'Verified via quiz completion attempt';
    } else if (completionType === 'self_reported' && !finalEvidence) {
      finalEvidence = 'Student confirmed independent review of study material.';
    } else if (completionType === 'evidence_submitted' && !finalEvidence) {
      finalEvidence = 'Assignment work completed and submitted.';
    }

    await completeTaskWithEvidence(evidenceModalTask.id, completionType, finalEvidence);
    setEvidenceModalTask(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (filter === 'today') return t.dueDate === todayStr;
    if (filter === 'upcoming') return t.dueDate > todayStr && !t.completed && t.status !== 'Completed';
    if (filter === 'completed') return t.completed || t.status === 'Completed';
    if (filter === 'in_progress') return t.status === 'In progress';
    if (filter === 'not_started') return t.status === 'Not started';
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const pMap = { High: 3, Medium: 2, Low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    }
    const aDate = `${a.dueDate} ${a.dueTime}`;
    const bDate = `${b.dueDate} ${b.dueTime}`;
    return aDate.localeCompare(bDate);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-heading font-bold text-white flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            <span>My Tasks & Study Deliverables</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Organize assignments, inspect validated external resources, and record verified study completions
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              sendMessage("Remind me to practice arrays at 6 PM.");
              setCurrentView('assistant');
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-white/10 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice / AI Add</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Task</span>
          </button>
        </div>
      </div>

      {/* URL Validation Notice Toast */}
      {urlValidationError && (
        <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{urlValidationError}</span>
          </div>
          <button onClick={() => setUrlValidationError(null)} className="text-rose-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All (${tasks.length})` },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'not_started', label: 'Not Started' },
            { id: 'completed', label: 'Completed' },
            { id: 'today', label: 'Today' },
            { id: 'upcoming', label: 'Upcoming' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 flex items-center space-x-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort by:</span>
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 text-slate-200 text-xs focus:outline-none"
          >
            <option value="time">Due Time / Date</option>
            <option value="priority">Priority (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {sortedTasks.map(task => {
          const isDone = task.completed || task.status === 'Completed';
          const isOverdue = !isDone && task.dueDate < todayStr;

          return (
            <div
              key={task.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 group ${
                isDone
                  ? 'bg-slate-900/40 border-white/5 opacity-80'
                  : isOverdue
                  ? 'bg-rose-950/20 border-rose-500/30 shadow-lg shadow-rose-950/20'
                  : 'bg-slate-900/70 hover:bg-slate-800/80 border-white/10 hover:border-indigo-500/30 shadow-xl'
              }`}
            >
              {/* Task Details & Metadata */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className={`text-sm md:text-base font-semibold transition-all ${
                      isDone ? 'text-slate-400 line-through' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h4>

                  {/* Status Pill */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      task.status === 'Completed' || isDone
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : task.status === 'In progress'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border border-white/10'
                    }`}
                  >
                    {task.status || (isDone ? 'Completed' : 'Not started')}
                  </span>

                  {isOverdue && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      OVERDUE
                    </span>
                  )}
                </div>

                {/* Description */}
                {(task.description || task.notes) && (
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    {task.description || task.notes}
                  </p>
                )}

                {/* Meta details & Resource link */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-medium">
                    {task.subject}
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{task.dueDate}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{task.dueTime}</span>
                  </span>
                  <span>•</span>
                  <span
                    className={`font-semibold ${
                      task.priority === 'High'
                        ? 'text-rose-400'
                        : task.priority === 'Medium'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {task.priority} Priority
                  </span>
                </div>

                {/* External Resource Action (Does NOT mark complete!) */}
                {task.resourceUrl && (
                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenResource(task.resourceUrl)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium transition-colors"
                      title="Open resource in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Open Resource: {task.resourceUrl.length > 40 ? task.resourceUrl.substring(0, 40) + '...' : task.resourceUrl}</span>
                    </button>
                    <span className="text-[10px] text-slate-500 italic">
                      (Opens externally; does not mark complete)
                    </span>
                  </div>
                )}

                {/* Completion Evidence Details if task is completed */}
                {isDone && task.completedAt && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-300 space-y-1">
                    <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        Completed on {new Date(task.completedAt).toLocaleString()} • {task.completionType === 'self_reported' ? 'Self-Reported Review' : task.completionType === 'quiz_verified' ? 'Quiz Verified' : 'Evidence Submitted'}
                      </span>
                    </div>
                    {task.completionEvidence && (
                      <p className="text-[11px] text-slate-300 italic pl-5">
                        "{task.completionEvidence}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons: Status updates, Complete with Evidence, Reopen, Delete */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                <div className="flex items-center space-x-2">
                  {!isDone ? (
                    <>
                      {task.status !== 'In progress' && (
                        <button
                          onClick={() => updateTask(task.id, { status: 'In progress' })}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors"
                          title="Mark task as In Progress"
                        >
                          Start Task
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEvidenceModal(task)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Complete</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => reopenTask(task.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-semibold transition-all border border-cyan-500/30 flex items-center space-x-1.5"
                      title="Reopen this completed task"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Reopen Task</span>
                    </button>
                  )}

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sortedTasks.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-white/10">
            <CheckSquare className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No tasks match this filter</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add a new task or ask StudyMate AI: "Remind me to study DSA at 6 PM"
            </p>
          </div>
        )}
      </div>

      {/* Completion Evidence Confirmation Modal */}
      {evidenceModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-white/5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Verify & Complete Task
                </span>
                <h3 className="text-base font-heading font-bold text-white mt-0.5">
                  {evidenceModalTask.title}
                </h3>
              </div>
              <button
                onClick={() => setEvidenceModalTask(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {evidenceModalTask.resourceUrl ? (
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
                  <p className="font-semibold text-indigo-300">
                    External Resource Linked
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    External platforms cannot verify progress automatically. Please confirm you completed the review and submit self-reported takeaways.
                  </p>
                </div>
              ) : (
                <p className="text-slate-300 text-xs">
                  Choose your completion verification method:
                </p>
              )}

              {/* Completion Type Options */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCompletionType('self_reported')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    completionType === 'self_reported'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                  <span className="block font-semibold text-[11px]">Self-Reported</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompletionType('evidence_submitted')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    completionType === 'evidence_submitted'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                  <span className="block font-semibold text-[11px]">Work Evidence</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompletionType('quiz_verified')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    completionType === 'quiz_verified'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Award className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <span className="block font-semibold text-[11px]">Quiz Verified</span>
                </button>
              </div>

              {/* Dynamic input depending on completion type */}
              {completionType === 'quiz_verified' ? (
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Link a Completed Quiz Score
                  </label>
                  {progress?.quizHistory && progress.quizHistory.length > 0 ? (
                    <select
                      value={selectedQuizId}
                      onChange={e => setSelectedQuizId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    >
                      <option value="">Select quiz attempt...</option>
                      {progress.quizHistory.map(q => (
                        <option key={q.completedAt} value={q.completedAt}>
                          {q.subject} ({q.score}/{q.total} • {q.percentage}%) - {new Date(q.completedAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-xl">
                      No quiz attempts found yet. Take a quiz in the Quiz Center to link verified scores.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    {completionType === 'self_reported'
                      ? 'Study Reflection / Summary (Optional)'
                      : 'Solution Notes or Submission Evidence (Required)'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      completionType === 'self_reported'
                        ? 'e.g. Completed reading on joins and solved 2 practice queries...'
                        : 'Paste problem solution code, concept notes, or answer summary...'
                    }
                    value={evidenceText}
                    onChange={e => setEvidenceText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setEvidenceModalTask(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-xs shadow-md shadow-emerald-600/30"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl">
            <h3 className="text-lg font-heading font-bold text-white mb-1">
              Add Study Task or Deliverable
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Create an actionable task with optional external resource link and deadline
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solve 3 LeetCode Two-Pointer problems"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description / Deliverable</label>
                <textarea
                  rows={2}
                  placeholder="Task instructions, key requirements, or questions to answer..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Data Structures">Data Structures</option>
                    <option value="Java OOP">Java OOP</option>
                    <option value="DBMS">DBMS</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Other / General">Other / General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Not started">Not started</option>
                    <option value="In progress">In progress</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-slate-300 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-slate-300 font-medium mb-1">Due Time</label>
                  <input
                    type="time"
                    required
                    value={dueTime}
                    onChange={e => setDueTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Resource URL (Optional, e.g. LeetCode, GitHub, Docs)
                </label>
                <input
                  type="url"
                  placeholder="https://leetcode.com/problem-list/..."
                  value={resourceUrl}
                  onChange={e => setResourceUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md shadow-emerald-600/30"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
