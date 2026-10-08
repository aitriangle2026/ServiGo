import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSearch, FaRegCalendarCheck, FaRegCheckCircle, FaArrowRight } from 'react-icons/fa';

// Step 02 is inverted on purpose — it breaks the run of pale cards and puts
// the emphasis on booking, which is the step that actually converts.
const STEPS = [
  {
    number: '01',
    title: ['Find', 'a service'],
    body: 'Search from a wide range of trusted professionals near you.',
    icon: FaSearch,
    inverted: false,
  },
  {
    number: '02',
    title: ['Book', 'instantly'],
    body: 'Choose a provider, pick a time and confirm your booking.',
    icon: FaRegCalendarCheck,
    inverted: true,
  },
  {
    number: '03',
    title: ['Get it done'],
    body: 'Your trusted professional arrives and takes care of the job.',
    icon: FaRegCheckCircle,
    inverted: false,
  },
];

const HowItWorksSection = () => {
  const navigate = useNavigate();

  return (
    <section id="how-it-works" className="bg-background py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,19rem)_1fr] lg:gap-12">
          {/* ─── Intro ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55 }}
            className="lg:pt-4"
          >
            <p className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              How ServiGo works
              <span className="hidden h-px w-10 bg-border sm:block" />
            </p>

            <h2 className="mt-5 font-display text-[2.1rem] font-medium leading-[1.1] text-secondary sm:text-[2.6rem]">
              A simple way to
              <br />
              get things done.
            </h2>

            <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-text-muted">
              Find, book and relax — we handle the rest.
            </p>

            <button
              type="button"
              onClick={() => navigate('/services')}
              className="mt-7 inline-flex items-center gap-3 rounded-full bg-secondary px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary"
            >
              Get Started
              <FaArrowRight className="text-xs" />
            </button>
          </motion.div>

          {/* ─── Steps + pro panel ──────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step, index) => (
              <motion.article
                key={step.number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={`flex min-h-[17rem] flex-col rounded-2xl p-6 ${
                  step.inverted
                    ? 'bg-primary text-white'
                    : 'bg-surface-warm text-secondary'
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    step.inverted ? 'text-white/70' : 'text-text-muted'
                  }`}
                >
                  {step.number}
                </span>

                <h3
                  className={`mt-3 font-display text-[1.6rem] font-medium leading-[1.15] ${
                    step.inverted ? 'text-white' : 'text-secondary'
                  }`}
                >
                  {step.title.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </h3>

                <p
                  className={`mt-3 text-[13px] leading-relaxed ${
                    step.inverted ? 'text-white/80' : 'text-text-muted'
                  }`}
                >
                  {step.body}
                </p>

                <span
                  className={`mt-auto grid h-11 w-11 place-items-center rounded-full ${
                    step.inverted
                      ? 'bg-white/15 text-white'
                      : 'bg-surface text-secondary'
                  }`}
                >
                  <step.icon className="text-sm" />
                </span>
              </motion.article>
            ))}

            {/* Provider recruitment — same grid, deliberately heavier so it
                reads as a different kind of invitation. */}
            <motion.article
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="relative flex min-h-[17rem] flex-col justify-end overflow-hidden rounded-2xl bg-secondary p-6 sm:col-span-2 xl:col-span-1"
            >
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(120%_90%_at_80%_10%,rgba(58,90,64,0.55),transparent_60%)]"
              />

              <div className="relative">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                  Become a Pro
                </p>

                <h3 className="mt-3 font-display text-[1.6rem] font-medium leading-[1.15] text-white">
                  Grow your business with ServiGo.
                </h3>

                <p className="mt-3 text-[13px] leading-relaxed text-white/70">
                  Join thousands of professionals and get more customers.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/provider/onboarding')}
                  className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-primary-light"
                >
                  Join as a Pro
                  <FaArrowRight className="text-[11px]" />
                </button>
              </div>
            </motion.article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
