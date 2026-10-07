import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import useSocket from '@/hooks/useSocket';
import { notificationService } from '@/services/notificationService';
import NotificationToast from '@/components/notifications/NotificationToast';

const PAGE_SIZE = 20;

// Stable identity for the logged-out case.
const EMPTY_LIST = [];

// Emitted by backend/src/services/notification.service.js.
const EVENT_NEW = 'notification:new';
const EVENT_READ = 'notification:read';
const EVENT_READ_ALL = 'notification:readAll';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  lastArrivalId: null,
  isLoading: false,
  hasMore: false,
  error: null,
  refresh: () => {},
  loadMore: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  remove: () => {},
});

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [loadedNotifications, setNotifications] = useState([]);
  const [loadedUnreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(null);

  // Guards against a slow page-1 response landing after a newer one and
  // clobbering the list (e.g. logout/login in quick succession).
  const requestRef = useRef(0);

  // Every notification _id this session has already surfaced, so a repeated
  // socket event can't double-toast or double-count.
  const seenIdsRef = useRef(new Set());

  // Lets the socket handler call the memoised markAsRead defined further
  // down, without making the subscription effect depend on it (which would
  // tear down and re-attach every listener whenever the list changes).
  const markAsReadRef = useRef(null);

  // The newest arrival, so the bell can animate once per notification.
  const [lastArrivalId, setLastArrivalId] = useState(null);

  // A logged-out session has nothing to show. Deriving this (rather than
  // clearing the state in an effect) means one user's notifications can
  // never flash on screen for the next one, and avoids a cascading render.
  // Memoised so the empty case doesn't hand consumers a new array identity
  // on every render.
  const notifications = useMemo(
    () => (isAuthenticated ? loadedNotifications : EMPTY_LIST),
    [isAuthenticated, loadedNotifications]
  );
  const unreadCount = isAuthenticated ? loadedUnreadCount : 0;

  const load = useCallback(async (pageToLoad = 1) => {
    const requestId = ++requestRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const res = await notificationService.getMine({ page: pageToLoad, limit: PAGE_SIZE });
      if (requestId !== requestRef.current) return;

      // Rows fetched over REST count as "already surfaced" — otherwise a
      // socket push racing this response would toast something the user can
      // already see in the list.
      res.data.forEach((n) => seenIdsRef.current.add(n._id));

      setNotifications((current) =>
        pageToLoad === 1 ? res.data : [...current, ...res.data]
      );
      setUnreadCount(res.unreadCount ?? 0);
      setTotalPages(res.totalPages ?? 0);
      setPage(res.page ?? pageToLoad);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(err?.response?.data?.message || 'Could not load notifications.');
    } finally {
      if (requestId === requestRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    // `load` flips isLoading on immediately, so it's queued off the effect's
    // commit path rather than called straight from it — otherwise that first
    // update cascades an extra render before the fetch has even started.
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) load(1);
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, load]);

  // Live delivery. The server pushes to the recipient's personal room, so
  // anything arriving here is already addressed to this user.
  useEffect(() => {
    if (!socket || !isAuthenticated) return undefined;

    const handleNew = ({ notification }) => {
      if (!notification?._id) return;

      // One guard for everything that follows. The socket push can arrive
      // twice (a reconnect replay, or racing the REST response that already
      // included this row), and previously only the list was protected —
      // the badge still double-counted and a second toast still appeared.
      // Mongo's _id is the identity, so seeing it once is enough.
      if (seenIdsRef.current.has(notification._id)) return;
      seenIdsRef.current.add(notification._id);

      setNotifications((current) =>
        current.some((n) => n._id === notification._id)
          ? current
          : [notification, ...current]
      );
      setUnreadCount((count) => count + 1);
      setLastArrivalId(notification._id); // drives the bell's ring animation

      toast.custom(
        (t) => (
          <NotificationToast
            notification={notification}
            visible={t.visible}
            onClose={() => toast.dismiss(t.id)}
            onClick={() => {
              toast.dismiss(t.id);
              markAsReadRef.current?.(notification._id);
              if (notification.link) navigate(notification.link);
            }}
          />
        ),
        { duration: 5000, position: 'top-right', id: notification._id }
      );
    };

    const handleRead = ({ notificationId, unreadCount: count }) => {
      setNotifications((current) =>
        current.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      if (typeof count === 'number') setUnreadCount(count);
    };

    const handleReadAll = () => {
      setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    // Anything emitted while the socket was down was still persisted, so a
    // reconnect pulls page 1 to catch up. The seenIds guard above means
    // rows we already have won't re-toast.
    const handleReconnect = () => load(1);

    socket.on(EVENT_NEW, handleNew);
    socket.on(EVENT_READ, handleRead);
    socket.on(EVENT_READ_ALL, handleReadAll);
    socket.on('connect', handleReconnect);
    socket.io?.on('reconnect', handleReconnect);

    return () => {
      socket.off(EVENT_NEW, handleNew);
      socket.off(EVENT_READ, handleRead);
      socket.off(EVENT_READ_ALL, handleReadAll);
      socket.off('connect', handleReconnect);
      socket.io?.off('reconnect', handleReconnect);
    };
  }, [socket, isAuthenticated, load, navigate]);

  const markAsRead = useCallback(async (id) => {
    // Optimistic — the row greys out immediately; the server's own
    // notification:read echo keeps other tabs in step.
    let wasUnread = false;
    setNotifications((current) =>
      current.map((n) => {
        if (n._id !== id) return n;
        wasUnread = !n.isRead;
        return { ...n, isRead: true };
      })
    );
    if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));

    try {
      await notificationService.markAsRead(id);
    } catch {
      // Put it back if the server disagreed.
      setNotifications((current) =>
        current.map((n) => (n._id === id ? { ...n, isRead: !wasUnread ? n.isRead : false } : n))
      );
      if (wasUnread) setUnreadCount((count) => count + 1);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch {
      load(1);
    }
  }, [load]);

  const remove = useCallback(async (id) => {
    const removed = notifications.find((n) => n._id === id);
    setNotifications((current) => current.filter((n) => n._id !== id));
    if (removed && !removed.isRead) setUnreadCount((count) => Math.max(0, count - 1));

    try {
      await notificationService.remove(id);
    } catch {
      load(1);
    }
  }, [notifications, load]);

  // Keep the ref pointing at the live callback for the socket handler.
  // Assigned in an effect, not during render — refs must not be written
  // while rendering.
  useEffect(() => {
    markAsReadRef.current = markAsRead;
  }, [markAsRead]);

  // A different user must not inherit the previous one's seen-set, or their
  // first notifications would be silently swallowed. Refs only — no state is
  // set here.
  useEffect(() => {
    if (!isAuthenticated) seenIdsRef.current.clear();
  }, [isAuthenticated]);

  const loadMore = useCallback(() => {
    if (isLoading || page >= totalPages) return;
    load(page + 1);
  }, [isLoading, page, totalPages, load]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      lastArrivalId,
      isLoading,
      hasMore: isAuthenticated && page < totalPages,
      error,
      refresh: () => load(1),
      loadMore,
      markAsRead,
      markAllAsRead,
      remove,
    }),
    [isAuthenticated, notifications, unreadCount, lastArrivalId, isLoading, page, totalPages, error, load, loadMore, markAsRead, markAllAsRead, remove]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}
