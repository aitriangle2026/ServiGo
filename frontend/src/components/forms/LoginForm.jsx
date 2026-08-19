import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import GoogleLoginButton from '@/components/common/GoogleLoginButton';
import { useAuth } from '@/context/AuthContext';
import { isValidEmail, validateFields } from '@/utils/validators';

const initialValues = { email: '', password: '' };

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(initialValues);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const runValidation = () =>
    validateFields(values, {
      email: (v) => {
        if (!v) return 'Email is required';
        if (!isValidEmail(v)) return 'Enter a valid email address';
        return null;
      },
      password: (v) => (!v ? 'Password is required' : null),
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const validationErrors = runValidation();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      const data = await login({ ...values, rememberMe });
      const role = data?.user?.role;
      if (role === 'provider') navigate('/provider/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
      else navigate('/customer/dashboard');
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    // Backend team wires the actual Google OAuth SDK; this fires once we have an idToken.
    setIsGoogleLoading(false);
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
        value={values.email}
        onChange={handleChange('email')}
        error={errors.email}
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        name="password"
        icon={FaLock}
        placeholder="Enter your password"
        value={values.password}
        onChange={handleChange('password')}
        error={errors.password}
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Remember me
        </label>
        <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:text-primary-hover">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
        Log in
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleLoginButton onClick={handleGoogleLogin} isLoading={isGoogleLoading} />

      <p className="text-center text-sm text-text-muted">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">
          Sign up
        </Link>
      </p>
    </motion.form>
  );
}
