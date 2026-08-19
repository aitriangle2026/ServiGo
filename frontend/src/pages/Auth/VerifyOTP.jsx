import AuthLayout from '@/layouts/AuthLayout';
import VerifyOTPForm from '@/components/forms/VerifyOTPForm';

export default function VerifyOTP() {
  return (
    <AuthLayout title="Verify your email" subtitle="Enter the verification code to continue.">
      <VerifyOTPForm />
    </AuthLayout>
  );
}
