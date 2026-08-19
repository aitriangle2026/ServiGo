import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/common/Button';
import { authService } from '@/services/authService';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyOTPForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const purpose = location.state?.purpose || 'reset-password';

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  if (!email) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-[15px] text-text-muted">
          Your session expired. Please restart the password reset process.
        </p>
        <Link to="/forgot-password" className="mt-4 inline-block font-semibold text-primary">
          Go back
        </Link>
      </div>
    );
  }

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (error) setError('');

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((char, i) => (next[i] = char));
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== OTP_LENGTH) {
      setError('Enter all 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.verifyOtp({ email, otp });
      if (purpose === 'reset-password') {
        navigate('/reset-password', { state: { email, otp, resetToken: data.resetToken } });
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    try {
      await authService.resendOtp(email);
      setSecondsLeft(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not resend code. Try again shortly.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-6"
      noValidate
    >
      <p className="text-[15px] text-text-muted">
        We sent a 6-digit code to <span className="font-semibold text-secondary">{email}</span>.
        Enter it below to continue.
      </p>

      <div>
        <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`h-14 w-full max-w-[52px] rounded-xl border text-center font-display text-xl font-bold text-secondary focus:outline-none focus:ring-1
                ${error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border focus:border-primary focus:ring-primary'}`}
            />
          ))}
        </div>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-danger">
            {error}
          </motion.p>
        )}
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
        Verify code
      </Button>

      <div className="text-center text-sm text-text-muted">
        {secondsLeft > 0 ? (
          <span>
            Resend code in <span className="font-semibold text-secondary">0:{String(secondsLeft).padStart(2, '0')}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="font-semibold text-primary hover:text-primary-hover disabled:opacity-50"
          >
            {isResending ? 'Resending…' : 'Resend code'}
          </button>
        )}
      </div>
    </motion.form>
  );
}
