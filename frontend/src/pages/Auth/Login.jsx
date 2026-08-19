import AuthLayout from '@/layouts/AuthLayout';
import LoginForm from '@/components/forms/LoginForm';

export default function Login() {
  return (
    <AuthLayout title="Welcome back" subtitle="Log in to book services or manage your jobs.">
      <LoginForm />
    </AuthLayout>
  );
}
