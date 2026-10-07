import { useEffect, useState } from 'react';
import { FaHeadset, FaPaperPlane } from 'react-icons/fa';
import ProviderLayout from '@/layouts/ProviderLayout';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import useFetch from '@/hooks/useFetch';
import useSocket from '@/hooks/useSocket';
import SupportChatPanel from '@/components/support/SupportChatPanel';
import { supportService } from '@/services/supportService';

const STATUS_STYLE = {
  pending: 'bg-slate-100 text-text-muted',
  accepted: 'bg-success-light text-success',
  rejected: 'bg-danger-light text-danger',
};

const STATUS_LABEL = {
  pending: 'Awaiting ServiGo review',
  accepted: 'Approved',
  rejected: 'Declined',
};

export default function ProviderSupport() {
  const { data: convoData, isLoading: isLoadingConvo, refetch: refetchConvo } = useFetch(
    () => supportService.myConversation(),
    []
  );
  const { data: requestsData, isLoading: isLoadingRequests, refetch: refetchRequests } = useFetch(
    () => supportService.myRequests(),
    []
  );

  const conversation = convoData?.data || null;
  const requests = requestsData?.data || [];
  const hasPending = requests.some((r) => r.status === 'pending');

  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;
    const onRequestUpdated = () => {
      refetchConvo();
      refetchRequests();
    };
    socket.on('supportRequestUpdated', onRequestUpdated);
    return () => socket.off('supportRequestUpdated', onRequestUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Enter both a subject and a message.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await supportService.createRequest({ subject: subject.trim(), message: message.trim() });
      setSubject('');
      setMessage('');
      refetchRequests();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send that request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingConvo || isLoadingRequests;

  return (
    <ProviderLayout title="Support">
      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      {!isLoading && conversation && conversation.status === 'open' && (
        <div>
          <p className="mb-4 flex items-center gap-2 text-sm text-text-muted">
            <FaHeadset className="text-primary" /> Chatting with the ServiGo support team.
          </p>
          <SupportChatPanel conversationId={conversation._id} />
        </div>
      )}

      {!isLoading && (!conversation || conversation.status !== 'open') && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="font-display text-base font-bold text-secondary">Request a chat with ServiGo</h3>
            <p className="mt-1 text-sm text-text-muted">
              Tell us what you need help with. An admin will review your request before the chat opens.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <textarea
                placeholder="Describe what you need help with…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none"
              />
              {error && <p className="text-xs text-danger">{error}</p>}
              <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={hasPending}>
                <FaPaperPlane size={12} className="mr-1.5" /> Send request
              </Button>
              {hasPending && (
                <p className="text-xs text-text-muted">
                  You already have a request awaiting review — you'll be notified once an admin responds.
                </p>
              )}
            </form>
          </div>

          {requests.length > 0 && (
            <div>
              <h3 className="mb-3 font-display text-base font-bold text-secondary">Your requests</h3>
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r._id} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-secondary">{r.subject}</p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status] || ''}`}
                      >
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-muted">{r.message}</p>
                    {r.status === 'rejected' && r.rejectionReason && (
                      <p className="mt-2 rounded-lg bg-danger-light p-2 text-xs text-danger">
                        Reason: {r.rejectionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ProviderLayout>
  );
}