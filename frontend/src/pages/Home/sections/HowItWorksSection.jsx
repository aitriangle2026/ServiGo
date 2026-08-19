import { motion } from 'framer-motion';
import { FaSearch, FaUserCheck, FaCalendarCheck, FaSmile } from 'react-icons/fa';
import { HOW_IT_WORKS_STEPS, STATS } from '@/utils/constants';

const STEP_ICONS = [FaSearch, FaUserCheck, FaCalendarCheck, FaSmile];

const HowItWorksSection = () => (
  <section id="how-it-works" className="bg-background py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">How it works</p>
        <h2 className="mt-2 text-balance font-display text-3xl font-bold text-secondary sm:text-4xl">
          Booking help shouldn't feel like a chore
        </h2>
        <p className="mt-3 text-text-muted">
          Four steps between "I have a problem" and "it's fixed" — no phone tag required.
        </p>
      </div>

      <div className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="absolute left-0 right-0 top-8 hidden h-px bg-border lg:block" />
        {HOW_IT_WORKS_STEPS.map((step, i) => {
          const Icon = STEP_ICONS[i];
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: [0.25, 1, 0.5, 1] }}
              className="relative flex flex-col items-start"
            >
              <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-xl text-primary shadow-soft">
                <Icon />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-secondary">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.description}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-20 grid grid-cols-2 gap-6 rounded-3xl bg-secondary px-6 py-10 sm:px-10 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="text-center"
          >
            <p className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              {stat.value.toLocaleString()}
              <span className="text-accent">{stat.suffix}</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
