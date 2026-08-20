import { Card, Input, Typography } from 'antd';
import { useDelivery } from '../hooks/useDelivery';
import DeliveryTable from './DeliveryTable';

const { Search } = Input;
const { Title, Text } = Typography;



// ── page ────────────────────────────────────────────────────────────────────
const Delivery = () => {
    const {
        rows,
        loading,
        fetchingMore,
        nextCursor,
        hasMore,
        searchText,
        setSearchText,
        skeletonRows,
        loadDeliveries,
    } = useDelivery();



    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16, flexWrap: 'wrap', gap: 12
            }}>
                <Title level={4} style={{ margin: 0 }}>
                    Delivery Management
                </Title>


            </div>

            {/* Toolbar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 12, gap: 12
            }}>
                <Search
                    size="small"
                    className="small-search"
                    placeholder="Search by order number or customer name..."
                    allowClear
                    style={{ width: 300 }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>

            {/* Table */}
            <Card
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}
                styles={{ body: { flex: 1, overflow: 'hidden', padding: 0 } }}
            >
                <DeliveryTable
                    rows={rows}
                    loading={loading}
                    fetchingMore={fetchingMore}
                    hasMore={hasMore}
                    nextCursor={nextCursor}
                    skeletonRows={skeletonRows}
                    onLoadMore={(cursor) => loadDeliveries(cursor, false)}
                />
            </Card>
        </div>
    );
};

export default Delivery;