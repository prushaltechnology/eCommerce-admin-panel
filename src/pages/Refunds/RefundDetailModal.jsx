import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    UndoOutlined,
} from "@ant-design/icons";
import {
    Avatar,
    Button,
    Card,
    Col,
    Divider,
    Input,
    InputNumber,
    Modal,
    Row,
    Space,
    Tag,
    Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

const { Text, Title } = Typography;
const { TextArea } = Input;

const formatAmount = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
};

const formatDate = (date) => {
    if (!date) return "—";

    return dayjs(date).format("DD/MM/YYYY h:mm A");
};

const getRefundStatusConfig = (status) => {
    const configs = {
        PENDING: {
            color: "orange",
            icon: <ClockCircleOutlined />,
        },
        APPROVED: {
            color: "green",
            icon: <CheckCircleOutlined />,
        },
        REJECTED: {
            color: "red",
            icon: <CloseCircleOutlined />,
        },
    };

    return configs[status?.toUpperCase()] || {
        color: "default",
        icon: null,
    };
};

// Shared validation: refund amount must be a number, >= 0, and <= order amount
const validateRefundAmount = (value, orderAmount) => {
    const max = parseFloat(orderAmount || 0);

    if (value === null || value === undefined || Number.isNaN(value)) {
        return "Refund amount is required";
    }
    if (value < 0) {
        return "Refund amount cannot be negative";
    }
    if (value > max) {
        return `Refund amount cannot exceed the order amount (${formatAmount(max)})`;
    }
    return "";
};

function RefundStatusTag({ status }) {
    const config = getRefundStatusConfig(status);

    return (
        <Tag
            color={config.color}
            icon={config.icon}
        >
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
        <Tag color={colors[status?.toUpperCase()] || "default"}>
            {status || "UNKNOWN"}
        </Tag>
    );
}

function InfoCard({ label, value }) {
    return (
        <Card
            size="small"
            style={{
                height: "100%",
            }}
        >
            <Text
                type="secondary"
                style={{
                    fontSize: 12,
                }}
            >
                {label}
            </Text>

            <div
                style={{
                    marginTop: 4,
                    fontWeight: 500,
                    color: "#262626",
                    wordBreak: "break-word",
                }}
            >
                {value ?? "—"}
            </div>
        </Card>
    );
}

export default function RefundDetailModal({
    open,
    refund,
    initialAction,
    onClose,
    onApprove,
    onReject,
    approving,
    rejecting,
    canManageRefunds,
}) {
    const [refundAmount, setRefundAmount] = useState(0);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [adminNote, setAdminNote] = useState("");
    const [amountError, setAmountError] = useState("");

    // Reset local state whenever a new refund is opened
    useEffect(() => {
        if (open && refund) {
            setRefundAmount(parseFloat(refund.finalAmount || 0));
            setRejectionReason("");
            setAdminNote("");
            setAmountError("");
            setShowRejectInput(initialAction === "reject");
        }
    }, [open, refund, initialAction]);

    if (!refund) return null;

    const isPending = refund.refundStatus?.toUpperCase() === "PENDING";
    const canTakeAction = isPending && canManageRefunds;

    const handleAmountChange = (val) => {
        setRefundAmount(val ?? 0);
        setAmountError(validateRefundAmount(val, refund.finalAmount));
    };

    const handleApproveClick = () => {
        const error = validateRefundAmount(refundAmount, refund.finalAmount);
        if (error) {
            setAmountError(error);
            return;
        }
        onApprove?.(refundAmount, adminNote);
    };

    const handleRejectClick = () => {
        if (!showRejectInput) {
            setShowRejectInput(true);
            return;
        }
        if (!rejectionReason.trim()) return;
        onReject?.(rejectionReason.trim());
    };

    return (
        <Modal
            title="Refund Details"
            open={open}
            onCancel={onClose}
            width={780}
                        footer={
                canTakeAction
                    ? [
                        <Button key="cancel" onClick={onClose}>
                            Close
                        </Button>,
                        <Button
                            key="reject"
                            danger
                            loading={rejecting}
                            disabled={approving}
                            onClick={handleRejectClick}
                        >
                            {showRejectInput ? "Confirm Reject" : "Reject"}
                        </Button>,
                        <Button
                            key="approve"
                            type="primary"
                            style={{ background: "#52c41a", borderColor: "#52c41a" }}
                            loading={approving}
                            disabled={rejecting || !!amountError}
                            onClick={handleApproveClick}
                        >
                            Approve
                        </Button>,
                    ]
                    : [
                        <Button key="cancel" onClick={onClose}>
                            Close
                        </Button>,
                    ]
            }
        >
            {/* Header */}
            <Space
                align="center"
                size={16}
                style={{
                    width: "100%",
                    marginBottom: 20,
                }}
            >
                <Avatar
                    size={56}
                    icon={<UndoOutlined />}
                    style={{
                        background: "#722ed1",
                        flexShrink: 0,
                    }}
                />

                <div>
                    <Title
                        level={4}
                        style={{
                            marginBottom: 4,
                        }}
                    >
                        {refund.orderNumber}
                    </Title>

                    <Space size={6} wrap>
                        <RefundStatusTag
                            status={refund.refundStatus}
                        />

                        <PaymentStatusTag
                            status={refund.paymentStatus}
                        />
                    </Space>
                </div>
            </Space>

            {/* Order Information */}
            <Divider
                orientation="left"
                style={{
                    margin: "16px 0 12px",
                }}
            >
                Order Information
            </Divider>

            <Card
                size="small"
                style={{
                    marginBottom: 16,
                }}
            >
                <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12}>
                        <InfoCard
                            label="Refund ID"
                            value={`#${refund.id}`}
                        />
                    </Col>

                    <Col xs={24} sm={12}>
                        <InfoCard
                            label="Order Number"
                            value={refund.orderNumber}
                        />
                    </Col>

                    <Col xs={24} sm={12}>
                        <InfoCard
                            label="Customer Name"
                            value={refund.customerName}
                        />
                    </Col>

                    <Col xs={24} sm={12}>
                        <InfoCard
                            label="Customer Phone"
                            value={refund.customerPhone}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Amount Information */}
            <Divider
                orientation="left"
                style={{
                    margin: "16px 0 12px",
                }}
            >
                Amount Information
            </Divider>

            <Card
                size="small"
                style={{
                    marginBottom: 16,
                }}
            >
                <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12}>
                        <InfoCard
                            label="Order Amount"
                            value={formatAmount(refund.finalAmount)}
                        />
                    </Col>

                    <Col xs={24} sm={12}>
                        <InfoCard
                            label="Refund Amount"
                            value={formatAmount(refund.refundAmount)}
                        />
                    </Col>

                    <Col xs={24} sm={12}>
                        <InfoCard
                            label="Payment Status"
                            value={
                                <PaymentStatusTag
                                    status={refund.paymentStatus}
                                />
                            }
                        />
                    </Col>

                    <Col xs={24} sm={12}>
                        <InfoCard
                            label="Refund Status"
                            value={
                                <RefundStatusTag
                                    status={refund.refundStatus}
                                />
                            }
                        />
                    </Col>
                </Row>
            </Card>

            {/* Cancellation Information */}
            <Divider
                orientation="left"
                style={{
                    margin: "16px 0 12px",
                }}
            >
                Cancellation Information
            </Divider>

            <Card
                size="small"
                style={{
                    marginBottom: 16,
                }}
            >
                <Row gutter={[12, 12]}>
                    <Col xs={24}>
                        <InfoCard
                            label="Cancellation Reason"
                            value={refund.cancellationReason}
                        />
                    </Col>

                    <Col xs={24}>
                        <InfoCard
                            label="Cancellation Note"
                            value={refund.cancellationNote}
                        />
                    </Col>

                    <Col xs={24} sm={12}>
                        <InfoCard
                            label="Cancelled At"
                            value={formatDate(refund.cancelledAt)}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Refund Processing */}
            <Divider
                orientation="left"
                style={{
                    margin: "16px 0 12px",
                }}
            >
                Refund Processing
            </Divider>

            <Card size="small">
                <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12}>
                        <InfoCard
                            label="Processed At"
                            value={formatDate(refund.refundProcessedAt)}
                        />
                    </Col>

                    <Col xs={24} sm={12}>
                        <InfoCard
                            label="Processed By"
                            value={
                                refund.refundProcessedBy?.firstName ||
                                "—"
                            }
                        />
                    </Col>

                    <Col xs={24}>
                        <InfoCard
                            label="Admin Note"
                            value={refund.refundAdminNote}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Approve / Reject action panel — only for pending refunds */}
            {isPending && canTakeAction && (
                <>
                    <Divider
                        orientation="left"
                        style={{ margin: "16px 0 12px" }}
                    >
                        Take Action
                    </Divider>

                    <Card size="small">
                        <Row gutter={[12, 12]}>
                            <Col xs={24} sm={12}>
                                <Text
                                    type="secondary"
                                    style={{ fontSize: 12 }}
                                >
                                    Refund Amount
                                </Text>

                                <InputNumber
                                    min={0}
                                    max={parseFloat(refund.finalAmount || 0)}
                                    value={refundAmount}
                                    onChange={handleAmountChange}
                                    status={amountError ? "error" : undefined}
                                    style={{
                                        width: "100%",
                                        marginTop: 4,
                                    }}
                                    prefix="₹"
                                    precision={2}
                                    step={0.01}
                                />
                                {amountError && (
                                    <Text
                                        type="danger"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginTop: 4,
                                        }}
                                    >
                                        {amountError}
                                    </Text>
                                )}
                            </Col>

                            <Col xs={24}>
                                <Text
                                    type="secondary"
                                    style={{ fontSize: 12 }}
                                >
                                    Admin Note (optional)
                                </Text>

                                <TextArea
                                    rows={2}
                                    value={adminNote}
                                    onChange={(e) =>
                                        setAdminNote(e.target.value)
                                    }
                                    placeholder="Internal note for this decision..."
                                    style={{ marginTop: 4 }}
                                />
                            </Col>

                            {showRejectInput && (
                                <Col xs={24}>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                    >
                                        Rejection Reason
                                    </Text>

                                    <TextArea
                                        rows={3}
                                        value={rejectionReason}
                                        onChange={(e) =>
                                            setRejectionReason(e.target.value)
                                        }
                                        placeholder="Explain why this refund is being rejected..."
                                        style={{ marginTop: 4 }}
                                    />
                                </Col>
                            )}
                        </Row>
                    </Card>
                </>
            )}
        </Modal>
    );
}