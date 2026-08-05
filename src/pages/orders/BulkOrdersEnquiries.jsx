import { DatePicker, Input, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import OrderTrackingModal from '../../components/modals/OrderTrackingModal';
import useBulkOrders from '../../hooks/useBulkOrdersEnquiry';
import usePermissions from '../../hooks/usePermissions';
import BulkOrderDetailsModal from './components/BulkOrderDetailsModal';
import BulkOrdersEnquiryTable from './components/BulkOrdersEnquiryTable';
import BulkOrderTrackingModal from '../../components/modals/BulkOrderTrackingModal';

const { Title } = Typography;

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const BulkOrderEnquiries = () => {
    const { canUpdate } = usePermissions();
    const canManageOrders = canUpdate('order', 'bulk_order_enquiry');
    // ── Filter state ──────────────────────────────────────────────────────────
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState(null);

    // ── Detail modal state ────────────────────────────────────────────────────
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    // const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');

    const [bulkOrderModalOpen, setBulkOrderModalOpen] = useState(false);
    const [selectedBulkOrder, setSelectedBulkOrder] = useState(null);

    const [newStatus, setNewStatus] = useState("pending");
    const [adminMessage, setAdminMessage] = useState("");

    const handleOpenBulkOrderModal = (order) => {
        setSelectedBulkOrder(order);
        setNewStatus(order.status);
        setAdminMessage(order.adminMessage || "");
        setBulkOrderModalOpen(true);
    };


    // ── Tracking modal state ──────────────────────────────────────────────────
    const [trackingModalVisible, setTrackingModalVisible] = useState(false);

    const { enquiries, loading, updateLoading, fetchEnquiries, changeBulkOrderStatus, fetchingMore, nextCursor, hasMore } =
        useBulkOrders();

    // ── Initial load + debounced search ──────────────────────────────────────
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchEnquiries(searchText || null);
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchEnquiries, searchText]);

    // ── Shared status update — used by both modals ────────────────────────────
    const handleStatusUpdate = async () => {
        if (!canManageOrders) return false;
        if (!selectedEnquiry) return false;

        const res = await changeBulkOrderStatus(
            selectedEnquiry.id,
            newStatus,
            selectedEnquiry.bulkOrderDetails || '',
            adminMessage
        );

        if (res.success) {
            setDetailModalVisible(false);
            setTrackingModalVisible(false);
            return true;
        }

        return false;
    };

    const handleViewDetails = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setNewStatus(enquiry.status || 'pending');
    setAdminMessage(enquiry.adminMessage || '');
    setDetailModalVisible(true);
};

const handleBulkOrderStatusUpdate = async () => {
    if (!selectedBulkOrder) return false;

    const response = await changeBulkOrderStatus(
        selectedBulkOrder.id,
        newStatus,
        selectedBulkOrder.bulkOrderDetails || '',
        adminMessage
    );

    if (response.success) {
        await fetchEnquiries(searchText || null);
        setBulkOrderModalOpen(false);
        return true;
    }

    return false;
};
    // ── Open detail modal ─────────────────────────────────────────────────────
    const handleTrackOrder = (enquiry) => {
        setSelectedEnquiry(enquiry);
        setNewStatus(enquiry.status || 'pending');
        setAdminMessage(enquiry.adminMessage || '');
        setTrackingModalVisible(true);
    };


    // const handleBulkOrderStatusUpdate = async () => {
    //     if (!selectedBulkOrder) return false;

    //     const response = await changeBulkOrderStatus(
    //         selectedBulkOrder.id,
    //         newStatus,
    //         selectedBulkOrder.bulkOrderDetails || "",
    //         adminMessage
    //     );

    //     if (response.success) {
    //         await fetchEnquiries(searchText || null);
    //         setBulkOrderModalOpen(false);
    //         return true;
    //     }

    //     return false;
    // };

    // ── Client-side filters ───────────────────────────────────────────────────
    const filteredEnquiries = enquiries.filter((enquiry) => {
        const matchesStatus =
            statusFilter === 'all' || enquiry.status === statusFilter;

        let matchesDate = true;
        if (dateRange?.length === 2 && enquiry.createdAt) {
            const enquiryDate = dayjs(enquiry.createdAt);
            matchesDate =
                enquiryDate.isAfter(dateRange[0].startOf('day')) &&
                enquiryDate.isBefore(dateRange[1].endOf('day'));
        }

        return matchesStatus && matchesDate;
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
                Bulk Order Enquiries
            </Title>

            {/* ── Filters ───────────────────────────────────────────────────────── */}
            <Space wrap style={{ marginBottom: 16 }}>
                <Search
                    size="small"
                    placeholder="Search enquiries..."
                    allowClear
                    style={{ width: 250 }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />

                <Select
                    size="small"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 160 }}
                >
                    <Option value="all">All Status</Option>
                    <Option value="pending">Pending</Option>
                    <Option value="confirmed">Confirmed</Option>
                    <Option value="processing">Processing</Option>
                    <Option value="completed">Completed</Option>
                    <Option value="cancelled">Cancelled</Option>
                </Select>

                <RangePicker
                    size="small"
                    value={dateRange}
                    onChange={setDateRange}
                    format="DD-MM-YYYY"
                />
            </Space>

            {/* ── Table ─────────────────────────────────────────────────────────── */}
            <div style={{ flex: 1, minHeight: 0 }}>
                <BulkOrdersEnquiryTable
                    loading={loading}
                    fetchingMore={fetchingMore}
                    hasMore={hasMore}
                    nextCursor={nextCursor}
                    enquiries={filteredEnquiries}
                    onViewDetails={handleViewDetails}
                    onTrackOrder={handleOpenBulkOrderModal}
                    onLoadMore={(cursor) =>
                        fetchEnquiries(searchText, cursor, true)
                    }
                />
            </div>

            {/* ── Detail Modal ───────────────────────────────────────────────────── */}
            <BulkOrderDetailsModal
                open={detailModalVisible}
                enquiry={selectedEnquiry}
                onCancel={() => setDetailModalVisible(false)}
                newStatus={newStatus}
                setNewStatus={setNewStatus}
                adminMessage={adminMessage}
                setAdminMessage={setAdminMessage}
                onStatusUpdate={handleStatusUpdate}
                updateLoading={updateLoading}
                canUpdateStatus={canManageOrders}

            />

            {/* ── Tracking Modal (reused as-is) ──────────────────────────────────── */}
            <BulkOrderTrackingModal
                open={bulkOrderModalOpen}
                order={selectedBulkOrder}
                onCancel={() => setBulkOrderModalOpen(false)}
                newStatus={newStatus}
                setNewStatus={setNewStatus}
                adminMessage={adminMessage}
                setAdminMessage={setAdminMessage}
                onStatusUpdate={handleBulkOrderStatusUpdate}
                statusUpdateLoading={updateLoading}
            />
        </div>
    );
};

export default BulkOrderEnquiries;