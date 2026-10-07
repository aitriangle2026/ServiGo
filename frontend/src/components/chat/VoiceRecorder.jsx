import { useEffect, useRef, useState } from 'react';
import { FaMicrophone, FaStop, FaTimes } from 'react-icons/fa';

const formatElapsed = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * Records a short voice note via MediaRecorder. Calls onRecorded(blob,
 * durationSeconds) when the user stops recording, or nothing if cancelled.
 */
export default function VoiceRecorder({ onRecorded, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);
  // Mirrors `elapsed` so the recorder's onstop closure (set once when
  // recording starts) reads the latest value instead of a stale one.
  const elapsedRef = useRef(0);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  const start = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      cancelledRef.current = false;

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (!cancelledRef.current && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          onRecorded(blob, elapsedRef.current);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setError("Couldn't access your microphone.");
    }
  };

  const stop = () => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  };

  const cancel = () => {
    cancelledRef.current = true;
    clearInterval(timerRef.current);
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-danger/30 bg-danger-light px-3 py-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
        <span className="text-sm font-medium text-danger">{formatElapsed(elapsed)}</span>
        <button type="button" onClick={cancel} aria-label="Cancel recording" className="text-text-muted hover:text-secondary">
          <FaTimes size={14} />
        </button>
        <button
          type="button"
          onClick={stop}
          aria-label="Send voice message"
          className="grid h-7 w-7 place-items-center rounded-full bg-danger text-white"
        >
          <FaStop size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={start}
        disabled={disabled}
        aria-label="Record a voice message"
        className="grid h-9 w-9 place-items-center rounded-full text-text-muted transition-colors hover:bg-slate-100 hover:text-primary disabled:opacity-50"
      >
        <FaMicrophone size={16} />
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}