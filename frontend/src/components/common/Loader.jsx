const SIZE_MAP = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

/**
 * @param {{ size?: 'sm'|'md'|'lg', variant?: 'primary'|'white', fullScreen?: boolean, label?: string, className?: string }} props
 */
export default function Loader({ size = 'md', variant = 'primary', fullScreen = false, label, className = '' }) {
  const colorClass = variant === 'white' ? 'border-white/30 border-t-white' : 'border-primary/20 border-t-primary';

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`animate-spin rounded-full ${SIZE_MAP[size]} ${colorClass}`} />
      {label && <p className="text-sm text-text-muted">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
