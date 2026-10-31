import Card from '../common/Card';
import { SAMPLE_USER } from '../../utils/constants';
import { getGreeting, formatDate } from '../../utils/helpers';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function WelcomeCard({ welcome, user: propUser }) {
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser || SAMPLE_USER;

  const today = welcome?.date_formatted || formatDate(new Date());
  const greeting = welcome?.greeting || getGreeting();
  const firstName = welcome?.first_name || (currentUser.name ? currentUser.name.split(' ')[0] : 'Student');
  const message = welcome?.message || 'Ready to make progress on your learning journey today?';

  return (
    <Card className="bg-gradient-to-r from-brand-primary to-brand-primary-hover dark:from-[#1b2b20] dark:to-[#223629] text-white border-brand-primary/20 dark:border-brand-primary/40 shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">{today}</p>
          <h2 className="text-2xl font-bold tracking-tight mt-1 text-white">
            {greeting}, {firstName}!
          </h2>
          <p className="text-white/90 text-sm mt-2 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="hidden sm:flex w-12 h-12 rounded-xl bg-white/15 items-center justify-center flex-shrink-0 border border-white/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}
