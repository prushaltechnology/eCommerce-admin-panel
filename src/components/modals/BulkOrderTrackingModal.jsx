import {
  Button,
  Input,
  Modal,
  Select,
} from 'antd';

const { Option } = Select;

const BulkOrderTrackingModal = ({
  open,
  order,
  onCancel,

  newStatus,
  setNewStatus,

  adminMessage,
  setAdminMessage,

  onStatusUpdate,
  statusUpdateLoading = false,

  width = 500,
}) => {
  return (
    <Modal
      title={`Bulk Order #${order?.id}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={width}
    >
      <div
        style={{
          padding: 16,
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          background: '#fafafa',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              minWidth: 60,
            }}
          >
            Status
          </span>

          <Select
            value={newStatus}
            onChange={setNewStatus}
            style={{ flex: 1 }}
          >
            <Option value="pending">
              Pending
            </Option>

            <Option value="confirmed">
              Confirmed
            </Option>

            <Option value="cancelled">
              Cancelled
            </Option>
          </Select>
        </div>

        <Input.TextArea
          rows={4}
          placeholder="Enter admin message..."
          value={adminMessage}
          onChange={(e) =>
            setAdminMessage(e.target.value)
          }
          style={{
            marginBottom: 16,
          }}
        />

        <Button
          type="primary"
          loading={statusUpdateLoading}
          onClick={async () => {
            const success = await onStatusUpdate();

            if (success) {
              onCancel();
            }
          }}
        >
          Update Bulk Order
        </Button>
      </div>
    </Modal>
  );
};

export default BulkOrderTrackingModal;