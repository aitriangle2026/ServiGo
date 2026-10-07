import { useState } from 'react';
import { FaBell, FaCheckDouble } from 'react-icons/fa';
import NotificationItem from '@/components/notifications/NotificationItem';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import { useNotifications } from '@/context/NotificationContext';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

/**
 * The full notifications list. Shared by the customer, provider and admin
 * notification pages — they differ only in the layout they're wrapped in,
 * and all three read the same live list from NotificationContext.
 */
export default function NotificationsPanel() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    error,
    loadMore,
    markAsRead,
    markAllAsRead,
    remove,
  } = useNotifications();

  const [filter, setFilter] = useState('all');

  const visible =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-text-muted hover:text-secondary'
              }`}
            >
              {f.label}
              {f.key === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" icon={FaCheckDouble} onClick={markAllAsRead}>
            Mark all read
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && notifications.length === 0 && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {!error && !isLoading && visible.length === 0 && (
        <EmptyState
          icon={<FaBell size={22} />}
          title={filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
          description={
            filter === 'unread'
              ? 'Everything here has been read.'
              : "Updates about your bookings, payments and account will show up here."
          }
        />
      )}

      {!error && visible.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          {visible.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onRead={markAsRead}
              onRemove={remove}
            />
          ))}
        </div>
      )}

      {/* Paging applies to the underlying list, so it stays hidden while the
          "unread" filter is narrowing what's on screen. */}
      {!error && hasMore && filter === 'all' && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={loadMore} isLoading={isLoading}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
