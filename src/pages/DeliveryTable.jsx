import {
    CarOutlined,
    LinkOutlined,
    PhoneOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    Avatar,
    Button,
    Skeleton,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';

const { Text } = Typography;

// ── colour maps ────────────────────────────────────────────────────────────
const ORDER_STATUS_COLOR = {
    pending: 'orange',
    confirmed: 'green',
    processing: 'blue',
    dispatched: 'purple',
    delivered: 'cyan',
    cancelled: 'red',
};

const BORZO_STATUS_COLOR = {
    new: 'blue',
    planned: 'geekblue',
    active: 'green',
    courier_found: 'green',
    delivering: 'purple',
    delivered: 'cyan',
    cancelled: 'red',
    failed: 'red',
};

const Skel = ({ w = 120 }) => (
    <Skeleton.Input active size="small" style={{ width: w, height: 16, borderRadius: 4 }} />
);

// ── columns ────────────────────────────────────────────────────────────────
const buildColumns = () => [
    {
        title: 'Order',
        key: 'order',
        width: 140,
        render: (_, r) =>
            r.isSkeleton ? <Skel w={100} /> : (
                <div>
                    <Text strong style={{ fontSize: 13 }}>{r.orderNumber}</Text>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                        {dayjs(r.createdAt).format('MMM D, h:mm A')}
                    </div>
                </div>
            ),
    },
    {
        title: 'Order Status',
        key: 'orderStatus',
        width: 120,
        render: (_, r) =>
            r.isSkeleton ? <Skel w={80} /> : (
                <Tag color={ORDER_STATUS_COLOR[r.status?.toLowerCase()] || 'default'}>
                    {r.status?.toUpperCase()}
                </Tag>
            ),
    },
    {
        title: 'Customer',
        key: 'customer',
        width: 140,
        render: (_, r) =>
            r.isSkeleton ? <Skel w={110} /> : (
                <Text style={{ fontSize: 13 }}>
                    {r.customer ? `${r.customer.firstName} ${r.customer.lastName || ''}`.trim() : '—'}
                </Text>
            ),
    },
    {
        title: 'Delivery Boy',
        key: 'courier',
        width: 180,
        render: (_, r) => {
            if (r.isSkeleton) return (
                <Space>
                    <Skeleton.Avatar active size={32} />
                    <Skel w={100} />
                </Space>
            );
            const courier = r.borzoOrder?.courier;
            if (!courier) return <Text type="secondary" style={{ fontSize: 12 }}>Not assigned yet</Text>;
            return (
                <Space size={8}>
                    {courier.photoUrl ? (
                        <Avatar src={courier.photoUrl} size={32} />
                    ) : (
                        <Avatar icon={<UserOutlined />} size={32} style={{ background: '#e6f7ff', color: '#1890ff' }} />
                    )}
                    <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{courier.name}</div>
                        <div style={{ fontSize: 12, color: '#1890ff' }}>
                            <PhoneOutlined style={{ marginRight: 4 }} />
                            {courier.phone || '—'}
                        </div>
                    </div>
                </Space>
            );
        },
    },
    {
        title: 'Delivery Status',
        key: 'deliveryStatus',
        width: 150,
        render: (_, r) => {
            if (r.isSkeleton) return <Skel w={90} />;
            const b = r.borzoOrder;
            return (
                <div>
                    <Tag color={BORZO_STATUS_COLOR[b?.deliveryStatus?.toLowerCase()] || 'default'}>
                        {b?.deliveryStatus?.toUpperCase() || '—'}
                    </Tag>
                    {b?.statusDescription && (
                        <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>{b.statusDescription}</div>
                    )}
                </div>
            );
        },
    },
    {
        title: 'Delivery Fee',
        key: 'deliveryFee',
        width: 110,
        render: (_, r) =>
            r.isSkeleton ? <Skel w={70} /> : (
                <Text strong style={{ color: '#1890ff' }}>
                    ₹{parseFloat(r.borzoOrder?.deliveryFee || 0).toFixed(2)}
                </Text>
            ),
    },
    {
        title: 'Drop Address',
        key: 'drop',
        render: (_, r) => {
            if (r.isSkeleton) return <Skel w={180} />;
            const drop = r.borzoOrder?.drop;
            if (!drop) return '—';
            return (
                <Tooltip title={drop.address}>
                    <div>
                        <Text style={{ fontSize: 13, fontWeight: 500 }}>{drop.name}</Text>
                        <div style={{
                            fontSize: 12, color: '#8c8c8c', maxWidth: 200,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                            {drop.address}
                        </div>
                    </div>
                </Tooltip>
            );
        },
    },
    {
        title: 'Track',
        key: 'track',
        width: 70,
        render: (_, r) => {
            if (r.isSkeleton) return <Skeleton.Button active size="small" shape="circle" />;
            const url = r.borzoOrder?.trackingUrl;
            if (!url) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
            return (
                <Tooltip title="Open tracking page">
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<LinkOutlined />}
                        onClick={() => window.open(url, '_blank', 'noopener')}
                    />
                </Tooltip>
            );
        },
    },
];

// ── component ──────────────────────────────────────────────────────────────
const DeliveryTable = ({
    rows,
    loading,
    fetchingMore,
    hasMore,
    nextCursor,
    skeletonRows,
    onLoadMore,
}) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const body = containerRef.current?.querySelector('.ant-table-body');
        if (!body) return;

        const onScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = body;
            if (
                scrollHeight - scrollTop <= clientHeight + 60 &&
                hasMore && nextCursor && !loading && !fetchingMore
            ) {
                onLoadMore(nextCursor);
            }
        };

        body.addEventListener('scroll', onScroll, { passive: true });
        return () => body.removeEventListener('scroll', onScroll);
    }, [hasMore, nextCursor, loading, fetchingMore, onLoadMore]);

    const columns = buildColumns();

    return (
        <div ref={containerRef}>
            <Table
                columns={columns}
                dataSource={loading ? skeletonRows : rows}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 'max-content', y: 'calc(100vh - 320px)' }}
                locale={{
                    emptyText: (
                        <div style={{ padding: 40, textAlign: 'center' }}>
                            <CarOutlined style={{ fontSize: 32, color: '#d9d9d9', display: 'block', marginBottom: 8 }} />
                            <Text type="secondary">No deliveries with Borzo assignment found</Text>
                        </div>
                    )
                }}
                summary={() =>
                    !hasMore && rows.length > 0 && !loading ? (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={columns.length}>
                                <div style={{ textAlign: 'center', color: '#bfbfbf', fontSize: 12, padding: '4px 0' }}>
                                    All deliveries loaded
                                </div>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    ) : null
                }
            />

            {fetchingMore && (
                <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Array.from({ length: 3 }, (_, i) => (
                        <Skeleton.Input key={i} active size="small"
                            style={{ width: '100%', height: 40, borderRadius: 6 }} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeliveryTable;