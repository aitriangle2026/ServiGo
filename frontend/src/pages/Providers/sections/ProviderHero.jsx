import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaCheckCircle, FaChevronRight } from 'react-icons/fa';

const PLACEHOLDER = '/images/service-placeholder.jpg';

/**
 * Profile header: avatar, name, headline stats and the provider's own
 * one-line pitch.
 *
 * @param {{ provider: object, name: string, role: string }} props
 */
export default function ProviderHero({ provider, name, role }) {
  const rating = Number(provider?.averageRating || 0);
  const reviews = Number(provider?.totalReviews || 0);
  const stats = provider?.stats || {};

  // Only the figures we can actually stand behind get rendered — a stat with
  // no data behind it is worse than one fewer stat.
  const headline = [
    provider?.experience > 0 && {
      value: `${provider.experience}+`,
      label: 'Years Experience',
    },
    stats.completedJobs > 0 && {
      value: `${stats.completedJobs}`,
      label: 'Completed Jobs',
    },
    stats.completionRate != null && {
      value: `${stats.completionRate}%`,
      label: 'Completion Rate',
    },
  ].filter(Boolean);

  return (
    <section className="relative isolate overflow-hidden">
      {/* Colour field rather than a photo backdrop: the avatar is already a
          photograph, and a second one behind it muddied both. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-surface-warm">
        <div className="absolute inset-0 bg-[radial-gradient(85%_120%_at_80%_0%,rgba(58,90,64,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10 pt-5 lg:px-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
            <li>
              <Link to="/" className="hover:text-secondary">
                Home
              </Link>
            </li>
            <FaChevronRight className="text-[8px]" />
            <li>
              <Link to="/find-pros" className="hover:text-secondary">
                Find Pros
              </Link>
            </li>
            <FaChevronRight className="text-[8px]" />
            <li className="font-medium text-secondary">{name}</li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap gap-6"
          >
            <img
              src={provider?.profileImage || PLACEHOLDER}
              alt={name}
              onError={(event) => {
                event.currentTarget.src = PLACEHOLDER;
              }}
              className="h-[11rem] w-[11rem] shrink-0 rounded-2xl border-4 border-surface object-cover shadow-soft"
            />

            <div className="min-w-0 flex-1">
              {provider?.isVerified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-2.5 py-1 text-[11px] font-semibold text-success">
                  <FaCheckCircle className="text-[10px]" />
                  Verified Professional
                </span>
              )}

              <h1 className="mt-2.5 font-display text-[2.1rem] font-medium leading-tight text-secondary sm:text-[2.6rem]">
                {name}
              </h1>

              <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[13px]">
                <FaStar className="text-[13px] text-accent" />
                <span className="font-semibold text-secondary">{rating.toFixed(1)}</span>
                <span className="text-text-muted">
                  ({reviews} {reviews === 1 ? 'review' : 'reviews'})
                </span>
              </p>

              <p className="mt-1.5 text-[13.5px] text-text-muted">{role}</p>

              {provider?.workingArea?.city && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-text-muted">
                  <FaMapMarkerAlt className="text-[11px]" />
                  {provider.workingArea.city}
                  {provider.workingArea.country ? `, ${provider.workingArea.country}` : ''}
                </p>
              )}

              {headline.length > 0 && (
                <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-4">
                  {headline.map((stat) => (
                    <div key={stat.label}>
                      <dt className="font-display text-[1.45rem] font-medium leading-none text-secondary">
                        {stat.value}
                      </dt>
                      <dd className="mt-1 text-[11px] text-text-muted">{stat.label}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </motion.div>

          {provider?.tagline && (
            <motion.figure
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="lg:pt-6"
            >
              <blockquote className="font-display text-[1.45rem] font-medium italic leading-snug text-secondary">
                “{provider.tagline}”
              </blockquote>
            </motion.figure>
          )}
        </div>
      </div>
    </section>
  );
}
