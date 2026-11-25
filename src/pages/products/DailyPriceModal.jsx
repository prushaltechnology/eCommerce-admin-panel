import { ArrowRightOutlined, DownloadOutlined, FileExcelOutlined, InboxOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Space, Table, Typography, Upload, message } from 'antd';
import { useState } from 'react';
import { downloadDailyPriceSheet, uploadDailyPrices } from '../../api/productExcel';

const { Text } = Typography;
const { Dragger } = Upload;

const FIELD_LABELS = {
  price: 'Price',
  discount_price: 'Discount price',
  storefront_quantity: 'Storefront stock',
  system_quantity: 'System stock',
};

const formatValue = (field, value) => {
  if (value === null || value === undefined) return <Text type="secondary">none</Text>;
  return field === 'price' || field === 'discount_price' ? `₹${value}` : value;
};

const changeColumns = [
  { title: 'Row', dataIndex: 'row', width: 60 },
  { title: 'SKU', dataIndex: 'sku', width: 120 },
  { title: 'Product', dataIndex: 'name' },
  {
    title: 'Changes',
    dataIndex: 'fields',
    render: (fields) => (
      <Space orientation="vertical" size={0}>
        {Object.entries(fields).map(([field, [from, to]]) => (
          <span key={field}>
            <Text type="secondary">{FIELD_LABELS[field] || field}: </Text>
            {formatValue(field, from)} <ArrowRightOutlined style={{ fontSize: 10 }} /> <b>{formatValue(field, to)}</b>
          </span>
        ))}
      </Space>
    ),
  },
];

const errorColumns = [
  { title: 'Row', dataIndex: 'row', width: 60 },
  { title: 'SKU', dataIndex: 'sku', width: 120, render: (v) => v || '—' },
  { title: 'Problem', dataIndex: 'message' },
];

const DailyPriceModal = ({ open, onClose, onUpdated, canUpdate }) => {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const close = () => {
    if (checking || applying) return;
    setFile(null);
    setReport(null);
    onClose();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadDailyPriceSheet();
    } catch (error) {
      message.error(error.message || 'Could not download the sheet');
    } finally {
      setDownloading(false);
    }
  };

  const run = async (dryRun) => {
    const setBusy = dryRun ? setChecking : setApplying;
    setBusy(true);
    try {
      const result = await uploadDailyPrices({ file, dryRun });
      if (dryRun || !result.ok) {
        setReport(result);
        if (!dryRun) message.error('Update stopped. Nothing was saved. See the problems listed.');
        return;
      }
      message.success(`Updated ${result.summary.changed} product(s).`);
      setFile(null);
      setReport(null);
      onUpdated?.();
      onClose();
    } catch (error) {
      message.error(error.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const summary = report?.summary;
  const canApply = report?.ok && !report?.fileError && summary?.changed > 0;

  return (
    <Modal
      title="Daily price update"
      open={open}
      onCancel={close}
      width={900}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={close} disabled={checking || applying}>
          Cancel
        </Button>,
        canUpdate && (
          <Button key="check" onClick={() => run(true)} loading={checking} disabled={!file || applying}>
            Check file
          </Button>
        ),
        canUpdate && (
          <Button key="apply" type="primary" onClick={() => run(false)} loading={applying} disabled={!canApply || checking}>
            {canApply ? `Update ${summary.changed} product(s)` : 'Update'}
          </Button>
        ),
      ]}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          title="Step 1 — download today's sheet"
          description={
            <>
              It lists every product with its category, yesterday's price and current stock.
              Fill the yellow <b>Today's</b> columns. Leave a cell blank to keep it unchanged,
              or type <b>-</b> in Today's Discount Price to remove a discount.
            </>
          }
          action={
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} loading={downloading}>
              Download sheet
            </Button>
          }
        />

        {canUpdate && (
          <>
            <Text strong>Step 2 — upload the filled sheet</Text>
            <Dragger
              accept=".xlsx"
              maxCount={1}
              showUploadList={false}
              beforeUpload={(picked) => {
                setFile(picked);
                setReport(null);
                return false;
              }}
            >
              <p className="ant-upload-drag-icon">{file ? <FileExcelOutlined /> : <InboxOutlined />}</p>
              <p className="ant-upload-text">{file ? file.name : 'Click or drop the filled .xlsx here'}</p>
              <p className="ant-upload-hint">Nothing is saved until you check the changes and click Update.</p>
            </Dragger>
          </>
        )}

        {report?.fileError && <Alert type="error" showIcon title={report.fileError} />}

        {summary && !report.fileError && (
          <>
            {report.ok ? (
              <Alert
                type={summary.changed ? 'success' : 'warning'}
                showIcon
                title={
                  summary.changed
                    ? `${summary.changed} product(s) will change, ${summary.unchanged} unchanged.`
                    : 'No changes found. Fill the yellow Today\'s columns and upload again.'
                }
              />
            ) : (
              <Alert
                type="error"
                showIcon
                title={`${summary.errors} row(s) have problems. Fix them in Excel and upload again.`}
                description="Nothing is saved until every row is valid."
              />
            )}

            {report.errors?.length > 0 && (
              <Table
                size="small"
                rowKey={(r) => `${r.row}-${r.sku}`}
                columns={errorColumns}
                dataSource={report.errors}
                pagination={report.errors.length > 8 ? { pageSize: 8, size: 'small' } : false}
              />
            )}

            {report.ok && report.changes?.length > 0 && (
              <Table
                size="small"
                rowKey="row"
                columns={changeColumns}
                dataSource={report.changes}
                pagination={report.changes.length > 8 ? { pageSize: 8, size: 'small' } : false}
              />
            )}
          </>
        )}
      </Space>
    </Modal>
  );
};

export default DailyPriceModal;
