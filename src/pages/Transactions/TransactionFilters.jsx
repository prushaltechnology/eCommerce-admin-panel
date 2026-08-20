import { SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";

export default function TransactionFilters({ onSearch }) {
    const { Search } = Input;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <Search
                size="small"
                className="small-search"
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="Search transactions..."
                onChange={(e) => onSearch(e.target.value)}
                allowClear
                onClear={() => onSearch("")}
                style={{ width: 240, borderRadius: 6 }}
            />
        </div>
    );
}