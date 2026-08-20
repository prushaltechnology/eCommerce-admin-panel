import {
    DeleteOutlined,
    EditOutlined,
    LockOutlined
} from '@ant-design/icons';
import {
    Button,
    Popconfirm,
    Skeleton,
    Space,
    Switch,
    Table,
    Tag,
    Typography
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import EditEmployeeModal from './EditEmployeeModal';
import EmployeePermissionsModal from './EmployeePermissionsModal';

const { Text } = Typography;

const roleColors = {
    admin: 'purple',
    manager: 'blue',
    sales: 'cyan',
    hr: 'orange',
    support: 'geekblue',
    operations: 'volcano',
    Employee: 'green',
    employee: 'green',
    test: 'pink',
};

const getRoleColor = (role) => roleColors[role?.toLowerCase()] || 'default';

const EmployeeTable = ({
    employees,
    loading,
    fetchingMore,
    hasMore,
    nextCursor,
    skeletonRows,
    onToggleStatus,
    onDelete,
    onUpdate,
    onLoadMore,
    canManageEmployees,
}) => {
    const [editEmployee, setEditEmployee] = useState(null);
    const [permEmployee, setPermEmployee] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const tableContainerRef = useRef(null);

    useEffect(() => {
        const tableBody =
            tableContainerRef.current?.querySelector('.ant-table-body');

        if (!tableBody) return;

        const handleScroll = (e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;

            if (
                scrollHeight - scrollTop <= clientHeight + 50 &&
                hasMore &&
                nextCursor &&
                !loading &&
                !fetchingMore
            ) {
                onLoadMore(nextCursor);
            }
        };

        tableBody.addEventListener('scroll', handleScroll);

        return () =>
            tableBody.removeEventListener('scroll', handleScroll);
    }, [
        hasMore,
        nextCursor,
        loading,
        fetchingMore,
        onLoadMore,
    ]);

    const handleEditSubmit = async (values) => {
        setEditLoading(true);
        try {
            await onUpdate(values);
            setEditEmployee(null);
        } catch (_) {
            // error shown in hook
        } finally {
            setEditLoading(false);
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'employeeId',
            key: 'employeeId',
            width: 80,
            render: (id, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input
                        active
                        size="small"
                        style={{
                            width: 40,
                            height: 18,
                            borderRadius: 6,
                        }}
                    />
                ) : (
                    id
                ),
        },
        {
            title: 'Employee',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input
                        active
                        size="small"
                        style={{
                            width: 140,
                            height: 18,
                            borderRadius: 6,
                        }}
                    />
                ) : (
                    <div style={{ fontWeight: 500 }}>
                        {text}
                    </div>
                ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input
                        active
                        size="small"
                        style={{
                            width: 110,
                            height: 18,
                            borderRadius: 6,
                        }}
                    />
                ) : (
                    <span
                        style={{
                            color: phone ? '#1890ff' : '#999',
                        }}
                    >
                        {phone || 'N/A'}
                    </span>
                ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input
                        active
                        size="small"
                        style={{
                            width: 180,
                            height: 18,
                            borderRadius: 6,
                        }}
                    />
                ) : (
                    <span
                        style={{
                            color:
                                email === 'N/A'
                                    ? '#999'
                                    : '#1890ff',
                        }}
                    >
                        {email}
                    </span>
                ),
        },
        {
            title: 'Role',
            dataIndex: 'roleName',
            key: 'roleName',
            width: 120,
            render: (role, record) =>
                record.isSkeleton ? (
                    <Skeleton.Input
                        active
                        size="small"
                        style={{
                            width: 80,
                            height: 18,
                            borderRadius: 6,
                        }}
                    />
                ) : (
                    <Tag color={getRoleColor(role)}>
                        {role || 'Employee'}
                    </Tag>
                ),
        },
                {
            title: 'Status',
            key: 'status',
            width: 90,
            render: (_, record) =>
                record.isSkeleton ? null : (
                    <Switch
                        size="small"
                        checked={record.isActive}
                        disabled={!canManageEmployees}
                        onChange={() => onToggleStatus(record)}
                    />
                ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => {
                if (record.isSkeleton) {
                    return (
                        <Space size="small">
                            <Skeleton.Button active size="small" shape="circle" />
                            <Skeleton.Button active size="small" shape="circle" />
                        </Space>
                    );
                }

                if (!canManageEmployees) return null;

                return (
                    <Space size="small">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => setEditEmployee(record)}
                        />

                        <Button
                            size="small"
                            icon={<LockOutlined />}
                            onClick={() => setPermEmployee(record)}
                        />

                        <Popconfirm
                            title="Delete Employee"
                            description="Are you sure you want to delete this employee?"
                            onConfirm={() => onDelete(record)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    const dataSource = loading ? skeletonRows : employees;

    return (
        <>
            <div
                ref={tableContainerRef}
                style={{
                    height: '100%',
                    minHeight: 0,
                }}
            >
                <Table
                    size="small"
                    dataSource={dataSource}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    scroll={{
                        x: 'max-content',
                        y: 'calc(100vh - 300px)',
                    }}
                    style={{ borderRadius: 8, overflow: 'hidden' }}
                    summary={() => {


                        return !hasMore &&
                            employees.length > 0 &&
                            !loading &&
                            !fetchingMore ? (
                            <Table.Summary.Row>
                                <Table.Summary.Cell
                                    index={0}
                                    colSpan={columns.length}
                                >
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            padding: '8px 0',
                                            color: '#999',
                                            fontSize: 12,
                                        }}
                                    >
                                        No more employees to load
                                    </div>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        ) : null;
                    }}
                />
            </div>
            {fetchingMore && (
                <div
                    style={{
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton.Input
                            key={i}
                            active
                            size="small"
                            style={{
                                width: '98%',
                                height: 32,
                                borderRadius: 6,
                            }}
                        />
                    ))}
                </div>
            )}


            {/* Edit Modal */}
            <EditEmployeeModal
                open={!!editEmployee}
                employee={editEmployee}
                loading={editLoading}
                onCancel={() => setEditEmployee(null)}
                onSubmit={handleEditSubmit}
            />

            {/* Permissions Modal */}
            <EmployeePermissionsModal
                open={!!permEmployee}
                employee={permEmployee}
                onCancel={() => setPermEmployee(null)}
            />
        </>
    );
};

export default EmployeeTable;