import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  BookOpen,
  CheckCircle2,
  Trophy,
  Target,
  Sparkles,
  Loader2,
  Calendar,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('weekly'); // 'weekly' | 'monthly'
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/analytics/');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-3" />
        <p className="text-xs text-brand-text-secondary">Synthesizing learning analytics...</p>
      </div>
    );
  }

  const overview = data?.overview || {};
  const insights = data?.insights || {};
  const weeklyActivity = data?.weekly_activity || [];
  const monthlyActivity = data?.monthly_activity || [];
  const subjectPerformance = data?.subject_performance || [];
  const priorityBreakdown = data?.priority_breakdown || { High: 0, Medium: 0, Low: 0 };

  const activeChartData = chartView === 'weekly' ? weeklyActivity : monthlyActivity;
  const hasStudyData = overview.total_study_minutes > 0;
  const hasQuizData = overview.total_quizzes_attempted > 0;
  const hasTaskData = overview.total_tasks > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Analytics"
        description="Real-time academic performance, focus metrics, and productivity insights based on your learning journey."
      />

      {/* TOP STATS ROW (4 METRICS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Study Time */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-brand-text-secondary font-medium">Study Focus</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-text">{overview.total_study_hours} hrs</p>
          <p className="text-[11px] text-brand-text-secondary mt-0.5">
            {overview.total_study_minutes} minutes logged across {overview.total_sessions_completed} sessions
          </p>
        </Card>

        {/* Task Completion Rate */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-brand-text-secondary font-medium">Task Completion</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-text">{overview.completion_rate_percentage}%</p>
          <p className="text-[11px] text-brand-text-secondary mt-0.5">
            {overview.total_completed_tasks} completed • {overview.total_pending_tasks} pending
          </p>
        </Card>

        {/* Quiz Performance */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-brand-text-secondary font-medium">Quiz Mastery</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-text">
            {hasQuizData ? `${overview.average_quiz_score}%` : 'N/A'}
          </p>
          <p className="text-[11px] text-brand-text-secondary mt-0.5">
            {hasQuizData ? `Highest: ${overview.highest_quiz_score}% (${overview.total_quizzes_attempted} tests)` : 'Take your first quiz'}
          </p>
        </Card>

        {/* Weekly Momentum */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-brand-text-secondary font-medium">This Week</span>
            <div className="w-8 h-8 rounded-lg bg-brand-primary-light text-brand-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-text">{insights.total_study_time_this_week}</p>
          <p className="text-[11px] text-brand-text-secondary mt-0.5">
            Top focus: {insights.top_subject}
          </p>
        </Card>
      </div>

      {/* MIDDLE CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Activity Chart */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-brand-text">Study Focus Activity</h3>
                <p className="text-xs text-brand-text-secondary">
                  Actual recorded focus time using the SAARTHI timer.
                </p>
              </div>

              {/* View Switch */}
              <div className="flex items-center gap-1 bg-brand-bg p-1 rounded-btn self-start sm:self-auto">
                <button
                  onClick={() => setChartView('weekly')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    chartView === 'weekly' ? 'bg-brand-surface text-brand-primary shadow-xs' : 'text-brand-text-secondary'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setChartView('monthly')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    chartView === 'monthly' ? 'bg-brand-surface text-brand-primary shadow-xs' : 'text-brand-text-secondary'
                  }`}
                >
                  Last 4 Weeks
                </button>
              </div>
            </div>

            {hasStudyData ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#344239' : '#E1E7E0'} vertical={false} />
                    <XAxis
                      dataKey={chartView === 'weekly' ? 'day' : 'week'}
                      tick={{ fontSize: 11, fill: isDark ? '#AAB8AE' : '#65736A' }}
                      axisLine={{ stroke: isDark ? '#344239' : '#E1E7E0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: isDark ? '#AAB8AE' : '#65736A' }}
                      axisLine={false}
                      tickLine={false}
                      unit="h"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1D2721' : '#FFFFFF',
                        border: `1px solid ${isDark ? '#344239' : '#E1E7E0'}`,
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: isDark ? '#F1F5F2' : '#202923',
                        boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                      itemStyle={{
                        color: isDark ? '#F1F5F2' : '#202923',
                      }}
                      formatter={(val) => [`${val} hrs`, 'Study Focus']}
                    />
                    <Bar dataKey="hours" fill={isDark ? '#83B69A' : '#527B61'} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border border-dashed border-brand-border rounded-xl text-center p-6">
                <Clock className="w-8 h-8 text-brand-text-secondary/40 mb-2" />
                <p className="text-xs font-semibold text-brand-text">No study sessions recorded yet</p>
                <p className="text-[11px] text-brand-text-secondary max-w-xs mt-1 mb-3">
                  Use the live Study Timer in your Study Planner to track your focus time.
                </p>
                <Button size="sm" variant="outline" onClick={() => navigate('/app/planner')}>
                  Open Study Timer
                </Button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-brand-border flex items-center justify-between text-xs text-brand-text-secondary">
            <span>Total Recorded Time: {overview.total_study_hours} hrs</span>
            <span>Daily Goal Target: {insights.total_study_time_this_week} this week</span>
          </div>
        </Card>

        {/* Task Progress & Priority Distribution */}
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-brand-text mb-1">Task Progress & Priorities</h3>
            <p className="text-xs text-brand-text-secondary mb-4">
              Breakdown of pending, completed, and overdue study tasks.
            </p>

            {hasTaskData ? (
              <div className="space-y-4">
                {/* Overall Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-brand-text mb-1.5">
                    <span>Overall Completion</span>
                    <span>{overview.completion_rate_percentage}%</span>
                  </div>
                  <div className="w-full bg-brand-bg rounded-full h-3 overflow-hidden border border-brand-border flex">
                    <div
                      className="bg-green-600 h-full transition-all duration-300"
                      style={{ width: `${overview.completion_rate_percentage}%` }}
                      title="Completed"
                    />
                  </div>
                </div>

                {/* Status Badges Row */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-green-50/60 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50">
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">{overview.total_completed_tasks}</p>
                    <p className="text-[11px] text-green-800 dark:text-green-400">Completed</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{overview.total_pending_tasks}</p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-400">Pending</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50">
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">{overview.total_overdue_tasks}</p>
                    <p className="text-[11px] text-red-800 dark:text-red-400">Overdue</p>
                  </div>
                </div>

                {/* Priority Breakdown */}
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-brand-text mb-2">Tasks by Priority</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-red-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> High Priority
                      </span>
                      <span className="font-semibold text-brand-text">{priorityBreakdown.High}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium Priority
                      </span>
                      <span className="font-semibold text-brand-text">{priorityBreakdown.Medium}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-brand-text-secondary font-medium">
                        <span className="w-2 h-2 rounded-full bg-gray-400" /> Low Priority
                      </span>
                      <span className="font-semibold text-brand-text">{priorityBreakdown.Low}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border border-dashed border-brand-border rounded-xl text-center p-6">
                <Target className="w-8 h-8 text-brand-text-secondary/40 mb-2" />
                <p className="text-xs font-semibold text-brand-text">No tasks created yet</p>
                <p className="text-[11px] text-brand-text-secondary max-w-xs mt-1 mb-3">
                  Add deadlines and tasks to track your syllabus completion.
                </p>
                <Button size="sm" onClick={() => navigate('/app/planner')}>
                  Add First Task
                </Button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-brand-border text-xs text-brand-text-secondary">
            {overview.total_overdue_tasks > 0 ? (
              <span className="text-red-600 dark:text-red-400 font-medium">⚠️ {overview.total_overdue_tasks} overdue tasks need attention</span>
            ) : (
              <span className="text-green-700 dark:text-green-400 font-medium">✓ All tasks are on schedule</span>
            )}
          </div>
        </Card>
      </div>

      {/* BOTTOM ROW: QUIZ PERFORMANCE & PRODUCTIVITY INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-Wise Quiz Performance */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-brand-text">Subject Quiz Performance</h3>
                <p className="text-xs text-brand-text-secondary">
                  Average score mastery across topics generated by Gemini.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/app/quiz')}>
                Take Quiz
              </Button>
            </div>

            {subjectPerformance.length > 0 ? (
              <div className="space-y-3 pt-2">
                {subjectPerformance.map((subj) => (
                  <div key={subj.subject} className="p-3 rounded-xl border border-brand-border bg-brand-bg/40">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-brand-text">{subj.subject}</span>
                      <span className="font-bold text-brand-primary">{subj.avg_score}%</span>
                    </div>
                    <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden border border-brand-border/60">
                      <div
                        className={`h-2 rounded-full ${
                          subj.avg_score >= 80 ? 'bg-green-600' : subj.avg_score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${subj.avg_score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-brand-text-secondary mt-1 block">
                      {subj.attempts} {subj.attempts === 1 ? 'quiz attempted' : 'quizzes attempted'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-brand-border rounded-xl">
                <HelpCircle className="w-8 h-8 text-brand-text-secondary/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-brand-text">No quiz attempts yet</p>
                <p className="text-[11px] text-brand-text-secondary mt-0.5 mb-3">
                  Test your knowledge using Gemini AI to see subject-level benchmarks.
                </p>
                <Button size="sm" onClick={() => navigate('/app/quiz')}>
                  Generate Quiz
                </Button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-brand-border flex items-center justify-between text-xs text-brand-text-secondary">
            <span>Overall Quiz Avg: {hasQuizData ? `${overview.average_quiz_score}%` : 'N/A'}</span>
            <span>Trend: {insights.quiz_trend}</span>
          </div>
        </Card>

        {/* Productivity Insights */}
        <Card className="flex flex-col justify-between border-brand-primary/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <h3 className="text-sm font-semibold text-brand-text">Productivity & Study Insights</h3>
            </div>
            <p className="text-xs text-brand-text-secondary mb-4">
              AI-driven insights calculated from your verified study sessions.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border">
                <span className="text-brand-text-secondary block text-[11px]">Most Productive Day</span>
                <span className="font-semibold text-brand-text mt-0.5 block truncate">
                  {insights.most_productive_day}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border">
                <span className="text-brand-text-secondary block text-[11px]">Top Studied Subject</span>
                <span className="font-semibold text-brand-text mt-0.5 block truncate">
                  {insights.top_subject}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border">
                <span className="text-brand-text-secondary block text-[11px]">Focus Time (7 Days)</span>
                <span className="font-semibold text-brand-text mt-0.5 block">
                  {insights.total_study_time_this_week}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border">
                <span className="text-brand-text-secondary block text-[11px]">Quiz Trajectory</span>
                <span className="font-semibold text-brand-text mt-0.5 block truncate">
                  {insights.quiz_trend}
                </span>
              </div>
            </div>

            {/* Smart Study Recommendation */}
            <div className="p-3.5 rounded-xl bg-brand-primary-light/50 border border-brand-primary/30">
              <span className="text-xs font-semibold text-brand-primary block mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Recommendation
              </span>
              <p className="text-xs text-brand-text leading-relaxed">
                {insights.recommendation}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-brand-border flex items-center justify-between text-[11px] text-brand-text-secondary">
            <span>Updated with every recorded session</span>
            <button onClick={fetchAnalytics} className="hover:text-brand-primary transition-colors">
              Refresh Data
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
