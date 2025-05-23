import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import { Modal, Input, Button, message, Spin, Card, Tag, Empty, Tabs, Typography, Statistic, Badge, List, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import GenericTable from '../../components/GenericTable';
import { usePermissionsContext } from '../../context/PermissionsContext';
import { Check, X, Printer, RefreshCw, Download, FileText, Image as ImageIcon, File, ExternalLink, Calendar, CreditCard, Building, User, Phone, Mail, MapPin, Edit3, Home, Trash2, Upload as UploadIcon } from 'lucide-react';
import { isImageFile } from '../../utils/mediaUtils';

const { Title, Text } = Typography;

interface ImageData {
  id: number;
  name: string;
  url: string;
  medium_url?: string;
  small_url?: string;
  type?: string;
}

interface ClientData {
  name: string;
  email: string;
  phone: string;
  address: string;
  job: string;
  nationality: string;
  nationalId: string;
}

interface UnitData {
  unit_number: string;
  unit_type: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  plan_images: ImageData[];
  gallery: ImageData[];
  price?: number;
  building?: {
    name?: string;
    project?: {
      name?: string;
      contracts?: ContractData[];
    };
  };
}

interface ReservationData {
  id: number;
  client: ClientData;
  unit: UnitData;
  status: string;
  final_price: number;
  reservation_deposit: number;
  down_payment: number;
  monthly_installment: number;
  months_count: number;
  contract_date: string;
  national_id_images: ImageData[];
  reservation_deposit_receipt: ImageData;
  attachments: ImageData[];
  contracts: Array<{
    id: number;
    name: string;
    url: string;
    medium_url?: string;
    small_url?: string;
    disk: string;
  }>;
  approvals: Array<{
    role: {
      readable_name: string;
      name: string;
    };
    status: string;
    rejection_reason?: string;
  }>;
  installments_details: Array<{
    type: string;
    amount: number;
    count: number;
  }>;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: {
      id: number;
      name: string;
      readable_name: string;
    };
  };
}

interface Column {
  key: string;
  header: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface ContractData {
  id: number;
  name: string;
  url: string;
  created_at?: string;
}

const INSTALLMENT_TYPE_TRANSLATIONS: Record<string, string> = {
  'MONTHLY': 'شهري',
  'QUARTERLY': 'ربع سنوي',
  'ANNUAL': 'سنوي'
};

const ReservationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTabKey, setActiveTabKey] = useState<string>('details');
  const [previewImage, setPreviewImage] = useState<{url: string, title: string, isPdf?: boolean} | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedAttachmentType, setSelectedAttachmentType] = useState<string | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // State for rejection modal
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Add these state variables near the other state declarations
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);

  const { hasPermission, userRole } = usePermissionsContext();
  const { TabPane } = Tabs;

  const [pdfLoading, setPdfLoading] = useState(false);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isContractsModalVisible, setIsContractsModalVisible] = useState(false);
  const [contractLoading, setContractLoading] = useState<{ [key: number]: boolean }>({});

  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  const [markAsSoldLoading, setMarkAsSoldLoading] = useState(false);

  const handleMarkAsSold = async () => {
    setMarkAsSoldLoading(true);
    try {
      await axiosInstance.patch(`/reservations/${id}/mark-as-sold`);
      message.success('تم تحديث حالة الحجز إلى مباعة بنجاح');
      fetchData(); // Refresh the data
    } catch (err) {
      message.error('فشل في تحديث حالة الحجز');
      console.error(err);
    } finally {
      setMarkAsSoldLoading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: (file: File) => {
      const isWordOrPdf = 
        file.type === 'application/pdf' || 
        file.type === 'application/msword' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      if (!isWordOrPdf) {
        message.error('يمكنك رفع ملفات Word أو PDF فقط');
        return false;
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت');
        return false;
      }
      return false; // Return false to prevent auto upload
    },
    onChange: (info: any) => {
      setFileList(info.fileList.slice(-1)); // Keep only the latest file
      
      // Add status updates
      const status = info.file.status;
      if (status === 'uploading') {
        message.loading({
          content: 'جاري تحضير الملف...',
          key: 'upload'
        });
      } else if (status === 'done') {
        message.success({
          content: 'تم إضافة الملف بنجاح',
          key: 'upload',
          duration: 2
        });
      } else if (status === 'error') {
        message.error({
          content: 'فشل في إضافة الملف',
          key: 'upload',
          duration: 2
        });
      } else if (status === 'removed') {
        message.info({
          content: 'تم إزالة الملف',
          key: 'upload',
          duration: 2
        });
      }
    },
    onDrop: (e: React.DragEvent) => {
      console.log('Dropped files', e.dataTransfer.files);
      // Prevent default to allow drop
      e.preventDefault();
    },
    onRemove: () => {
      setFileList([]);
      return true;
    },
    accept: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const reservationResponse = await axiosInstance.get(`/reservations/${id}`);

      setReservation(reservationResponse.data.data);
    } catch (err) {
      setError('فشل في تحميل البيانات');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  console.log(reservation)

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAcceptUnit = async () => {
    setApproveLoading(true);
    try {
      await axiosInstance.patch(`/reservations/${id}/approve`);
      message.success('تم قبول الحجز بنجاح');
      setIsApproveModalVisible(false);
      fetchData(); // Refresh data after approval
    } catch (err) {
      message.error('فشل في قبول الحجز');
      console.error(err);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectUnit = async () => {
    if (!rejectionReason) {
      message.warning('يرجى إدخال سبب الرفض');
      return;
    }

    setRejectLoading(true);
    try {
      await axiosInstance.post(`/reservations/${id}/reject`, {
        rejection_reason: rejectionReason,
      });
      message.success('تم رفض الحجز بنجاح');
      setIsRejectModalVisible(false);
      setRejectionReason('');
      fetchData(); // Refresh data after rejection
    } catch (err) {
      message.error('فشل في رفض الحجز');
      console.error(err);
    } finally {
      setRejectLoading(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!reservation) return;
    
    setPdfLoading(true);
    try {
      const response = await axiosInstance.get(`/reservations/${reservation.id}/pdf`, {
        responseType: 'blob'
      });
      
      // Create a blob from the PDF stream
      const file = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a link and trigger download
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `تفاصيل_الحجز_${reservation.id}.pdf`; // Set filename for download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error('Error fetching PDF:', err);
      message.error('فشل في تحميل ملف PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const isPdfFile = (url: string): boolean => {
    return url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('/pdf') || url.toLowerCase().includes('application/pdf');
  };

  const handleDownloadAttachment = (url: string, filename: string) => {
    // For PDFs, we want to open them directly in a new tab
    if (isPdfFile(url)) {
      window.open(url, '_blank');
      return;
    }
    
    // For other files, initiate a direct download
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Ensure filename has an extension if missing
        let downloadFilename = filename || 'attachment';
        if (!downloadFilename.includes('.')) {
          // Try to detect file type from URL if no extension in filename
          if (url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg')) {
            downloadFilename += '.jpg';
          } else if (url.toLowerCase().includes('.png')) {
            downloadFilename += '.png';
          } else if (url.toLowerCase().includes('.pdf')) {
            downloadFilename += '.pdf';
          } else {
            // Default extension
            downloadFilename += '.jpg';
          }
        }
        
        link.download = downloadFilename;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(error => {
        console.error('Error downloading file:', error);
        message.error('فشل في تحميل الملف');
        
        // Fallback: try to open in new tab
        window.open(url, '_blank');
      });
  };

  const handlePreviewImage = (url: string, title: string) => {
    const isPdf = isPdfFile(url);
    setPreviewImage({ url, title, isPdf });
    setPreviewModalVisible(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat().format(amount) + ' جنيه';
  };

  const approvalsColumns: Column[] = [
    {
      key: 'role',
      header: 'الدور',
      render: (_, row: Record<string, unknown>) => 
        (row.role as { readable_name?: string; name?: string })?.readable_name || 
        (row.role as { readable_name?: string; name?: string })?.name || '-',
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (_, row: Record<string, unknown>) => {
        const status = row.status as string;
        let color = '';
        let icon = null;
        
        if (status === 'قيد الانتظار') {
          color = 'gold';
        } else if (status === 'موافق' || status === 'تم القبول') {
          color = 'green';
          icon = <Check size={16} className="inline mr-1" />;
        } else if (status === 'مرفوض' || status === 'تم الرفض') {
          color = 'red';
          icon = <X size={16} className="inline mr-1" />;
        }
        
        return <Tag color={color}>{icon}{status}</Tag>;
      },
    },
    {
      key: 'user',
      header: 'تم بواسطة',
      render: (_, row: Record<string, unknown>) => {
        const user = row.user as { email?: string; first_name?: string; last_name?: string } | null;
        if (!user) return '-';
        return (
          <div className="text-sm">
            <div>{user.first_name} {user.last_name}</div>
            <div className="text-gray-500 text-xs">{user.email}</div>
          </div>
        );
      },
    },
    {
      key: 'action_at',
      header: 'تاريخ الإجراء',
      render: (_, row: Record<string, unknown>) => {
        const actionAt = row.action_at as string;
        return actionAt ? new Date(actionAt).toLocaleString('ar-EG', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : '-';
      },
    },
    {
      key: 'rejection_reason',
      header: 'سبب الرفض',
      render: (_, row: Record<string, unknown>) => {
        const reason = row.rejection_reason as string;
        return reason ? (
          <div className="text-red-600">{reason}</div>
        ) : '-';
      },
    },
  ];

  // Check if the current user's role has already approved or rejected
  const hasUserRoleApproved = () => {
    if (!reservation || !userRole) return false;
    return reservation.approvals.some(
      approval => approval.role.name === userRole && approval.status === 'موافق'
    );
  };

  const hasUserRoleRejected = () => {
    if (!reservation || !userRole) return false;
    return reservation.approvals.some(
      approval => approval.role.name === userRole && approval.status === 'مرفوض'
    );
  };

  const handleDeleteReservation = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/reservations/${id}`);
      message.success('تم حذف الحجز بنجاح');
      navigate('/reservations');
    } catch (err) {
      message.error('فشل في حذف الحجز');
      console.error(err);
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalVisible(false);
    }
  };

  const handleContractDownload = async (contractId: number, fileName: string) => {
    try {
      if (contractLoading[contractId]) return; // Prevent multiple clicks
      
      setContractLoading(prev => ({ ...prev, [contractId]: true }));
      const response = await axiosInstance.get(`/reservations/${id}/contract/${contractId}`, {
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('تم تحميل العقد بنجاح');
    } catch (error) {
      console.error('Error downloading contract:', error);
      message.error('حدث خطأ أثناء تحميل العقد');
    } finally {
      setContractLoading(prev => ({ ...prev, [contractId]: false }));
    }
  };

  // Function to handle file upload
  const handleFileUpload = async () => {
    if (fileList.length === 0) {
      message.error('الرجاء اختيار ملف');
      return;
    }

    const file = fileList[0].originFileObj;
    setUploadLoading(true);
    try {
      // First upload the file to /media
      const formData = new FormData();
      formData.append('files[]', file);
      formData.append('collection_name', 'contracts'); // Add collection name

      const uploadResponse = await axiosInstance.post('/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const fileId = uploadResponse.data.data[0].id;

      // Then send the file ID to the contract endpoint
      await axiosInstance.post(`/reservations/${id}/upload-contract`, {
        contract_id: fileId
      });

      message.success('تم رفع العقد بنجاح');
      setIsUploadModalVisible(false);
      setFileList([]);
      fetchData(); // Refresh the data to show the new contract
    } catch (error) {
      console.error('Error uploading contract:', error);
      message.error('فشل في رفع العقد');
    } finally {
      setUploadLoading(false);
    }
  };

  const renderUnitInformation = () => (
    <Card 
      size="small"
      title={
        <div className="flex items-center">
          <Building size={16} className="mr-3 text-blue-500/70" />
          <span className="text-sm mr-1">بيانات الوحدة</span>
        </div>
      } 
      className="mb-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center border-b pb-2 pt-1">
          <Text strong className="ml-2 mr-2 text-gray-700">المشروع:</Text>
          <Text>{reservation?.unit?.building?.project?.name || '-'}</Text>
        </div>
        <div className="flex items-center border-b pb-2 pt-1">
          <Text strong className="ml-2 mr-2 text-gray-700">المبنى:</Text>
          <Text>{reservation?.unit?.building?.name || '-'}</Text>
        </div>
        <div className="flex items-center border-b pb-2 pt-1">
          <Text strong className="ml-2 mr-2 text-gray-700">رقم الوحدة:</Text>
          <Text>{reservation?.unit?.unit_number || '-'}</Text>
        </div>
        <div className="flex items-center border-b pb-2 pt-1">
          <Text strong className="ml-2 mr-2 text-gray-700">النوع:</Text>
          <Text>{reservation?.unit?.unit_type || '-'}</Text>
        </div>
        <div className="flex items-center border-b pb-2 pt-1">
          <Text strong className="ml-2 mr-2 text-gray-700">المساحة:</Text>
          <Text>{reservation?.unit?.area ? `${reservation.unit.area} متر مربع` : '-'}</Text>
        </div>
        <div className="flex items-center border-b pb-2 pt-1">
          <Text strong className="ml-2 mr-2 text-gray-700">عدد الغرف:</Text>
          <Text>{reservation?.unit?.bedrooms || '-'}</Text>
        </div>
        <div className="flex items-center border-b pb-2 pt-1">
          <Text strong className="ml-2 mr-2 text-gray-700">عدد الحمامات:</Text>
          <Text>{reservation?.unit?.bathrooms || '-'}</Text>
        </div>
        <div className="flex items-center">
          <Text strong className="ml-2 mr-2 text-gray-700">الحالة:</Text>
          <Tag color={reservation?.unit?.status === 'متاح' ? 'green' : 'red'} style={{ padding: '0px 6px' }}>
            {reservation?.unit?.status || '-'}
          </Tag>
        </div>
      </div>
    </Card>
  );

  const removeFileExtension = (filename: string): string => {
    return filename.replace(/\.[^/.]+$/, '');
  };

  const renderContractsModal = () => (
    <Modal
      title={
        <div className="flex items-center space-x-2 space-x-reverse">
          <FileText size={18} className="text-blue-500/70" />
          <span className="font-medium"> نسخ العقود المتاحة</span>
          {reservation?.unit?.building?.project?.name && (
            <Tag color="blue" className="mr-2">
              {reservation.unit.building.project.name}
            </Tag>
          )}
        </div>
      }
      visible={isContractsModalVisible}
      onCancel={() => setIsContractsModalVisible(false)}
      footer={null}
      width={600}
      bodyStyle={{ padding: '16px' }}
    >
      {/* Uploaded Contracts Section */}
      {reservation?.contracts && reservation.contracts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center mb-4 pb-2 border-b">
            <FileText size={16} className="text-green-500/70 ml-2" />
            <span className="font-medium text-gray-700">عقود تمت إضافتها</span>
          </div>
          <List
            itemLayout="horizontal"
            dataSource={reservation.contracts}
            className="contracts-list space-y-2 mb-6"
            renderItem={(contract: any) => (
              <List.Item
                key={contract.id}
                className="rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:border-green-200 overflow-hidden group !p-0"
              >
                <div className="flex items-center w-full relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500/30 group-hover:bg-green-500/70 transition-colors duration-300" />
                  <div className="flex-shrink-0 p-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors duration-300">
                      <FileText size={20} className="text-green-500/70 group-hover:text-green-600 transition-colors duration-300" />
                    </div>
                  </div>
                  <div className="flex-grow py-3 px-2">
                    <div className="flex items-center">
                      <span className="text-gray-800 text-sm font-medium group-hover:text-green-600 transition-colors duration-300">
                        {removeFileExtension(contract.name)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 p-2">
                    <Button
                      type="text"
                      size="small"
                      icon={<ExternalLink size={16} />}
                      onClick={() => window.open(contract.url, '_blank')}
                      className="text-gray-500 hover:text-green-600 hover:bg-green-50 !px-2"
                    >
                      فتح
                    </Button>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Available Contract Templates Section */}
      {reservation?.unit?.building?.project?.contracts && 
       reservation.unit.building.project.contracts.length > 0 ? (
        <>
          <div className="flex items-center mb-4 pb-2 border-b">
            <FileText size={16} className="text-blue-500/70 ml-2" />
            <span className="font-medium text-gray-700">نماذج العقود المتاحة</span>
          </div>
          <List
            itemLayout="horizontal"
            dataSource={reservation.unit.building.project.contracts}
            className="contracts-list space-y-2"
            renderItem={(contract: ContractData) => (
              <List.Item
                key={contract.id}
                className="rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200 overflow-hidden group !p-0"
              >
                <div className="flex items-center w-full relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30 group-hover:bg-blue-500/70 transition-colors duration-300" />
                  <div className="flex-shrink-0 p-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                      <FileText size={20} className="text-blue-500/70 group-hover:text-blue-600 transition-colors duration-300" />
                    </div>
                  </div>
                  <div className="flex-grow py-3 px-2">
                    <div className="flex items-center">
                      <span className="text-gray-800 text-sm font-medium group-hover:text-blue-600 transition-colors duration-300">
                        {removeFileExtension(contract.name)}
                      </span>
                      {contractLoading[contract.id] && (
                        <Spin size="small" className="ml-2" />
                      )}
                    </div>
                    {contract.created_at && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        تم الإضافة: {new Date(contract.created_at).toLocaleDateString('ar-EG')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 p-2">
                    <Button
                      type="text"
                      size="small"
                      icon={<Download size={16} />}
                      onClick={() => handleContractDownload(contract.id, contract.name)}
                      loading={contractLoading[contract.id]}
                      className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 !px-2"
                    >
                      تحميل
                    </Button>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </>
      ) : (
        <Empty description="لا توجد عقود متاحة" />
      )}
    </Modal>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Spin size="large" tip="جاري تحميل البيانات..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <Button onClick={fetchData} type="primary" icon={<RefreshCw size={16} />}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  if (!reservation) {
    return <Empty description="لا توجد بيانات متاحة" />;
  }

  const reservationStatusColor = 
    reservation.status === 'معلق' ? 'gold' : 
    reservation.status === 'مؤكد' ? 'green' : 
    reservation.status === 'مرفوض' ? 'red' : 'default';

  // Group all attachments for better organization
  const allAttachments = [
    ...(reservation.attachments || []).map(att => ({ ...att, type: 'attachment' })),
    ...(reservation.national_id_images || []).map(att => ({ ...att, type: 'national_id' })),
    ...(reservation.unit.gallery || []).map(att => ({ ...att, type: 'gallery' })),
    ...(reservation.unit.plan_images || []).map(att => ({ ...att, type: 'plan' })),
  ];
  
  if (reservation.reservation_deposit_receipt) {
    allAttachments.push({ 
      ...reservation.reservation_deposit_receipt, 
      type: 'receipt' 
    });
  }

  const categoryTitles = {
    gallery: 'صور الوحدة',
    plan: 'مخططات الوحدة',
    national_id: 'صور البطاقة الشخصية',
    receipt: 'إيصال السداد',
    attachment: 'المرفقات الإضافية'
  };

  // Filter attachments based on selected type
  const filteredAttachments = selectedAttachmentType 
    ? allAttachments.filter(a => a.type === selectedAttachmentType)
    : allAttachments;

  // Count attachments by type
  const attachmentCounts = ['gallery', 'plan', 'national_id', 'receipt', 'attachment'].map(type => ({
    type,
    count: allAttachments.filter(a => a.type === type).length,
    title: categoryTitles[type as keyof typeof categoryTitles]
  })).filter(item => item.count > 0);

  return (
    <div className="p-2 sm:p-4 bg-gray-50/50 rounded-lg max-w-7xl mx-auto">
      {/* Header & Actions */}
      <Card className="mb-4 sm:mb-6 shadow-sm border-t-4 border-t-blue-500/70">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-start md:items-center">
            <div>
              <Title level={4} className="!mb-0 text-lg sm:text-xl">تفاصيل الحجز <span className="text-blue-500/80 mr-2">#{reservation.id}</span></Title>
              <div className="flex flex-col sm:flex-row sm:items-center mt-2 gap-2">
                <div className="flex items-center">
                  <Calendar size={16} className="text-blue-500/70 ml-2" />
                  <Text strong className="ml-2" style={{ fontSize: '14px' }}>تاريخ الحجز:</Text>
                  <Text style={{ fontSize: '14px' }}>{new Date(reservation.contract_date).toLocaleDateString('ar-EG')}</Text>
                </div>
                <Tag className="self-start sm:self-auto sm:mr-4" color={reservationStatusColor} style={{ fontSize: '13px', padding: '1px 8px' }}>
                  {reservation.status}
                </Tag>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => navigate(`/reservations/${id}/installments-breakdown`)}
              icon={<CreditCard size={16} className="mr-2" />}
              size="middle"
              className="flex-1 sm:flex-none bg-purple-500 hover:bg-purple-600 text-white"
            >
              جدول الأقساط
            </Button>
            {hasPermission('view_reservations') && (
              <Button 
                type="primary"
                icon={<Printer size={16} className="mr-2" />} 
                onClick={handlePrintPDF}
                size="middle"
                className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600"
                loading={pdfLoading}
                disabled={pdfLoading}
              >
                {pdfLoading ? 'جاري التحميل...' : 'طباعة الاستمارة'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Card */}
      <Card 
        className="mb-4 sm:mb-6 shadow-sm" 
        title={
          <div className="flex items-center">
            <FileText size={18} className="text-blue-500/70 mr-3" strokeWidth={1.5} />
            <span className="text-base font-medium mr-1">ملخص الحجز</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Statistic 
            title={<div className="flex items-center text-sm"><CreditCard size={16} className="mr-2 text-blue-500/70" /> <span>السعر النهائي</span></div>}
            value={parseFloat(reservation.final_price.toString())} 
            className="bg-blue-50/50 p-3 rounded-lg hover:bg-blue-50 transition-colors" 
          />
          <Statistic 
            title={<div className="flex items-center text-sm"><CreditCard size={16} className="mr-2 text-emerald-500/70" /> <span>الدفعة المقدمة</span></div>}
            value={parseFloat(reservation.down_payment.toString())} 
            className="bg-emerald-50/50 p-3 rounded-lg hover:bg-emerald-50 transition-colors" 
          />
          <Statistic 
            title={<div className="flex items-center text-sm"><CreditCard size={16} className="mr-2 text-amber-500/70" /> <span>عربون الحجز</span></div>}
            value={parseFloat(reservation.reservation_deposit.toString())} 
            className="bg-amber-50/50 p-3 rounded-lg hover:bg-amber-50 transition-colors" 
          />
          <Statistic 
            title={<div className="flex items-center text-sm"><Home size={16} className="mr-2 text-purple-500/70" /> <span>رقم الوحدة</span></div>}
            value={reservation.unit.unit_number} 
            className="bg-purple-50/50 p-3 rounded-lg hover:bg-purple-50 transition-colors" 
          />
        </div>
      </Card>

      {/* Tabs Container */}
      <Tabs 
        activeKey={activeTabKey} 
        onChange={setActiveTabKey}
        type="card"
        className="bg-white rounded-lg shadow-sm"
        size="middle"
      >
        {/* Main Details Tab */}
        <TabPane 
          tab={
            <span className="flex items-center py-1">
              <FileText size={16} className="mr-3 text-blue-500/70" />
              <span>بيانات الحجز</span>
            </span>
          } 
          key="details"
        >
          <div className="p-2 sm:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Client Information */}
              <Card 
                size="small"
                title={
                  <div className="flex items-center">
                    <User size={16} className="mr-3 text-blue-500/70" />
                    <span className="text-sm mr-1">بيانات العميل</span>
                  </div>
                } 
                className="mb-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center border-b pb-2 pt-1">
                    <User size={14} className="text-gray-600 mr-3" />
                    <Text strong className="ml-3 mr-2 w-24 text-gray-700">الاسم:</Text>
                    <Text>{reservation.client.name || '-'}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Phone size={14} className="text-gray-600 mr-3" />
                    <Text strong className="ml-3 mr-2 w-24 text-gray-700">رقم الهاتف:</Text>
                    <Text>{reservation.client.phone || '-'}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Mail size={14} className="text-gray-600 mr-3" />
                    <Text strong className="ml-3 mr-2 w-24 text-gray-700">البريد الإلكتروني:</Text>
                    <Text>{reservation.client.email || '-'}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <MapPin size={14} className="text-gray-600 mr-3" />
                    <Text strong className="ml-3 mr-2 w-24 text-gray-700">العنوان:</Text>
                    <Text>{reservation.client.address || '-'}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Edit3 size={14} className="text-gray-600 mr-3" />
                    <Text strong className="ml-3 mr-2 w-24 text-gray-700">رقم البطاقة:</Text>
                    <Text>{reservation.client.nationalId || '-'}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <User size={14} className="text-gray-600 mr-3" />
                    <Text strong className="ml-3 mr-2 w-24 text-gray-700">الوظيفة:</Text>
                    <Text>{reservation.client.job || '-'}</Text>
                  </div>
                  <div className="flex items-center pt-1">
                    <User size={14} className="text-gray-600 mr-3" />
                    <Text strong className="ml-3 mr-2 w-24 text-gray-700">الجنسية:</Text>
                    <Text>{reservation.client.nationality || '-'}</Text>
                  </div>
                </div>
              </Card>

              {/* Unit Information */}
              {renderUnitInformation()}

              {/* Reservation Creator Information */}
              <Card 
                size="small"
                title={
                  <div className="flex items-center">
                    <User size={16} className="mr-3 text-blue-500/70" />
                    <span className="text-sm mr-1">تم الحجز بواسطة</span>
                  </div>
                } 
                className="mb-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Text strong className="ml-2 mr-2 text-gray-700">الاسم:</Text>
                    <Text>{`${reservation.user.first_name} ${reservation.user.last_name}`}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Text strong className="ml-2 mr-2 text-gray-700">البريد الإلكتروني:</Text>
                    <Text>{reservation.user.email}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Text strong className="ml-2 mr-2 text-gray-700">رقم الهاتف:</Text>
                    <Text>{reservation.user.phone || '-'}</Text>
                  </div>
                  <div className="flex items-center">
                    <Text strong className="ml-2 mr-2 text-gray-700">الدور:</Text>
                    <Tag color="blue" style={{ padding: '0px 6px' }}>
                      {reservation.user.role.readable_name}
                    </Tag>
                  </div>
                </div>
              </Card>
            </div>

            {/* Reservation Financial Details */}
            <Card 
              size="small"
              title={
                <div className="flex items-center">
                  <CreditCard size={16} className="mr-3 text-blue-500/70" />
                  <span className="text-sm mr-1">التفاصيل المالية</span>
                </div>
              } 
              className="mb-4 shadow-sm hover:shadow-md transition-shadow overflow-x-auto"
            >
              <div className="min-w-[600px] lg:min-w-0">
                {/* Basic Financial Information */}
                <div className="mb-6">
                  <Title level={5} className="mb-4 text-gray-700 border-b pb-2">المعلومات الأساسية</Title>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <Text className="text-gray-600">السعر النهائي:</Text>
                      <Text  className="text-lg">{formatCurrency(reservation.final_price)}</Text>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <Text className="text-gray-600">عربون الحجز:</Text>
                      <Text  className="text-lg">{formatCurrency(reservation.reservation_deposit)}</Text>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <Text className="text-gray-600">الدفعة المقدمة:</Text>
                      <Text  className="text-lg">{formatCurrency(reservation.down_payment)}</Text>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <Text className="text-gray-600">تاريخ التعاقد:</Text>
                      <Text style={{ fontSize: '16px' }} >{new Date(reservation.contract_date).toLocaleDateString('ar-EG')}</Text>
                    </div>
                  </div>
                </div>
                
                {/* Installment Details */}
                {reservation.installments_details && reservation.installments_details.length > 0 && (
                  <div className="mb-6">
                    <Title level={5} className="mb-4 text-gray-700 border-b pb-2">تفاصيل التقسيط</Title>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-3 text-right border border-gray-200">نوع التقسيط</th>
                            <th className="p-3 text-right border border-gray-200">عدد الأقساط</th>
                            <th className="p-3 text-right border border-gray-200">قيمة القسط</th>
                            <th className="p-3 text-right border border-gray-200">إجمالي التقسيط</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservation.installments_details.map((installment, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="p-3 border border-gray-200">{INSTALLMENT_TYPE_TRANSLATIONS[installment.type] || installment.type}</td>
                              <td className="p-3 border border-gray-200 text-center">{installment.count}</td>
                              <td className="p-3 border border-gray-200 text-left">{formatCurrency(installment.amount)}</td>
                              <td className="p-3 border border-gray-200 text-left">{formatCurrency(installment.amount * installment.count)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Additional Expenses */}
                {reservation.unit.price && reservation.final_price > reservation.unit.price && (
                  <div>
                    <Title level={5} className="mb-4 text-gray-700 border-b pb-2">المصروفات الإضافية</Title>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <tbody>
                          <tr className="bg-white">
                            <td className="p-3 border border-gray-200 text-right">سعر الوحدة الأساسي:</td>
                            <td className="p-3 border border-gray-200 text-left">{formatCurrency(reservation.unit.price)}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="p-3 border border-gray-200 text-right">المصروفات الإضافية:</td>
                            <td className="p-3 border border-gray-200 text-left">{formatCurrency(reservation.final_price - reservation.unit.price)}</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="p-3 border border-gray-200 text-right font-medium">السعر النهائي:</td>
                            <td className="p-3 border border-gray-200 text-left font-medium">{formatCurrency(reservation.final_price)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Approvals Section */}
            <Card 
              size="small"
              title={
                <div className="flex items-center">
                  <Check size={16} className="mr-3 text-emerald-500/70" />
                  <span className="text-sm mr-1">الموافقات والتصديقات</span>
                </div>
              } 
              className="shadow-sm hover:shadow-md transition-shadow overflow-x-auto"
            >
              <div className="min-w-[600px] lg:min-w-0">
                <GenericTable
                  data={reservation.approvals}
                  columns={approvalsColumns}
                  loading={loading}
                  noDataMessage="لا توجد موافقات بعد"
                  totalPages={1}
                />
              </div>
            </Card>
          </div>
        </TabPane>

        {/* Attachments Tab */}
        <TabPane 
          tab={
            <span className="flex items-center py-1">
              <ImageIcon size={16} className="mr-3 text-blue-500/70" />
              <span className="mr-1">المرفقات</span>
              <Badge count={allAttachments.length} style={{ marginRight: '8px', backgroundColor: 'rgb(59 130 246 / 0.7)' }} />
            </span>
          } 
          key="attachments"
        >
          <div className="p-2 sm:p-4">
            {/* Filter Pills */}
            <div className="mb-4 overflow-x-auto">
              <div className="flex flex-nowrap gap-2 pb-2">
                <Button 
                  type={selectedAttachmentType === null ? "default" : "text"}
                  onClick={() => setSelectedAttachmentType(null)}
                  size="small"
                  className={`rounded-full px-3 ${selectedAttachmentType === null ? "bg-blue-50 text-blue-600 border-blue-200" : ""}`}
                >
                  الكل ({allAttachments.length})
                </Button>
                
                {attachmentCounts.map(item => (
                  <Button 
                    key={item.type}
                    type={selectedAttachmentType === item.type ? "default" : "text"}
                    onClick={() => setSelectedAttachmentType(item.type)}
                    size="small"
                    className={`rounded-full px-3 ${selectedAttachmentType === item.type ? "bg-blue-50 text-blue-600 border-blue-200" : ""}`}
                  >
                    {item.title} ({item.count})
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Attachments Grid */}
            <Card className="shadow-sm" bodyStyle={{ padding: '16px' }}>
              {filteredAttachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAttachments.map((attachment) => {
                    const isImage = isImageFile(attachment.url);
                    const isPdf = isPdfFile(attachment.url);
                    const isGoogleDrive = attachment.url.includes('drive.google.com');
                    
                    return (
                      <div key={attachment.id} className="border border-gray-100 rounded-lg overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-all hover:border-blue-200">
                        <div className="relative h-[140px] bg-gray-50 overflow-hidden">
                          {isImage ? (
                            <img 
                              src={attachment.medium_url || attachment.url} 
                              alt={attachment.name || "Image"}
                              className="object-contain w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handlePreviewImage(attachment.url, attachment.name || "Image")}
                            />
                          ) : isPdf ? (
                            <div 
                              className="flex items-center justify-center h-full cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => window.open(attachment.url, '_blank')}
                            >
                              <div className="flex flex-col items-center">
                                <FileText size={48} className="text-gray-500 mb-2" strokeWidth={1.5} />
                                <Text className="text-xs">عرض PDF</Text>
                              </div>
                            </div>
                          ) : isGoogleDrive ? (
                            <div 
                              className="flex items-center justify-center h-full cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => window.open(attachment.url, '_blank')}
                            >
                              <div className="flex flex-col items-center">
                                <ExternalLink size={48} className="text-gray-500 mb-2" strokeWidth={1.5} />
                                <Text className="text-xs">فتح في Google Drive</Text>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <File size={48} className="text-gray-400" strokeWidth={1.5} />
                            </div>
                          )}
                          
                          <div className="absolute top-2 right-2">
                            <Tag color="blue" style={{ padding: '0px 6px', fontSize: '11px', opacity: 0.7 }}>
                              {categoryTitles[attachment.type as keyof typeof categoryTitles]}
                            </Tag>
                          </div>
                        </div>
                        
                        <div className="p-2 flex flex-col flex-grow bg-white">
                          <Text className="text-xs text-gray-700 truncate" title={attachment.name}>
                            {attachment.name || `File-${attachment.id}`}
                          </Text>
                          
                          <div className="mt-auto flex justify-end pt-2">
                            {!isGoogleDrive && (
                              <Button 
                                type="text" 
                                size="small" 
                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                icon={<Download size={16} />}
                                onClick={() => handleDownloadAttachment(attachment.url, attachment.name || `file-${attachment.id}`)}
                                title="تحميل الملف"
                              />
                            )}
                            <Button 
                              type="text" 
                                size="small" 
                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                icon={isImage ? <ImageIcon size={16} /> : <ExternalLink size={16} />}
                                onClick={() => {
                                  if (isImage) {
                                    handlePreviewImage(attachment.url, attachment.name || "Image");
                                  } else {
                                    window.open(attachment.url, '_blank');
                                  }
                                }}
                                title={isImage ? "معاينة الصورة" : "فتح في نافذة جديدة"}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Empty description="لا توجد مرفقات" />
                )}
              </Card>
            </div>
          </TabPane>
        </Tabs>

        {/* Actions Section */}
        {reservation.status !== 'مباعة' && reservation.status !== 'تم البيع' ? (
          <div className="mt-4 sm:mt-6 flex flex-col space-y-4">
            <div className="border-t pt-4">
              <div className="flex flex-col space-y-3">
                <div className="flex flex-wrap justify-end gap-2">
                  {hasPermission('confirm_reservations') && !hasUserRoleApproved() && (
                    <Button
                      type="primary"
                      onClick={() => setIsApproveModalVisible(true)}
                      icon={<Check size={14} className="mr-3" />}
                      size="middle"
                      className="mx-2 bg-emerald-500 hover:bg-emerald-600 border-emerald-500"
                    >
                      قبول الحجز
                    </Button>
                  )}
                  {hasPermission('cancel_reservations') && !hasUserRoleRejected() && (
                    <Button
                      danger
                      onClick={() => setIsRejectModalVisible(true)}
                      icon={<X size={14} className="mr-3" />}
                      size="middle"
                      className="mx-2"
                    >
                      رفض الحجز
                    </Button>
                  )}
                  {hasPermission('delete_reservations') && (
                    <Button
                      color='geekblue'
                      onClick={() => setIsDeleteModalVisible(true)}
                      icon={<Trash2 size={14} className="mr-3" />}
                      size="middle"
                      className="mx-2"
                    >
                      حذف الحجز
                    </Button>
                  )}
                  {hasPermission('confirm_reservations') && (
                    <Button
                      type="primary"
                      onClick={handleMarkAsSold}
                      icon={<Check size={14} className="mr-3" />}
                      size="middle"
                      loading={markAsSoldLoading}
                      className="mx-2 bg-purple-500 hover:bg-purple-600 border-purple-500"
                    >
                      تحديث إلى مباعة
                    </Button>
                  )}
                </div>
                <div className="flex justify-end border-t pt-3">
                  <Button
                    type="primary"
                    size="middle"
                    icon={<FileText size={18} className="mr-2" />}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-none shadow-md hover:shadow-lg transition-all duration-300 mx-2"
                    onClick={() => setIsContractsModalVisible(true)}
                  >
                    إنشاء عقد
                  </Button>
                  <Button
                    type="primary"
                    size="middle"
                    icon={<UploadIcon size={18} className="mr-2" />}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-none shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={() => setIsUploadModalVisible(true)}
                  >
                    رفع عقد
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 sm:mt-6 flex flex-col space-y-4">
            <div className="border-t pt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center text-green-700 mb-2">
                  <Check size={24} className="mr-2" />
                  <span className="text-lg font-medium">تم بيع الوحدة</span>
                </div>
                <p className="text-green-600">تم إتمام عملية البيع بنجاح وإغلاق الحجز</p>
              </div>
              <div className="flex justify-end border-t pt-3 mt-4">
                <Button
                  type="primary"
                  size="middle"
                  icon={<FileText size={18} className="mr-2" />}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-none shadow-md hover:shadow-lg transition-all duration-300 mx-2"
                  onClick={() => setIsContractsModalVisible(true)}
                >
                  إنشاء عقد
                </Button>
                <Button
                  type="primary"
                  size="middle"
                  icon={<UploadIcon size={18} className="mr-2" />}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-none shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={() => setIsUploadModalVisible(true)}
                >
                  رفع عقد
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Confirmation Modal */}
        <Modal
          title="تأكيد قبول الحجز"
          visible={isApproveModalVisible}
          onCancel={() => setIsApproveModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsApproveModalVisible(false)}>
              إلغاء
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={handleAcceptUnit} 
              loading={approveLoading}
              className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500"
            >
              تأكيد القبول
            </Button>,
          ]}
          width="90%"
          style={{ maxWidth: '500px' }}
          className="responsive-modal"
        >
          <div className="p-4">
            <p>هل أنت متأكد من قبول هذا الحجز؟</p>
            <p className="mt-2 text-gray-600">سيتم إرسال إشعار بقبول الحجز.</p>
          </div>
        </Modal>

        {/* Reject Modal */}
        <Modal
          title="سبب الرفض"
          visible={isRejectModalVisible}
          onCancel={() => setIsRejectModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsRejectModalVisible(false)}>
              إلغاء
            </Button>,
            <Button 
              key="submit" 
              danger 
              type="primary" 
              onClick={handleRejectUnit} 
              loading={rejectLoading}
            >
              تأكيد الرفض
            </Button>,
          ]}
          width="90%"
          style={{ maxWidth: '500px' }}
          className="responsive-modal"
        >
          <div className="p-4">
            <p className="mb-4">يرجى إدخال سبب رفض الحجز:</p>
            <Input.TextArea
              placeholder="أدخل سبب الرفض"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          visible={previewModalVisible}
          footer={null}
          onCancel={() => setPreviewModalVisible(false)}
          width="90%"
          style={{ maxWidth: '800px' }}
          className="responsive-modal"
          title={previewImage?.title || "معاينة الصورة"}
        >
          {previewImage && (
            <div className="flex flex-col items-center">
              {previewImage.isPdf ? (
                <div className="w-full h-[70vh] flex flex-col items-center justify-center">
                  <FileText size={80} className="text-gray-500 mb-4" strokeWidth={1.5} />
                  <Text className="mb-4">لا يمكن عرض الـ PDF هنا. يرجى فتحه في نافذة جديدة</Text>
                  <Button 
                    type="primary" 
                    icon={<ExternalLink size={16} />}
                    onClick={() => window.open(previewImage.url, '_blank')}
                  >
                    فتح الملف
                  </Button>
                </div>
              ) : (
                <>
                  <img 
                    src={previewImage.url} 
                    alt={previewImage.title} 
                    style={{ maxWidth: '100%', maxHeight: '70vh' }} 
                  />
                  <div className="mt-4">
                    <Button 
                      type="primary" 
                      icon={<Download size={16} />}
                      onClick={() => handleDownloadAttachment(previewImage.url, previewImage.title || "image")}
                    >
                      تحميل الصورة
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="تأكيد حذف الحجز"
          visible={isDeleteModalVisible}
          onCancel={() => setIsDeleteModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsDeleteModalVisible(false)}>
              إلغاء
            </Button>,
            <Button 
              key="submit" 
              danger 
              type="primary" 
              onClick={handleDeleteReservation} 
              loading={deleteLoading}
            >
              تأكيد الحذف
            </Button>,
          ]}
          width="90%"
          style={{ maxWidth: '500px' }}
          className="responsive-modal"
        >
          <div className="p-4">
            <p>هل أنت متأكد من حذف هذا الحجز؟</p>
            <p className="mt-2 text-red-600">هذا الإجراء لا يمكن التراجع عنه.</p>
          </div>
        </Modal>

        {/* Upload Contract Modal */}
        <Modal
          title="رفع عقد"
          visible={isUploadModalVisible}
          onCancel={() => {
            setIsUploadModalVisible(false);
            setFileList([]);
          }}
          footer={[
            <Button 
              key="cancel" 
              onClick={() => {
                setIsUploadModalVisible(false);
                setFileList([]);
              }}
            >
              إلغاء
            </Button>,
            <Button
              key="upload"
              type="primary"
              onClick={handleFileUpload}
              loading={uploadLoading}
              disabled={fileList.length === 0}
              className="bg-green-500 hover:bg-green-600"
            >
              رفع العقد
            </Button>
          ]}
          width="90%"
          style={{ maxWidth: '500px' }}
          className="responsive-modal"
        >
          <div className="p-4">
            <Upload.Dragger 
              {...uploadProps}
              style={{
                border: '2px dashed #d9d9d9',
                borderRadius: '8px',
                padding: '24px',
                backgroundColor: '#fafafa',
              }}
              className="w-full upload-dragger-enhanced"
            >
              <div className="upload-content">
                <p className="ant-upload-drag-icon">
                  <InboxOutlined className="text-blue-500 text-3xl transition-all duration-300 transform group-hover:scale-110" />
                </p>
                <p className="ant-upload-text text-base">
                  اضغط أو اسحب ملف العقد إلى هذه المنطقة للتحميل
                </p>
                <p className="ant-upload-hint text-xs text-gray-500 mt-2">
                  <span className="block mb-1">الصيغ المدعومة: Word أو PDF</span>
                  <span className="block">الحد الأقصى للحجم: 10 ميجابايت</span>
                </p>
                {fileList.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="text-blue-500 mr-2" size={20} />
                      <span className="text-sm text-blue-600">
                        {fileList[0].name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Upload.Dragger>
          </div>
        </Modal>

        {renderContractsModal()}
      </div>
    );
  };

  export default ReservationDetails;
