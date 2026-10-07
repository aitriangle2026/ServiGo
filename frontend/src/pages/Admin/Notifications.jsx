import AdminLayout from '@/layouts/AdminLayout';
import NotificationsPanel from '@/components/notifications/NotificationsPanel';

export default function AdminNotifications() {
  return (
    <AdminLayout title="Notifications">
      <NotificationsPanel />
    </AdminLayout>
  );
}
