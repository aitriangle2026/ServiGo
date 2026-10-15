import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiCreditCard,
  FiArrowUp,
  FiArrowDown,
  FiEdit2,
  FiHome,
  FiRepeat,
  FiInfo,
  FiExternalLink,
  FiDollarSign,
} from 'react-icons/fi';
import ProviderLayout from '@/layouts/ProviderLayout';
import Modal from '@/components/common/Modal';
import useFetch from '@/hooks/useFetch';
import { providerService } from '@/services/providerService';
import { formatCurrency } from '@/utils/formatCurrency';

// Presets rather than a free date picker: every one maps to a clean
// "previous period of the same length" for the % change.
const RANGES = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'last_3', label: 'Last 3 months' },
  { key: 'last_6', label: 'Last 6 months' },
  { key: 'this_year', label: 'This year' },
  { key: 'all', label: 'All time' },
];

const STATUS = {
  collected: { label: 'Collected (cash)', classes: 'bg-success-light text-success' },
  held: { label: 'Held', classes: 'bg-amber-50 text-accent-hover' },
  released: { label: 'Paid out', classes: 'bg-primary-light text-primary' },
};

const startOfMonth = (year, month) => new Date(year, month, 1);

/** @returns {{ from: Date | null, to: Date, prevFrom: Date | null, prevTo: Date | null, label: string }} */
function rangeFor(key, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const months = (back, length) => {
    const from = startOfMonth(y, m - back);
    const to = startOfMonth(y, m - back + length);
    return { from, to, prevFrom: startOfMonth(y, m - back - length), prevTo: from };
  };
  switch (key) {
    case 'last_month':
      return months(1, 1);
    case 'last_3':
      return months(2, 3);
    case 'last_6':
      return months(5, 6);
    case 'this_year':
      return { from: new Date(y, 0, 1), to: new Date(y + 1, 0, 1), prevFrom: new Date(y - 1, 0, 1), prevTo: new Date(y, 0, 1) };
    case 'all':
      return { from: null, to: new Date(8640000000000000), prevFrom: null, prevTo: null };
    default:
      return months(0, 1);
  }
}

const inRange = (value, from, to) => {
  if (!value) return false;
  const date = new Date(value);
  return (!from || date >= from) && date < to;
};

const percentChange = (current, previous) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

const sum = (list) => list.reduce((total, t) => total + (t.amount || 0), 0);

// Booking dates are stored as UTC midnight of the chosen day.
const formatDay = (value) =>
  new Date(value).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function Trend({ value, suffix = 'from previous period' }) {
  if (value === null) return <span className="text-xs text-text-muted">No earlier period to compare</span>;
  const up = value >= 0;
  return (
    <span className="flex items-center gap-1 text-xs text-text-muted">
      <span className={`flex items-center gap-0.5 font-medium ${up ? 'text-success' : 'text-danger'}`}>
        {up ? <FiArrowUp /> : <FiArrowDown />}
        {up ? '+' : ''}
        {value}%
      </span>
      {suffix}
    </span>
  );
}

function Card({ title, action, children, className = '' }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border bg-surface p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-body text-lg font-medium text-secondary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * Monthly bars, stacked: settled money (cash collected + payouts released)
 * at the base, money ServiGo still holds on top. Two series → legend; a 2px
 * surface gap separates the segments.
 */
function MonthlyChart({ months }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...months.map((m) => m.settled + m.held), 0);
  const niceMax = (() => {
    if (max <= 0) return 5000;
    const power = 10 ** Math.floor(Math.log10(max));
    return [1, 2, 2.5, 5, 10].map((x) => x * power).find((x) => x >= max);
  })();
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));
  const short = (n) => (n >= 1000 ? `${Math.round((n / 1000) * 10) / 10}K` : String(n));

  return (
    <div>
      <div className="flex gap-3">
        <div className="flex h-52 flex-col justify-between text-right text-[11px] text-text-muted">
          {[...ticks].reverse().map((tick) => (
            <span key={tick} className="leading-none">
              {tick === 0 ? '0' : `LKR ${short(tick)}`}
            </span>
          ))}
        </div>
        <div className="relative h-52 flex-1">
          {ticks.map((tick) => (
            <span key={tick} className="absolute inset-x-0 h-px bg-border/70" style={{ bottom: `${(tick / niceMax) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end justify-around gap-2">
            {months.map((month, index) => {
              const total = month.settled + month.held;
              return (
                <button
                  key={month.key}
                  type="button"
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${month.label}: ${formatCurrency(month.settled)} settled, ${formatCurrency(month.held)} held`}
                  className="relative flex h-full w-full max-w-16 flex-col items-stretch justify-end"
                >
                  {month.held > 0 && (
                    <span
                      className={`block rounded-t-[4px] bg-accent ${hovered === index ? 'opacity-80' : ''}`}
                      style={{ height: `${(month.held / niceMax) * 100}%` }}
                    />
                  )}
                  {month.held > 0 && month.settled > 0 && <span className="block h-[2px] bg-surface" />}
                  {month.settled > 0 && (
                    <span
                      className={`block bg-success ${month.held > 0 ? '' : 'rounded-t-[4px]'} ${hovered === index ? 'opacity-80' : ''}`}
                      style={{ height: `${(month.settled / niceMax) * 100}%` }}
                    />
                  )}
                  {hovered === index && (
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-secondary px-3 py-2 text-left text-[11px] leading-relaxed text-white shadow-soft-lg">
                      <span className="block font-medium">{month.label}</span>
                      <span className="block">Settled: {formatCurrency(month.settled)}</span>
                      <span className="block">Held: {formatCurrency(month.held)}</span>
                      <span className="block opacity-70">Total: {formatCurrency(total)}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="ml-14 mt-2 flex justify-around text-[11px] text-text-muted">
        {months.map((month) => (
          <span key={month.key}>{month.label}</span>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-6 text-xs text-secondary">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-success" /> Settled (cash + paid out)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Held by ServiGo
        </span>
      </div>
    </div>
  );
}

function PayoutModal({ details, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    bankName: details?.bankName || '',
    branch: details?.branch || '',
    accountHolderName: details?.accountHolderName || '',
    accountNumber: details?.accountNumber || '',
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fields = [
    { key: 'bankName', label: 'Bank', placeholder: 'e.g. Bank of Ceylon' },
    { key: 'branch', label: 'Branch', placeholder: 'e.g. Colombo Fort' },
    { key: 'accountHolderName', label: 'Account holder name', placeholder: 'As shown on your bank account' },
    { key: 'accountNumber', label: 'Account number', placeholder: '' },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountHolderName.trim()) {
      setError('Bank, account holder and account number are required.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await providerService.updatePayoutDetails(
        Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]))
      );
      toast.success('Payout details saved');
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save your payout details.');
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Payout details">
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-secondary">{field.label}</span>
            <input
              value={form[field.key]}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              inputMode={field.key === 'accountNumber' ? 'numeric' : undefined}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-secondary focus:border-primary focus:outline-none"
            />
          </label>
        ))}
        {error && <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-secondary hover:bg-surface-warm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white hover:bg-primary disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save details'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProviderEarnings() {
  const { data, isLoading, error } = useFetch(() => providerService.getEarnings(), []);
  const profileFetch = useFetch(() => providerService.getMyProfile(), []);
  const transactions = useMemo(() => data?.data || [], [data]);
  const payout = profileFetch.data?.data?.payoutDetails;

  const [rangeKey, setRangeKey] = useState('this_month');
  const [chartMonths, setChartMonths] = useState(6);
  const [showAll, setShowAll] = useState(false);
  const [isEditingPayout, setIsEditingPayout] = useState(false);

  const range = rangeFor(rangeKey);
  const current = transactions.filter((t) => inRange(t.date, range.from, range.to));
  const previous = range.prevFrom ? transactions.filter((t) => inRange(t.date, range.prevFrom, range.prevTo)) : [];

  const totalEarned = sum(current);
  const completedNow = current.filter((t) => t.bookingStatus === 'completed').length;
  const completedBefore = previous.filter((t) => t.bookingStatus === 'completed').length;
  const held = transactions.filter((t) => t.status === 'held');
  const released = transactions.filter((t) => t.status === 'released');
  const releasedInRange = released.filter((t) => inRange(t.releasedAt, range.from, range.to));
  const lastPayout = released
    .map((t) => t.releasedAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];
  const allTime = sum(transactions);

  const compare = rangeKey !== 'all';
  const stats = [
    {
      label: 'Total Earnings',
      value: formatCurrency(totalEarned),
      foot: compare ? <Trend value={percentChange(totalEarned, sum(previous))} /> : `${current.length} paid jobs`,
      icon: FiCreditCard,
      tone: 'bg-success-light text-success',
    },
    {
      label: 'Completed Bookings',
      value: completedNow,
      foot: compare ? <Trend value={percentChange(completedNow, completedBefore)} /> : 'All time',
      icon: FiCheckSquare,
      tone: 'bg-primary-light text-primary',
    },
    {
      label: 'Pending Amount',
      value: formatCurrency(sum(held)),
      foot: held.length > 0 ? `${held.length} online ${held.length === 1 ? 'payment' : 'payments'} held by ServiGo` : 'Nothing waiting to be released',
      icon: FiClock,
      tone: 'bg-amber-50 text-accent-hover',
    },
    {
      label: 'Paid Out',
      value: formatCurrency(sum(releasedInRange)),
      foot: lastPayout ? `Last payout: ${new Date(lastPayout).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No payouts yet',
      icon: FiDollarSign,
      tone: 'bg-amber-50 text-accent-hover',
    },
  ];

  // Chart: the last N calendar months, independent of the range filter.
  const now = new Date();
  const months = Array.from({ length: chartMonths }, (_, i) => {
    const start = startOfMonth(now.getFullYear(), now.getMonth() - (chartMonths - 1 - i));
    const end = startOfMonth(start.getFullYear(), start.getMonth() + 1);
    const inMonth = transactions.filter((t) => inRange(t.date, start, end));
    return {
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: start.toLocaleDateString('en-LK', { month: 'short', ...(chartMonths > 6 ? {} : { year: 'numeric' }) }),
      settled: sum(inMonth.filter((t) => t.status !== 'held')),
      held: sum(inMonth.filter((t) => t.status === 'held')),
    };
  });

  // Breakdown by service category within the range, largest first.
  const byCategory = Object.values(
    current.reduce((acc, t) => {
      acc[t.category] ||= { name: t.category, total: 0, jobs: 0 };
      acc[t.category].total += t.amount || 0;
      acc[t.category].jobs += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);
  const topCategories = byCategory.slice(0, 4);
  const otherTotal = sum(byCategory.slice(4).map((c) => ({ amount: c.total })));
  if (otherTotal > 0) topCategories.push({ name: 'Others', total: otherTotal, jobs: byCategory.slice(4).reduce((n, c) => n + c.jobs, 0) });

  const rows = showAll ? current : current.slice(0, 5);
  const maskedAccount = payout?.accountNumber ? `•••• ${payout.accountNumber.slice(-4)}` : null;

  return (
    <ProviderLayout>
      {/* ─── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-[2.4rem] font-medium leading-tight text-secondary sm:text-5xl">My Earnings</h1>
          <p className="mt-2 text-[15px] text-text-muted">
            Track your earnings, payouts and transaction history.
            {!isLoading && allTime > 0 && <span className="ml-1">All-time: {formatCurrency(allTime)}.</span>}
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-border bg-surface px-4 py-2.5">
          <FiCalendar className="text-text-muted" />
          <select
            value={rangeKey}
            onChange={(e) => {
              setRangeKey(e.target.value);
              setShowAll(false);
            }}
            aria-label="Date range"
            className="bg-transparent pr-2 text-sm text-secondary focus:outline-none"
          >
            {RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">{error}</div>
      )}

      {/* ─── Stats ────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl ${stat.tone}`}>
              <stat.icon />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-secondary">{stat.label}</p>
              <p className="truncate text-2xl font-medium text-secondary">{isLoading ? '—' : stat.value}</p>
              <div className="mt-0.5 text-xs text-text-muted">{stat.foot}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* ═══ Left column ═════════════════════════════════════ */}
        <div className="min-w-0 space-y-5">
          <Card
            title="Earnings Overview"
            action={
              <select
                value={chartMonths}
                onChange={(e) => setChartMonths(Number(e.target.value))}
                aria-label="Chart period"
                className="rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-secondary focus:border-primary focus:outline-none"
              >
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 12 Months</option>
              </select>
            }
          >
            {isLoading ? <div className="h-60 animate-pulse rounded-xl bg-surface-warm" /> : <MonthlyChart months={months} />}
          </Card>

          <Card
            title="Recent Transactions"
            action={
              current.length > 5 && (
                <button type="button" onClick={() => setShowAll((v) => !v)} className="text-[13px] font-medium text-primary hover:underline">
                  {showAll ? 'Show less' : `View All (${current.length})`}
                </button>
              )
            }
          >
            {!isLoading && current.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                No earnings in this period. Completed cash jobs and paid invoices show up here.
              </p>
            ) : (
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full min-w-[46rem] text-left text-sm">
                  <thead className="bg-surface-warm/60 text-[13px] text-secondary">
                    <tr>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Booking ID</th>
                      <th className="px-3 py-3 font-medium">Service</th>
                      <th className="px-3 py-3 font-medium">Customer</th>
                      <th className="px-3 py-3 font-medium">Amount</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-5 py-3">
                        <span className="sr-only">Open</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((t) => (
                      <tr key={t.bookingId} className="text-secondary">
                        <td className="whitespace-nowrap px-5 py-3.5">{formatDay(t.date)}</td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-text-muted">{t.reference ? `#${t.reference}` : '—'}</td>
                        <td className="px-3 py-3.5">{t.service}</td>
                        <td className="px-3 py-3.5">{t.customer}</td>
                        <td className="whitespace-nowrap px-3 py-3.5">
                          <span className="font-medium">{formatCurrency(t.amount)}</span>
                          {t.commission > 0 && (
                            <span className="block text-[11px] text-text-muted" title="Customer paid, minus ServiGo commission">
                              {formatCurrency(t.gross)} − {formatCurrency(t.commission)} fee
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className={`inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ${STATUS[t.status].classes}`}>
                            {STATUS[t.status].label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to={`/provider/bookings?highlight=${t.bookingId}`}
                            aria-label="Open booking"
                            title="Open booking"
                            className="inline-grid h-8 w-8 place-items-center rounded-full text-text-muted hover:bg-surface-warm hover:text-secondary"
                          >
                            <FiExternalLink size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* ═══ Right column ════════════════════════════════════ */}
        <div className="min-w-0 space-y-5">
          <Card
            title="Payout Information"
            action={
              <button
                type="button"
                onClick={() => setIsEditingPayout(true)}
                disabled={!profileFetch.data}
                className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-[13px] font-medium text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <FiEdit2 /> {payout?.accountNumber ? 'Edit' : 'Add'}
              </button>
            }
          >
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-warm text-secondary">
                  <FiHome />
                </span>
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-secondary">Bank Account</p>
                  {payout?.accountNumber ? (
                    <>
                      <p className="text-text-muted">
                        {payout.bankName}
                        {payout.branch && ` – ${payout.branch}`}
                      </p>
                      <p className="text-text-muted">
                        {maskedAccount}
                        {payout.accountHolderName && ` · ${payout.accountHolderName}`}
                      </p>
                    </>
                  ) : (
                    <p className="text-text-muted">Not added yet — add it so online payments can reach you.</p>
                  )}
                </div>
              </li>
              <li className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-warm text-secondary">
                  <FiRepeat />
                </span>
                <div className="text-sm">
                  <p className="font-medium text-secondary">Payout Method</p>
                  <p className="text-text-muted">{payout?.accountNumber ? 'Bank Transfer' : 'Not set'}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-warm text-secondary">
                  <FiCalendar />
                </span>
                <div className="text-sm">
                  <p className="font-medium text-secondary">When payouts happen</p>
                  <p className="text-text-muted">Released by ServiGo per job — there's no fixed payout date.</p>
                </div>
              </li>
            </ul>

            <div className="mt-5 flex gap-3 rounded-xl bg-primary-light/60 p-4 text-[13px] leading-relaxed text-secondary">
              <FiInfo className="mt-0.5 shrink-0 text-primary" />
              <p>
                <strong className="font-medium">Cash jobs</strong> are paid to you directly by the customer.{' '}
                <strong className="font-medium">Online payments</strong> through an invoice are held by ServiGo, then
                released to your bank account minus commission.
              </p>
            </div>
          </Card>

          <Card title="Earnings Breakdown">
            {topCategories.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">No earnings in this period.</p>
            ) : (
              <>
                <p className="text-sm text-text-muted">
                  {formatCurrency(totalEarned)} across {current.length} {current.length === 1 ? 'job' : 'jobs'}
                </p>
                <ul className="mt-4 space-y-4">
                  {topCategories.map((category) => {
                    const share = totalEarned > 0 ? Math.round((category.total / totalEarned) * 100) : 0;
                    return (
                      <li key={category.name}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-medium text-secondary">{category.name}</span>
                          <span className="text-secondary">{share}%</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-warm">
                          <div className="h-full rounded-full bg-success" style={{ width: `${share}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          {formatCurrency(category.total)} · {category.jobs} {category.jobs === 1 ? 'job' : 'jobs'}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Card>
        </div>
      </div>

      {isEditingPayout && (
        <PayoutModal
          details={payout}
          onClose={() => setIsEditingPayout(false)}
          onSaved={() => {
            setIsEditingPayout(false);
            profileFetch.refetch();
          }}
        />
      )}
    </ProviderLayout>
  );
}
