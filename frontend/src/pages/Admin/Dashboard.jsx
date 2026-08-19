import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import useFetch from '@/hooks/useFetch';
import { providerService } from '@/services/providerService';
import Button from '@/components/common/Button';
import { FaUserCheck } from 'react-icons/fa';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data } = useFetch(() => providerService.getPending(), []);
  const pendingCount = data?.data?.length || 0;

  return (
    <AdminLayout title="Overview">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Pending Verifications</span>
            <FaUserCheck className="text-accent" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-secondary">{pendingCount}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border bg-primary-light p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-[15px] font-bold text-secondary">Review provider applications</p>
          <p className="text-sm text-text-muted">Approve or reject pending provider verifications.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/admin/providers')}>
          Review Now
        </Button>
      </div>
    </AdminLayout>
  );
}