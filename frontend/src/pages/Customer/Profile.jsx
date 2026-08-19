import { useAuth } from '@/context/AuthContext';
import CustomerLayout from '@/layouts/CustomerLayout';
import { FaUser, FaEnvelope, FaPhone, FaShieldAlt } from 'react-icons/fa';

export default function Profile() {
  const { user } = useAuth();

  const fields = [
    { icon: FaUser, label: 'Full name', value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() },
    { icon: FaEnvelope, label: 'Email', value: user?.email },
    { icon: FaPhone, label: 'Phone', value: user?.phone },
    { icon: FaShieldAlt, label: 'Account type', value: user?.role },
  ];

  return (
    <CustomerLayout title="Profile">
      <div className="max-w-lg rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-light font-display text-2xl font-bold text-primary">
            {user?.firstName?.[0]}
          </div>
          <div>
            <p className="font-display text-lg font-bold text-secondary">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4 border-t border-border pt-5">
          {fields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.label} className="flex items-center gap-3">
                <Icon className="text-primary" />
                <div>
                  <p className="text-xs text-text-muted">{field.label}</p>
                  <p className="text-sm font-medium text-secondary">{field.value || '—'}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-text-muted">
          Profile editing isn't available yet — the backend doesn't currently expose a
          general update-profile endpoint for customer accounts.
        </p>
      </div>
    </CustomerLayout>
  );
}