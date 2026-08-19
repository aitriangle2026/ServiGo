import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';

const VARIANT_CLASSES = {
  primary:
    'bg-primary text-white shadow-[0_8px_24px_rgba(37,99,235,0.25)] hover:bg-primary-hover',
  secondary:
    'bg-secondary text-white hover:bg-[#1E293B]',
  accent:
    'bg-accent text-white shadow-[0_8px_24px_rgba(245,158,11,0.25)] hover:bg-accent-hover',
  outline:
    'bg-transparent text-secondary border border-border hover:border-primary hover:text-primary',
  ghost:
    'bg-transparent text-secondary hover:bg-slate-100',
  danger:
    'bg-danger text-white hover:bg-red-600',
  white:
    'bg-white text-secondary shadow-soft hover:shadow-soft-lg',
};

const SIZE_CLASSES = {
  sm: 'text-sm px-4 py-2 gap-1.5',
  md: 'text-sm px-5 py-2.5 gap-2',
  lg: 'text-base px-7 py-3.5 gap-2.5',
};

/**
 * Shared Button component.
 * @param {'primary'|'secondary'|'accent'|'outline'|'ghost'|'danger'|'white'} variant
 * @param {'sm'|'md'|'lg'} size
 */
const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      disabled = false,
      icon: Icon,
      iconPosition = 'left',
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        className={`inline-flex items-center justify-center rounded-full font-semibold
          transition-colors duration-200 whitespace-nowrap
          disabled:opacity-50 disabled:cursor-not-allowed
          ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}
          ${fullWidth ? 'w-full' : ''} ${className}`}
        {...rest}
      >
        {isLoading ? (
          <FaSpinner className="animate-spin" />
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon />}
            {children}
            {Icon && iconPosition === 'right' && <Icon />}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
