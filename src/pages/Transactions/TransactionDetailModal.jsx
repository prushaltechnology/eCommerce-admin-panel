import { TransactionOutlined } from "@ant-design/icons";
import { Avatar, Card, Col, Divider, Modal, Row, Space, Typography } from "antd";
import { formatAmount, formatDate, getMethodLabel, MethodTag, StatusTag } from "../../utils/TransactionUtils";

const { Text, Title } = Typography;

function InfoCard({ label, value }) {
    return (
        <Card size="small" style={{ height: "100%" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
            <div style={{ marginTop: 4, fontWeight: 500, color: "#262626", wordBreak: "break-all" }}>
                {value ?? "—"}
            </div>
        </Card>
    );
}

export default function TransactionDetailModal({ open, transaction, onClose }) {
    if (!transaction) return null;

    return (
        <Modal
            title="Transaction Details"
            open={open}
            onCancel={onClose}
            footer={null}
            width={780}
        >
            {/* Header */}
            <Space align="center" size={16} style={{ width: "100%", marginBottom: 20 }}>
                <Avatar size={56} icon={<TransactionOutlined />} style={{ background: "#1677ff", flexShrink: 0 }} />
                <div>
                    <Title level={4} style={{ marginBottom: 4 }}>{formatAmount(transaction.amount)}</Title>
                    <Space size={6}>
                        <StatusTag status={transaction.status} />
                        <MethodTag method={transaction.paymentMethod} />
                    </Space>
                </div>
            </Space>

            {/* Transaction details */}
            <Card size="small" style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12}><InfoCard label="Transaction ID" value={`#${transaction.id}`} /></Col>
                    <Col xs={24} sm={12}><InfoCard label="Date & Time" value={formatDate(transaction.createdAt)} /></Col>
                    <Col xs={24} sm={12}><InfoCard label="Razorpay Order ID" value={transaction.razorpayOrderId} /></Col>
                    <Col xs={24} sm={12}><InfoCard label="Razorpay Payment ID" value={transaction.razorpayPaymentId} /></Col>
                    <Col xs={24} sm={12}><InfoCard label="Amount" value={formatAmount(transaction.amount)} /></Col>
                    <Col xs={24} sm={12}><InfoCard label="Payment Method" value={getMethodLabel(transaction.paymentMethod)} /></Col>
                </Row>
            </Card>

            {/* Linked order */}
            {transaction.order && (
                <>
                    <Divider orientation="left" style={{ margin: "16px 0 12px" }}>Linked Order</Divider>
                    <Card size="small">
                        <Row gutter={[12, 12]}>
                            <Col xs={24} sm={12}><InfoCard label="Order Number" value={transaction.order.orderNumber} /></Col>
                            <Col xs={24} sm={12}><InfoCard label="Order Amount" value={formatAmount(transaction.amount)} /></Col>
                            <Col xs={24} sm={12}><InfoCard label="Customer Name" value={transaction.order.customerName} /></Col>
                            <Col xs={24} sm={12}><InfoCard label="Customer Phone" value={transaction.order.customerPhone} /></Col>
                        </Row>
                    </Card>
                </>
            )}
        </Modal>
    );
}