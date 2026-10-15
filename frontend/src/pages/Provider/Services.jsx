import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiChevronRight, FiMoreVertical, FiPackage, FiPauseCircle, FiUsers, FiCalendar, FiUpload } from 'react-icons/fi';
import { FaStar, FaTools } from 'react-icons/fa';
import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import { serviceService } from '@/services/serviceService';
import { formatCurrency } from '@/utils/formatCurrency';
import EmptyState from '@/components/common/EmptyState';
import Modal from '@/components/common/Modal';

const PLACEHOLDER_IMAGE = '/images/service-placeholder.jpg';
const EMPTY_FORM = { title: '', description: '', workDetails: '', duration: '', tags: '', price: '', priceType: 'fixed', category: '' };

const SORTS = [
  { key: 'newest', label: 'Newest', compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  { key: 'bookings', label: 'Most booked', compare: (a, b) => b.bookingCount - a.bookingCount },
  { key: 'rating', label: 'Top rated', compare: (a, b) => (b.averageRating || 0) - (a.averageRating || 0) },
  { key: 'price_low', label: 'Price: low to high', compare: (a, b) => (a.price || 0) - (b.price || 0) },
  { key: 'price_high', label: 'Price: high to low', compare: (a, b) => (b.price || 0) - (a.price || 0) },
];

const inputClass =
  'w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-secondary focus:border-primary focus:outline-none';

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className="flex shrink-0 items-center gap-2 disabled:opacity-60"
    >
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-border'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-soft transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      <span className={`text-[13px] ${checked ? 'font-medium text-secondary' : 'text-text-muted'}`}>{checked ? 'Active' : 'Inactive'}</span>
    </button>
  );
}

function CardMenu({ service, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="absolute right-3 top-3">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="More actions"
        aria-expanded={isOpen}
        className="grid h-9 w-9 place-items-center rounded-lg bg-surface/95 text-secondary shadow-soft hover:bg-surface"
      >
        <FiMoreVertical />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <ul className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-soft-lg">
            <li>
              <button type="button" onClick={() => { setIsOpen(false); onEdit(); }} className="block w-full px-4 py-2.5 text-left text-sm text-secondary hover:bg-surface-warm">
                Edit service
              </button>
            </li>
            <li>
              <Link to={`/services/${service._id}`} className="block px-4 py-2.5 text-sm text-secondary hover:bg-surface-warm">
                View public listing
              </Link>
            </li>
            <li>
              <button type="button" onClick={() => { setIsOpen(false); onDelete(); }} className="block w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-warm">
                Delete service
              </button>
            </li>
          </ul>
        </>
      )}
    </div>
  );
}

/** Create/edit form. Photos can only be added once the service exists (they upload to its id). */
function ServiceModal({ service, categories, onClose, onSaved }) {
  const isEdit = Boolean(service);
  const [form, setForm] = useState(() =>
    service
      ? {
          title: service.title,
          description: service.description,
          workDetails: service.workDetails || '',
          duration: service.duration || '',
          tags: service.tags?.join(', ') || '',
          price: service.price,
          priceType: service.priceType || 'fixed',
          category: service.category?._id || service.category || '',
        }
      : EMPTY_FORM
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [upload, setUpload] = useState({ kind: null, message: '', error: '' });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.category || !(Number(form.price) > 0)) {
      setError('Title, description, category and a price are required.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      if (isEdit) await serviceService.update(service._id, payload);
      else await serviceService.create(payload);
      toast.success(isEdit ? 'Service updated' : 'Service created — open it again to add photos');
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save this service.');
      setIsSaving(false);
    }
  };

  const handleUpload = (kind) => async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!isEdit || files.length === 0) return;
    setUpload({ kind, message: 'Uploading…', error: '' });
    try {
      if (kind === 'images') await serviceService.uploadImages(service._id, files);
      else await serviceService.uploadPortfolioImages(service._id, files);
      setUpload({ kind: null, message: kind === 'images' ? 'Service photos uploaded.' : 'Portfolio images uploaded.', error: '' });
      onSaved({ keepOpen: true });
    } catch (err) {
      setUpload({ kind: null, message: '', error: err?.response?.data?.message || 'Could not upload those images.' });
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Service' : 'Add New Service'} size="lg">
      <form onSubmit={handleSave} className="min-h-0 space-y-4 overflow-y-auto pr-1">
        {error && <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-secondary">Title</span>
          <input value={form.title} onChange={set('title')} placeholder="e.g. Tap Repair" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-secondary">Description</span>
          <textarea value={form.description} onChange={set('description')} rows={2} className={`${inputClass} resize-y`} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-secondary">Work details</span>
          <textarea value={form.workDetails} onChange={set('workDetails')} rows={3} placeholder="Describe the specific work, process, or scope" className={`${inputClass} resize-y`} />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-secondary">Category</span>
            <select value={form.category} onChange={set('category')} className={inputClass}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-secondary">Duration</span>
            <input value={form.duration} onChange={set('duration')} placeholder="e.g. 2-3 hours" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-secondary">Price (LKR)</span>
            <input type="number" min="1" value={form.price} onChange={set('price')} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-secondary">Pricing</span>
            <select value={form.priceType} onChange={set('priceType')} className={inputClass}>
              <option value="fixed">Fixed price</option>
              <option value="hourly">Per hour</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-secondary">Tags</span>
          <input value={form.tags} onChange={set('tags')} placeholder="e.g. plumbing, emergency, install" className={inputClass} />
        </label>

        {isEdit ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { kind: 'images', label: 'Main service photos', hint: 'Shown first on your card and listing.' },
              { kind: 'portfolio', label: 'Portfolio images', hint: 'Examples of past work.' },
            ].map((u) => (
              <label key={u.kind} className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-border p-4 text-center hover:border-primary">
                <FiUpload className="text-lg text-text-muted" />
                <span className="text-[13px] font-medium text-secondary">{upload.kind === u.kind ? 'Uploading…' : u.label}</span>
                <span className="text-xs text-text-muted">{u.hint}</span>
                <input type="file" multiple accept="image/*" onChange={handleUpload(u.kind)} disabled={upload.kind !== null} className="hidden" />
              </label>
            ))}
            {(upload.message || upload.error) && (
              <p className={`text-sm sm:col-span-2 ${upload.error ? 'text-danger' : 'text-success'}`}>{upload.error || upload.message}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-text-muted">You can add photos after creating the service.</p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-secondary hover:bg-surface-warm">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white hover:bg-primary disabled:opacity-60">
            {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create service'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProviderServices() {
  const { data, isLoading, error, refetch } = useFetch(() => serviceService.getMine(), []);
  const services = data?.data || [];

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('newest');
  const [editing, setEditing] = useState(null); // null | 'new' | service
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  // Optimistic Active/Inactive flips until the list reloads.
  const [activeOverrides, setActiveOverrides] = useState({});

  useEffect(() => {
    let cancelled = false;
    serviceService
      .getCategories()
      .then((res) => {
        if (!cancelled) setCategories(res.data || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isActive = (s) => activeOverrides[s._id] ?? s.isActive !== false;

  const activeCount = services.filter(isActive).length;
  const totalBookings = services.reduce((n, s) => n + s.bookingCount, 0);
  const reviewTotal = services.reduce((n, s) => n + (s.totalReviews || 0), 0);
  const averageRating = reviewTotal > 0 ? services.reduce((sum, s) => sum + (s.averageRating || 0) * (s.totalReviews || 0), 0) / reviewTotal : null;

  const stats = [
    { label: activeCount === 1 ? 'Active Service' : 'Active Services', value: activeCount, icon: FiPackage, tone: 'bg-success-light text-success', highlight: true },
    { label: services.length - activeCount === 1 ? 'Inactive Service' : 'Inactive Services', value: services.length - activeCount, icon: FiPauseCircle, tone: 'bg-amber-50 text-accent-hover' },
    { label: 'Total Bookings', value: totalBookings, icon: FiUsers, tone: 'bg-primary-light text-primary' },
    { label: averageRating ? `Average Rating (${reviewTotal} reviews)` : 'Average Rating', value: averageRating ? averageRating.toFixed(1) : '—', icon: FaStar, tone: 'bg-amber-50 text-accent' },
  ];

  const usedCategories = [...new Map(services.filter((s) => s.category?._id).map((s) => [s.category._id, s.category.name])).entries()];
  const needle = search.trim().toLowerCase();
  const visible = services
    .filter((s) => categoryFilter === 'all' || s.category?._id === categoryFilter)
    .filter((s) => statusFilter === 'all' || (statusFilter === 'active' ? isActive(s) : !isActive(s)))
    .filter((s) => !needle || [s.title, s.description, ...(s.tags || [])].some((f) => (f || '').toLowerCase().includes(needle)))
    .sort(SORTS.find((x) => x.key === sortKey).compare);

  const toggleActive = async (service) => {
    const next = !isActive(service);
    setActiveOverrides((o) => ({ ...o, [service._id]: next }));
    setTogglingId(service._id);
    try {
      await serviceService.update(service._id, { isActive: next });
      toast.success(next ? `"${service.title}" is live again` : `"${service.title}" is hidden from customers`);
    } catch (err) {
      setActiveOverrides((o) => ({ ...o, [service._id]: !next }));
      toast.error(err?.response?.data?.message || 'Could not change this service.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await serviceService.remove(deleteTarget._id);
      toast.success('Service deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete this service.');
    }
  };

  return (
    <ProviderLayout>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-text-muted">
        <Link to="/provider/dashboard" className="hover:text-secondary">
          Home
        </Link>
        <FiChevronRight className="text-[11px]" />
        <span className="text-secondary">My Services</span>
      </nav>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[2.4rem] font-medium leading-tight text-secondary sm:text-5xl">My Services</h1>
          <p className="mt-2 text-[15px] text-text-muted">Manage the services you offer, update details, and control availability.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="flex shrink-0 items-center gap-2 self-start rounded-xl bg-secondary px-5 py-3 text-sm font-medium text-white hover:bg-primary sm:self-auto"
        >
          <FiPlus /> Add New Service
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`flex items-center gap-4 rounded-2xl border p-5 ${stat.highlight ? 'border-primary/30 bg-primary-light/50' : 'border-border bg-surface'}`}
          >
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl ${stat.tone}`}>
              <stat.icon />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-medium text-secondary">{isLoading ? '—' : stat.value}</p>
              <p className="truncate text-sm text-text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 lg:flex-row lg:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-surface-warm px-4 py-2.5">
          <FiSearch className="shrink-0 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your services…"
            aria-label="Search your services"
            className="w-full bg-transparent text-[13px] text-secondary placeholder:text-text-muted focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Category" className="rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-secondary focus:border-primary focus:outline-none">
            <option value="all">All Categories</option>
            {usedCategories.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status" className="rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-secondary focus:border-primary focus:outline-none">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label="Sort by" className="rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-secondary focus:border-primary focus:outline-none">
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                Sort by: {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="mt-5 rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">{error}</div>}

      {!error && isLoading && (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-surface-warm" />
          ))}
        </div>
      )}

      {!error && !isLoading && services.length === 0 && (
        <div className="mt-5">
          <EmptyState icon={<FaTools size={22} />} title="No services listed yet" description="Add your first service so customers can find and book you." actionLabel="Add Service" onAction={() => setEditing('new')} />
        </div>
      )}

      {!error && !isLoading && services.length > 0 && visible.length === 0 && (
        <p className="mt-5 rounded-2xl border border-border bg-surface p-8 text-center text-sm text-text-muted">No services match these filters.</p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {visible.map((service) => {
          const active = isActive(service);
          return (
            <article key={service._id} className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface ${active ? '' : 'opacity-80'}`}>
              <div className="relative aspect-[16/7] bg-surface-warm">
                <img src={service.images?.[0] || service.portfolioImages?.[0] || PLACEHOLDER_IMAGE} alt="" className={`h-full w-full object-cover ${active ? '' : 'grayscale'}`} />
                <CardMenu service={service} onEdit={() => setEditing(service)} onDelete={() => { setDeleteError(''); setDeleteTarget(service); }} />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[17px] font-medium text-secondary">{service.title}</h3>
                    <p className="text-[13px] text-text-muted">{service.category?.name || 'Uncategorised'}</p>
                  </div>
                  <Toggle checked={active} onChange={() => toggleActive(service)} disabled={togglingId === service._id} label={`${service.title} active`} />
                </div>
                <p className="mt-2 font-medium text-secondary">
                  From {formatCurrency(service.price)}
                  {service.priceType === 'hourly' && <span className="font-normal text-text-muted"> / hr</span>}
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-text-muted">
                  {service.totalReviews > 0 ? (
                    <span className="flex items-center gap-1">
                      <FaStar className="text-accent" />
                      <span className="text-secondary">{service.averageRating.toFixed(1)}</span> ({service.totalReviews} reviews)
                    </span>
                  ) : (
                    <span>No reviews yet</span>
                  )}
                  <span className="flex items-center gap-1">
                    <FiCalendar /> {service.bookingCount} {service.bookingCount === 1 ? 'booking' : 'bookings'}
                  </span>
                </p>
                {service.portfolioImages?.length > 0 && (
                  <div className="mt-3 flex gap-1.5">
                    {service.portfolioImages.slice(0, 4).map((image) => (
                      <img key={image} src={image} alt="" className="h-10 w-10 rounded-md object-cover" />
                    ))}
                    {service.portfolioImages.length > 4 && (
                      <span className="grid h-10 w-10 place-items-center rounded-md bg-surface-warm text-xs text-text-muted">+{service.portfolioImages.length - 4}</span>
                    )}
                  </div>
                )}
                <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                  <button type="button" onClick={() => setEditing(service)} className="rounded-lg border border-border py-2.5 text-[13px] font-medium text-secondary hover:border-primary hover:text-primary">
                    Edit
                  </button>
                  <Link to={`/services/${service._id}`} className="rounded-lg bg-primary-light py-2.5 text-center text-[13px] font-medium text-primary hover:bg-primary hover:text-white">
                    View Details
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {editing && (
        <ServiceModal
          key={editing === 'new' ? 'new' : editing._id}
          service={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={({ keepOpen } = {}) => {
            if (!keepOpen) setEditing(null);
            setActiveOverrides({});
            refetch();
          }}
        />
      )}

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete this service?" size="sm">
        <p className="text-sm leading-relaxed text-text-muted">
          "{deleteTarget?.title}" will be removed permanently. If you might offer it again, set it to Inactive instead.
        </p>
        {deleteError && <p className="mt-3 rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{deleteError}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-secondary hover:bg-surface-warm">
            Keep it
          </button>
          <button type="button" onClick={handleDelete} className="rounded-xl bg-danger px-4 py-3 text-sm font-medium text-white hover:opacity-90">
            Delete
          </button>
        </div>
      </Modal>
    </ProviderLayout>
  );
}
