import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';

const TOKEN_KEY = 'servigo_access_token';

/**
 * Returns the shared Socket.IO connection, live-connected while the user is
 * authenticated. Returns null before the connection is established and
 * after logout. Safe to call from multiple components at once — they all
 * share the same underlying socket.
 */
export default function useSocket() {
  const { user, isAuthenticated } = useAuth();
  const [instance, setInstance] = useState(getSocket());

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      setInstance(null);
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const socket = connectSocket(token, user._id || user.id);
    setInstance(socket);
  }, [isAuthenticated, user]);

  return instance;
}