import { useState, lazy, Suspense } from "react";
import { Button, Col, Form, Input, Modal, Row, Space, Switch } from "antd";

// MapAddressPicker uses react-leaflet, which touches `window` on import.
// React.lazy + Suspense defers loading it until the modal actually
// renders, same reason the storefront used next/dynamic(ssr:false) —
// but this works in plain React (no Next.js needed).
const MapAddressPicker = lazy(() => import("./MapAddressPicker"));

const ShippingAddressModal = ({
  open,
  onCancel,
  onSubmit,
  form,
  loading,
  // Optional — pass these when editing an address that already has a
  // saved point, so the map opens centered there instead of running
  // geolocation. Leave undefined for "Add New Address".
  initialLat,
  initialLng,
}) => {
  const hasInitialPosition =
    typeof initialLat === "number" && typeof initialLng === "number";

  const [mapAddress, setMapAddress] = useState(
    hasInitialPosition
      ? {
          formattedAddress: "",
          pincode: form.getFieldValue("pincode") ?? "",
          city: form.getFieldValue("city") ?? "",
          state: form.getFieldValue("state") ?? "",
          lat: initialLat,
          lon: initialLng,
        }
      : null
  );
  const [showMumbaiWarning, setShowMumbaiWarning] = useState(false);

  const handleMapValid = (data) => {
    setShowMumbaiWarning(false);
    setMapAddress(data);
    form.setFieldsValue({
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    });
  };

  const handleMapInvalid = () => {
    setMapAddress(null);
    setShowMumbaiWarning(true);
    form.setFieldsValue({
      city: "",
      state: "",
      pincode: "",
    });
  };

  const handleFinish = (values) => {
    if (!mapAddress) {
      setShowMumbaiWarning(true);
      return;
    }

    onSubmit({
      ...values,
      latitude: mapAddress.lat,
      longitude: mapAddress.lon,
    });
  };

  const handleCancel = () => {
    setMapAddress(
      hasInitialPosition
        ? {
            formattedAddress: "",
            pincode: "",
            city: "",
            state: "",
            lat: initialLat,
            lon: initialLng,
          }
        : null
    );
    setShowMumbaiWarning(false);
    onCancel();
  };

  return (
    <Modal
      title="Add New Shipping Address"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="name"
          label="Full Name"
          rules={[{ required: true, message: "Please enter full name" }]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone Number"
          rules={[{ required: true, message: "Please enter phone number" }]}
        >
          <Input placeholder="Enter phone number" />
        </Form.Item>

        <Form.Item
          name="addressLine"
          label="Address"
          rules={[{ required: true, message: "Please enter address" }]}
        >
          <Input.TextArea rows={3} placeholder="Flat No, Building Name, Area" />
        </Form.Item>

        {/* Map — same picker used on the storefront. Fills city/state/
            pincode below; lat/lon are appended onto the submitted values
            in handleFinish since they aren't user-typed Form fields. */}
        <Form.Item
          label={
            <span>
              Delivery Location <span style={{ color: "#ff4d4f" }}>*</span>
            </span>
          }
        >
          <Suspense fallback={<div style={{ padding: 16 }}>Loading map…</div>}>
            <MapAddressPicker
              onValidAddress={handleMapValid}
              onInvalidAddress={handleMapInvalid}
              initialLat={initialLat}
              initialLng={initialLng}
            />
          </Suspense>
          {mapAddress && (
            <p className="text-xs text-green-600 mt-1.5">
              ✓ Location confirmed in Mumbai
            </p>
          )}
          {showMumbaiWarning && (
            <p className="text-xs text-red-500 mt-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Please select a location within Mumbai only — we currently
              deliver only within Mumbai.
            </p>
          )}
        </Form.Item>

        {/* City/state/pincode are auto-filled from the map, same as the
            storefront modal, so they're read-only here too. */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="city"
              label="City"
              rules={[
                { required: true, message: "Please select a location on the map" },
              ]}
            >
              <Input placeholder="Auto-filled from map" readOnly />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="state"
              label="State"
              rules={[
                { required: true, message: "Please select a location on the map" },
              ]}
            >
              <Input placeholder="Auto-filled from map" readOnly />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="pincode"
          label="Pincode"
          rules={[
            { required: true, message: "Please select a location on the map" },
          ]}
        >
          <Input placeholder="Auto-filled from map" readOnly />
        </Form.Item>

        <Form.Item name="landmark" label="Landmark (Optional)">
          <Input placeholder="Enter landmark (e.g., Near mall, Opposite school)" />
        </Form.Item>

        <Form.Item name="isDefault" valuePropName="checked">
          <Switch checkedChildren="Default" unCheckedChildren="Set as Default" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={handleCancel} size="small">
              Cancel
            </Button>
            <Button
              type="primary"
              size="small"
              htmlType="submit"
              loading={loading}
              disabled={!mapAddress}
            >
              Add Address
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ShippingAddressModal;