import { useState, useEffect } from 'react';
import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import { providerService } from '@/services/providerService';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

export default function ProviderProfile() {
  const { data, isLoading, error, refetch } = useFetch(() => providerService.getMyProfile(), []);
  const [form, setForm] = useState({ bio: '', experience: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.data) {
      setForm({ bio: data.data.bio || '', experience: data.data.experience || '' });
    }
  }, [data]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      await providerService.updateProfile({ ...form, experience: Number(form.experience) });
      setSaved(true);
      refetch();
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ProviderLayout title="Profile"><p className="text-sm text-text-muted">Loading…</p></ProviderLayout>;
  }

  // Backend returns 404 if no ProviderProfile has been created yet
  if (error) {
    return (
      <ProviderLayout title="Profile">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-text-muted">
            You haven't set up your provider profile yet. This usually happens automatically during
            provider onboarding — if you're seeing this, the onboarding step may not be complete.
          </p>
        </div>
      </ProviderLayout>
    );
  }

  const profile = data?.data;

  return (
    <ProviderLayout title="Profile">
      <div className="max-w-lg rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-4">
          <img
            src={profile?.profileImage || `https://ui-avatars.com/api/?name=${profile?.user?.firstName}+${profile?.user?.lastName}&background=EFF6FF&color=2563EB`}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
          <div>
            <p className="font-display text-lg font-bold text-secondary">
              {profile?.user?.firstName} {profile?.user?.lastName}
            </p>
            <p className="text-sm text-text-muted">
              {profile?.isVerified ? 'Verified provider' : `Verification: ${profile?.verificationStatus}`}
            </p>
          </div>
        </div>

        {saveError && <p className="mb-4 rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">{saveError}</p>}
        {saved && <p className="mb-4 rounded-xl border border-success/20 bg-success-light p-3 text-sm text-success">Profile updated.</p>}

        <div className="space-y-4">
          <Input label="Bio" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          <Input label="Years of experience" type="number" value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} />
          <Button variant="primary" isLoading={isSaving} onClick={handleSave}>Save changes</Button>
        </div>
      </div>
    </ProviderLayout>
  );
}