import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import { Modal, Input, Button, message, Spin, Card, Tag, Descriptions, Empty } from 'antd';
import GenericTable from '../../components/GenericTable';
import { usePermissionsContext } from '../../context/PermissionsContext';
import MediaViewer from '../../components/MediaViewer';
import { Check, X, Printer, RefreshCw } from 'lucide-react';
import { isImageFile } from '../../utils/mediaUtils';

interface ImageData {
  id: number;
  name: string;
  url: string;
  medium_url?: string;
  small_url?: string;
}

interface ClientData {
  name: string;
  email: string;
  phone: string;
  address: string;
  nationalId: string;
  job: string;
  nationality: string;
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
      display_name: string;
      name: string;
    };
    status: string;
    rejection_reason?: string;
  }>;
}

interface Column {
  key: string;
  header: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

const ReservationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);

  // State for rejection modal
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { hasPermission } = usePermissionsContext();

  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const reservationResponse = await axiosInstance.get(`/reservations/${id}`);
      setReservation(reservationResponse.data.data);
      
      // Set a featured image (first select from unit gallery, then from attachments)
      const allImages = [
        ...(reservationResponse.data.data.unit.gallery || []),
        ...(reservationResponse.data.data.attachments || []),
        ...(reservationResponse.data.data.national_id_images || [])
      ];
      
      // Find first image that's not a Google Drive PDF
      const filteredImages = allImages.filter(img => 
        isImageFile(img.url) && (img.medium_url || img.url)
      );
      
      if (filteredImages.length > 0) {
        setFeaturedImage(filteredImages[0].medium_url || filteredImages[0].url);
      }
      
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
    try {
      await axiosInstance.patch(`/reservations/${id}/approve`);
      message.success('تم قبول الحجز بنجاح');
      fetchData(); // Refresh data after approval
    } catch (err) {
      message.error('فشل في قبول الحجز');
      console.error(err);
    }
  };

  const handleRejectUnit = async () => {
    if (!rejectionReason) {
      message.warning('يرجى إدخال سبب الرفض');
      return;
    }

    try {
      await axiosInstance.post(`/reservations/${id}/reject`, {
        rejection_reason: rejectionReason,
      });
      message.success('تم رفض الحجز بنجاح');
      setIsRejectModalVisible(false);
      fetchData(); // Refresh data after rejection
    } catch (err) {
      message.error('فشل في رفض الحجز');
      console.error(err);
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
      link.target = '_blank';
      link.click();
      
      // Clean up
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error('Error fetching PDF:', err);
      message.error('فشل في تحميل ملف PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG').format(amount) + ' جنيه';
  };

  const approvalsColumns: Column[] = [
    {
      key: 'role',
      header: 'الدور',
      render: (_, row: Record<string, unknown>) => 
        (row.role as { display_name?: string; name?: string })?.display_name || 
        (row.role as { display_name?: string; name?: string })?.name || '-',
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
        } else if (status === 'تم القبول') {
          color = 'green';
          icon = <Check size={16} className="inline mr-1" />;
        } else if (status === 'تم الرفض') {
          color = 'red';
          icon = <X size={16} className="inline mr-1" />;
        }
        
        return <Tag color={color}>{icon}{status}</Tag>;
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

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <Card 
        className="mb-6 overflow-hidden" 
        title={
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-gray-800 m-0">تفاصيل الحجز</h2>
              <Tag className="mr-3" color={reservationStatusColor}>{reservation.status}</Tag>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              {hasPermission('view_reservations') && (
                <Button 
                  type="primary"
                  icon={<Printer size={16} />} 
                  onClick={handlePrintPDF}
                  className="flex items-center"
                  loading={pdfLoading}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? 'جاري التحميل...' : 'طباعة الاستمارة'}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {/* Featured Image (if available) */}
        {featuredImage && (
          <div className="mb-6 text-center">
            <div className="relative rounded-lg overflow-hidden h-[300px] mx-auto max-w-2xl bg-gray-100">
              <img 
                src={featuredImage} 
                alt="صورة الوحدة" 
                className="object-contain h-full w-full" 
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Information */}
          <Card type="inner" title="بيانات العميل" className="mb-0">
            <Descriptions column={{ xs: 1, sm: 2 }} layout="vertical" bordered size="small">
              <Descriptions.Item label="الاسم">{reservation.client.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="البريد الإلكتروني">{reservation.client.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="رقم الهاتف">{reservation.client.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="العنوان">{reservation.client.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="رقم البطاقة">{reservation.client.nationalId || '-'}</Descriptions.Item>
              <Descriptions.Item label="الوظيفة">{reservation.client.job || '-'}</Descriptions.Item>
              <Descriptions.Item label="الجنسية" span={2}>{reservation.client.nationality || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Unit Information */}
          <Card type="inner" title="بيانات الوحدة" className="mb-0">
            <Descriptions column={{ xs: 1, sm: 2 }} layout="vertical" bordered size="small">
              <Descriptions.Item label="رقم الوحدة">{reservation.unit.unit_number || '-'}</Descriptions.Item>
              <Descriptions.Item label="النوع">{reservation.unit.unit_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="المساحة">{reservation.unit.area ? `${reservation.unit.area} متر مربع` : '-'}</Descriptions.Item>
              <Descriptions.Item label="عدد الغرف">{reservation.unit.bedrooms || '-'}</Descriptions.Item>
              <Descriptions.Item label="عدد الحمامات">{reservation.unit.bathrooms || '-'}</Descriptions.Item>
              <Descriptions.Item label="الحالة">
                <Tag color={reservation.unit.status === 'متاح' ? 'green' : 'red'}>
                  {reservation.unit.status || '-'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        {/* Reservation Details */}
        <Card type="inner" title="تفاصيل الحجز" className="mt-6">
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} layout="vertical" bordered size="small">
            <Descriptions.Item label="السعر النهائي">{formatCurrency(reservation.final_price)}</Descriptions.Item>
            <Descriptions.Item label="عربون الحجز">{formatCurrency(reservation.reservation_deposit)}</Descriptions.Item>
            <Descriptions.Item label="الدفعة المقدمة">{formatCurrency(reservation.down_payment)}</Descriptions.Item>
            <Descriptions.Item label="القسط الشهري">{formatCurrency(reservation.monthly_installment)}</Descriptions.Item>
            <Descriptions.Item label="عدد الشهور">{reservation.months_count}</Descriptions.Item>
            <Descriptions.Item label="تاريخ التعاقد">{new Date(reservation.contract_date).toLocaleDateString('ar-EG')}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Card>

      {/* Images Section */}
      <Card title="الصور والملفات" className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unit Gallery */}
          {reservation.unit.gallery && reservation.unit.gallery.length > 0 && (
            <Card type="inner" title="معرض الوحدة" className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {reservation.unit.gallery.map((image) => (
                  <div key={image.id} className="relative group">
                    <MediaViewer
                      url={image.medium_url || image.url}
                      title={image.name || "صورة الوحدة"}
                      className="h-24 w-full object-cover rounded-lg border border-gray-200"
                    />
                    <div className="mt-1 text-xs text-gray-500 truncate">{image.name}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Unit Plans */}
          {reservation.unit.plan_images && reservation.unit.plan_images.length > 0 && (
            <Card type="inner" title="مخططات الوحدة" className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {reservation.unit.plan_images.map((image) => (
                  <div key={image.id} className="relative group">
                    <MediaViewer
                      url={image.medium_url || image.url}
                      title={image.name || "مخطط الوحدة"}
                      className="h-24 w-full object-cover rounded-lg border border-gray-200"
                    />
                    <div className="mt-1 text-xs text-gray-500 truncate">{image.name}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* National ID Images */}
          <Card type="inner" title="صور البطاقة الشخصية" className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {reservation.national_id_images.length > 0 ? (
                reservation.national_id_images.map((image) => (
                  <div key={image.id} className="relative group">
                    <MediaViewer
                      url={image.medium_url || image.url}
                      title={image.name || "صورة البطاقة"}
                      className="h-24 w-full object-cover rounded-lg border border-gray-200"
                    />
                    <div className="mt-1 text-xs text-gray-500 truncate">{image.name}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-4 text-gray-500">
                  لا توجد صور للبطاقة الشخصية
                </div>
              )}
            </div>
          </Card>

          {/* Reservation Deposit Receipt */}
          <Card type="inner" title="إيصال السداد" className="mb-6">
            {reservation.reservation_deposit_receipt ? (
              <div className="relative group">
                <MediaViewer
                  url={reservation.reservation_deposit_receipt.medium_url || reservation.reservation_deposit_receipt.url}
                  title={reservation.reservation_deposit_receipt.name || "إيصال السداد"}
                  className="h-48 w-full object-contain rounded-lg border border-gray-200"
                />
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {reservation.reservation_deposit_receipt.name}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                لا يوجد إيصال سداد
              </div>
            )}
          </Card>

          {/* Attachments */}
          <Card type="inner" title="المرفقات" className="mb-6 col-span-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {reservation.attachments.length > 0 ? (
                reservation.attachments.map((attachment) => (
                  <div key={attachment.id} className="relative group">
                    <MediaViewer
                      url={attachment.medium_url || attachment.url}
                      title={attachment.name || "مرفق"}
                      className="h-24 w-full object-cover rounded-lg border border-gray-200"
                    />
                    <div className="mt-1 text-xs text-gray-500 truncate">{attachment.name}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-4 text-gray-500">
                  لا توجد مرفقات
                </div>
              )}
            </div>
          </Card>
        </div>
      </Card>

      {/* Approvals Section */}
      <Card title="الموافقات" className="mb-6">
        <GenericTable
          data={reservation.approvals}
          columns={approvalsColumns}
          loading={loading}
          noDataMessage="لا توجد موافقات بعد"
          totalPages={1}
        />
      </Card>

      {/* Actions */}
      {reservation.status === 'معلق' && (
        <div className="flex justify-end">
          {hasPermission('confirm_reservations') && (
            <Button
              type="primary"
              onClick={handleAcceptUnit}
              icon={<Check size={16} />}
              className="mx-2 bg-green-600 hover:bg-green-700"
            >
              قبول الحجز
            </Button>
          )}
          {hasPermission('cancel_reservations') && (
            <Button
              danger
              onClick={() => setIsRejectModalVisible(true)}
              icon={<X size={16} />}
            >
              رفض الحجز
            </Button>
          )}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        title="سبب الرفض"
        visible={isRejectModalVisible}
        onCancel={() => setIsRejectModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsRejectModalVisible(false)}>
            إلغاء
          </Button>,
          <Button key="submit" danger type="primary" onClick={handleRejectUnit}>
            تأكيد الرفض
          </Button>,
        ]}
      >
        <Input.TextArea
          placeholder="أدخل سبب الرفض"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default ReservationDetails;