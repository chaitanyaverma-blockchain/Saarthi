import {
  HelpCircle,
  StickyNote,
  FileText,
  Bot,
} from 'lucide-react';
import Card from '../common/Card';
import { SAMPLE_ACTIVITIES } from '../../utils/constants';

const iconMap = {
  quiz: HelpCircle,
  notes: StickyNote,
  pdf: FileText,
  assistant: Bot,
};

const colorMap = {
  quiz: 'bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/40',
  notes: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/40',
  pdf: 'bg-blue-50 text-blue-600 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/40',
  assistant: 'bg-purple-50 text-purple-600 border border-purple-200/60 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800/40',
};

export default function RecentActivity({ activities: propActivities }) {
  const activities = propActivities || SAMPLE_ACTIVITIES;

  return (
    <Card>
      <h3 className="text-base font-bold text-brand-text mb-4">Recent Activity</h3>

      <div className="space-y-3">
        {activities.map((activity) => {
          const type = activity.activity_type || activity.type || 'notes';
          const Icon = iconMap[type] || StickyNote;
          const time = activity.created_at
            ? new Date(activity.created_at).toLocaleDateString()
            : activity.time;

          return (
            <div key={activity.id} className="flex items-center gap-3 p-2 rounded-btn hover:bg-brand-bg transition-colors">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  colorMap[type] || colorMap.notes
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-text truncate">{activity.title}</p>
                <p className="text-xs text-brand-text-secondary">{time}</p>
              </div>
            </div>
          );
        })}

        {activities.length === 0 && (
          <div className="py-6 text-center text-sm text-brand-text-secondary">
            No recent activity recorded yet.
          </div>
        )}
      </div>
    </Card>
  );
}
