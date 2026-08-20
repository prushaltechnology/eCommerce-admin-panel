import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Input, message, Typography } from 'antd';
import { useState } from 'react';
import AddCustomerModal from '../components/modals/AddCustomerModal';
import { useCustomers } from '../hooks/useCustomers';
import usePermissions from '../hooks/usePermissions';
import CustomerDetailsModal from './customers/CustomerDetailsModal';
import CustomerTable from './customers/CustomerTable';
import EditCustomerModal from './customers/EditCustomerModal';

const { Search } = Input;
const { Title } = Typography;

const Customers = () => {
  const { canUpdate } = usePermissions();
  const canManageCustomers = canUpdate('customer'); // confirm module name with backend

  const {
    customers,
    loading,
    fetchingMore,
    nextCursor,
    hasMore,
    searchText,
    setSearchText,
    skeletonRows,
    loadCustomers,
    deleteCustomer,
    updateCustomer,
    toggleCustomerStatus,
  } = useCustomers();

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setDetailsModalOpen(true);
  };

  const handleEdit = (customer) => {
    if (!canManageCustomers) return;
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (values) => {
    if (!canManageCustomers) return;
    try {
      await updateCustomer(editingCustomer.id, values);
      await loadCustomers(null, true);
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      message.success('Customer updated successfully');
    } catch (error) {
      message.error('Error updating customer: ' + error.message);
    }
  };

  const handleAddSuccess = () => {
    loadCustomers(null, true);
  };

  const handleToggleStatus = async (customer) => {
    if (!canManageCustomers) return;
    try {
      await toggleCustomerStatus(customer);
      await loadCustomers(null, true);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!canManageCustomers) return;
    try {
      await deleteCustomer(id);
      await loadCustomers(null, true);
    } catch (error) {
      message.error(error.message || 'Failed to delete customer');
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Title level={4} style={{ marginBottom: 20 }}>
        Customers Management
      </Title>

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
        <Search
          size="small"
          className="small-search"
          placeholder="Search customers by name or email..."
          allowClear
          style={{ width: 250 }}
          onChange={(e) => setSearchText(e.target.value)}
          value={searchText}
        />
        {canManageCustomers && (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Customer
          </Button>
        )}
      </div>

      <Card
        style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0, }}
        bodyStyle={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0, padding: 0, }}
      >
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            minHeight: 0,
            padding: 16,
          }}
        >
          <CustomerTable
            customers={customers}
            loading={loading}
            fetchingMore={fetchingMore}
            hasMore={hasMore}
            nextCursor={nextCursor}
            skeletonRows={skeletonRows}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLoadMore={(cursor) =>
              loadCustomers(cursor, false)
            }
            onView={handleViewCustomer}
            onToggleStatus={handleToggleStatus}
            canManageCustomers={canManageCustomers}
          />

          <CustomerDetailsModal
            open={detailsModalOpen}
            customer={selectedCustomer}
            onClose={() => {
              setDetailsModalOpen(false);
              setSelectedCustomer(null);
            }}
          />
        </div>
      </Card >

      {canManageCustomers && (
        <EditCustomerModal
          open={isEditModalOpen}
          customer={editingCustomer}
          onCancel={() => {
            setIsEditModalOpen(false);
            setEditingCustomer(null);
          }}
          onSubmit={handleEditSubmit}
        />
      )}

      {canManageCustomers && (
        <AddCustomerModal
          open={isAddModalOpen}
          onCancel={() => setIsAddModalOpen(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div >
  );
};

export default Customers;