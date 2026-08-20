import {
    Button,
    Form,
    InputNumber,
    Modal,
    Radio,
    Select,
    Space,
    Typography,
} from 'antd';

const { Option } = Select;
const { Text } = Typography;

/**
 * Modal for updating a product's stock level.
 *
 * When `selectedItem` is null the user must first pick a product from the
 * inline Select (populated from `productList`).  Once a product is chosen
 * (either via the Select or by the parent pre-setting `selectedItem`) the
 * user chooses an update strategy (add / remove / set) and submits.
 */
const StockUpdateModal = ({
    open,
    onCancel,
    onFinish,
    form,
    actionLoading,
    selectedItem,
    onProductSelect,
    productList,
    productListLoading,
    onProductSearch,
    onProductPopupScroll,
}) => (
    <Modal
        title={selectedItem ? `Manage Stock — ${selectedItem.name}` : 'Manage Stock'}
        open={open}
        onCancel={onCancel}
        footer={null}
        width={400}
    >
        <Form form={form} layout="vertical" onFinish={onFinish}>

            {/* Product selector — only shown when no item is pre-selected.
                Registered with name="productId" + a required rule so antd
                actually blocks submission until a product is chosen,
                instead of silently letting onFinish fire with a null
                selectedItem. */}
            {!selectedItem && (
                <Form.Item
                    name="productId"
                    label="Select Product"
                    rules={[{ required: true, message: 'Please select a product' }]}
                >
                    <Select
                        showSearch
                        allowClear
                        placeholder="Search product..."
                        loading={productListLoading}
                        filterOption={false}
                        onSearch={onProductSearch}
                        onPopupScroll={onProductPopupScroll}
                        onChange={onProductSelect}
                    >
                        {productList.map((item) => (
                            <Option key={item.id} value={item.id}>
                                {item.name}
                            </Option>
                        ))}
                    </Select>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Search and select a product to update stock.
                    </Text>
                </Form.Item>
            )}
            <Form.Item
                name="inventoryType"
                label="Inventory Type"
                initialValue="storefront"
                rules={[
                    {
                        required: true,
                        message: 'Please select inventory type',
                    },
                ]}
            >
                <Radio.Group>
                    <Radio value="storefront">
                        Storefront
                    </Radio>

                    <Radio value="system">
                        System
                    </Radio>
                </Radio.Group>
            </Form.Item>

            {/* Update strategy */}
            <Form.Item
                name="updateType"
                label="Update Type"
                initialValue="add"
                rules={[{ required: true, message: 'Please select update type' }]}
            >
                <Radio.Group>
                    <Radio value="add">Add to current stock</Radio>
                    <Radio value="subtract">Remove from current stock</Radio>
                    <Radio value="set">Replace stock quantity</Radio>
                </Radio.Group>
            </Form.Item>

            {/* Helper text describing exactly what the selected update type does */}
            <Form.Item
                noStyle
                shouldUpdate={(prev, cur) => prev.updateType !== cur.updateType}
            >
                {({ getFieldValue }) => {
                    const updateType = getFieldValue('updateType');
                    const helperText =
                        updateType === 'subtract'
                            ? 'Subtracts the quantity you enter below from the current stock.'
                            : updateType === 'set'
                                ? 'Replaces the current stock entirely with the value you enter below.'
                                : 'Adds the quantity you enter below on top of the current stock.';

                    return (
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: -12, marginBottom: 16 }}>
                            {helperText}
                        </Text>
                    );
                }}
            </Form.Item>

            {/* Quantity / level input — changes based on update type */}
            <Form.Item
                noStyle
                shouldUpdate={(prev, cur) => prev.updateType !== cur.updateType}
            >
                {({ getFieldValue }) =>
                    getFieldValue('updateType') === 'set' ? (
                        <Form.Item
                            name="stock"
                            label="New Stock Level"
                            rules={[
                                { required: true, message: 'Please enter stock level' },
                                {
                                    validator: (_, value) => {
                                        if (value === undefined || value === null) {
                                            return Promise.resolve();
                                        }
                                        if (value < 0) {
                                            return Promise.reject(
                                                new Error('Stock level cannot be negative')
                                            );
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        >
                            <InputNumber
                                min={0}
                                controls
                                onKeyDown={(e) => {
                                    if (e.key === '-' || e.key === 'e') {
                                        e.preventDefault();
                                    }
                                }}
                                style={{ width: '100%' }}
                                parser={(value) =>
                                    value ? value.replace(/[^0-9]/g, '') : ''
                                }
                            />
                        </Form.Item>
                    ) : (
                        <Form.Item
                            name="quantity"
                            label={
                                getFieldValue('updateType') === 'subtract'
                                    ? 'Quantity to Remove'
                                    : 'Quantity to Add'
                            }
                            rules={[
                                { required: true, message: 'Please enter quantity' },
                                {
                                    validator: (_, value) => {
                                        if (value === undefined || value === null) {
                                            return Promise.resolve();
                                        }
                                        if (value <= 0) {
                                            return Promise.reject(
                                                new Error('Quantity must be greater than 0')
                                            );
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        >
                            <InputNumber
                                min={1}
                                controls
                                onKeyDown={(e) => {
                                    if (e.key === '-' || e.key === 'e') {
                                        e.preventDefault();
                                    }
                                }}
                                style={{ width: '100%' }}
                                parser={(value) =>
                                    value ? value.replace(/[^0-9]/g, '') : ''
                                }
                            />
                        </Form.Item>
                    )
                }
            </Form.Item>

            {/* Actions */}
            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit" loading={actionLoading}>
                        Update Stock
                    </Button>
                    <Button onClick={onCancel} disabled={actionLoading}>
                        Cancel
                    </Button>
                </Space>
            </Form.Item>

        </Form>
    </Modal>
);

export default StockUpdateModal;