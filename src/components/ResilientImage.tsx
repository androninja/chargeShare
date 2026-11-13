import { useState } from 'react';
import { Zap } from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#ECFDF5] via-[#F1F5F9] to-[#EFF6FF] text-[#0F172A] ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 border border-[#E2E8F0] text-[#059669]">
          <Zap className="h-5 w-5" />
        </div>
        {fallbackTitle && (
          <span className="mt-2 px-3 text-center text-xs font-medium text-[#475569] line-clamp-1">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
