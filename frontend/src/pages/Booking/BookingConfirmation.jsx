import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaCheckCircle,
  FaRegFileAlt,
  FaWrench,
  FaRegCalendarAlt,
  FaRegClock,
  FaMapMarkerAlt,
  FaRegCreditCard,
  FaTag,
  FaPrint,
  FaArrowRight,
  FaStar,
  FaUserTie,
  FaBriefcase,
  FaPhoneAlt,
  FaRegCommentDots,
  FaRegUser,
  FaShieldAlt,
  FaRegBell,
  FaHeadset,
} from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import FooterSection from '@/pages/Home/sections/FooterSection';
import Spinner from '@/components/common/Spinner';
import { bookingService } from '@/services/bookingService';
import { serviceService } from '@/services/serviceService';
import { chatService } from '@/services/chatService';
import { formatCurrency } from '@/utils/formatCurrency';
import heroImage from '/images/booking-confirmed.webp';

const PLACEHOLDER = '/images/service-placeholder.jpg';

const NEXT_STEPS = (providerFirstName) => [
  {
    title: 'Provider Preparation',
    body: `${providerFirstName} will review your booking details.`,
  },
  {
    title: 'Before Arrival',
    body: `You'll get a notification when ${providerFirstName} is on the way.`,
  },
  {
    title: 'Service in Progress',
    body: `${providerFirstName} will complete the work at your location.`,
  },
  {
    title: 'Complete & Review',
    body: 'After the service, you can review and rate your experience.',
  },
];

const formatLongDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-LK', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

// "11:00 AM" + "1 hour" -> "11:00 AM – 12:00 PM (1 hour)". `duration` is free
// text on the Service, so anything unparseable just shows the start time.
const formatTimeRange = (start, duration) => {
  if (!start) return '—';

  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(start);
  if (!match) return start;

  const hours = (Number(match[1]) % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  const from = new Date(2000, 0, 1, hours, Number(match[2]));
  const span = Number(/(\d+(?:\.\d+)?)\s*h/i.exec(duration || '')?.[1]) || 1;
  const to = new Date(from.getTime() + span * 3600000);

  const label = to.toLocaleTimeString('en-LK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${start} – ${label} (${span} hour${span === 1 ? '' : 's'})`;
};

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setIsLoading(true);
    });

    bookingService
      .getById(bookingId)
      .then((response) => {
        if (cancelled) return;
        const data = response?.data ?? response;
        setBooking(data);

        // Other things this customer is likely to need, drawn from the same
        // category and excluding the one they just booked.
        const categoryId = data?.service?.category?._id || data?.service?.category;
        return serviceService
          .search({ category: categoryId || undefined, limit: 7 })
          .then((list) => {
            if (cancelled) return;
            setRelated(
              (list?.data || [])
                .filter((item) => String(item._id) !== String(data?.service?._id))
                .slice(0, 6)
            );
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setError('We could not find that booking.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const provider = booking?.provider;
  const providerName =
    `${provider?.user?.firstName || ''} ${provider?.user?.lastName || ''}`.trim() || 'Your provider';
  const providerFirst = provider?.user?.firstName || 'Your provider';

  const handleChat = async () => {
    setIsChatLoading(true);
    try {
      const response = await chatService.startConversation({
        providerId: provider?._id,
        serviceId: booking?.service?._id,
      });
      const conversationId = response?.data?._id;
      if (conversationId) navigate(`/messages/${conversationId}`);
    } catch {
      setIsChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-32">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-display text-2xl font-medium text-secondary">Booking not found</h1>
          <p className="mt-2 text-sm text-text-muted">{error || 'This booking may have been removed.'}</p>
          <Link
            to="/customer/bookings"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-white hover:bg-primary"
          >
            View my bookings
          </Link>
        </div>
      </div>
    );
  }

  const details = [
    { icon: FaRegFileAlt, label: 'Booking ID', value: `#${booking.reference || booking._id}` },
    { icon: FaWrench, label: 'Service', value: booking.service?.title || 'Service' },
    { icon: FaRegCalendarAlt, label: 'Date', value: formatLongDate(booking.bookingDate) },
    {
      icon: FaRegClock,
      label: 'Time',
      value: formatTimeRange(booking.bookingTime, booking.service?.duration),
    },
    { icon: FaMapMarkerAlt, label: 'Location', value: booking.address || 'Not provided' },
    {
      icon: FaRegCreditCard,
      label: 'Payment Method',
      value: booking.paymentMethod === 'card' ? 'Card Payment' : 'Cash on Service',
    },
    {
      icon: FaTag,
      label: 'Total Amount',
      value: formatCurrency(booking.totalPrice),
      emphasis: true,
    },
  ];

  const statusCards = [
    {
      icon: FaShieldAlt,
      title: 'Booking Confirmed',
      body: `ID: #${booking.reference || String(booking._id).slice(-8).toUpperCase()}`,
    },
    {
      icon: FaRegCalendarAlt,
      title: 'Provider Notified',
      body: `${providerFirst} has received your booking.`,
    },
    {
      icon: FaRegBell,
      title: "You'll get updates",
      body: 'We’ll notify you at each step.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-surface-warm">
          <div className="absolute inset-y-0 right-0 w-[58%]">
            <img src={heroImage} alt="" className="h-full w-full object-cover object-[center_30%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-warm from-0% via-surface-warm/40 via-22% to-transparent to-52%" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        <div className="mx-auto max-w-[90rem] px-6 pb-14 pt-10 lg:min-h-[19rem] lg:px-10">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="min-w-0 max-w-xl">
              <p className="flex items-center gap-4 text-[10.5px] font-medium uppercase tracking-[0.22em] text-text-muted">
                Booking confirmed
                <span className="hidden h-px w-12 bg-border sm:block" />
              </p>

              <h1 className="mt-3 font-display text-[2.2rem] font-medium leading-[1.06] text-secondary sm:text-[3rem]">
                You’re <em className="font-normal italic text-primary">all set!</em>
              </h1>

              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-text-muted">
                Your booking has been confirmed.{' '}
                <span className="font-semibold text-secondary">{providerName}</span> will be there
                at the scheduled time.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/customer/bookings"
                  className="inline-flex items-center gap-3 rounded-xl bg-secondary px-6 py-3.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-primary"
                >
                  View My Bookings
                  <FaArrowRight className="text-[11px]" />
                </Link>

                <button
                  type="button"
                  onClick={handleChat}
                  disabled={isChatLoading}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-surface px-6 py-3.5 text-[13.5px] font-semibold text-secondary transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
                >
                  <FaRegCommentDots className="text-[13px]" />
                  {isChatLoading ? 'Opening chat…' : 'Chat with Provider'}
                </button>
              </div>
            </div>

            <div className="hidden w-[18.5rem] shrink-0 divide-y divide-border overflow-hidden rounded-2xl bg-surface/95 shadow-soft backdrop-blur xl:block">
              {statusCards.map((card) => (
                <div key={card.title} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-light text-primary">
                    <card.icon className="text-[13px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold leading-tight text-secondary">
                      {card.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-text-muted">{card.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Body ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[90rem] px-6 pb-16 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {/* Booking details */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-3 font-display text-[1.3rem] font-medium text-secondary">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-white">
                  <FaCheckCircle className="text-[13px]" />
                </span>
                Booking Details
              </h2>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex shrink-0 items-center gap-2 text-[12px] font-medium text-text-muted transition-colors hover:text-secondary"
              >
                <FaPrint className="text-[11px]" />
                Print
              </button>
            </div>

            <dl className="mt-5">
              {details.map((row, index) => (
                <div key={row.label} className="relative flex gap-3.5 pb-5 last:pb-0">
                  {/* Timeline rail, stopping before the last row. */}
                  {index < details.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[1.1rem] top-9 h-[calc(100%-1.25rem)] w-px bg-border"
                    />
                  )}

                  <span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-warm text-text-muted">
                    <row.icon className="text-[12px]" />
                  </span>

                  <div className="min-w-0 flex-1 border-b border-border pb-4 last:border-0">
                    <dt className="text-[12px] text-text-muted">{row.label}</dt>
                    <dd
                      className={`mt-0.5 break-words ${
                        row.emphasis
                          ? 'font-display text-[1.15rem] font-medium text-secondary'
                          : 'text-[13px] font-medium text-secondary'
                      }`}
                    >
                      {row.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Provider */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-[1.3rem] font-medium text-secondary">
                Service Provider
              </h2>
              <Link
                to={`/providers/${provider?._id}`}
                className="flex shrink-0 items-center gap-2 text-[12px] font-medium text-text-muted transition-colors hover:text-secondary"
              >
                View Profile
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-4">
              <img
                src={provider?.profileImage || PLACEHOLDER}
                alt={providerName}
                onError={(event) => {
                  event.currentTarget.src = PLACEHOLDER;
                }}
                className="h-[6.5rem] w-[6.5rem] shrink-0 rounded-2xl object-cover"
              />

              <div className="min-w-0 flex-1">
                {provider?.isVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-2.5 py-1 text-[10.5px] font-semibold text-success">
                    <FaCheckCircle className="text-[9px]" />
                    Verified Professional
                  </span>
                )}

                <p className="mt-2 font-display text-[1.3rem] font-medium leading-tight text-secondary">
                  {providerName}
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-[12.5px]">
                  <FaStar className="text-[12px] text-accent" />
                  <span className="font-semibold text-secondary">
                    {Number(provider?.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="text-text-muted">({provider?.totalReviews || 0} reviews)</span>
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-[12.5px] text-text-muted">
              {provider?.categories?.[0]?.name && (
                <li className="flex items-center gap-2.5">
                  <FaUserTie className="shrink-0 text-[12px]" />
                  {provider.categories[0].name}
                </li>
              )}
              {provider?.experience > 0 && (
                <li className="flex items-center gap-2.5">
                  <FaRegClock className="shrink-0 text-[12px]" />
                  {provider.experience}+ years experience
                </li>
              )}
              {provider?.workingArea?.city && (
                <li className="flex items-center gap-2.5">
                  <FaMapMarkerAlt className="shrink-0 text-[12px]" />
                  {provider.workingArea.city}
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <FaBriefcase className="shrink-0 text-[12px]" />
                {booking.providerStats?.completedJobs ?? 0} completed jobs
              </li>
            </ul>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5">
              <a
                href={provider?.user?.phone ? `tel:${provider.user.phone}` : undefined}
                aria-disabled={!provider?.user?.phone}
                title={provider?.user?.phone ? undefined : 'No phone number on file'}
                className={`flex flex-col items-center gap-2 rounded-xl py-3 text-[11.5px] font-medium transition-colors ${
                  provider?.user?.phone
                    ? 'text-secondary hover:bg-surface-warm'
                    : 'cursor-not-allowed text-text-muted opacity-50'
                }`}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full border border-border">
                  <FaPhoneAlt className="text-[12px]" />
                </span>
                Call
              </a>

              <button
                type="button"
                onClick={handleChat}
                disabled={isChatLoading}
                className="flex flex-col items-center gap-2 rounded-xl py-3 text-[11.5px] font-medium text-secondary transition-colors hover:bg-surface-warm disabled:opacity-60"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full border border-border">
                  <FaRegCommentDots className="text-[12px]" />
                </span>
                Chat
              </button>

              <Link
                to={`/providers/${provider?._id}`}
                className="flex flex-col items-center gap-2 rounded-xl py-3 text-[11.5px] font-medium text-secondary transition-colors hover:bg-surface-warm"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full border border-border">
                  <FaRegUser className="text-[12px]" />
                </span>
                View Profile
              </Link>
            </div>
          </div>

          {/* What happens next */}
          <div className="space-y-4 lg:col-span-2 xl:col-span-1">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-display text-[1.3rem] font-medium text-secondary">
                What happens next?
              </h2>

              <ol className="mt-5">
                {NEXT_STEPS(providerFirst).map((step, index, all) => (
                  <li key={step.title} className="relative flex gap-3.5 pb-5 last:pb-0">
                    {index < all.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-[0.95rem] top-9 h-[calc(100%-1.25rem)] w-px bg-border"
                      />
                    )}

                    <span
                      className={`relative z-10 grid h-[1.9rem] w-[1.9rem] shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                        index === 0 ? 'bg-secondary text-white' : 'bg-primary/70 text-white'
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-secondary">{step.title}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-warm text-secondary">
                  <FaHeadset className="text-[14px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-secondary">
                    Need help with this booking?
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-text-muted">
                    Our support team is here for you.
                  </p>
                </div>
              </div>

              <Link
                to="/contact"
                className="shrink-0 rounded-xl border border-border px-4 py-2.5 text-[12.5px] font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Related ────────────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-[1.5rem] font-medium text-secondary">
                You might also need
              </h2>
              <Link
                to="/services"
                className="flex shrink-0 items-center gap-2 text-[12.5px] font-medium text-text-muted transition-colors hover:text-secondary"
              >
                View all services
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {related.map((item) => (
                <article
                  key={item._id}
                  onClick={() => navigate(`/services/${item._id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') navigate(`/services/${item._id}`);
                  }}
                  role="button"
                  tabIndex={0}
                  className="group min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-soft"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={item.images?.[0] || item.portfolioImages?.[0] || PLACEHOLDER}
                      alt={item.title}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = PLACEHOLDER;
                      }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-3.5">
                    <h3 className="truncate text-[12.5px] font-semibold text-secondary">
                      {item.title}
                    </h3>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-[11.5px] text-text-muted">
                        From{' '}
                        <span className="text-[12.5px] font-bold text-secondary">
                          {formatCurrency(item.price)}
                        </span>
                      </p>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-secondary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                        <FaArrowRight className="text-[9px]" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <FooterSection />
    </div>
  );
}
