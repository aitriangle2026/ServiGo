import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaStar,
  FaMapMarkerAlt,
  FaRegClock,
  FaChevronRight,
  FaChevronLeft,
  FaShieldAlt,
  FaBolt,
  FaRegCheckCircle,
  FaCertificate,
  FaHome,
  FaArrowRight,
  FaCheckCircle,
  FaTools,
  FaCog,
  FaWrench,
  FaSyncAlt,
  FaBriefcase,
} from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import FooterSection from '@/pages/Home/sections/FooterSection';
import Spinner from '@/components/common/Spinner';
import BookingForm from '@/components/forms/BookingForm';
import CustomRequestForm from '@/components/forms/CustomRequestForm';
import ServiceGallery from './sections/ServiceGallery';
import BookingPanel from './sections/BookingPanel';

import { serviceService } from '@/services/serviceService';
import { reviewService } from '@/services/reviewService';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';

// Platform-level promises — these apply to every listing, so they're UI
// copy rather than per-service data.
const GUARANTEES = [
  { icon: FaBolt, label: 'Safe & Reliable' },
  { icon: FaShieldAlt, label: 'Certified Professionals' },
  { icon: FaRegClock, label: 'On-time Service' },
  { icon: FaCertificate, label: 'Quality Workmanship' },
];

const INCLUSION_ICONS = [FaTools, FaCog, FaWrench, FaSyncAlt];

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'included', label: "What's Included" },
  { key: 'pricing', label: 'Pricing' },
  { key: 'provider', label: 'Provider' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'faqs', label: 'FAQs' },
];

const relativeTime = (value) => {
  if (!value) return '';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days < 1) return 'today';
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
};

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [bookingDraft, setBookingDraft] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const sectionRefs = useRef({});
  const workScrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    // Queued off the commit path: setIsLoading during commit cascades an
    // extra render before the request has even started.
    queueMicrotask(() => {
      if (!cancelled) setIsLoading(true);
    });

    serviceService
      .getById(id)
      .then((response) => {
        if (cancelled) return;
        setService(response?.data ?? response);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError('We could not load this service.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    reviewService
      .getByService(id)
      .then((response) => {
        if (!cancelled) setReviews(response?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const provider = service?.provider;
  const providerUser = provider?.user;
  const providerName =
    `${providerUser?.firstName || ''} ${providerUser?.lastName || ''}`.trim() || 'ServiGo Pro';

  const gallery = useMemo(() => {
    const images = [...(service?.images || []), ...(service?.portfolioImages || [])];
    return images.filter(Boolean);
  }, [service]);

  const serviceAreas = useMemo(() => {
    const areas = [...(service?.serviceAreas || [])];
    const home = provider?.workingArea?.city;
    if (home && !areas.includes(home)) areas.unshift(home);
    return areas;
  }, [service, provider]);

  const goToSection = (key) => {
    setActiveTab(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setChatError('');
    setIsChatLoading(true);
    try {
      const response = await chatService.startConversation({
        providerId: provider?._id,
        serviceId: service?._id,
      });
      const conversationId = response?.data?._id;
      if (conversationId) navigate(`/messages/${conversationId}`);
      else setChatError('Could not open the chat. Please try again.');
    } catch (err) {
      setChatError(err?.response?.data?.message || 'Could not open the chat.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleBook = (details) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // One-time: hand off to the full booking page, which collects the
    // address, notes and payment method. Custom: there's no price to book
    // against yet, so it opens a conversation and the provider quotes via
    // the invoice flow.
    if (details.mode === 'custom') {
      setBookingDraft(details);
      return;
    }

    const params = new URLSearchParams({ date: details.date, time: details.time });
    navigate(`/book/${service._id || service.id}?${params.toString()}`);
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

  if (error || !service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-display text-2xl font-medium text-secondary">Service not found</h1>
          <p className="mt-2 text-sm text-text-muted">{error || 'This listing may have been removed.'}</p>
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

  const rating = Number(service.averageRating || 0);
  const reviewCount = Number(service.totalReviews || reviews.length || 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ─── Breadcrumb ───────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-6 pt-5 lg:px-10">
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
          {service.category?.name && (
            <>
              <FaChevronRight className="text-[8px]" />
              <li>
                <Link
                  to={`/services?q=${encodeURIComponent(service.category.name)}`}
                  className="hover:text-secondary"
                >
                  {service.category.name}
                </Link>
              </li>
            </>
          )}
          <FaChevronRight className="text-[8px]" />
          <li className="font-medium text-secondary">{service.title}</li>
        </ol>
      </nav>

      {/* ─── Head: gallery / summary / booking ────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pt-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_21rem] lg:gap-7">
          <ServiceGallery images={gallery} title={service.title} />

          <div className="min-w-0">
            {service.category?.name && (
              <p className="flex items-center gap-3 text-[10.5px] font-medium uppercase tracking-[0.2em] text-text-muted">
                {service.category.name}
                <span className="hidden h-px w-10 bg-border sm:block" />
              </p>
            )}

            <h1 className="mt-3 font-display text-[2rem] font-medium leading-[1.08] text-secondary sm:text-[2.6rem]">
              {service.title}
            </h1>

            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-[13px]">
                <FaStar className="text-[13px] text-accent" />
                <span className="font-semibold text-secondary">{rating.toFixed(1)}</span>
                <span className="text-text-muted">({reviewCount} reviews)</span>
              </span>

              {provider?.isVerified && (
                <span className="flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-1 text-[11.5px] font-semibold text-primary">
                  <FaShieldAlt className="text-[10px]" />
                  Verified Service
                </span>
              )}
            </div>

            <p className="mt-4 text-[14px] leading-relaxed text-text-muted">
              {service.description}
            </p>

            <div className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {GUARANTEES.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-secondary">
                    <item.icon className="text-[12px]" />
                  </span>
                  <span className="text-[12.5px] text-secondary">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 border-t border-border pt-5">
              <span className="flex items-center gap-2 text-[12px] text-text-muted">
                <FaHome className="text-[12px]" />
                Homes &amp; Offices
              </span>
              {service.duration && (
                <span className="flex items-center gap-2 text-[12px] text-text-muted">
                  <FaRegClock className="text-[12px]" />
                  Usually completes in {service.duration}
                </span>
              )}
              {provider?.workingArea?.city && (
                <span className="flex items-center gap-2 text-[12px] text-text-muted">
                  <FaMapMarkerAlt className="text-[12px]" />
                  Available in {provider.workingArea.city} &amp; nearby areas
                </span>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <BookingPanel
              service={service}
              onBook={handleBook}
              onChat={handleChat}
              isChatLoading={isChatLoading}
            />
            {chatError && (
              <p className="mt-2 text-center text-[12px] text-danger">{chatError}</p>
            )}
          </div>
        </div>
      </section>

      {/* ─── Tabs ─────────────────────────────────────────────────── */}
      <div className="sticky top-20 z-20 mt-10 border-y border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl overflow-x-auto px-6 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-7">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => goToSection(tab.key)}
                aria-pressed={activeTab === tab.key}
                className={`relative shrink-0 py-4 text-[13px] transition-colors ${
                  activeTab === tab.key
                    ? 'font-semibold text-secondary'
                    : 'font-medium text-text-muted hover:text-secondary'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-secondary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Body ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_19rem] lg:gap-7">
          {/* Left column */}
          <div className="min-w-0 space-y-10">
            <div
              ref={(node) => {
                sectionRefs.current.overview = node;
              }}
              className="scroll-mt-36"
            >
              <h2 className="font-display text-[1.6rem] font-medium text-secondary">
                Service Overview
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-text-muted">
                {service.workDetails || service.description}
              </p>
            </div>

            <div
              ref={(node) => {
                sectionRefs.current.included = node;
              }}
              className="scroll-mt-36"
            >
              {service.inclusions?.length > 0 ? (
                <div className="grid gap-3 rounded-2xl bg-surface-warm p-4 sm:grid-cols-2">
                  {service.inclusions.map((item, index) => {
                    const Icon = INCLUSION_ICONS[index % INCLUSION_ICONS.length];
                    return (
                      <div key={item.title || index} className="flex gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-secondary">
                          <Icon className="text-[13px]" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-secondary">{item.title}</p>
                          <p className="mt-0.5 text-[11.5px] leading-relaxed text-text-muted">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-surface-warm p-5">
                  <h3 className="text-[14px] font-semibold text-secondary">What's included</h3>
                  <p className="mt-1.5 text-[12.5px] text-text-muted">
                    This provider hasn't listed what's included yet — message them and they'll
                    confirm the details.
                  </p>
                </div>
              )}
            </div>

            {service.portfolioImages?.length > 0 && (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-[1.4rem] font-medium text-secondary">
                    Recent Work
                  </h2>
                  <div className="flex gap-2">
                    {[
                      { dir: -1, icon: FaChevronLeft, label: 'Scroll left' },
                      { dir: 1, icon: FaChevronRight, label: 'Scroll right' },
                    ].map((control) => (
                      <button
                        key={control.label}
                        type="button"
                        aria-label={control.label}
                        onClick={() =>
                          workScrollRef.current?.scrollBy({
                            left: control.dir * 240,
                            behavior: 'smooth',
                          })
                        }
                        className="grid h-8 w-8 place-items-center rounded-full border border-border text-secondary transition-colors hover:border-primary hover:text-primary"
                      >
                        <control.icon className="text-[10px]" />
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  ref={workScrollRef}
                  className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {service.portfolioImages.map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={`Previous work ${index + 1}`}
                      loading="lazy"
                      className="h-28 w-40 shrink-0 rounded-xl object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            <div
              ref={(node) => {
                sectionRefs.current.pricing = node;
              }}
              className="scroll-mt-36 rounded-2xl border border-border bg-surface p-5"
            >
              <h2 className="font-display text-[1.4rem] font-medium text-secondary">Pricing</h2>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-[1.6rem] font-medium text-secondary">
                  {formatCurrency(service.price)}
                </span>
                <span className="text-[12.5px] text-text-muted">
                  {service.priceType === 'hourly' ? 'per hour' : 'fixed price'}
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-text-muted">
                This is the starting price. The final amount is confirmed with the provider once
                they understand the job — anything extra is agreed in advance through chat.
              </p>
            </div>

            <div
              ref={(node) => {
                sectionRefs.current.faqs = node;
              }}
              className="scroll-mt-36"
            >
              <h2 className="font-display text-[1.4rem] font-medium text-secondary">FAQs</h2>
              {service.faqs?.length > 0 ? (
                <div className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                  {service.faqs.map((faq, index) => (
                    <details key={faq.question || index} className="group p-4">
                      <summary className="flex cursor-pointer items-center justify-between gap-3 text-[13px] font-semibold text-secondary">
                        {faq.question}
                        <FaChevronRight className="shrink-0 text-[10px] text-text-muted transition-transform group-open:rotate-90" />
                      </summary>
                      <p className="mt-2.5 text-[12.5px] leading-relaxed text-text-muted">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[12.5px] text-text-muted">
                  No questions answered yet. Use “Chat with Provider” and they'll reply directly.
                </p>
              )}
            </div>
          </div>

          {/* Middle column */}
          <div className="min-w-0 space-y-8">
            <div
              ref={(node) => {
                sectionRefs.current.provider = node;
              }}
              className="scroll-mt-36"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[1.4rem] font-medium text-secondary">
                  About the Provider
                </h2>
                <button
                  type="button"
                  onClick={() => navigate(`/providers/${provider?._id}`)}
                  className="flex shrink-0 items-center gap-2 text-[12.5px] font-medium text-text-muted hover:text-secondary"
                >
                  View Profile
                  <FaArrowRight className="text-[10px]" />
                </button>
              </div>

              {/* Stacked rather than two columns: this sits in the page's
                  middle column, which is ~390px wide, and a content-sized
                  trust list beside it squeezed the profile to ~200px —
                  every line wrapped and the Verified badge was clipped. */}
              <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
                <div className="flex gap-3.5">
                  <img
                    src={provider?.profileImage || '/images/service-placeholder.jpg'}
                    alt={providerName}
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    {/* flex-wrap so a long name pushes the badge onto the next
                        line instead of overflowing the card. */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-[14.5px] font-semibold leading-tight text-secondary">
                        {providerName}
                      </p>
                      {provider?.isVerified && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold text-success">
                          <FaCheckCircle className="text-[9px]" />
                          Verified
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[12px]">
                      <FaStar className="text-[11px] text-accent" />
                      <span className="font-semibold text-secondary">{rating.toFixed(1)}</span>
                      <span className="whitespace-nowrap text-text-muted">
                        ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                      </span>
                      <span className="text-text-muted">·</span>
                      <span className="text-text-muted">
                        {provider?.categories?.[0]?.name ||
                          service.category?.name ||
                          'Professional'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Stats as a wrapping row — as a narrow vertical list each
                    one broke onto two lines. */}
                <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2.5 border-t border-border pt-4 text-[12px] text-text-muted">
                  {provider?.experience > 0 && (
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <FaRegClock className="shrink-0 text-[11px]" />
                      {provider.experience}+ years experience
                    </div>
                  )}
                  {provider?.workingArea?.city && (
                    <div className="flex items-center gap-1.5">
                      <FaMapMarkerAlt className="shrink-0 text-[11px]" />
                      {provider.workingArea.city}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <FaBriefcase className="shrink-0 text-[11px]" />
                    {service.providerStats?.completedJobs ?? 0} completed jobs
                  </div>
                </dl>

                <ul className="mt-4 grid gap-x-4 gap-y-2 rounded-xl bg-surface-warm p-4 text-[12px] text-text-muted sm:grid-cols-2">
                  {[
                    provider?.isVerified && 'Certified professional',
                    provider?.isVerified && 'Background checked',
                    'Quality workmanship',
                    'On-time service',
                    'Friendly and reliable',
                  ]
                    .filter(Boolean)
                    .map((point) => (
                      <li key={point} className="flex items-center gap-2">
                        <FaRegCheckCircle className="shrink-0 text-[11px] text-primary" />
                        {point}
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            <div
              ref={(node) => {
                sectionRefs.current.reviews = node;
              }}
              className="scroll-mt-36"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[1.4rem] font-medium text-secondary">
                  Customer Reviews
                </h2>
                {reviews.length > 3 && (
                  <button
                    type="button"
                    onClick={() => navigate(`/providers/${provider?._id}`)}
                    className="flex shrink-0 items-center gap-2 text-[12.5px] font-medium text-text-muted hover:text-secondary"
                  >
                    View all
                    <FaArrowRight className="text-[10px]" />
                  </button>
                )}
              </div>

              {reviews.length === 0 ? (
                <p className="mt-3 text-[12.5px] text-text-muted">
                  No reviews yet — be the first to book and leave one.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {reviews.slice(0, 3).map((review) => (
                    <article
                      key={review._id}
                      className="rounded-2xl border border-border bg-surface p-4"
                    >
                      <div className="flex gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-light text-[13px] font-semibold text-primary">
                          {(review.customer?.firstName || '?').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-secondary">
                            {`${review.customer?.firstName || ''} ${review.customer?.lastName || ''}`.trim() ||
                              'ServiGo customer'}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <FaStar
                                  key={index}
                                  className={`text-[10px] ${
                                    index < Math.round(review.rating)
                                      ? 'text-accent'
                                      : 'text-border'
                                  }`}
                                />
                              ))}
                            </span>
                            <span className="text-[11px] text-text-muted">
                              {relativeTime(review.createdAt)}
                            </span>
                          </div>
                          {review.review && (
                            <p className="mt-2 text-[12.5px] leading-relaxed text-text-muted">
                              “{review.review}”
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <aside className="space-y-5">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-display text-[1.25rem] font-medium text-secondary">
                Service Location
              </h2>

              <p className="mt-4 flex items-start gap-2 text-[12.5px]">
                <FaMapMarkerAlt className="mt-0.5 shrink-0 text-[12px] text-primary" />
                <span>
                  <span className="font-semibold text-secondary">
                    {provider?.workingArea?.city || 'Sri Lanka'}
                    {provider?.workingArea?.country ? `, ${provider.workingArea.country}` : ''}
                  </span>
                  <br />
                  <span className="text-text-muted">
                    Available within {provider?.workingArea?.radius ?? 10} km
                  </span>
                </span>
              </p>

              {serviceAreas.length > 0 && (
                <>
                  <h3 className="mt-5 text-[12.5px] font-semibold text-secondary">Service Area</h3>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {serviceAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full border border-border px-3 py-1.5 text-[11.5px] text-text-muted"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11px] text-text-muted">and nearby areas</p>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>

      <FooterSection />

      {bookingDraft?.mode === 'custom' && (
        <CustomRequestForm
          service={service}
          initialDate={bookingDraft.date}
          initialTime={bookingDraft.time}
          onClose={() => setBookingDraft(null)}
        />
      )}

      {bookingDraft && bookingDraft.mode !== 'custom' && (
        <BookingForm
          service={service}
          initialDate={bookingDraft.date}
          initialTime={bookingDraft.time}
          onClose={() => setBookingDraft(null)}
          onSuccess={() => {
            setBookingDraft(null);
            navigate('/customer/bookings');
          }}
        />
      )}
    </div>
  );
}
