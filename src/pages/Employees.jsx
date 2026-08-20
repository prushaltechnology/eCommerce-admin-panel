import { Button, Card, Input, message, Select, Typography } from 'antd';
import { useState } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import usePermissions from '../hooks/usePermissions';
import AddEmployeeModal from './employees/AddEmployeeModal';
import EmployeeTable from './employees/EmployeeTable';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const Employees = () => {
  const { isAdmin } = usePermissions();
  const { canUpdate } = usePermissions();
  const canManageEmployees = canUpdate('employee');

  const {
    filteredEmployees,
    loading,
    fetchingMore,
    hasMore,
    nextCursor,
    skeletonRows,
    searchText,
    setSearchText,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    loadEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
  } = useEmployees();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const handleAddSubmit = async (values) => {
    if (!canManageEmployees) return;
    setAddLoading(true);
    try {
      await createEmployee(values);
      setIsAddModalOpen(false);
    } catch (error) {
      message.error('Failed to create employee: ' + error.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (record) => {
    if (!canManageEmployees) return;
    try {
      await deleteEmployee(record);
    } catch (error) {
      message.error('Failed to delete employee: ' + error.message);
    }
  };

  const handleToggleStatus = async (record) => {
    if (!canManageEmployees) return;
    try {
      await toggleEmployeeStatus(record);
    } catch (error) {
      message.error('Failed to update employee status: ' + error.message);
    }
  };

  const handleUpdate = async (values) => {
    if (!canManageEmployees) return;
    try {
      await updateEmployee(values);
    } catch (error) {
      message.error('Failed to update employee: ' + error.message);
      throw error;
    }
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Employee Management
        </Title>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Search
            size="small"
            className="small-search"
            placeholder="Search employees..."
            allowClear
            style={{ width: 260 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <Select
            size="small"
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 180 }}
          >
            <Option value="all">All Roles</Option>
            <Option value="admin">Admin</Option>
            <Option value="manager">Manager</Option>
            <Option value="sales">Sales</Option>
            <Option value="hr">HR</Option>
            <Option value="support">Support</Option>
            <Option value="operations">Operations</Option>
          </Select>

          <Select
            size="small"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
          >
            <Option value="all">All Status</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </div>

        {canManageEmployees  && (
          <Button
            type="primary"
            size="small"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Employee
          </Button>
        )}
      </div>

      <Card
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
        bodyStyle={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          padding: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            minHeight: 0,
            padding: 16,
          }}
        >
          <EmployeeTable
            employees={filteredEmployees}
            loading={loading}
            fetchingMore={fetchingMore}
            hasMore={hasMore}
            nextCursor={nextCursor}
            skeletonRows={skeletonRows}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onLoadMore={(cursor) => loadEmployees(cursor, true)}
            canManageEmployees={canManageEmployees}
          />
        </div>
      </Card>

      {isAdmin && (
        <AddEmployeeModal
          open={isAddModalOpen}
          loading={addLoading}
          onCancel={() => setIsAddModalOpen(false)}
          onSubmit={handleAddSubmit}
        />
      )}
    </div>
  );
};

export default Employees;