import {
    ExclamationCircleOutlined,
    SyncOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Skeleton, Statistic } from 'antd';
import InfoTooltip from '../../components/ui/InfoTooltip';

/**
 * Four summary cards: Total Products, Low Stock, Critical, Out of Stock.
 * Shows skeleton placeholders while data is loading.
 */
const StockStats = ({ stats, loading }) => {
    const skeletonFormatter = (value) =>
        loading ? (
            <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                <Skeleton.Input
                    active
                    size="small"
                    style={{ width: '55%', minWidth: 45, maxWidth: 75, height: 22, borderRadius: 6 }}
                />
            </div>
        ) : (
            value
        );

    const cards = [
        {
            title: 'Total Products',
            value: stats.total,
            prefix: <SyncOutlined />,
            formatter: skeletonFormatter,
        },
        {
            title: (
                <InfoTooltip
                    title="Low Stock"
                    text="Products with quantity between 6 and 20"
                />
            ),
            value: stats.low,
            valueStyle: { color: '#faad14' },
            prefix: <WarningOutlined />,
            formatter: skeletonFormatter,
        },
        {
            title: (
                <InfoTooltip
                    title="Critical"
                    text="Products with quantity 5 or below"
                />
            ),
            value: stats.critical,
            valueStyle: { color: '#fa8c16' },
            prefix: <ExclamationCircleOutlined />,
            formatter: skeletonFormatter,
        },
        {
            title: (
                <InfoTooltip
                    title="Out of Stock"
                    text="Products with 0 quantity"
                />
            ),
            value: stats.outOfStock,
            valueStyle: { color: '#ff4d4f' },
            prefix: <ExclamationCircleOutlined />,
            formatter: skeletonFormatter,
        },
    ];

    return (
        <Row gutter={[16, 16]}>
            {cards.map((card, i) => (
                <Col key={i} xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title={card.title}
                            value={loading ? 0 : card.value}
                            prefix={!loading ? card.prefix : null}
                            valueStyle={card.valueStyle}
                            formatter={card.formatter}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default StockStats;