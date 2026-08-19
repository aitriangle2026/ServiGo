import { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import useFetch from '@/hooks/useFetch';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import axios from '@/api/axios';
import { FaEdit, FaTrash } from 'react-icons/fa';

const categoryService = {
  getAll: async () => {
    const { data } = await axios.get('/categories');
    return data;
  },
  create: async (payload) => {
    const { data } = await axios.post('/categories', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await axios.put(`/categories/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    const { data } = await axios.delete(`/categories/${id}`);
    return data;
  },
};

const EMPTY_FORM = { name: '', description: '', icon: '' };

export default function AdminCategories() {
  const { data, isLoading, error, refetch } = useFetch(() => categoryService.getAll(), []);
  const categories = data?.data || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat._id);
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFormError('');
    try {
      if (editingId) {
        await categoryService.update(editingId, form);
      } else {
        await categoryService.create(form);
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Could not save this category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Services using it may be affected.')) return;
    try {
      await categoryService.remove(id);
      refetch();
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not delete this category.');
    }
  };

  return (
    <AdminLayout title="Categories">
      <div className="mb-6 flex justify-end">
        <Button variant="primary" onClick={openCreate}>Add Category</Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      {!error && !isLoading && categories.length === 0 && (
        <p className="text-sm text-text-muted">No categories yet.</p>
      )}

      {!error && !isLoading && categories.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase text-text-muted">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td className="px-5 py-3 font-medium text-secondary">{cat.name}</td>
                  <td className="px-5 py-3 text-text-muted">{cat.description || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      cat.isActive ? 'bg-success-light text-success' : 'bg-slate-100 text-text-muted'
                    }`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button variant="outline" size="sm" icon={FaEdit} onClick={() => openEdit(cat)}>Edit</Button>
                      <Button variant="danger" size="sm" icon={FaTrash} onClick={() => handleDelete(cat._id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          {formError && <p className="rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">{formError}</p>}
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Input label="Icon (optional)" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="e.g. icon name or emoji" />
          <Button variant="primary" fullWidth isLoading={isSaving} onClick={handleSave}>
            {editingId ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}