import { Card, Skeleton, Table, Tag } from 'antd';
import { formatCurrency, SKELETON_ROWS } from './dashboardUtils';

const columns = [
    {
        title: 'Product',
        dataIndex: 'name',
        key: 'name',
        render: (val, record) =>
            record.isSkeleton ? (
                <Skeleton.Input active size="small" style={{ width: 140, height: 20, borderRadius: 6 }} />
            ) : (
                <span className="fw-bold">{val}</span>
            ),
    },
    {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: (val, record) =>
            record.isSkeleton ? (
                <Skeleton.Input active size="small" style={{ width: 90, height: 20, borderRadius: 6 }} />
            ) : (
                formatCurrency(val)
            ),
    },
    {
        title: 'Storefront',
        key: 'storefrontStock',
        render: (_, record) =>
            record.isSkeleton ? (
                <Skeleton.Button
                    active
                    size="small"
                    style={{
                        width: 85,
                        height: 24,
                        borderRadius: 20,
                    }}
                />
            ) : (
                <Tag
                    color={
                        (record.storefrontStock?.availableQuantity || 0) === 0
                            ? 'red'
                            : (record.storefrontStock?.availableQuantity || 0) < 10
                                ? 'orange'
                                : 'green'
                    }
                >
                    {record.storefrontStock?.availableQuantity || 0}
                </Tag>
            ),
    },
    {
        title: 'System',
        key: 'systemStock',
        render: (_, record) =>
            record.isSkeleton ? (
                <Skeleton.Button
                    active
                    size="small"
                    style={{
                        width: 85,
                        height: 24,
                        borderRadius: 20,
                    }}
                />
            ) : (
                <Tag
                    color={
                        (record.systemStock?.availableQuantity || 0) === 0
                            ? 'red'
                            : (record.systemStock?.availableQuantity || 0) < 10
                                ? 'orange'
                                : 'green'
                    }
                >
                    {record.systemStock?.availableQuantity || 0}
                </Tag>
            ),
    },
    {
        title: 'Sold',
        dataIndex: 'totalSold',
        key: 'totalSold',
        render: (val, record) =>
            record.isSkeleton ? (
                <Skeleton.Input active size="small" style={{ width: 50, height: 20, borderRadius: 6 }} />
            ) : (
                <span>{val}</span>
            ),
    },
];

/**
 * Table listing the top-selling products.
 */
const TopProductsTable = ({ products, loading }) => (
    <Card title="Top Products">
        <Table
            rowKey="id"
            dataSource={loading ? SKELETON_ROWS : products}
            columns={columns}
            pagination={false}
            size="small"
        />
    </Card>
);

export default TopProductsTable;