import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import { TOP_PROVIDERS } from '@/utils/constants';
import ProviderCard from '@/components/cards/ProviderCard';

const TopProvidersSection = () => (
  <section className="bg-surface py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Top rated</p>
          <h2 className="mt-2 text-balance font-display text-3xl font-bold text-secondary sm:text-4xl">
            Meet a few of our top pros
          </h2>
        </div>
        <Link
          to="/find-pros"
          className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:flex"
        >
          Find pros near you <FaArrowRight className="text-xs" />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TOP_PROVIDERS.map((provider, i) => (
          <ProviderCard key={provider.id} provider={provider} index={i} />
        ))}
      </div>
    </div>
  </section>
);

export default TopProvidersSection;
