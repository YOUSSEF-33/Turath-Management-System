import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../axiosInstance';
import { untisValidation } from './UnitsValidatoin';
import { InputField } from '../../components/InputField';
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadChangeParam, UploadFile } from 'antd/lib/upload/interface';

const { Dragger } = Upload;

const CreateUnit = () => {
  const { projectId, buildingId } = useParams();
  const navigate = useNavigate();
  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState('villa');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [floor, setFloor] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gallery, setGallery] = useState<File[]>([]);
  const [planImages, setPlanImages] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    if (!unitNumber.trim() || !price.trim() || !area.trim()) {
      toast.error('يرجى تعبئة الحقول المطلوبة: رقم الوحدة، السعر، والمساحة. والصور');
      setLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('building_id', buildingId || "");
    formData.append('unit_number', unitNumber);
    formData.append('unit_type', unitType);
    formData.append('price', price);
    formData.append('area', area);
    formData.append('floor', floor);
    formData.append('bedrooms', bedrooms);
    formData.append('bathrooms', bathrooms);
    formData.append('description', description);

    gallery.forEach((file, index) => {
      formData.append(`gallery[${index}]`, file);
    });

    planImages.forEach((file, index) => {
      formData.append(`plan_images[${index}]`, file);
    });

    try {
      await axiosInstance.post('/units', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('تم إضافة الوحدة بنجاح');
      navigate(`/projects/${projectId}/buildings/${buildingId}`);
    } catch (error: unknown) {
      const err = error as { response?: { status: number; data: { errors: Record<string, string> } } };
      if (err.response && err.response.status === 422) {
        const translatedErrors: Record<string, string> = {};
        for (const [key, value] of Object.entries(err.response.data.errors)) {
          translatedErrors[key] = untisValidation(key, value);
        }
        setErrors(translatedErrors);
        toast.error('حدث خطأ أثناء إضافة الوحدة');
      } else {
        toast.error('حدث خطأ أثناء إضافة الوحدة');
      }
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const galleryProps = {
    name: 'gallery',
    multiple: true,
    beforeUpload: (_: File) => false,
    onChange: (info: UploadChangeParam<File>) => {
      const files = info.fileList.map((f: UploadFile<File>) => f.originFileObj).filter(Boolean) as File[];
      setGallery(files);
    },
  };

  const planImagesProps = {
    name: 'plan_images',
    multiple: true,
    beforeUpload: (_: File) => false,
    onChange: (info: UploadChangeParam<File>) => {
      const files = info.fileList.map((f: UploadFile<File>) => f.originFileObj).filter(Boolean) as File[];
      setPlanImages(files);
    },
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">إضافة وحدة جديدة</h1>
          <button
            onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}`)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            عودة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Unit Number */}
          <div className="my-4">
            <InputField
              label="رقم الوحدة *"
              type="text"
              value={unitNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnitNumber(e.target.value)}
              placeholder=""
              disabled={false}
            />
            {errors.unit_number && <p className="text-red-500 text-sm">{errors.unit_number}</p>}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Unit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع *</label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="villa">فيلا</option>
                <option value="duplex">دوبلكس</option>
                <option value="apartment">شقة</option>
              </select>
              {errors.unit_type && <p className="text-red-500 text-sm">{errors.unit_type}</p>}
            </div>

            {/* Unit Area */}
            <div>
              <InputField
                label="المساحة (م²) *"
                type="number"
                value={area}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArea(e.target.value)}
                placeholder=""
                disabled={false}
              />
              {errors.area && <p className="text-red-500 text-sm">{errors.area}</p>}
            </div>

            {/* Unit Price */}
            <div>
              <InputField
                label="السعر (جنيه) *"
                type="number"
                value={price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
                placeholder=""
                disabled={false}
              />
              {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
            </div>

            {/* Floor */}
            <div>
              <InputField
                label="الطابق"
                type="number"
                value={floor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFloor(e.target.value)}
                placeholder=""
                disabled={false}
              />
              {errors.floor && <p className="text-red-500 text-sm">{errors.floor}</p>}
            </div>

            {/* Bedrooms */}
            <div>
              <InputField
                label="غرف النوم"
                type="number"
                value={bedrooms}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBedrooms(e.target.value)}
                placeholder=""
                disabled={false}
              />
              {errors.bedrooms && <p className="text-red-500 text-sm">{errors.bedrooms}</p>}
            </div>

            {/* Bathrooms */}
            <div>
              <InputField
                label="الحمامات"
                type="number"
                value={bathrooms}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBathrooms(e.target.value)}
                placeholder=""
                disabled={false}
              />
              {errors.bathrooms && <p className="text-red-500 text-sm">{errors.bathrooms}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            {/* Gallery */}
            <div className="md:col-span-2" style={{ marginBottom: '50px' }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">معرض الصور</label>
              <Dragger {...galleryProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">انقر أو اسحب الملفات إلى هذه المنطقة للتحميل</p>
                <p className="ant-upload-hint">يمكنك تحميل ملفات متعددة</p>
              </Dragger>
              {errors.gallery && <p className="text-red-500 text-sm">{errors.gallery}</p>}
            </div>

            {/* Plan Images */}
            <div className="md:col-span-2" style={{ marginBottom: '50px' }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">صور المخطط *</label>
              <Dragger {...planImagesProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">انقر أو اسحب الملفات إلى هذه المنطقة للتحميل</p>
                <p className="ant-upload-hint">يمكنك تحميل ملفات متعددة</p>
              </Dragger>
              {errors.plan_images && <p className="text-red-500 text-sm">{errors.plan_images}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}`)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 ${loading ? 'loader' : ''}`}
              disabled={loading}
            >
              {loading ? '' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUnit;
