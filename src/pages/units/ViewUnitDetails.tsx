import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Tabs } from 'antd';
import toast from 'react-hot-toast';
import axiosInstance from '../../axiosInstance';
import MediaViewer from '../../components/MediaViewer';
import ReservationsTable from '../../components/ReservationsTable';
import type { ExtendedUnitFormData } from '../../types/forms';
import type { UploadFile } from 'antd/es/upload/interface';

interface ImageData {
  id?: number;
  name?: string;
  url: string;
  small_url?: string;
  medium_url?: string;
}

export const ViewUnitDetails = () => {
  const navigate = useNavigate();
  const { unitId, projectId, buildingId } = useParams();
  const [initialData, setInitialData] = useState<ExtendedUnitFormData | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    const fetchUnitData = async () => {
      try {
        const response = await axiosInstance.get(`/units/${unitId}`);
        const data = response.data.data;
        
        // Convert image data to UploadFile format
        const convertToUploadFile = (image: ImageData, index: number): UploadFile => ({
          uid: `image-${image.id || index}`,
          name: image.name || `Image-${index}`,
          status: 'done',
          url: image.url,
          thumbUrl: image.small_url || image.url,
        });

        // Convert the response data to ExtendedUnitFormData format
        const extendedData: ExtendedUnitFormData = {
          ...data,
          plan_images: (data.plan_images || []).map(convertToUploadFile),
          location_in_brochure: (data.location_in_brochure || []).map(convertToUploadFile),
          gallery: (data.gallery || []).map(convertToUploadFile),
        };
        setInitialData(extendedData);
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
  
  // Get files from UploadFile[] format
  const planImages = initialData?.plan_images || [];
  const galleryImages = initialData?.gallery || [];
  const locationFiles = initialData?.location_in_brochure || [];

  const items = [
    {
      key: '1',
      label: 'معلومات الوحدة',
      children: (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-5">بيانات الوحدة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-b pb-4">
              <h4 className="text-gray-600 mb-2">رقم الوحدة</h4>
              <p className="text-lg font-medium">{initialData?.unit_number || '-'}</p>
            </div>
            <div className="border-b pb-4">
              <h4 className="text-gray-600 mb-2">نوع الوحدة</h4>
              <p className="text-lg font-medium">{initialData?.unit_type || '-'}</p>
            </div>
            <div className="border-b pb-4">
              <h4 className="text-gray-600 mb-2">السعر</h4>
              <p className="text-lg font-medium">{initialData?.price ? `${initialData.price} جنيه` : '-'}</p>
            </div>
            <div className="border-b pb-4">
              <h4 className="text-gray-600 mb-2">المساحة</h4>
              <p className="text-lg font-medium">{initialData?.area ? `${initialData.area} م²` : '-'}</p>
            </div>
            <div className="border-b pb-4">
              <h4 className="text-gray-600 mb-2">الطابق</h4>
              <p className="text-lg font-medium">{initialData?.floor || '-'}</p>
            </div>
            <div className="border-b pb-4">
              <h4 className="text-gray-600 mb-2">عدد غرف النوم</h4>
              <p className="text-lg font-medium">{initialData?.bedrooms || '-'}</p>
            </div>
            <div className="border-b pb-4">
              <h4 className="text-gray-600 mb-2">عدد الحمامات</h4>
              <p className="text-lg font-medium">{initialData?.bathrooms || '-'}</p>
            </div>
            <div className="border-b pb-4">
              <h4 className="text-gray-600 mb-2">الحالة</h4>
              <p className="text-lg font-medium">{initialData?.status || '-'}</p>
            </div>
          </div>
          
          {initialData?.description && (
            <div className="mt-6">
              <h4 className="text-gray-600 mb-2">الوصف</h4>
              <p className="text-base">{initialData.description}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: '2',
      label: 'مخططات الوحدة',
      children: (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-5">مخططات الوحدة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planImages.map((image, index) => (
              <div key={`plan-${index}`} className="flex flex-col">
                <MediaViewer
                  url={image.url || ''}
                  title={image.name || `مخطط ${index + 1}`}
                  className="h-60 w-full"
                />
                <p className="mt-2 text-center font-medium text-gray-700 truncate px-2">
                  {image.name || `مخطط ${index + 1}`}
                </p>
              </div>
            ))}
            {planImages.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                لا توجد مخططات متاحة
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: '3',
      label: 'الموقع على المخطط',
      children: (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-5">الموقع على المخطط</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locationFiles.map((file: UploadFile, index: number) => (
              <div key={`location-${index}`} className="flex flex-col">
                <MediaViewer
                  url={file.url || ''}
                  title={file.name || `موقع الوحدة ${index + 1}`}
                  className="h-60 w-full"
                />
                <p className="mt-2 text-center font-medium text-gray-700 truncate px-2">
                  {file.name || `موقع الوحدة ${index + 1}`}
                </p>
              </div>
            ))}
            {locationFiles.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                لا توجد مواقع متاحة على المخطط
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: '4',
      label: 'مرفقات أخرى',
      children: (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-5">مرفقات أخرى</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((image, index) => (
              <div key={`gallery-${index}`} className="flex flex-col">
                <MediaViewer
                  url={image.url || ''}
                  title={image.name || `مرفق ${index + 1}`}
                  className="h-60 w-full"
                />
                <p className="mt-2 text-center font-medium text-gray-700 truncate px-2">
                  {image.name || `مرفق ${index + 1}`}
                </p>
              </div>
            ))}
            {galleryImages.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                لا توجد مرفقات أخرى متاحة
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: '5',
      label: 'الحجوزات',
      children: (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-5">الحجوزات</h3>
          <ReservationsTable 
            reservations={reservations} 
            loading={loading}
            showUnitColumn={false} // Hide unit column since we're already in the unit details
            noDataMessage="لا توجد حجوزات لهذه الوحدة"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">تفاصيل الوحدة</h1>
          <div className="space-x-2 space-x-reverse">
            {/* <Button
              onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}/units/${unitId}/edit`)}
              type="primary"
              className="bg-blue-600 hover:bg-blue-700 ml-2"
            >
              تعديل
            </Button> */}
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
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          className="bg-white rounded-lg shadow-md p-4 mb-8"
          tabBarStyle={{ marginBottom: 20 }}
          type="card"
        />
      </div>
    </div>
  );
};

export default ViewUnitDetails;