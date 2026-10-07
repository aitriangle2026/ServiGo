import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import AdminLayout from '@/layouts/AdminLayout';
import useFetch from '@/hooks/useFetch';
import SupportChatPanel from '@/components/support/SupportChatPanel';
import { supportService } from '@/services/supportService';

export default function AdminSupportChatRoom() {
  const { conversationId } = useParams();

  // Reuses the admin conversations list to get this thread's provider name
  // for the header — cheap since it's already cached by the browser/react
  // query layer between page visits, and avoids a dedicated "get one" route.
  const { data } = useFetch(() => supportService.adminConversations(), []);
  const conversation = (data?.data || []).find((c) => c._id === conversationId);
  const providerName = conversation?.provider
    ? `${conversation.provider.firstName || ''} ${conversation.provider.lastName || ''}`.trim()
    : 'Provider';

  return (
    <AdminLayout title="Support Chat">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/admin/support" className="text-text-muted hover:text-secondary">
          <FaArrowLeft />
        </Link>
        <p className="text-sm font-semibold text-secondary">{providerName}</p>
      </div>
      <SupportChatPanel conversationId={conversationId} />
    </AdminLayout>
  );
}