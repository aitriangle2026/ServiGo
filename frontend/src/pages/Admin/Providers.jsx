import { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import useFetch from '@/hooks/useFetch';
import { providerService } from '@/services/providerService';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { FaUserCheck } from 'react-icons/fa';

export default function AdminProviders() {
  const { data, isLoading, error, refetch } = useFetch(() => providerService.getPending(), []);
  const [processingId, setProcessingId] = useState(null);

  const providers = data?.data || [];

  const handleDecision = async (id, status) => {
    setProcessingId(id);
    try {
      await providerService.updateVerification(id, status);
      refetch();
    } catch (err) {
      alert(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout title="Pending Provider Verifications">
      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      {!error && !isLoading && providers.length === 0 && (
        <EmptyState
          icon={<FaUserCheck size={22} />}
          title="No pending providers"
          description="All caught up — new provider signups awaiting verification will show up here."
        />
      )}

      {!error && !isLoading && providers.length > 0 && (
        <div className="space-y-4">
          {providers.map((p) => (
            <div key={p._id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-[15px] font-bold text-secondary">
                      {p.user?.firstName} {p.user?.lastName}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        p.verificationScore >= 80 ? 'bg-success-light text-success' : 'bg-slate-100 text-text-muted'
                      }`}
                    >
                      {p.verificationScore ?? 0}/100
                    </span>
                    {p.verificationScore >= 80 && (
                      <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-bold text-accent">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">{p.user?.email} · {p.user?.phone}</p>
                  <p className="mt-2 text-sm text-secondary">
                    {p.documentType === 'passport' ? 'Passport' : 'NIC'}: {p.nicNumber || 'Not provided'}
                  </p>
                  {p.bio && <p className="mt-1 text-sm text-text-muted">{p.bio}</p>}
                  {p.experience > 0 && <p className="mt-1 text-xs text-text-muted">{p.experience} years experience</p>}
                  {p.categories?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.categories.map((c) => (
                        <span key={c._id} className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {(p.nicFrontImage || p.nicBackImage || p.selfieImage) && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-xs font-semibold text-text-muted">
                        ID document vs. selfie — compare visually
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {p.nicFrontImage && (
                          <a href={p.nicFrontImage} target="_blank" rel="noreferrer">
                            <img src={p.nicFrontImage} alt="ID front" className="h-24 w-36 rounded-lg border border-border object-cover" />
                          </a>
                        )}
                        {p.nicBackImage && (
                          <a href={p.nicBackImage} target="_blank" rel="noreferrer">
                            <img src={p.nicBackImage} alt="ID back" className="h-24 w-36 rounded-lg border border-border object-cover" />
                          </a>
                        )}
                        {p.selfieImage && (
                          <a href={p.selfieImage} target="_blank" rel="noreferrer">
                            <img src={p.selfieImage} alt="Selfie" className="h-24 w-24 rounded-lg border-2 border-primary/40 object-cover" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {p.portfolioImages?.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-xs font-semibold text-text-muted">Previous work ({p.portfolioImages.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {p.portfolioImages.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.certificates?.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-xs font-semibold text-text-muted">Certificates</p>
                      <div className="flex flex-wrap gap-2">
                        {p.certificates.map((c) => (
                          <a
                            key={c._id}
                            href={c.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-primary underline"
                          >
                            {c.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {(p.payoutDetails?.bankName || p.payoutDetails?.accountNumber) && (
                    <p className="mt-3 text-xs text-text-muted">
                      Payout: {p.payoutDetails.bankName} · {p.payoutDetails.accountNumber} ({p.payoutDetails.accountHolderName})
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={processingId === p._id}
                    onClick={() => handleDecision(p._id, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={processingId === p._id}
                    onClick={() => handleDecision(p._id, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}