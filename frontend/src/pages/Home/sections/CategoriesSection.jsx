import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import { CATEGORIES } from '@/utils/constants';
import CategoryCard from '@/components/cards/CategoryCard';

const CategoriesSection = () => (
  <section className="bg-background py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Categories</p>
          <h2 className="mt-2 text-balance font-display text-3xl font-bold text-secondary sm:text-4xl">
            Browse popular services
          </h2>
        </div>
        <Link
          to="/services"
          className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:flex"
        >
          View all categories <FaArrowRight className="text-xs" />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.slice(0, 10).map((category, i) => (
          <CategoryCard key={category.id} category={category} index={i} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-8 flex justify-center sm:hidden"
      >
        <Link to="/services" className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          View all categories <FaArrowRight className="text-xs" />
        </Link>
      </motion.div>
    </div>
  </section>
);

export default CategoriesSection;
