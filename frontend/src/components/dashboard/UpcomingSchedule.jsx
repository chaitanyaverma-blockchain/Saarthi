import { Clock, CalendarDays, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';

const typeColors = {
  lecture: 'default',
  study: 'success',
  lab: 'warning',
  assignment: 'danger',
  revision: 'neutral',
  group: 'default',
};

export default function UpcomingSchedule({ schedule: propSchedule }) {
  const navigate = useNavigate();
  const schedule = propSchedule || [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-brand-text">Today's Schedule</h3>
        <button
          onClick={() => navigate('/app/planner')}
          className="text-xs text-brand-primary hover:underline font-medium flex items-center gap-1"
        >
          <span>View Timetable</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {schedule.map((item, idx) => {
          const type = item.session_type || item.item_type || item.type || 'study';
          const time = item.time_slot || (item.start_time ? `${item.start_time} - ${item.end_time}` : '');
          const title = item.title ? `${item.subject || ''} ${item.title}`.trim() : (item.subject || 'Class');

          return (
            <div
              key={item.id || idx}
              onClick={() => navigate('/app/planner')}
              className="flex items-center gap-3 p-3 rounded-btn bg-brand-bg/70 border border-brand-border/60 hover:border-brand-primary/40 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-primary-light border border-brand-primary/15 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-brand-text truncate">{title}</p>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">{time}</p>
              </div>
              <Badge variant={typeColors[type] || 'default'} className="capitalize text-[10px]">
                {type}
              </Badge>
            </div>
          );
        })}

        {schedule.length === 0 && (
          <div className="py-6 text-center text-xs text-brand-text-secondary">
            <CalendarDays className="w-7 h-7 text-brand-text-secondary/40 mx-auto mb-1.5" />
            <p>No classes scheduled for today.</p>
            <button
              onClick={() => navigate('/app/planner')}
              className="text-brand-primary hover:underline text-[11px] mt-1 font-medium"
            >
              Add a class to your weekly timetable
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
