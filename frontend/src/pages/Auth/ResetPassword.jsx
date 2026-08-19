import AuthLayout from '@/layouts/AuthLayout';
import ResetPasswordForm from '@/components/forms/ResetPasswordForm';

export default function ResetPassword() {
  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password you haven't used before.">
      <ResetPasswordForm />
    </AuthLayout>
  );
}
