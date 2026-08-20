import {
    BankOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    RollbackOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";

export const PAGE_SIZE = 10;

export const STATUS_CONFIG = {
    PAID: { color: "success", icon: <CheckCircleOutlined />, label: "PAID" },
    PENDING: { color: "warning", icon: <ClockCircleOutlined />, label: "PENDING" },
    FAILED: { color: "error", icon: <CloseCircleOutlined />, label: "FAILED" },
    REFUNDED: { color: "default", icon: <RollbackOutlined />, label: "REFUNDED" },
};

export const METHOD_LABELS = {
    netbanking: "Net Banking",
    card: "Card",
    upi: "UPI",
    wallet: "Wallet",
    cod: "Cash on Delivery",
};

export function formatAmount(val) {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export function getMethodLabel(method) {
    return METHOD_LABELS[method?.toLowerCase()] ?? method ?? "—";
}

export function StatusTag({ status }) {
    const cfg = STATUS_CONFIG[status] ?? { color: "default", icon: null, label: status };
    return (
        <Tag
            color={cfg.color}
            icon={cfg.icon}
            style={{ fontWeight: 600, fontSize: 11, letterSpacing: 0.4, padding: "2px 8px", borderRadius: 4 }}
        >
            {cfg.label}
        </Tag>
    );
}

export function MethodTag({ method }) {
    return (
        <Tag color="blue" icon={<BankOutlined />} style={{ fontWeight: 500 }}>
            {getMethodLabel(method)}
        </Tag>
    );
}