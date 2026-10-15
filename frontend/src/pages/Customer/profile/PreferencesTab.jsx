import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userService';
import { Field, Notice, Panel, SaveButton } from './fields';
import { inputClass } from './inputClass';

/** Location preference (ranks nearby results first) + a pointer to notification settings. */
export default function PreferencesTab() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(() => ({
    city: user?.preferredLocation?.city || '',
    district: user?.preferredLocation?.district || '',
    country: user?.preferredLocation?.country || 'Sri Lanka',
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setSaved(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const { data } = await userService.updateProfile({ preferredLocation: form });
      updateUser(data);
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save your preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel title="Your location" description="Used to show you nearby services and professionals first.">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Notice>{error}</Notice>}
          {saved && <Notice tone="success">Location saved.</Notice>}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="City">
              <input value={form.city} onChange={set('city')} placeholder="e.g. Colombo" className={inputClass} />
            </Field>
            <Field label="District">
              <input value={form.district} onChange={set('district')} placeholder="e.g. Colombo" className={inputClass} />
            </Field>
            <Field label="Country">
              <input value={form.country} onChange={set('country')} className={inputClass} />
            </Field>
          </div>
          <div className="flex justify-end">
            <SaveButton isSaving={isSaving}>Save location</SaveButton>
          </div>
        </form>
      </Panel>

      <Link
        to="/customer/notifications"
        className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-warm text-secondary">
          <FiBell />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-secondary">Notification settings</p>
          <p className="text-[13px] text-text-muted">Choose which updates you get — bookings, messages, payments, reviews.</p>
        </div>
        <FiArrowRight className="shrink-0 text-secondary" />
      </Link>
    </div>
  );
}
