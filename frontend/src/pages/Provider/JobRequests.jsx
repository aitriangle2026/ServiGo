import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSearch, FiCalendar, FiClock, FiMapPin, FiPhone, FiChevronRight, FiTool, FiUsers, FiPaperclip } from 'react-icons/fi';
import { FaClipboardList } from 'react-icons/fa';
import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import { jobRequestService } from '@/services/jobRequestService';
import { formatCurrency } from '@/utils/formatCurrency';
import EmptyState from '@/components/common/EmptyState';
import Modal from '@/components/common/Modal';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';

// Where each request stands for this provider (stage comes from the server —
// see proposal.service.js stageFor).
const TABS = [
  { key: 'all', label: 'All Requests' },
  { key: 'new', label: 'New' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'converted', label: 'Converted' },
  { key: 'declined', label: 'Declined' },
];

const SORTS = [
  { key: 'newest', label: 'Newest', compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  { key: 'oldest', label: 'Oldest', compare: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
  {
    key: 'date',
    label: 'Preferred date',
    compare: (a, b) => (a.preferredDate ? new Date(a.preferredDate) : Infinity) - (b.preferredDate ? new Date(b.preferredDate) : Infinity),
  },
  { key: 'budget', label: 'Budget: high to low', compare: (a, b) => (b.budget || 0) - (a.budget || 0) },
];

// Same slots as the booking page, so a quoted time reads like any booking.
const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

const isImage = (url) => /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url || '');
const customerName = (r) => `${r.customer?.firstName || ''} ${r.customer?.lastName || ''}`.trim() || 'Customer';
const placeOf = (r) => [r.location?.city, r.location?.district].filter(Boolean).join(', ');
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');
const formatDay = (value) =>
  value ? new Date(value).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'Flexible';

function QuoteModal({ request, onClose, onSaved }) {
  const existing = request.stage === 'quoted' ? request.myProposal : null;
  const [form, setForm] = useState(() => ({
    amount: existing?.amount ?? request.budget ?? '',
    proposedDate: toDateInput(existing?.proposedDate || request.preferredDate),
    proposedTime: existing?.proposedTime || (TIME_SLOTS.includes(request.preferredTime) ? request.preferredTime : ''),
    message: existing?.message || '',
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const inputClass =
    'w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-secondary focus:border-primary focus:outline-none';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!(Number(form.amount) > 0)) {
      setError('Enter your price for the job.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await jobRequestService.submitProposal(request._id, { ...form, amount: Number(form.amount) });
      toast.success(existing ? 'Quote updated' : `Quote sent to ${customerName(request)}`);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send your quote.');
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={existing ? 'Edit your quote' : 'Send a quote'} size="lg">
      <form onSubmit={handleSubmit} className="min-h-0 space-y-4 overflow-y-auto">
        <div className="rounded-xl bg-surface-warm p-4 text-sm">
          <p className="font-medium text-secondary">
            {request.category?.name} · {customerName(request)}
          </p>
          <p className="mt-1 line-clamp-3 text-text-muted">{request.description}</p>
          <p className="mt-2 text-xs text-text-muted">
            Customer's budget: {request.budget != null ? formatCurrency(request.budget) : 'open to quotes'}
          </p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-secondary">Your price (LKR)</span>
          <input type="number" min="1" step="1" value={form.amount} onChange={set('amount')} className={inputClass} />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-secondary">Date you can do it</span>
            <input type="date" min={new Date().toISOString().slice(0, 10)} value={form.proposedDate} onChange={set('proposedDate')} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-secondary">Time</span>
            <select value={form.proposedTime} onChange={set('proposedTime')} className={inputClass}>
              <option value="">Flexible</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-secondary">Message to the customer (optional)</span>
          <textarea
            value={form.message}
            onChange={set('message')}
            rows={3}
            maxLength={1000}
            placeholder="What's included, what you'll bring, how long it takes…"
            className={`${inputClass} resize-y`}
          />
        </label>
        <p className="text-xs text-text-muted">
          If the customer accepts, this becomes a confirmed booking at this price, date and time.
        </p>
        {error && <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-secondary hover:bg-surface-warm">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white hover:bg-primary disabled:opacity-60">
            {isSaving ? 'Sending…' : existing ? 'Update quote' : 'Send quote'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function StageActions({ request, busy, onQuote, onDismiss, onUndismiss, onWithdraw }) {
  const button = 'w-full rounded-lg px-4 py-2.5 text-[13px] font-medium disabled:opacity-60';
  const primary = `${button} bg-secondary text-white hover:bg-primary`;
  const secondary = `${button} border border-border text-secondary hover:border-primary hover:text-primary`;

  switch (request.stage) {
    case 'new':
      return (
        <>
          <button type="button" disabled={busy} onClick={onQuote} className={primary}>
            Send Quote
          </button>
          <button type="button" disabled={busy} onClick={onDismiss} className={secondary}>
            Not interested
          </button>
        </>
      );
    case 'quoted':
      return (
        <>
          <button type="button" disabled={busy} onClick={onQuote} className={primary}>
            Edit Quote
          </button>
          <button type="button" disabled={busy} onClick={onWithdraw} className={secondary}>
            Withdraw
          </button>
        </>
      );
    case 'converted':
      return (
        <Link to={`/provider/bookings${request.awardedBooking ? `?highlight=${request.awardedBooking}` : ''}`} className={`${primary} text-center`}>
          View Booking
        </Link>
      );
    default:
      return request.dismissed && request.status === 'open' ? (
        <button type="button" disabled={busy} onClick={onUndismiss} className={secondary}>
          Reconsider
        </button>
      ) : null;
  }
}

function stageNote(request) {
  const quote = request.myProposal;
  if (request.stage === 'quoted') return `Your quote: ${formatCurrency(quote.amount)}`;
  if (request.stage === 'converted') return `Won at ${formatCurrency(quote.amount)}`;
  if (request.stage === 'declined') {
    if (request.dismissed && request.status === 'open') return 'You passed on this';
    if (quote?.status === 'rejected') return 'Customer declined your quote';
    if (request.status === 'awarded') return 'Went to another professional';
    if (request.status === 'cancelled') return 'Customer cancelled the request';
    return 'Closed';
  }
  return null;
}

export default function ProviderJobRequests() {
  const { data, isLoading, error, refetch } = useFetch(() => jobRequestService.getPipeline(), []);
  const requests = useMemo(() => data?.data?.data || [], [data]);
  const providerCity = (data?.data?.providerCity || '').trim();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [sortKey, setSortKey] = useState('newest');
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [quoteTarget, setQuoteTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const categories = [...new Set(requests.map((r) => r.category?.name).filter(Boolean))].sort();
  const areas = [...new Set(requests.map((r) => r.location?.city).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  const needle = search.trim().toLowerCase();
  const filtered = requests.filter((r) => {
    if (nearbyOnly && providerCity && (r.location?.city || '').trim().toLowerCase() !== providerCity.toLowerCase()) return false;
    if (categoryFilter !== 'all' && r.category?.name !== categoryFilter) return false;
    if (areaFilter !== 'all' && r.location?.city !== areaFilter) return false;
    if (needle && ![customerName(r), r.category?.name, r.description, placeOf(r)].some((f) => (f || '').toLowerCase().includes(needle))) {
      return false;
    }
    return true;
  });
  const counts = Object.fromEntries(
    TABS.map((tab) => [tab.key, tab.key === 'all' ? filtered.length : filtered.filter((r) => r.stage === tab.key).length])
  );
  const visible = filtered
    .filter((r) => activeTab === 'all' || r.stage === activeTab)
    .sort(SORTS.find((s) => s.key === sortKey).compare);
  const openCount = requests.filter((r) => r.stage === 'new').length;

  const run = async (request, action, message) => {
    setBusyId(request._id);
    try {
      await action();
      if (message) toast.success(message);
      await refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  };

  const dismiss = (request) =>
    run(request, () => jobRequestService.dismiss(request._id), null).then(() =>
      toast((t) => (
        <span className="flex items-center gap-3 text-sm">
          Moved to Declined.
          <button
            type="button"
            className="font-semibold text-primary"
            onClick={() => {
              toast.dismiss(t.id);
              run(request, () => jobRequestService.undismiss(request._id), 'Back in New');
            }}
          >
            Undo
          </button>
        </span>
      ))
    );

  return (
    <ProviderLayout>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-text-muted">
        <Link to="/provider/dashboard" className="hover:text-secondary">
          Home
        </Link>
        <FiChevronRight className="text-[11px]" />
        <span className="text-secondary">Service Requests</span>
      </nav>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[2.4rem] font-medium leading-tight text-secondary sm:text-5xl">Service Requests</h1>
          <p className="mt-2 text-[15px] text-text-muted">
            Jobs customers have posted in your country, in the categories you offer.
            {openCount > 0 && ` ${openCount} waiting for a quote.`}
          </p>
        </div>
        <label className={`flex shrink-0 items-center gap-3 text-sm ${providerCity ? 'text-secondary' : 'text-text-muted'}`}>
          <span>
            Only nearby requests
            <span className="block text-xs text-text-muted">{providerCity ? `In ${providerCity}` : 'Set your city in Profile first'}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={nearbyOnly}
            disabled={!providerCity}
            onClick={() => setNearbyOnly((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${nearbyOnly ? 'bg-primary' : 'bg-border'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow-soft transition-all ${nearbyOnly ? 'left-6' : 'left-1'}`} />
          </button>
        </label>
      </div>

      <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
              activeTab === tab.key ? 'border-primary/40 bg-primary-light font-medium text-secondary' : 'border-border bg-surface text-secondary hover:border-primary/40'
            }`}
          >
            {tab.label}
            <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs ${activeTab === tab.key ? 'bg-surface' : 'bg-surface-warm'}`}>
              {counts[tab.key]}
            </span>
            {tab.key === 'new' && counts.new > 0 && <span className="h-2 w-2 rounded-full bg-danger" aria-label="New requests" />}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 lg:flex-row lg:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-surface-warm px-4 py-2.5">
          <FiSearch className="shrink-0 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, service or location…"
            aria-label="Search requests"
            className="w-full bg-transparent text-[13px] text-secondary placeholder:text-text-muted focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex">
          {[
            { value: categoryFilter, set: setCategoryFilter, label: 'Service', all: 'All Services', options: categories },
            { value: areaFilter, set: setAreaFilter, label: 'Location', all: 'All Locations', options: areas },
          ].map((f) => (
            <select
              key={f.label}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              aria-label={f.label}
              className="min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-secondary focus:border-primary focus:outline-none"
            >
              <option value="all">{f.all}</option>
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ))}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            aria-label="Sort by"
            className="min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-secondary focus:border-primary focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                Sort by: {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {error && <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">{error}</div>}
        {!error && isLoading && Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)}

        {!error && !isLoading && visible.length === 0 && (
          <EmptyState
            icon={<FaClipboardList size={22} />}
            title={requests.length === 0 ? 'No service requests right now' : 'Nothing here'}
            description={
              requests.length === 0
                ? "When a customer posts a job in one of your categories, it'll show up here and you'll get a notification."
                : 'Try another tab, or clear the search and filters.'
            }
          />
        )}

        {visible.map((request) => {
          const photo = request.attachments?.find(isImage);
          const otherFiles = (request.attachments || []).filter((a) => a !== photo).length;
          const note = stageNote(request);
          return (
            <article
              key={request._id}
              className={`grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-4 md:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[6rem_minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)_10rem] xl:items-center ${
                busyId === request._id ? 'opacity-60' : ''
              }`}
            >
              {photo ? (
                <a href={photo} target="_blank" rel="noopener noreferrer">
                  <img src={photo} alt="Photo from the customer" className="h-40 w-full rounded-xl object-cover md:h-24 md:w-24" />
                </a>
              ) : (
                <span className="grid h-24 w-full place-items-center rounded-xl bg-surface-warm text-2xl text-text-muted md:w-24">
                  <FiTool />
                </span>
              )}

              <div className="min-w-0">
                <p className="truncate text-[16px] font-medium text-secondary">{customerName(request)}</p>
                {request.customer?.phone && (
                  <a href={`tel:${request.customer.phone}`} className="mt-1.5 flex items-center gap-2 text-[13px] text-text hover:text-primary">
                    <FiPhone className="shrink-0 text-text-muted" /> {request.customer.phone}
                  </a>
                )}
                <p className="mt-1 text-xs text-text-muted">
                  Posted {new Date(request.createdAt).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' })}
                </p>
              </div>

              <div className="min-w-0 text-[13px]">
                <span className="inline-block rounded-md bg-surface-warm px-2 py-0.5 text-xs text-text-muted">{request.category?.name || 'General'}</span>
                <p className="mt-1.5 line-clamp-2 text-text">{request.description}</p>
                {otherFiles > 0 && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                    <FiPaperclip /> {otherFiles} more {otherFiles === 1 ? 'file' : 'files'}
                  </p>
                )}
              </div>

              <div className="min-w-0 space-y-1.5 text-[13px] text-text md:col-start-2 xl:col-start-auto">
                <p className="flex items-center gap-2">
                  <FiCalendar className="shrink-0 text-text-muted" /> {formatDay(request.preferredDate)}
                </p>
                <p className="flex items-center gap-2">
                  <FiClock className="shrink-0 text-text-muted" /> {request.preferredTime || 'Any time'}
                </p>
                {placeOf(request) && (
                  <p className="flex items-center gap-2">
                    <FiMapPin className="shrink-0 text-text-muted" /> <span className="truncate capitalize">{placeOf(request)}</span>
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-lg font-medium text-secondary">
                  {request.budget != null ? formatCurrency(request.budget) : 'Open'}
                </p>
                <p className="text-xs text-text-muted">{request.budget != null ? "Customer's budget" : 'No budget set — quote your price'}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                  <FiUsers /> {request.proposalCount} {request.proposalCount === 1 ? 'quote' : 'quotes'} so far
                </p>
                {note && <p className="mt-1 text-xs font-medium text-primary">{note}</p>}
              </div>

              <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
                <StageActions
                  request={request}
                  busy={busyId === request._id}
                  onQuote={() => setQuoteTarget(request)}
                  onDismiss={() => dismiss(request)}
                  onUndismiss={() => run(request, () => jobRequestService.undismiss(request._id), 'Back in New')}
                  onWithdraw={() => run(request, () => jobRequestService.withdrawProposal(request.myProposal._id), 'Quote withdrawn')}
                />
              </div>
            </article>
          );
        })}
      </div>

      {quoteTarget && (
        <QuoteModal
          request={quoteTarget}
          onClose={() => setQuoteTarget(null)}
          onSaved={() => {
            setQuoteTarget(null);
            refetch();
          }}
        />
      )}
    </ProviderLayout>
  );
}
