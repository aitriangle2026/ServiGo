import { Link } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import useFetch from '@/hooks/useFetch';
import { supportService } from '@/services/supportService';

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

export default function AdminSupportChat() {
  const { data, isLoading, error } = useFetch(() => supportService.adminConversations(), []);
  const conversations = data?.data || [];

  return (
    <AdminLayout title="Support Chat">
      <p className="mb-6 text-sm text-text-muted">
        Every provider whose support request was approved — any admin can pick up and reply to any thread.
      </p>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      {!error && !isLoading && conversations.length === 0 && (
        <p className="text-sm text-text-muted">No support conversations yet.</p>
      )}

      {!error && !isLoading && conversations.length > 0 && (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {conversations.map((c) => {
            const providerName = c.provider
              ? `${c.provider.firstName || ''} ${c.provider.lastName || ''}`.trim()
              : 'Unknown provider';

            return (
              <Link
                key={c._id}
                to={`/admin/support/${c._id}`}
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-light font-display text-base font-bold text-primary">
                  {c.provider?.profileImage ? (
                    <img src={c.provider.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (providerName || '?').charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-secondary">{providerName}</p>
                    <span className="shrink-0 text-xs text-text-muted">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-text-muted">{c.lastMessage || 'No messages yet'}</p>
                    {c.adminUnreadCount > 0 && (
                      <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                        {c.adminUnreadCount}
                      </span>
                    )}
                    {c.status === 'closed' && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-text-muted">
                        Closed
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}