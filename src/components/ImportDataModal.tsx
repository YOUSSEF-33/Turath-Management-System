import React, { useState } from 'react';
import { Modal, Button, Upload, Input, message, Radio } from 'antd';
import { Upload as UploadIcon, Link } from 'lucide-react';
import type { UploadFile } from 'antd/es/upload/interface';
import axiosInstance from '../axiosInstance';

interface ImportDataModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImportDataModal: React.FC<ImportDataModalProps> = ({ projectId, isOpen, onClose }) => {
  const [importType, setImportType] = useState<'excel' | 'drive'>('excel');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [driveLink, setDriveLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      if (importType === 'excel' && fileList.length > 0) {
        formData.append('excel_file', fileList[0].originFileObj as File);
      } else if (importType === 'drive' && driveLink) {
        formData.append('drive_link', driveLink);
      } else {
        message.error('الرجاء اختيار ملف أو إدخال رابط');
        return;
      }

      await axiosInstance.post(`/projects/${projectId}/import-data`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('تم استيراد البيانات بنجاح');
      onClose();
    } catch (error) {
      console.error('Error importing data:', error);
      message.error('حدث خطأ أثناء استيراد البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="استيراد البيانات"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          إلغاء
        </Button>,
        <Button key="import" type="primary" onClick={handleImport} loading={loading}>
          استيراد
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <Radio.Group value={importType} onChange={(e) => setImportType(e.target.value)}>
          <Radio.Button value="excel">ملف Excel</Radio.Button>
          <Radio.Button value="drive">رابط Drive</Radio.Button>
        </Radio.Group>

        {importType === 'excel' ? (
          <Upload
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
            maxCount={1}
            accept=".xlsx,.xls"
          >
            <Button icon={<UploadIcon className="h-4 w-4" />}>اختر ملف Excel</Button>
          </Upload>
        ) : (
          <Input
            placeholder="أدخل رابط Drive"
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            prefix={<Link className="h-4 w-4" />}
          />
        )}
      </div>
    </Modal>
  );
};

export default ImportDataModal; 