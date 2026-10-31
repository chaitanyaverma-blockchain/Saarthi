import { useState, useEffect } from 'react';
import {
  Plus,
  HelpCircle,
  Trophy,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  FileText,
  X,
  Play,
  Check,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { api } from '../services/api';

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal: Generate Quiz
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  // Active Quiz Runner State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [question_id]: 'A' | 'B' | 'C' | 'D' }
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Active Quiz Result View
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    fetchQuizData();
  }, []);

  // Timer effect during active quiz
  useEffect(() => {
    let interval = null;
    if (activeQuiz && !quizResult) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, quizResult]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const [quizRes, attemptRes, docRes] = await Promise.all([
        api.get('/quizzes/'),
        api.get('/quizzes/attempts/'),
        api.get('/documents/'),
      ]);
      const quizList = Array.isArray(quizRes.data) ? quizRes.data : Array.isArray(quizRes.data?.data) ? quizRes.data.data : (Array.isArray(quizRes) ? quizRes : []);
      const attemptList = Array.isArray(attemptRes.data) ? attemptRes.data : Array.isArray(attemptRes.data?.data) ? attemptRes.data.data : (Array.isArray(attemptRes) ? attemptRes : []);
      const docList = Array.isArray(docRes.data) ? docRes.data : Array.isArray(docRes.data?.data) ? docRes.data.data : (Array.isArray(docRes) ? docRes : []);
      setQuizzes(quizList);
      setAttempts(attemptList);
      setDocuments(docList);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGenerateModal = () => {
    setSubject('');
    setTopic('');
    setDifficulty('medium');
    setNumQuestions(5);
    setSelectedDocId('');
    setGenerateError('');
    setIsGenerateModalOpen(true);
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setGenerateError('Please enter a topic for the quiz.');
      return;
    }

    try {
      setGenerating(true);
      setGenerateError('');

      const payload = {
        topic: topic.trim(),
        subject: subject.trim() || 'General',
        difficulty,
        num_questions: parseInt(numQuestions, 10),
      };

      if (selectedDocId) {
        payload.document_id = selectedDocId;
      }

      const res = await api.post('/quizzes/', payload);
      const createdQuiz = res.data;

      setIsGenerateModalOpen(false);
      await fetchQuizData();

      // Start the quiz immediately
      startQuiz(createdQuiz.id);
    } catch (err) {
      console.error('Quiz generation error:', err);
      setGenerateError(err.message || 'Gemini quiz generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const startQuiz = async (quizId) => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/${quizId}/`);
      const quizObj = res.data?.data || res.data || res;
      setActiveQuiz(quizObj);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTimerSeconds(0);
      setQuizResult(null);
    } catch (err) {
      alert(err.message || 'Failed to start quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionKey) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    const questions = activeQuiz.questions || [];
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount < questions.length) {
      const confirmIncomplete = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Submit anyway?`
      );
      if (!confirmIncomplete) return;
    }

    try {
      setSubmittingQuiz(true);
      const res = await api.post(`/quizzes/${activeQuiz.id}/submit/`, {
        answers: selectedAnswers,
        time_taken_seconds: timerSeconds,
      });

      const resultData = res.data?.data || res.data || res;
      setQuizResult(resultData);
      await fetchQuizData();
    } catch (err) {
      alert(err.message || 'Failed to submit quiz.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleExitQuiz = () => {
    setActiveQuiz(null);
    setQuizResult(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
  };

  // Stats calculation
  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts)
    : 0;
  const avgSeconds = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0) / totalAttempts)
    : 0;

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz Generator"
        description="Auto-generate intelligent multiple-choice quizzes from your study topics or uploaded PDFs."
        action={
          !activeQuiz && (
            <Button icon={Plus} onClick={handleOpenGenerateModal}>
              Generate Quiz
            </Button>
          )
        }
      />

      {/* QUIZ RUNNER SCREEN */}
      {activeQuiz && !quizResult && (
        <Card className="space-y-6 border-brand-primary/30 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default">{activeQuiz.subject}</Badge>
                <Badge variant="neutral" className="capitalize">
                  {activeQuiz.difficulty}
                </Badge>
              </div>
              <h3 className="text-base font-semibold text-brand-text">{activeQuiz.topic}</h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-brand-bg border border-brand-border text-xs font-mono font-medium text-brand-text">
                <Clock className="w-3.5 h-3.5 text-brand-primary" />
                <span>{formatTimer(timerSeconds)}</span>
              </div>
              <button
                onClick={handleExitQuiz}
                className="text-xs text-brand-text-secondary hover:text-red-600 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Question Palette & Progress */}
          <div>
            <div className="flex items-center justify-between text-xs text-brand-text-secondary mb-2">
              <span>
                Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
              </span>
              <span>
                {Object.keys(selectedAnswers).length} of {activeQuiz.questions.length} answered
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {activeQuiz.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id];
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-7 h-7 rounded-btn text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'ring-2 ring-brand-primary text-white bg-brand-primary'
                        : isAnswered
                        ? 'bg-brand-primary-light text-brand-primary border border-brand-primary/40'
                        : 'bg-brand-bg text-brand-text-secondary border border-brand-border hover:border-brand-primary'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Question View */}
          {activeQuiz.questions[currentQuestionIndex] && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-brand-bg border border-brand-border">
                <p className="text-sm font-medium text-brand-text leading-relaxed">
                  {activeQuiz.questions[currentQuestionIndex].question_text}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((optKey) => {
                  const q = activeQuiz.questions[currentQuestionIndex];
                  const optText = q[`option_${optKey.toLowerCase()}`];
                  const isSelected = selectedAnswers[q.id] === optKey;

                  return (
                    <button
                      key={optKey}
                      type="button"
                      onClick={() => handleSelectOption(q.id, optKey)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary-light/50 text-brand-text ring-1 ring-brand-primary'
                          : 'border-brand-border bg-brand-surface hover:bg-brand-bg text-brand-text-secondary hover:text-brand-text'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-brand-primary text-white' : 'bg-brand-border/60 text-brand-text-secondary'
                        }`}
                      >
                        {optKey}
                      </span>
                      <span className="text-xs font-medium leading-relaxed mt-0.5">{optText}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-brand-border">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() =>
                    setCurrentQuestionIndex((prev) => Math.min(activeQuiz.questions.length - 1, prev + 1))
                  }
                >
                  <span className="flex items-center gap-1.5">
                    Next <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              ) : (
                <Button size="sm" onClick={handleSubmitQuiz} disabled={submittingQuiz}>
                  {submittingQuiz ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </span>
                  ) : (
                    'Submit Quiz'
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* QUIZ RESULTS AND EXPLANATIONS VIEW */}
      {quizResult && (
        <Card className="space-y-6 animate-in fade-in duration-200">
          {/* Result Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-brand-primary-light/40 border border-brand-primary/20">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                Quiz Evaluation Completed
              </span>
              <h3 className="text-xl font-bold text-brand-text mt-0.5">{quizResult.quiz_topic}</h3>
              <p className="text-xs text-brand-text-secondary mt-1">
                Completed in {formatTimer(quizResult.time_taken_seconds || 0)}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-extrabold text-brand-primary">
                  {Math.round(quizResult.percentage)}%
                </p>
                <p className="text-xs text-brand-text-secondary font-medium">
                  {quizResult.score} of {quizResult.total_questions} Correct
                </p>
              </div>
              <Badge
                variant={quizResult.percentage >= 70 ? 'success' : quizResult.percentage >= 50 ? 'warning' : 'danger'}
                className="text-xs px-3 py-1 font-semibold"
              >
                {quizResult.percentage >= 85
                  ? 'Mastery'
                  : quizResult.percentage >= 70
                  ? 'Proficient'
                  : quizResult.percentage >= 50
                  ? 'Developing'
                  : 'Needs Review'}
              </Badge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-brand-text">Detailed Answer Breakdown & AI Explanations</h4>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => startQuiz(quizResult.quiz_id || activeQuiz?.id)}>
                Retake Quiz
              </Button>
              <Button size="sm" onClick={handleExitQuiz}>
                Back to Quizzes
              </Button>
            </div>
          </div>

          {/* Question Explanations List */}
          <div className="space-y-4">
            {quizResult.answers?.map((ans, idx) => {
              const qText = ans.question_text || ans.question?.question_text;
              const correctOpt = ans.correct_option || ans.question?.correct_option || '';
              const explanation = ans.explanation || ans.question?.explanation;
              const yourOpt = ans.selected_option || 'None';

              const getOptText = (optKey) => {
                if (!optKey || optKey === 'None') return '';
                const lower = String(optKey).toLowerCase();
                return ans[`option_${lower}`] || ans.question?.[`option_${lower}`] || '';
              };

              return (
                <div
                  key={ans.id || idx}
                  className={`p-4 rounded-xl border ${
                    ans.is_correct
                      ? 'border-green-200 bg-green-50/30 dark:border-green-900/60 dark:bg-green-950/20'
                      : 'border-red-200 bg-red-50/30 dark:border-red-900/60 dark:bg-red-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {ans.is_correct ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-brand-text">Question {idx + 1}</span>
                    </div>
                    <Badge variant={ans.is_correct ? 'success' : 'danger'} className="text-[10px]">
                      {ans.is_correct ? 'Correct (+1)' : 'Incorrect (0)'}
                    </Badge>
                  </div>

                  {qText && (
                    <p className="text-xs font-medium text-brand-text mb-3 leading-relaxed">
                      {qText}
                    </p>
                  )}

                  {/* Option comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        ans.is_correct
                          ? 'border-green-300 bg-green-100/50 text-green-900 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300'
                          : 'border-red-300 bg-red-100/50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300'
                      }`}
                    >
                      <span className="font-semibold block mb-0.5">Your Answer:</span>
                      <span className="font-medium">
                        Option {yourOpt}
                        {getOptText(yourOpt) && <span className="ml-1 opacity-90">— {getOptText(yourOpt)}</span>}
                      </span>
                    </div>

                    <div
                      className="p-2.5 rounded-lg border border-green-300 bg-green-100/50 text-green-900 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300"
                    >
                      <span className="font-semibold block mb-0.5">Correct Answer:</span>
                      <span className="font-medium">
                        {correctOpt ? `Option ${correctOpt}` : 'Option N/A'}
                        {getOptText(correctOpt) && <span className="ml-1 opacity-90">— {getOptText(correctOpt)}</span>}
                      </span>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  {explanation && (
                    <div className="p-3 rounded-lg bg-brand-surface border border-brand-border text-xs text-brand-text-secondary leading-relaxed">
                      <span className="font-semibold text-brand-text block mb-1">AI Explanation:</span>
                      {explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* DASHBOARD / MAIN OVERVIEW (Visible when not actively taking a quiz) */}
      {!activeQuiz && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-brand-text">{avgScore}%</p>
                  <p className="text-xs text-brand-text-secondary">Average Score</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-brand-text">{totalAttempts}</p>
                  <p className="text-xs text-brand-text-secondary">Quizzes Attempted</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-brand-text">{formatTimer(avgSeconds)}</p>
                  <p className="text-xs text-brand-text-secondary">Avg. Time per Test</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Generate Card */}
          <Card
            hover
            onClick={handleOpenGenerateModal}
            className="border-2 border-dashed border-brand-border hover:border-brand-primary cursor-pointer transition-all duration-150"
          >
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary-light flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7 text-brand-primary" />
              </div>
              <h3 className="text-sm font-semibold text-brand-text mb-1">Generate a New AI Quiz</h3>
              <p className="text-xs text-brand-text-secondary max-w-md mb-3">
                Input any syllabus topic or pick an uploaded study document to generate tailored multiple-choice tests.
              </p>
              <Button size="sm" icon={Plus}>
                Create Quiz
              </Button>
            </div>
          </Card>

          {/* Quizzes List */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-brand-text">Your Generated Quizzes</h3>
              <span className="text-xs text-brand-text-secondary">{quizzes.length} available</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-10">
                <HelpCircle className="w-10 h-10 text-brand-text-secondary/40 mx-auto mb-2" />
                <p className="text-xs text-brand-text-secondary">No quizzes generated yet.</p>
                <p className="text-[11px] text-brand-text-secondary/70 mt-0.5">
                  Click "Generate Quiz" to test your knowledge with Gemini AI.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 hover:bg-brand-bg rounded-lg transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default" className="text-[10px]">
                          {quiz.subject}
                        </Badge>
                        <Badge variant="neutral" className="capitalize text-[10px]">
                          {quiz.difficulty}
                        </Badge>
                        {quiz.document_title && (
                          <span className="text-[10px] text-brand-text-secondary flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {quiz.document_title}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-brand-text">{quiz.topic}</h4>
                      <p className="text-[11px] text-brand-text-secondary mt-0.5">
                        {quiz.question_count} questions • Created {new Date(quiz.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <Button size="sm" icon={Play} onClick={() => startQuiz(quiz.id)}>
                      Start Quiz
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Quiz Attempts */}
          {attempts.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-brand-text">Recent Test Attempts</h3>
                <span className="text-xs text-brand-text-secondary">{attempts.length} attempts recorded</span>
              </div>
              <div className="divide-y divide-brand-border">
                {attempts.slice(0, 5).map((att) => (
                  <div
                    key={att.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 hover:bg-brand-bg rounded-lg transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-brand-text">{att.quiz_title || att.quiz_topic || 'Quiz'}</span>
                        <Badge
                          variant={att.percentage >= 70 ? 'success' : att.percentage >= 50 ? 'warning' : 'danger'}
                          className="text-[10px]"
                        >
                          {Math.round(att.percentage)}%
                        </Badge>
                      </div>
                      <p className="text-[11px] text-brand-text-secondary">
                        {att.score} of {att.total_questions} correct • {new Date(att.completed_at).toLocaleDateString()} {new Date(att.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActiveQuiz({ id: att.quiz_id, topic: att.quiz_topic, title: att.quiz_title });
                        setQuizResult(att);
                      }}
                    >
                      Review Answers
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* GENERATE QUIZ MODAL */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <div>
                <h3 className="text-sm font-semibold text-brand-text">Generate AI Quiz</h3>
                <p className="text-xs text-brand-text-secondary">
                  Create customized test questions powered by Google Gemini.
                </p>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateQuiz} className="p-6 space-y-4">
              {generateError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300">
                  {generateError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Computer Science, Physics, Chemistry..."
                  className="w-full rounded-btn border border-brand-border bg-brand-bg px-3.5 py-2 text-xs text-brand-text placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Topic / Concept *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Operating Systems: Deadlocks & Semaphores"
                  required
                  className="w-full rounded-btn border border-brand-border bg-brand-bg px-3.5 py-2 text-xs text-brand-text placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Optional Document Source */}
              {documents.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">
                    Grounded Document (Optional)
                  </label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="">None (Generate from general academic knowledge)</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.page_count} pages)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="easy">Easy (Foundations)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="hard">Hard (Advanced / Challenging)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">Questions</label>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(e.target.value)}
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="3">3 Questions</option>
                    <option value="5">5 Questions</option>
                    <option value="10">10 Questions</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsGenerateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={generating}>
                  {generating ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating Quiz...
                    </span>
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
