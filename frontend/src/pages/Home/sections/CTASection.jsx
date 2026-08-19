import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import Button from '@/components/common/Button';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-secondary px-6 py-14 text-center sm:px-16 sm:py-20"
      >
        <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-extrabold text-white sm:text-4xl">
            Got a skill? Turn it into your next booking.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Join thousands of verified professionals earning steady income on ServiGo — set your own
            rates, your own schedule, zero listing fees to start.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="accent" size="lg" onClick={() => navigate('/provider/onboarding')}>
              Become a Pro <FaArrowRight />
            </Button>
            <Button variant="white" size="lg" onClick={() => navigate('/services')}>
              I need a service
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
