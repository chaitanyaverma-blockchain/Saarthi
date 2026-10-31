import { Clock, StickyNote, HelpCircle, CheckCircle2 } from 'lucide-react';
import Card from '../common/Card';

export default function StatsGrid({ stats: backendStats }) {
  const studyHours = backendStats?.study_hours !== undefined ? backendStats.study_hours : 0;
  const notesCreated = backendStats?.notes_created !== undefined ? backendStats.notes_created : 0;
  const completedTasks = backendStats?.completed_tasks !== undefined ? backendStats.completed_tasks : 0;
  const totalTasks = backendStats?.total_tasks !== undefined ? backendStats.total_tasks : 0;
  const quizzesTaken = backendStats?.quizzes_taken !== undefined ? backendStats.quizzes_taken : 0;
  const pendingTasks = backendStats?.pending_tasks !== undefined ? backendStats.pending_tasks : Math.max(0, totalTasks - completedTasks);

  const stats = [
    {
      label: 'Study Hours Logged',
      value: studyHours,
      suffix: 'hrs',
      icon: Clock,
      change: `${backendStats?.today_study_minutes || 0} min today`,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      label: 'Tasks Completed',
      value: `${completedTasks}/${totalTasks}`,
      suffix: '',
      icon: CheckCircle2,
      change: `${pendingTasks} remaining`,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    {
      label: 'Notes Saved',
      value: notesCreated,
      suffix: '',
      icon: StickyNote,
      change: 'In knowledge base',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    },
    {
      label: 'Quizzes Taken',
      value: quizzesTaken,
      suffix: '',
      icon: HelpCircle,
      change: backendStats?.latest_quiz ? `Latest: ${backendStats.latest_quiz.score_percentage}%` : 'Active revision',
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} hover>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-text">
              {stat.value}
              {stat.suffix && <span className="text-lg text-brand-text-secondary ml-0.5">{stat.suffix}</span>}
            </p>
            <p className="text-xs text-brand-text-secondary mt-0.5">{stat.label}</p>
            <p className="text-xs text-brand-primary font-medium mt-2">{stat.change}</p>
          </Card>
        );
      })}
    </div>
  );
}
