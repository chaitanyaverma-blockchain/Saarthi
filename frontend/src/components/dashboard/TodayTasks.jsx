import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function TodayTasks({ tasks: propTasks, onToggle }) {
  const navigate = useNavigate();
  const tasks = propTasks || [];

  const completedCount = tasks.filter((t) => t.is_completed ?? t.done).length;
  const totalCount = tasks.length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-brand-text">Today's Tasks</h3>
          <p className="text-xs text-brand-text-secondary mt-0.5">Click to toggle completion</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-primary-light text-brand-primary border border-brand-primary/15">
            {completedCount}/{totalCount} done
          </span>
          <button
            onClick={() => navigate('/app/planner')}
            className="text-xs text-brand-primary hover:underline font-medium flex items-center gap-0.5 ml-1"
          >
            <span>Planner</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {tasks.map((task) => {
          const isDone = Boolean(task.is_completed ?? task.done);
          return (
            <div
              key={task.id}
              onClick={() => onToggle && onToggle(task.id)}
              className="flex items-start gap-3 p-3 rounded-btn hover:bg-brand-bg transition-all duration-150 group cursor-pointer border border-transparent hover:border-brand-border/80"
            >
              <button
                type="button"
                className="mt-0.5 flex-shrink-0 text-brand-text-secondary group-hover:text-brand-primary transition-base cursor-pointer"
                aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 fill-green-100 dark:fill-green-950/60" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium transition-colors ${
                    isDone ? 'line-through text-brand-text-secondary' : 'text-brand-text'
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="default" className="text-[10px]">{task.subject}</Badge>
                  {task.priority && (
                    <span className="text-[10px] text-brand-text-secondary font-medium">
                      • {task.priority}
                    </span>
                  )}
                  <span className="text-[10px] text-brand-text-secondary">
                    {task.due_date ? `Due: ${task.due_date}` : task.scheduled_time || ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="py-8 text-center text-xs text-brand-text-secondary">
            <p>No study tasks scheduled yet.</p>
            <button
              onClick={() => navigate('/app/planner')}
              className="text-brand-primary hover:underline text-xs mt-1 font-medium"
            >
              Add a study task in Planner
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
