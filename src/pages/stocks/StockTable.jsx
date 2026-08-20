import { EditOutlined } from '@ant-design/icons';
import {
    Button,
    Card,
    Input,
    Select,
    Skeleton,
    Space,
    Table,
    Tag,
} from 'antd';
import { useEffect, useRef } from 'react';

const { Search } = Input;
const { Option } = Select;

const LOW_STOCK_THRESHOLD = 20;


const SKELETON_ROWS = Array.from({ length: 6 }, (_, i) => ({
    id: `skeleton-${i}`,
    isSkeleton: true,
}));

const resolveImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('data:')) return image;
    const base =
        import.meta.env.VITE_GRAPHQL_URI
            ?.replace('/graphql/', '')
            .replace('/graphql', '') || '';
    return `${base}/media/${image}`;
};

const ProductCell = ({ record }) => {
    if (record.isSkeleton) {
        return (
            <Space align="start">
                <Skeleton.Image active style={{ width: 60, height: 60, borderRadius: 8 }} />
                <div>
                    <Skeleton.Input active size="small" style={{ width: 140, height: 18, borderRadius: 6, marginBottom: 8 }} />
                    <Skeleton.Button active size="small" style={{ width: 80, height: 22, borderRadius: 20 }} />
                </div>
            </Space>
        );
    }

    const validImage = record.images?.find((img) => img.image?.trim());
    const src = validImage ? resolveImageUrl(validImage.image) : null;

    return (
        <Space align="start">
            {src ? (
                <img
                    src={src}
                    alt={record.name}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0' }}
                />
            ) : (
                <div
                    style={{
                        width: 60, height: 60, borderRadius: 8, backgroundColor: '#f5f5f5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#999', fontSize: 12, border: '1px solid #f0f0f0',
                    }}
                >
                    No Image
                </div>
            )}
            <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{record.name || 'Unknown Product'}</div>
                {record.isFeatured && (
                    <Tag color="orange" style={{ fontSize: 10, marginTop: 4 }}>FEATURED</Tag>
                )}
            </div>
        </Space>
    );
};

/**
 * Scrollable stock table — pagination pattern matches AllProducts.jsx
 * exactly: a fixed `scroll.y` calc() value (not a flex/CSS-override hack)
 * plus a plain querySelector-based scroll listener re-attached whenever
 * its dependencies change. This is the proven-working pattern already
 * used elsewhere in this app; previous attempts here used a more
 * "correct-looking" flex-chain + CSS override approach that kept breaking
 * in different ways (fixed-column clone bodies, ambiguous parent heights,
 * page-level scroll). Matching the known-working pattern beats continuing
 * to debug the fragile one.
 *
 * NOTE ON THE calc() OFFSET: 420px accounts for everything above the
 * table on THIS page — StockHeader + StockStats (4 summary cards) + this
 * component's own search/filter toolbar — which is more chrome than
 * AllProducts.jsx has above its table (320px there). If StockHeader or
 * StockStats change height (e.g. cards wrap to two rows on narrow
 * screens), this number needs adjusting to match, same as AllProducts.jsx
 * already assumes for its own layout.
 */
const StockTable = ({
    items,
    loading,
    fetchingMore,
    hasMore,
    searchText,
    stockFilter,
    onSearchChange,
    onFilterChange,
    onEditStock,
    canManageStock,
    onLoadMore,
    getStockQuantity,
    getStockStatus,
    getStorefrontAvailable,
    getSystemAvailable,
    getStockPercentage,
}) => {
    const tableContainerRef = useRef(null);

    // Matches AllProducts.jsx: query the scrollable body fresh inside the
    // effect and re-attach whenever these values change, instead of a
    // single mount-time subscription with refs. Simpler, and proven to
    // work in this app already.
    useEffect(() => {
        const tableBody = tableContainerRef.current?.querySelector('.ant-table-body');
        if (tableBody) {
            const handleScroll = (e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollHeight - scrollTop <= clientHeight + 50) {
                    if (hasMore && !loading && !fetchingMore) {
                        onLoadMore();
                    }
                }
            };

            tableBody.addEventListener('scroll', handleScroll);
            return () => tableBody.removeEventListener('scroll', handleScroll);
        }
    }, [hasMore, loading, fetchingMore, onLoadMore]);

    const columns = [
        {
            title: 'Product',
            key: 'product',
            width: 240,
            render: (_, record) => <ProductCell record={record} />,
        },
        {
            title: (
                <div>
                    <div>Storefront Stock</div>
                    {/* <div style={{ fontWeight: 400, fontSize: 11, color: '#999' }}>Remaining qty</div> */}
                </div>
            ),
            key: 'storefront',
            align: 'center',
            width: 120,
            render: (_, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input active size="small" style={{ width: 60 }} />
                ) : (
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{record.storefrontStock}</div>
                        <div style={{ fontSize: 13, color: '#999' }}>Reserved: {record.storefrontReserved}</div>
                    </div>
                ),
        },
        {
            title: (
                <div>
                    <div>System Stock</div>
                    {/* <div style={{ fontWeight: 400, fontSize: 11, color: '#999' }}>Remaining qty</div> */}
                </div>
            ),
            key: 'system',
            align: 'center',
            width: 120,
            render: (_, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input active size="small" style={{ width: 60 }} />
                ) : (
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{record.systemStock}</div>
                        <div style={{ fontSize: 13, color: '#999' }}>Reserved: {record.systemReserved}</div>
                    </div>
                ),
        },
        {
            title: 'Reserved',
            key: 'reserved',
            width: 100,
            align: 'center',
            responsive: ['md'],
            render: (_, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input active />
                ) : (
                    <Tag color="orange" style={{ padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                        {(record.storefrontReserved || 0) + (record.systemReserved || 0)}
                    </Tag>
                ),
        },
        {
            title: 'Available',
            key: 'available',
            width: 130,
            align: 'center',
            responsive: ['md'],
            render: (_, record) => {
                if (record.isSkeleton) {
                    return <Skeleton.Input active />;
                }
                const storefrontAvail = getStorefrontAvailable(record);
                const systemAvail = getSystemAvailable(record);
                // Shown per channel, not summed — a low number in either
                // channel must stay visible on its own, matching how Status
                // is decided per row rather than on a combined total.
                return (
                    <Space direction="vertical" size={2}>
                        <Tag color={storefrontAvail < LOW_STOCK_THRESHOLD ? 'orange' : 'green'} style={{ margin: 0 }}>
                            Storefront: {storefrontAvail}
                        </Tag>
                        <Tag color={systemAvail < LOW_STOCK_THRESHOLD ? 'orange' : 'green'} style={{ margin: 0 }}>
                            System: {systemAvail}
                        </Tag>
                    </Space>
                );
            },
        },
        {
            title: 'Total',
            key: 'total',
            width: 100,
            align: 'center',
            responsive: ['lg'],
            render: (_, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input active />
                ) : (
                    <Tag color="blue" style={{ padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                        {(record.storefrontStock || 0) + (record.systemStock || 0)}
                    </Tag>
                ),
        },
        {
            title: 'Status',
            key: 'status',
            width: 110,
            render: (_, record) => {
                if (record.isSkeleton) {
                    return <Skeleton.Button active size="small" style={{ width: 90, height: 24, borderRadius: 20 }} />;
                }
                const { color, text } = getStockStatus(record);
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            align: 'center',
            render: (_, record) =>
                record.isSkeleton ? (
                    <Skeleton.Button active size="small" shape="circle" />
                ) : canManageStock ? (
                    <Button size="small" icon={<EditOutlined />} onClick={() => onEditStock(record, 'add')} />
                ) : null,
        },
    ];

    return (
        <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Space wrap style={{ rowGap: 8, marginBottom: 12 }}>
                <Search
                    size="small"
                    className="small-search"
                    placeholder="Search products..."
                    allowClear
                    value={searchText}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{ width: '100%', maxWidth: 250, minWidth: 180 }}
                />
                <Select
                    size="small"
                    value={stockFilter}
                    onChange={onFilterChange}
                    style={{ minWidth: 160 }}
                >
                    <Option value="all">All Products</Option>
                    <Option value="low">Low Stock (&lt;20)</Option>
                    <Option value="critical">Critical (&lt;5)</Option>
                    <Option value="out">Out of Stock</Option>
                </Select>
            </Space>

            <div
                ref={tableContainerRef}
                style={{ flex: 1, minHeight: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={loading ? SKELETON_ROWS : items}
                    size="small"
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content', y: 'calc(100vh - 420px)' }}
                    locale={{ emptyText: loading ? '' : 'No products found' }}
                />

                {!hasMore && items.length > 0 && !loading && !fetchingMore && (
                    <div style={{ textAlign: 'center', padding: '10px', color: '#999', fontSize: '12px', borderTop: '1px solid #f0f0f0' }}>
                        No more products to load
                    </div>
                )}
            </div>
        </Card>
    );
};

export default StockTable;