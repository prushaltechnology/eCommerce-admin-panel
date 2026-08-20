import { Button, Modal } from 'antd';
import { useState } from 'react';

const ImagePreviewModal = ({ visible, imageSrc, onClose }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    //console.log('Image failed to load in modal');
    setImageError(true);
  };

  const handleImageLoad = () => {
    //console.log('Image loaded successfully in modal');
    setImageError(false);
  };

  return (
    <Modal
      title="Product Image"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button size="small" key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width={900}
      centered
      destroyOnHidden
    >
      {imageSrc && !imageError ? (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src={imageSrc}
            alt="Product Image"
            style={{
              maxWidth: '100%',
              maxHeight: '600px',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '10px' }}>
            {imageError ? '❌ Image failed to load' : '📷 No image available'}
          </div>
          {imageError && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Image URL: {imageSrc}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ImagePreviewModal;
