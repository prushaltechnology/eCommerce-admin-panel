import { LockOutlined } from '@ant-design/icons';
import { Modal, Select, Skeleton, Space, Table, Tag, Typography } from 'antd';
import {
    ACCESS_LEVELS,
    ALL_PERMISSION_ROWS,
    useEmployeePermissions,
} from '../../hooks/useEmployeePermissions';

const { Text } = Typography;
const { Option } = Select;

const AccessSelect = ({ current, disabled, onChange }) => (
    <Select
        size="small"
        value={current}
        style={{ width: 140 }}
        disabled={disabled}
        onChange={onChange}
    >
        {ACCESS_LEVELS.map((lvl) => (
            <Option key={lvl.value} value={lvl.value}>
                <Space size={4}>
                    <Tag color={lvl.color} style={{ margin: 0 }}>{lvl.label}</Tag>
                </Space>
            </Option>
        ))}
    </Select>
);

const EmployeePermissionsModal = ({ open, onCancel, employee }) => {
    const {
        loading,
        saving,
        getPermissionForRow,
        handleAccessChange,
    } = useEmployeePermissions(open ? Number(employee?.id) : null);

    const columns = [
        {
            title: 'Module',
            dataIndex: 'label',
            key: 'module',
            render: (label, row) => (
                <Text strong={!row.subModule}>{label}</Text>
            ),
        },
        {
            title: 'Access Level',
            key: 'access',
            width: 160,
            render: (_, row) => {
                const perm = getPermissionForRow(row.key, row.subModule);
                const current = perm?.access || 'no_access';
                return (
                    <AccessSelect
                        current={current}
                        disabled={saving}
                        onChange={(val) => handleAccessChange(row.key, row.subModule, val)}
                    />
                );
            },
        },
    ];

    // Group order rows under a visual section header
    const dataSource = ALL_PERMISSION_ROWS.map((row) => ({
        ...row,
        // rowKey is already set in ALL_PERMISSION_ROWS
    }));

    return (
        <Modal
            title={
                <Space>
                    <LockOutlined />
                    <span>Permissions — {employee?.name || ''}</span>
                </Space>
            }
            open={open}
            onCancel={onCancel}
            footer={null}
            width={560}
            destroyOnHidden
        >
            {loading ? (
                <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
                <Table
                    size="small"
                    dataSource={dataSource}
                    columns={columns}
                    rowKey="rowKey"
                    pagination={false}
                    style={{ marginTop: 8 }}
                    rowClassName={(row) =>
                        row.subModule ? 'permission-row-submodule' : ''
                    }
                    // Visual section break before the first order row.
                    // rowKey for order rows is built as `order__${subModule}`,
                    // and the first ORDER_SUBMODULES entry has
                    // subModule: "order_dashboard" — so the real first key
                    // is "order__order_dashboard", not "order__system".
                    onRow={(row) => {
                        const isFirstOrderRow = row.rowKey === 'order__order_dashboard';
                        return {
                            style: isFirstOrderRow
                                ? { borderTop: '2px solid #f0f0f0' }
                                : {},
                        };
                    }}
                />
            )}

            <style>{`
        .permission-row-submodule td:first-child {
          padding-left: 24px !important;
          color: #595959;
        }
      `}</style>
        </Modal>
    );
};

export default EmployeePermissionsModal;