import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { formatRelativeTime } from '@/utils/formatDate';
import { getNotificationMeta, TONE_CLASSES } from '@/utils/notificationMeta';

/**
 * One row in the bell dropdown or the notifications page.
 *
 * @param {{
 *   notification: object,
 *   onRead?: (id: string) => void,
 *   onRemove?: (id: string) => void,
 *   onNavigate?: () => void,
 *   compact?: boolean,
 * }} props
 */
export default function NotificationItem({
  notification,
  onRead,
  onRemove,
  onNavigate,
  compact = false,
}) {
  const navigate = useNavigate();
  const { icon: Icon, tone } = getNotificationMeta(notification.type);

  const handleClick = () => {
    if (!notification.isRead) onRead?.(notification._id);
    if (notification.link) {
      navigate(notification.link);
      onNavigate?.();
    }
  };

  const handleRemove = (event) => {
    // The row itself is clickable — don't navigate on the way to dismissing.
    event.stopPropagation();
    onRemove?.(notification._id);
  };

  const isClickable = Boolean(notification.link) || !notification.isRead;

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={`group relative flex gap-3 border-b border-border transition-colors last:border-b-0
        ${compact ? 'px-4 py-3' : 'px-5 py-4'}
        ${notification.isRead ? 'bg-surface' : 'bg-primary-light/40'}
        ${isClickable ? 'cursor-pointer hover:bg-slate-50' : ''}`}
    >
      <span
        className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${TONE_CLASSES[tone]}`}
      >
        <Icon size={14} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm ${
              notification.isRead ? 'font-medium text-secondary' : 'font-bold text-secondary'
            }`}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-xs text-text-muted">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p className={`mt-0.5 text-sm text-text-muted ${compact ? 'line-clamp-2' : ''}`}>
          {notification.message}
        </p>
      </div>

      {!notification.isRead && (
        <span
          aria-label="Unread"
          className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary"
        />
      )}

      {onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          aria-label="Dismiss notification"
          className="absolute right-2 top-2 hidden h-6 w-6 place-items-center rounded-full text-text-muted hover:bg-slate-200 hover:text-secondary group-hover:grid"
        >
          <FaTimes size={10} />
        </button>
      )}
    </div>
  );
}
