import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Popconfirm, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '../api/categories';
import CategoryModal from '../components/modals/CategoryModal';
import usePermissions from '../hooks/usePermissions';
// Helper function to convert File to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
const { Search } = Input;
const { Title, Text } = Typography;


const Categories = () => {
  const { canUpdate } = usePermissions();
  const canManageCategories = canUpdate('category');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [imageList, setImageList] = useState([]);
  const tableContainerRef = useRef(null);


  useEffect(() => {
    const timer = setTimeout(() => {
      loadCategories(null, true);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const tableBody =
      tableContainerRef.current?.querySelector('.ant-table-body');

    if (tableBody) {
      const handleScroll = (e) => {
        const {
          scrollTop,
          scrollHeight,
          clientHeight
        } = e.target;

        if (
          scrollHeight - scrollTop <= clientHeight + 50
        ) {
          if (
            hasMore &&
            !loading &&
            !fetchingMore
          ) {
            loadCategories(nextCursor, false);
          }
        }
      };

      tableBody.addEventListener('scroll', handleScroll);

      return () =>
        tableBody.removeEventListener(
          'scroll',
          handleScroll
        );
    }
  }, [hasMore, loading, fetchingMore, nextCursor]);

  const loadCategories = async (
    cursor = null,
    isNewSearch = false
  ) => {
    try {
      if (isNewSearch) {
        setLoading(true);
      } else {
        setFetchingMore(true);
      }

      const res = await getAllCategories({
        query: searchText || null,
        first: 8,
        after: cursor,
      });

      if (res.success) {
        setCategories((prev) => {
          const nextData = res.categories || [];

          return isNewSearch
            ? nextData
            : [...prev, ...nextData];
        });

        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } else {
        message.error(res.message || "Failed to load categories");
      }
    } catch {
      message.error("Something went wrong");
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  const handleSubmit = async (values) => {
    if (!canManageCategories) return;

    try {
      setLoading(true);

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

      // Determine image state: new upload, explicit removal, or unchanged
      if (imageList[0]?.originFileObj) {
        // User picked a new file
        payload.image = await fileToBase64(imageList[0].originFileObj);
      } else if (imageList.length === 0 && editingCategory?.image) {
        // User removed a previously-existing image
        payload.image = null;
      }
      // else: no `image` key at all -> backend leaves the existing image untouched

      let res;

      if (editingCategory) {
        res = await updateCategory(editingCategory.id, payload);
      } else {
        res = await createCategory(payload);
      }

      if (res.success) {
        message.success("Categories updated Successfully");
        setIsModalVisible(false);
        form.resetFields();
        setImageList([]);
        loadCategories(null, true);
      } else {
        message.error(res.message || "Failed to Update Category");
      }
    } catch {
      message.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    if (!canManageCategories) return;

    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive !== false,
      parentId: category.parent?.id
    });

    setImageList(
      category.image
        ? [
          {
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: `${import.meta.env.VITE_GRAPHQL_URI.replace('/graphql/', '').replace('/graphql', '')}/media/${category.image}`
          }
        ]
        : []
    );
    setIsModalVisible(true);
  };
  const handleDelete = async (id) => {
    if (!canManageCategories) return;

    try {
      const res = await deleteCategory(id);
      if (res.success) {
        message.success("Deleted");
        loadCategories(null, true);
      }
      else {
        message.error(res.message);
      }
    }
    catch {
      message.error("Something went wrong");
    }
    finally {
      setLoading(false);
    }
  };

  const getParentCategories = () => {
    return categories.filter(c => !c.parent);
  };
  const skeletonRows = Array.from({ length: 11 }).map((_, index) => ({
    id: `skeleton-${index}`,
    isSkeleton: true,
  }));

  const columns = [

    {
      title: <span>Category</span>,
      key: "category",

      render: (_, record) => {

        // Skeleton
        if (record.isSkeleton) {
          return (
            <Space align="start">

              <Skeleton.Image
                active
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6
                }}
              />

              <div>
                <Skeleton.Input
                  active
                  size="small"
                  style={{
                    width: 120,
                    height: 18,
                    borderRadius: 6
                  }}
                />
              </div>

            </Space>
          );
        }

        const categoryName = record.parent
          ? record.parent.name
          : record.name;

        const imageUrl =
          record.parent?.image || record.image;

        const fullImageUrl = imageUrl
          ? `${import.meta.env.VITE_GRAPHQL_URI.replace('/graphql/', '').replace('/graphql', '')}/media/${imageUrl}`
          : null;

        return (
          <Space align="start">

            {fullImageUrl ? (

              <img
                src={fullImageUrl}
                alt={categoryName}
                style={{
                  width: 40,
                  height: 40,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: '1px solid #f0f0f0'
                }}
              />

            ) : (

              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: 10
                }}
              >
                No Img
              </div>
            )}

            <span>{categoryName}</span>

          </Space>
        );
      },
    },

    {
      title: <span>Sub Category</span>,
      key: "subCategory",

      render: (_, record) => {

        if (record.isSkeleton) {
          return (
            <Skeleton.Input
              active
              size="small"
              style={{
                width: 100,
                height: 18,
                borderRadius: 6
              }}
            />
          );
        }

        if (!canManageCategories) return null;

        return (
          <span>
            {record.parent ? record.name : "-"}
          </span>
        );
      },
    },

    {
      title: <span>Description</span>,
      dataIndex: "description",
      key: "description",

      render: (text, record) => {

        if (record.isSkeleton) {
          return (
            <Skeleton.Input
              active
              size="small"
              style={{
                width: '80%',
                minWidth: 120,
                maxWidth: 220,
                height: 18,
                borderRadius: 6
              }}
            />
          );
        }

        return (
          <span>
            {text || "-"}
          </span>
        );
      },
    },

    {
      title: <span>Status</span>,
      dataIndex: "isActive",
      key: "isActive",

      render: (isActive, record) => {

        if (record.isSkeleton) {
          return (
            <Skeleton.Button
              active
              size="small"
              style={{
                width: 80,
                height: 24,
                borderRadius: 20
              }}
            />
          );
        }

        return (
          <Tag color={isActive !== false ? "green" : "red"}>
            {isActive !== false ? "ACTIVE" : "INACTIVE"}
          </Tag>
        );
      },
    },

    {
      title: <span>Actions</span>,
      key: "actions",

      render: (_, record) => {

        if (record.isSkeleton) {
          return (
            <Space size="small">
              <Skeleton.Button active size="small" shape="circle" />
              <Skeleton.Button active size="small" shape="circle" />
            </Space>
          );
        }

        if (!canManageCategories) {
          return null;
        }

        return (
          <Space size="small">
            <Button
              size='small'
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />

            <Popconfirm
              title="Delete Category"
              description="Are you sure you want to delete this category?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                size='small'
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Title level={4} style={{ marginBottom: 20 }}>Categories Management</Title>
      <div className="categories-toolbar" >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <Search
            placeholder="Search categories..."
            size="small"
            className="small-search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: 250,
              maxWidth: "100%",
            }}
          />

          {canManageCategories && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingCategory(null);
                form.resetFields();
                setImageList([]);
                setIsModalVisible(true);
              }}
            >
              Add Category
            </Button>
          )}
        </div>

      </div>

      <Card style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div ref={tableContainerRef} style={{ flex: 1, overflow: "hidden" }}>
          <Table
            columns={columns}
            dataSource={loading ? skeletonRows : categories}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 'calc(100vh - 320px)' }}
          />

          {!hasMore &&
            categories.length > 0 &&
            !loading &&
            !fetchingMore && (
              <div
                style={{
                  textAlign: "center",
                  padding: "10px",
                  color: "#999",
                  fontSize: "12px",
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                No more categories to load
              </div>
            )}
        </div>
      </Card>
      {canManageCategories && (
        <CategoryModal
          form={form}
          open={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSubmit={handleSubmit}
          editingCategory={editingCategory}
          parentCategories={getParentCategories()}
          imageList={imageList}
          setImageList={setImageList}
          loading={loading}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
        />
      )}
    </div>
  );
};

export default Categories;

