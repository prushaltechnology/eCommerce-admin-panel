import { Typography } from 'antd';
import { useEffect, useState } from 'react';
import OrderDetailsModal from '../../components/modals/OrderDetailsModal';
import useOrders from '../../hooks/useOrders';
import SystemOrdersFilters from './components/SystemOrdersFilters';
import SystemOrdersStats from './components/SystemOrdersStats';
import SystemOrdersTable from './components/SystemOrdersTable';
import usePermissions from '../../hooks/usePermissions';
const { Title } = Typography;

const UserOrders = () => {
  const { canUpdate } = usePermissions();
  const canManageOrders = canUpdate('order', 'system_order');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Single date instead of date range
  const [selectedDate, setSelectedDate] = useState(null);

  // Order detail modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // Infinite scroll loading indicator
  const [tableScrollLoading, setTableScrollLoading] = useState(false);

  const {
    orders,
    loading,
    fetchOrders,
    fetchMoreOrders,
    ordersHasMore,
    changeOrderStatus,
    cancelOrder,
    ordersStats,
  } = useOrders();

  // Convert selected date to API-ready date string
  const getDateParam = () => {
    if (!selectedDate) return null;
    return selectedDate.format('YYYY-MM-DD');
  };

  // Debounced search + single date filter
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOrders('storefront', searchText || null, getDateParam());
    }, 300);

    return () => clearTimeout(timeout);
  }, [fetchOrders, searchText, selectedDate]);

  // Load more
  const handleLoadMore = () => {
    if (tableScrollLoading || !ordersHasMore) {
      return Promise.resolve();
    }

    setTableScrollLoading(true);

    return fetchMoreOrders().finally(() => {
      setTableScrollLoading(false);
    });
  };

  // Status update
  const handleStatusUpdate = async () => {
    if (!selectedOrder) return false;

    try {
      const res = await changeOrderStatus(
        selectedOrder.id,
        newStatus,
        statusNote
      );

      if (res.success) {
        fetchOrders('storefront', searchText || null, getDateParam());
        setDetailModalVisible(false);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  };

  // View order details
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNote('');
    setDetailModalVisible(true);
  };

  // Cancel order
  const handleCancelOrder = async (order) => {
    if (!order?.id) return;

    try {
      setCancellingOrderId(order.id);
      await cancelOrder(order.id);
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Client-side status filter
  // Date filtering is handled by the backend
  const filteredOrders = orders.filter((order) => {
    return (
      statusFilter === 'all' ||
      order.status?.toLowerCase() === statusFilter.toLowerCase()
    );
  });

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Title level={4} style={{ marginBottom: 20 }}>
        User Orders (Storefront) Management
      </Title>

      <SystemOrdersStats
        stats={ordersStats}
        loading={loading}
      />

      <SystemOrdersFilters
        searchText={searchText}
        statusFilter={statusFilter}
        selectedDate={selectedDate}
        onSearch={setSearchText}
        onStatusChange={setStatusFilter}
        onDateChange={setSelectedDate}
      />

      <div
        style={{
          flex: 1,
          minHeight: 0,
        }}
      >
        <SystemOrdersTable
          loading={loading}
          orders={filteredOrders}
          hasMore={ordersHasMore}
          tableScrollLoading={tableScrollLoading}
          onViewDetails={handleViewDetails}
          onCancelOrder={handleCancelOrder}
          cancellingOrderId={cancellingOrderId}
          onLoadMore={handleLoadMore}
          canManageOrders={canManageOrders}

        />
      </div>

      <OrderDetailsModal
        open={detailModalVisible}
        order={selectedOrder}
        onCancel={() => setDetailModalVisible(false)}
        statusNote={statusNote}
      />
    </div>
  );
};

export default UserOrders;