import {
  Button,
  Input,
  Modal,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import {
  EyeOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  CarOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  UndoOutlined,
  StopOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const getStatusIcon = (status) => {
  const iconStyle = {
    fontSize: 12,
  };

  switch (status?.toLowerCase()) {
    case "payment_pending":
      return <CreditCardOutlined style={iconStyle} />;

    case "payment_successful":
      return <CheckCircleOutlined style={iconStyle} />;

    case "scheduled":
      return <CalendarOutlined style={iconStyle} />;

    case "adv_order_confirmed":
      return <CheckCircleOutlined style={iconStyle} />;

    case "pending":
      return <ClockCircleOutlined style={iconStyle} />;

    case "confirmed":
      return <ShoppingOutlined style={iconStyle} />;

    case "dispatched":
      return <CarOutlined style={iconStyle} />;

    case "delivered":
      return <CheckCircleOutlined style={iconStyle} />;

    case "cancelled":
      return <CloseCircleOutlined style={iconStyle} />;

    case "refunded":
      return <UndoOutlined style={iconStyle} />;

    case "refund_rejected":
      return <StopOutlined style={iconStyle} />;

    default:
      return <QuestionCircleOutlined style={iconStyle} />;
  }
};

const getStatusColor = (status) => {
  const colors = {
    payment_pending: "gold",
    payment_successful: "cyan",
    scheduled: "geekblue",
    adv_order_confirmed: "gold",
    pending: "orange",
    confirmed: "blue",
    dispatched: "purple",
    delivered: "green",
    cancelled: "red",
    refunded: "magenta",
    refund_rejected: "volcano",
  };

  return colors[status?.toLowerCase()] || "default";
};

const formatStatus = (status) => {
  if (!status) return 'Unknown';

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getProductImage = (product) => {
  const validImage = product?.images?.find(img => img.image && img.image.trim() !== '');
  if (!validImage) return null;
  return validImage.image.startsWith('data:')
    ? validImage.image
    : `${import.meta.env.VITE_GRAPHQL_URI.replace('/graphql/', '').replace('/graphql', '')}/media/${validImage.image}`;
};

const skeletonRows = Array.from({ length: 6 }).map((_, index) => ({
  id: `skeleton-${index}`,
  isSkeleton: true,
}));

const SystemOrdersTable = ({
  loading,
  orders,
  hasMore,
  tableScrollLoading,
  onViewDetails,
  onCancelOrder,
  cancellingOrderId,
  canManageOrders,
  onLoadMore,
}) => {
  const tableRef = useRef(null);
  const fetchingRef = useRef(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellationNote, setCancellationNote] = useState('');
  // ── Infinite scroll — lives here, next to the element that scrolls ──────────
  useEffect(() => {
    const tableBody = tableRef.current?.querySelector('.ant-table-body');
    if (!tableBody) return;

    const handleScroll = () => {
      if (loading || tableScrollLoading || fetchingRef.current || !hasMore) return;

      const { scrollTop, clientHeight, scrollHeight } = tableBody;
      if (scrollTop + clientHeight >= scrollHeight - 80) {
        fetchingRef.current = true;
        onLoadMore?.()?.finally?.(() => {
          fetchingRef.current = false;
        });
      }
    };

    tableBody.addEventListener('scroll', handleScroll, { passive: true });
    return () => tableBody.removeEventListener('scroll', handleScroll);
  }, [loading, tableScrollLoading, hasMore, onLoadMore]);

  const handleOpenCancelModal = (order) => {
    setSelectedOrder(order);
    setCancellationNote('');
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    if (cancellingOrderId) return;

    setCancelModalOpen(false);
    setSelectedOrder(null);
    setCancellationNote('');
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder?.id) return;

    await onCancelOrder(
      selectedOrder,
      'Cancelled by admin',
      cancellationNote.trim(),
    );

    setCancelModalOpen(false);
    setSelectedOrder(null);
    setCancellationNote('');
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (orderNumber, record) =>
        record.isSkeleton ? (
          <Skeleton.Input active size="small" style={{ width: 120 }} />
        ) : (
          <span style={{ fontWeight: 'bold' }}>{orderNumber}</span>
        ),
    },
    {
      title: 'Products',
      dataIndex: 'items',
      key: 'products',
      render: (items, record) => {
        if (record.isSkeleton) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Skeleton.Image active style={{ width: 40, height: 40, borderRadius: 4 }} />
                  <div>
                    <Skeleton.Input active size="small" style={{ width: 120 }} />
                    <div style={{ marginTop: 6 }}>
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
                      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: 40, height: 40, backgroundColor: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e0e0' }}>
                      <span style={{ fontSize: 10, color: '#999' }}>No Img</span>
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{product?.name || 'Unknown Product'}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Qty: {item.quantity}</div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      title: 'Amount',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      render: (amount, record) =>
        record.isSkeleton ? (
          <Skeleton.Input active size="small" style={{ width: 80 }} />
        ) : (
          <span style={{ fontWeight: 'bold' }}>₹{parseFloat(amount || 0).toFixed(2)}</span>
        ),
      sorter: (a, b) => parseFloat(a.finalAmount) - parseFloat(b.finalAmount),
    },
    {
      title: 'Customer Name',
      dataIndex: 'customer',
      key: 'customerName',
      render: (customer, record) =>
        record.isSkeleton ? (
          <Skeleton.Input active size="small" style={{ width: 140 }} />
        ) : (
          <span style={{ fontWeight: 500 }}>
            {customer?.firstName} {customer?.lastName}
          </span>
        ),
    },
    {
      title: 'Order Type',
      dataIndex: 'orderType',
      key: 'orderType',
      render: (orderType, record) => {
        if (record.isSkeleton) {
          return (
            <Skeleton.Input
              active
              size="small"
              style={{ width: 140 }}
            />
          );
        }

        const isWalkIn =
          record.purchaseType?.toUpperCase() ===
          'WALK_IN_PURCHASE';

        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
            }}
          >
            <Tag color={isWalkIn ? 'green' : 'blue'}>
              {formatStatus(orderType)}
            </Tag>

            <span
              style={{
                fontSize: 11,
                color: '#8c8c8c',
              }}
            >
              {formatStatus(record.purchaseType)}
            </span>
          </div>
        );
      },
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
      render: (status, record) =>
        record.isSkeleton ? (
          <Skeleton.Button
            active
            size="small"
            style={{ width: 120 }}
          />
        ) : (
          <Tag
            color={getStatusColor(status)}
            icon={getStatusIcon(status)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {formatStatus(status)}
          </Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      render: (_, record) => {
        if (record.isSkeleton) {
          return (
            <Space>
              <Skeleton.Button
                active
                size="small"
                shape="circle"
              />

              <Skeleton.Button
                active
                size="small"
                shape="circle"
              />
            </Space>
          );
        }

        const isCancelled =
          record.status?.toLowerCase() === 'cancelled';

        const isDelivered =
          record.status?.toLowerCase() === 'delivered';

        const isWalkInPurchase =
          record.purchaseType?.toUpperCase() === 'WALK_IN_PURCHASE';

        const cannotCancel =
          isCancelled ||
          isDelivered ||
          isWalkInPurchase;

        return (
          <Space size={6}>
            <Tooltip title="View Order">
              <Button
                type="primary"
                ghost
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onViewDetails(record)}
              />
            </Tooltip>

            {canManageOrders && !cannotCancel && (
              <Tooltip title="Cancel Order">
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={cancellingOrderId === record.id}
                  onClick={() => handleOpenCancelModal(record)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div ref={tableRef}>
      <Table
        columns={columns}
        dataSource={loading ? skeletonRows : orders}
        size="small"
        rowKey="id"
        pagination={false}
        scroll={{ x: 'max-content', y: 'calc(100vh - 360px)' }}
        summary={() =>
          !hasMore && orders.length > 0 && !loading ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={columns.length}>
                <div style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: '2px 0' }}>
                  No more orders to load
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          ) : null
        }
      />

      {tableScrollLoading && (
        <div style={{ textAlign: 'center', padding: 12, color: '#999', fontSize: 13 }}>
          Loading more orders...
        </div>
      )}
      <Modal
        title="Cancel this order?"
        open={cancelModalOpen}
        onCancel={handleCloseCancelModal}
        onOk={handleConfirmCancel}
        okText="Yes, Cancel"
        cancelText="No"
        confirmLoading={
          cancellingOrderId === selectedOrder?.id
        }
        okButtonProps={{
          danger: true,
        }}
        destroyOnHidden
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            paddingTop: 8,
          }}
        >
          <p style={{ margin: 0 }}>
            Are you sure you want to cancel order{' '}
            <strong>
              {selectedOrder?.orderNumber}
            </strong>
            ?
          </p>

          <div>
            <div
              style={{
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Cancellation Reason
            </div>

            <Input
              value="Cancelled by admin"
              disabled
            />
          </div>

          <div>
            <div
              style={{
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Cancellation Note
            </div>

            <Input.TextArea
              value={cancellationNote}
              onChange={(e) =>
                setCancellationNote(e.target.value)
              }
              placeholder="Enter cancellation note (optional)"
              rows={4}
              maxLength={500}
              showCount
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SystemOrdersTable;