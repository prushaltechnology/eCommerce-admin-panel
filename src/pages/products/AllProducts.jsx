import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Input,
  message,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCategory } from '../../api/categories';
import ImagePreviewModal from '../../components/modals/ImagePreviewModal';
import ProductModal from '../../components/modals/ProductModal';
import usePermissions from '../../hooks/usePermissions';
import useProducts from '../../hooks/useProducts';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const AllProducts = () => {
  const navigate = useNavigate();
  const { canView, canUpdate } = usePermissions();
  const canViewProducts = canView('product');
  const canManageProducts = canUpdate('product');

  const {
    products,
    categories,
    actionLoading,
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    addProductImage,
    deleteProductImage,
  } = useProducts();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const isFirstRender = useRef(true);
  const tableContainerRef = useRef(null);

  // Load everything once on mount
  useEffect(() => {
    loadProducts(null, true);
    loadCategories();
  }, []);

  // Re-fetch products only when user changes search or category (not on mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadProducts(null, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [categoryFilter, searchText, statusFilter]);

  useEffect(() => {
    const tableBody = tableContainerRef.current?.querySelector('.ant-table-body');
    if (tableBody) {
      const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
          if (hasMore && !loading && !fetchingMore) {
            loadProducts(nextCursor, false);
          }
        }
      };

      tableBody.addEventListener('scroll', handleScroll);
      return () => tableBody.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loading, fetchingMore, nextCursor]);

  const loadCategories = async () => {
    try {
      await fetchCategories();
    } catch {
      message.error('Failed to load categories');
    }
  };

  const handleImageModalClose = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };


  const loadProducts = async (cursor = null, isNewSearch = false) => {
    if (isNewSearch) {
      setLoading(true);
    } else {
      setFetchingMore(true);
    }

    try {
      const categoryId = categoryFilter === 'all' ? null : categoryFilter;
      const search = searchText ? searchText : null;

      const isActive = statusFilter === 'all' ? null : statusFilter === 'active';
      const result = await fetchProducts(10, cursor, search, categoryId, isActive, !isNewSearch);

      if (result) {
        if (isNewSearch) {
          setNextCursor(result.nextCursor);
          setHasMore(result.hasMore);
        } else {
          setNextCursor(result.nextCursor);
          setHasMore(result.hasMore);
        }
      }
    } catch {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setImageList([]); // Clear images from previous edit
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    // Map the product data to match form field names
    const mappedData = {
      id: record.id, // Include the product ID
      name: record.name,
      sku: record.sku,
      description: record.description,
      keywords: record.keywords,
      shortDescription: record.shortDescription,
      deliveryRuleDays: record.deliveryRuleDays,
      price: record.price,
      discountPrice: record.discountPrice,
      bulkOrderPrice: record.bulkOrderPrice,
      categoryId: record.category?.id,
      isActive: record.isActive,
      unit: record.unit,
      measureValue: record.measureValue,
      weight: record.weight,
      isFeatured: record.isFeatured,
      storefrontQuantity: record.storefrontStock?.quantity ?? 0,
      systemQuantity: record.systemStock?.quantity ?? 0,
      storefrontReservedQuantity: record.storefrontReservedQuantity ?? 0,
      systemReservedQuantity: record.systemReservedQuantity ?? 0
    };
    setEditingProduct(mappedData);

    // Set up imageList with existing product images
    if (record.images && record.images.length > 0) {
      const existingImages = record.images.map((img, index) => {
        const imageUrl = img.image.startsWith('data:')
          ? img.image
          : `${import.meta.env.VITE_GRAPHQL_URI.replace('/graphql/', '').replace('/graphql', '')}/media/${img.image}`;
        return {
          uid: `-${index}`,
          id: img.id,
          name: img.image || `image-${index}.png`,
          status: 'done',
          url: imageUrl,
        };
      });
      setImageList(existingImages);
    } else {
      setImageList([]);
    }

    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const deleted = await deleteProduct(id);
      if (deleted) {
        await loadProducts(null, true);
      }
    } catch {
      message.error('Failed to delete product');
    }
  };

  const handleCreateCategory = async (values) => {
    try {
      let imageBase64 = null;

      if (values.image) {
        const file = values.image;

        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });
      }

      const payload = {
        name: values.name,
        description: values.description,
        isActive: values.isActive,
        parentId:
          values.parentId !== undefined &&
            values.parentId !== null &&
            values.parentId !== ''
            ? Number(values.parentId)
            : null,
      };

      if (imageBase64) {
        payload.image = imageBase64;
      }

      const res = await createCategory(payload);

      if (res.success) {
        return res;
      }

      message.error(
        res.message || 'Failed to create category'
      );

      return null;
    } catch (error) {
      //console.error(error);
      message.error('Something went wrong');
      return null;
    }
  };

  const visibleProducts = products.filter(product => {
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && product.isActive === true) ||
      (statusFilter === 'inactive' && product.isActive === false);
    return matchesStatus;
  });

  const getStatusColor = (isActive) => {
    return isActive ? 'green' : 'red';
  };

  const skeletonRows = Array.from({ length: 6 }).map((_, index) => ({
    id: `skeleton-${index}`,
    isSkeleton: true,
  }));

  const columns = [
    {
      title: <span>Product</span>,
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {

        // Skeleton UI
        if (record.isSkeleton) {
          return (
            <Space align="start">
              <Skeleton.Image
                active
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 8
                }}
              />

              <div>
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 140 }}
                />

                <div style={{ marginTop: 8 }}>
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: 100 }}
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: 80 }}
                  />
                </div>
              </div>
            </Space>
          );
        }

        // Find the first valid image
        const validImage = record.images && record.images.length > 0
          ? record.images.find(img => img.image && img.image.trim() !== '')
          : null;

        // Construct full URL for image paths
        const imageSrc = validImage
          ? (
            validImage.image.startsWith('data:')
              ? validImage.image
              : `${import.meta.env.VITE_GRAPHQL_URI.replace('/graphql/', '').replace('/graphql', '')}/media/${validImage.image}`
          )
          : undefined;

        const handleImageClick = () => {
          if (imageSrc) {
            setSelectedImage(imageSrc);
            setImageModalVisible(true);
          }
        };

        return (
          <Space align="start">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={text}
                onClick={handleImageClick}
                onError={(e) => { e.target.style.display = 'none'; }}
                style={{
                  width: 60,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: '1px solid #f0f0f0'
                }}
                title="Click to view full image"
              />
            ) : (
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 8,
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: 12
                }}
              >
                No Image
              </div>
            )}

            <div>
              <div style={{ fontWeight: 500 }}>
                {text}

                {record.isFeatured && (
                  <Tag
                    color="gold"
                    size="small"
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      lineHeight: '14px'
                    }}
                  >
                    FEATURED
                  </Tag>
                )}
              </div>

              <div style={{ fontSize: 12, color: '#666' }}>
                SKU: {record.sku}
              </div>

              {record.measureValue && record.unit && (
                <div style={{ fontSize: 12, color: '#888' }}>
                  Quantity: {record.measureValue} {record.unit}
                </div>
              )}

              {record.images && record.images.length > 0 && (
                <div style={{ fontSize: 12, color: '#1890ff' }}>
                  {record.images.length} image(s)
                </div>
              )}
            </div>
          </Space>
        );
      },
    },

    {
      title: <span>Category</span>,
      dataIndex: 'category',
      key: 'category',
      render: (category, record) => {

        if (record.isSkeleton) {
          return (
            <Skeleton.Input
              active
              size="small"
              style={{ width: 100 }}
            />
          );
        }

        return (
          <span>
            {category ? category.name : 'N/A'}
          </span>
        );
      }
    },

    {
      title: <span>Price</span>,
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => {

        if (record.isSkeleton) {
          return (
            <div>
              <Skeleton.Input
                active
                size="small"
                style={{ width: 100 }}
              />

              <div style={{ marginTop: 8 }}>
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 70 }}
                />
              </div>
            </div>
          );
        }

        const p = Number(price);
        const dp = Number(record.discountPrice);

        const hasDiscount = record.discountPrice && dp < p;
        const invalidDiscount = record.discountPrice && dp >= p;

        return (
          <div>
            {hasDiscount && (
              <div>
                ₹{dp.toLocaleString('en-IN')}{' '}
                <span className="text-muted">
                  (Save ₹{(p - dp).toFixed(2)})
                </span>
              </div>
            )}

            <div
              style={{
                textDecoration: hasDiscount ? 'line-through' : 'none'
              }}
            >
              ₹{p.toLocaleString('en-IN')}
            </div>

            {invalidDiscount && (
              <div style={{ color: '#fa8c16', fontSize: 11 }}>
                ⚠️ Discount price must be lower than regular price
              </div>
            )}
          </div>
        );
      },
    },

    {
      title: <span>Store front Stock</span>,
      dataIndex: 'storefrontStock',
      key: 'storefrontStock',
      render: (stockObj, record) => {

        if (record.isSkeleton) {
          return (
            <Skeleton.Button
              active
              size="small"
              style={{ width: 70 }}
            />
          );
        }

        const qty = stockObj?.quantity || 0;

        return (
          <Tag
            color={qty === 0 ? 'red' : qty < 10 ? 'orange' : 'green'}
          >
            {qty} units
          </Tag>
        );
      },
    },
    // System Stock column
    {
      title: <span>System Stock</span>,
      dataIndex: 'systemStock',
      key: 'systemStock',
      render: (stockObj, record) => {
        if (record.isSkeleton) {
          return (
            <Skeleton.Button
              active
              size="small"
              style={{ width: 70 }}
            />
          );
        }
        const qty = stockObj?.quantity || 0;
        return (
          <Tag color={qty === 0 ? 'red' : qty < 10 ? 'orange' : 'green'}>
            {qty} units
          </Tag>
        );
      },
    },
    // Reserved Quantities column
    {
      title: <span>Reserved</span>,
      dataIndex: 'reserved',
      key: 'reserved',
      render: (_, record) => {
        if (record.isSkeleton) {
          return (
            <Skeleton.Button
              active
              size="small"
              style={{ width: 70 }}
            />
          );
        }
        const storefrontRes = record.storefrontReservedQuantity ?? 0;
        const systemRes = record.systemReservedQuantity ?? 0;
        return (
          <span>Storefront: {storefrontRes}, System: {systemRes}</span>
        );
      },
    },

    {
      title: <span>Status</span>,
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive, record) => {

        if (record.isSkeleton) {
          return (
            <Skeleton.Button
              active
              size="small"
              style={{ width: 80 }}
            />
          );
        }

        return (
          <Tag color={getStatusColor(isActive)}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </Tag>
        );
      },
    },

    {
      title: <span>Actions</span>,
      key: 'actions',
      render: (_, record) => {

        // Skeleton UI
        if (record.isSkeleton) {
          return (
            <Space size="small">
              <Skeleton.Button active size="small" shape="circle" />
              <Skeleton.Button active size="small" shape="circle" />
              <Skeleton.Button active size="small" shape="circle" />
            </Space>
          );
        }

        // Nothing to show if the user can neither view nor manage products
        if (!canViewProducts && !canManageProducts) {
          return null;
        }

        return (
          <Space size="small">
            {(canViewProducts || canManageProducts) && (
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() =>
                  navigate(`/products/${record.id}`, {
                    state: { product: record }
                  })
                }
              />
            )}

            {canManageProducts && (
              <>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />

                <Popconfirm
                  title="Delete Product"
                  description="Are you sure you want to delete this product?"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Title level={4} style={{ marginBottom: 20 }}>Products Management</Title>


      <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', }} >
          <Search
            size="small"
            className="small-search"
            placeholder="Search products..."
            allowClear onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Select
            size="small"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 130 }}
          > <Option value="all">All</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
          <Select
            size="small"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 140 }}
            popupMatchSelectWidth={false}
            styles={{ popup: { root: { width: 140 }, }, }}
          >
            <Option value="all"> Categories </Option>
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}
              >
                {cat.name}
              </Option>))}
          </Select>
        </div>
        {/* RIGHT SIDE BUTTON */}
        {canManageProducts && (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Product
          </Button>)}
      </div>

      <Card style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div
          ref={tableContainerRef}
          style={{
            flex: 1,
            minHeight: 0,
          }}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={loading ? skeletonRows : products}
            size="small"
            pagination={false}
            scroll={{ x: 'max-content', y: 'calc(100vh - 320px)' }}
            locale={{ emptyText: loading ? '' : 'No products found' }}
          />
          {!hasMore && products.length > 0 && !loading && !fetchingMore && (
            <div style={{ textAlign: "center", padding: "10px", color: '#999', fontSize: '12px', borderTop: '1px solid #f0f0f0' }}>
              No more products to load
            </div>
          )}
          {/* {!hasMore && visibleProducts.length > 0 && !loading && !fetchingMore && (
            <div style={{ textAlign: "center", padding: "10px", color: '#999', fontSize: '12px', borderTop: '1px solid #f0f0f0' }}>
              No more products to load
            </div>
          )} */}
        </div>
      </Card>

      {/* Add/Edit Product Modal */}
      {canManageProducts && (
        <ProductModal
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onSubmit={async (
            productData,
            imageData
          ) => {

            const payload = {

              ...productData,

              price: Number(
                productData.price
              ),

              discountPrice:
                productData.discountPrice
                  ? Number(
                    productData.discountPrice
                  )
                  : null,
            };

            if (editingProduct) {

              // EDIT PRODUCT

              const updated =
                await updateProduct(
                  editingProduct.id,
                  payload
                );

              if (updated) {

                await loadProducts(
                  null,
                  true
                );
              }

            } else {

              // CREATE PRODUCT

              const created =
                await createProduct(payload);

              if (created?.id) {

                // UPLOAD IMAGES

                if (
                  imageData?.length > 0
                ) {

                  for (const image of imageData) {

                    await addProductImage(
                      created.id,
                      image
                    );
                  }
                }

                await loadProducts(
                  null,
                  true
                );
              }
            }

            setIsModalVisible(false);
          }}
          initialValues={editingProduct}
          categories={categories}
          loading={actionLoading}
          imageList={imageList}
          setImageList={setImageList}
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          onDeleteImage={deleteProductImage}
          onAddImage={addProductImage}

          onCreateCategory={handleCreateCategory}
          onRefreshCategories={fetchCategories}
        />
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={imageModalVisible}
        imageSrc={selectedImage}
        onClose={handleImageModalClose}
      />

    </div>
  );
};

export default AllProducts;