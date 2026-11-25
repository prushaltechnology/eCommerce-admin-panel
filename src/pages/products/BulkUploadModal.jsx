import { DownloadOutlined, FileExcelOutlined, FileZipOutlined, InboxOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Modal, Space, Table, Tag, Typography, Upload, message } from 'antd';
import { useState } from 'react';
import { downloadBulkUploadTemplate, uploadBulkProducts } from '../../api/productExcel';

const { Text, Paragraph } = Typography;
const { Dragger } = Upload;

const errorColumns = [
  { title: 'Row', dataIndex: 'row', width: 60 },
  { title: 'SKU', dataIndex: 'sku', width: 120, render: (v) => v || '—' },
  { title: 'Problem', dataIndex: 'message' },
];

const previewColumns = [
  { title: 'Row', dataIndex: 'row', width: 60 },
  {
    title: 'Action',
    dataIndex: 'action',
    width: 90,
    render: (action, record) => (
      <Space size={4}>
        <Tag color={action === 'create' ? 'green' : 'blue'}>{action === 'create' ? 'NEW' : 'UPDATE'}</Tag>
        {record.archived && <Tag>ARCHIVED</Tag>}
      </Space>
    ),
  },
  { title: 'SKU', dataIndex: 'sku', width: 120 },
  { title: 'Name', dataIndex: 'name' },
  { title: 'Category', dataIndex: 'category', render: (v) => v || '—' },
  { title: 'Price', dataIndex: 'price', width: 90, render: (v) => (v ? `₹${v}` : '—') },
  { title: 'Images', dataIndex: 'images', width: 70 },
];

const pickFile = (setter, accept) => ({
  accept,
  maxCount: 1,
  multiple: false,
  showUploadList: false,
  beforeUpload: (file) => {
    setter(file);
    return false; // keep the file in the browser; we upload it ourselves
  },
});

const BulkUploadModal = ({ open, onClose, onImported }) => {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [report, setReport] = useState(null);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const reset = () => {
    setFile(null);
    setImages(null);
    setUpdateExisting(false);
    setReport(null);
  };

  const close = () => {
    if (checking || importing) return;
    reset();
    onClose();
  };

  const changeInputs = (setter) => (value) => {
    setter(value);
    setReport(null); // inputs changed, the old preview no longer applies
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadBulkUploadTemplate();
    } catch (error) {
      message.error(error.message || 'Could not download the template');
    } finally {
      setDownloading(false);
    }
  };

  const run = async (dryRun) => {
    const setBusy = dryRun ? setChecking : setImporting;
    setBusy(true);
    try {
      const result = await uploadBulkProducts({ file, images, updateExisting, dryRun });
      if (dryRun) {
        setReport(result);
        return;
      }
      if (!result.ok) {
        // Data changed between the check and the import; show the new problems.
        setReport(result);
        message.error('Import stopped. Nothing was saved. See the problems listed.');
        return;
      }
      const { create, update } = result.summary;
      message.success(`Imported ${create} new and updated ${update} existing product(s).`);
      reset();
      onImported?.();
      onClose();
    } catch (error) {
      message.error(error.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const summary = report?.summary;
  const canImport = report?.ok && !report?.fileError && (summary?.create || summary?.update);

  return (
    <Modal
      title="Bulk upload products"
      open={open}
      onCancel={close}
      width={900}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={close} disabled={checking || importing}>
          Cancel
        </Button>,
        <Button key="check" onClick={() => run(true)} loading={checking} disabled={!file || importing}>
          Check file
        </Button>,
        <Button key="import" type="primary" onClick={() => run(false)} loading={importing} disabled={!canImport || checking}>
          {canImport ? `Import ${summary.create + summary.update} product(s)` : 'Import'}
        </Button>,
      ]}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          title="How it works"
          description={
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              <li>Download the template and fill one product per row.</li>
              <li>Put the product photos in a .zip and list their file names in the <b>Images</b> column.</li>
              <li>Upload both files and click <b>Check file</b>. Nothing is saved until you click <b>Import</b>.</li>
            </ol>
          }
          action={
            <Button icon={<DownloadOutlined />} onClick={handleDownload} loading={downloading}>
              Template
            </Button>
          }
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Dragger {...pickFile(changeInputs(setFile), '.xlsx')} style={{ padding: 8 }}>
            <p className="ant-upload-drag-icon">{file ? <FileExcelOutlined /> : <InboxOutlined />}</p>
            <p className="ant-upload-text">{file ? file.name : 'Excel file (.xlsx)'}</p>
            <p className="ant-upload-hint">Required</p>
          </Dragger>
          <Dragger {...pickFile(changeInputs(setImages), '.zip')} style={{ padding: 8 }}>
            <p className="ant-upload-drag-icon">{images ? <FileZipOutlined /> : <InboxOutlined />}</p>
            <p className="ant-upload-text">{images ? images.name : 'Images (.zip)'}</p>
            <p className="ant-upload-hint">
              {images ? (
                <a onClick={(e) => { e.stopPropagation(); changeInputs(setImages)(null); }}>Remove</a>
              ) : 'Optional'}
            </p>
          </Dragger>
        </div>

        <Checkbox checked={updateExisting} onChange={(e) => changeInputs(setUpdateExisting)(e.target.checked)}>
          Update existing products with the same SKU
          <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>
            (blank cells keep current values; filled Images replace current images)
          </Text>
        </Checkbox>

        {report?.fileError && <Alert type="error" showIcon title={report.fileError} />}

        {summary && !report.fileError && (
          <>
            {report.ok ? (
              <Alert
                type="success"
                showIcon
                title={`Ready to import: ${summary.create} new, ${summary.update} update(s), ${summary.images} image(s).`}
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

            {report.ok && report.rows?.length > 0 && (
              <>
                <Paragraph type="secondary" style={{ margin: 0 }}>Preview</Paragraph>
                <Table
                  size="small"
                  rowKey="row"
                  columns={previewColumns}
                  dataSource={report.rows}
                  pagination={report.rows.length > 8 ? { pageSize: 8, size: 'small' } : false}
                />
              </>
            )}
          </>
        )}
      </Space>
    </Modal>
  );
};

export default BulkUploadModal;
