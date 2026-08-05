import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import OrderDetailsModal from '../../components/modals/OrderDetailsModal';
import useCustomOrders from '../../hooks/useCustomOrders';
import usePermissions from '../../hooks/usePermissions';
import ManualOrderModal from './components/ManualOrderModal';
import SystemOrdersFilters from './components/SystemOrdersFilters';
import SystemOrdersStats from './components/SystemOrdersStats';
import SystemOrdersTable from './components/SystemOrdersTable';

const CustomOrders = () => {
  const { canUpdate } = usePermissions();
  const canManageOrders = canUpdate('order', 'custom_order');
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
    hasMore,
    updateOrder,
    cancelOrder,
    ordersStats,
  } = useCustomOrders();
  const [tableScrollLoading, setTableScrollLoading] = useState(false);
  const tableWrapperRef = useRef(null);
  const { Title } = Typography;

  // Convert selected date to API-ready date string
  const getDateParam = () => {
    if (!selectedDate) return null;
    return selectedDate.format('YYYY-MM-DD');
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOrders(searchText || null, getDateParam());
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
        !hasMore
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
    hasMore,
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
  //   } catch (error) {
  //     setTrackingData([]);
  //   } finally {
  //     setTrackingLoading(false);
  //   }
  // };

  // const handleStatusUpdate = async () => {
  //   if (!canManageOrders) return false;
  //   if (!selectedOrder) return;
  //   try {
  //     const res = await updateOrder(selectedOrder.id, newStatus, statusNote);
  //     if (res.success) {
  //       fetchOrders(searchText || null);
  //       setDetailModalVisible(false);
  //       setTrackingModalVisible(false);

  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const handleCancelOrder = async (order) => {
    if (!canManageOrders || !order?.id) return;

    try {
      setCancellingOrderId(order.id);

      await cancelOrder(order.id);
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
          Custom Orders Management
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
            Take Custom Order
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

      {/* TABLE CARD */}

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
            hasMore={hasMore}
            tableScrollLoading={tableScrollLoading}
            onViewDetails={handleViewDetails}
            onCancelOrder={handleCancelOrder}
            cancellingOrderId={cancellingOrderId}
            canManageOrders={canManageOrders}
            onLoadMore={fetchMoreOrders}
          />

          {hasMore && tableScrollLoading && (
            <div
              style={{
                textAlign: 'center',
                padding: 12,
              }}
            >
              Loading more orders...
            </div>
          )}
        </div>
      </Card>

      {/* DETAILS MODAL */}

      <OrderDetailsModal
        open={detailModalVisible}
        order={selectedOrder}
        onCancel={() =>
          setDetailModalVisible(false)
        }
        newStatus={newStatus}
        //setNewStatus={setNewStatus}
        statusNote={statusNote}
      //setStatusNote={setStatusNote}
      //onStatusUpdate={
      //  handleStatusUpdate
      //}
      //canUpdateStatus={canManageOrders}
      />

      {/* TRACKING MODAL */}

      {/* <OrderTrackingModal
        open={trackingModalVisible}
        order={selectedOrder}
        trackingLoading={trackingLoading}
        trackingData={trackingData}
        onCancel={() =>
          setTrackingModalVisible(false)
        }
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        statusNote={statusNote}
        setStatusNote={setStatusNote}
        onStatusUpdate={
          handleStatusUpdate
        }
        statusUpdateLoading={loading}
        canUpdateStatus={canManageOrders}
      /> */}

      {/* MANUAL ORDER MODAL */}
      {canManageOrders && (
        <ManualOrderModal
          visible={manualOrderVisible}
          onClose={() =>
            setManualOrderVisible(false)
          }
          defaultOrderType="custom"
          onOrderCreated={() => {

            setManualOrderVisible(false);

            fetchOrders(
              searchText || null,
              getDateParam()
            );
          }}
        />
      )}
    </div>
  );
};

export default CustomOrders;