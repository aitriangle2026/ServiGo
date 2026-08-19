import AuthLayout from '@/layouts/AuthLayout';
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';

export default function ForgotPassword() {
  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a 6-digit code to reset it."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
