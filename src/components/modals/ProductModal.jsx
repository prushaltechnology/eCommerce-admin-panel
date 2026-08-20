import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Switch,
  Typography,
  Upload
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import CategoryModal from './CategoryModal';
const { Text } = Typography;

const { TextArea } = Input;
const { Option } = Select;
const buildMediaUrl = (path) =>
  `${import.meta.env.VITE_GRAPHQL_URI
    .replace('/graphql/', '')
    .replace('/graphql', '')}/media/${path}`;

const ProductModal = ({
  visible,
  onCancel,
  onSubmit,
  initialValues,
  categories,
  loading,
  imageList,
  setImageList,
  title,
  onDeleteImage,
  onAddImage,
  onCreateCategory,
  onRefreshCategories
}) => {
  const [form] = Form.useForm();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm] = Form.useForm();
  const [categoryImageList, setCategoryImageList] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const removingRef = useRef(new Set());

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,

          weight:
            initialValues?.weight !== null && initialValues?.weight !== undefined
              ? Number(initialValues.weight)
              : undefined,
          price:
            initialValues?.price !== null && initialValues?.price !== undefined
              ? Number(initialValues.price)
              : undefined,
          discountPrice:
            initialValues?.discountPrice !== null && initialValues?.discountPrice !== undefined
              ? Number(initialValues.discountPrice)
              : null,

          deliveryRuleDays:
            initialValues?.deliveryRuleDays !== null && initialValues?.deliveryRuleDays !== undefined
              ? Number(initialValues.deliveryRuleDays)
              : 0,

          storefrontQuantity: initialValues?.storefrontQuantity ?? 0,
          systemQuantity: initialValues?.systemQuantity ?? 0,
          storefrontReservedQuantity: initialValues?.storefrontReservedQuantity ?? 0,
          systemReservedQuantity: initialValues?.systemReservedQuantity ?? 0,
          bulkOrderPrice: initialValues?.bulkOrderPrice
            ? Number(initialValues.bulkOrderPrice)
            : null,
          keywords: Array.isArray(initialValues?.keywords)
            ? initialValues.keywords.join(', ')
            : initialValues?.keywords,
        });
        if (initialValues?.images) {
          setImageList(
            initialValues.images.map((img) => ({
              uid: img.id,
              id: img.id,
              name: img.image,
              status: 'done',
              image: img.image,
              url: buildMediaUrl(img.image),
              thumbUrl: buildMediaUrl(img.image),
            }))
          );
        }
        // Reset removal guard whenever we (re)load a product's images
        removingRef.current = new Set();
      } else {
        form.resetFields();
        setImageList([]);
        removingRef.current = new Set();
      }
    }
  }, [
    visible, initialValues, form, setImageList
  ]);

  const uploadProps = {
    name: "file",
    multiple: true,
    listType: "picture-card",
    fileList: imageList,

    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        if (initialValues?.id && onAddImage) {
          const res = await onAddImage(initialValues.id, file);

          if (!res) {
            throw new Error("Upload failed");
          }

          const imageEntity = res.productImage || res;
          const imagePath = imageEntity.image || imageEntity.path || null;

          const resolvedUrl = imagePath
            ? buildMediaUrl(imagePath)
            : imageEntity.url || URL.createObjectURL(file);

          setImageList((prev) => [
            ...prev,
            {
              uid: imageEntity.id,
              id: imageEntity.id,
              name: imagePath || file.name,
              status: "done",
              image: imagePath,
              url: resolvedUrl,
              thumbUrl: resolvedUrl,
            },
          ]);

          message.success("Image uploaded successfully");
          onSuccess?.("ok");
        } else {
          const previewUrl = URL.createObjectURL(file);

          setImageList((prev) => [
            ...prev,
            {
              uid: file.uid,
              name: file.name,
              status: "done",
              originFileObj: file,
              thumbUrl: previewUrl,
              url: previewUrl,
            },
          ]);

          onSuccess?.("ok");
        }
      } catch (error) {
        console.error("Upload Error:", error);

        const status =
          error?.response?.status ||
          error?.networkError?.statusCode ||
          error?.status ||
          error?.cause?.status;

        const messageText = error?.message || "";

        // Handle file too large
        if (
          status === 413 ||
          messageText.includes("413") ||
          messageText.includes("Request Entity Too Large")
        ) {
          message.error("File is too large. Please upload a file less than 600 KB.");
          return;
        }

        // Handle network/server rejection
        if (
          messageText === "Failed to fetch" ||
          error instanceof TypeError
        ) {
          message.error("Upload failed. Please try again.");
          return;
        }

        // Handle all other errors
        message.error(messageText || "Upload failed.");
      }

    },
    onRemove: async (file) => {
      if (file.id && onDeleteImage) {
        if (removingRef.current.has(file.uid)) {
          return false;
        }

        removingRef.current.add(file.uid);

        try {
          const result = await onDeleteImage(file.id);

          if (!result) {
            message.error('Failed to delete image');
            removingRef.current.delete(file.uid);
            return false;
          }

          message.success('Image deleted successfully');

          setImageList((prev) =>
            prev.filter((img) => img.uid !== file.uid)
          );

          removingRef.current.delete(file.uid);
          return false;
        } catch (error) {
          //console.error(error);
          message.error('Failed to delete image');
          removingRef.current.delete(file.uid);
          return false;
        }
      }

      setImageList((prev) =>
        prev.filter((img) => img.uid !== file.uid)
      );

      return false;
    },

    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');

      if (!isImage) {
        message.error(
          'You can only upload image files!'
        );
        return Upload.LIST_IGNORE;
      }

      const isLt600K =
        file.size / 1024 < 600;

      if (!isLt600K) {
        message.error(
          'File is too large. Please upload a file less than 600 KB.'
        );
        return Upload.LIST_IGNORE;
      }

      return true;
    },
  };

  const handleSubmit = async (
    values
  ) => {
    try {
      // deliveryRuleDays: guaranteed to be a valid finite number, NEVER null/undefined/NaN.
      // Number(null) -> 0, Number(undefined) -> NaN, Number('') -> 0, Number(2) -> 2
      const rawDeliveryRuleDays = Number(values.deliveryRuleDays);
      const deliveryRuleDays = Number.isFinite(rawDeliveryRuleDays)
        ? rawDeliveryRuleDays
        : 0;

      const productData = {
        ...values,
        shortDescription: values.shortDescription,
        keywords: values.keywords
          ? values.keywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [],
        deliveryRuleDays,
        categoryId: values.categoryId,
        price: parseFloat(values.price),
        discountPrice: values.discountPrice ? parseFloat(values.discountPrice) : null,
        bulkOrderPrice: values.bulkOrderPrice ? parseFloat(values.bulkOrderPrice) : null,
        isActive: values.isActive !== false,
        isFeatured: values.isFeatured === true,
        measureValue: values.measureValue || null,
        storefrontQuantity: Number(values.storefrontQuantity) || 0,
        systemQuantity: Number(values.systemQuantity) || 0,
        storefrontReservedQuantity: Number(values.storefrontReservedQuantity) || 0,
        systemReservedQuantity: Number(values.systemReservedQuantity) || 0,
      };

      // Debug: confirm what's actually being sent before calling onSubmit
      console.log("productData being submitted:", productData);

      // ONLY FOR NEW PRODUCT
      const imageData =
        imageList
          .filter(
            (file) =>
              file.originFileObj
          )
          .map(
            (file) =>
              file.originFileObj
          );
      await onSubmit(
        productData,
        imageData
      );
      form.resetFields();
      setImageList([]);
    } catch (error) {
      //console.error(
      //  'Submit error:',
      //  error
      //);
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={null}
      // width={650}
      centered
      destroyOnHidden
      styles={{
        body: {
          maxHeight: "70vh",
          overflowY: "auto",
          paddingRight: 8,
        }
      }}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>

        {/* 🔹 BASIC INFO */}
        <Text strong style={{ fontSize: 14 }}>Basic Information</Text>
        <Divider style={{ margin: "4px 0 8px" }} />

        <Row gutter={[8, 4]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="name"
              label="Product Name"
              rules={[{ required: true, message: "Enter product name" }]}
            >
              <Input placeholder="e.g. ABC" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="sku"
              label="SKU"
              rules={[{ required: true, message: "Enter SKU" }]}
            >
              <Input placeholder="e.g. PR-001" />
            </Form.Item>
          </Col>
        </Row>


        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea
            rows={2}
            placeholder="Enter product description..."
          />
        </Form.Item>
        <Form.Item
          name="shortDescription"
          label="Short Description"
        >
          <Input
            placeholder="Enter short description"
          />
        </Form.Item>
        <Form.Item
          name="keywords"
          label="Keywords"
        >
          <Input
            placeholder="Enter keywords"
          />
        </Form.Item>
        <Row gutter={[8, 4]}>
          <Col xs={24} md={12}>


            <Form.Item
              name="deliveryRuleDays"
              label="Delivery Rule Days"
              initialValue={0}
              rules={[
                {
                  required: true,
                  message: 'Enter delivery days'
                }
              ]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="e.g. 2"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 PRICING */}
        <Text strong style={{ fontSize: 14 }}>Pricing</Text>
        <Divider style={{ margin: "8px 0 16px" }} />

        <Row gutter={[8, 4]}>
          <Col xs={24} md={8}>
            <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Enter price' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter price" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="discountPrice" label="Discount Price">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Optional" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            {/* ── NEW FIELD ── */}
            <Form.Item name="bulkOrderPrice" label="Bulk Order Price">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Optional" />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 UNIT & MEASURE */}
        <Text strong style={{ fontSize: 14 }}>Unit & Measure</Text>
        <Divider style={{ margin: "8px 0 16px" }} />


        <Row gutter={[8, 4]}>
          <Col xs={24} md={8}>
            <Form.Item
              name="measureValue"
              label="Measure Value"
              rules={[{ required: true, message: "Enter measure value" }]}
            >
              <Input
                style={{ width: "100%" }}
                placeholder="e.g. 2"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="unit"
              label="Unit"
              rules={[{ required: true, message: "Select a unit" }]}
            >
              <Select placeholder="Select a unit">
                <Option value="piece">Piece</Option>
                <Option value="stem">Stem</Option>
                <Option value="bunch">Bunch</Option>
                <Option value="bouquet">Bouquet</Option>
                <Option value="dozen">Dozen</Option>
                <Option value="box">Box</Option>
                <Option value="basket">Basket</Option>
                <Option value="pack">Pack</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="weight"
              label="Weight (kg)"
              extra="Weight must be in kg"
              rules={[
                { required: true, message: "Enter weight" },
                {
                  type: 'number',
                  max: 100,
                  message: 'Weight cannot be more than 100 kg',
                }
              ]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                placeholder="e.g. 1.5"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 STOCK */}
        <Text strong style={{ fontSize: 14 }}>Stock</Text>
        <Divider style={{ margin: "8px 0 16px" }} />


        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="storefrontQuantity"
              label="Storefront Qty"
              initialValue={0}
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="systemQuantity"
              label="System Qty"
              initialValue={0}
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="storefrontReservedQuantity"
              label="Storefront Reserved"
              initialValue={0}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="systemReservedQuantity"
              label="System Reserved"
              initialValue={0}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>


        {/* 🔹 CATEGORY + STATUS */}
        <Text strong style={{ fontSize: 14 }}>Settings</Text>
        <Divider style={{ margin: "8px 0 16px" }} />

        <Row gutter={[8, 4]}>
          <Col xs={24} md={8}>
            <Form.Item
              name="categoryId"
              label="Category"
              rules={[{ required: true, message: "Select category" }]}
            >
              <Select
                placeholder="Select category"
                disabled={!!initialValues}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <div
                      style={{ padding: '8px' }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => setCategoryModalOpen(true)}
                        style={{ width: '100%' }}
                      >
                        Add Category
                      </Button>
                    </div>
                  </>
                )}
              >
                {categories.map((category) => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="isActive"
              label="Status"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="isFeatured"
              label="Featured"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 IMAGES */}
        <Text strong style={{ fontSize: 14 }}>Product Images</Text>
        <Divider style={{ margin: "8px 0 16px" }} />

        <Form.Item
          name="images"
          extra={
            <>
              <div>You can upload up to 5 images <strong>(max 600 KB each)</strong>.</div>
              <div>Please upload images in a <strong>1:1 (square)</strong> aspect ratio.</div>
            </>
          }
        >
          <Upload {...uploadProps}>
            {imageList.length >= 5 ? null : (
              <div>
                <div style={{ fontSize: 18 }}>+</div>
                <div style={{ fontSize: 12 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        {/* 🔹 ACTION BUTTONS */}
        <Divider />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button size="small" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" size="small" htmlType="submit" loading={loading}>
            {initialValues ? "Update Product" : "Add Product"}
          </Button>
        </div>

      </Form>

      {/* Category Modal */}
      <CategoryModal
        open={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          categoryForm.resetFields();
          setCategoryImageList([]);
        }}
        onSubmit={async (values) => {
          setCategoryLoading(true);
          try {
            const categoryData = {
              ...values,
              image: categoryImageList[0]?.originFileObj || null
            };
            const result = await onCreateCategory(categoryData);
            if (result) {
              message.success('Category created successfully');
              setCategoryModalOpen(false);
              categoryForm.resetFields();
              setCategoryImageList([]);
              await onRefreshCategories();
            }
          } catch (error) {
            message.error('Failed to create category');
          } finally {
            setCategoryLoading(false);
          }
        }}
        editingCategory={null}
        parentCategories={categories.filter(cat => !cat.parent)}
        imageList={categoryImageList}
        setImageList={setCategoryImageList}
        loading={categoryLoading}
        form={categoryForm}
      />
    </Modal>
  );
};

export default ProductModal;