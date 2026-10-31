import { useState, useEffect } from 'react';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import StatsGrid from '../components/dashboard/StatsGrid';
import QuickActions from '../components/dashboard/QuickActions';
import TodayTasks from '../components/dashboard/TodayTasks';
import RecentActivity from '../components/dashboard/RecentActivity';
import UpcomingSchedule from '../components/dashboard/UpcomingSchedule';
import { api } from '../services/api';

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const res = await api.get('/dashboard/overview/');
        if (isMounted && res?.data) {
          setOverview(res.data);
          setTasks(res.data.tasks || []);
        }
      } catch (err) {
        console.warn('Dashboard live API fetch fallback to cached/initial preview state.', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleTask = async (taskId) => {
    // Optimistic UI update
    setTasks((prevTasks) => {
      if (!prevTasks) return prevTasks;
      return prevTasks.map((t) =>
        t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
      );
    });

    try {
      const res = await api.post(`/dashboard/tasks/${taskId}/toggle/`);
      if (res?.data) {
        // Sync with verified database response
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === taskId ? res.data : t))
        );
      }
    } catch (err) {
      console.error('Failed to toggle task completion state on backend:', err);
      // Revert optimistic update on failure
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <WelcomeCard welcome={overview?.welcome} user={overview?.user} />
      <StatsGrid stats={overview?.stats} />
      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTasks tasks={tasks} onToggle={handleToggleTask} />
        <div className="space-y-6">
          <RecentActivity activities={overview?.recent_activities} />
          <UpcomingSchedule schedule={overview?.schedule} />
        </div>
      </div>
    </div>
  );
}
