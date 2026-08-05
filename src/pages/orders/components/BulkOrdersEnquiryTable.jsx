import { EyeOutlined, TruckOutlined } from '@ant-design/icons';
import { Button, Skeleton, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';

const getStatusColor = (status) => {
    const colors = {
        pending: 'orange',
        confirmed: 'blue',
        processing: 'purple',
        completed: 'green',
        cancelled: 'red',
    };
    return colors[status] || 'default';
};

const getProductImage = (product) => {
    const validImage = product?.images?.find(
        (img) => img.image && img.image.trim() !== ''
    );
    if (!validImage) return null;
    return validImage.image.startsWith('data:')
        ? validImage.image
        : `${import.meta.env.VITE_GRAPHQL_URI.replace('/graphql/', '').replace('/graphql', '')}/media/${validImage.image}`;
};

const skeletonRows = Array.from({ length: 6 }).map((_, index) => ({
    id: `skeleton-${index}`,
    isSkeleton: true,
}));

const BulkOrdersEnquiryTable = ({ loading, enquiries, fetchingMore, hasMore, nextCursor, onLoadMore, onViewDetails, onTrackOrder }) => {
    const tableContainerRef = useRef(null);
    useEffect(() => {
        const tableBody =
            tableContainerRef.current?.querySelector(
                '.ant-table-body'
            );

        if (!tableBody) return;

        const handleScroll = (e) => {
            const {
                scrollTop,
                scrollHeight,
                clientHeight,
            } = e.target;

            if (
                scrollHeight - scrollTop <=
                clientHeight + 50 &&
                hasMore &&
                nextCursor &&
                !loading &&
                !fetchingMore
            ) {
                onLoadMore(nextCursor);
            }
        };

        tableBody.addEventListener(
            'scroll',
            handleScroll
        );

        return () =>
            tableBody.removeEventListener(
                'scroll',
                handleScroll
            );
    }, [
        hasMore,
        nextCursor,
        loading,
        fetchingMore,
        onLoadMore,
    ]);
    const columns = [
        {
            title: 'Enquiry ID',
            dataIndex: 'id',
            key: 'id',
            width: 100,
            render: (id, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input active size="small" style={{ width: 60 }} />
                ) : (
                    <span style={{ fontWeight: 'bold' }}>#{id}</span>
                ),
        },
        {
            title: 'Customer',
            dataIndex: 'placedByUser',
            key: 'placedByUser',
            render: (user, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input active size="small" style={{ width: 140 }} />
                ) : (
                    <span style={{ fontWeight: 500 }}>
                        {user?.firstName} {user?.lastName}
                    </span>
                ),
        },
        {
            title: 'Products',
            dataIndex: 'items',
            key: 'products',
            render: (items, record) => {
                if (record.isSkeleton) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[1, 2].map((i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Skeleton.Image active style={{ width: 40, height: 40, borderRadius: 4 }} />
                                    <div>
                                        <Skeleton.Input active size="small" style={{ width: 120 }} />
                                        <div style={{ marginTop: 4 }}>
                                            <Skeleton.Input active size="small" style={{ width: 60 }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                }
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {items?.map((item, index) => {
                            const product = item.product;
                            const imageSrc = getProductImage(product);
                            return (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {imageSrc ? (
                                        <img
                                            src={imageSrc}
                                            alt={product?.name}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                objectFit: 'cover',
                                                borderRadius: 4,
                                                border: '1px solid #f0f0f0',
                                            }}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                backgroundColor: '#f5f5f5',
                                                borderRadius: 4,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #e0e0e0',
                                            }}
                                        >
                                            <span style={{ fontSize: 10, color: '#999' }}>No Img</span>
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                                            {product?.name || 'Unknown Product'}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#666' }}>
                                            Qty: {item.quantity}
                                            {product?.measureValue && product?.unit
                                                ? ` · ${product.measureValue} ${product.unit}`
                                                : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            },
        },
        {
            title: 'Bulk Order Details',
            dataIndex: 'bulkOrderDetails',
            key: 'bulkOrderDetails',
            ellipsis: true,
            render: (details, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input active size="small" style={{ width: 180 }} />
                ) : (
                    <span style={{ fontSize: 13, color: '#555' }}>
                        {details || <span style={{ color: '#bbb', fontStyle: 'italic' }}>No details</span>}
                    </span>
                ),
        },
        {
            title: 'Delivery Date',
            key: 'deliveryDate',

            render: (_, record) => {
                if (record.isSkeleton) {
                    return (
                        <Skeleton.Input
                            active
                            size="small"
                            style={{ width: 160 }}
                        />
                    );
                }

                const deliveryDate = record.isAdvanceBooking
                    ? record.advanceDeliveryDatetime
                    : record.createdAt;

                return dayjs(deliveryDate).format('DD/MM/YYYY h:mm A');
            },

            sorter: (a, b) => {
                const dateA = a.isAdvanceBooking
                    ? a.advanceDeliveryDatetime
                    : a.createdAt;

                const dateB = b.isAdvanceBooking
                    ? b.advanceDeliveryDatetime
                    : b.createdAt;

                return new Date(dateA) - new Date(dateB);
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status, record) =>
                record.isSkeleton ? (
                    <Skeleton.Button active size="small" style={{ width: 90 }} />
                ) : (
                    <Tag color={getStatusColor(status)}>
                        {status ? status.toUpperCase() : 'UNKNOWN'}
                    </Tag>
                ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, record) => {
                if (record.isSkeleton) {
                    return (
                        <Space size="small">
                            <Skeleton.Button active size="small" shape="circle" />
                            <Skeleton.Button active size="small" shape="circle" />
                        </Space>
                    );
                }
                return (
                    <Space size="small">
                        <Button
                            type="primary"
                            ghost
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => onViewDetails(record)}
                        />
                        <Button
                            type="default"
                            size="small"
                            icon={<TruckOutlined />}
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
                            onClick={() => onTrackOrder(record)}
                        />
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            <div
                ref={tableContainerRef}
                style={{
                    height: '100%',
                    minHeight: 0,
                }}
            >
                <Table
                    columns={columns}
                    dataSource={loading ? skeletonRows : enquiries}
                    size="small"
                    rowKey="id"
                    pagination={false}
                    scroll={{
                        x: 'max-content',
                        y: 'calc(100vh - 250px)',
                    }}
                />
            </div>

            {fetchingMore && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: 12,
                    }}
                >
                    Loading more enquiries...
                </div>
            )}

            {!hasMore &&
                enquiries.length > 0 &&
                !loading &&
                !fetchingMore && (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: 12,
                            color: '#999',
                            fontSize: 12,
                        }}
                    >
                        No more enquiries to load
                    </div>
                )}
        </>
    );
};

export default BulkOrdersEnquiryTable;