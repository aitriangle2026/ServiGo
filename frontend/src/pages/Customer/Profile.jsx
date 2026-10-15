import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiEdit2,
  FiCamera,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiHeart,
  FiCheck,
  FiCreditCard,
  FiBell,
  FiLock,
  FiHelpCircle,
  FiChevronRight,
  FiTrash2,
} from 'react-icons/fi';
import { FaCheckCircle } from 'react-icons/fa';
import CustomerLayout from '@/layouts/CustomerLayout';
import Modal from '@/components/common/Modal';
import { useAuth } from '@/context/AuthContext';
import useFetch from '@/hooks/useFetch';
import { bookingService } from '@/services/bookingService';
import { favoriteService } from '@/services/favoriteService';
import { userService } from '@/services/userService';
import PersonalInfoTab from './profile/PersonalInfoTab';
import AddressesTab from './profile/AddressesTab';
import PaymentTab from './profile/PaymentTab';
import PreferencesTab from './profile/PreferencesTab';
import SecurityTab from './profile/SecurityTab';
import { inputClass } from './profile/inputClass';

const TABS = [
  { key: 'personal', label: 'Personal Information' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'payment', label: 'Payment Methods' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'security', label: 'Security' },
];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // matches the server's multer limit

function CompletionRing({ percent }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="7" className="stroke-surface-warm" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className="stroke-primary transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg font-medium text-secondary">{percent}%</span>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, endSession } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'personal';

  const photoInputRef = useRef(null);
  const firstNameRef = useRef(null);
  const tabsRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [addressCount, setAddressCount] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const bookingsFetch = useFetch(() => bookingService.getMyBookings(), []);
  const favoritesFetch = useFetch(() => favoriteService.getMyFavorites(), []);
  const bookings = bookingsFetch.data?.data || [];

  useEffect(() => {
    let cancelled = false;
    userService
      .listAddresses()
      .then((response) => {
        if (!cancelled) setAddressCount((response?.data || []).length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: FiCalendar, tone: 'bg-primary-light text-primary' },
    {
      label: 'Completed',
      value: bookings.filter((b) => b.status === 'completed').length,
      icon: FiCheckSquare,
      tone: 'bg-success-light text-success',
    },
    {
      label: 'In Progress',
      value: bookings.filter((b) => b.status === 'on_the_way').length,
      icon: FiClock,
      tone: 'bg-amber-50 text-accent-hover',
    },
    {
      label: 'Favorites',
      value: (favoritesFetch.data?.data || []).length,
      icon: FiHeart,
      tone: 'bg-danger-light text-danger',
    },
  ];

  // Only steps the customer can actually complete. Payment methods aren't
  // here — there's no card gateway yet, so it could never be ticked.
  const steps = [
    { label: 'Add profile photo', done: Boolean(user?.profileImage) },
    { label: 'Add phone number', done: Boolean(user?.phone) },
    { label: 'Add an address', done: (addressCount || 0) > 0, tab: 'addresses' },
    { label: 'Set your location', done: Boolean(user?.preferredLocation?.city), tab: 'preferences' },
  ];
  const percent = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  const location = [user?.preferredLocation?.city, user?.preferredLocation?.country].filter(Boolean).join(', ');
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-LK', { month: 'short', year: 'numeric' })
    : null;

  const goToTab = (key) => {
    setSearchParams(key === 'personal' ? {} : { tab: key }, { replace: true });
    requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleEditProfile = () => {
    goToTab('personal');
    setTimeout(() => firstNameRef.current?.focus(), 350);
  };

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Photos must be 5 MB or smaller.');
      return;
    }
    setIsUploading(true);
    try {
      const { data } = await userService.uploadPhoto(file);
      updateUser(data);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not upload that photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    setDeleteError('');
    setIsDeleting(true);
    try {
      const response = await userService.deactivate(deletePassword);
      const cancelled = response?.data?.cancelledBookings || 0;
      endSession();
      toast.success(
        cancelled > 0
          ? `Account deleted. ${cancelled} open booking${cancelled === 1 ? ' was' : 's were'} cancelled.`
          : 'Your account has been deleted.'
      );
      navigate('/');
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete your account.');
      setIsDeleting(false);
    }
  };

  const quickActions = [
    { label: 'Manage Addresses', description: 'Add or edit your saved addresses', icon: FiMapPin, tab: 'addresses' },
    { label: 'Payment Methods', description: 'How you pay for bookings', icon: FiCreditCard, tab: 'payment' },
    { label: 'Notification Settings', description: 'Control what notifications you receive', icon: FiBell, to: '/customer/notifications' },
    { label: 'Account Security', description: 'Change your password', icon: FiLock, tab: 'security' },
    { label: 'Help & Support', description: 'Get help with your account', icon: FiHelpCircle, to: '/how-it-works' },
  ];

  return (
    <CustomerLayout>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ═══ Main column ════════════════════════════════════════ */}
        <div className="min-w-0 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-[2.4rem] font-medium leading-tight text-secondary sm:text-5xl">My Profile</h1>
              <p className="mt-2 text-[15px] text-text-muted">
                Manage your personal information, preferences and account settings.
              </p>
            </div>
            <button
              type="button"
              onClick={handleEditProfile}
              className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-medium text-secondary hover:border-primary hover:text-primary"
            >
              <FiEdit2 /> Edit Profile
            </button>
          </div>

          {/* ─── Identity card ─────────────────────────────────── */}
          <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="relative h-32 w-32 shrink-0 self-center sm:self-auto">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center rounded-full bg-primary-light font-display text-5xl text-primary">
                  {(user?.firstName || '?').charAt(0).toUpperCase()}
                </span>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploading}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 grid h-10 w-10 place-items-center rounded-full border-4 border-surface bg-secondary text-white transition-colors hover:bg-primary disabled:opacity-60"
              >
                {isUploading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <FiCamera size={15} />}
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="min-w-0 font-body text-2xl font-medium text-secondary">
                  {`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                </h2>
                {user?.isEmailVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-light px-3 py-1.5 text-[13px] font-medium text-success">
                    <FaCheckCircle /> Verified Account
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <ul className="space-y-2 text-sm text-secondary">
                  <li className="flex items-center gap-3">
                    <FiMail className="shrink-0 text-text-muted" />
                    <span className="truncate">{user?.email}</span>
                  </li>
                  {user?.phone && (
                    <li className="flex items-center gap-3">
                      <FiPhone className="shrink-0 text-text-muted" /> {user.phone}
                    </li>
                  )}
                  <li className="flex items-center gap-3">
                    <FiMapPin className="shrink-0 text-text-muted" />
                    {location ? (
                      <span className="capitalize">{location}</span>
                    ) : (
                      <button type="button" onClick={() => goToTab('preferences')} className="text-primary hover:underline">
                        Add your location
                      </button>
                    )}
                  </li>
                </ul>
                {memberSince && (
                  <p className="text-[13px] text-text-muted sm:text-right">
                    Member since
                    <br />
                    {memberSince}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ─── Stats ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${stat.tone}`}>
                  <stat.icon />
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-medium text-secondary">
                    {bookingsFetch.isLoading || favoritesFetch.isLoading ? '—' : stat.value}
                  </p>
                  <p className="truncate text-[13px] text-text-muted">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Tabs ──────────────────────────────────────────── */}
          <div ref={tabsRef} className="scroll-mt-24 border-b border-border">
            <div className="-mb-px flex gap-6 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => goToTab(tab.key)}
                  aria-pressed={activeTab === tab.key}
                  className={`shrink-0 border-b-2 py-3 text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-secondary font-medium text-secondary'
                      : 'border-transparent text-text-muted hover:text-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'personal' && <PersonalInfoTab firstNameRef={firstNameRef} />}
          {activeTab === 'addresses' && <AddressesTab onChange={(list) => setAddressCount(list.length)} />}
          {activeTab === 'payment' && <PaymentTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
          {activeTab === 'security' && <SecurityTab />}
        </div>

        {/* ═══ Side column ════════════════════════════════════════ */}
        <aside className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-body text-lg font-medium text-secondary">Profile Completion</h2>
            <div className="mt-4 flex items-center gap-4">
              <CompletionRing percent={percent} />
              <p className="text-sm leading-relaxed text-text-muted">
                {percent === 100
                  ? 'Your profile is complete.'
                  : 'Complete your profile so booking is quicker and results are closer to you.'}
              </p>
            </div>
            <ul className="mt-5 space-y-3">
              {steps.map((step) => (
                <li key={step.label}>
                  <button
                    type="button"
                    disabled={step.done}
                    onClick={() =>
                      step.label === 'Add profile photo'
                        ? photoInputRef.current?.click()
                        : goToTab(step.tab || 'personal')
                    }
                    className="flex w-full items-center gap-3 text-left text-sm text-secondary disabled:cursor-default enabled:hover:text-primary"
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                        step.done ? 'bg-success text-white' : 'border-2 border-border'
                      }`}
                    >
                      {step.done && <FiCheck size={13} />}
                    </span>
                    {step.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-body text-lg font-medium text-secondary">Quick Actions</h2>
            <ul className="mt-3">
              {quickActions.map((action) => {
                const body = (
                  <>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-warm text-secondary">
                      <action.icon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-secondary">{action.label}</span>
                      <span className="block truncate text-xs text-text-muted">{action.description}</span>
                    </span>
                    <FiChevronRight className="shrink-0 text-text-muted" />
                  </>
                );
                const className = 'flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-surface-warm/60';
                return (
                  <li key={action.label}>
                    {action.to ? (
                      <Link to={action.to} className={className}>
                        {body}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => goToTab(action.tab)} className={className}>
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <button
            type="button"
            onClick={() => {
              setDeletePassword('');
              setDeleteError('');
              setIsDeleteOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-danger/20 bg-danger-light/60 p-5 text-left transition-colors hover:bg-danger-light"
          >
            <FiTrash2 className="shrink-0 text-xl text-danger" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-danger">Delete Account</span>
              <span className="block text-xs text-danger/80">Close your account and sign out everywhere.</span>
            </span>
            <FiChevronRight className="shrink-0 text-danger" />
          </button>
        </aside>
      </div>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete your account?">
        <form onSubmit={handleDelete} className="space-y-4">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
            <li>You'll be signed out and won't be able to log in again.</li>
            <li>Any pending or confirmed bookings will be cancelled, and the professionals told.</li>
            <li>Past bookings and reviews stay on record for the professionals you worked with.</li>
          </ul>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-secondary">Enter your password to confirm</span>
            <input
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={inputClass}
            />
          </label>
          {deleteError && <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{deleteError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-secondary hover:bg-surface-warm"
            >
              Keep my account
            </button>
            <button
              type="submit"
              disabled={!deletePassword || isDeleting}
              className="rounded-xl bg-danger px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </form>
      </Modal>
    </CustomerLayout>
  );
}
