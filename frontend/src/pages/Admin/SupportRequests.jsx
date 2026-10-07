import { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import useFetch from '@/hooks/useFetch';
import { supportService } from '@/services/supportService';

export default function AdminSupportRequests() {
  const { data, isLoading, error, refetch } = useFetch(() => supportService.pendingRequests(), []);
  const requests = data?.data || [];
  const [busyId, setBusyId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');

  const handleApprove = async (id) => {
    setBusyId(id);
    setActionError('');
    try {
      await supportService.reviewRequest(id, { action: 'approve' });
      refetch();
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Could not approve this request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    setBusyId(id);
    setActionError('');
    try {
      await supportService.reviewRequest(id, { action: 'reject', rejectionReason: reason });
      setDecliningId(null);
      setReason('');
      refetch();
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Could not reject this request.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout title="Support Requests">
      <p className="mb-6 text-sm text-text-muted">
        Providers asking to open a chat with the ServiGo team — approve to unlock the conversation, or decline with
        an optional reason.
      </p>

      {actionError && (
        <p className="mb-4 rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">
          {actionError}
        </p>
      )}

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      {!error && !isLoading && requests.length === 0 && (
        <p className="text-sm text-text-muted">No support requests waiting for review right now.</p>
      )}

      {!error && !isLoading && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((r) => {
            const providerName = r.provider
              ? `${r.provider.firstName || ''} ${r.provider.lastName || ''}`.trim()
              : '—';

            return (
              <div key={r._id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-secondary">{providerName}</p>
                  <p className="text-xs text-text-muted">{new Date(r.createdAt).toLocaleString()}</p>
                </div>

                <p className="mt-3 text-sm font-semibold text-secondary">{r.subject}</p>
                <p className="mt-1 text-sm text-text-muted">{r.message}</p>

                {decliningId === r._id ? (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <Input
                      placeholder="Reason for declining (optional)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDecliningId(null);
                          setReason('');
                        }}
                        disabled={busyId === r._id}
                      >
                        Cancel
                      </Button>
                      <Button variant="danger" size="sm" isLoading={busyId === r._id} onClick={() => handleReject(r._id)}>
                        Confirm decline
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2 border-t border-border pt-4">
                    <Button variant="outline" size="sm" onClick={() => setDecliningId(r._id)} disabled={busyId === r._id}>
                      Decline
                    </Button>
                    <Button variant="primary" size="sm" isLoading={busyId === r._id} onClick={() => handleApprove(r._id)}>
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}