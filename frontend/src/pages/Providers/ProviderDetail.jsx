import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaStar,
  FaMapMarkerAlt,
  FaArrowRight,
  FaRegCheckCircle,
  FaChevronRight,
  FaChevronLeft,
  FaRegPlayCircle,
} from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import FooterSection from '@/pages/Home/sections/FooterSection';
import Spinner from '@/components/common/Spinner';
import BookingForm from '@/components/forms/BookingForm';
import CustomRequestForm from '@/components/forms/CustomRequestForm';
import ProviderHero from './sections/ProviderHero';
import ProviderBookingPanel from './sections/ProviderBookingPanel';

import { providerService } from '@/services/providerService';
import { reviewService } from '@/services/reviewService';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';

const PLACEHOLDER = '/images/service-placeholder.jpg';

// Platform-level assurances — true of every verified provider, so copy
// rather than per-profile data. The two verification-dependent ones drop out
// when the provider isn't verified.
const trustPoints = (provider) =>
  [
    provider?.isVerified && 'Certified Professional',
    provider?.isVerified && 'Background Checked',
    'Quality Workmanship',
    'On-time Service',
    'Service Warranty',
    'Friendly & Professional',
  ].filter(Boolean);

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'services', label: 'Services' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'photos', label: 'Photos' },
  { key: 'location', label: 'Location' },
  { key: 'faqs', label: 'FAQs' },
];

const relativeTime = (value) => {
  if (!value) return '';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days < 1) return 'today';
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`;
  return `${Math.floor(days / 30)} month${days < 60 ? '' : 's'} ago`;
};

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [bookingDraft, setBookingDraft] = useState(null);
  const [quoteDraft, setQuoteDraft] = useState(null);
  const [reviewIndex, setReviewIndex] = useState(0);

  const sectionRefs = useRef({});

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setIsLoading(true);
    });

    providerService
      .getById(id)
      .then((response) => {
        if (cancelled) return;
        setProvider(response?.data ?? response);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError('We could not load this profile.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    reviewService
      .getByProvider(id)
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

  const name =
    `${provider?.user?.firstName || ''} ${provider?.user?.lastName || ''}`.trim() || 'ServiGo Pro';
  const role = provider?.categories?.[0]?.name
    ? `Professional ${provider.categories[0].name}`
    : 'Service Professional';

  const services = provider?.services || [];
  const photos = provider?.portfolioImages || [];

  const areas = useMemo(() => {
    const list = [...(provider?.serviceAreas || [])];
    const home = provider?.workingArea?.city;
    if (home && !list.includes(home)) list.unshift(home);
    return list;
  }, [provider]);

  const goToSection = (key) => {
    setActiveTab(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const requireAuth = (action) => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    action();
    return true;
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

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-display text-2xl font-medium text-secondary">Profile not found</h1>
          <p className="mt-2 text-sm text-text-muted">{error || 'This profile may have been removed.'}</p>
          <Link
            to="/find-pros"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-white hover:bg-primary"
          >
            Find professionals
          </Link>
        </div>
      </div>
    );
  }

  const rating = Number(provider.averageRating || 0);
  const reviewCount = Number(provider.totalReviews || reviews.length || 0);
  const distribution = provider.ratingDistribution || [];
  const activeReview = reviews[reviewIndex];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <ProviderHero provider={provider} name={name} role={role} />

      {/* ─── Tabs ─────────────────────────────────────────────────── */}
      <div className="sticky top-20 z-20 border-y border-border bg-background/95 backdrop-blur">
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

      <section className="mx-auto max-w-7xl px-6 py-9 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-7">
          <div className="min-w-0 space-y-10">
            {/* ─── About ──────────────────────────────────────────── */}
            <div
              ref={(node) => {
                sectionRefs.current.overview = node;
              }}
              className="scroll-mt-36 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]"
            >
              <div className="rounded-2xl bg-surface-warm p-6">
                <h2 className="font-display text-[1.5rem] font-medium text-secondary">
                  About {provider.user?.firstName || name}
                </h2>
                <p className="mt-3 text-[13.5px] leading-relaxed text-text-muted">
                  {provider.bio || 'This provider hasn’t written an introduction yet.'}
                </p>

                <ul className="mt-6 grid gap-x-5 gap-y-3 sm:grid-cols-2">
                  {trustPoints(provider).map((point) => (
                    <li key={point} className="flex items-center gap-2.5 text-[12.5px] text-secondary">
                      <FaRegCheckCircle className="shrink-0 text-[13px] text-primary" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {provider.introVideoUrl ? (
                <a
                  href={provider.introVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl bg-surface-warm"
                >
                  <img
                    src={provider.profileImage || PLACEHOLDER}
                    alt=""
                    className="h-full min-h-[14rem] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-secondary/25">
                    <span className="flex flex-col items-center gap-2 text-white">
                      <FaRegPlayCircle className="text-4xl" />
                      <span className="text-[12px] font-semibold">Watch Intro</span>
                    </span>
                  </span>
                </a>
              ) : (
                photos[0] && (
                  <div className="overflow-hidden rounded-2xl">
                    <img
                      src={photos[0]}
                      alt={`Work by ${name}`}
                      className="h-full min-h-[14rem] w-full object-cover"
                    />
                  </div>
                )
              )}
            </div>

            {/* ─── Services ───────────────────────────────────────── */}
            <div
              ref={(node) => {
                sectionRefs.current.services = node;
              }}
              className="scroll-mt-36"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[1.5rem] font-medium text-secondary">
                  Services Offered
                </h2>
                {services.length > 0 && (
                  <Link
                    to={`/services?q=${encodeURIComponent(name)}`}
                    className="flex shrink-0 items-center gap-2 text-[12.5px] font-medium text-text-muted hover:text-secondary"
                  >
                    View all services
                    <FaArrowRight className="text-[10px]" />
                  </Link>
                )}
              </div>

              {services.length === 0 ? (
                <p className="mt-3 text-[13px] text-text-muted">
                  No published services yet — use “Request a Quote” to describe what you need.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {services.map((item) => (
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

                      <div className="p-4">
                        <h3 className="text-[13.5px] font-semibold text-secondary">{item.title}</h3>
                        <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-text-muted">
                          {item.description}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <p className="text-[12px] text-text-muted">
                            From{' '}
                            <span className="text-[13px] font-bold text-secondary">
                              {formatCurrency(item.price)}
                            </span>
                          </p>
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-secondary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                            <FaArrowRight className="text-[10px]" />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* ─── Reviews ────────────────────────────────────────── */}
            <div
              ref={(node) => {
                sectionRefs.current.reviews = node;
              }}
              className="scroll-mt-36"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[1.5rem] font-medium text-secondary">
                  Customer Reviews
                </h2>
              </div>

              {reviewCount === 0 ? (
                <p className="mt-3 text-[13px] text-text-muted">
                  No reviews yet — be the first to book and leave one.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-border bg-surface p-5">
                    <p className="font-display text-[3rem] font-medium leading-none text-secondary">
                      {rating.toFixed(1)}
                    </p>
                    <span className="mt-2 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <FaStar
                          key={index}
                          className={`text-[13px] ${
                            index < Math.round(rating) ? 'text-accent' : 'text-border'
                          }`}
                        />
                      ))}
                    </span>
                    <p className="mt-1.5 text-[11.5px] text-text-muted">
                      Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                    </p>

                    <dl className="mt-4 space-y-1.5">
                      {distribution.map((row) => (
                        <div key={row.stars} className="flex items-center gap-2.5">
                          <dt className="w-12 shrink-0 text-[11px] text-text-muted">
                            {row.stars} star{row.stars === 1 ? '' : 's'}
                          </dt>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-warm">
                            <div
                              className="h-full rounded-full bg-secondary"
                              style={{ width: `${row.percent}%` }}
                            />
                          </div>
                          <dd className="w-8 shrink-0 text-right text-[11px] text-text-muted">
                            {row.percent}%
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {activeReview && (
                    <div className="relative rounded-2xl border border-border bg-surface p-5">
                      <div className="flex gap-3.5">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-light text-[14px] font-semibold text-primary">
                          {(activeReview.customer?.firstName || '?').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold text-secondary">
                            {`${activeReview.customer?.firstName || ''} ${activeReview.customer?.lastName || ''}`.trim() ||
                              'ServiGo customer'}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <FaStar
                                  key={index}
                                  className={`text-[10px] ${
                                    index < Math.round(activeReview.rating)
                                      ? 'text-accent'
                                      : 'text-border'
                                  }`}
                                />
                              ))}
                            </span>
                            <span className="text-[11px] text-text-muted">
                              {relativeTime(activeReview.createdAt)}
                            </span>
                          </div>
                          {activeReview.review && (
                            <p className="mt-2.5 text-[12.5px] leading-relaxed text-text-muted">
                              “{activeReview.review}”
                            </p>
                          )}
                        </div>
                      </div>

                      {reviews.length > 1 && (
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <span className="mr-auto text-[11px] text-text-muted">
                            {reviewIndex + 1} of {reviews.length}
                          </span>
                          {[
                            { dir: -1, icon: FaChevronLeft, label: 'Previous review' },
                            { dir: 1, icon: FaChevronRight, label: 'Next review' },
                          ].map((control) => (
                            <button
                              key={control.label}
                              type="button"
                              aria-label={control.label}
                              onClick={() =>
                                setReviewIndex(
                                  (current) =>
                                    (current + control.dir + reviews.length) % reviews.length
                                )
                              }
                              className="grid h-8 w-8 place-items-center rounded-full border border-border text-secondary transition-colors hover:border-primary hover:text-primary"
                            >
                              <control.icon className="text-[10px]" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Photos ─────────────────────────────────────────── */}
            <div
              ref={(node) => {
                sectionRefs.current.photos = node;
              }}
              className="scroll-mt-36"
            >
              <h2 className="font-display text-[1.5rem] font-medium text-secondary">Photos</h2>
              {photos.length === 0 ? (
                <p className="mt-3 text-[13px] text-text-muted">
                  This provider hasn’t uploaded any work photos yet.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {photos.map((photo, index) => (
                    <img
                      key={`${photo}-${index}`}
                      src={photo}
                      alt={`Work by ${name} ${index + 1}`}
                      loading="lazy"
                      className="aspect-[4/3] w-full rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ─── FAQs ───────────────────────────────────────────── */}
            <div
              ref={(node) => {
                sectionRefs.current.faqs = node;
              }}
              className="scroll-mt-36"
            >
              <h2 className="font-display text-[1.5rem] font-medium text-secondary">FAQs</h2>
              {provider.faqs?.length > 0 ? (
                <div className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                  {provider.faqs.map((faq, index) => (
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
                <p className="mt-3 text-[13px] text-text-muted">
                  No questions answered yet — request a quote and ask directly.
                </p>
              )}
            </div>
          </div>

          {/* ─── Sidebar ──────────────────────────────────────────── */}
          <div className="space-y-5 lg:sticky lg:top-36 lg:self-start">
            <ProviderBookingPanel
              provider={provider}
              services={services}
              onBook={(details) => requireAuth(() => setBookingDraft(details))}
              onQuote={(details) => requireAuth(() => setQuoteDraft(details))}
            />

            <div
              ref={(node) => {
                sectionRefs.current.location = node;
              }}
              className="scroll-mt-36 rounded-2xl border border-border bg-surface p-5"
            >
              <h2 className="font-display text-[1.2rem] font-medium text-secondary">
                Service Location
              </h2>

              <p className="mt-4 flex items-start gap-2 text-[12.5px]">
                <FaMapMarkerAlt className="mt-0.5 shrink-0 text-[12px] text-primary" />
                <span>
                  <span className="font-semibold text-secondary">
                    {provider.workingArea?.city || 'Sri Lanka'}
                    {provider.workingArea?.country ? `, ${provider.workingArea.country}` : ''}
                  </span>
                  <br />
                  <span className="text-text-muted">
                    Travels up to {provider.workingArea?.radius ?? 10} km
                  </span>
                </span>
              </p>

              {areas.length > 0 && (
                <>
                  <h3 className="mt-5 text-[12.5px] font-semibold text-secondary">Areas Covered</h3>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {areas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full border border-border px-3 py-1.5 text-[11.5px] text-text-muted"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <FooterSection />

      {bookingDraft && (
        <BookingForm
          service={bookingDraft.service}
          initialDate={bookingDraft.date}
          initialTime={bookingDraft.time}
          onClose={() => setBookingDraft(null)}
          onSuccess={() => {
            setBookingDraft(null);
            navigate('/customer/bookings');
          }}
        />
      )}

      {quoteDraft && (
        <CustomRequestForm
          service={{ ...quoteDraft.service, provider }}
          onClose={() => setQuoteDraft(null)}
        />
      )}
    </div>
  );
}
