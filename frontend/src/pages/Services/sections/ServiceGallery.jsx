import { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const PLACEHOLDER = '/images/service-placeholder.jpg';

/**
 * Main image plus thumbnail strip, with arrow and keyboard navigation.
 *
 * @param {{ images: string[], title: string }} props
 */
export default function ServiceGallery({ images = [], title = 'Service' }) {
  const gallery = images.length > 0 ? images : [PLACEHOLDER];
  const [index, setIndex] = useState(0);

  const go = (next) => setIndex((next + gallery.length) % gallery.length);

  return (
    <div>
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-warm"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') go(index - 1);
          if (event.key === 'ArrowRight') go(index + 1);
        }}
        tabIndex={0}
        role="group"
        aria-label={`${title} photos`}
      >
        <img
          src={gallery[index]}
          alt={`${title} — photo ${index + 1} of ${gallery.length}`}
          onError={(event) => {
            event.currentTarget.src = PLACEHOLDER;
          }}
          className="h-full w-full object-cover"
        />

        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-secondary backdrop-blur transition-colors hover:bg-surface"
            >
              <FaChevronLeft className="text-[12px]" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-secondary backdrop-blur transition-colors hover:bg-surface"
            >
              <FaChevronRight className="text-[12px]" />
            </button>

            <span className="absolute bottom-3 right-3 rounded-md bg-secondary/70 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
              {index + 1}/{gallery.length}
            </span>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {gallery.map((image, position) => (
            <button
              key={`${image}-${position}`}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={`Show photo ${position + 1}`}
              aria-pressed={position === index}
              className={`h-[4.6rem] w-[6rem] shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                position === index ? 'border-secondary' : 'border-transparent hover:border-border'
              }`}
            >
              <img
                src={image}
                alt=""
                onError={(event) => {
                  event.currentTarget.src = PLACEHOLDER;
                }}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
