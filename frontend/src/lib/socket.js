import { io } from 'socket.io-client';

// Socket.IO attaches directly to the backend's HTTP server, not under the
// REST API's "/api/v1" prefix — strip that off the configured API base URL.
const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(
  /\/api\/v1\/?$/,
  ''
);

let socket = null;

export const getSocket = () => socket;

// Idempotent — safe to call repeatedly (e.g. from a hook's effect); reuses
// the existing connection if one is already open.
export const connectSocket = (token, userId) => {
  if (socket?.connected) return socket;

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    // Fallback for the (rare) case the server couldn't verify the JWT on
    // handshake — explicitly join the personal room by id instead.
    socket.on('connect', () => {
      if (userId) socket.emit('join', userId);
    });
  } else {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};