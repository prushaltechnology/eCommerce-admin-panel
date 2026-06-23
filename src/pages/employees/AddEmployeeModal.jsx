import { Col, Form, Input, Modal, Row } from 'antd';

const AddEmployeeModal = ({
    open,
    onCancel,
    onSubmit,
    loading,
}) => {
    const [form] = Form.useForm();

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            await onSubmit(values);
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
            title="Add New Employee"
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            okText="Add Employee"
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
                            <Input placeholder="Alex" />
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
                            <Input placeholder="Johnson" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                {
                                    required: true,
                                    message: 'Email is required',
                                },
                                {
                                    type: 'email',
                                    message: 'Enter a valid email',
                                },
                            ]}
                        >
                            <Input placeholder="emp@company.com" />
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
                            name="employeeRoleName"
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

                    <Col xs={24} md={12}>
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                {
                                    required: true,
                                    message: 'Password is required',
                                },
                                {
                                    min: 6,
                                    message: 'Minimum 6 characters',
                                },
                            ]}
                        >
                            <Input.Password placeholder="Minimum 6 characters" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default AddEmployeeModal;