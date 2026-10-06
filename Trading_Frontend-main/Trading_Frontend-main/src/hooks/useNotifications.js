import { useState, useEffect, useCallback, useRef } from 'react';
import { io as socketIo } from 'socket.io-client';
import { SOCKET_URL, getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import { useAuth } from '../context/AuthContext';

const useNotifications = (source) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const socketRef = useRef(null);

    // ── Fetch from API ─────────────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await getNotifications(source);
            setNotifications(data || []);
        } catch (err) {
            console.error('fetchNotifications:', err);
        } finally {
            setLoading(false);
        }
    }, [user, source]);

    // ── Setup socket + fetch on mount ─────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        const socket = socketIo(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join', { userId: user.id, role: user.role });
        });

        // New notification from server — prepend it
        socket.on('notification', (notif) => {
            setNotifications(prev => [notif, ...prev]);
        });

        // Notification deleted from server
        socket.on('notification_deleted', ({ id }) => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    // ── Mark one as read ───────────────────────────────────────────────────────
    const markRead = useCallback(async (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
        );
        try {
            await markNotificationRead(id);
        } catch (_) { /* optimistic update already done */ }
    }, []);

    // ── Mark all as read ───────────────────────────────────────────────────────
    const markAllRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        try {
            await markAllNotificationsRead();
        } catch (_) { /* optimistic update already done */ }
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications };
};

export default useNotifications;
