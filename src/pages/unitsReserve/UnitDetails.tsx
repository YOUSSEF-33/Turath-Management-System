import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../axiosInstance'; // Adjust the import path as needed
import { Modal, Input, Button, message } from 'antd'; // Import Modal, Input, and Button from antd
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { GeneratePDF } from "../../components/PrintPDF"; // Import the GeneratePDF function
import GenericTable from '../../components/GenericTable';
import { usePermissionsContext } from '../../context/PermissionsContext'; // Import the PermissionsContext


const UnitDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for rejection modal
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // State for image modal
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [modalImages, setModalImages] = useState<any[]>([]);
  const [modalTitle, setModalTitle] = useState('');

  const [unitData, setUnitData] = useState<any>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [buildingName, setBuildingName] = useState<string>('');

  const { hasPermission } = usePermissionsContext(); // Get the hasPermission function from context

  useEffect(() => {
    const fetchData = async () => {
      try {
        
        const reservationResponse = await axiosInstance.get(`/reservations/${id}`);
        setReservation(reservationResponse.data.data);
        
        const unitResponse = await axiosInstance.get(`/units/${reservationResponse.data.data.unit_id}`);
        setUnitData(unitResponse.data.data);


      } catch (err) {
        setError('فشل في تحميل البيانات');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);



  const handleAcceptUnit = async () => {
    try {
      await axiosInstance.patch(`/reservations/${id}/approve`);
      message.success('تم قبول الحجز بنجاح');
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
      setIsRejectModalVisible(false); // Close the modal
    } catch (err) {
      message.error('فشل في رفض الحجز');
      console.error(err);
    }
  };


  const handleImageClick = (images: any[], title: string) => {
    setModalImages(images);
    setModalTitle(title);
    setIsImageModalVisible(true);
  };

  const handlePrintPDF = () => {
    GeneratePDF(
      {
        name: reservation.client.name,
        phone: reservation.client.phone,
        nationalId: reservation.client.nationalId,
        address: reservation.client.address,
        email: reservation.client.email,
        contractDate: new Date(reservation.contract_date).toLocaleDateString('ar-EG'),
        reservationDate: new Date(reservation.reservation_date).toLocaleDateString('ar-EG'),
      },
      {
        unit_number: reservation.unit.unit_number,
        unit_type: reservation.unit.unit_type,
        price: reservation.unit.price,
        area: reservation.unit.area,
        floor: reservation.unit.floor,
        bedrooms: reservation.unit.bedrooms,
        bathrooms: reservation.unit.bathrooms,
        downPayment: reservation.down_payment,
        monthlyInstallment: reservation.monthly_installment,
        finalPrice: reservation.final_price,
        months: reservation.months_count,
        reservationDeposit: reservation.reservation_deposit,
        plan_images: reservation.unit.plan_images,
        gallery: reservation.unit.gallery,
      },
      {
        nationalIdCard: reservation.national_id_images,
        reservation_deposit_receipt: reservation.reservation_deposit_receipt,
        attachments: reservation.attachments,
      }
    );
  };

  // Update the approvalsColumns to match the Column interface
  const approvalsColumns = [
    {
      key: 'role',
      header: 'الدور',
      render: (value: any, row: any) => row.role?.display_name || row.role?.name,
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (value: any, row: any) => {
        const statusColors: { [key: string]: string } = {
          'قيد الانتظار': 'text-yellow-500',
          'تم القبول': 'text-green-500',
          'تم الرفض': 'text-red-500',
        };
        return <span className={statusColors[row.status] || ''}>{row.status}</span>;
      },
    },
    {
      key: 'rejection_reason',
      header: 'سبب الرفض',
      render: (value: any, row: any) => row.rejection_reason || '-',
    },
  ];

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!reservation) {
    return <div className="p-6 text-center">لا توجد بيانات متاحة</div>;
  }


  return (
    <div className="p-6 bg-gray-50 md:m-4 md:rounded my-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">تفاصيل الحجز</h2>
        {hasPermission('view_reservations') && (
          <button
            onClick={handlePrintPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            طباعة الاستمارة
          </button>
        )}
      </div>

      {/* Client Information */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">بيانات العميل</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>الاسم:</strong> {reservation.client.name}
          </div>
          <div>
            <strong>البريد الإلكتروني:</strong> {reservation.client.email}
          </div>
          <div>
            <strong>رقم الهاتف:</strong> {reservation.client.phone}
          </div>
          <div>
            <strong>العنوان:</strong> {reservation.client.address}
          </div>
        </div>
      </div>

      {/* Unit Information */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">بيانات الوحدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <div>
            <strong>المشروع:</strong> {projectName}
          </div>
          <div>
            <strong>المبنى:</strong> {buildingName}
          </div> */}
          <div>
            <strong>رقم الوحدة:</strong> {reservation.unit.unit_number}
          </div>
          <div>
            <strong>النوع:</strong> {reservation.unit.unit_type}
          </div>
          <div>
            <strong>المساحة:</strong> {reservation.unit.area} متر مربع
          </div>
          <div>
            <strong>عدد الغرف:</strong> {reservation.unit.bedrooms}
          </div>
          <div>
            <strong>عدد الحمامات:</strong> {reservation.unit.bathrooms}
          </div>
          <div>
            <strong>الحالة:</strong> {reservation.unit.status}
          </div>
        </div>
      </div>

      {/* Reservation Details */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">تفاصيل الحجز</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>السعر النهائي:</strong> {reservation.final_price} جنيه
          </div>
          <div>
            <strong>عربون الحجز:</strong> {reservation.reservation_deposit} جنيه
          </div>
          <div>
            <strong>الدفعة المقدمة:</strong> {reservation.down_payment} جنيه
          </div>
          <div>
            <strong>القسط الشهري:</strong> {reservation.monthly_installment} جنيه
          </div>
          <div>
            <strong>عدد الشهور:</strong> {reservation.months_count}
          </div>
          <div>
            <strong>تاريخ التعاقد:</strong> {new Date(reservation.contract_date).toLocaleDateString('ar-EG')}
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">الصور</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* National ID Images */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-2">صور البطاقة الشخصية</h4>
            <Swiper
              spaceBetween={10}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
            >
              {reservation.national_id_images.map((image: any) => (
                <SwiperSlide key={image.id}>
                  <img
                    src={image.medium_url}
                    alt={image.name}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => handleImageClick(reservation.national_id_images, 'صور البطاقة الشخصية')}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Plan Images */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-2">صور المخطط</h4>
            <Swiper
              spaceBetween={10}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
            >
              {reservation.unit.plan_images.map((image: any) => (
                <SwiperSlide key={image.id}>
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => handleImageClick(reservation.unit.plan_images, 'صور المخطط')}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Gallery Images */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-2">معرض الصور</h4>
            <Swiper
              spaceBetween={10}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
            >
              {reservation.unit.gallery.map((image: any) => (
                <SwiperSlide key={image.id}>
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => handleImageClick(reservation.unit.gallery, 'معرض الصور')}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Reservation Deposit Receipt */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-2">إيصال السداد</h4>
            <div className="border p-2 rounded-lg">
              {reservation.reservation_deposit_receipt.url.endsWith('.pdf') ? (
                <a
                  href={reservation.reservation_deposit_receipt.url}
                  download={reservation.reservation_deposit_receipt.name}
                  className="text-blue-600 hover:underline"
                >
                  تحميل إيصال السداد
                </a>
              ) : (
                <img
                  src={reservation.reservation_deposit_receipt.url}
                  alt={reservation.reservation_deposit_receipt.name}
                  className="w-full h-48 object-cover rounded-lg cursor-pointer"
                  onClick={() => handleImageClick([reservation.reservation_deposit_receipt], 'إيصال السداد')}
                />
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-2">المرفقات</h4>
            <Swiper
              spaceBetween={10}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
            >
              {reservation.attachments.map((attachment: any) => (
                <SwiperSlide key={attachment.id}>
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => handleImageClick(reservation.attachments, 'المرفقات')}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>

      {/* Approvals Section */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">الموافقات</h3>
        <GenericTable
          data={reservation.approvals}
          columns={approvalsColumns}
          loading={loading}
          noDataMessage="لا توجد موافقات بعد"
          totalPages={1}
        />
      </div>

      {/* Actions */}
      {reservation.status === 'معلق' && (
        <div className="flex space-x-4">
          {hasPermission('confirm_reservations') && (
            <button
              onClick={handleAcceptUnit}
              className="mx-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              قبول
            </button>
          )}
          {hasPermission('cancel_reservations') && (
            <button
              onClick={() => setIsRejectModalVisible(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              رفض
            </button>
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
          <Button key="submit" type="primary" onClick={handleRejectUnit}>
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

      {/* Image Modal */}
      <Modal
        title={modalTitle}
        visible={isImageModalVisible}
        onCancel={() => setIsImageModalVisible(false)}
        footer={null}
        width={800}
      >
        <Swiper
          spaceBetween={10}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
        >
          {modalImages.map((image: any, index: number) => (
            <SwiperSlide key={index}>
              <img src={image.url || image.medium_url} alt={image.name} className="w-full h-96 object-cover rounded-lg" />
            </SwiperSlide>
          ))}
        </Swiper>
      </Modal>
    </div>
  );
};

export default UnitDetails;