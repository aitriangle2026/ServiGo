import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import { FEATURED_SERVICES } from '@/utils/constants';
import ServiceCard from '@/components/cards/ServiceCard';

const FeaturedServicesSection = () => (
  <section className="bg-surface py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Handpicked</p>
          <h2 className="mt-2 text-balance font-display text-3xl font-bold text-secondary sm:text-4xl">
            Featured services near you
          </h2>
          <p className="mt-2 max-w-xl text-text-muted">
            Top-performing listings this week, ranked by rating, response time and repeat bookings.
          </p>
        </div>
        <Link
          to="/services"
          className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:flex"
        >
          Browse all services <FaArrowRight className="text-xs" />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED_SERVICES.map((service, i) => (
          <ServiceCard key={service.id} service={service} index={i} />
        ))}
      </div>
    </div>
  </section>
);

export default FeaturedServicesSection;
