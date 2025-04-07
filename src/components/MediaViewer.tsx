import React, { useState } from 'react';
import { Modal, Image, Button, message, Typography } from 'antd';
import { FileText, ExternalLink } from 'lucide-react';
import {
  isGoogleDriveUrl,
  getGoogleDriveDirectUrl,
  getMediaType,
} from '../utils/mediaUtils';

const { Text } = Typography;

interface MediaViewerProps {
  url: string;
  title?: string;
  className?: string;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ url, title, className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      message.success('تم نسخ الرابط بنجاح');
    } catch {
      message.error('فشل نسخ الرابط');
    }
  };

  const renderPreview = () => {
    const mediaType = getMediaType(url);
    const isDriveUrl = isGoogleDriveUrl(url);

    if (mediaType === 'image') {
      return (
        <div 
          onClick={() => setIsModalOpen(true)} 
          className={`relative group cursor-pointer rounded-lg overflow-hidden ${className}`}
        >
          <div className="w-full h-full overflow-hidden">
            <Image
              src={isDriveUrl ? getGoogleDriveDirectUrl(url) : url}
              alt={title || 'صورة'}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
            />
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              type="primary"
              icon={<ExternalLink className="h-4 w-4" />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenInNewTab();
              }}
            >
              فتح الصورة
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={`group relative ${className}`}>
        {isDriveUrl ? (
          <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-gray-50 rounded-lg text-center cursor-pointer hover:bg-gray-100 transition-colors">
            <div onClick={handleOpenInNewTab}>
              <ExternalLink size={48} className="text-gray-500 mb-2" strokeWidth={1.5} />
              <Typography.Text className="text-xs">فتح في Google Drive</Typography.Text>
            </div>
          </div>
        ) : (
          <div className={`bg-gray-100 rounded-lg p-4 flex items-center justify-center transition-colors hover:bg-gray-200 ${className}`}>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            type="primary"
            icon={<ExternalLink className="h-4 w-4" />}
            onClick={handleOpenInNewTab}
          >
            فتح الملف
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderPreview()}
      <Modal
        title={title || 'عرض الصورة'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        className="media-viewer-modal"
        width="auto"
        centered
        footer={[
          <Button key="copy" onClick={handleCopyLink}>
            نسخ الرابط
          </Button>,
          <Button key="open" type="primary" onClick={handleOpenInNewTab}>
            فتح في نافذة جديدة
          </Button>,
        ]}
      >
        <div className="flex justify-center items-center max-h-[80vh]">
          <Image
            src={isGoogleDriveUrl(url) ? getGoogleDriveDirectUrl(url) : url}
            alt={title || 'صورة'}
            className="max-w-full max-h-[70vh] object-contain"
            loading="lazy"
          />
        </div>
      </Modal>
    </>
  );
};

export default MediaViewer;