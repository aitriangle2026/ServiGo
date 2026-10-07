import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import useSocket from '@/hooks/useSocket';

const CallContext = createContext(null);

// Public STUN only — no TURN server configured. This gets calls working for
// most home/mobile networks (and same-network testing) but pairs behind
// strict/symmetric NATs or corporate firewalls may fail to connect. Add a
// TURN server here (e.g. Twilio, coturn) if that turns out to matter for
// your users.
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export function CallProvider({ children }) {
  const { user } = useAuth();
  const socket = useSocket();

  // { peerUserId, peerName, peerAvatar, conversationId, status, callType }
  // status: 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended'
  const [activeCall, setActiveCall] = useState(null);
  // { fromUserId, fromName, fromAvatar, conversationId, callType }
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callError, setCallError] = useState('');

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const activeCallRef = useRef(null);
  const connectTimeoutRef = useRef(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const cleanup = useCallback(() => {
    clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setRemoteStream(null);
    setIsMuted(false);
  }, []);

  const endCall = useCallback(
    (silent = false) => {
      const current = activeCallRef.current;
      if (current && !silent) {
        socket?.emit('call:end', { toUserId: current.peerUserId, conversationId: current.conversationId });
      }
      cleanup();
      setActiveCall(null);
      setIncomingCall(null);
    },
    [socket, cleanup]
  );

  const createPeerConnection = useCallback(
    (peerUserId) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit('call:ice-candidate', { toUserId: peerUserId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // The SDP offer/answer exchange completing does NOT mean audio is
      // actually flowing — the browsers still have to find a viable network
      // path (ICE connectivity checks). Drive the "connected" status off
      // that instead of off the SDP exchange, so a call that never actually
      // establishes a media path doesn't sit there falsely reporting success.
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === 'connected' || state === 'completed') {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
          setActiveCall((c) => (c ? { ...c, status: 'connected' } : c));
        } else if (state === 'failed') {
          setCallError(
            "Couldn't connect the call — this usually means both sides are on networks that need a relay server (TURN) to reach each other, which isn't configured yet. It's more likely to work when both people are on the same Wi-Fi."
          );
          endCall(true);
        }
      };

      pc.onconnectionstatechange = () => {
        if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
          if (activeCallRef.current?.status === 'connected') {
            endCall(true);
          }
        }
      };

      // Safety net: if ICE never reaches a connected state at all (no
      // 'failed' event fires either, which happens on some networks — it
      // just hangs), don't leave the caller staring at "Connecting…" forever.
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = setTimeout(() => {
        if (activeCallRef.current && activeCallRef.current.status !== 'connected') {
          setCallError(
            "Couldn't connect the call after 20 seconds — this usually means both sides are on networks that need a relay server (TURN) to reach each other, which isn't configured yet. It's more likely to work when both people are on the same Wi-Fi."
          );
          endCall(true);
        }
      }, 20000);

      pcRef.current = pc;
      return pc;
    },
    [socket, endCall]
  );

  const getMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      return stream;
    } catch {
      setCallError("Couldn't access your microphone. Check your browser's permission for this site.");
      throw new Error('mic_denied');
    }
  }, []);

  const startCall = useCallback(
    async (peer, conversationId) => {
      if (activeCallRef.current || incomingCall) return; // one call at a time
      setCallError('');
      try {
        await getMic();
      } catch {
        return;
      }
      const next = {
        peerUserId: peer.userId,
        peerName: peer.name,
        peerAvatar: peer.avatar,
        conversationId,
        status: 'calling',
        callType: 'audio',
      };
      // Set the ref synchronously too — the socket event below can reach the
      // other side and come back (via 'call:accepted') faster than this
      // component's state-update effect would otherwise commit.
      activeCallRef.current = next;
      setActiveCall(next);
      socket?.emit('call:invite', {
        toUserId: peer.userId,
        conversationId,
        callType: 'audio',
        fromName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        fromAvatar: user?.profileImage || '',
      });
    },
    [socket, user, getMic, incomingCall]
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    setCallError('');
    try {
      await getMic();
    } catch {
      return;
    }
    const next = {
      peerUserId: incomingCall.fromUserId,
      peerName: incomingCall.fromName || 'Unknown',
      peerAvatar: incomingCall.fromAvatar,
      conversationId: incomingCall.conversationId,
      status: 'connecting',
      callType: incomingCall.callType || 'audio',
    };
    activeCallRef.current = next;
    setActiveCall(next);
    socket?.emit('call:accept', {
      toUserId: incomingCall.fromUserId,
      conversationId: incomingCall.conversationId,
    });
    setIncomingCall(null);
  }, [incomingCall, socket, getMic]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    socket?.emit('call:reject', {
      toUserId: incomingCall.fromUserId,
      conversationId: incomingCall.conversationId,
    });
    setIncomingCall(null);
  }, [incomingCall, socket]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !isMuted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !nextMuted));
    setIsMuted(nextMuted);
  }, [isMuted]);

  // Wire up the signaling relay events from the shared socket.
  useEffect(() => {
    if (!socket) return;

    const onIncoming = (payload) => {
      // Already on a call — silently ignore for now (no call-waiting UI).
      if (activeCallRef.current) return;
      setIncomingCall(payload);
    };

    const onAccepted = async ({ fromUserId }) => {
      const current = activeCallRef.current;
      if (!current || current.peerUserId !== fromUserId) return;
      setActiveCall((c) => ({ ...c, status: 'connecting' }));
      const pc = createPeerConnection(fromUserId);
      localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('call:offer', { toUserId: fromUserId, sdp: offer });
    };

    const onOffer = async ({ fromUserId, sdp }) => {
      const current = activeCallRef.current;
      if (!current || current.peerUserId !== fromUserId) return;
      const pc = createPeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('call:answer', { toUserId: fromUserId, sdp: answer });
    };

    const onAnswer = async ({ fromUserId, sdp }) => {
      const current = activeCallRef.current;
      if (!current || current.peerUserId !== fromUserId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      // Status moves to 'connected' once ICE actually establishes a media
      // path — see oniceconnectionstatechange in createPeerConnection.
    };

    const onIceCandidate = async ({ candidate }) => {
      if (!pcRef.current || !candidate) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Candidate arrived before the remote description was set — safe to
        // drop; ICE will still find a path via the other candidates.
      }
    };

    const onRejected = () => {
      setCallError('Call declined.');
      cleanup();
      setActiveCall(null);
    };

    const onEnded = () => {
      cleanup();
      setActiveCall(null);
    };

    socket.on('call:incoming', onIncoming);
    socket.on('call:accepted', onAccepted);
    socket.on('call:offer', onOffer);
    socket.on('call:answer', onAnswer);
    socket.on('call:ice-candidate', onIceCandidate);
    socket.on('call:rejected', onRejected);
    socket.on('call:ended', onEnded);

    return () => {
      socket.off('call:incoming', onIncoming);
      socket.off('call:accepted', onAccepted);
      socket.off('call:offer', onOffer);
      socket.off('call:answer', onAnswer);
      socket.off('call:ice-candidate', onIceCandidate);
      socket.off('call:rejected', onRejected);
      socket.off('call:ended', onEnded);
    };
  }, [socket, createPeerConnection, cleanup]);

  const value = {
    activeCall,
    incomingCall,
    remoteStream,
    isMuted,
    callError,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    clearCallError: () => setCallError(''),
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within a CallProvider');
  return ctx;
}