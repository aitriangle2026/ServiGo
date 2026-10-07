import { useEffect, useRef, useState, useCallback } from 'react';
import { FaPaperPlane, FaImage, FaFileAlt } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import useSocket from '@/hooks/useSocket';
import MessageBubble from '@/components/chat/MessageBubble';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import { supportService } from '@/services/supportService';

/**
 * Shared message list + composer for a provider<->admin support thread.
 * Used on both the provider's support page and the admin's support chat page
 * — the only difference between the two is who's viewing it, so `isOwn` in
 * MessageBubble is all that needs to vary.
 *
 * @param {{ conversationId: string }} props
 */
export default function SupportChatPanel({ conversationId }) {
  const { user } = useAuth();
  const socket = useSocket();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const bottomRef = useRef(null);
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await supportService.getMessages(conversationId);
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

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (payload) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m._id === payload.message._id) ? prev : [...prev, payload.message]));
    };

    socket.on('newSupportMessage', onNewMessage);
    return () => socket.off('newSupportMessage', onNewMessage);
  }, [socket, conversationId]);

  const appendOwnMessage = (message) => setMessages((prev) => [...prev, message]);

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      const { data } = await supportService.sendMessage(conversationId, { type: 'text', text: text.trim() });
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
      const { data } = await supportService.sendMessage(conversationId, { type, file });
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
      const { data } = await supportService.sendMessage(conversationId, { type: 'voice', file, duration });
      appendOwnMessage(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send that voice message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-280px)] min-h-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-surface">
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
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="border-t border-border px-5 py-2 text-xs text-danger">{error}</p>}

      <form onSubmit={handleSendText} className="flex items-center gap-2 border-t border-border px-4 py-3">
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePicked} />
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
  );
}