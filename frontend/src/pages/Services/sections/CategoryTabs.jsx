import { motion } from 'framer-motion';
import { CATEGORY_GROUPS } from '../categoryGroups';

/**
 * @param {{ active: string, onChange: (key: string) => void }} props
 */
export default function CategoryTabs({ active, onChange }) {
  return (
    <div className="px-6 py-5 lg:px-10">
      {/* Scrolls horizontally on narrow screens so all ten stay reachable
          instead of wrapping into a tall block above the results. */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORY_GROUPS.map((group, index) => {
          const isActive = group.key === active;

          return (
            <motion.button
              key={group.key}
              type="button"
              onClick={() => onChange(group.key)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 + index * 0.025 }}
              aria-pressed={isActive}
              className={`flex h-[5.4rem] w-[6.6rem] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl px-2 transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-surface text-secondary shadow-soft hover:bg-primary-light hover:text-primary'
              }`}
            >
              <group.icon className="shrink-0 text-[17px]" />
              {/* Fixed height keeps the two-line labels ("Personal Care",
                  "Home Improvement") from pushing their cards out of line. */}
              <span className="flex h-7 items-start justify-center text-center text-[11px] font-medium leading-tight">
                {group.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
