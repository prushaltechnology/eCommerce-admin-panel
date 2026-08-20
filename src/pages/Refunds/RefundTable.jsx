import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    LoadingOutlined,
} from "@ant-design/icons";
import {
    Button,
    Input,
    InputNumber,
    Modal,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";

const { Text } = Typography;
const { TextArea } = Input;

const formatAmount = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
};

const formatDate = (date) => {
    if (!date) return "—";

    return dayjs(date).format("DD/MM/YYYY h:mm A");
};

const normalizeStatus = (status) =>
    (status || "").toString().trim().toUpperCase();

function RefundStatusTag({ status }) {
    const configs = {
        PENDING: { color: "orange", icon: <ClockCircleOutlined /> },
        APPROVED: { color: "green", icon: <CheckCircleOutlined /> },
        REJECTED: { color: "red", icon: <CloseCircleOutlined /> },
    };

    const config = configs[normalizeStatus(status)] || {
        color: "default",
        icon: null,
    };

    return (
        <Tag color={config.color} icon={config.icon}>
            {status || "UNKNOWN"}
        </Tag>
    );
}

function PaymentStatusTag({ status }) {
    const colors = {
        PAID: "blue",
        REFUNDED: "green",
        PENDING: "orange",
        FAILED: "red",
    };

    return (
        <Tag color={colors[normalizeStatus(status)] || "default"}>
            {status || "UNKNOWN"}
        </Tag>
    );
}

// Invisible div at table bottom — fires onVisible when scrolled into view.
// Matches TransactionTable.jsx's pattern.
function ScrollSentinel({ onVisible, hasMore, loadingMore }) {
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !hasMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !loadingMore) {
                    onVisible();
                }
            },
            { threshold: 0.1 },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, onVisible]);

    return (
        <div
            ref={ref}
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "14px 0",
                minHeight: 40,
            }}
        >
            {loadingMore && <Spin indicator={<LoadingOutlined />} size="small" />}
        </div>
    );
}

// NEW: quick action modal used directly from the table
function QuickActionModal({
    open,
    mode, // "approve" | "reject"
    record,
    onClose,
    onConfirm,
    submitting,
}) {
    const [refundAmount, setRefundAmount] = useState(0);
    const [rejectionReason, setRejectionReason] = useState("");
    const [adminNote, setAdminNote] = useState("");

    useEffect(() => {
        if (open && record) {
            setRefundAmount(parseFloat(record.finalAmount || 0));
            setRejectionReason("");
            setAdminNote("");
        }
    }, [open, record]);

    if (!record) return null;

    const isApprove = mode === "approve";

    const handleOk = () => {
        if (isApprove) {
            onConfirm(record, refundAmount, adminNote);
        } else {
            if (!rejectionReason.trim()) return;
            onConfirm(record, rejectionReason.trim());
        }
    };

    return (
        <Modal
            title={isApprove ? "Approve Refund" : "Reject Refund"}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            confirmLoading={submitting}
            okText={isApprove ? "Approve" : "Reject"}
            okButtonProps={{
                danger: !isApprove,
                style: isApprove
                    ? { background: "#52c41a", borderColor: "#52c41a" }
                    : undefined,
            }}
        >
            <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Order: <strong>{record.orderNumber}</strong>
                </Text>
            </div>

            {isApprove ? (
                <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Refund Amount
                    </Text>
                    <InputNumber
                        min={0}
                        max={parseFloat(record.finalAmount || 0)}
                        value={refundAmount}
                        onChange={(val) => setRefundAmount(val ?? 0)}
                        style={{ width: "100%", marginTop: 4 }}
                        prefix="₹"
                    />
                </div>
            ) : (
                <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Rejection Reason
                    </Text>
                    <TextArea
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why this refund is being rejected..."
                        style={{ marginTop: 4 }}
                    />
                </div>
            )}

            <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Admin Note (optional)
                </Text>
                <TextArea
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Internal note for this decision..."
                    style={{ marginTop: 4 }}
                />
            </div>
        </Modal>
    );
}

export default function RefundTable({
    refunds,
    loading,
    loadingMore,
    hasMore,
    onLoadMore,
    onViewDetail,
    onQuickApprove,
    onQuickReject,
    approvingRefundId,
    rejectingRefundId,
    canManageRefunds,
}) {
    const [quickModalOpen, setQuickModalOpen] = useState(false);
    const [quickModalMode, setQuickModalMode] = useState("approve");
    const [quickModalRecord, setQuickModalRecord] = useState(null);

    const openQuickModal = (record, mode) => {
        setQuickModalRecord(record);
        setQuickModalMode(mode);
        setQuickModalOpen(true);
    };

    const closeQuickModal = () => {
        setQuickModalOpen(false);
        setQuickModalRecord(null);
    };

    const handleQuickConfirm = async (record, valueOrReason, adminNote) => {
        const res =
            quickModalMode === "approve"
                ? await onQuickApprove(record, valueOrReason, adminNote)
                : await onQuickReject(record, valueOrReason, adminNote);

        if (res?.success) {
            closeQuickModal();
        }
    };

    const isSubmitting =
        quickModalMode === "approve"
            ? String(approvingRefundId) === String(quickModalRecord?.id)
            : String(rejectingRefundId) === String(quickModalRecord?.id);

    const columns = [
        {
            title: "Order Number",
            dataIndex: "orderNumber",
            width: 150,
            render: (value) => <Text strong>{value || "—"}</Text>,
        },
        {
            title: "Customer",
            width: 200,
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 500, color: "#262626" }}>
                        {record.customerName || "—"}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.customerPhone || ""}
                    </Text>
                </div>
            ),
        },
        {
            title: "Order Amount",
            dataIndex: "finalAmount",
            width: 130,
            render: (value) => <Text strong>{formatAmount(value)}</Text>,
        },
        {
            title: "Refund Amount",
            dataIndex: "refundAmount",
            width: 140,
            render: (value) => (
                <Text
                    strong
                    style={{
                        color: parseFloat(value || 0) > 0 ? "#52c41a" : "#8c8c8c",
                    }}
                >
                    {formatAmount(value)}
                </Text>
            ),
        },
        {
            title: "Payment",
            dataIndex: "paymentStatus",
            width: 120,
            render: (value) => <PaymentStatusTag status={value} />,
        },
        {
            title: "Cancelled At",
            dataIndex: "cancelledAt",
            width: 180,
            render: (value) => (
                <Text type="secondary" style={{ fontSize: 13 }}>
                    {formatDate(value)}
                </Text>
            ),
        },
        {
            title: "Refund Status",
            dataIndex: "refundStatus",
            width: 140,
            render: (value) => <RefundStatusTag status={value} />,
        },
        {
            title: "Actions",
            key: "actions",
            width: 190,
            align: "center",
            fixed: "right",
            render: (_, record) => {
                const isPending = normalizeStatus(record.refundStatus) === "PENDING";
                const isApproving = String(approvingRefundId) === String(record.id);
                const isRejecting = String(rejectingRefundId) === String(record.id);

                return (
                    <Space size={6}>
                        <Tooltip title="View Refund">
                            <Button
                                icon={<EyeOutlined />}
                                size="small"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onViewDetail(record);
                                }}
                                style={{
                                    borderRadius: 6,
                                    color: "#1677ff",
                                    borderColor: "#d0e4ff",
                                    background: "#f0f7ff",
                                }}
                            />
                        </Tooltip>

                        {canManageRefunds && (
                            <>
                                <Tooltip
                                    title={
                                        isPending
                                            ? "Approve Refund"
                                            : `Cannot approve — status is ${record.refundStatus || "unknown"}`
                                    }
                                >
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<CheckCircleOutlined />}
                                        loading={isApproving}
                                        disabled={!isPending || isRejecting}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            openQuickModal(record, "approve");
                                        }}
                                        style={
                                            isPending
                                                ? { background: "#52c41a", borderColor: "#52c41a" }
                                                : undefined
                                        }
                                    />
                                </Tooltip>

                                <Tooltip
                                    title={
                                        isPending
                                            ? "Reject Refund"
                                            : `Cannot reject — status is ${record.refundStatus || "unknown"}`
                                    }
                                >
                                    <Button
                                        danger
                                        size="small"
                                        icon={<CloseCircleOutlined />}
                                        loading={isRejecting}
                                        disabled={!isPending || isApproving}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            openQuickModal(record, "reject");
                                        }}
                                    />
                                </Tooltip>
                            </>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div
            style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #f0f0f0",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                overflow: "hidden",
            }}
        >
            <Table
                rowKey="id"
                columns={columns}
                dataSource={refunds}
                loading={loading}
                pagination={false}
                scroll={{ x: 1200 }}
                onRow={(record) => ({
                    onClick: () => onViewDetail(record),
                    style: { cursor: "pointer" },
                })}
                footer={() => (
                    <ScrollSentinel
                        hasMore={hasMore}
                        loadingMore={loadingMore}
                        onVisible={onLoadMore}
                    />
                )}
            />

            <QuickActionModal
                open={canManageRefunds && quickModalOpen}
                mode={quickModalMode}
                record={quickModalRecord}
                onClose={closeQuickModal}
                onConfirm={handleQuickConfirm}
                submitting={isSubmitting}
            />
        </div>
    );
}