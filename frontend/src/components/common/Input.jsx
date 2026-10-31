import { cn } from '../../utils/helpers';

export default function Input({ label, icon: Icon, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-brand-text">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
        )}
        <input
          className={cn(
            'w-full rounded-btn border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text',
            'placeholder:text-brand-text-secondary',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
            'transition-base',
            Icon && 'pl-9',
            error && 'border-brand-danger focus:ring-brand-danger',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-brand-danger">{error}</p>}
    </div>
  );
}
