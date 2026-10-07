import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaPaperPlane, FaImage, FaFileAlt, FaPhone, FaFileInvoiceDollar, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useCall } from '@/context/CallContext';
import useSocket from '@/hooks/useSocket';
import CustomerLayout from '@/layouts/CustomerLayout';
import ProviderLayout from '@/layouts/ProviderLayout';
import Button from '@/components/common/Button';
import MessageBubble from '@/components/chat/MessageBubble';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import InvoiceComposer from '@/components/chat/InvoiceComposer';
import { chatService } from '@/services/chatService';

export default function ChatRoom() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const { startCall } = useCall();
  const isProvider = user?.role === 'provider';
  const Layout = isProvider ? ProviderLayout : CustomerLayout;

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const bottomRef = useRef(null);
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await chatService.getMessages(conversationId);
      setConversation(data.conversation);
      setMessages(data.messages);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load this conversation.');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Live updates for the other participant's messages/invoice actions.
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (payload) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m._id === payload.message._id) ? prev : [...prev, payload.message]));
    };

    const onInvoiceUpdated = (payload) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (m.invoice && m.invoice._id === payload.invoice._id ? { ...m, invoice: payload.invoice } : m))
      );
    };

    socket.on('newMessage', onNewMessage);
    socket.on('invoiceUpdated', onInvoiceUpdated);
    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('invoiceUpdated', onInvoiceUpdated);
    };
  }, [socket, conversationId]);

  const appendOwnMessage = (message) => setMessages((prev) => [...prev, message]);

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      const { data } = await chatService.sendMessage(conversationId, { type: 'text', text: text.trim() });
      appendOwnMessage(data);
      setText('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send that message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image' : 'document';
    setIsSending(true);
    try {
      const { data } = await chatService.sendMessage(conversationId, { type, file });
      appendOwnMessage(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send that file.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceRecorded = async (blob, duration) => {
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || 'audio/webm' });
    setIsSending(true);
    try {
      const { data } = await chatService.sendMessage(conversationId, { type: 'voice', file, duration });
      appendOwnMessage(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send that voice message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleInvoiceUpdatedInline = (invoice) => {
    setMessages((prev) => prev.map((m) => (m.invoice && m.invoice._id === invoice._id ? { ...m, invoice } : m)));
  };

  const otherParty = conversation
    ? isProvider
      ? {
          userId: conversation.customer?._id,
          name: `${conversation.customer?.firstName || ''} ${conversation.customer?.lastName || ''}`.trim(),
          avatar: conversation.customer?.profileImage,
        }
      : {
          userId: conversation.provider?.user?._id,
          name: `${conversation.provider?.user?.firstName || ''} ${conversation.provider?.user?.lastName || ''}`.trim(),
          avatar: conversation.provider?.profileImage,
        }
    : null;

  return (
    <Layout title="Messages">
      <div className="flex h-[calc(100vh-220px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Link to="/messages" className="text-text-muted hover:text-secondary lg:hidden">
              <FaArrowLeft />
            </Link>
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-light font-display text-sm font-bold text-primary">
              {otherParty?.avatar ? (
                <img src={otherParty.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                (otherParty?.name || '?').charAt(0)
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary">{otherParty?.name || 'Loading…'}</p>
              {conversation?.service?.title && (
                <p className="text-xs text-text-muted">Re: {conversation.service.title}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isProvider && (
              <Button variant="outline" size="sm" onClick={() => setIsInvoiceOpen(true)}>
                <FaFileInvoiceDollar size={12} className="mr-1.5" /> Send invoice
              </Button>
            )}
            <button
              type="button"
              onClick={() => otherParty?.userId && startCall(otherParty, conversationId)}
              disabled={!otherParty?.userId}
              aria-label="Call"
              className="grid h-9 w-9 place-items-center rounded-full bg-primary-light text-primary hover:bg-primary hover:text-white disabled:opacity-40"
            >
              <FaPhone size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {isLoading && <p className="text-center text-sm text-text-muted">Loading…</p>}
          {!isLoading && messages.length === 0 && (
            <p className="text-center text-sm text-text-muted">Say hello to get started.</p>
          )}
          {messages.map((m) => (
            <MessageBubble
              key={m._id}
              message={m}
              isOwn={String(m.sender?._id || m.sender) === String(user?._id || user?.id)}
              viewerRole={user?.role}
              onInvoiceUpdated={handleInvoiceUpdatedInline}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {error && <p className="border-t border-border px-5 py-2 text-xs text-danger">{error}</p>}

        <form onSubmit={handleSendText} className="flex items-center gap-2 border-t border-border px-4 py-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFilePicked}
          />
          <input
            ref={documentInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFilePicked}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            aria-label="Attach a photo"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-text-muted hover:bg-slate-100 hover:text-primary"
          >
            <FaImage size={16} />
          </button>
          <button
            type="button"
            onClick={() => documentInputRef.current?.click()}
            aria-label="Attach a document"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-text-muted hover:bg-slate-100 hover:text-primary"
          >
            <FaFileAlt size={15} />
          </button>

          <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={isSending} />

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || isSending}
            aria-label="Send"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white disabled:opacity-40"
          >
            <FaPaperPlane size={14} />
          </button>
        </form>
      </div>

      {isProvider && (
        <InvoiceComposer
          conversationId={conversationId}
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          onSent={loadMessages}
        />
      )}
    </Layout>
  );
}