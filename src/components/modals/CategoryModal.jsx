
import { PlusOutlined } from "@ant-design/icons";
import {
    Button, Col, Form, Input, Modal, Radio, Row, Select, Space, Switch, Typography, Upload,
} from "antd";
import { useEffect, useState } from "react";

const { Text } = Typography;

export default function CategoryModal({
    open,
    onClose,
    onSubmit,
    editingCategory,
    parentCategories,
    imageList,
    setImageList,
    loading,
    form,
}) {

    const [categoryType, setCategoryType] =
        useState("main");

    useEffect(() => {

        if (open) {
            if (editingCategory) {
                const isSubCategory =
                    !!editingCategory.parent?.id;
                setCategoryType(
                    isSubCategory
                        ? "sub"
                        : "main"
                );
                form.setFieldsValue({
                    name:
                        editingCategory?.name || "",
                    description:
                        editingCategory?.description || "",
                    parentId:
                        editingCategory?.parent?.id
                            ? Number(
                                editingCategory.parent.id
                            )
                            : undefined,
                    isActive:
                        editingCategory?.isActive !== false,
                });
            } else {
                setCategoryType("main");
                form.resetFields();
            }
        }
    }, [
        open,
        editingCategory,
        form,
    ]);
    return (
        <Modal
            title={
                <span>
                    {editingCategory
                        ? "Edit Category"
                        : "Add Category"}
                </span>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            width={500}
        >

            <Form
                form={form}
                layout="vertical"
                onFinish={(values) => {
                    onSubmit(values);
                }}
            >
                {/* CATEGORY TYPE */}
                {!editingCategory && (
                    <Form.Item
                        label="Category Type"
                    >
                        <Radio.Group
                            value={categoryType}
                            onChange={(e) => {
                                setCategoryType(
                                    e.target.value
                                );
                                if (
                                    e.target.value ===
                                    "main"
                                ) {
                                    form.setFieldValue(
                                        "parentId",
                                        undefined
                                    );
                                }
                            }}
                        >
                            <Radio value="main">
                                Main Category
                            </Radio>
                            <Radio value="sub">
                                Sub Category
                            </Radio>
                        </Radio.Group>
                    </Form.Item>
                )}

                <Row gutter={10}>
                    {/* CATEGORY NAME */}
                    <Col
                        span={
                            categoryType === "sub"
                                ? 12
                                : 24
                        }
                    >
                        <Form.Item
                            name="name"
                            label={
                                categoryType === "main"
                                    ? "Category Name"
                                    : "Sub Category Name"
                            }
                            rules={[
                                {
                                    required: true,
                                    message: "Required",
                                },
                            ]}
                            style={{ marginBottom: 12 }}
                        >
                            <Input
                                placeholder={
                                    categoryType === "main"
                                        ? "e.g. Flowers"
                                        : "e.g. Rose Bouquet"
                                }
                            />
                        </Form.Item>
                    </Col>
                    {/* PARENT CATEGORY */}
                    {categoryType === "sub" &&
                        !(
                            editingCategory &&
                            !editingCategory.parent?.id
                        ) && (
                            <Col span={12}>
                                <Form.Item
                                    name="parentId"
                                    label="Main Category"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Please select parent category",
                                        },
                                    ]}
                                    style={{ marginBottom: 6 }}
                                >
                                    <Select
                                        allowClear
                                        placeholder="Select main category"
                                        options={parentCategories.map(
                                            (cat) => ({
                                                label: cat.name,
                                                value: Number(cat.id),
                                            })
                                        )}
                                    />
                                </Form.Item>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: "#888",
                                        display: "block",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    Select the main category
                                    under which this
                                    sub-category will appear.
                                </Text>
                            </Col>
                        )}
                </Row>
                {/* ROW 2 */}
                <Row
                    gutter={10}
                    align="middle"
                >
                    <Col span={12}>
                        <Form.Item
                            name="description"
                            label="Description"
                            style={{ marginBottom: 12 }}
                        >
                            <Input.TextArea
                                rows={2}
                                placeholder="Enter category description"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="isActive"
                            label="Status"
                            valuePropName="checked"
                            initialValue={true}
                            style={{ marginBottom: 12 }}
                        >
                            <Switch
                                checkedChildren="Active"
                                unCheckedChildren="Inactive"
                            />
                        </Form.Item>
                    </Col>
                </Row>
                {/* IMAGE */}
                <Form.Item label="Image">
                    <Upload
                        listType="picture-card"
                        fileList={imageList}
                        beforeUpload={() => false}
                        onChange={(e) =>
                            setImageList(
                                e.fileList.slice(-1)
                            )
                        }
                    >
                        {imageList.length < 1 && (
                            <div>
                                <PlusOutlined />
                                <div>
                                    Upload
                                </div>
                            </div>
                        )}
                    </Upload>
                </Form.Item>
                {/* BUTTONS */}
                <Space>
                    <Button size="small" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        size="small"
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                    >
                        {editingCategory
                            ? "Update"
                            : "Create"}

                    </Button>
                </Space>
            </Form>
        </Modal>
    );
}
