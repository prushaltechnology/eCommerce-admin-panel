import {
    BellOutlined,
    CheckOutlined,
    ClearOutlined,
    ShoppingOutlined,
    WifiOutlined
} from '@ant-design/icons';
import {
    Badge,
    Button,
    Empty,
    Popover,
    Space,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

dayjs.extend(relativeTime);

const { Text } = Typography;

// ── Status / payment colour maps ─────────────────────────────────────────────
const STATUS_COLOR = {
    confirmed: 'green',
    pending: 'orange',
    processing: 'blue',
    dispatched: 'purple',
    delivered: 'cyan',
    cancelled: 'red',
};

const PAYMENT_COLOR = {
    paid: 'green',
    pending: 'orange',
    failed: 'red',
};

const WS_STATUS_CONFIG = {
    open: { color: '#52c41a', label: 'Live' },
    connecting: { color: '#faad14', label: 'Connecting…' },
    closed: { color: '#ff4d4f', label: 'Disconnected' },
};

// ── Single notification card ──────────────────────────────────────────────────
const NotificationItem = ({ notification, onRead }) => {
    const { orderNumber, customerName, finalAmount, status, paymentStatus, items, receivedAt, read } = notification;

    return (
        <div
            onClick={() => onRead(notification.id)}
            style={{
                padding: '10px 14px',
                borderBottom: '1px solid #f0f0f0',
                background: read ? '#fff' : '#f6f9ff',
                cursor: 'pointer',
                transition: 'background 0.2s',
                borderLeft: read ? '3px solid transparent' : '3px solid #1890ff',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <Space size={4} wrap>
                    <Text strong style={{ fontSize: 13 }}>{orderNumber}</Text>
                    <Tag color={STATUS_COLOR[status] || 'default'} style={{ fontSize: 10, margin: 0 }}>
                        {status?.toUpperCase()}
                    </Tag>
                    <Tag color={PAYMENT_COLOR[paymentStatus] || 'default'} style={{ fontSize: 10, margin: 0 }}>
                        {paymentStatus?.toUpperCase()}
                    </Tag>
                </Space>
                <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {dayjs(receivedAt).fromNow()}
                </Text>
            </div>

            <div style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: '#595959' }}>{customerName}</Text>
                <Text style={{ fontSize: 12, color: '#1890ff', marginLeft: 8 }}>
                    ₹{finalAmount?.toFixed(2)}
                </Text>
            </div>

            {items?.length > 0 && (
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                    {items.map((i) => `${i.product_name} ×${i.quantity}`).join(', ')}
                </Text>
            )}
        </div>
    );
};

// ── Bell + dropdown ───────────────────────────────────────────────────────────
const NotificationBell = () => {
    const { notifications, unreadCount, wsStatus, markRead, markAllRead, clearAll } = useNotifications();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const wsConfig = WS_STATUS_CONFIG[wsStatus] || WS_STATUS_CONFIG.closed;

    const content = (
        <div style={{ width: 360, maxHeight: 480, display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
            }}>
                <Space size={6}>
                    <Text strong style={{ fontSize: 14 }}>Order Notifications</Text>
                    <Tooltip title={`WebSocket: ${wsConfig.label}`}>
                        <WifiOutlined style={{ color: wsConfig.color, fontSize: 12 }} />
                    </Tooltip>
                </Space>
                <Space size={4}>
                    {unreadCount > 0 && (
                        <Tooltip title="Mark all read">
                            <Button
                                type="text" size="small" icon={<CheckOutlined />}
                                onClick={markAllRead}
                                style={{ color: '#8c8c8c', padding: '0 6px' }}
                            />
                        </Tooltip>
                    )}
                    {notifications.length > 0 && (
                        <Tooltip title="Clear all">
                            <Button
                                type="text" size="small" icon={<ClearOutlined />}
                                onClick={clearAll}
                                style={{ color: '#8c8c8c', padding: '0 6px' }}
                            />
                        </Tooltip>
                    )}
                </Space>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                    <Empty
                        image={<BellOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />}
                        imageStyle={{ height: 48, marginTop: 24 }}
                        description={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                No new orders yet
                            </Text>
                        }
                        style={{ padding: '32px 0' }}
                    />
                ) : (
                    notifications.map((n) => (
                        <NotificationItem key={n.id} notification={n} onRead={markRead} />
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div style={{
                    padding: '8px 14px', borderTop: '1px solid #f0f0f0',
                    textAlign: 'center', flexShrink: 0,
                }}>
                    <Button
                        type="link" size="small" icon={<ShoppingOutlined />}
                        onClick={() => { setOpen(false); navigate('/orders/user'); }}
                        style={{ fontSize: 12 }}
                    >
                        View all orders
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <Popover
            content={content}
            trigger="click"
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (v && unreadCount > 0) markAllRead();
            }}
            placement="bottomRight"
            arrow={false}
            styles={{
                body: { padding: 0, borderRadius: 10, overflow: 'hidden' }
            }}
        >
            <Tooltip title={wsStatus !== 'open' ? `WebSocket ${wsConfig.label}` : undefined}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 42,
                    }}
                >
                    <Badge
                        count={unreadCount}
                        overflowCount={99}
                        offset={[-2, 2]}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <BellOutlined
                                style={{
                                    fontSize: 18,
                                    color: '#fff',
                                    lineHeight: 1,
                                    animation:
                                        unreadCount > 0
                                            ? 'bell-ring 1s ease-in-out'
                                            : 'none',
                                }}
                            />
                        </div>
                    </Badge>
                </div>
            </Tooltip>

            <style>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0deg); }
          20%       { transform: rotate(-15deg); }
          40%       { transform: rotate(15deg); }
          60%       { transform: rotate(-10deg); }
          80%       { transform: rotate(10deg); }
        }
      `}</style>
        </Popover>
    );
};

export default NotificationBell;