import Image from 'next/image';

interface LogoBadgeProps {
  src?: string;
  alt: string;
  label: string;
  size?: number;
  variant?: 'round' | 'square';
  fit?: 'cover' | 'contain';
  accentColor?: string;
  className?: string;
}

function getFallbackText(label: string): string {
  const text = label.trim();
  if (!text) return '?';

  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function LogoBadge({
  src,
  alt,
  label,
  size = 40,
  variant = 'square',
  fit = 'cover',
  accentColor,
  className,
}: LogoBadgeProps) {
  const radiusClass = variant === 'round' ? 'rounded-full' : 'rounded-xl';
  const fallbackColor = accentColor || '#2563eb';

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-gray-200 bg-white ${radiusClass} ${className || ''}`.trim()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: src ? '#ffffff' : `${fallbackColor}14`,
        color: fallbackColor,
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes={`${size}px`}
          className={fit === 'cover' ? 'object-cover' : 'object-contain p-1.5'}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-semibold tracking-[0.16em]">
          {getFallbackText(label)}
        </span>
      )}
    </div>
  );
}
