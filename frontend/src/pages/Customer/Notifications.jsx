import CustomerLayout from '@/layouts/CustomerLayout';
import NotificationsPanel from '@/components/notifications/NotificationsPanel';

export default function CustomerNotifications() {
  return (
    <CustomerLayout title="Notifications">
      <NotificationsPanel />
    </CustomerLayout>
  );
}
