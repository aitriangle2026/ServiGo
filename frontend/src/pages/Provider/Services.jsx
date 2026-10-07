import { useState, useEffect } from 'react';
import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import { providerService } from '@/services/providerService';
import { serviceService } from '@/services/serviceService';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import EmptyState from '@/components/common/EmptyState';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';
import { FaTools, FaTrash, FaEdit } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

const EMPTY_FORM = { title: '', description: '', workDetails: '', duration: '', tags: '', price: '', priceType: 'fixed', category: '' };

export default function ProviderServices() {
  const { user } = useAuth();
  const [providerProfileId, setProviderProfileId] = useState(null);

  const { data, isLoading, error, refetch } = useFetch(
    () => {
      if (!providerProfileId) return Promise.resolve({ data: [] });
      return serviceService.search({ provider: providerProfileId, limit: 50 });
    },
    [providerProfileId]
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileRes = await providerService.getMyProfile();
        const profileId = profileRes?.data?._id || profileRes?._id;
        setProviderProfileId(profileId || null);
      } catch {
        setProviderProfileId(null);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  const allServices = Array.isArray(data)
    ? data
    : data?.services ?? data?.results ?? data?.data ?? [];
  const services = allServices.filter((s) => s.provider?._id === providerProfileId || s.provider?.user?._id === user?._id);

  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [portfolioUploadState, setPortfolioUploadState] = useState({ isUploading: false, message: '' });
  const [portfolioUploadError, setPortfolioUploadError] = useState('');
  const [imageUploadState, setImageUploadState] = useState({ isUploading: false, message: '' });
  const [imageUploadError, setImageUploadError] = useState('');

  useEffect(() => {
    serviceService.getCategories().then((res) => setCategories(res.data || []));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setPortfolioUploadError('');
    setPortfolioUploadState({ isUploading: false, message: '' });
    setIsModalOpen(true);
  };

  const openEdit = (service) => {
    setEditingId(service._id);
    setForm({
      title: service.title,
      description: service.description,
      workDetails: service.workDetails || '',
      duration: service.duration || '',
      tags: service.tags?.join(', ') || '',
      price: service.price,
      priceType: service.priceType,
      category: service.category?._id || service.category,
    });
    setFormError('');
    setPortfolioUploadError('');
    setPortfolioUploadState({ isUploading: false, message: '' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        tags: form.tags
          ? form.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      };
      if (editingId) {
        await serviceService.update(editingId, payload);
      } else {
        await serviceService.create(payload);
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Could not save this service.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePortfolioUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!editingId || files.length === 0) return;

    setPortfolioUploadState({ isUploading: true, message: 'Uploading portfolio images...' });
    setPortfolioUploadError('');

    try {
      await serviceService.uploadPortfolioImages(editingId, files);
      setPortfolioUploadState({ isUploading: false, message: 'Portfolio images uploaded successfully.' });
      refetch();
    } catch (err) {
      setPortfolioUploadState({ isUploading: false, message: '' });
      setPortfolioUploadError(err?.response?.data?.message || 'Could not upload portfolio images.');
    } finally {
      e.target.value = '';
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!editingId || files.length === 0) return;

    setImageUploadState({ isUploading: true, message: 'Uploading service photos...' });
    setImageUploadError('');

    try {
      await serviceService.uploadImages(editingId, files);
      setImageUploadState({ isUploading: false, message: 'Service photos uploaded successfully.' });
      refetch();
    } catch (err) {
      setImageUploadState({ isUploading: false, message: '' });
      setImageUploadError(err?.response?.data?.message || 'Could not upload service photos.');
    } finally {
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this service listing?')) return;
    await serviceService.remove(id);
    refetch();
  };

  return (
    <ProviderLayout title="My Services">
      <div className="mb-6 flex justify-end">
        <Button variant="primary" onClick={openCreate}>Add Service</Button>
      </div>

      {error && <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">{error}</div>}
      {!error && isLoading && <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)}</div>}

      {!error && !isLoading && services.length === 0 && (
        <EmptyState icon={<FaTools size={22} />} title="No services listed yet" description="Add your first service so customers can find and book you." actionLabel="Add Service" onAction={openCreate} />
      )}

      {!error && !isLoading && services.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {services.map((s) => (
            <div key={s._id} className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="font-display text-[15px] font-bold text-secondary">{s.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-text-muted">{s.description}</p>
              <p className="mt-3 font-display text-lg font-extrabold text-secondary">
                LKR {s.price?.toLocaleString()} {s.priceType === 'hourly' && <span className="text-sm font-normal text-text-muted">/hr</span>}
              </p>
              {s.portfolioImages?.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {s.portfolioImages.slice(0, 3).map((image, index) => (
                    <img key={`${s._id}-${index}`} src={image} alt={`${s.title} portfolio ${index + 1}`} className="h-16 w-full rounded-lg object-cover" />
                  ))}
                </div>
              )}
              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <Button variant="outline" size="sm" icon={FaEdit} onClick={() => openEdit(s)}>Edit</Button>
                <Button variant="danger" size="sm" icon={FaTrash} onClick={() => handleDelete(s._id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Service' : 'Add Service'}>
        <div className="space-y-4">
          {formError && <p className="rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">{formError}</p>}
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-secondary">Work details</label>
            <textarea
              value={form.workDetails}
              onChange={(e) => setForm((f) => ({ ...f, workDetails: e.target.value }))}
              rows="4"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Describe the specific work, process, or scope"
            />
          </div>
          <Input label="Duration" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="e.g. 2-3 hours" />
          <Input label="Tags" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="e.g. plumbing, emergency, install" />

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-secondary">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          {editingId && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-secondary">Main service photos</label>
              <p className="mb-2 text-xs text-text-muted">These show first on your service card and listing.</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {imageUploadState.isUploading && <p className="mt-2 text-sm text-text-muted">{imageUploadState.message}</p>}
              {imageUploadState.message && !imageUploadState.isUploading && <p className="mt-2 text-sm text-success">{imageUploadState.message}</p>}
              {imageUploadError && <p className="mt-2 text-sm text-danger">{imageUploadError}</p>}
            </div>
          )}
          
          {editingId && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-secondary">Portfolio images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePortfolioUpload}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {portfolioUploadState.isUploading && <p className="mt-2 text-sm text-text-muted">{portfolioUploadState.message}</p>}
              {portfolioUploadState.message && !portfolioUploadState.isUploading && <p className="mt-2 text-sm text-success">{portfolioUploadState.message}</p>}
              {portfolioUploadError && <p className="mt-2 text-sm text-danger">{portfolioUploadError}</p>}
            </div>
          )}

          <Input label="Price (LKR)" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          <Button variant="primary" fullWidth isLoading={isSaving} onClick={handleSave}>
            {editingId ? 'Save changes' : 'Create service'}
          </Button>
        </div>
      </Modal>
    </ProviderLayout>
  );
}