import { HomeOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { addShippingAddress, calculateDeliveryCharge } from '../../../api/orders';
import AddCustomerModal from '../../../components/modals/AddCustomerModal';
import ShippingAddressModal from '../../../components/modals/ShippingAddressModal';
import useOrders from '../../../hooks/useOrders';
import CustomerSection, { formatAddress } from './manualordermodal/CustomerSection';
import OrderItemsTable from './manualordermodal/OrderItemsTable';
import useManualOrder from './manualordermodal/useManualOrder';
import useProductSearch from './manualordermodal/useProductSearch';

const { Option } = Select;

const PURCHASE_TYPE = {
  WALK_IN: 'walk_in',
  HOME_DELIVERY: 'home_delivery',
};

const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const ManualOrderModal = ({
  visible,
  onClose,
  onOrderCreated,
  defaultOrderType = 'normal',
}) => {
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();

  // ── Purchase type ──────────────────────────────────────────────────────────
  const [purchaseType, setPurchaseType] = useState(PURCHASE_TYPE.WALK_IN);
  const isHomeDelivery = purchaseType === PURCHASE_TYPE.HOME_DELIVERY;

  // ── Customer state ─────────────────────────────────────────────────────────
  const {
    customers,
    customersLoading,
    customersHasMore,
    fetchCustomers,
    upsertCustomer,
  } = useOrders();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [advanceBooking, setAdvanceBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryChargeLoading, setDeliveryChargeLoading] = useState(false);

  // ── Modal visibility ───────────────────────────────────────────────────────
  const [addAddressModalVisible, setAddAddressModalVisible] = useState(false);
  const [addAddressLoading, setAddAddressLoading] = useState(false);
  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false);

  // ── Order items hook ───────────────────────────────────────────────────────
  const {
    orderItems,
    orderType,
    orderTotal,
    loading,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    handleSubmit: submitOrder,
    reset: resetOrder,
  } = useManualOrder({ onOrderCreated, onClose, defaultOrderType });

  const {
    productOptions,
    productListLoading,
    handleProductSearch,
    handleProductPopupScroll,
    cacheProduct,
    reset: resetProducts,
  } = useProductSearch(visible);

  // ── Only show delivery charge when at least one product is selected ────────
  const hasProducts = orderItems.some((item) => item.productId);

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    setPurchaseType(PURCHASE_TYPE.WALK_IN);
    setCustomerSearchText('');
    fetchCustomers('', false);
    setSelectedCustomer(null);
    setSelectedAddress(null);
    setDeliveryCharge(0);
    setAdvanceBooking(false);
    setPaymentMethod('cash');
    resetOrder();
    resetProducts();
    form.resetFields();
  }, [visible]);

  const handlePurchaseTypeChange = (value) => {
    setPurchaseType(value);
    form.validateFields().catch(() => { });
  };

  // ── Delivery charge helper ─────────────────────────────────────────────────
  const fetchDeliveryCharge = async (customer, address) => {
  if (!customer || !address) {
    setDeliveryCharge(0);
    return;
  }

  const addressStr = [
    address.addressLine,
    address.city,
    address.state,
  ]
    .filter(Boolean)
    .join(" ");

  const phone =
    customer.phone && customer.phone !== "N/A"
      ? customer.phone
      : "";

  if (!addressStr) {
    setDeliveryCharge(0);
    return;
  }

  const productSubtotal = orderItems.reduce(
    (total, item) => total + Number(item.subtotal || 0),
    0
  );

  const parcelWeight = orderItems.reduce((total, item) => {
    const weight = Number(item.product?.weight || 0);
    const quantity = Number(item.quantity || 1);
    return total + weight * quantity;
  }, 0);

  const deliveryMode = "STANDARD";

  setDeliveryChargeLoading(true);

  try {
    const res = await calculateDeliveryCharge(
      addressStr,
      phone,
      productSubtotal,
      deliveryMode,
      parcelWeight,
      address.latitude != null ? Number(address.latitude) : null,
      address.longitude != null ? Number(address.longitude) : null,
    );

    if (res.success) {
      setDeliveryCharge(res.customerDeliveryCharge ?? res.deliveryCharge ?? 0);
    } else {
      setDeliveryCharge(0);
    }
  } catch {
    setDeliveryCharge(0);
  } finally {
    setDeliveryChargeLoading(false);
  }
};

  // ── Customer handlers ──────────────────────────────────────────────────────
  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    setSelectedCustomer(customer);
    const defaultAddr =
      customer.addresses?.find((a) => a.isDefault) || customer.addresses?.[0];
    setSelectedAddress(defaultAddr || null);
    form.setFieldsValue({ deliveryAddress: formatAddress(defaultAddr) });
    fetchDeliveryCharge(customer, defaultAddr || null);
  };

  const handleCustomerClear = () => {
    setSelectedCustomer(null);
    setSelectedAddress(null);
    setDeliveryCharge(0);
    setCustomerSearchText('');
    fetchCustomers('', false);
    form.resetFields(['customerName', 'customerEmail', 'customerPhone', 'deliveryAddress']);
  };

  const handleCustomerSearch = (value) => {
    setCustomerSearchText(value || '');
    fetchCustomers(value || '', false);
  };

  const handleCustomerPopupScroll = (event) => {
    const { scrollTop, offsetHeight, scrollHeight } = event.target;
    if (scrollTop + offsetHeight >= scrollHeight - 16 && customersHasMore && !customersLoading) {
      fetchCustomers(customerSearchText, true);
    }
  };

  const handleAddressSelect = (addressId) => {
    const address = selectedCustomer?.addresses?.find((a) => a.id === addressId);
    if (!address) return;
    setSelectedAddress(address);
    form.setFieldsValue({ deliveryAddress: formatAddress(address) });
    fetchDeliveryCharge(selectedCustomer, address);
  };

  // ── Address handlers ───────────────────────────────────────────────────────
  const handleAddNewAddress = async (values) => {
  if (!selectedCustomer?.id) {
    message.error('Please select customer first');
    return;
  }
  setAddAddressLoading(true);
  try {
    const res = await addShippingAddress(selectedCustomer.id, values);
    if (res.success) {
      const newAddress = res.address; // use the server's actual persisted record
      const updatedCustomer = {
        ...selectedCustomer,
        addresses: [...(selectedCustomer.addresses || []), newAddress],
      };
      setSelectedCustomer(updatedCustomer);
      setSelectedAddress(newAddress);
      form.setFieldsValue({ deliveryAddress: formatAddress(newAddress) });
      message.success('Address added successfully');
      setAddAddressModalVisible(false);
      addressForm.resetFields();
      try { upsertCustomer(updatedCustomer); } catch { /* non-critical */ }
    } else {
      message.error(res.message || 'Failed to add address');
    }
  } catch (error) {
    message.error('Failed to add address: ' + error.message);
  } finally {
    setAddAddressLoading(false);
  }
};

  // ── Item change (needs cacheProduct side-effect) ───────────────────────────
  const handleItemChangeWithCache = (itemId, field, value) => {
    if (field === 'productId') {
      const product = productOptions.find((p) => p.id?.toString() === value?.toString());
      if (product) cacheProduct(product);
    }
    handleItemChange(itemId, field, value, productOptions);
  };

  // ── Form submission ────────────────────────────────────────────────────────
  const handleFormFinish = async () => {
    const allKeys = Object.keys(form.getFieldsValue(true));
    const keysToValidate = allKeys.filter((k) => k !== 'customerId');
    const values = await form.validateFields(keysToValidate);

    if (isHomeDelivery && !selectedCustomer?.id) {
      form.setFields([{ name: 'customerId', errors: ['Please select a customer'] }]);
      return;
    }

    form.setFields([{ name: 'customerId', errors: [] }]);

    const payload = {
      selectedCustomer,
      selectedAddress,
      paymentMethod,
      formatAddress,
      purchaseType,
      notes: values.notes,
      isAdvanceBooking: advanceBooking,
      advanceDeliveryDatetime:
        advanceBooking && values.deliveryDate
          ? dayjs(values.deliveryDate).hour(18).minute(30).second(0).format()
          : null,
      deliveryCharge: selectedAddress ? deliveryCharge : 0,
    };

    submitOrder(payload);
  };

  // ── Modal title ────────────────────────────────────────────────────────────
  const modalTitle = (
    <Row align="middle" justify="space-between" wrap={false} style={{ paddingRight: 32 }}>
      <Col>
        <Segmented
          value={purchaseType}
          onChange={handlePurchaseTypeChange}
          options={[
            {
              label: (
                <Space size={4}>
                  <UserOutlined />
                  Walk-in Purchase
                </Space>
              ),
              value: PURCHASE_TYPE.WALK_IN,
            },
            {
              label: (
                <Space size={4}>
                  <HomeOutlined />
                  Home Delivery
                </Space>
              ),
              value: PURCHASE_TYPE.HOME_DELIVERY,
            },
          ]}
        />
      </Col>
      <Col>
        <span style={{ fontSize: 13, color: '#8c8c8c', fontWeight: 400 }}>
          {isHomeDelivery
            ? 'Customer & address required'
            : 'Customer details optional'}
        </span>
      </Col>
    </Row>
  );

  const customerCardTitle = (
    <Space size={8}>
      <span>Customer Information</span>
      {!isHomeDelivery && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: '#fff',
            background: '#8c8c8c',
            padding: '1px 7px',
            borderRadius: 10,
          }}
        >
          Optional
        </span>
      )}
    </Space>
  );

  // ── Derived totals ─────────────────────────────────────────────────────────
  const showDeliveryCharge = hasProducts && selectedAddress;
  const grandTotal = orderTotal + (showDeliveryCharge ? deliveryCharge : 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal
        title={modalTitle}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={900}
      >
        <Form form={form} layout="vertical" onFinish={handleFormFinish}>

          {/* ── Customer + address ─────────────────────── */}
          <Card title={customerCardTitle} size="small">
            <CustomerSection
              customers={customers}
              customersLoading={customersLoading}
              selectedCustomer={selectedCustomer}
              selectedAddress={selectedAddress}
              advanceBooking={advanceBooking}
              isRequired={isHomeDelivery}
              onCustomerSearch={handleCustomerSearch}
              onCustomerPopupScroll={handleCustomerPopupScroll}
              onCustomerSelect={handleCustomerSelect}
              onCustomerClear={handleCustomerClear}
              onAddressSelect={handleAddressSelect}
              onAddAddress={() => setAddAddressModalVisible(true)}
              onAddNewCustomer={() => setAddCustomerModalVisible(true)}
              onAdvanceBookingChange={(checked) => {
                setAdvanceBooking(checked);
                if (!checked) form.setFieldsValue({ deliveryDate: null });
              }}
              form={form}
            />
          </Card>

          {/* ── Payment method ─────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
            <Col xs={24} sm={12}>
              <Form.Item label="Payment Method">
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  style={{ width: 200 }}
                  size="small"
                >
                  <Option value="cash">Cash</Option>
                  <Option value="upi">UPI</Option>
                  <Option value="cheque">Cheque</Option>
                  <Option value="bank_transfer">Bank Transfer</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* ── Order items ────────────────────────────── */}
          <Card title="Order Items" size="small" style={{ marginTop: 16 }}>
            <OrderItemsTable
              orderItems={orderItems}
              orderType={orderType}
              productOptions={productOptions}
              productListLoading={productListLoading}
              onItemChange={handleItemChangeWithCache}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onProductSearch={handleProductSearch}
              onProductPopupScroll={handleProductPopupScroll}
            />

            <Divider />

            <Row justify="end">
              <Col>
                <div style={{ textAlign: 'right', lineHeight: 2 }}>
                  <div style={{ fontSize: 14, color: '#595959' }}>
                    Items Total:{' '}
                    <span style={{ fontWeight: 600 }}>{formatCurrency(orderTotal)}</span>
                  </div>

                  {/* Delivery charge — only shown once a product is selected */}
                  {showDeliveryCharge && (
                    <div style={{ fontSize: 14, color: "#595959" }}>
                      Delivery Charge:{" "}
                      <span
                        style={{
                          fontWeight: 600,
                          color: deliveryChargeLoading ? "#8c8c8c" : "#fa8c16",
                        }}
                      >
                        {deliveryChargeLoading
                          ? "Calculating..."
                          : formatCurrency(deliveryCharge)}
                      </span>
                    </div>
                  )}

                  <div style={{ fontSize: 16, borderTop: '1px solid #f0f0f0', paddingTop: 4, marginTop: 2 }}>
                    Grand Total:{' '}
                    <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* ── Submit ─────────────────────────────────── */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="small"
                icon={<ShoppingCartOutlined />}
              >
                {isHomeDelivery ? 'Create Delivery Order' : 'Create Walk-in Order'}
              </Button>
              <Button onClick={onClose} size="small">
                Cancel
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <ShippingAddressModal
        open={addAddressModalVisible}
        onCancel={() => {
          setAddAddressModalVisible(false);
          addressForm.resetFields();
        }}
        onSubmit={handleAddNewAddress}
        form={addressForm}
        loading={addAddressLoading}
      />

      <AddCustomerModal
        open={addCustomerModalVisible}
        onCancel={() => setAddCustomerModalVisible(false)}
        onSuccess={(customer) => {
          setAddCustomerModalVisible(false);
          fetchCustomers('');
          if (customer?.id) handleCustomerSelect(customer.id);
        }}
      />
    </>
  );
};

export default ManualOrderModal;