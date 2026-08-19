import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope } from 'react-icons/fa';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { authService } from '@/services/authService';
import { isValidEmail } from '@/utils/validators';

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email) {
      setError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      navigate('/verify-otp', { state: { email, purpose: 'reset-password' } });
    } catch (err) {
      setFormError(
        err?.response?.data?.message || 'We could not find an account with that email.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-5"
      noValidate
    >
      {formError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger"
        >
          {formError}
        </motion.div>
      )}

      <Input
        label="Email address"
        type="email"
        name="email"
        icon={FaEnvelope}
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError('');
        }}
        error={error}
        autoComplete="email"
      />

      <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
        Send OTP
      </Button>

      <p className="text-center text-sm text-text-muted">
        Remembered your password?{' '}
        <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
          Back to login
        </Link>
      </p>
    </motion.form>
  );
}
