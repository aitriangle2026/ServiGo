// Re-export so components can `import useNotification from '@/hooks/useNotification'`
// alongside the other hooks, without a second source of truth — the state
// itself lives in NotificationContext so every consumer shares one list.
export { useNotifications as default, useNotifications } from '@/context/NotificationContext';
