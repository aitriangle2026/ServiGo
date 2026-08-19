import { motion } from 'framer-motion';
import { FaStar, FaQuoteRight } from 'react-icons/fa';

const ReviewCard = ({ review, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.45, delay: index * 0.08, ease: [0.25, 1, 0.5, 1] }}
    className="relative flex h-full flex-col rounded-2xl border border-border bg-surface p-7 shadow-soft"
  >
    <FaQuoteRight className="absolute right-6 top-6 text-2xl text-primary-light" />

    <div className="flex gap-0.5 text-accent">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar key={i} className={i < review.rating ? 'text-accent' : 'text-slate-200'} />
      ))}
    </div>

    <p className="mt-4 flex-1 text-[15px] leading-relaxed text-text">{review.text}</p>

    <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
      <img src={review.avatar} alt={review.name} className="h-11 w-11 rounded-full object-cover" />
      <div>
        <p className="font-display text-sm font-semibold text-secondary">{review.name}</p>
        <p className="text-xs text-text-muted">{review.role}</p>
      </div>
    </div>
  </motion.div>
);

export default ReviewCard;
