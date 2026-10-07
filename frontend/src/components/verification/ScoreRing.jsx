import { useEffect, useRef, useState } from 'react';
import { motion, animate } from 'framer-motion';

// Tweens a plain number between renders so the score display counts up/down
// smoothly instead of jumping, using framer-motion's imperative animate()
// rather than re-implementing easing math by hand.
function useAnimatedNumber(target, duration = 0.9) {
  const [value, setValue] = useState(target);
  const prevTarget = useRef(target);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      prevTarget.current = target;
      setValue(target);
      return;
    }
    const controls = animate(prevTarget.current, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(v),
    });
    prevTarget.current = target;
    return () => controls.stop();
  }, [target, duration]);

  return value;
}

/**
 * Circular score ring — fills with the score out of 100, counts up, shifts
 * from red -> amber -> green, and glows with a soft pulse once the pass
 * threshold (80) is reached.
 */
export default function ScoreRing({ score, maxScore = 100, passThreshold = 80, size = 176 }) {
  const animatedScore = useAnimatedNumber(score);
  const pct = Math.max(0, Math.min(animatedScore / maxScore, 1));
  const passed = score >= passThreshold;

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const color = passed ? '#10B981' : pct >= 0.5 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {passed && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${color}` }}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.18, opacity: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ filter: passed ? `drop-shadow(0 0 10px ${color}99)` : 'none' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-extrabold tabular-nums" style={{ color }}>
          {Math.round(animatedScore)}
        </span>
        <span className="text-xs font-semibold text-text-muted">out of {maxScore}</span>
        <motion.span
          key={passed ? 'ready' : 'in-progress'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`mt-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
            passed ? 'bg-success-light text-success' : 'bg-slate-100 text-text-muted'
          }`}
        >
          {passed ? 'READY TO SUBMIT' : `${Math.max(0, passThreshold - Math.round(animatedScore))} MORE TO GO`}
        </motion.span>
      </div>
    </div>
  );
}