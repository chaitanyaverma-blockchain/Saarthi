import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  FileText,
  StickyNote,
  HelpCircle,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import Logo from '../common/Logo';
import Avatar from '../common/Avatar';
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from '../../utils/constants';
import { cn } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

const iconMap = {
  LayoutDashboard,
  Bot,
  FileText,
  StickyNote,
  HelpCircle,
  CalendarDays,
  BarChart3,
  Settings,
};

function SidebarLink({ item, onClick }) {
  const Icon = iconMap[item.icon];

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group flex items-center justify-between px-3 py-2.5 rounded-btn text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-brand-primary text-white shadow-sm'
            : 'text-brand-text-secondary hover:bg-brand-primary-light/60 hover:text-brand-text'
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            {Icon && (
              <Icon
                className={cn(
                  'w-[18px] h-[18px] transition-colors',
                  isActive ? 'text-white' : 'text-brand-text-secondary group-hover:text-brand-primary'
                )}
              />
            )}
            <span>{item.label}</span>
          </div>
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/login');
  };

  const displayName = user?.name || 'Alex Johnson';
  const displayEmail = user?.email || 'alex.johnson@university.edu';
  const displayAvatar = user?.profile_picture || user?.avatar;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-brand-text/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-brand-sidebar border-r border-brand-border shadow-sidebar',
          'flex flex-col transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="px-5 py-5 border-b border-brand-border flex items-center justify-between">
          <Logo size="md" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary bg-brand-primary-light px-2 py-0.5 rounded-full border border-brand-primary/15">
            Student
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.path} item={item} onClick={onClose} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-3 border-t border-brand-border space-y-1">
          {BOTTOM_NAV_ITEMS.map((item) => (
            <SidebarLink key={item.path} item={item} onClick={onClose} />
          ))}

          {/* User profile card */}
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-btn bg-brand-bg/70 border border-brand-border/60">
            <Avatar name={displayName} src={displayAvatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-text truncate">{displayName}</p>
              <p className="text-xs text-brand-text-secondary truncate">{displayEmail}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-btn text-sm font-medium text-brand-text-secondary hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-brand-danger transition-base w-full cursor-pointer mt-1"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
