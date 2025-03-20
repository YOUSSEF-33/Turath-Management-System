import React, { useState } from 'react';
import { Modal, Image, Button, message } from 'antd';
import { FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import {
  isGoogleDriveUrl,
  getGoogleDriveDirectUrl,
  getMediaType,
} from '../utils/mediaUtils';

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
    const directUrl = isDriveUrl ? getGoogleDriveDirectUrl(url) : url;
    console.log("WWWWWWWWWWWWWWWWWWWWWWWWWD");
    console.log(directUrl, mediaType);
    if (mediaType === 'image') {
      return (
        <div className="relative group">
          <Image
            src={directUrl}
            alt={title || 'صورة'}
            className={`rounded-lg object-cover ${className}`}
            preview={false}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              type="primary"
              icon={<ImageIcon className="h-4 w-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              عرض الصورة
            </Button>
          </div>
        </div>
      );
    }

    console.log("I'm INNNN")
    return (
      <div className="relative group">
        <div className={`bg-gray-100 rounded-lg p-4 flex items-center justify-center ${className}`}>
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
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
        footer={[
          <Button key="copy" onClick={handleCopyLink}>
            نسخ الرابط
          </Button>,
          <Button key="open" type="primary" onClick={handleOpenInNewTab}>
            فتح في نافذة جديدة
          </Button>,
        ]}
        width={800}
      >
        <div className="flex justify-center items-center">
          <Image
            src={isGoogleDriveUrl(url) ? getGoogleDriveDirectUrl(url) : url}
            alt={title || 'صورة'}
            className="max-w-full max-h-[70vh]"
            loading="lazy"
          />
        </div>
      </Modal>
    </>
  );
};

export default MediaViewer; 