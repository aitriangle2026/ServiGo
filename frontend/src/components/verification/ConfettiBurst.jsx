import { motion } from 'framer-motion';

const COLORS = ['#2563EB', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

/**
 * A brief burst of particles radiating outward and fading — fired once when
 * the provider's score first crosses the 80-point pass threshold. Built
 * with plain framer-motion divs so no extra confetti dependency is needed.
 */
export default function ConfettiBurst({ count = 26 }) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const distance = 55 + Math.random() * 70;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      color: COLORS[i % COLORS.length],
      size: 5 + Math.random() * 5,
      rotate: Math.random() * 360,
      delay: Math.random() * 0.15,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-sm"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: p.delay }}
        />
      ))}
    </div>
  );
}