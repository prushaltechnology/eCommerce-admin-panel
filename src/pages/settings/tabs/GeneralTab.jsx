import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  TimePicker,
  Upload,
} from 'antd';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

import {
  getStoreSettings,
  updateStoreSettings,
} from '../../../api/cms';

import SaveButton from '../components/SaveButton';

// ── Theme color fields with labels ──────────────────────────────────
const THEME_COLOR_FIELDS = [
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Foreground' },
  { key: 'primary', label: 'Primary' },
  { key: 'primaryForeground', label: 'Primary Foreground' },
  { key: 'primaryText', label: 'Primary Text' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'secondaryForeground', label: 'Secondary Foreground' },
  { key: 'card', label: 'Card' },
  { key: 'cardForeground', label: 'Card Foreground' },
  { key: 'accent', label: 'Accent' },
  { key: 'accentForeground', label: 'Accent Foreground' },
  { key: 'border', label: 'Border' },
  { key: 'input', label: 'Input' },
  { key: 'ring', label: 'Ring' },
  { key: 'destructive', label: 'Destructive' },
];

const TIME_FORMAT = 'HH:mm:ss';

const GeneralTab = () => {

  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [logoList, setLogoList] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {

    const res = await getStoreSettings();

    if (!res.success || !res.settings) return;

    const {
      storeName,
      storeLogo,
      storeAddress,
      contactNo,
      storefrontTheme,
      advanceBookingStartTime,
      advanceBookingEndTime,
    } = res.settings;

    // Flatten theme keys into form values
    const formValues = {
      storeName,
      storeAddress,
      contactNo,
      advanceBookingStartTime: advanceBookingStartTime
        ? dayjs(advanceBookingStartTime, TIME_FORMAT)
        : null,
      advanceBookingEndTime: advanceBookingEndTime
        ? dayjs(advanceBookingEndTime, TIME_FORMAT)
        : null,
    };

    if (storefrontTheme && typeof storefrontTheme === 'object') {
      THEME_COLOR_FIELDS.forEach(({ key }) => {
        formValues[`theme_${key}`] = storefrontTheme[key] ?? '#000000';
      });
      // radius lives inside storefrontTheme
      formValues['theme_radius'] = storefrontTheme.radius ?? '8px';
    }

    form.setFieldsValue(formValues);

    if (storeLogo) {
      setLogoList([
        {
          uid: '-1',
          name: 'store-logo',
          status: 'done',
          url: storeLogo,
        },
      ]);
    }
  };

  const handleSubmit = async (values) => {

    setLoading(true);

    try {

      // Re-assemble storefrontTheme object from flat keys
      const storefrontTheme = {
        radius: values['theme_radius'] ?? '8px',
      };

      THEME_COLOR_FIELDS.forEach(({ key }) => {
        storefrontTheme[key] = values[`theme_${key}`] ?? '#000000';
      });

      const payload = {
        storeName: values.storeName,
        storeAddress: values.storeAddress,
        contactNo: values.contactNo,
        storeLogo: logoList[0]?.originFileObj || null,
        storefrontTheme, // pass as plain object — backend returns it as object too
        advanceBookingStartTime: values.advanceBookingStartTime
          ? values.advanceBookingStartTime.format(TIME_FORMAT)
          : null,
        advanceBookingEndTime: values.advanceBookingEndTime
          ? values.advanceBookingEndTime.format(TIME_FORMAT)
          : null,
      };

      const res = await updateStoreSettings(payload);

      if (res.success) {
        message.success('Store settings saved');
      } else {
        message.error(res.message || 'Failed to save');
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >

      {/* ── Store Info ──────────────────────────────────────────── */}
      <Card
        title="Store Information"
        style={{ marginBottom: 20 }}
        loading={loading}
      >

        <Row gutter={16}>

          <Col span={12}>
            <Form.Item
              label="Store Name"
              name="storeName"
              rules={[{ required: true, message: 'Store name is required' }]}
            >
              <Input placeholder="My Store" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Contact Number"
              name="contactNo"
            >
              <Input placeholder="+91 98765 43210" />
            </Form.Item>
          </Col>

        </Row>

        <Form.Item
          label="Store Address"
          name="storeAddress"
        >
          <Input.TextArea rows={3} placeholder="123 Main St, City, Country" />
        </Form.Item>

        <Form.Item label="Store Logo">
          <Upload
            fileList={logoList}
            beforeUpload={() => false}
            listType="picture"
            maxCount={1}
            onChange={({ fileList }) => setLogoList(fileList)}
          >
            <Button>Upload Logo</Button>
          </Upload>
        </Form.Item>

      </Card>

      {/* ── Shop Timing ─────────────────────────────────────────── */}
      <Card
        title="Shop Timing"
        style={{ marginBottom: 20 }}
        loading={loading}
      >

        <Row gutter={16}>

          <Col span={12}>
            <Form.Item
              label="Shop Start Time"
              name="advanceBookingStartTime"
            >
              <TimePicker
                format={TIME_FORMAT}
                style={{ width: '100%' }}
                placeholder="Select start time"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Shop End Time"
              name="advanceBookingEndTime"
            >
              <TimePicker
                format={TIME_FORMAT}
                style={{ width: '100%' }}
                placeholder="Select end time"
              />
            </Form.Item>
          </Col>

        </Row>

      </Card>

      {/* ── Storefront Theme ────────────────────────────────────── */}
      {/* <Card
        title="Storefront Theme"
        style={{ marginBottom: 20 }}
        loading={loading}
      >

        <Row gutter={16}>

          {THEME_COLOR_FIELDS.map(({ key, label }) => (
            <Col key={key} xs={24} sm={12} md={8} lg={6}>
              <Form.Item
                label={label}
                name={`theme_${key}`}
              >
                <Input
                  type="color"
                  style={{ width: '100%', height: 40, padding: 2 }}
                />
              </Form.Item>
            </Col>
          ))}

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item
              label="Border Radius"
              name="theme_radius"
              tooltip="e.g. 8px, 0.5rem, 12px"
            >
              <Input placeholder="8px" />
            </Form.Item>
          </Col>

        </Row>

      </Card> */}

      <SaveButton loading={loading}>
        Save Settings
      </SaveButton>

    </Form>
  );
};

export default GeneralTab;