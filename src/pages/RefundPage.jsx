import { Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import useRefund from "../hooks/useRefund";
import usePermissions from "../hooks/usePermissions";
import RefundDetailModal from "./Refunds/RefundDetailModal";
import RefundFilters from "./Refunds/RefundFilters";
import RefundStatsBar from "./Refunds/RefundStatsBar";
import RefundTable from "./Refunds/RefundTable";

const { Title } = Typography;

export default function RefundPage() {
    const { canUpdate } = usePermissions();
    const canManageRefunds = canUpdate("refund"); 

    const {
        refunds,
        loading,
        fetchingMore,
        approvingRefundId,
        rejectingRefundId,
        refundStats,
        refundHasMore,
        fetchRefunds,
        fetchMoreRefunds,
        approveRefund,
        rejectRefund,
    } = useRefund();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [selectedRefund, setSelectedRefund] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [intendedAction, setIntendedAction] = useState(null);

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    const filteredRefunds = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return refunds.filter((refund) => {
            const matchesSearch =
                !normalizedSearch ||
                refund.orderNumber?.toLowerCase().includes(normalizedSearch) ||
                refund.customerName?.toLowerCase().includes(normalizedSearch) ||
                refund.customerPhone?.toLowerCase().includes(normalizedSearch) ||
                refund.cancellationReason?.toLowerCase().includes(normalizedSearch);

            const matchesStatus =
                statusFilter === "ALL" ||
                refund.refundStatus?.toUpperCase() === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [refunds, search, statusFilter]);

    const handleViewDetail = (refund, action = "view") => {
        setSelectedRefund(refund);
        setIntendedAction(action);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedRefund(null);
        setIntendedAction(null);
    };

    const handleApproveRefund = async (refundAmount, adminNote) => {
        if (!canManageRefunds) return;
        if (!selectedRefund?.id) return;

        const res = await approveRefund(selectedRefund.id, refundAmount, adminNote);

        if (res?.success) {
            handleCloseModal();
        }

        return res;
    };

    const handleRejectRefund = async (rejectionReason, adminNote) => {
        if (!canManageRefunds) return;
        if (!selectedRefund?.id) return;

        const res = await rejectRefund(selectedRefund.id, rejectionReason);

        if (res?.success) {
            handleCloseModal();
        }

        return res;
    };

    const handleQuickApprove = async (record, refundAmount, adminNote) => {
        if (!canManageRefunds) return;
        return approveRefund(record.id, refundAmount, adminNote);
    };

    const handleQuickReject = async (record, rejectionReason, adminNote) => {
        if (!canManageRefunds) return;
        return rejectRefund(record.id, rejectionReason);
    };

    return (
        <div style={{ padding: 24, background: "#f5f6fa", minHeight: "100vh" }}>
            <div style={{ marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
                    Refund Management
                </Title>
            </div>

            <RefundStatsBar stats={refundStats} loading={loading} />

            <RefundFilters
                search={search}
                statusFilter={statusFilter}
                onSearch={setSearch}
                onStatusChange={setStatusFilter}
            />

            <RefundTable
                refunds={filteredRefunds}
                loading={loading}
                loadingMore={fetchingMore}
                hasMore={refundHasMore}
                onLoadMore={fetchMoreRefunds}
                onViewDetail={(record) => handleViewDetail(record, "view")}
                onQuickApprove={handleQuickApprove}
                onQuickReject={handleQuickReject}
                approvingRefundId={approvingRefundId}
                rejectingRefundId={rejectingRefundId}
                canManageRefunds={canManageRefunds}
            />

            <RefundDetailModal
                open={modalOpen}
                refund={selectedRefund}
                initialAction={intendedAction}
                onClose={handleCloseModal}
                onApprove={handleApproveRefund}
                onReject={handleRejectRefund}
                approving={
                    approvingRefundId !== null &&
                    String(approvingRefundId) === String(selectedRefund?.id)
                }
                rejecting={
                    rejectingRefundId !== null &&
                    String(rejectingRefundId) === String(selectedRefund?.id)
                }
                canManageRefunds={canManageRefunds}
            />
        </div>
    );
}