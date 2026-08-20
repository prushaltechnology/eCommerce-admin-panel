import { Button, Card, Col, Input, Modal, Row, Select } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

const getProductImage = (product) => {
    const validImage = product?.images?.find(
        (img) => img.image && img.image.trim() !== ''
    );
    if (!validImage) return null;
    return validImage.image.startsWith('data:')
        ? validImage.image
        : `${import.meta.env.VITE_GRAPHQL_URI.replace('/graphql/', '').replace('/graphql', '')}/media/${validImage.image}`;
};

// console.log(enquiry)

const BulkOrderDetailsModal = ({
    open,
    enquiry,
    onCancel,
    newStatus,
    setNewStatus,
    adminMessage,
    setAdminMessage,
    onStatusUpdate,
    updateLoading = false,
    canUpdateStatus = false,
}) => {
    const renderItemImage = (item) => {
        const imageSrc = getProductImage(item.product);

        if (!imageSrc) {
            return (
                <div style={{ width: 50, height: 50, backgroundColor: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e0e0' }}>
                    <span style={{ fontSize: 10, color: '#999' }}>No Img</span>
                </div>
            );
        }

        return (
            <img
                src={imageSrc}
                alt={item.product?.name || 'Product'}
                style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }}
                onError={(e) => { e.target.style.display = 'none'; }}
            />
        );
    };

    return (
        <Modal
            title={`Bulk Order Details - #${enquiry?.id}`}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={800}
            destroyOnHidden
        >
            {enquiry && (
                <div>

                    {/* ── Customer Information ───────────────────────────────────── */}
                    <Card title="Customer Information" size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <p>
                                    <strong>Name:</strong>{' '}
                                    {enquiry.placedByUser?.firstName} {enquiry.placedByUser?.lastName}
                                </p>
                                <p>
                                    <strong>Contact:</strong>{' '}
                                    {enquiry.placedByUser?.phone || 'N/A'}
                                </p>
                                <p>
                                    <strong>email:</strong>{' '}
                                    {enquiry.placedByUser?.email}
                                </p>

                            </Col>
                            <Col span={12}>
                                <p><strong>Bulk Order Details:</strong></p>
                                <p style={{ color: '#666', fontSize: 13 }}>
                                    {enquiry.bulkOrderDetails || 'N/A'}
                                </p>
                                <p><strong>Address:</strong></p>
                                <p style={{ color: '#666', fontSize: 13 }}>
                                    {enquiry.address || 'N/A'}
                                </p>
                            </Col>
                        </Row>
                    </Card>

                    {/* ── Status Update ──────────────────────────────────────────── */}
                    <Card title="Order Summary" size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <p><strong>Enquiry ID:</strong> #{enquiry.id}</p>
                                <p><strong>Date:</strong> {enquiry.createdAt ? dayjs(enquiry.createdAt).format('MMMM D, YYYY h:mm A') : '—'}</p>

                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <strong>Status:</strong>
                                    {canUpdateStatus ? (
                                        <Select
                                            value={newStatus}
                                            onChange={setNewStatus}
                                            style={{ width: 170 }}
                                            size="small"
                                        >
                                            <Option value="pending">Pending</Option>
                                            <Option value="confirmed">Confirmed</Option>
                                            <Option value="cancelled">Cancelled</Option>
                                        </Select>
                                    ) : (
                                        <span style={{ textTransform: 'capitalize' }}>{newStatus}</span>
                                    )}
                                </div>

                                {canUpdateStatus && (
                                    <div style={{ marginTop: 8 }}>
                                        <Input.TextArea
                                            size="small"
                                            placeholder="Admin message"
                                            value={adminMessage}
                                            onChange={(e) => setAdminMessage(e.target.value)}
                                            rows={3}
                                        />
                                        <Button
                                            type="primary"
                                            size="small"
                                            style={{ marginTop: 8 }}
                                            onClick={onStatusUpdate}
                                            loading={updateLoading}
                                        >
                                            Update Status
                                        </Button>
                                    </div>
                                )}

                                {!canUpdateStatus && adminMessage && (
                                    <p style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                                        <strong>Admin message:</strong> {adminMessage}
                                    </p>
                                )}
                            </Col>
                        </Row>
                    </Card>

                    {/* ── Order Items ────────────────────────────────────────────── */}
                    <Card title="Order Items" size="small" style={{ marginBottom: 16 }}>
                        <div>
                            {enquiry.items?.map((item, index) => (
                                <div
                                    key={item.id || index}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 0',
                                        borderBottom: '1px solid #f0f0f0',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {renderItemImage(item)}
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>
                                                {item.product?.name || 'Unknown Product'}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#666' }}>
                                                Qty: {item.quantity}
                                                {item.product?.measureValue && item.product?.unit
                                                    ? ` (${item.product.measureValue} ${item.product.unit})`
                                                    : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                </div>
            )}
        </Modal>
    );
};

export default BulkOrderDetailsModal;