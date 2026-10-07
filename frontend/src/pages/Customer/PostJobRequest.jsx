import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '@/layouts/CustomerLayout';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { jobRequestService } from '@/services/jobRequestService';
import { serviceService } from '@/services/serviceService';
import { useAuth } from '@/context/AuthContext';
import { useCountry } from '@/context/CountryContext';

export default function PostJobRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCountry } = useCountry();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category: '',
    description: '',
    city: user?.preferredLocation?.city || '',
    district: user?.preferredLocation?.district || '',
    preferredDate: '',
    preferredTime: '',
    budget: '',
  });
  const [files, setFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    serviceService.getCategories().then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.category || !form.description.trim()) {
      setError('Please pick a category and describe what you need done.');
      return;
    }

    setIsSaving(true);
    try {
      // Country isn't part of the form state — it's fixed to the user's own
      // country (the field is read-only) and drives the backend's
      // country-scoped provider matching.
      const res = await jobRequestService.create({ ...form, country: selectedCountry }, files);
      navigate(`/customer/job-requests/${res.data._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not post your job request.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CustomerLayout title="Post a Job Request">
      <div className="mx-auto max-w-xl">
        <p className="mb-6 text-sm text-text-muted">
          Describe the job once — relevant providers in your country will see it and send you quotes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">{error}</p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-secondary">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="" disabled>Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-secondary">What do you need done?</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="Describe the job — the more detail, the better the quotes."
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-secondary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            <Input label="District" value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} />
          </div>

          <Input label="Country" value={selectedCountry} readOnly disabled />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preferred date (optional)"
              type="date"
              value={form.preferredDate}
              onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
            />
            <Input
              label="Preferred time (optional)"
              value={form.preferredTime}
              onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))}
              placeholder="e.g. Morning, 2-4pm"
            />
          </div>

          <Input
            label="Budget (optional)"
            type="number"
            value={form.budget}
            onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            placeholder="Leave blank if you'd rather see quotes first"
          />

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-secondary">Attachments (optional)</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
            />
            {files.length > 0 && <p className="mt-1 text-xs text-success">{files.length} file(s) selected</p>}
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={isSaving}>
            Post job request
          </Button>
        </form>
      </div>
    </CustomerLayout>
  );
}