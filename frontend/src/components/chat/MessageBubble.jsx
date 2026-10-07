import { FaFileAlt, FaDownload } from 'react-icons/fa';
import InvoiceCard from '@/components/chat/InvoiceCard';

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * @param {{ message: object, isOwn: boolean, viewerRole: 'customer'|'provider', onInvoiceUpdated: (invoice:object) => void }} props
 */
export default function MessageBubble({ message, isOwn, viewerRole, onInvoiceUpdated }) {
  const { type, text, attachmentUrl, attachmentName, duration, createdAt } = message;

  if (type === 'invoice') {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div>
          <InvoiceCard invoice={message.invoice} viewerRole={viewerRole} onUpdated={onInvoiceUpdated} />
          <p className={`mt-1 text-[11px] text-text-muted ${isOwn ? 'text-right' : ''}`}>{formatTime(createdAt)}</p>
        </div>
      </div>
    );
  }

  const bubbleClass = isOwn
    ? 'bg-primary text-white rounded-br-md'
    : 'bg-slate-100 text-secondary rounded-bl-md';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[75%]">
        <div className={`rounded-2xl px-4 py-2.5 text-sm ${bubbleClass}`}>
          {type === 'text' && <p className="whitespace-pre-line break-words">{text}</p>}

          {type === 'image' && (
            <a href={attachmentUrl} target="_blank" rel="noreferrer">
              <img src={attachmentUrl} alt="Attachment" className="max-h-64 rounded-xl object-cover" />
            </a>
          )}

          {type === 'document' && (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 rounded-xl px-1 py-1 ${isOwn ? 'text-white' : 'text-secondary'}`}
            >
              <FaFileAlt />
              <span className="truncate underline">{attachmentName || 'Document'}</span>
              <FaDownload size={12} className="shrink-0" />
            </a>
          )}

          {type === 'voice' && (
            <div className="flex flex-col gap-1">
              <audio controls src={attachmentUrl} className="h-9 max-w-[220px]" />
              {duration > 0 && (
                <span className={`text-[11px] ${isOwn ? 'text-white/80' : 'text-text-muted'}`}>
                  {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          )}

          {type === 'call_log' && <p className="italic opacity-90">📞 {text || 'Call'}</p>}
        </div>
        <p className={`mt-1 text-[11px] text-text-muted ${isOwn ? 'text-right' : ''}`}>{formatTime(createdAt)}</p>
      </div>
    </div>
  );
}