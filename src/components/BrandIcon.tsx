interface BrandIconProps {
  path: string;
  size?: number;
  className?: string;
}

export function BrandIcon({ path, size = 16, className }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
