import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { QuizQuestion, QuizResult, QuizResponse } from '../types';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Info,
  AlertCircle,
  Loader2,
  Sliders,
  PenTool
} from 'lucide-react';

export const QuizCenterView: React.FC = () => {
  const { submitQuizResult, sendMessage, setCurrentView, backendStatus } = useApp();

  // Subject & Topic inputs
  const [selectedPreset, setSelectedPreset] = useState('Data Structures & Algorithms');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [specificTopic, setSpecificTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [isLoading, setIsLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Active quiz session states
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizMeta, setQuizMeta] = useState<{
    subject: string;
    topic: string;
    mode?: string;
    provider?: string;
    notice?: string;
  } | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const activeSubject = isCustomSubject
    ? (customSubject.trim() || 'General Computer Science')
    : selectedPreset;

  const startQuiz = async () => {
    setIsLoading(true);
    setQuizError(null);
    try {
      const activeTopic = specificTopic.trim() || activeSubject;
      const data: QuizResponse = await api.getQuizQuestions(activeSubject, activeTopic, difficulty, questionCount);

      if (!data.questions || data.questions.length === 0) {
        setQuizError('No questions could be assembled for this topic. Please try rephrasing or picking another topic.');
        setIsLoading(false);
        return;
      }

      setQuestions(data.questions);
      setQuizMeta({
        subject: data.subject || activeSubject,
        topic: data.topic || activeTopic,
        mode: data.mode,
        provider: data.provider,
        notice: data.notice
      });
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setQuizResult(null);
      setIsQuizActive(true);
    } catch (err: any) {
      console.error('Quiz start error:', err);
      setQuizError(err.message || 'Failed to generate quiz. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        score++;
      }
    });

    const pct = Math.round((score / questions.length) * 100);
    const resolvedTopic = quizMeta?.topic || specificTopic || activeSubject;

    const resultPayload = {
      subject: activeSubject,
      topic: `${resolvedTopic} (${difficulty})`,
      score,
      total_questions: questions.length
    };

    await submitQuizResult(resultPayload);
    setQuizResult({
      subject: activeSubject,
      topic: `${resolvedTopic} (${difficulty})`,
      score,
      total: questions.length,
      percentage: pct,
      completedAt: new Date().toISOString()
    });
    setIsSubmitted(true);

    // Confetti celebration if passed with >= 70%
    if (pct >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const resetQuiz = () => {
    setIsQuizActive(false);
    setIsSubmitted(false);
    setQuestions([]);
    setSelectedAnswers({});
    setQuizResult(null);
    setQuizMeta(null);
    setQuizError(null);
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-heading font-bold text-white flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-violet-400" />
            <span>Interactive Quiz Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Test and validate your technical knowledge on any subject or arbitrary topic with verified answer explanations
          </p>
        </div>

        <button
          onClick={() => {
            sendMessage("Create a quiz about Python AsyncIO.");
            setCurrentView('assistant');
          }}
          className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-white/10 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ask AI to Quiz You</span>
        </button>
      </div>

      {!isQuizActive ? (
        /* Quiz Setup Form */
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-600/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-heading font-bold text-white">Start a Knowledge Sprint</h3>
            <p className="text-xs text-slate-400 mt-1">
              Test any subject or specific topic. Live AI is used if configured; transparent offline generator used in Demo Mode.
            </p>
          </div>

          {/* Error Banner */}
          {quizError && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-200 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{quizError}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            {/* Subject Selector: Preset vs Custom */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-medium">Subject / Domain</label>
                <button
                  type="button"
                  onClick={() => setIsCustomSubject(!isCustomSubject)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                >
                  <PenTool className="w-3 h-3" />
                  <span>{isCustomSubject ? 'Pick from Presets' : 'Type Custom Subject'}</span>
                </button>
              </div>

              {isCustomSubject ? (
                <input
                  type="text"
                  placeholder="e.g. Machine Learning, Quantum Computing, Python, World History..."
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <select
                  value={selectedPreset}
                  onChange={e => setSelectedPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                  <option value="Java">Java OOP & Concurrency</option>
                  <option value="DBMS">Database Management Systems (DBMS)</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Web Development">Web Development (React / APIs)</option>
                  <option value="Machine Learning">Machine Learning Foundations</option>
                </select>
              )}
            </div>

            {/* Specific Topic / Subtopic */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Specific Topic or Subtopic (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Binary Search in Rotated Array, SQL Joins, Deadlock Prevention, Qubits..."
                value={specificTopic}
                onChange={e => setSpecificTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Leave blank to test general domain concepts, or enter a specific focus area.
              </span>
            </div>

            {/* Difficulty and Question Count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Beginner">Beginner (Foundations & Syntax)</option>
                  <option value="Intermediate">Intermediate (Interviews & Analysis)</option>
                  <option value="Advanced">Advanced (System Edge Cases)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Question Count</label>
                <select
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={3}>3 Quick Questions</option>
                  <option value={5}>5 Questions (Standard Sprint)</option>
                  <option value={6}>6 Questions (Extended Drill)</option>
                </select>
              </div>
            </div>

            {/* AI Provider Transparency Notice */}
            <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 flex items-start space-x-2 text-[11px] text-slate-400">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-semibold block">Generation Engine:</span>
                <span>
                  {backendStatus.mode === 'live'
                    ? 'Connected to live LLM model. Dynamic questions are generated in real-time.'
                    : 'Operating in Demo Mode. Known CS topics use our verified question bank; arbitrary topics use the offline curriculum generator. Configure backend API keys in Settings to enable live LLM generation.'}
                </span>
              </div>
            </div>

            <button
              onClick={startQuiz}
              disabled={isLoading}
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Questions for {activeSubject}...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Quiz Sprint</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Active Quiz Question Runner */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress Header & Mode Badge */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs text-white font-semibold">{quizMeta?.subject}</span>
              {quizMeta?.topic && quizMeta.topic !== quizMeta.subject && (
                <span className="text-xs text-slate-400">({quizMeta.topic})</span>
              )}

              {/* Mode Badge (Never pretend to be AI if demo!) */}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  quizMeta?.mode === 'ai_generated'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : quizMeta?.mode === 'curated_bank'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {quizMeta?.mode === 'ai_generated'
                  ? 'AI Generated'
                  : quizMeta?.mode === 'curated_bank'
                  ? 'Curated Question Bank'
                  : 'Offline Demo Generator'}
              </span>
            </div>

            <button
              onClick={resetQuiz}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Exit Quiz</span>
            </button>
          </div>

          {/* Offline Generator Notice if in Demo Fallback Mode */}
          {quizMeta?.mode === 'demo_fallback' && (
            <div className="px-4 py-2 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-center space-x-2">
              <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>
                Demo Mode: Generated using offline curriculum templates. Configure backend API keys in Settings to connect live LLM.
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          {currentQ && (
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl">
              <h3 className="text-base md:text-lg font-heading font-bold text-white mb-6 leading-snug">
                {currentQ.question}
              </h3>

              {/* Multiple Choice Options */}
              <div className="space-y-3">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === oIdx;
                  let borderClass = 'border-white/10 hover:border-violet-500/40 bg-slate-800/60';
                  let icon = null;

                  if (isSubmitted) {
                    if (oIdx === currentQ.correctAnswer) {
                      borderClass = 'border-emerald-500/80 bg-emerald-950/40 text-emerald-200';
                      icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
                    } else if (isSelected) {
                      borderClass = 'border-rose-500/80 bg-rose-950/40 text-rose-200';
                      icon = <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />;
                    }
                  } else if (isSelected) {
                    borderClass = 'border-violet-500 bg-violet-950/40 shadow-md shadow-violet-500/20';
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      disabled={isSubmitted}
                      className={`w-full p-4 rounded-xl border text-left text-xs md:text-sm font-medium transition-all flex items-center justify-between ${borderClass}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-700/60 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="text-slate-200">{opt}</span>
                      </div>
                      {icon}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (Shown after submission) */}
              {isSubmitted && (
                <div className="mt-6 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs">
                  <span className="font-bold text-indigo-400 block mb-1">
                    Concept Explanation:
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="mt-8 flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white disabled:opacity-30 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-2">
                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : !isSubmitted ? (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(selectedAnswers).length < questions.length}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-40"
                    >
                      Submit & Calculate Score
                    </button>
                  ) : (
                    <button
                      onClick={resetQuiz}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
                    >
                      Complete & Retake
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Summary Card */}
          {quizResult && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 text-center shadow-2xl backdrop-blur-xl">
              <Award className="w-12 h-12 text-amber-400 mx-auto mb-2 animate-bounce" />
              <h3 className="text-xl font-heading font-black text-white">Quiz Completed!</h3>
              <p className="text-xs text-slate-300 mt-1">
                You scored <strong className="text-cyan-300">{quizResult.score}</strong> out of {quizResult.total} questions ({quizResult.percentage}%)
              </p>
              <div className="mt-4 flex items-center justify-center space-x-3">
                <button
                  onClick={resetQuiz}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Take Another Quiz
                </button>
                <button
                  onClick={() => setCurrentView('progress')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  View in Progress Analytics
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
