import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaTools, FaUserCircle } from 'react-icons/fa';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import GoogleLoginButton from '@/components/common/GoogleLoginButton';
import { useAuth } from '@/context/AuthContext';
import { isValidEmail, isValidPhone, isStrongPassword, validateFields } from '@/utils/validators';

const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

const ROLES = [
  { id: 'customer', label: 'Customer', description: 'Book trusted services near you', icon: FaUserCircle },
  { id: 'provider', label: 'Provider', description: 'List your services and earn', icon: FaTools },
];

export default function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(initialValues);
  const [role, setRole] = useState('customer');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const runValidation = () => {
    const fieldErrors = validateFields(values, {
      firstName: (v) => (!v.trim() ? 'First name is required' : null),
      lastName: (v) => (!v.trim() ? 'Last name is required' : null),
      email: (v) => {
        if (!v) return 'Email is required';
        if (!isValidEmail(v)) return 'Enter a valid email address';
        return null;
      },
      phone: (v) => {
        if (!v) return 'Phone number is required';
        if (!isValidPhone(v)) return 'Enter a valid Sri Lankan phone number';
        return null;
      },
      password: (v) => {
        if (!v) return 'Password is required';
        if (!isStrongPassword(v))
          return 'Min 8 characters, with uppercase, lowercase and a number';
        return null;
      },
      confirmPassword: (v, all) => {
        if (!v) return 'Please confirm your password';
        if (v !== all.password) return 'Passwords do not match';
        return null;
      },
    });
    if (!agreedToTerms) fieldErrors.terms = 'You must accept the Terms & Conditions';
    return fieldErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const validationErrors = runValidation();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      const { confirmPassword, ...payload } = values;
      await register({ ...payload, role });
      navigate('/login', { state: { justRegistered: true } });
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
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

      {/* Role selection */}
      <div>
        <p className="mb-2 text-sm font-semibold text-secondary">I want to</p>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-colors ${
                  isSelected ? 'border-primary bg-primary-light' : 'border-border bg-surface hover:border-primary/40'
                }`}
              >
                <Icon className={isSelected ? 'text-primary' : 'text-text-muted'} size={20} />
                <span className="text-sm font-bold text-secondary">{r.label}</span>
                <span className="text-xs text-text-muted">{r.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          name="firstName"
          icon={FaUser}
          placeholder="Nadeesha"
          value={values.firstName}
          onChange={handleChange('firstName')}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <Input
          label="Last name"
          name="lastName"
          icon={FaUser}
          placeholder="Perera"
          value={values.lastName}
          onChange={handleChange('lastName')}
          error={errors.lastName}
          autoComplete="family-name"
        />
      </div>

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
        label="Phone number"
        type="tel"
        name="phone"
        icon={FaPhone}
        placeholder="07X XXX XXXX"
        value={values.phone}
        onChange={handleChange('phone')}
        error={errors.phone}
        autoComplete="tel"
      />

      <Input
        label="Password"
        type="password"
        name="password"
        icon={FaLock}
        placeholder="Create a password"
        value={values.password}
        onChange={handleChange('password')}
        error={errors.password}
        autoComplete="new-password"
      />

      <Input
        label="Confirm password"
        type="password"
        name="confirmPassword"
        icon={FaLock}
        placeholder="Re-enter your password"
        value={values.confirmPassword}
        onChange={handleChange('confirmPassword')}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-secondary">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => {
              setAgreedToTerms(e.target.checked);
              if (errors.terms) setErrors((er) => ({ ...er, terms: undefined }));
            }}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span>
            I agree to ServiGo's{' '}
            <Link to="/terms" className="font-semibold text-primary hover:text-primary-hover">
              Terms & Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-semibold text-primary hover:text-primary-hover">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.terms && <p className="mt-1.5 text-sm text-danger">{errors.terms}</p>}
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
        Create account
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleLoginButton label="Sign up with Google" onClick={handleGoogleSignUp} isLoading={isGoogleLoading} />

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
          Log in
        </Link>
      </p>
    </motion.form>
  );
}
