import AuthLayout from '@/layouts/AuthLayout';
import RegisterForm from '@/components/forms/RegisterForm';

export default function Register() {
  return (
    <AuthLayout title="Create your account" subtitle="Join ServiGo as a customer or a service provider.">
      <RegisterForm />
    </AuthLayout>
  );
}
