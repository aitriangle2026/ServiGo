import { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import useFetch from '@/hooks/useFetch';
import Button from '@/components/common/Button';
import axios from '@/api/axios';

const adminUserService = {
  getAll: async (params) => {
    const { data } = await axios.get('/users', { params });
    return data;
  },
  updateStatus: async (id, isActive) => {
    const { data } = await axios.put(`/users/${id}/status`, { isActive });
    return data;
  },
};

const ROLE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Customers', value: 'customer' },
  { label: 'Providers', value: 'provider' },
  { label: 'Admins', value: 'admin' },
];

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const { data, isLoading, error, refetch } = useFetch(
    () => adminUserService.getAll({ role: roleFilter || undefined, search: search || undefined, limit: 50 }),
    [roleFilter, search]
  );

  const users = data?.data || [];

  const handleToggleStatus = async (user) => {
    setProcessingId(user._id);
    try {
      await adminUserService.updateStatus(user._id, !user.isActive);
      refetch();
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not update user status.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout title="Users">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRoleFilter(r.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                roleFilter === r.value
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-text-muted hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto rounded-xl border border-border bg-surface px-4 py-2 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      {!error && !isLoading && users.length === 0 && (
        <p className="text-sm text-text-muted">No users found.</p>
      )}

      {!error && !isLoading && users.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase text-text-muted">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-5 py-3 font-medium text-secondary">{u.firstName} {u.lastName}</td>
                  <td className="px-5 py-3 text-text-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-text-muted">
                    {new Date(u.createdAt).toLocaleDateString('en-LK')}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.isActive ? 'bg-success-light text-success' : 'bg-danger-light text-danger'
                    }`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant={u.isActive ? 'danger' : 'primary'}
                      size="sm"
                      isLoading={processingId === u._id}
                      onClick={() => handleToggleStatus(u)}
                    >
                      {u.isActive ? 'Suspend' : 'Reactivate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}