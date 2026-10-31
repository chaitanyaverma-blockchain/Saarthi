import { cn } from '../../utils/helpers';

export default function Card({ children, className, hover = false, padding = true, ...props }) {
  return (
    <div
      className={cn(
        'bg-brand-surface border border-brand-border rounded-card',
        padding && 'p-5',
        hover && 'transition-base hover:shadow-card-hover cursor-pointer',
        'shadow-card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
