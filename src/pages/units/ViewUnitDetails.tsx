import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'antd';
import toast from 'react-hot-toast';
import axiosInstance from '../../axiosInstance';
import UnitForm from '../../components/forms/UnitForm';
import GenericTable from '../../components/GenericTable';
import type { UnitFormData } from '../../types/forms';

export const ViewUnitDetails = () => {
  const navigate = useNavigate();
  const { unitId, projectId, buildingId } = useParams();
  const [initialData, setInitialData] = useState<UnitFormData | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnitData = async () => {
      try {
        const response = await axiosInstance.get(`/units/${unitId}`);
        setInitialData(response.data.data);
      } catch (error) {
        toast.error('حدث خطأ أثناء جلب بيانات الوحدة');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnitData();
  }, [unitId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const reservations = initialData?.reservations || [];

  const columns = [
    { header: 'رقم الحجز', key: 'id' },
    { header: 'رقم العميل', key: 'client_id' },
    { header: 'الحالة', key: 'status' },
    { header: 'تاريخ العقد', key: 'contract_date', render: (value: string) => new Date(value).toLocaleDateString() },
    { header: 'السعر النهائي', key: 'final_price' },
    { header: 'الدفعة المقدمة', key: 'down_payment' },
    { header: 'القسط الشهري', key: 'monthly_installment' },
    { header: 'عدد الأشهر', key: 'months_count' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">تفاصيل الوحدة</h1>
          <div className="space-x-2 space-x-reverse">
            <Button
              onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}/units/${unitId}/edit`)}
              type="primary"
              className="bg-blue-600 hover:bg-blue-700 ml-2"
            >
              تعديل
            </Button>
            <Button
              onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}`)}
              type="default"
              className="hover:bg-gray-200"
            >
              عودة
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <UnitForm
            initialData={initialData}
            isEdit={false}
            unitId={Number(unitId)}
            buildingId={Number(buildingId)}
            readOnly={true}
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">الحجوزات</h2>
          <GenericTable
            columns={columns}
            data={reservations as unknown as Record<string, unknown>[]}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default ViewUnitDetails;