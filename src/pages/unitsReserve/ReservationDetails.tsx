import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import { Modal, Input, Button, message, Spin, Card, Tag, Empty, Tabs, Typography, Statistic, Badge } from 'antd';
import GenericTable from '../../components/GenericTable';
import { usePermissionsContext } from '../../context/PermissionsContext';
import { Check, X, Printer, RefreshCw, Download, FileText, Image as ImageIcon, File, ExternalLink, Calendar, CreditCard, Building, User, Phone, Mail, MapPin, Edit3, Home, Trash2 } from 'lucide-react';
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
    <div className="p-4 bg-gray-50/50 rounded-lg max-w-7xl mx-auto">
      {/* Header & Actions */}
      <Card className="mb-6 shadow-sm border-t-4 border-t-blue-500/70">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div>
              <Title level={4} className="!mb-0">تفاصيل الحجز <span className="text-blue-500/80 mr-2">#{reservation.id}</span></Title>
              <div className="flex items-center mt-2">
                <Calendar size={16} className="text-blue-500/70 mr-3" />
                <Text strong className="mr-2 mx-3" style={{ fontSize: '14px' }}>تاريخ الحجز:</Text>
                <Text style={{ fontSize: '16px' }}>{new Date(reservation.contract_date).toLocaleDateString('ar-EG')}</Text>
                <Tag className="mr-4 ml-4" color={reservationStatusColor} style={{ fontSize: '13px', padding: '1px 8px' }}>{reservation.status}</Tag>
              </div>
            </div>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <Button
              onClick={() => navigate(`/reservations/${id}/installments-breakdown`)}
              icon={<CreditCard size={16} className="mr-3" />}
              size="middle"
              className="ml-2 bg-purple-500 hover:bg-purple-600 text-white"
            >
              جدول الأقساط
            </Button>
            {hasPermission('view_reservations') && (
              <Button 
                type="primary"
                icon={<Printer size={16} className="mr-3" />} 
                onClick={handlePrintPDF}
                size="middle"
                className="bg-blue-500 hover:bg-blue-600"
                loading={pdfLoading}
                disabled={pdfLoading}
              >
                {pdfLoading ? 'جاري التحميل...' : 'طباعة الاستمارة'
                }
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Card */}
      <Card 
        className="mb-6 shadow-sm" 
        title={
          <div className="flex items-center">
            <FileText size={18} className="text-blue-500/70 mr-3" strokeWidth={1.5} />
            <span className="text-base font-medium mr-1">ملخص الحجز</span>
          </div>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Statistic 
            title={<div className="flex items-center text-sm"><CreditCard size={16} className="mr-3 mx-1 text-blue-500/70" /> <span>السعر النهائي</span></div>}
            value={parseFloat(reservation.final_price.toString())} 
            className="bg-blue-50/50 p-3 rounded-lg hover:bg-blue-50 transition-colors" 
          />
          <Statistic 
            title={<div className="flex items-center text-sm"><CreditCard size={16} className="mr-3 mx-1 text-emerald-500/70" /> <span>الدفعة المقدمة</span></div>}
            value={parseFloat(reservation.down_payment.toString())} 
            className="bg-emerald-50/50 p-3 rounded-lg hover:bg-emerald-50 transition-colors" 
          />
          <Statistic 
            title={<div className="flex items-center text-sm"><CreditCard size={16} className="mr-3 mx-1 text-amber-500/70" /> <span>عربون الحجز</span></div>}
            value={parseFloat(reservation.reservation_deposit.toString())} 
            className="bg-amber-50/50 p-3 rounded-lg hover:bg-amber-50 transition-colors" 
          />
          <Statistic 
            title={<div className="flex items-center text-sm"><Home size={16} className="mr-3 mx-1 text-purple-500/70" /> <span>رقم الوحدة</span></div>}
            value={reservation.unit.unit_number} 
            className="bg-purple-50/50 p-3 rounded-lg hover:bg-purple-50 transition-colors" 
          />
        </div>
      </Card>

      {/* Main Content - Tabbed Interface */}
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
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <Text>{reservation.unit.building?.project?.name || '-'}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Text strong className="ml-2 mr-2 text-gray-700">المبنى:</Text>
                    <Text>{reservation.unit.building?.name || '-'}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Text strong className="ml-2 mr-2 text-gray-700">رقم الوحدة:</Text>
                    <Text>{reservation.unit.unit_number || '-'}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Text strong className="ml-2 mr-2 text-gray-700">النوع:</Text>
                    <Text>{reservation.unit.unit_type || '-'}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Text strong className="ml-2 mr-2 text-gray-700">المساحة:</Text>
                    <Text>{reservation.unit.area ? `${reservation.unit.area} متر مربع` : '-'}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Text strong className="ml-2 mr-2 text-gray-700">عدد الغرف:</Text>
                    <Text>{reservation.unit.bedrooms || '-'}</Text>
                  </div>
                  <div className="flex items-center border-b pb-2 pt-1">
                    <Text strong className="ml-2 mr-2 text-gray-700">عدد الحمامات:</Text>
                    <Text>{reservation.unit.bathrooms || '-'}</Text>
                  </div>
                  <div className="flex items-center">
                    <Text strong className="ml-2 mr-2 text-gray-700">الحالة:</Text>
                    <Tag color={reservation.unit.status === 'متاح' ? 'green' : 'red'} style={{ padding: '0px 6px' }}>
                      {reservation.unit.status || '-'}
                    </Tag>
                  </div>
                </div>
              </Card>

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
              className="mb-4 shadow-sm hover:shadow-md transition-shadow"
            >
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
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <GenericTable
                data={reservation.approvals}
                columns={approvalsColumns}
                loading={loading}
                noDataMessage="لا توجد موافقات بعد"
                totalPages={1}
              />
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
          <div className="p-4">
            {/* Filter Pills */}
            <div className="mb-4 flex flex-wrap gap-2">
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
            
            {/* Attachments Grid */}
            <Card className="shadow-sm" bodyStyle={{ padding: '16px' }}>
              {filteredAttachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
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

      {/* Actions */}
      {reservation.status !== 'مباعة' && (
        <div className="flex justify-end mt-4">
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
            >
              حذف الحجز
            </Button>
          )}
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
        width={800}
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
      >
        <div className="p-4">
          <p>هل أنت متأكد من حذف هذا الحجز؟</p>
          <p className="mt-2 text-red-600">هذا الإجراء لا يمكن التراجع عنه.</p>
        </div>
      </Modal>
    </div>
  );
};

export default ReservationDetails;