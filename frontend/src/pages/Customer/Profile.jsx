import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import CustomerLayout from '@/layouts/CustomerLayout';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { userService } from '@/services/userService';
import { FaEnvelope, FaShieldAlt } from 'react-icons/fa';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    city: user?.preferredLocation?.city || '',
    district: user?.preferredLocation?.district || '',
    country: user?.preferredLocation?.country || 'Sri Lanka',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setIsSaving(true);
    try {
      const { data } = await userService.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        preferredLocation: {
          city: form.city,
          district: form.district,
          country: form.country,
        },
      });
      updateUser(data);
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

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
            <p className="flex items-center gap-1.5 text-sm text-text-muted">
              <FaEnvelope size={11} /> {user?.email}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs capitalize text-text-muted">
              <FaShieldAlt size={11} /> {user?.role} account
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 border-t border-border pt-5">
          {error && (
            <p className="rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">{error}</p>
          )}
          {saved && (
            <p className="rounded-xl border border-success/20 bg-success-light p-3 text-sm text-success">
              Profile updated.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" value={form.firstName} onChange={handleChange('firstName')} />
            <Input label="Last name" value={form.lastName} onChange={handleChange('lastName')} />
          </div>

          <Input label="Phone" value={form.phone} onChange={handleChange('phone')} />

          <div>
            <p className="mb-1.5 text-sm font-semibold text-secondary">Your location</p>
            <p className="mb-3 text-xs text-text-muted">
              Used to show you nearby services and providers first when you search.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="City" value={form.city} onChange={handleChange('city')} placeholder="e.g. Colombo" />
              <Input label="District" value={form.district} onChange={handleChange('district')} placeholder="e.g. Colombo" />
            </div>
            <div className="mt-4">
              <Input label="Country" value={form.country} onChange={handleChange('country')} />
            </div>
          </div>

          <Button type="submit" variant="primary" isLoading={isSaving}>
            Save changes
          </Button>
        </form>
      </div>
    </CustomerLayout>
  );
}