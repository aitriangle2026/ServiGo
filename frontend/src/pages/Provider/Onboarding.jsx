import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa';
import { providerService } from '@/services/providerService';
import { serviceService } from '@/services/serviceService';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    nicNumber: '',
    bio: '',
    experience: '',
    categories: [],
    city: '',
    district: '',
  });
  const [nicFrontImage, setNicFrontImage] = useState(null);
  const [nicBackImage, setNicBackImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    serviceService.getCategories().then((res) => setCategories(res.data || []));
  }, []);

  const toggleCategory = (id) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(id)
        ? f.categories.filter((c) => c !== id)
        : [...f.categories, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nicNumber.trim()) {
      setError('NIC number is required.');
      return;
    }

    if (!nicFrontImage || !nicBackImage) {
      setError('Please upload both the front and back of your NIC.');
      return;
    }

    setIsSaving(true);
    try {
      await providerService.createProfile({
        nicNumber: form.nicNumber,
        bio: form.bio,
        experience: Number(form.experience) || 0,
        categories: form.categories,
        workingArea: { city: form.city, district: form.district },
      });

      await providerService.uploadNicImages({ nicFrontImage, nicBackImage });

      // New profiles start in "draft" verification status — send them to
      // the checklist to finish earning points and submit, rather than the
      // dashboard, where they wouldn't be visible to any admin yet anyway.
      navigate('/provider/verification');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create your provider profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-lg">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg font-extrabold text-white">S</span>
          <span className="font-display text-xl font-extrabold text-secondary">ServiGo</span>
        </Link>

        <h1 className="font-display text-2xl font-extrabold text-secondary">Set up your provider profile</h1>
        <p className="mt-2 text-sm text-text-muted">
          Just a few details so customers know who they're booking.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <p className="rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">{error}</p>
          )}

          <Input
            label="NIC number"
            value={form.nicNumber}
            onChange={(e) => setForm((f) => ({ ...f, nicNumber: e.target.value }))}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-secondary">
                NIC front photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNicFrontImage(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
              />
              {nicFrontImage && (
                <p className="mt-1 text-xs text-success">{nicFrontImage.name} selected</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-secondary">
                NIC back photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNicBackImage(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
              />
              {nicBackImage && (
                <p className="mt-1 text-xs text-success">{nicBackImage.name} selected</p>
              )}
            </div>
          </div>

          <Input
            label="Bio"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
          <Input
            label="Years of experience"
            type="number"
            value={form.experience}
            onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
          />

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = form.categories.includes(cat._id);
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => toggleCategory(cat._id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-border text-text-muted hover:border-primary/40'
                  }`}
                >
                  {isSelected && <FaCheck size={11} />}
                  {cat.name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            <Input label="District" value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} />
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={isSaving}>
            Complete setup
          </Button>
        </form>
      </div>
    </div>
  );
}