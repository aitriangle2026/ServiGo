import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaRegClock,
  FaShieldAlt,
  FaRegCreditCard,
  FaArrowRight,
  FaBriefcase,
  FaChartBar,
  FaWallet,
} from 'react-icons/fa';
import appImage from '/images/howitworks-app.webp';

const BENEFITS = [
  { icon: FaRegClock, title: 'Save Time', body: 'Quick booking in minutes' },
  { icon: FaShieldAlt, title: 'Trusted Pros', body: 'Verified & rated professionals' },
  { icon: FaRegCreditCard, title: 'Transparent Pricing', body: 'No hidden costs' },
];

const PRO_BENEFITS = [
  {
    icon: FaBriefcase,
    tone: 'bg-primary-light text-primary',
    title: 'Get More Customers',
    body: 'Reach customers in your area and grow your business.',
  },
  {
    icon: FaChartBar,
    tone: 'bg-amber-50 text-accent-hover',
    title: 'Build Your Reputation',
    body: 'Get verified, collect reviews and showcase your work.',
  },
  {
    icon: FaWallet,
    tone: 'bg-sky-50 text-sky-700',
    title: 'Flexible Work',
    body: 'Choose your availability and manage bookings easily.',
  },
];

/**
 * The app preview supplied with the design — a real device shot rather than
 * a drawn mock, so the product looks like something that exists.
 */
function AppPreview() {
  return (
    // The supplied shot is a wide room photo with the phone off to one side.
    // A portrait frame plus object-position crops to the device, instead of
    // letting a 2000px-wide landscape dictate the column width.
    <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-soft">
      <img
        src={appImage}
        alt="The ServiGo app open on a phone, showing service categories"
        className="h-full w-full object-cover object-[64%_center]"
      />
    </div>
  );
}

export default function AppShowcase() {
  const navigate = useNavigate();

  return (
    <section className="bg-surface-warm py-16 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[19rem_minmax(0,1fr)_20rem] lg:items-center lg:gap-12 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <AppPreview />
        </motion.div>

        {/* ─── Customer benefits ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
            Easy &amp; convenient
            <span className="hidden h-px w-12 bg-border sm:block" />
          </p>

          <h2 className="mt-4 font-display text-[1.9rem] font-medium leading-[1.12] text-secondary sm:text-[2.3rem]">
            All Your Home
            <br />
            Services in One Place
          </h2>

          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-text-muted">
            Book trusted professionals anytime, anywhere using the ServiGo app or website.
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-5">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-secondary">
                  <benefit.icon className="text-[13px]" />
                </span>
                <div>
                  <dt className="text-[13px] font-semibold leading-tight text-secondary">
                    {benefit.title}
                  </dt>
                  <dd className="mt-0.5 text-[11.5px] leading-tight text-text-muted">
                    {benefit.body}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </motion.div>

        {/* ─── Provider recruitment ───────────────────────────────── */}
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl bg-background p-6 shadow-soft"
        >
          <h3 className="flex items-center gap-3 font-display text-[1.2rem] font-medium text-secondary">
            For Professionals
            <span className="h-px flex-1 bg-border" />
          </h3>

          <div className="mt-5 space-y-5">
            {PRO_BENEFITS.map((benefit) => (
              <div key={benefit.title} className="flex gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${benefit.tone}`}
                >
                  <benefit.icon className="text-[13px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-tight text-secondary">
                    {benefit.title}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-text-muted">
                    {benefit.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate('/provider/onboarding')}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-secondary px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-primary"
          >
            Become a Pro
            <FaArrowRight className="text-[11px]" />
          </button>
        </motion.aside>
      </div>
    </section>
  );
}
