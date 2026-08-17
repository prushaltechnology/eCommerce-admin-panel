import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Descriptions,
  Image,
  message,
  Modal,
  Spin,
  Tag,
  Typography
} from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useProducts from '../../hooks/useProducts';

const { Title, Text } = Typography;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { getProductById, addProductImage, deleteProductImage } = useProducts();
  const location = useLocation();
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [imageList, setImageList] = useState(location.state?.product?.images || []);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // If the product was passed via the router, we don't need to fetch it immediately
    if (!product && id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    const result = await getProductById(id);

    if (result) {
      setProduct(result);
      setImageList(result.images || []);
    } else {
      message.error("Product not found");
      navigate("/products/all");
    }

    setLoading(false);
  };

  const handleDeleteImage = (index) => {
    const imageToDelete = imageList[index];

    Modal.confirm({
      title: "Delete Image",
      content: "Are you sure you want to delete this image?",
      onOk: async () => {
        // If the image has an ID, it's an existing image from the server
        if (imageToDelete?.id) {
          const result = await deleteProductImage(imageToDelete.id);
          if (!result) {
            message.error('Failed to delete image');
            return;
          }
        }

        // Remove from local state
        const updated = imageList.filter((_, i) => i !== index);
        setImageList(updated);
        message.success("Image deleted successfully");
      }
    });
  };

  const handleAddImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files[0];

      const res = await addProductImage(product.id, file);

      if (res) {
        message.success("Image uploaded");
        loadProduct();
      } else {
        message.error("Upload failed");
      }
    };

    input.click();
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(price);

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: 100 }}><Spin /></div>;
  }

  if (!product) {
    return <Title level={3}>Product Not Found</Title>;
  }

  return (
    <div style={{ padding: 20 }}>

      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/products/all")}
        style={{ marginBottom: 20 }}
      >
        Back
      </Button>

      {/* 🔹 PRODUCT DETAILS */}
      <Card title="Product Details" size="small" style={{ marginBottom: 20 }}>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Name">{product.name}</Descriptions.Item>
          <Descriptions.Item label="SKU">{product.sku}</Descriptions.Item>
          <Descriptions.Item label="Price">{formatPrice(product.price)}</Descriptions.Item>
          <Descriptions.Item label="Discount Price">
            {product.discountPrice ? formatPrice(product.discountPrice) : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Bulk Price">
            {product.bulkOrderPrice ? formatPrice(product.bulkOrderPrice) : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Delivery Rule (Days)">
            {product.deliveryRuleDays != null ? product.deliveryRuleDays : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={product.isActive ? "green" : "red"}>
              {product.isActive ? "Active" : "Inactive"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Category">
            {product.category?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Measure Value & Unit">
            {product.measureValue != null && product.unit != null ? `${product.measureValue} ${product.unit}` : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Approximate Weight">
            {product.weight != null ? `${product.weight} kg` : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {product.description || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Short Description" span={2}>
            {product.shortDescription || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Keywords" span={2}>
            {product.keywords?.map((keyword, index) => (
              <Tag key={index}>{keyword}</Tag>
            )) || "-"}
          </Descriptions.Item>

        </Descriptions>
      </Card>

      {/* 🔹 IMAGES */}
      <Card
        size="small"
        title="Product Images"
        extra={
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddImage}>
            Add
          </Button>
        }
      >
        {imageList.length === 0 ? (
          <Text>No images</Text>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12
          }}>
            {imageList.map((img, index) => (
              <div key={index}>

                {/* Image Box */}
                <div
                  style={{
                    width: "100%",
                    height: 120,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "#f5f5f5"
                  }}
                >
                  <img
                    src={`${import.meta.env.VITE_GRAPHQL_URI.replace('/graphql/', '').replace('/graphql', '')}/media/${img.image}`}
                    alt="product"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "center" }}>
                  <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setImageModalVisible(true);
                    }}
                    title="View"
                  />
                  <Button
                    type="primary"
                    danger
                    ghost
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteImage(index)}
                    title="Delete"
                  />
                </div>

              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 🔹 PREVIEW */}
      <Modal
        open={imageModalVisible}
        footer={null}
        onCancel={() => setImageModalVisible(false)}
        centered
        closeIcon={
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            }}
          >
            ✕
          </span>
        }
        styles={{
          body: { padding: 0 },
          content: { padding: 0, overflow: "hidden" },
        }}
      >
        <img
          src={`${import.meta.env.VITE_GRAPHQL_URI.replace('/graphql/', '').replace('/graphql', '')}/media/${imageList[currentImageIndex]?.image}`}
          alt="product preview"
          style={{
            width: "100%",
            display: "block",
            borderRadius: 8,
          }}
        />
      </Modal>
    </div>
  );
};

export default ProductDetail;