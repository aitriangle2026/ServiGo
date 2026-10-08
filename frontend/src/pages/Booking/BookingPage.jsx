import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  FaChevronRight,
  FaStar,
  FaMapMarkerAlt,
  FaRegCalendarAlt,
  FaTag,
  FaCheckCircle,
  FaShieldAlt,
  FaRegClock,
  FaRegCommentDots,
  FaPlus,
  FaArrowRight,
  FaMoneyBillWave,
  FaRegCreditCard,
  FaBriefcase,
  FaLock,
  FaCheck,
} from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Spinner from '@/components/common/Spinner';
import Calendar from '@/components/common/Calendar';
import { serviceService } from '@/services/serviceService';
import { bookingService } from '@/services/bookingService';
import { userService } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import heroImage from '/images/booking-hero.webp';

const PLACEHOLDER = '/images/service-placeholder.jpg';

const ASSURANCES = [
  { icon: FaShieldAlt, title: 'Safe & Secure Booking', body: 'Your information is protected' },
  { icon: FaRegClock, title: 'Free Cancellation', body: 'Up to 2 hours before the service' },
  { icon: FaRegCommentDots, title: 'Direct Communication', body: 'Chat with the provider anytime' },
];

const STEPS = [
  { key: 'service', label: 'Service', hint: 'Selected service details' },
  { key: 'schedule', label: 'Date & Time', hint: 'Choose your schedule' },
  { key: 'location', label: 'Location', hint: 'Your address' },
  { key: 'details', label: 'Additional Details', hint: 'Tell us more' },
  { key: 'confirm', label: 'Confirm', hint: 'Review and book' },
];

const NOTES_LIMIT = 500;

const toLocalKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const formatLongDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-LK', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

// "11:00 AM" + 1h -> "12:00 PM". The estimate is best-effort: `duration` is
// free text on the Service, so anything unparseable just yields no end time
// rather than a made-up one.
const estimateEnd = (startLabel, duration) => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(startLabel || '');
  if (!match) return null;

  const hours = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  const start = new Date(2000, 0, 1, hours, Number(match[2]));

  const durationHours = Number(/(\d+(?:\.\d+)?)\s*h/i.exec(duration || '')?.[1]) || 1;
  const end = new Date(start.getTime() + durationHours * 3600000);

  return {
    label: end.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', hour12: true }),
    hours: durationHours,
  };
};

export default function BookingPage() {
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [date, setDate] = useState(() => {
    const fromUrl = searchParams.get('date');
    if (fromUrl) return fromUrl;
    // Default to tomorrow — same-day bookings need a conversation, not a
    // slot picker. Computed in the initialiser rather than an effect so no
    // state is set during commit.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toLocalKey(tomorrow);
  });
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState(searchParams.get('time') || '');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', addressLine: '', city: '' });

  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const sectionRefs = useRef({});

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setIsLoading(true);
    });

    serviceService
      .getById(serviceId)
      .then((response) => {
        if (!cancelled) setService(response?.data ?? response);
      })
      .catch(() => {
        if (!cancelled) setLoadError('We could not load this service.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  useEffect(() => {
    let cancelled = false;
    userService
      .listAddresses()
      .then((response) => {
        if (cancelled) return;
        const list = response?.data ?? [];
        setAddresses(list);
        const preferred = list.find((item) => item.isDefault) || list[0];
        if (preferred) setAddressId(preferred._id);
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!serviceId || !date) return undefined;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setIsLoadingSlots(true);
    });

    serviceService
      .getAvailability(serviceId, date)
      .then((response) => {
        if (cancelled) return;
        const next = response?.slots || [];
        setSlots(next);
        setTime((current) =>
          next.some((slot) => slot.time === current && slot.available) ? current : ''
        );
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId, date]);

  const provider = service?.provider;
  const providerName =
    `${provider?.user?.firstName || ''} ${provider?.user?.lastName || ''}`.trim() || 'the provider';
  const selectedAddress = addresses.find((item) => item._id === addressId);
  const endTime = useMemo(() => estimateEnd(time, service?.duration), [time, service]);

  // Drives the stepper: a step is done once the thing it asks for exists.
  const completion = {
    service: Boolean(service),
    schedule: Boolean(date && time),
    location: Boolean(selectedAddress),
    details: notes.trim().length > 0,
    confirm: false,
  };
  const currentStep =
    STEPS.find((step) => step.key !== 'confirm' && !completion[step.key])?.key || 'confirm';

  const canConfirm = Boolean(service && date && time && selectedAddress) && !isSubmitting;

  const handleAddAddress = async (event) => {
    event.preventDefault();
    if (!newAddress.addressLine.trim()) return;

    try {
      const response = await userService.addAddress(newAddress);
      const list = response?.data ?? [];
      setAddresses(list);
      setAddressId(list[list.length - 1]?._id || '');
      setNewAddress({ label: 'Home', addressLine: '', city: '' });
      setIsAddingAddress(false);
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Could not save that address.');
    }
  };

  const handleConfirm = async () => {
    setSubmitError('');
    if (!canConfirm) return;

    setIsSubmitting(true);
    try {
      const created = await bookingService.create({
        service: service._id || service.id,
        bookingDate: date,
        bookingTime: time,
        // Snapshotted as text — editing the saved address later must not
        // change where a provider was already told to go.
        address: [selectedAddress.addressLine, selectedAddress.city].filter(Boolean).join(', '),
        notes: notes.trim(),
        paymentMethod,
      });
      // Straight to the confirmation screen, which shows the reference and
      // what happens next. Falls back to the list if the id didn't come back.
      const newId = created?.data?._id;
      navigate(newId ? `/booking/${newId}/confirmed` : '/customer/bookings');
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Could not confirm your booking.');
      setIsSubmitting(false);
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

  if (loadError || !service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-display text-2xl font-medium text-secondary">Service unavailable</h1>
          <p className="mt-2 text-sm text-text-muted">{loadError || 'This listing may have been removed.'}</p>
          <Link
            to="/services"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-white hover:bg-primary"
          >
            Browse services
          </Link>
        </div>
      </div>
    );
  }

  const serviceImage = service.images?.[0] || service.portfolioImages?.[0] || PLACEHOLDER;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-surface-warm">
          {/* Centred band, dissolving into the page on BOTH edges. Image and
              scrims share one box so each fade is measured from the photo's
              own edge — a full-width scrim over a part-width photo left a
              hard vertical seam where the photo began. */}
          <div className="absolute inset-y-0 left-1/2 w-[82%] -translate-x-1/2">
            <img
              src={heroImage}
              alt=""
              className="h-full w-full object-cover object-[center_15%]"
            />

            {/* Left: wider and heavier, because the headline sits over it. */}
            <div className="absolute inset-0 bg-gradient-to-r from-surface-warm from-0% via-surface-warm/45 via-26% to-transparent to-58%" />

            {/* Right: a short fade, just enough to soften the edge. */}
            <div className="absolute inset-0 bg-gradient-to-l from-surface-warm from-0% to-transparent to-26%" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        {/* A minimum height keeps the photo from being squeezed into a thin
            strip that crops everyone's head off — the copy alone is short. */}
        <div className="mx-auto max-w-[90rem] px-6 pb-12 pt-5 lg:min-h-[23rem] lg:px-10">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
              <li>
                <Link to="/" className="hover:text-secondary">
                  Home
                </Link>
              </li>
              <FaChevronRight className="text-[8px]" />
              <li>
                <Link to="/services" className="hover:text-secondary">
                  Services
                </Link>
              </li>
              <FaChevronRight className="text-[8px]" />
              <li>
                <Link to={`/services/${serviceId}`} className="hover:text-secondary">
                  {service.title}
                </Link>
              </li>
              <FaChevronRight className="text-[8px]" />
              <li className="font-medium text-secondary">Booking</li>
            </ol>
          </nav>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-8">
            <div className="min-w-0 max-w-2xl">
              <p className="flex items-center gap-4 text-[10.5px] font-medium uppercase tracking-[0.22em] text-text-muted">
                Book a service
                <span className="hidden h-px w-12 bg-border sm:block" />
              </p>

              <h1 className="mt-3.5 font-display text-[2.2rem] font-medium leading-[1.06] text-secondary sm:text-[3rem]">
                You're <em className="font-normal italic text-primary">almost</em> there.
              </h1>

              <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-text-muted">
                Choose your preferred date and time, share your location, and confirm your booking
                with <span className="font-semibold text-secondary">{providerName}</span>.
              </p>
            </div>

            <div className="hidden w-[18rem] shrink-0 divide-y divide-border overflow-hidden rounded-2xl bg-surface/95 shadow-soft backdrop-blur xl:block">
              {ASSURANCES.map((item) => (
                <div key={item.title} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-light text-primary">
                    <item.icon className="text-[13px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold leading-tight text-secondary">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Body ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[90rem] px-6 pb-20 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_22rem] lg:gap-7">
          {/* Stepper */}
          <ol className="hidden lg:block">
            {STEPS.map((step, index) => {
              const isDone = completion[step.key];
              const isCurrent = currentStep === step.key;

              return (
                <li key={step.key} className="relative flex gap-3.5 pb-8 last:pb-0">
                  {/* Connector line, stopping before the last marker. */}
                  {index < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[0.9rem] top-9 h-[calc(100%-1.5rem)] w-px bg-border"
                    />
                  )}

                  <span
                    className={`relative z-10 grid h-[1.8rem] w-[1.8rem] shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                      isDone
                        ? 'bg-primary text-white'
                        : isCurrent
                          ? 'bg-secondary text-white'
                          : 'border border-border bg-surface text-text-muted'
                    }`}
                  >
                    {isDone ? <FaCheck className="text-[9px]" /> : index + 1}
                  </span>

                  <div className="min-w-0 pt-0.5">
                    <p
                      className={`text-[13px] font-semibold ${
                        isCurrent || isDone ? 'text-secondary' : 'text-text-muted'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">{step.hint}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Main form */}
          <div className="min-w-0 space-y-5">
            {/* 1 — Service */}
            <section
              ref={(node) => {
                sectionRefs.current.service = node;
              }}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <h2 className="flex items-center gap-3 text-[15px] font-semibold text-secondary">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-white">
                  1
                </span>
                Selected Service
              </h2>

              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-surface-warm p-3">
                <img
                  src={serviceImage}
                  alt={service.title}
                  onError={(event) => {
                    event.currentTarget.src = PLACEHOLDER;
                  }}
                  className="h-[4.5rem] w-[7rem] shrink-0 rounded-lg object-cover"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[1.1rem] font-medium text-secondary">
                    {service.title}
                  </h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-text-muted">
                    with <span className="font-medium text-secondary">{providerName}</span>
                    {provider?.isVerified && <FaCheckCircle className="text-[11px] text-primary" />}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <FaStar className="text-[10px] text-accent" />
                      <span className="font-semibold text-secondary">
                        {Number(service.averageRating || 0).toFixed(1)}
                      </span>
                      ({service.totalReviews || 0} reviews)
                    </span>
                    {provider?.workingArea?.city && (
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt className="text-[10px]" />
                        {provider.workingArea.city}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/services')}
                  className="shrink-0 rounded-xl border border-border bg-surface px-4 py-2.5 text-[12.5px] font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  Change Service
                </button>
              </div>
            </section>

            {/* 2 — Date & time */}
            <section
              ref={(node) => {
                sectionRefs.current.schedule = node;
              }}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-3 text-[15px] font-semibold text-secondary">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-white">
                    2
                  </span>
                  Select Date &amp; Time
                </h2>
                <p className="text-[11px] text-text-muted">
                  All times are in Sri Lanka Time (GMT +5:30)
                </p>
              </div>

              <div className="mt-4 grid gap-6 rounded-xl bg-surface-warm p-5 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
                <Calendar value={date} onChange={setDate} />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12.5px] font-medium text-secondary">
                      Available time slots{date ? ` for ${formatLongDate(date)}` : ''}
                    </p>
                    <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          provider?.isAvailable === false ? 'bg-border' : 'bg-success'
                        }`}
                      />
                      {provider?.isAvailable === false
                        ? `${providerName} is unavailable`
                        : `${providerName} is available`}
                    </span>
                  </div>

                  {isLoadingSlots ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {Array.from({ length: 10 }).map((_, index) => (
                        <div key={index} className="h-10 animate-pulse rounded-xl bg-surface" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="mt-3 text-[12.5px] text-text-muted">
                      No times could be loaded for this date.
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {slots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setTime(slot.time)}
                          aria-pressed={time === slot.time}
                          title={slot.available ? undefined : 'Already booked'}
                          className={`rounded-xl border px-3 py-2.5 text-[12.5px] font-medium transition-colors ${
                            time === slot.time
                              ? 'border-secondary bg-secondary text-white'
                              : slot.available
                                ? 'border-border bg-surface text-secondary hover:border-primary'
                                : 'cursor-not-allowed border-transparent bg-surface/50 text-text-muted line-through'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 3 — Location */}
            <section
              ref={(node) => {
                sectionRefs.current.location = node;
              }}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <h2 className="flex items-center gap-3 text-[15px] font-semibold text-secondary">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-white">
                  3
                </span>
                Service Location
              </h2>

              <div className="mt-4 space-y-2">
                {addresses.length === 0 && !isAddingAddress && (
                  <p className="text-[12.5px] text-text-muted">
                    You haven't saved an address yet. Add one so the provider knows where to go.
                  </p>
                )}

                {addresses.map((address) => {
                  const isSelected = address._id === addressId;
                  return (
                    <button
                      key={address._id}
                      type="button"
                      onClick={() => setAddressId(address._id)}
                      aria-pressed={isSelected}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                        isSelected
                          ? 'border-secondary bg-surface-warm'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                          isSelected ? 'bg-secondary text-white' : 'bg-surface-warm text-secondary'
                        }`}
                      >
                        <FaMapMarkerAlt className="text-[12px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-semibold text-secondary">
                          {address.label}
                          {address.isDefault && (
                            <span className="ml-2 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium text-primary">
                              Default
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-text-muted">
                          {[address.addressLine, address.city].filter(Boolean).join(', ')}
                        </span>
                      </span>
                      {isSelected && <FaCheckCircle className="shrink-0 text-[14px] text-primary" />}
                    </button>
                  );
                })}

                {isAddingAddress ? (
                  <form
                    onSubmit={handleAddAddress}
                    className="space-y-2.5 rounded-xl border border-border p-3.5"
                  >
                    <div className="grid gap-2.5 sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)]">
                      <input
                        value={newAddress.label}
                        onChange={(event) =>
                          setNewAddress((current) => ({ ...current, label: event.target.value }))
                        }
                        placeholder="Label"
                        aria-label="Address label"
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-secondary focus:border-primary focus:outline-none"
                      />
                      <input
                        value={newAddress.addressLine}
                        onChange={(event) =>
                          setNewAddress((current) => ({
                            ...current,
                            addressLine: event.target.value,
                          }))
                        }
                        placeholder="No. 15, Galle Road"
                        aria-label="Address line"
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-secondary focus:border-primary focus:outline-none"
                      />
                    </div>
                    <input
                      value={newAddress.city}
                      onChange={(event) =>
                        setNewAddress((current) => ({ ...current, city: event.target.value }))
                      }
                      placeholder="City"
                      aria-label="City"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-secondary focus:border-primary focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="rounded-xl bg-secondary px-4 py-2.5 text-[12.5px] font-semibold text-white hover:bg-primary"
                      >
                        Save address
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="rounded-xl border border-border px-4 py-2.5 text-[12.5px] font-semibold text-secondary hover:border-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3.5 text-[12.5px] font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    <FaPlus className="text-[10px]" />
                    Add a new address
                  </button>
                )}
              </div>
            </section>

            {/* 4 — Notes */}
            <section
              ref={(node) => {
                sectionRefs.current.details = node;
              }}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <h2 className="flex items-center gap-3 text-[15px] font-semibold text-secondary">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-white">
                  4
                </span>
                Additional Details <span className="text-[12px] font-normal text-text-muted">(Optional)</span>
              </h2>
              <p className="mt-1.5 text-[12.5px] text-text-muted">
                Add any specific information or requirements for the provider.
              </p>

              <textarea
                value={notes}
                maxLength={NOTES_LIMIT}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                aria-label="Additional details"
                placeholder="e.g. I need a new light fixture installed in the living room. Please bring the necessary tools."
                className="mt-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-[13px] text-secondary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-right text-[11px] text-text-muted">
                {notes.length}/{NOTES_LIMIT}
              </p>
            </section>
          </div>

          {/* ─── Summary ────────────────────────────────────────── */}
          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[1.25rem] font-medium text-secondary">
                  Booking Summary
                </h2>
                <Link
                  to={`/services/${serviceId}`}
                  className="text-[12px] font-medium text-primary hover:underline"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-4 flex gap-3">
                <img
                  src={serviceImage}
                  alt={service.title}
                  onError={(event) => {
                    event.currentTarget.src = PLACEHOLDER;
                  }}
                  className="h-14 w-[4.5rem] shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-tight text-secondary">
                    {service.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-text-muted">
                    with {providerName}
                    {provider?.isVerified && <FaCheckCircle className="text-[10px] text-primary" />}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[11.5px] text-text-muted">
                    <FaStar className="text-[10px] text-accent" />
                    <span className="font-semibold text-secondary">
                      {Number(service.averageRating || 0).toFixed(1)}
                    </span>
                    ({service.totalReviews || 0} reviews)
                  </p>
                </div>
              </div>

              <dl className="mt-5 space-y-3.5 border-t border-border pt-4">
                <div className="flex gap-2.5">
                  <FaRegCalendarAlt className="mt-0.5 shrink-0 text-[13px] text-text-muted" />
                  <div className="min-w-0">
                    <dt className="text-[12.5px] font-semibold text-secondary">
                      {date ? formatLongDate(date) : 'Pick a date'}
                    </dt>
                    <dd className="mt-0.5 text-[11.5px] text-text-muted">
                      {time
                        ? endTime
                          ? `${time} – ${endTime.label} · ${endTime.hours} hour${
                              endTime.hours === 1 ? '' : 's'
                            } (estimated)`
                          : time
                        : 'Pick a time'}
                    </dd>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <FaMapMarkerAlt className="mt-0.5 shrink-0 text-[13px] text-text-muted" />
                  <div className="min-w-0">
                    <dt className="text-[12.5px] font-semibold text-secondary">
                      {selectedAddress
                        ? [selectedAddress.addressLine, selectedAddress.city]
                            .filter(Boolean)
                            .join(', ')
                        : 'Choose an address'}
                    </dt>
                    <dd className="mt-0.5 text-[11.5px] text-text-muted">
                      {selectedAddress ? `At your ${selectedAddress.label.toLowerCase()}` : '—'}
                    </dd>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <FaTag className="mt-0.5 shrink-0 text-[13px] text-text-muted" />
                  <div className="min-w-0">
                    <dt className="font-display text-[1.2rem] font-medium leading-none text-secondary">
                      {formatCurrency(service.price)}
                    </dt>
                    <dd className="mt-1 text-[11px] text-text-muted">
                      Final price may vary based on your requirements
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="mt-4 flex gap-3 border-t border-border pt-4">
                <img
                  src={provider?.profileImage || PLACEHOLDER}
                  alt={providerName}
                  onError={(event) => {
                    event.currentTarget.src = PLACEHOLDER;
                  }}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-secondary">
                    {providerName}
                    {provider?.isVerified && <FaCheckCircle className="text-[10px] text-primary" />}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-text-muted">
                    {provider?.categories?.[0]?.name
                      ? `Professional ${provider.categories[0].name}`
                      : 'Service Professional'}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted">
                    {provider?.experience > 0 && (
                      <span className="flex items-center gap-1.5">
                        <FaRegClock className="text-[10px]" />
                        {provider.experience}+ years
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <FaBriefcase className="text-[10px]" />
                      {service.providerStats?.completedJobs ?? 0} jobs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-[14px] font-semibold text-secondary">Payment Method</h2>
              <p className="mt-0.5 text-[11.5px] text-text-muted">Select how you want to pay</p>

              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  aria-pressed={paymentMethod === 'cash'}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-secondary bg-surface-warm'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <FaCheckCircle
                    className={`shrink-0 text-[14px] ${
                      paymentMethod === 'cash' ? 'text-primary' : 'text-border'
                    }`}
                  />
                  <FaMoneyBillWave className="shrink-0 text-[14px] text-text-muted" />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-secondary">
                      Cash on Service
                    </span>
                    <span className="mt-0.5 block text-[11px] text-text-muted">
                      Pay directly to the provider after service completion
                    </span>
                  </span>
                </button>

                {/* Disabled rather than hidden: the schema accepts "card", but
                    no payment gateway is connected, so offering it would be a
                    promise the app can't keep. */}
                <div
                  aria-disabled
                  title="Card payments aren't available yet"
                  className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl border border-border p-3.5 opacity-50"
                >
                  <span className="h-[14px] w-[14px] shrink-0 rounded-full border border-border" />
                  <FaRegCreditCard className="shrink-0 text-[14px] text-text-muted" />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-secondary">
                      Card Payment (Coming Soon)
                    </span>
                    <span className="mt-0.5 block text-[11px] text-text-muted">
                      Pay securely online
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {submitError && (
              <p className="rounded-xl border border-danger/20 bg-danger-light p-3 text-[12.5px] text-danger">
                {submitError}
              </p>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-secondary px-5 py-4 text-[14px] font-semibold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Confirming…' : 'Confirm Booking'}
              <FaArrowRight className="text-[11px]" />
            </button>

            <p className="flex items-center justify-center gap-2 text-[11px] text-text-muted">
              <FaLock className="text-[10px]" />
              Your booking is secure and protected
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
