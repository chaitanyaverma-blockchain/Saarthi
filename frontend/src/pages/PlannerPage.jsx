import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  CalendarDays,
  Clock,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle2,
  Circle,
  AlertCircle,
  Filter,
  Search,
  Trash2,
  Edit3,
  X,
  Target,
  BookOpen,
  ArrowUpDown,
  Loader2,
  ChevronRight,
  Flame,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { api } from '../services/api';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SESSION_TYPE_COLORS = {
  lecture: 'default',
  study: 'success',
  lab: 'warning',
  assignment: 'danger',
  revision: 'neutral',
  group: 'default',
};

const PRIORITY_BADGES = {
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
};

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'timetable'
  const [loading, setLoading] = useState(true);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('due_date');

  // Daily Goal state
  const [goalData, setGoalData] = useState({
    target_minutes: 120,
    completed_minutes: 0,
    remaining_minutes: 120,
    percentage: 0,
  });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newTargetMinutes, setNewTargetMinutes] = useState(120);

  // Timetable state
  const [timetable, setTimetable] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    subject: '',
    description: '',
    priority: 'Medium',
    status: 'Pending',
    due_date: '',
  });

  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const [timetableForm, setTimetableForm] = useState({
    subject: '',
    title: '',
    day_of_week: 'Monday',
    start_time: '09:00 AM',
    end_time: '10:30 AM',
    session_type: 'study',
  });

  // ==========================================
  // LIVE STUDY TIMER STATE (localStorage persisted)
  // ==========================================
  const [timerSeconds, setTimerSeconds] = useState(() => {
    const saved = localStorage.getItem('saarthi_timer_seconds');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isTimerRunning, setIsTimerRunning] = useState(() => {
    return localStorage.getItem('saarthi_timer_running') === 'true';
  });
  const [timerSubject, setTimerSubject] = useState(() => {
    return localStorage.getItem('saarthi_timer_subject') || 'General';
  });
  const [timerTaskId, setTimerTaskId] = useState(() => {
    return localStorage.getItem('saarthi_timer_task_id') || '';
  });
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordNotes, setRecordNotes] = useState('');
  const [savingSession, setSavingSession] = useState(false);

  // Sync Timer with localStorage
  useEffect(() => {
    localStorage.setItem('saarthi_timer_seconds', timerSeconds);
    localStorage.setItem('saarthi_timer_running', isTimerRunning);
    localStorage.setItem('saarthi_timer_subject', timerSubject);
    localStorage.setItem('saarthi_timer_task_id', timerTaskId);
  }, [timerSeconds, isTimerRunning, timerSubject, timerTaskId]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Initial Data Fetch
  useEffect(() => {
    fetchPlannerData();
  }, [statusFilter, priorityFilter, searchQuery, sortBy]);

  const fetchPlannerData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'All') params.append('priority', priorityFilter);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (sortBy) params.append('sort', sortBy);

      const [tasksRes, goalRes, timetableRes] = await Promise.all([
        api.get(`/dashboard/tasks/?${params.toString()}`),
        api.get('/dashboard/goals/daily/'),
        api.get('/dashboard/timetable/'),
      ]);

      setTasks(tasksRes.data || []);
      if (goalRes?.data) setGoalData(goalRes.data);
      setTimetable(timetableRes.data || []);
    } catch (err) {
      console.error('Failed to load planner data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Task Actions
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      subject: '',
      description: '',
      priority: 'Medium',
      status: 'Pending',
      due_date: new Date().toISOString().split('T')[0],
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      subject: task.subject,
      description: task.description || '',
      priority: task.priority || 'Medium',
      status: task.status || (task.is_completed ? 'Completed' : 'Pending'),
      due_date: task.due_date || '',
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      if (editingTask) {
        await api.patch(`/dashboard/tasks/${editingTask.id}/`, taskForm);
      } else {
        await api.post('/dashboard/tasks/', taskForm);
      }
      setIsTaskModalOpen(false);
      fetchPlannerData();
    } catch (err) {
      alert(err.message || 'Failed to save task.');
    }
  };

  const handleToggleTask = async (id, e) => {
    e?.stopPropagation();
    try {
      // Optimistic
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_completed: !t.is_completed, status: !t.is_completed ? 'Completed' : 'Pending' } : t
        )
      );
      await api.post(`/dashboard/tasks/${id}/toggle/`);
      fetchPlannerData();
    } catch (err) {
      fetchPlannerData();
    }
  };

  const handleDeleteTask = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this study task?')) return;
    try {
      await api.delete(`/dashboard/tasks/${id}/`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  // Daily Goal Actions
  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/dashboard/goals/daily/', {
        target_minutes: newTargetMinutes,
      });
      if (res?.data) setGoalData(res.data);
      setIsGoalModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to update study goal.');
    }
  };

  // Timer Stop and Record
  const handleStopTimer = () => {
    setIsTimerRunning(false);
    if (timerSeconds < 60) {
      if (window.confirm('Timer ran for less than 1 minute. Reset without recording?')) {
        setTimerSeconds(0);
      }
      return;
    }
    setIsRecordModalOpen(true);
  };

  const handleConfirmSaveSession = async () => {
    const minutes = Math.round(timerSeconds / 60);
    if (minutes <= 0) {
      setIsRecordModalOpen(false);
      setTimerSeconds(0);
      return;
    }

    try {
      setSavingSession(true);
      await api.post('/dashboard/timer/record/', {
        duration_minutes: minutes,
        subject: timerSubject || 'General',
        task_id: timerTaskId ? parseInt(timerTaskId, 10) : null,
        notes: recordNotes.trim(),
      });

      // Reset timer
      setTimerSeconds(0);
      setIsRecordModalOpen(false);
      setRecordNotes('');
      fetchPlannerData();
    } catch (err) {
      alert(err.message || 'Failed to record study session.');
    } finally {
      setSavingSession(false);
    }
  };

  // Timetable Actions
  const handleOpenAddTimetable = (day = 'Monday') => {
    setEditingTimetable(null);
    setTimetableForm({
      subject: '',
      title: '',
      day_of_week: day,
      start_time: '09:00 AM',
      end_time: '10:30 AM',
      session_type: 'study',
    });
    setIsTimetableModalOpen(true);
  };

  const handleOpenEditTimetable = (item) => {
    setEditingTimetable(item);
    setTimetableForm({
      subject: item.subject,
      title: item.title || '',
      day_of_week: item.day_of_week,
      start_time: item.start_time,
      end_time: item.end_time,
      session_type: item.session_type || 'study',
    });
    setIsTimetableModalOpen(true);
  };

  const handleSaveTimetable = async (e) => {
    e.preventDefault();
    if (!timetableForm.subject.trim()) return;

    try {
      if (editingTimetable) {
        await api.patch(`/dashboard/timetable/${editingTimetable.id}/`, timetableForm);
      } else {
        await api.post('/dashboard/timetable/', timetableForm);
      }
      setIsTimetableModalOpen(false);
      fetchPlannerData();
    } catch (err) {
      alert(err.message || 'Failed to save timetable session.');
    }
  };

  const handleDeleteTimetable = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this timetable session?')) return;
    try {
      await api.delete(`/dashboard/timetable/${id}/`);
      setTimetable((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete timetable session.');
    }
  };

  const formatTimer = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const overdueCount = tasks.filter((t) => t.is_overdue).length;
  const pendingCount = tasks.filter((t) => !t.is_completed).length;
  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Planner"
        description="Organize your study tasks, track daily study goals, and manage your weekly timetable."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={CalendarDays} onClick={() => handleOpenAddTimetable(selectedDay)}>
              Add Class
            </Button>
            <Button size="sm" icon={Plus} onClick={handleOpenCreateTask}>
              Add Task
            </Button>
          </div>
        }
      />

      {/* TOP WIDGETS ROW: DAILY GOAL & STUDY TIMER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Goal Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-primary" />
                <h3 className="text-sm font-semibold text-brand-text">Today's Study Goal</h3>
              </div>
              <button
                onClick={() => {
                  setNewTargetMinutes(goalData.target_minutes);
                  setIsGoalModalOpen(true);
                }}
                className="text-xs text-brand-primary hover:underline font-medium"
              >
                Edit Goal
              </button>
            </div>
            <p className="text-2xl font-bold text-brand-text mt-1">
              {goalData.completed_minutes} <span className="text-xs font-normal text-brand-text-secondary">/ {goalData.target_minutes} min</span>
            </p>
            <div className="w-full bg-brand-bg rounded-full h-2 mt-3 overflow-hidden border border-brand-border">
              <div
                className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${goalData.percentage}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-brand-text-secondary mt-4 pt-3 border-t border-brand-border">
            <span>{goalData.percentage}% completed</span>
            <span>{goalData.remaining_minutes > 0 ? `${goalData.remaining_minutes} min remaining` : 'Goal achieved!'}</span>
          </div>
        </Card>

        {/* Live Study Timer Card */}
        <Card className="lg:col-span-2 flex flex-col justify-between border-brand-primary/30 bg-brand-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-primary" />
                <h3 className="text-sm font-semibold text-brand-text">Active Study Timer</h3>
                {isTimerRunning && (
                  <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950/40 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Recording
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Timer continues running even when you switch tabs or study in PDF Lab.
              </p>
            </div>

            {/* Timer subject and task linkage */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={timerSubject}
                onChange={(e) => setTimerSubject(e.target.value)}
                placeholder="Subject..."
                className="rounded-btn border border-brand-border bg-brand-bg px-2.5 py-1 text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary w-28"
              />
              <select
                value={timerTaskId}
                onChange={(e) => setTimerTaskId(e.target.value)}
                className="rounded-btn border border-brand-border bg-brand-bg px-2 py-1 text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary max-w-[140px] truncate"
              >
                <option value="">Link Task...</option>
                {tasks
                  .filter((t) => !t.is_completed)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Digital Timer Display & Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-3 border-t border-brand-border">
            <div className="font-mono text-3xl sm:text-4xl font-extrabold text-brand-primary tracking-wider">
              {formatTimer(timerSeconds)}
            </div>

            <div className="flex items-center gap-2">
              {!isTimerRunning ? (
                <Button size="sm" icon={Play} onClick={() => setIsTimerRunning(true)}>
                  {timerSeconds > 0 ? 'Resume' : 'Start Focus'}
                </Button>
              ) : (
                <Button size="sm" variant="secondary" icon={Pause} onClick={() => setIsTimerRunning(false)}>
                  Pause
                </Button>
              )}

              {timerSeconds > 0 && (
                <>
                  <Button size="sm" variant="outline" icon={Square} onClick={handleStopTimer}>
                    Stop & Save
                  </Button>
                  <button
                    onClick={() => {
                      if (window.confirm('Reset timer without saving?')) {
                        setIsTimerRunning(false);
                        setTimerSeconds(0);
                      }
                    }}
                    className="p-2 text-brand-text-secondary hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* TABS SWITCH: TASKS VS TIMETABLE */}
      <div className="flex items-center gap-2 border-b border-brand-border pb-3">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-btn text-xs font-semibold transition-all ${
            activeTab === 'tasks'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-brand-surface text-brand-text-secondary hover:text-brand-text border border-brand-border'
          }`}
        >
          Task Management ({pendingCount} Pending)
        </button>
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-4 py-2 rounded-btn text-xs font-semibold transition-all ${
            activeTab === 'timetable'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-brand-surface text-brand-text-secondary hover:text-brand-text border border-brand-border'
          }`}
        >
          Weekly Timetable ({timetable.length} Classes)
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: TASK MANAGEMENT */}
      {/* ========================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title or details..."
                className="w-full rounded-btn border border-brand-border bg-brand-surface pl-9 pr-4 py-2 text-xs text-brand-text placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              {[
                { id: 'all', label: 'All Tasks' },
                { id: 'Pending', label: 'Pending' },
                { id: 'In Progress', label: 'In Progress' },
                { id: 'Completed', label: 'Completed' },
                { id: 'today', label: "Due Today" },
                { id: 'overdue', label: `Overdue (${overdueCount})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-btn text-xs font-medium border transition-colors whitespace-nowrap ${
                    statusFilter === f.id
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-brand-surface text-brand-text-secondary border-brand-border hover:border-brand-primary'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs rounded-btn border border-brand-border bg-brand-surface px-2.5 py-1.5 text-brand-text focus:outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs rounded-btn border border-brand-border bg-brand-surface px-2.5 py-1.5 text-brand-text focus:outline-none"
              >
                <option value="due_date">Due Soonest</option>
                <option value="-due_date">Due Latest</option>
                <option value="priority">High Priority First</option>
              </select>
            </div>
          </div>

          {/* Task List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 text-brand-primary animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={searchQuery ? 'No matching tasks' : 'No tasks in this view'}
              description={
                searchQuery
                  ? `No tasks matched "${searchQuery}". Try adjusting your filters.`
                  : 'Add study tasks, set deadlines, and track your daily academic progress.'
              }
              action={<Button icon={Plus} onClick={handleOpenCreateTask}>Create Study Task</Button>}
            />
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  hover
                  className={`transition-all ${task.is_completed ? 'opacity-65 bg-brand-bg/50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={(e) => handleToggleTask(task.id, e)}
                        className="mt-0.5 text-brand-primary hover:scale-110 transition-transform"
                      >
                        {task.is_completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 fill-green-100 dark:fill-green-950/60" />
                        ) : (
                          <Circle className="w-5 h-5 text-brand-text-secondary/60 hover:text-brand-primary" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              task.is_completed ? 'line-through text-brand-text-secondary' : 'text-brand-text'
                            }`}
                          >
                            {task.title}
                          </h4>
                          <Badge variant="default" className="text-[10px]">
                            {task.subject}
                          </Badge>
                          <Badge variant={PRIORITY_BADGES[task.priority] || 'neutral'} className="text-[10px]">
                            {task.priority}
                          </Badge>
                          {task.is_overdue && (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-brand-text-secondary line-clamp-2 mb-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-brand-text-secondary">
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5" /> Due: {task.due_date}
                            </span>
                          )}
                          <span>Status: {task.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Task Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditTask(task)}
                        className="p-1.5 text-brand-text-secondary hover:text-brand-primary transition-colors"
                        title="Edit task"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="p-1.5 text-brand-text-secondary hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: WEEKLY TIMETABLE */}
      {/* ========================================== */}
      {activeTab === 'timetable' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Day selection tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-brand-surface p-1.5 rounded-xl border border-brand-border">
            {WEEK_DAYS.map((day) => {
              const count = timetable.filter((t) => t.day_of_week === day).length;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
                    isSelected
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text'
                  }`}
                >
                  <p>{day.slice(0, 3)}</p>
                  <span className="text-[10px] opacity-80">{count} {count === 1 ? 'class' : 'classes'}</span>
                </button>
              );
            })}
          </div>

          {/* Active Day Schedule List */}
          <Card>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-brand-border">
              <div>
                <h3 className="text-sm font-semibold text-brand-text">{selectedDay} Schedule</h3>
                <p className="text-xs text-brand-text-secondary">Classes, labs, and planned revision blocks.</p>
              </div>
              <Button size="sm" icon={Plus} onClick={() => handleOpenAddTimetable(selectedDay)}>
                Add Class
              </Button>
            </div>

            {timetable.filter((t) => t.day_of_week === selectedDay).length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="w-10 h-10 text-brand-text-secondary/40 mx-auto mb-2" />
                <p className="text-xs font-medium text-brand-text">No classes scheduled for {selectedDay}.</p>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">Use this day for revision or self-study.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timetable
                  .filter((t) => t.day_of_week === selectedDay)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-brand-border bg-brand-surface hover:bg-brand-bg/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-center py-1 px-2 rounded-lg bg-brand-primary-light text-brand-primary text-xs font-semibold">
                          {item.start_time}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-brand-text">{item.subject}</h4>
                            <Badge variant={SESSION_TYPE_COLORS[item.session_type] || 'default'} className="capitalize text-[10px]">
                              {item.session_type}
                            </Badge>
                          </div>
                          {item.title && <p className="text-xs text-brand-text-secondary mt-0.5">{item.title}</p>}
                          <p className="text-[10px] text-brand-text-secondary mt-0.5">Until {item.end_time}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditTimetable(item)}
                          className="p-1.5 text-brand-text-secondary hover:text-brand-primary transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTimetable(item.id, e)}
                          className="p-1.5 text-brand-text-secondary hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CREATE / EDIT TASK */}
      {/* ========================================== */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xl max-w-md w-full overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h3 className="text-sm font-semibold text-brand-text">
                {editingTask ? 'Edit Study Task' : 'Create Study Task'}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Task Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Chapter 4 Practice Problems"
                  required
                  className="w-full rounded-btn border border-brand-border bg-brand-bg px-3.5 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">Subject</label>
                  <input
                    type="text"
                    value={taskForm.subject}
                    onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Description (Optional)</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Key problems to solve or reference notes..."
                  rows={3}
                  className="w-full rounded-btn border border-brand-border bg-brand-bg px-3.5 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsTaskModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: EDIT DAILY STUDY GOAL */}
      {/* ========================================== */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xl max-w-sm w-full p-6 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-brand-text mb-1">Set Daily Study Goal</h3>
            <p className="text-xs text-brand-text-secondary mb-4">
              Enter the target number of study minutes you aim to focus for today.
            </p>

            <form onSubmit={handleUpdateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Daily Target (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={newTargetMinutes}
                  onChange={(e) => setNewTargetMinutes(e.target.value)}
                  className="w-full rounded-btn border border-brand-border bg-brand-bg px-3.5 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                />
                <span className="text-[11px] text-brand-text-secondary mt-1 block">
                  {Math.floor(newTargetMinutes / 60)} hrs {newTargetMinutes % 60} mins
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsGoalModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">Save Goal</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CONFIRM RECORD TIMER SESSION */}
      {/* ========================================== */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xl max-w-md w-full p-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-base font-semibold text-brand-text">Save Completed Study Session</h3>
            </div>
            <p className="text-xs text-brand-text-secondary mb-4">
              Great focus! Record your {Math.round(timerSeconds / 60)} minutes of study into your analytics.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border">
                  <span className="text-brand-text-secondary block">Duration</span>
                  <span className="font-semibold text-brand-text">{Math.round(timerSeconds / 60)} minutes</span>
                </div>
                <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border">
                  <span className="text-brand-text-secondary block">Subject</span>
                  <span className="font-semibold text-brand-text">{timerSubject || 'General'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Session Notes (Optional)</label>
                <textarea
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  placeholder="Topics reviewed, formulas mastered, problems solved..."
                  rows={3}
                  className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsRecordModalOpen(false);
                    setTimerSeconds(0);
                  }}
                >
                  Discard
                </Button>
                <Button size="sm" disabled={savingSession} onClick={handleConfirmSaveSession}>
                  {savingSession ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm & Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD / EDIT TIMETABLE SESSION */}
      {/* ========================================== */}
      {isTimetableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xl max-w-md w-full overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h3 className="text-sm font-semibold text-brand-text">
                {editingTimetable ? 'Edit Timetable Session' : 'Add Timetable Class'}
              </h3>
              <button
                onClick={() => setIsTimetableModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTimetable} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Subject *</label>
                <input
                  type="text"
                  value={timetableForm.subject}
                  onChange={(e) => setTimetableForm({ ...timetableForm, subject: e.target.value })}
                  placeholder="e.g. Mathematics"
                  required
                  className="w-full rounded-btn border border-brand-border bg-brand-bg px-3.5 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Topic / Class Title</label>
                <input
                  type="text"
                  value={timetableForm.title}
                  onChange={(e) => setTimetableForm({ ...timetableForm, title: e.target.value })}
                  placeholder="e.g. Linear Algebra & Matrices"
                  className="w-full rounded-btn border border-brand-border bg-brand-bg px-3.5 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">Day of Week</label>
                  <select
                    value={timetableForm.day_of_week}
                    onChange={(e) => setTimetableForm({ ...timetableForm, day_of_week: e.target.value })}
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    {WEEK_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">Session Type</label>
                  <select
                    value={timetableForm.session_type}
                    onChange={(e) => setTimetableForm({ ...timetableForm, session_type: e.target.value })}
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="study">Self Study</option>
                    <option value="lab">Lab Session</option>
                    <option value="assignment">Assignment</option>
                    <option value="revision">Revision</option>
                    <option value="group">Study Group</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">Start Time</label>
                  <input
                    type="text"
                    value={timetableForm.start_time}
                    onChange={(e) => setTimetableForm({ ...timetableForm, start_time: e.target.value })}
                    placeholder="e.g. 09:00 AM"
                    required
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">End Time</label>
                  <input
                    type="text"
                    value={timetableForm.end_time}
                    onChange={(e) => setTimetableForm({ ...timetableForm, end_time: e.target.value })}
                    placeholder="e.g. 10:30 AM"
                    required
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsTimetableModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingTimetable ? 'Save Class' : 'Add Class'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
