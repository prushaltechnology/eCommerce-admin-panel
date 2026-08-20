import { EyeOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Spin, Table, Typography } from "antd";
import { useEffect, useRef } from "react";
import { formatAmount, formatDate, MethodTag, StatusTag } from "../../utils/TransactionUtils";

const { Text } = Typography;

// Invisible div at table bottom — fires onVisible when scrolled into view
function ScrollSentinel({ onVisible, hasMore, loadingMore }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || !hasMore) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) onVisible(); },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, onVisible]);

    return (
        <div
            ref={ref}
            style={{
                display: "flex", justifyContent: "center",
                alignItems: "center", padding: "14px 0",
                minHeight: 40,
            }}
        >
            {loadingMore && <Spin indicator={<LoadingOutlined />} size="small" />}
        </div>
    );
}

export default function TransactionTable({
    transactions,
    loading,
    loadingMore,
    hasMore,
    onLoadMore,
    onViewDetail,
}) {
    const columns = [
        {
            title: "Transaction ID",
            dataIndex: "id",
            width: 130,
            render: (v) => <Text strong style={{ color: "#262626" }}>#{v}</Text>,
        },
        {
            title: "Order Number",
            dataIndex: ["order", "orderNumber"],
            width: 150,
            render: (v) => <Text strong>{v ?? "—"}</Text>,
        },
        {
            title: "Customer",
            width: 200,
            render: (_, r) => (
                <div>
                    <div style={{ fontWeight: 500, color: "#262626" }}>{r.order?.customerName ?? "—"}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{r.order?.customerPhone ?? ""}</Text>
                </div>
            ),
        },
        {
            title: "Amount",
            dataIndex: "amount",
            width: 120,
            render: (v) => <Text strong style={{ fontSize: 14 }}>{formatAmount(v)}</Text>,
        },
        {
            title: "Refund Amount",
            dataIndex: "refundAmount",
            width: 130,
            render: (v, record) =>
                record.status === "REFUNDED" && parseFloat(v) > 0 ? (
                    <Text strong style={{ fontSize: 14, color: "#cf1322" }}>
                        -{formatAmount(v)}
                    </Text>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
        {
            title: "Method",
            dataIndex: "paymentMethod",
            width: 140,
            render: (v) => <MethodTag method={v} />,
        },
        {
            title: "Date",
            dataIndex: "createdAt",
            width: 180,
            render: (v) => <Text type="secondary" style={{ fontSize: 13 }}>{formatDate(v)}</Text>,
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 110,
            render: (v) => <StatusTag status={v} />,
        },
        {
            title: "Actions",
            key: "actions",
            width: 80,
            align: "center",
            render: (_, record) => (
                <Button
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onViewDetail(record); }}
                    style={{
                        borderRadius: 6,
                        color: "#1677ff",
                        borderColor: "#d0e4ff",
                        background: "#f0f7ff",
                    }}
                />
            ),
        },
    ];

    return (
        <div style={{
            background: "#fff", borderRadius: 10,
            border: "1px solid #f0f0f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            overflow: "hidden",
        }}>
            <Table
                rowKey="id"
                columns={columns}
                dataSource={transactions}
                loading={loading}
                pagination={false}
                scroll={{ x: 1030 }}
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
        </div>
    );
}