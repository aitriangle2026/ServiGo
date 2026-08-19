import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CategoryCard = ({ category, index = 0 }) => {
  const navigate = useNavigate();
  const Icon = category.icon;

  return (
    <motion.button
      onClick={() => navigate(`/services?category=${category.id}`)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.25, 1, 0.5, 1] }}
      whileHover={{ y: -3 }}
      className="group flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface
        p-5 text-left shadow-soft transition-shadow duration-300 hover:shadow-soft-lg"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${category.color}1A`, color: category.color }}
      >
        <Icon />
      </span>
      <div>
        <h3 className="font-display text-[15px] font-semibold text-secondary">{category.name}</h3>
        <p className="mt-0.5 text-xs text-text-muted">{category.jobCount.toLocaleString()} pros nearby</p>
      </div>
    </motion.button>
  );
};

export default CategoryCard;
