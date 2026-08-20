import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

dayjs.extend(relativeTime);

const WS_URL = import.meta.env.VITE_WS_ORDERS_URL || 'ws://192.168.1.65:8000/ws/admin/orders/';
const MAX_NOTIFICATIONS = 50;
const STORAGE_KEY = 'order_notifications';

const NotificationContext = createContext(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

const readStorage = () => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeStorage = (notifications) => {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
    } catch { /* quota exceeded — ignore */ }
};

export const formatOrderNotification = (data) => ({
    id: `${data.order_id}_${Date.now()}`,
    orderId: data.order_id,
    orderNumber: data.order_number,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    orderType: data.order_type,
    paymentMethod: data.payment_method,
    paymentStatus: data.payment_status,
    status: data.status,
    finalAmount: parseFloat(data.final_amount || 0),
    items: data.items || [],
    receivedAt: new Date().toISOString(),
    read: false,
});

// ── Provider ──────────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(() => readStorage());
    const [wsStatus, setWsStatus] = useState('connecting'); // connecting | open | closed
    const wsRef = useRef(null);
    const retryRef = useRef(null);
    const mountedRef = useRef(true);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const addNotification = useCallback((raw) => {
        const notification = formatOrderNotification(raw);
        setNotifications((prev) => {
            const next = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
            writeStorage(next);
            return next;
        });
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications((prev) => {
            const next = prev.map((n) => ({ ...n, read: true }));
            writeStorage(next);
            return next;
        });
    }, []);

    const markRead = useCallback((id) => {
        setNotifications((prev) => {
            const next = prev.map((n) => n.id === id ? { ...n, read: true } : n);
            writeStorage(next);
            return next;
        });
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        sessionStorage.removeItem(STORAGE_KEY);
    }, []);

    // ── WebSocket lifecycle ───────────────────────────────────────────────────
    const connect = useCallback(() => {
        if (!mountedRef.current) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;
            setWsStatus('connecting');

            ws.onopen = () => {
                if (!mountedRef.current) return;
                setWsStatus('open');
                // Clear any pending retry
                if (retryRef.current) {
                    clearTimeout(retryRef.current);
                    retryRef.current = null;
                }
            };

            ws.onmessage = (event) => {
                if (!mountedRef.current) return;
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'new_order') {
                        addNotification(data);
                    }
                } catch { /* malformed message */ }
            };

            ws.onclose = () => {
                if (!mountedRef.current) return;
                setWsStatus('closed');
                // Auto-reconnect after 5 s
                retryRef.current = setTimeout(() => {
                    if (mountedRef.current) connect();
                }, 5000);
            };

            ws.onerror = () => {
                ws.close();
            };
        } catch { /* WS not supported */ }
    }, [addNotification]);

    useEffect(() => {
        mountedRef.current = true;
        connect();
        return () => {
            mountedRef.current = false;
            clearTimeout(retryRef.current);
            wsRef.current?.close();
        };
    }, [connect]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                wsStatus,
                markRead,
                markAllRead,
                clearAll,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
    return ctx;
};