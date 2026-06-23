import { Col, Form, Input, Modal, Row, Switch } from 'antd';
import { useEffect } from 'react';

const EditEmployeeModal = ({
    open,
    onCancel,
    onSubmit,
    employee,
    loading,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (employee && open) {
            form.setFieldsValue({
                firstName: employee.firstName,
                lastName: employee.lastName,
                phone: employee.phone,
                roleName: employee.roleName,
                isActive: employee.isActive,
            });
        }
    }, [employee, open, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            await onSubmit({ id: employee.id, ...values });
            form.resetFields();
        } catch (_) {
            // validation error
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title={`Edit Employee — ${employee?.name || ''}`}
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            okText="Save Changes"
            confirmLoading={loading}
            width={700}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                size="small"
                style={{ marginTop: 8 }}
            >
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="firstName"
                            label="First Name"
                            rules={[
                                {
                                    required: true,
                                    message: 'First name is required',
                                },
                            ]}
                        >
                            <Input placeholder="Enter first name" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            name="lastName"
                            label="Last Name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Last name is required',
                                },
                            ]}
                        >
                            <Input placeholder="Enter last name" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            name="phone"
                            label="Phone"
                            rules={[
                                {
                                    required: true,
                                    message: 'Phone is required',
                                },
                                {
                                    pattern: /^[0-9]{10}$/,
                                    message: 'Phone number must be exactly 10 digits',
                                },
                            ]}
                        >
                            <Input
                                placeholder="9876543210"
                                maxLength={10}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="roleName"
                            label="Role"
                            rules={[
                                {
                                    required: true,
                                    message: 'Role is required',
                                },
                            ]}
                        >
                            <Input placeholder="Enter role" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="isActive"
                    label="Status"
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditEmployeeModal;   