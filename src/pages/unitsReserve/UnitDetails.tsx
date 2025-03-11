import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../axiosInstance'; // Adjust the import path as needed
import { Modal, Input, Button, message } from 'antd'; // Import Modal, Input, and Button from antd

const UnitDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for rejection modal
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const response = await axiosInstance.get(`/reservations/${id}`);
        setReservation(response.data.data);
      } catch (err) {
        setError('فشل في تحميل بيانات الحجز');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id]);

  const handleAcceptUnit = async () => {
    try {
      await axiosInstance.patch(`/reservations/${id}/approve`);
      message.success('تم قبول الحجز بنجاح');
      navigate('/reservations'); // Redirect to reservations list or another page
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
      navigate('/reservations'); // Redirect to reservations list or another page
    } catch (err) {
      message.error('فشل في رفض الحجز');
      console.error(err);
    }
  };

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
      <h2 className="text-xl font-semibold text-gray-800 mb-4">تفاصيل الحجز</h2>

      {/* Client Information */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">بيانات العميل</h3>
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
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">بيانات الوحدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">تفاصيل الحجز</h3>
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
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">الصور</h3>

        {/* National ID Images */}
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-700 mb-2">صور البطاقة الشخصية</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservation.national_id_images.map((image: any) => (
              <div key={image.id} className="border p-2 rounded-lg">
                <img src={image.medium_url} alt={image.name} className="w-full h-auto rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Plan Images */}
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-700 mb-2">صور المخطط</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservation.unit.plan_images.map((image: any) => (
              <div key={image.id} className="border p-2 rounded-lg">
                <img src={image.url} alt={image.name} className="w-full h-auto rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Gallery Images */}
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-700 mb-2">معرض الصور</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservation.unit.gallery.map((image: any) => (
              <div key={image.id} className="border p-2 rounded-lg">
                <img src={image.url} alt={image.name} className="w-full h-auto rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Reservation Deposit Receipt */}
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-700 mb-2">إيصال السداد</h4>
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
                className=" h-auto rounded-lg"
              />
            )}
          </div>
        </div>

        {/* Attachments */}
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-700 mb-2">المرفقات</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservation.attachments.map((attachment: any) => (
              <div key={attachment.id} className="border p-2 rounded-lg">
                <img src={attachment.url} alt={attachment.name} className="w-full h-auto rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      {reservation.status === 'معلق' && (
        <div className="flex space-x-4">
          <button
            onClick={handleAcceptUnit}
            className="mx-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            قبول
          </button>
          <button
            onClick={() => setIsRejectModalVisible(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            رفض
          </button>
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
    </div>
  );
};

export default UnitDetails;