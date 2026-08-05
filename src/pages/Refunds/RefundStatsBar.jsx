import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Row,
  Skeleton,
} from "antd";

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}) {
  return (
    <Card
      size="small"
      style={{
        borderRadius: 10,
        border: "1px solid #f0f0f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        height: "100%",
      }}
      bodyStyle={{
        padding: "14px 18px",
      }}
    >
      {loading ? (
        <Skeleton
          active
          paragraph={false}
          title={{
            width: "60%",
          }}
        />
      ) : (
        <>
          <div
            style={{
              fontSize: 12,
              color: "#8c8c8c",
              marginBottom: 6,
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {icon}
            {value}
          </div>
        </>
      )}
    </Card>
  );
}

export default function RefundStatsBar({
  stats,
  loading,
}) {
  const refundStats = [
    {
      label: "Total Refunds",
      value: stats?.total ?? 0,
      icon: <UndoOutlined />,
      color: "#1677ff",
    },
    {
      label: "Pending",
      value: stats?.pending ?? 0,
      icon: <ClockCircleOutlined />,
      color: "#faad14",
    },
    {
      label: "Approved",
      value: stats?.approved ?? 0,
      icon: <CheckCircleOutlined />,
      color: "#52c41a",
    },
    {
      label: "Rejected",
      value: stats?.rejected ?? 0,
      icon: <CloseCircleOutlined />,
      color: "#ff4d4f",
    },
  ];

  return (
    <Row
      gutter={[12, 12]}
      style={{
        marginBottom: 20,
      }}
    >
      {refundStats.map((stat) => (
        <Col
          key={stat.label}
          xs={12}
          sm={12}
          md={6}
          lg={6}
        >
          <StatCard
            {...stat}
            loading={loading}
          />
        </Col>
      ))}
    </Row>
  );
}