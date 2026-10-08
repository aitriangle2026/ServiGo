import { motion } from 'framer-motion';
import {
  FaSearch,
  FaRegUser,
  FaRegCalendarAlt,
  FaRegCommentDots,
  FaCheck,
} from 'react-icons/fa';

import searchImage from '/images/step-search.webp';
import browseImage from '/images/step-browse.webp';
import bookImage from '/images/step-book.webp';
import chatImage from '/images/step-chat.webp';
import doneImage from '/images/step-done.webp';

// Icon tints alternate green / amber so the row reads as a sequence rather
// than five identical tiles.
const STEPS = [
  {
    number: 1,
    icon: FaSearch,
    tone: 'bg-primary-light text-primary',
    title: 'Search for a Service',
    body: 'Choose the service you need and enter your location.',
    image: searchImage,
    alt: 'A customer browsing ServiGo on her phone at home',
  },
  {
    number: 2,
    icon: FaRegUser,
    tone: 'bg-amber-50 text-accent-hover',
    title: 'Browse Professionals',
    body: 'Compare profiles, ratings, reviews and prices.',
    image: browseImage,
    alt: 'A list of professionals with star ratings in the ServiGo app',
  },
  {
    number: 3,
    icon: FaRegCalendarAlt,
    tone: 'bg-primary-light text-primary',
    title: 'Book Instantly or Schedule',
    body: 'Pick a convenient time and confirm your booking.',
    image: bookImage,
    alt: 'Choosing a booking date on a calendar',
  },
  {
    number: 4,
    icon: FaRegCommentDots,
    tone: 'bg-amber-50 text-accent-hover',
    title: 'Communicate Easily',
    body: 'Chat with the professional and get real-time updates.',
    image: chatImage,
    alt: 'A customer chatting with her booked professional',
  },
  {
    number: 5,
    icon: FaCheck,
    tone: 'bg-primary-light text-primary',
    title: 'Get the Job Done',
    body: "The professional arrives, completes the service and you're all set!",
    image: doneImage,
    alt: 'A ServiGo professional with his toolkit giving a thumbs up',
  },
];

export default function ProcessSteps() {
  return (
    <section className="bg-background py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <p className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
          The process
          <span className="hidden h-px w-14 bg-border sm:block" />
        </p>

        <h2 className="mt-4 font-display text-[2rem] font-medium leading-tight text-secondary sm:text-[2.5rem]">
          How ServiGo Works
        </h2>

        <div className="mt-10 grid gap-x-7 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.09 }}
              // min-w-0: grid items default to min-width:auto, so the longer
              // titles ("Book Instantly or Schedule") refused to shrink and
              // pushed the fifth card past the container's right edge.
              className="relative min-w-0"
            >
              {/* Connector to the next step. Last card has none, and it's
                  hidden below lg where the cards stack instead of lining up. */}
              {index < STEPS.length - 1 && (
                <svg
                  aria-hidden
                  className="absolute -right-7 top-1/2 z-10 hidden h-4 w-7 -translate-y-1/2 text-border lg:block"
                  viewBox="0 0 28 16"
                  fill="none"
                >
                  <path
                    d="M2 8h20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    strokeLinecap="round"
                  />
                  <path
                    d="m20 3 6 5-6 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="relative aspect-[16/11] overflow-hidden">
                  <img
                    src={step.image}
                    alt={step.alt}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />

                  <span className="absolute left-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-semibold text-white shadow-soft">
                    {step.number}
                  </span>
                </div>

                {/* The icon straddles the photo's lower edge, tying the image
                    to the copy instead of leaving them as two stacked blocks. */}
                <div className="flex flex-1 flex-col items-center px-4 pb-6 text-center">
                  <span
                    className={`-mt-7 grid h-14 w-14 place-items-center rounded-full border-4 border-surface ${step.tone}`}
                  >
                    <step.icon className="text-base" />
                  </span>

                  <h3 className="mt-3 text-[14px] font-semibold leading-snug text-secondary">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-[12.5px] leading-relaxed text-text-muted">{step.body}</p>
                </div>
              </article>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
