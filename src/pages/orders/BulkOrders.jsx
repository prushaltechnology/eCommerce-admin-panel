import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import OrderDetailsModal from '../../components/modals/OrderDetailsModal';
import useBulkOrders from '../../hooks/useBulkOrders';
import usePermissions from '../../hooks/usePermissions';
import ManualOrderModal from './components/ManualOrderModal';
import SystemOrdersFilters from './components/SystemOrdersFilters';
import SystemOrdersStats from './components/SystemOrdersStats';
import SystemOrdersTable from './components/SystemOrdersTable';

const BulkOrders = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  //const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingData, setTrackingData] = useState([]);
  const [manualOrderVisible, setManualOrderVisible] = useState(false);
  const { canUpdate } = usePermissions()
  const canManageOrders = canUpdate('order', 'bulk');
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
  } = useBulkOrders();
  const [tableScrollLoading, setTableScrollLoading] = useState(false);
  // const tableWrapperRef = useRef(null);
  const fetchingRef = useRef(false);
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

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNote('');
    setDetailModalVisible(true);
  };


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
          Bulk Orders Management
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
            Take Bulk Order
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

      {/* TABLE */}

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
          // ref={tableWrapperRef}
          style={{
            flex: 1,
            minHeight: 0
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
            onLoadMore={async () => {
              if (
                loading ||
                tableScrollLoading ||
                fetchingRef.current ||
                !hasMore
              ) {
                return;
              }

              fetchingRef.current = true;
              setTableScrollLoading(true);

              try {
                await fetchMoreOrders();
              } finally {
                fetchingRef.current = false;
                setTableScrollLoading(false);
              }
            }}
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
      //onStatusUpdate={handleStatusUpdate}
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
          defaultOrderType="bulk"
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

export default BulkOrders;