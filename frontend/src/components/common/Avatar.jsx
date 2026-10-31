import { useState, useEffect } from 'react';
import { cn, getInitials } from '../../utils/helpers';

export default function Avatar({ name, src, size = 'md', className }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const getFullSrc = (imageSrc) => {
    if (!imageSrc) return null;
    if (
      imageSrc.startsWith('http://') ||
      imageSrc.startsWith('https://') ||
      imageSrc.startsWith('blob:') ||
      imageSrc.startsWith('data:')
    ) {
      return imageSrc;
    }
    const cleanPath = imageSrc.startsWith('/') ? imageSrc : `/${imageSrc}`;
    const rawApi = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const hostOrigin = rawApi.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    return `${hostOrigin}${cleanPath}`;
  };

  const resolvedSrc = getFullSrc(src);

  if (resolvedSrc && !imgError) {
    return (
      <img
        src={resolvedSrc}
        alt={name}
        onError={() => setImgError(true)}
        className={cn('rounded-full object-cover', sizeStyles[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand-primary-light text-brand-primary font-medium flex items-center justify-center',
        sizeStyles[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
