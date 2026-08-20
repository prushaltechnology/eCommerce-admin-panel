import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import OrderDetailsModal from '../../components/modals/OrderDetailsModal';
import useOrders from '../../hooks/useOrders';
import usePermissions from '../../hooks/usePermissions';
import ManualOrderModal from './components/ManualOrderModal';
import SystemOrdersFilters from './components/SystemOrdersFilters';
import SystemOrdersStats from './components/SystemOrdersStats';
import SystemOrdersTable from './components/SystemOrdersTable';

const SystemOrders = () => {
  const { canUpdate } = usePermissions();
  const canManageOrders = canUpdate('order', 'system_order');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  //const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  //const [trackingLoading, setTrackingLoading] = useState(false);
  //const [trackingData, setTrackingData] = useState([]);
  const [manualOrderVisible, setManualOrderVisible] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

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

  const [tableScrollLoading, setTableScrollLoading] = useState(false);
  const tableWrapperRef = useRef(null);
  const { Title } = Typography;

  // Convert selected date to API-ready date string
  const getDateParam = () => {
    if (!selectedDate) return null;
    return selectedDate.format('YYYY-MM-DD');
  };

  // Debounced search + single date filter
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOrders('admin_panel', searchText || null, getDateParam());
    }, 300);

    return () => clearTimeout(timeout);
  }, [fetchOrders, searchText, selectedDate]);

  useEffect(() => {
    const tableBody =
      tableWrapperRef.current?.querySelector(
        '.ant-table-body'
      );

    if (!tableBody) return;

    const handleScroll = (event) => {
      const target = event.target;

      if (
        loading ||
        tableScrollLoading ||
        !ordersHasMore
      ) {
        return;
      }

      if (
        target.scrollTop +
        target.clientHeight >=
        target.scrollHeight - 80
      ) {
        setTableScrollLoading(true);

        fetchMoreOrders()
          .finally(() =>
            setTableScrollLoading(false)
          );
      }
    };

    tableBody.addEventListener(
      'scroll',
      handleScroll
    );

    return () => {
      tableBody.removeEventListener(
        'scroll',
        handleScroll
      );
    };
  }, [
    loading,
    tableScrollLoading,
    ordersHasMore,
    fetchMoreOrders
  ]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNote('');
    setDetailModalVisible(true);
  };

  // const handleTrackOrder = async (order) => {
  //   setSelectedOrder(order);
  //   // SET CURRENT STATUS
  //   setNewStatus(order.status || 'pending');

  //   // RESET NOTE
  //   setStatusNote('');
  //   setTrackingModalVisible(true);
  //   setTrackingLoading(true);
  //   try {
  //     const { getOrderTracking } = await import('../../api/orders');
  //     const res = await getOrderTracking(order.id);
  //     setTrackingData(res.success ? res.tracking || [] : []);
  //   } catch {
  //     setTrackingData([]);
  //   } finally {
  //     setTrackingLoading(false);
  //   }
  // };

  // const handleStatusUpdate = async () => {
  //   if (!canManageOrders) return false;

  //   if (!selectedOrder) return false;
  //   try {
  //     const res = await changeOrderStatus(
  //       selectedOrder.id,
  //       newStatus,
  //       statusNote
  //     );
  //     if (res.success) {
  //       fetchOrders('admin_panel');
  //       setDetailModalVisible(false);
  //       return true;
  //     }
  //     return false;
  //   } catch (error) {
  //     console.error(error);
  //     return false;
  //   }
  // };

  const handleCancelOrder = async (
    order,
    cancellationReason = 'Cancelled by admin',
    cancellationNote = '',
  ) => {
    if (!canManageOrders || !order?.id) return;

    try {
      setCancellingOrderId(order.id);

      return await cancelOrder(
        order.id,
        cancellationReason,
        cancellationNote,
      );
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Status filter is still client-side; date filtering is now handled by the backend
  const filteredOrders = orders.filter((order) => {
    return statusFilter === 'all' || order.status === statusFilter;
  });

  return (

    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* PAGE HEADER */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >

        <Title
          level={4}
          style={{ margin: 0 }}
        >
          System Orders Management
        </Title>

        {canManageOrders && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              setManualOrderVisible(true)
            }
            size="small"
          >
            Take Order
          </Button>
        )}

      </div>

      {/* STATS */}

      <SystemOrdersStats
        stats={ordersStats}
        loading={loading}
      />

      {/* FILTERS */}

      <SystemOrdersFilters
        searchText={searchText}
        statusFilter={statusFilter}
        selectedDate={selectedDate}
        onSearch={setSearchText}
        onStatusChange={setStatusFilter}
        onDateChange={setSelectedDate}
      />


      <Card
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
        bodyStyle={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          padding: 0,
        }}
      >
        <div
          ref={tableWrapperRef}

          style={{
            flex: 1,
            minHeight: 0,
            padding: 16,
          }}
        >
          <SystemOrdersTable
            loading={loading}
            orders={filteredOrders}
            onViewDetails={handleViewDetails}
            onCancelOrder={handleCancelOrder}
            cancellingOrderId={cancellingOrderId}
            canManageOrders={canManageOrders}
            hasMore={ordersHasMore}
            tableScrollLoading={tableScrollLoading}
            onLoadMore={fetchMoreOrders}
          />

          {ordersHasMore && tableScrollLoading && (
            <div style={{ textAlign: 'center', padding: 12 }}>
              Loading more orders...
            </div>
          )}
          {/* {!ordersHasMore &&
            filteredOrders.length > 0 &&
            !loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: 12,
                  color: "#999",
                  fontSize: 13,
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                No more orders to load
              </div>
            )} */}
        </div>
      </Card>

      <OrderDetailsModal
        open={detailModalVisible}
        order={selectedOrder}
        onCancel={() => setDetailModalVisible(false)}
        newStatus={newStatus}
        //setNewStatus={setNewStatus}
        statusNote={statusNote}
      //setStatusNote={setStatusNote}
      //onStatusUpdate={handleStatusUpdate}
      // canUpdateStatus={canManageOrders}
      />

      {/* <OrderTrackingModal
        open={trackingModalVisible}
        order={selectedOrder}
        trackingLoading={trackingLoading}
        trackingData={trackingData}
        onCancel={() => setTrackingModalVisible(false)}

        newStatus={newStatus}
        setNewStatus={setNewStatus}

        statusNote={statusNote}
        setStatusNote={setStatusNote}

        onStatusUpdate={handleStatusUpdate}
        statusUpdateLoading={loading}
        canUpdateStatus={canManageOrders}
      /> */}

      {canManageOrders && (
        <ManualOrderModal
          visible={manualOrderVisible}
          onClose={() => setManualOrderVisible(false)}
          onOrderCreated={() => {
            setManualOrderVisible(false);
            fetchOrders('admin_panel', searchText || null, getDateParam());
          }}
        />
      )}
    </div>
  );
};

export default SystemOrders;