import { Menu } from 'lucide-react';
import Logo from '../common/Logo';
import Avatar from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth();

  const displayName = user?.name || 'Alex Johnson';
  const displayMajor = user?.major || 'Computer Science';
  const displayAvatar = user?.profile_picture || user?.avatar;

  return (
    <header className="sticky top-0 z-30 bg-brand-surface border-b border-brand-border px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-btn hover:bg-brand-primary-light text-brand-text transition-base cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">Workspace</span>
            <span className="text-brand-text-secondary/40">/</span>
            <span className="text-xs font-semibold text-brand-primary bg-brand-primary-light px-2 py-0.5 rounded-full border border-brand-primary/15">Academic Year 2026-27</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-brand-text">{displayName}</p>
            <p className="text-xs text-brand-text-secondary">{displayMajor}</p>
          </div>
          <Avatar name={displayName} src={displayAvatar} size="sm" />
        </div>
      </div>
    </header>
  );
}
