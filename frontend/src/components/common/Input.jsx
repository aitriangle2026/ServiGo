import { forwardRef, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * Shared Input component used across all forms.
 * @param {{
 *   label?: string, error?: string, icon?: React.ComponentType, type?: string,
 *   containerClassName?: string
 * } & React.InputHTMLAttributes} props
 */
const Input = forwardRef(
  ({ label, error, icon: Icon, type = 'text', containerClassName = '', className = '', id, ...rest }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const inputId = id || rest.name;

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-secondary">
            {label}
          </label>
        )}
        <div
          className={`flex items-center gap-2.5 rounded-xl border bg-surface px-4 py-3 transition-colors focus-within:ring-1
            ${error
              ? 'border-danger focus-within:border-danger focus-within:ring-danger'
              : 'border-border focus-within:border-primary focus-within:ring-primary'}`}
        >
          {Icon && <Icon className="shrink-0 text-text-muted" />}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`w-full bg-transparent text-[15px] text-secondary placeholder:text-text-muted focus:outline-none ${className}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((s) => !s)}
              className="shrink-0 text-text-muted hover:text-secondary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
