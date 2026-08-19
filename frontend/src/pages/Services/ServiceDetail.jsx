import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaRegStar, FaMapMarkerAlt, FaClock, FaTag } from 'react-icons/fa';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/common/Button';
import { serviceService } from '@/services/serviceService';
import { formatCurrency } from '@/utils/formatCurrency';
import BookingForm from '@/components/forms/BookingForm';
import { reviewService } from '@/services/reviewService';

const renderStars = (rating = 0) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) stars.push(<FaStar key={i} className="text-accent" />);
    else if (i === fullStars && hasHalfStar) stars.push(<FaStarHalfAlt key={i} className="text-accent" />);
    else stars.push(<FaRegStar key={i} className="text-slate-300" />);
  }
  return stars;
};

export default function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    serviceService
      .getById(id)
      .then((res) => {
        const s = res?.data ?? res;
        setService(s);
        setActiveImage(s?.images?.[0] || null);
      })
      .catch(() => setError('Could not load this service.'))
      .finally(() => setIsLoading(false));

    reviewService
      .getByService(id)
      .then((res) => setReviews(res?.data || []))
      .catch(() => setReviews([]));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-text-muted">Loading…</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-danger">{error || 'Service not found.'}</p>
          <Link to="/services" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            ← Back to services
          </Link>
        </div>
      </div>
    );
  }

  const {
    title,
    description,
    workDetails,
    duration,
    tags = [],
    images = [],
    portfolioImages = [],
    category,
    provider,
    price,
    priceType,
    rating = 0,
    reviewCount = 0,
  } = service;

  const categoryName = typeof category === 'string' ? category : category?.name || 'Uncategorized';
  const providerName = provider?.user
    ? `${provider.user.firstName || ''} ${provider.user.lastName || ''}`.trim() || 'Unknown Pro'
    : 'Unknown Pro';
  const providerLocation = provider?.workingArea?.city || provider?.workingArea?.district || '';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/services" className="mb-6 inline-block text-sm font-semibold text-primary hover:underline">
          ← Back to services
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          {/* Left: images */}
          <div className="lg:col-span-3">
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-100">
              <img
                src={activeImage || '/images/service-placeholder.jpg'}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 ${
                      activeImage === img ? 'ring-primary' : 'ring-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {portfolioImages.length > 0 && (
              <div className="mt-8">
                <h3 className="font-display text-base font-bold text-secondary">Past work</h3>
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {portfolioImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Portfolio ${i + 1}`}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: details */}
          <div className="lg:col-span-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
              <FaTag size={10} /> {categoryName}
            </span>

            <h1 className="mt-3 font-display text-2xl font-extrabold text-secondary">{title}</h1>

            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <div className="flex items-center gap-0.5">{renderStars(rating)}</div>
              <span className="font-medium text-secondary">{rating.toFixed(1)}</span>
              <span className="text-text-muted">({reviewCount} reviews)</span>
            </div>

            <p className="mt-4 font-display text-3xl font-extrabold text-primary">
              {formatCurrency(price)}
              {priceType === 'hourly' && <span className="text-base font-medium text-text-muted"> /hr</span>}
            </p>

            <Button variant="primary" size="lg" fullWidth className="mt-5" onClick={() => setIsBookingOpen(true)}>
              Book Now
            </Button>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-light font-display text-lg font-bold text-primary">
                {providerName.charAt(0) || 'P'}
              </div>
              <div>
                <p className="text-sm font-semibold text-secondary">{providerName}</p>
                {providerLocation && (
                  <p className="flex items-center gap-1 text-xs text-text-muted">
                    <FaMapMarkerAlt size={10} /> {providerLocation}
                  </p>
                )}
              </div>
            </div>

            {duration && (
              <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
                <FaClock className="text-primary" /> Estimated duration: {duration}
              </div>
            )}

            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-text-muted">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 border-t border-border pt-6">
              <h3 className="font-display text-base font-bold text-secondary">About this service</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
            </div>

            {workDetails && (
              <div className="mt-6">
                <h3 className="font-display text-base font-bold text-secondary">Work details</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-muted">{workDetails}</p>
              </div>
            )}
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="mt-12 border-t border-border pt-10">
            <h3 className="font-display text-lg font-bold text-secondary">Reviews ({reviews.length})</h3>
            <div className="mt-4 space-y-4">
              {reviews.map((r) => (
                <div key={r._id} className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-secondary">
                      {r.customer?.firstName} {r.customer?.lastName}
                    </p>
                    <div className="flex gap-0.5 text-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar key={i} className={i < r.rating ? 'text-accent' : 'text-slate-200'} />
                      ))}
                    </div>
                  </div>
                  {r.review && <p className="mt-2 text-sm text-text-muted">{r.review}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      
              {isBookingOpen && (
        <BookingForm service={service} isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      )}
      <Footer />
    </div>
  );
}