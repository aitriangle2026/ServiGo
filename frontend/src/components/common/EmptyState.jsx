import Button from '@/components/common/Button';

/**
 * Shared "nothing here yet" panel, with an optional call to action.
 *
 * @param {{
 *   icon?: React.ReactNode,
 *   title: string,
 *   description?: string,
 *   actionLabel?: string,
 *   onAction?: () => void,
 *   className?: string,
 * }} props
 */
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-14 text-center ${className}`}
    >
      {icon && (
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary-light text-primary">
          {icon}
        </span>
      )}

      <h3 className="font-display text-lg font-bold text-secondary">{title}</h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-text-muted">{description}</p>
      )}

      {actionLabel && onAction && (
        <Button variant="primary" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
