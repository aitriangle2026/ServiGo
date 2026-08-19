import { TESTIMONIALS } from '@/utils/constants';
import ReviewCard from '@/components/cards/ReviewCard';

const TestimonialsSection = () => (
  <section className="bg-background py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Testimonials</p>
        <h2 className="mt-2 text-balance font-display text-3xl font-bold text-secondary sm:text-4xl">
          Loved by customers across Sri Lanka
        </h2>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((review, i) => (
          <ReviewCard key={review.id} review={review} index={i} />
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
