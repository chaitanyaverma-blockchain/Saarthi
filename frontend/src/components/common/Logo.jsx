import { cn } from '../../utils/helpers';

const sizes = {
  sm: { icon: 'w-7 h-7', svg: 'w-4 h-4', text: 'text-base' },
  md: { icon: 'w-9 h-9', svg: 'w-5 h-5', text: 'text-lg' },
  lg: { icon: 'w-11 h-11', svg: 'w-6 h-6', text: 'text-xl' },
};

export default function Logo({ collapsed = false, size = 'md', className }) {
  const s = sizes[size] || sizes.md;

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-sm transition-transform duration-200 hover:scale-[1.02]',
          s.icon
        )}
      >
        <svg viewBox="0 0 32 32" fill="none" className={s.svg} xmlns="http://www.w3.org/2000/svg">
          {/* Open Book Base: Learning Foundation */}
          <path
            d="M6 22C8.8 20.8 12.2 20.8 15 22V10C12.2 8.8 8.8 8.8 6 10V22Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M26 22C23.2 20.8 19.8 20.8 17 22V10C19.8 8.8 23.2 8.8 26 10V22Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Upward Guidance Needle / Compass: Saarthi (The Guide) */}
          <path d="M16 4.5L18.5 11L16 9.5L13.5 11L16 4.5Z" fill="currentColor" />
          <circle cx="16" cy="15.5" r="1.3" fill="currentColor" />
        </svg>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className={cn('font-bold tracking-tight text-brand-text leading-tight', s.text)}>
            SAARTHI
          </span>
          <span className="text-[10px] tracking-wider uppercase font-medium text-brand-text-secondary">
            Smart Learning
          </span>
        </div>
      )}
    </div>
  );
}
