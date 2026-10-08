import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { chatService } from '@/services/chatService';

/**
 * The "Custom Request" path.
 *
 * A one-time booking is the listed job at the listed price. A custom request
 * is a job the listing doesn't cover, so there's no price to book against —
 * it opens a conversation with the provider instead, seeded with the job
 * description and the preferred slot. The provider replies with an Invoice,
 * which then runs through the existing admin-vetted escrow flow.
 *
 * @param {{
 *   service: object,
 *   initialDate?: string,
 *   initialTime?: string,
 *   onClose: () => void,
 * }} props
 */
export default function CustomRequestForm({ service, initialDate = '', initialTime = '', onClose }) {
  const navigate = useNavigate();
  const [details, setDetails] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const providerId = service?.provider?._id || service?.provider;

  const preferredSlot =
    initialDate && initialTime
      ? `${new Date(`${initialDate}T00:00:00`).toLocaleDateString('en-LK', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })} at ${initialTime}`
      : null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!details.trim()) {
      setError('Please describe what you need done.');
      return;
    }

    setIsSending(true);
    try {
      const conversation = await chatService.startConversation({
        providerId,
        serviceId: service?._id || service?.id,
      });

      const conversationId = conversation?.data?._id;
      if (!conversationId) throw new Error('Could not open the conversation.');

      // The provider needs the job and the slot in one message — they quote
      // from this, so an empty thread would just cost a round trip.
      const lines = [
        `Custom request for "${service?.title}"`,
        '',
        details.trim(),
      ];
      if (preferredSlot) lines.push('', `Preferred time: ${preferredSlot}`);

      await chatService.sendMessage(conversationId, {
        type: 'text',
        text: lines.join('\n'),
      });

      navigate(`/messages/${conversationId}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send your request. Please try again.');
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Custom request: ${service?.title || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-[13px] leading-relaxed text-text-muted">
          Describe the job and {service?.provider?.user?.firstName || 'the provider'} will reply
          with a price. You only pay once you've approved their quote.
        </p>

        {error && (
          <p className="rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">
            {error}
          </p>
        )}

        {preferredSlot && (
          <div className="rounded-xl bg-surface-warm px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Preferred time
            </p>
            <p className="mt-1 text-sm font-semibold text-secondary">{preferredSlot}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="custom-request-details"
            className="mb-1.5 block text-sm font-semibold text-secondary"
          >
            What do you need done?
          </label>
          <textarea
            id="custom-request-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={5}
            placeholder="e.g. Rewire two bedrooms and install 4 ceiling fans. The house is two storeys."
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-secondary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1.5 text-[11.5px] text-text-muted">
            The more detail you give, the more accurate their quote will be.
          </p>
        </div>

        <Button type="submit" variant="primary" fullWidth isLoading={isSending}>
          Send request &amp; open chat
        </Button>
      </form>
    </Modal>
  );
}
