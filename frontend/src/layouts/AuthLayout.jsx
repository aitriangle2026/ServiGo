import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';

const HIGHLIGHTS = [
  'Book verified local professionals in minutes',
  'Track every job in real time, start to finish',
  'Secure in-app payments — pay only when it\'s done',
];

/**
 * @param {{ title: string, subtitle?: string, children: React.ReactNode }} props
 */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-secondary p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/25 blur-[120px]" />
          <div className="absolute bottom-0 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-[120px]" />
        </div>

        <Link to="/" className="relative z-10 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg font-extrabold text-white">
            S
          </span>
          <span className="font-display text-xl font-extrabold text-white">ServiGo</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="relative z-10"
        >
          <h2 className="max-w-md text-balance font-display text-3xl font-extrabold leading-tight text-white">
            Trusted local pros, booked in minutes
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[15px] text-slate-300">
                <FaCheckCircle className="mt-0.5 shrink-0 text-success" />
                {point}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="relative z-10 text-sm text-slate-400">
          © {new Date().getFullYear()} ServiGo. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="w-full max-w-md"
        >
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg font-extrabold text-white">
              S
            </span>
            <span className="font-display text-xl font-extrabold text-secondary">ServiGo</span>
          </Link>

          <h1 className="font-display text-[28px] font-extrabold text-secondary">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-text-muted">{subtitle}</p>}

          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
