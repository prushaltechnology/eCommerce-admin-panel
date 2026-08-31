import { useState } from "react";
import { Modal, Tag, Button, message } from "antd";
import dayjs from 'dayjs';
import OrderTrackingTimeline from './OrderTrackingTimeline';
import { sendPaymentReminder } from "../../api/orders";
const fmt = (val) => `₹${parseFloat(val || 0).toFixed(2)}`;
import {
  EyeOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  CarOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  UndoOutlined,
  StopOutlined,
  CalendarOutlined,
  WalletOutlined, // <-- Add this
} from "@ant-design/icons";

const getStatusIcon = (status) => {
  const iconStyle = {
    fontSize: 12,
  };

  switch (status?.toLowerCase()) {
    case "payment_pending":
      return <CreditCardOutlined style={iconStyle} />;

    case "payment_successful":
      return <CheckCircleOutlined style={iconStyle} />;

    case "scheduled":
      return <CalendarOutlined style={iconStyle} />;

    case "adv_order_confirmed":
      return <WalletOutlined style={iconStyle} />;

    case "processing":
      return <ClockCircleOutlined style={iconStyle} />;

    case "confirmed":
      return <ShoppingOutlined style={iconStyle} />;

    case "dispatched":
      return <CarOutlined style={iconStyle} />;

    case "delivered":
      return <CheckCircleOutlined style={iconStyle} />;

    case "cancelled":
      return <CloseCircleOutlined style={iconStyle} />;

    case "refunded":
      return <UndoOutlined style={iconStyle} />;

    case "refund_rejected":
      return <StopOutlined style={iconStyle} />;

    default:
      return <QuestionCircleOutlined style={iconStyle} />;
  }
};

const getStatusColor = (status) => {
  const colors = {
    payment_pending: "gold",
    payment_successful: "cyan",
    scheduled: "geekblue",
    adv_order_confirmed: "gold",
    processing: "orange",
    confirmed: "blue",
    dispatched: "purple",
    delivered: "green",
    cancelled: "red",
    refunded: "magenta",
    refund_rejected: "volcano",
  };

  return colors[status?.toLowerCase()] || "default";
};

const formatStatus = (status) =>
  status
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());


// const STATUS_CONFIG = {
//   pending: { color: 'warning', icon: '⏳' },
//   confirmed: { color: 'processing', icon: '✅' },
//   dispatched: { color: 'blue', icon: '🚚' },
//   delivered: { color: 'success', icon: '📦' },
//   cancelled: { color: 'error', icon: '✖' },
// };

/* ── Helpers ──────────────────────────────────────────────────── */

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 600, color: '#8c8c8c',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 12,
  }}>
    {children}
  </div>
);

const Field = ({ label, children, style = {} }) => (
  <div style={{ marginBottom: 10, ...style }}>
    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 500, color: '#1f1f1f' }}>{children}</div>
  </div>
);

const PriceRow = ({ label, value, valueStyle = {}, bold = false }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '4px 0', fontSize: bold ? 14 : 13,
    fontWeight: bold ? 600 : 400,
    color: bold ? '#1f1f1f' : '#595959',
  }}>
    <span>{label}</span>
    <span style={valueStyle}>{value}</span>
  </div>
);

/* ── Product image ─────────────────────────────────────────────── */

const ItemImage = ({ item }) => {
  const validImage = item.product?.images?.find(
    (img) => img.image && img.image.trim() !== ''
  );

  const placeholder = (
    <div style={{
      width: 48, height: 48, borderRadius: 8, flexShrink: 0,
      background: '#f5f5f5', border: '1px solid #e8e8e8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 10, color: '#bbb' }}>No img</span>
    </div>
  );

  if (!validImage) return placeholder;

  const base = import.meta.env.VITE_GRAPHQL_URI
    .replace('/graphql/', '')
    .replace('/graphql', '');
  const src = validImage.image.startsWith('data:')
    ? validImage.image
    : `${base}/media/${validImage.image}`;

  return (
    <img
      src={src}
      alt={item.product?.name || 'Product'}
      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0', flexShrink: 0 }}
      onError={(e) => { e.target.replaceWith(placeholder); }}
    />
  );
};

/* ── Main modal ────────────────────────────────────────────────── */

const OrderDetailsModal = ({ open, order, onCancel, trackingData, trackingLoading }) => {
  if (!order) return null;
  const [sendingReminder, setSendingReminder] = useState(false);
  const isHomeDelivery =
    order.purchaseType === 'HOME_DELIVERY' ||
    order.purchaseType === 'home_delivery';

  const totalAmount = parseFloat(order.totalAmount || 0);
  const finalAmount = parseFloat(order.finalAmount || 0);
  const itemsSubtotal = (order.items || []).reduce(
    (acc, item) => acc + parseFloat(item.subtotal || 0), 0
  );
  const discountAmount = Math.max(0, totalAmount - itemsSubtotal);
  const deliveryCharge = Math.max(0, finalAmount - itemsSubtotal);

  const statusKey = order.status?.toLowerCase();
  // const statusCfg = STATUS_CONFIG[statusKey] || {};

  const handleSendPaymentReminder = async () => {
    setSendingReminder(true);

    try {
      const res = await sendPaymentReminder(order.id);

      if (res.success) {
        message.success(res.message);
      } else {
        message.error(res.message);
      }
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f' }}>Order details</span>
          <span style={{
            fontSize: 13, fontWeight: 500, color: '#1890ff',
            background: '#e6f4ff', padding: '1px 10px', borderRadius: 6,
          }}>
            #{order.orderNumber || order.id}
          </span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={720}
      styles={{
        body: { padding: 0 },
        header: { padding: '14px 20px', borderBottom: '1px solid #f0f0f0', marginBottom: 0 },
      }}
    >
      <div style={{ maxHeight: '78vh', overflowY: 'auto' }}>

        {/* ── Customer & Shipping ─────────────────────────────── */}
        <Section>
          <SectionLabel>Customer &amp; shipping</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
            <div>
              <Field label="Name">
                {order.customer
                  ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
                  : <span style={{ color: '#bbb' }}>Guest / Walk-in</span>
                }
              </Field>
              <Field label="Email">
                <span style={{ color: order.customer?.email ? '#1890ff' : '#bbb' }}>
                  {order.customer?.email || '—'}
                </span>
              </Field>
              <Field label="Phone">{order.customer?.phone || '—'}</Field>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>Shipping address</div>
              <div style={{
                fontSize: 13, color: '#1f1f1f', lineHeight: 1.7,
                background: '#fafafa', border: '1px solid #f0f0f0',
                borderRadius: 8, padding: '10px 12px',
              }}>
                {order.shippingAddress && order.shippingAddress !== 'Walk In Purchase'
                  ? order.shippingAddress
                  : <span style={{ color: '#bbb' }}>Walk-in — no address</span>}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Order Summary ───────────────────────────────────── */}
        <Section>
          <SectionLabel>Order summary</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
            <div>
              <Field label="Order number">{order.orderNumber}</Field>
              <Field label="Date">{dayjs(order.createdAt).format('D MMM YYYY, h:mm A')}</Field>
              <Field label="Order type">
                <Tag
                  color={order.orderType === 'BULK' ? 'purple' : order.orderType === 'CUSTOM' ? 'orange' : 'blue'}
                  style={{ textTransform: 'capitalize', marginTop: 2 }}
                >
                  {order.orderType?.toLowerCase() || 'normal'}
                </Tag>
              </Field>
            </div>
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <Tag color={getStatusColor(statusKey)}>
                    {getStatusIcon(statusKey)} {formatStatus(statusKey)}
                  </Tag>
                </div>

                {statusKey === "adv_order_confirmed" && (
                  <Button
                    type="primary"
                    size="small"
                    loading={sendingReminder}
                    onClick={handleSendPaymentReminder}
                    block
                  >
                    Send Payment Reminder
                  </Button>
                )}
              </div>
              <Field label="Purchase type">
                <Tag color={isHomeDelivery ? 'blue' : 'green'} style={{ marginTop: 2 }}>
                  {isHomeDelivery ? '🏠 Home delivery' : '🛒 Walk-in'}
                </Tag>
              </Field>
              {order.approximateWeight && (
                <Field label="Approximate weight">
                  {order.approximateWeight} kg
                </Field>
              )}
            </div>
          </div>

          {order.notes && (
            <div style={{
              marginTop: 14, fontSize: 13, color: '#1f1f1f',
              background: '#fffbe6', border: '0 solid', borderLeft: '3px solid #faad14',
              borderRadius: '0 8px 8px 0', padding: '10px 12px', lineHeight: 1.6,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#d48806', marginBottom: 3 }}>NOTE</div>
              {order.notes}
            </div>
          )}
        </Section>

        {/* ── Order Items ─────────────────────────────────────── */}
        <Section>
          <SectionLabel>Items ordered</SectionLabel>

          <div>
            {order.items?.map((item, index) => {
              const qty = item.quantity || 1;
              const subtotal = parseFloat(item.subtotal || 0);
              const origPrice = parseFloat(item.product?.price || 0);
              const effectiveUnit = subtotal / qty;
              const origTotal = origPrice * qty;
              const itemDiscount = Math.max(0, origTotal - subtotal);
              const hasDiscount = itemDiscount > 0;

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0',
                    borderBottom: index < (order.items.length - 1)
                      ? '1px solid #f5f5f5' : 'none',
                  }}
                >
                  <ItemImage item={item} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f1f1f' }}>
                      {item.product?.name || 'Unknown product'}
                    </div>
                    {item.product?.measureValue && item.product?.unit && (
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 1 }}>
                        {item.product.measureValue} {item.product.unit}
                      </div>
                    )}
                    <div style={{ marginTop: 5, fontSize: 12 }}>
                      {hasDiscount ? (
                        <>
                          <span style={{ color: '#8c8c8c', textDecoration: 'line-through', marginRight: 6 }}>
                            {fmt(origPrice)}
                          </span>
                          <span style={{ color: '#52c41a', fontWeight: 600 }}>
                            {fmt(effectiveUnit)}
                          </span>
                          <span style={{ color: '#bbb', marginLeft: 4 }}>/ unit</span>
                        </>
                      ) : (
                        <span style={{ color: '#595959' }}>
                          {fmt(effectiveUnit)}
                          <span style={{ color: '#bbb', marginLeft: 4 }}>/ unit</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {qty} × {fmt(effectiveUnit)}
                    </div>
                    {hasDiscount && (
                      <div style={{ fontSize: 11, color: '#ff4d4f', textDecoration: 'line-through' }}>
                        {fmt(origTotal)}
                      </div>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1f1f1f' }}>
                      {fmt(subtotal)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Price breakdown */}
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 12, paddingTop: 12 }}>
            <PriceRow label="Original price" value={fmt(totalAmount)} />
            {discountAmount > 0 && (
              <PriceRow
                label="Discount"
                value={`− ${fmt(discountAmount)}`}
                valueStyle={{ color: '#52c41a', fontWeight: 600 }}
              />
            )}
            <PriceRow label="Items subtotal" value={fmt(itemsSubtotal)} valueStyle={{ fontWeight: 600, color: '#1f1f1f' }} />
            {deliveryCharge > 0 && (
              <PriceRow
                label="Delivery charge"
                value={`+ ${fmt(deliveryCharge)}`}
                valueStyle={{ color: '#fa8c16', fontWeight: 600 }}
              />
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '2px solid #f0f0f0', marginTop: 10, paddingTop: 12,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1f1f1f' }}>Grand total</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1890ff' }}>{fmt(finalAmount)}</span>
            </div>
          </div>
        </Section>

        {/* ── Order Tracking ──────────────────────────────────── */}
        <Section last>
          <SectionLabel>Order tracking</SectionLabel>
          <OrderTrackingTimeline
            order={order}
            trackingData={trackingData}
            trackingLoading={trackingLoading}
          />
        </Section>

      </div>
    </Modal>
  );
};

/* ── Section wrapper ──────────────────────────────────────────── */

const Section = ({ children, last = false }) => (
  <div style={{
    padding: '16px 20px',
    borderBottom: last ? 'none' : '1px solid #f0f0f0',
  }}>
    {children}
  </div>
);

export default OrderDetailsModal;