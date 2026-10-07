import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import CustomerLayout from '@/layouts/CustomerLayout';
import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import { chatService } from '@/services/chatService';

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

export default function ChatList() {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';
  const Layout = isProvider ? ProviderLayout : CustomerLayout;

  const { data, isLoading, error } = useFetch(() => chatService.getConversations(), []);
  const conversations = data?.data || [];

  return (
    <Layout title="Messages">
      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {!isLoading && conversations.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-text-muted">
            {isProvider
              ? "No conversations yet. When a customer messages you about a service, it'll show up here."
              : "No conversations yet. Message a provider from their profile to get started."}
          </p>
        </div>
      )}

      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {conversations.map((c) => {
          const otherName = isProvider
            ? `${c.customer?.firstName || ''} ${c.customer?.lastName || ''}`.trim()
            : `${c.provider?.user?.firstName || ''} ${c.provider?.user?.lastName || ''}`.trim();
          const otherAvatar = isProvider ? c.customer?.profileImage : c.provider?.profileImage;
          const unread = isProvider ? c.providerUnreadCount : c.customerUnreadCount;

          return (
            <Link
              key={c._id}
              to={`/messages/${c._id}`}
              className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-light font-display text-base font-bold text-primary">
                {otherAvatar ? (
                  <img src={otherAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  (otherName || '?').charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-secondary">{otherName || 'Unknown'}</p>
                  <span className="shrink-0 text-xs text-text-muted">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-text-muted">{c.lastMessage || 'No messages yet'}</p>
                  {unread > 0 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
}