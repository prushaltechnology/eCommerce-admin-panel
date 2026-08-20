import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    ShoppingCartOutlined
} from "@ant-design/icons";
import { Card, Col, Row, Skeleton } from "antd";
import { formatAmount } from "../../utils/TransactionUtils";

function StatCard({ label, value, icon, color, loading }) {
    return (
        <Card
            size="small"
            style={{
                borderRadius: 10,
                border: "1px solid #f0f0f0",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                height: "100%",
            }}
            bodyStyle={{ padding: "14px 18px" }}
        >
            {loading ? (
                <Skeleton active paragraph={false} title={{ width: "60%" }} />
            ) : (
                <>
                    <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color, display: "flex", alignItems: "center", gap: 6 }}>
                        {icon}
                        {value}
                    </div>
                </>
            )}
        </Card>
    );
}

export default function TransactionStatsBar({ transactions = [], total = 0, loading }) {
    const paid = transactions.filter((t) => t.status === "PAID");
    const pending = transactions.filter((t) => t.status === "PENDING").length;
    const failed = transactions.filter((t) => t.status === "FAILED").length;
    const revenue = paid.reduce((s, t) => s + parseFloat(t.amount || 0), 0);

    const stats = [
        { label: "Total Transactions", value: total, icon: <ShoppingCartOutlined />, color: "#1677ff" },
        { label: "Pending", value: pending, icon: <ClockCircleOutlined />, color: "#faad14" },
        { label: "Paid", value: paid.length, icon: <CheckCircleOutlined />, color: "#52c41a" },
        { label: "Failed", value: failed, icon: <CloseCircleOutlined />, color: "#ff4d4f" },
        { label: "Revenue", value: formatAmount(revenue), color: "#722ed1" },
    ];

    return (
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            {stats.map((s) => (
                <Col key={s.label} xs={12} sm={8} md={8} lg={4} style={{ flex: "1 1 0" }}>
                    <StatCard {...s} loading={loading} />
                </Col>
            ))}
        </Row>
    );
}