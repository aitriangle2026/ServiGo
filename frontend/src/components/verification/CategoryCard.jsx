import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaChevronDown } from 'react-icons/fa';

/**
 * One collapsible row in the verification checklist. Shows an animated
 * progress bar + point count that update live as the provider fills things
 * in, an icon that morphs into a checkmark (spring pop) once the category
 * hits its max, and an expandable panel underneath for the actual controls.
 */
export default function CategoryCard({ icon: Icon, label, earned, max, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isComplete = max > 0 && earned >= max;
  const pct = max > 0 ? Math.max(0, Math.min(earned / max, 1)) : 0;

  return (
    <motion.div
      layout
      className={`overflow-hidden rounded-2xl border bg-surface transition-colors duration-300 ${
        isComplete ? 'border-success/40' : 'border-border'
      }`}
    >
      <button type="button" onClick={() => setIsOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full transition-colors duration-300 ${
            isComplete ? 'bg-success-light text-success' : 'bg-primary-light text-primary'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isComplete ? (
              <motion.span
                key="check"
                initial={{ scale: 0, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 16 }}
              >
                <FaCheckCircle size={18} />
              </motion.span>
            ) : (
              <motion.span
                key="icon"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              >
                {Icon && <Icon size={16} />}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-secondary">{label}</p>
            <motion.span
              key={earned}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className={`shrink-0 text-sm font-bold tabular-nums ${isComplete ? 'text-success' : 'text-text-muted'}`}
            >
              {earned}/{max}
            </motion.span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className={`h-full rounded-full ${isComplete ? 'bg-success' : 'bg-primary'}`}
              initial={false}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-text-muted">
          <FaChevronDown size={12} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border px-4 py-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}