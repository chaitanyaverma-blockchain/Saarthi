import { useNavigate } from 'react-router-dom';
import {
  Bot,
  FileText,
  StickyNote,
  HelpCircle,
} from 'lucide-react';
import Card from '../common/Card';

const actions = [
  {
    title: 'Ask AI',
    description: 'Get help from your study assistant',
    icon: Bot,
    path: '/app/assistant',
    color: 'bg-brand-primary-light text-brand-primary border border-brand-primary/15',
  },
  {
    title: 'Study PDF',
    description: 'Upload and study from documents',
    icon: FileText,
    path: '/app/pdf-lab',
    color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50',
  },
  {
    title: 'Create Notes',
    description: 'Organize your study notes',
    icon: StickyNote,
    path: '/app/notes',
    color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50',
  },
  {
    title: 'Take Quiz',
    description: 'Test your knowledge',
    icon: HelpCircle,
    path: '/app/quiz',
    color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50',
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="text-base font-semibold text-brand-text mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.title}
              hover
              className="cursor-pointer"
              onClick={() => navigate(action.path)}
            >
              <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-brand-text">{action.title}</p>
              <p className="text-xs text-brand-text-secondary mt-0.5 line-clamp-1">{action.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
