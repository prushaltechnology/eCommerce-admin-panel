import { SearchOutlined } from "@ant-design/icons";
import { Input, Select } from "antd";

export default function RefundFilters({
  search,
  statusFilter,
  onSearch,
  onStatusChange,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
        flexWrap: "wrap",
      }}
    >
      <Input
        size="small"
        prefix={
          <SearchOutlined
            style={{
              color: "#bfbfbf",
            }}
          />
        }
        placeholder="Search refunds..."
        value={search}
        onChange={(e) =>
          onSearch(e.target.value)
        }
        allowClear
        style={{
          width: 260,
          borderRadius: 6,
        }}
      />

      <Select
        size="small"
        value={statusFilter}
        onChange={onStatusChange}
        style={{
          width: 160,
        }}
        options={[
          {
            label: "All Status",
            value: "ALL",
          },
          {
            label: "Pending",
            value: "PENDING",
          },
          {
            label: "Approved",
            value: "APPROVED",
          },
          {
            label: "Rejected",
            value: "REJECTED",
          },
        ]}
      />
    </div>
  );
}