import ProviderLayout from '@/layouts/ProviderLayout';
import NotificationsPanel from '@/components/notifications/NotificationsPanel';

export default function ProviderNotifications() {
  return (
    <ProviderLayout title="Notifications">
      <NotificationsPanel />
    </ProviderLayout>
  );
}
