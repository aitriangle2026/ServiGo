const VARIANT_CLASSES = {
  primary: 'bg-primary-light text-primary',
  accent: 'bg-amber-50 text-accent-hover',
  success: 'bg-success-light text-success',
  danger: 'bg-danger-light text-danger',
  neutral: 'bg-slate-100 text-text-muted',
  dark: 'bg-secondary text-white',
};

export default function Badge({ children, variant = 'primary', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}