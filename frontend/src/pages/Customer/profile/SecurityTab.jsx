import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userService';
import { Field, Notice, Panel, SaveButton } from './fields';
import { inputClass } from './inputClass';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function SecurityTab() {
  const { replaceTokens, logout } = useAuth();
  const [form, setForm] = useState(EMPTY);
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
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("The new passwords don't match.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await userService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      replaceTokens(response.data);
      setForm(EMPTY);
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not change your password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel title="Change password" description="Other devices are signed out when you change it.">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Notice>{error}</Notice>}
          {saved && <Notice tone="success">Password changed.</Notice>}
          <Field label="Current password">
            <input
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={set('currentPassword')}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="New password" hint="At least 6 characters.">
              <input
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={set('newPassword')}
                className={inputClass}
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <SaveButton isSaving={isSaving}>Update password</SaveButton>
          </div>
        </form>
      </Panel>

      <Panel title="Sessions" description="Sign out of ServiGo on this device.">
        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-secondary hover:border-danger hover:text-danger"
        >
          Log out
        </button>
      </Panel>
    </div>
  );
}
