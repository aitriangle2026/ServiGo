import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaPlay } from 'react-icons/fa';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

/**
 * @param {{ onWatchVideo?: () => void }} props
 */
export default function HowItWorksHero({ onWatchVideo }) {
  const navigate = useNavigate();

  return (
    <section className="relative isolate overflow-hidden">
      {/* Colour field instead of a photograph. Built from the palette's own
          tokens so it shifts with any future rebrand: a warm cream base, a
          sage wash from the top-right, and a softer green pool bottom-left
          to stop the right half feeling empty where the image used to be. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-surface-warm">
        <div className="absolute inset-0 bg-[radial-gradient(90%_120%_at_85%_0%,rgba(58,90,64,0.20),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_100%_at_15%_100%,rgba(200,144,31,0.10),transparent_58%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        {/* Two very soft discs give the flat gradient a little depth without
            reading as decoration for its own sake. */}
        <div className="absolute -right-24 top-8 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-40 top-40 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted"
          >
            How it works
            <span className="hidden h-px w-14 bg-border sm:block" />
          </motion.p>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="mt-5 font-display text-[2.5rem] font-medium leading-[1.05] text-secondary sm:text-6xl lg:text-[4rem]"
          >
            From Need to Done
            <br />
            in <em className="font-normal italic text-primary">Simple Steps</em>.
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-lg text-[15px] leading-relaxed text-text-muted sm:text-base"
          >
            Book trusted professionals for your home, office and everyday needs — quickly, safely
            and easily.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <button
              type="button"
              onClick={() => navigate('/find-pros')}
              className="inline-flex items-center gap-3 rounded-full bg-secondary px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary"
            >
              Find a Professional
              <FaArrowRight className="text-xs" />
            </button>

            <button
              type="button"
              onClick={onWatchVideo}
              className="inline-flex items-center gap-3 rounded-full border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full border border-current">
                <FaPlay className="ml-[1px] text-[8px]" />
              </span>
              Watch Video
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
