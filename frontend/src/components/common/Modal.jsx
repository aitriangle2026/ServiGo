import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

/**
 * @param {{ isOpen: boolean, onClose: () => void, title?: string, children: React.ReactNode, size?: 'sm'|'md'|'lg' }} props
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-secondary/50 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={`flex max-h-[85vh] w-full flex-col ${sizeClass} rounded-2xl bg-surface p-6 shadow-soft-lg`}
              role="dialog"
              aria-modal="true"
            >
              {title && (
                <div className="mb-4 flex shrink-0 items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-secondary">{title}</h3>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="grid h-8 w-8 place-items-center rounded-full text-text-muted hover:bg-slate-100 hover:text-secondary"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
              <div className="overflow-y-auto pr-1">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
