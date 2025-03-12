import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../axiosInstance';
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

const EditUnit = () => {
  const navigate = useNavigate();
  const { unitId: id } = useParams();

  const [unitData, setUnitData] = useState({
    id: '',
    building_id: '',
    unit_number: '',
    unit_type: 'apartment',
    price: '',
    status: 'available',
    area: '',
    floor: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
    created_at: '',
    updated_at: '',
    gallery: [] as any[],      // Array of existing gallery images from API
    plan_images: [] as any[],  // Array of existing plan images from API
  });

  // Controlled file lists for Ant Design Upload components.
  const [galleryFileList, setGalleryFileList] = useState<any[]>([]);
  const [planImagesFileList, setPlanImagesFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    const fetchUnitData = async () => {
      try {
        const response = await axiosInstance.get(`/units/${id}`);
        const data = response.data.data;
        setUnitData(data);

        // Map existing gallery images into Upload file objects.
        if (data.gallery && Array.isArray(data.gallery)) {
          const mappedGallery = data.gallery.map((img: any, index: number) => ({
            uid: `gallery-${index}`,
            name: `gallery-image-${index}`,
            status: 'done',
            url: img.medium_url, // using medium_url for display
            thumbUrl: img.small_url,
          }));
          setGalleryFileList(mappedGallery);
        }

        // Map existing plan images similarly.
        if (data.plan_images && Array.isArray(data.plan_images)) {
          const mappedPlanImages = data.plan_images.map((img: any, index: number) => ({
            uid: `plan-${index}`,
            name: `plan-image-${index}`,
            status: 'done',
            url: img.medium_url,
            thumbUrl: img.small_url,
          }));
          setPlanImagesFileList(mappedPlanImages);
        }
      } catch (error) {
        toast.error('حدث خطأ أثناء جلب بيانات الوحدة');
        console.log(error);
      }
    };

    fetchUnitData();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setUnitData({ ...unitData, [e.target.name]: e.target.value });
  };

  // Helper function to convert an existing image URL into a File object.
  const urlToFile = async (url: string, filename: string): Promise<File> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    return new File([blob], filename, { type: mimeType });
  };

  // Given a file item from the Upload fileList, return a File object.
  // If the file was newly added, it already has originFileObj.
  // Otherwise, we convert its URL to a File.
  const convertFile = async (file: any, fallbackName: string): Promise<File> => {
    if (file.originFileObj) {
      return file.originFileObj;
    } else if (file.url) {
      try {
        return await urlToFile(file.url, fallbackName);
      } catch (error) {
        console.error('Error converting URL to file:', error);
        throw error;
      }
    }
    throw new Error('No valid file data');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();

    // Append text fields.
    formData.append('unit_number', unitData.unit_number);
    formData.append('unit_type', unitData.unit_type);
    formData.append('building_id', unitData.building_id);
    formData.append('area', unitData.area);
    formData.append('price', unitData.price);
    formData.append('status', unitData.status);
    formData.append('floor', unitData.floor);
    formData.append('bedrooms', unitData.bedrooms);
    formData.append('bathrooms', unitData.bathrooms);
    formData.append('description', unitData.description);

    try {
      // Process gallery images: convert each file (new or old) to a File object.
      const convertedGalleryFiles = await Promise.all(
        galleryFileList.map((file: any, index: number) =>
          convertFile(file, `gallery-image-${index}`)
        )
      );
      convertedGalleryFiles.forEach((file: File, index: number) => {
        formData.append(`gallery[${index}]`, file);
      });

      // Process plan images similarly.
      const convertedPlanImages = await Promise.all(
        planImagesFileList.map((file: any, index: number) =>
          convertFile(file, `plan-image-${index}`)
        )
      );
      convertedPlanImages.forEach((file: File, index: number) => {
        formData.append(`plan_images[${index}]`, file);
      });

      // Use _method PUT if required by your backend.
      formData.append('_method', 'PUT');

      await axiosInstance.post(`/units/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('تم تحديث بيانات الوحدة بنجاح');
      navigate(-1);
    } catch (error: any) {
      toast.error('حدث خطأ أثناء تحديث بيانات الوحدة');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const galleryProps = {
    fileList: galleryFileList,
    multiple: true,
    beforeUpload: (file: File) => false, // Prevent auto-upload
    onChange(info: any) {
      setGalleryFileList(info.fileList);
    },
  };

  const planImagesProps = {
    fileList: planImagesFileList,
    multiple: true,
    beforeUpload: (file: File) => false,
    onChange(info: any) {
      setPlanImagesFileList(info.fileList);
    },
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">تعديل الوحدة</h1>
          <button
            onClick={() => navigate('/units')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            عودة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg p-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم الوحدة
            </label>
            <input
              type="text"
              name="unit_number"
              value={unitData.unit_number}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              النوع
            </label>
            <select
              name="unit_type"
              value={unitData.unit_type}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="villa">فيلا</option>
              <option value="duplex">دوبلكس</option>
              <option value="apartment">شقة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المساحة (م²)
            </label>
            <input
              type="text"
              name="area"
              value={unitData.area}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              السعر (جنيه)
            </label>
            <input
              type="number"
              name="price"
              value={unitData.price}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحالة
            </label>
            <select
              name="status"
              value={unitData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="available">متاح</option>
              <option value="occupied">مشغول</option>
              <option value="maintenance">صيانة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الطابق
            </label>
            <input
              type="number"
              name="floor"
              value={unitData.floor}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              غرف النوم
            </label>
            <input
              type="number"
              name="bedrooms"
              value={unitData.bedrooms}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحمامات
            </label>
            <input
              type="number"
              name="bathrooms"
              value={unitData.bathrooms}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الوصف
            </label>
            <textarea
              name="description"
              value={unitData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Gallery Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              معرض الصور
            </label>
            <Dragger {...galleryProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                انقر أو اسحب الملفات إلى هذه المنطقة للتحميل
              </p>
              <p className="ant-upload-hint">يمكنك تحميل ملفات متعددة</p>
            </Dragger>
          </div>

          {/* Plan Images Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              صور المخطط
            </label>
            <Dragger {...planImagesProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                انقر أو اسحب الملفات إلى هذه المنطقة للتحميل
              </p>
              <p className="ant-upload-hint">يمكنك تحميل ملفات متعددة</p>
            </Dragger>
          </div>

          {/* Form Actions */}
          <div className="md:col-span-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/units')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 ${loading ? 'loader' : ''}`}
              disabled={loading}
            >
              {loading ? '' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUnit;
