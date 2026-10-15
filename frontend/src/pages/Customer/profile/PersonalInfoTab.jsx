import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userService';
import { Field, Notice, Panel, SaveButton } from './fields';
import { inputClass } from './inputClass';

const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

const BIO_LIMIT = 300;

// <input type="date"> wants YYYY-MM-DD in local time.
const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function PersonalInfoTab({ firstNameRef }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(() => ({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    dateOfBirth: toDateInput(user?.dateOfBirth),
    gender: user?.gender || '',
    bio: user?.bio || '',
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
    setSaved(false);
    if (!form.firstName.trim() || !form.phone.trim()) {
      setError('First name and phone number are required.');
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await userService.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender,
        bio: form.bio.trim(),
      });
      updateUser(data);
      setSaved(true);
    } catch (err) {
      const message = err?.response?.data?.message || '';
      // Phone numbers are unique per account.
      setError(/duplicate|E11000/i.test(message) ? 'That phone number is already used by another account.' : message || 'Could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Panel title="Personal Information" description="Keep your personal details up to date.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Notice>{error}</Notice>}
        {saved && <Notice tone="success">Your profile has been updated.</Notice>}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="First Name">
            <input ref={firstNameRef} value={form.firstName} onChange={set('firstName')} className={inputClass} />
          </Field>
          <Field label="Last Name">
            <input value={form.lastName} onChange={set('lastName')} className={inputClass} />
          </Field>

          <Field label="Email Address" hint="Your email is your login and can't be changed here.">
            <input value={user?.email || ''} disabled className={inputClass} />
          </Field>
          <Field label="Phone Number">
            <div className="flex overflow-hidden rounded-xl border border-border bg-surface focus-within:border-primary">
              <span className="flex shrink-0 items-center border-r border-border bg-surface-warm px-3 text-sm text-text-muted">
                🇱🇰
              </span>
              <input
                value={form.phone}
                onChange={set('phone')}
                inputMode="tel"
                placeholder="+94 77 123 4567"
                className="w-full bg-transparent px-4 py-3 text-sm text-secondary placeholder:text-text-muted focus:outline-none"
              />
            </div>
          </Field>

          <Field label="Date of Birth (optional)">
            <input
              type="date"
              value={form.dateOfBirth}
              max={toDateInput(new Date())}
              onChange={set('dateOfBirth')}
              className={inputClass}
            />
          </Field>

          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium text-secondary">Gender (optional)</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2 py-3">
              {GENDERS.map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-secondary">
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={form.gender === option.value}
                    onChange={set('gender')}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  {option.label}
                </label>
              ))}
              {form.gender && (
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, gender: '' }))}
                  className="text-xs text-text-muted underline hover:text-secondary"
                >
                  Clear
                </button>
              )}
            </div>
          </fieldset>
        </div>

        <Field label="Profile Bio (optional)" hint={`${form.bio.length}/${BIO_LIMIT}`}>
          <textarea
            value={form.bio}
            onChange={set('bio')}
            maxLength={BIO_LIMIT}
            rows={3}
            placeholder="A line or two about you — shown only to you for now."
            className={`${inputClass} resize-y`}
          />
        </Field>

        <div className="flex justify-end">
          <SaveButton isSaving={isSaving} />
        </div>
      </form>
    </Panel>
  );
}
