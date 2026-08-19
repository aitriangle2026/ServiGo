import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import { APP_NAME } from '@/utils/constants';

const VALUES = [
  { title: 'Verified, always', description: 'Every provider passes ID and background checks before they can take a booking.' },
  { title: 'Upfront pricing', description: 'No surprise call-out fees — you see the price before you confirm.' },
  { title: 'Local first', description: 'Built for Sri Lankan homes and neighborhoods, from Colombo to Kandy.' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-4xl px-6 py-20 text-center lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl font-extrabold text-secondary"
        >
          About {APP_NAME}
        </motion.h1>
        <p className="mx-auto mt-4 max-w-xl text-text-muted">
          {APP_NAME} connects customers with trusted local service professionals — from
          electricians to event planners — with upfront pricing and real reviews, all in one place.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-surface p-6">
              <FaCheckCircle className="mb-3 text-xl text-success" />
              <h3 className="font-display text-base font-bold text-secondary">{v.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{v.description}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}