import { useEffect, useRef, useState } from 'react';
import { FaPhone, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVolumeUp } from 'react-icons/fa';
import { useCall } from '@/context/CallContext';

const STATUS_LABEL = {
  calling: 'Calling…',
  ringing: 'Ringing…',
  connecting: 'Connecting…',
  connected: 'Connected',
};

export default function CallModal() {
  const { activeCall, incomingCall, remoteStream, isMuted, callError, acceptCall, rejectCall, endCall, toggleMute, clearCallError } =
    useCall();
  const audioRef = useRef(null);
  const [needsAudioTap, setNeedsAudioTap] = useState(false);

  useEffect(() => {
    if (!audioRef.current || !remoteStream) return;
    audioRef.current.srcObject = remoteStream;
    // The `autoPlay` attribute alone isn't reliable once srcObject is
    // assigned programmatically after the element already mounted — some
    // browsers silently never start playback. Explicitly call play() and,
    // if the browser's autoplay policy blocks it, fall back to a manual
    // "tap to enable audio" control (this always succeeds since it runs
    // from a real click, which satisfies the autoplay-policy requirement).
    audioRef.current
      .play()
      .then(() => setNeedsAudioTap(false))
      .catch(() => setNeedsAudioTap(true));
  }, [remoteStream]);

  const enableAudio = () => {
    audioRef.current
      ?.play()
      .then(() => setNeedsAudioTap(false))
      .catch(() => setNeedsAudioTap(true));
  };

  useEffect(() => {
    if (!callError) return;
    // Connection-failure explanations are longer than a simple "declined" —
    // give the reader enough time to actually finish it.
    const timer = setTimeout(clearCallError, 9000);
    return () => clearTimeout(timer);
  }, [callError, clearCallError]);

  const showIncoming = incomingCall && !activeCall;
  const showActive = !!activeCall;

  if (!showIncoming && !showActive && !callError) return null;

  return (
    <>
      <audio ref={audioRef} autoPlay />

      {callError && (
        <div className="fixed left-1/2 top-4 z-[200] w-[92%] max-w-sm -translate-x-1/2 rounded-xl border border-danger/20 bg-danger-light px-4 py-2.5 text-sm font-medium text-danger shadow-soft-lg">
          {callError}
        </div>
      )}

      {(showIncoming || showActive) && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-secondary/60 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-3xl bg-surface p-8 text-center shadow-soft-lg">
            {showIncoming ? (
              <>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary-light font-display text-2xl font-bold text-primary">
                  {incomingCall.fromAvatar ? (
                    <img src={incomingCall.fromAvatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    (incomingCall.fromName || '?').charAt(0)
                  )}
                </div>
                <p className="mt-4 font-display text-lg font-bold text-secondary">
                  {incomingCall.fromName || 'Someone'}
                </p>
                <p className="mt-1 text-sm text-text-muted">Incoming call…</p>

                <div className="mt-7 flex items-center justify-center gap-6">
                  <button
                    onClick={rejectCall}
                    aria-label="Decline"
                    className="grid h-14 w-14 place-items-center rounded-full bg-danger text-white shadow-lg transition-transform hover:scale-105"
                  >
                    <FaPhoneSlash size={18} />
                  </button>
                  <button
                    onClick={acceptCall}
                    aria-label="Accept"
                    className="grid h-14 w-14 place-items-center rounded-full bg-success text-white shadow-lg transition-transform hover:scale-105"
                  >
                    <FaPhone size={18} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary-light font-display text-2xl font-bold text-primary">
                  {activeCall.peerAvatar ? (
                    <img src={activeCall.peerAvatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    (activeCall.peerName || '?').charAt(0)
                  )}
                </div>
                <p className="mt-4 font-display text-lg font-bold text-secondary">{activeCall.peerName}</p>
                <p className="mt-1 text-sm text-text-muted">{STATUS_LABEL[activeCall.status] || '…'}</p>

                {needsAudioTap && (
                  <button
                    type="button"
                    onClick={enableAudio}
                    className="mx-auto mt-3 flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1.5 text-xs font-semibold text-accent"
                  >
                    <FaVolumeUp size={11} /> Tap to hear audio
                  </button>
                )}

                <div className="mt-7 flex items-center justify-center gap-6">
                  <button
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                    className={`grid h-14 w-14 place-items-center rounded-full shadow-lg transition-transform hover:scale-105 ${
                      isMuted ? 'bg-slate-700 text-white' : 'bg-slate-100 text-secondary'
                    }`}
                  >
                    {isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
                  </button>
                  <button
                    onClick={() => endCall()}
                    aria-label="Hang up"
                    className="grid h-14 w-14 place-items-center rounded-full bg-danger text-white shadow-lg transition-transform hover:scale-105"
                  >
                    <FaPhoneSlash size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}