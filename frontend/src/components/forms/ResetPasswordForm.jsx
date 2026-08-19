import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock } from 'react-icons/fa';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { authService } from '@/services/authService';
import { getPasswordStrength, isStrongPassword, validateFields } from '@/utils/validators';

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const otp = location.state?.otp;

  const [values, setValues] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const strength = getPasswordStrength(values.password);

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  if (!email || !otp) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const validationErrors = validateFields(values, {
      password: (v) => {
        if (!v) return 'Password is required';
        if (!isStrongPassword(v)) return 'Min 8 characters, with uppercase, lowercase and a number';
        return null;
      },
      confirmPassword: (v, all) => {
        if (!v) return 'Please confirm your password';
        if (v !== all.password) return 'Passwords do not match';
        return null;
      },
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      await authService.resetPassword({ email, otp, newPassword: values.password });
      navigate('/login', { state: { justReset: true } });
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Could not reset your password. Please try again.');
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

      <div>
        <Input
          label="New password"
          type="password"
          name="password"
          icon={FaLock}
          placeholder="Create a new password"
          value={values.password}
          onChange={handleChange('password')}
          error={errors.password}
          autoComplete="new-password"
        />

        {values.password && (
          <div className="mt-2.5">
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: i < strength.score ? strength.color : '#E2E8F0',
                  }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs font-medium" style={{ color: strength.color }}>
              {strength.label}
            </p>
          </div>
        )}
      </div>

      <Input
        label="Confirm new password"
        type="password"
        name="confirmPassword"
        icon={FaLock}
        placeholder="Re-enter your new password"
        value={values.confirmPassword}
        onChange={handleChange('confirmPassword')}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
        Reset password
      </Button>
    </motion.form>
  );
}
