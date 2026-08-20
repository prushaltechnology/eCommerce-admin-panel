import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  Upload,
} from 'antd';

import { useEffect, useState } from 'react';

import {
  getHeroSections,
  updateHero,
} from '../../../api/cms';

import SaveButton from './SaveButton';

const { TextArea } = Input;

const HeroSection = () => {

  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getHeroSections();

    if (res.success && res.heroes) {

      const data = { ...res.heroes };

      // Convert image URL to Upload fileList format
      if (data.heroImage) {
        data.heroImage = [
          {
            uid: '-1',
            name: 'hero-image',
            status: 'done',
            url: data.heroImage,
          },
        ];
      } else {
        data.heroImage = [];
      }

      form.setFieldsValue(data);
    }
  };

  const handleSubmit = async (values) => {

    setLoading(true);

    try {

      const payload = {
        ...values,
        heroImage:
          values.heroImage?.[0]?.originFileObj || null,
      };

      const res = await updateHero(payload);

      if (res.success) {
        message.success('Hero updated');
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Hero Section"
      style={{ marginBottom: 20 }}
      loading={loading}
    >

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >

        <Row gutter={16}>

          <Col span={12}>

            <Form.Item
              label="Badge Text"
              name="badgeText"
            >
              <Input />
            </Form.Item>

          </Col>

          <Col span={12}>

            <Form.Item
              label="Title"
              name="titleLine1"
            >
              <Input />
            </Form.Item>

          </Col>

        </Row>

        <Form.Item
          label="Highlight Text"
          name="highlightText"
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label="Button Text"
          name="buttonText"
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Button Link"
          name="buttonLink"
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Hero Image"
          name="heroImage"
          valuePropName="fileList"
          getValueFromEvent={(e) => {
            if (Array.isArray(e)) {
              return e;
            }
            return e?.fileList || [];
          }}
        >
          <Upload
            beforeUpload={() => false}
            listType="picture"
            maxCount={1}
          >
            <Button>
              Upload Image
            </Button>
          </Upload>
        </Form.Item>
        <SaveButton loading={loading}>
          Save Hero
        </SaveButton>

      </Form>

    </Card>
  );
};

export default HeroSection;