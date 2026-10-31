import { cn } from '../../utils/helpers';

const variants = {
  primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover',
  secondary: 'bg-brand-primary-light text-brand-primary hover:bg-brand-primary hover:text-white',
  outline: 'border border-brand-border text-brand-text hover:bg-brand-primary-light',
  ghost: 'text-brand-text-secondary hover:bg-brand-primary-light hover:text-brand-text',
  danger: 'bg-brand-danger text-white hover:opacity-90',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-base gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-btn transition-base',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-brand-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
