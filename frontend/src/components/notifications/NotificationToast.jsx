import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { getNotificationMeta, TONE_CLASSES } from '@/utils/notificationMeta';

/**
 * The live toast shown the moment a notification arrives.
 *
 * Rendered through `toast.custom()` so it can use the ServiGo palette and
 * the same per-type icons as the bell and the notifications page, rather
 * than react-hot-toast's default text-and-emoji styling.
 *
 * @param {{
 *   notification: object,
 *   visible: boolean,
 *   onClose: () => void,
 *   onClick?: () => void,
 * }} props
 */
export default function NotificationToast({ notification, visible, onClose, onClick }) {
  const { icon: Icon, tone } = getNotificationMeta(notification.type);
  const isClickable = Boolean(notification.link);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={
        visible
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: -12, scale: 0.96 }
      }
      transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
      role="status"
      aria-live="polite"
      className="pointer-events-auto w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-soft-lg"
    >
      <div
        onClick={isClickable ? onClick : undefined}
        onKeyDown={
          isClickable
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        className={`relative flex gap-3 p-4 ${isClickable ? 'cursor-pointer hover:bg-slate-50' : ''}`}
      >
        <span
          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${TONE_CLASSES[tone]}`}
        >
          <Icon size={14} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="pr-5 text-sm font-bold text-secondary">{notification.title}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-text-muted">{notification.message}</p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            // The whole card is clickable — don't navigate on the way out.
            event.stopPropagation();
            onClose();
          }}
          aria-label="Dismiss notification"
          className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-text-muted transition-colors hover:bg-slate-200 hover:text-secondary"
        >
          <FaTimes size={10} />
        </button>
      </div>

      {/* Countdown bar — shows the auto-dismiss without needing a timer label. */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 5, ease: 'linear' }}
        style={{ transformOrigin: 'left' }}
        className="h-0.5 bg-primary/30"
      />
    </motion.div>
  );
}
