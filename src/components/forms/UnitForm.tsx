import React, { useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { unitValidationSchema } from '../../utils/validation';
import { useApiMutation, useApiGet } from '../../utils/hooks';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, Button, Modal, message, Form } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { UnitFormData } from '../../types/forms';

// Extend UnitFormData to include file status fields with required file arrays
export type ExtendedUnitFormData = UnitFormData & {
  status?: string;
  plan_images: UploadFile[];
  gallery: UploadFile[];
};

// Interface for API image objects
interface ImageData {
  id?: number;
  name?: string;
  small_url?: string;
  medium_url?: string;
  url: string;
  disk?: string;
}

interface UnitFormProps {
  initialData?: ExtendedUnitFormData;
  isEdit?: boolean;
  unitId?: number;
  buildingId?: number;
  // When readOnly is true, all inputs (including file uploads) are disabled.
  readOnly?: boolean;
}

const UnitForm: React.FC<UnitFormProps> = ({
  initialData,
  isEdit = false,
  unitId,
  buildingId: defaultBuildingId,
  readOnly = false,
}) => {
  const navigate = useNavigate();
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ExtendedUnitFormData>({
    resolver: yupResolver(unitValidationSchema) as unknown as Resolver<ExtendedUnitFormData>,
    defaultValues: {
      ...(initialData || {}),
      building_id: defaultBuildingId,
      plan_images: initialData?.plan_images || [],
      gallery: initialData?.gallery || []
    },
  });

  const { data: buildings, loading: loadingBuildings } = useApiGet<{ id: number; name: string }[]>({
    url: '/buildings',
    dependencies: [],
  });

  const { mutate: submitUnit, loading: isLoading } = useApiMutation({
    url: isEdit ? `/units/${unitId}` : '/units',
    method: isEdit ? 'PUT' : 'POST',
    onSuccess: () => {
      toast.success(isEdit ? 'تم تحديث الوحدة بنجاح' : 'تم إنشاء الوحدة بنجاح');
      reset();
      navigate('/units');
    },
  });

  // Pre-populate file lists for edit (or view) mode if initialData contains file data
  useEffect(() => {
    if (isEdit && initialData) {
      if (initialData.plan_images && Array.isArray(initialData.plan_images)) {
        const initialPlanFiles: UploadFile[] = (initialData.plan_images as unknown as ImageData[]).map(
          (img: ImageData, index: number) => ({
            uid: `plan-${img.id || index}`,
            name: img.name || `Plan-${index}`,
            status: 'done',
            url: img.url,
            thumbUrl: img.small_url,
          })
        );
        setValue('plan_images', initialPlanFiles);
      }
      if (initialData.gallery && Array.isArray(initialData.gallery)) {
        const initialGalleryFiles: UploadFile[] = (initialData.gallery as unknown as ImageData[]).map(
          (img: ImageData, index: number) => ({
            uid: `gallery-${img.id || index}`,
            name: img.name || `Gallery-${index}`,
            status: 'done',
            url: img.url,
            thumbUrl: img.small_url,
          })
        );
        setValue('gallery', initialGalleryFiles);
      }
    }
  }, [isEdit, initialData, setValue]);

  // Helper: Convert an UploadFile into a valid File object.
  // If the file is new (has originFileObj), return it directly.
  // Otherwise, fetch the file from its URL and create a new File instance.
  const processFile = async (file: UploadFile): Promise<File | null> => {
    if (file.originFileObj) return file.originFileObj;
    if (file.url) {
      try {
        const response = await fetch(file.url, { mode: 'cors' });
        const blob = await response.blob();
        // Ensure a valid filename; avoid using uid if name is missing.
        const fileName = file.name ? file.name : 'file.' + blob.type.split('/')[1];
        const newFile = new File([blob], fileName, { type: blob.type });
        console.log('Converted file:', newFile);
        return newFile;
      } catch (error) {
        console.error('Error fetching file:', file.url, error);
        return null;
      }
    }
    return null;
  };

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewVisible(true);
    setPreviewTitle(
      file.name || (file.url ? file.url.substring(file.url.lastIndexOf('/') + 1) : 'Image Preview')
    );
  };

  const beforeUpload = (file: RcFile): boolean => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('يمكنك رفع ملفات الصور فقط!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('يجب أن يكون حجم الصورة أقل من 2 ميجابايت!');
      return false;
    }
    return false; // Prevent auto-upload; we handle file collection manually
  };

  const handlePlanImagesChange = useCallback(
    ({ fileList }: { fileList: UploadFile[] }) => {
      const oversizedFiles = fileList.filter(
        file => file.originFileObj && file.originFileObj.size > 2 * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        message.error('حجم الملف يجب أن يكون أقل من 2 ميجابايت');
        const filteredFiles = fileList.filter(
          file => !file.originFileObj || file.originFileObj.size <= 2 * 1024 * 1024
        );
        setValue('plan_images', filteredFiles);
      } else {
        setValue('plan_images', fileList);
      }
    },
    [setValue]
  );

  const handleGalleryChange = useCallback(
    ({ fileList }: { fileList: UploadFile[] }) => {
      const oversizedFiles = fileList.filter(
        file => file.originFileObj && file.originFileObj.size > 2 * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        message.error('حجم الملف يجب أن يكون أقل من 2 ميجابايت');
        const filteredFiles = fileList.filter(
          file => !file.originFileObj || file.originFileObj.size <= 2 * 1024 * 1024
        );
        setValue('gallery', filteredFiles);
      } else {
        setValue('gallery', fileList);
      }
    },
    [setValue]
  );

  // onSubmit: Ensure each file is a valid File object before appending.
  const onSubmit = async (data: ExtendedUnitFormData) => {
    const formData = new FormData();

    // Ensure plan images are provided (required for create)
    if (!data.plan_images || data.plan_images.length === 0) {
      toast.error("يجب تحميل صور المخطط");
      return;
    }

    // Append non-file fields.
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'plan_images' && key !== 'gallery') {
        formData.append(key, value.toString());
      }
    });

    // Process plan images ensuring each is a valid File object.
    if (data.plan_images) {
      const processedPlanFiles = await Promise.all(
        data.plan_images.map(file => processFile(file))
      );
      processedPlanFiles.forEach(file => {
        if (file) {
          // Append file using key "plan_images" (without brackets) for proper backend handling
          formData.append('plan_images', file);
        }
      });
    }

    // Process gallery images similarly.
    if (data.gallery) {
      const processedGalleryFiles = await Promise.all(
        data.gallery.map(file => processFile(file))
      );
      processedGalleryFiles.forEach(file => {
        if (file) {
          formData.append('gallery', file);
        }
      });
    }

    // For edit, append the PUT method override.
    if (isEdit) {
      formData.append('_method', 'PUT');
    }

    submitUnit(formData);
  };

  const watchPlanImages = watch('plan_images');
  const watchGallery = watch('gallery');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
      {/* Grid layout for basic fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Building Selector */}
        {!defaultBuildingId && (
          <div>
            <label htmlFor="building_id" className="block text-sm font-medium text-gray-700">
              المبنى
            </label>
            <select
              id="building_id"
              {...register('building_id')}
              disabled={loadingBuildings || readOnly}
              className={`mt-1 block w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ${
                errors.building_id ? 'border-red-300' : ''
              }`}
            >
              <option value="">اختر المبنى</option>
              {buildings?.map(building => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
            {errors.building_id && (
              <p className="mt-1 text-sm text-red-600">{errors.building_id.message}</p>
            )}
          </div>
        )}

        {/* Unit Number */}
        <div>
          <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700">
            رقم الوحدة
          </label>
          <input
            type="text"
            id="unit_number"
            {...register('unit_number')}
            disabled={readOnly}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
          />
          {errors.unit_number && (
            <p className="mt-1 text-sm text-red-600">{errors.unit_number.message}</p>
          )}
        </div>

        {/* Unit Type */}
        <div>
          <label htmlFor="unit_type" className="block text-sm font-medium text-gray-700">
            نوع الوحدة
          </label>
          <input
            type="text"
            id="unit_type"
            {...register('unit_type')}
            disabled={readOnly}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
          />
          {errors.unit_type && (
            <p className="mt-1 text-sm text-red-600">{errors.unit_type.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            السعر
          </label>
          <input
            type="number"
            id="price"
            {...register('price')}
            disabled={readOnly}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        {/* Area */}
        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700">
            المساحة
          </label>
          <input
            type="text"
            id="area"
            {...register('area')}
            disabled={readOnly}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
          />
          {errors.area && (
            <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>
          )}
        </div>

        {/* Floor */}
        <div>
          <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
            الطابق
          </label>
          <input
            type="number"
            id="floor"
            {...register('floor')}
            disabled={readOnly}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
          />
          {errors.floor && (
            <p className="mt-1 text-sm text-red-600">{errors.floor.message}</p>
          )}
        </div>

        {/* Bedrooms */}
        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
            غرف النوم
          </label>
          <input
            type="number"
            id="bedrooms"
            {...register('bedrooms')}
            disabled={readOnly}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
          />
          {errors.bedrooms && (
            <p className="mt-1 text-sm text-red-600">{errors.bedrooms.message}</p>
          )}
        </div>

        {/* Bathrooms */}
        <div>
          <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
            الحمامات
          </label>
          <input
            type="number"
            id="bathrooms"
            {...register('bathrooms')}
            disabled={readOnly}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
          />
          {errors.bathrooms && (
            <p className="mt-1 text-sm text-red-600">{errors.bathrooms.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          الوصف
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          disabled={readOnly}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Status (only in edit mode) */}
      {isEdit && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            الحالة
          </label>
          <input
            type="text"
            id="status"
            {...register('status')}
            disabled
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      )}

      {/* Plan Images */}
      <Form.Item
        label={<span className="text-sm font-medium text-gray-700">صور المخطط</span>}
        validateStatus={errors.plan_images ? 'error' : ''}
        help={errors.plan_images?.message ? String(errors.plan_images.message) : ''}
        className="mb-4"
      >
        <Upload.Dragger
          style={{
            border: '2px dashed #d9d9d9',
            borderRadius: '8px',
            padding: '24px',
            backgroundColor: '#fafafa',
          }}
          listType="picture-card"
          fileList={watchPlanImages}
          onChange={handlePlanImagesChange}
          onPreview={handlePreview}
          beforeUpload={beforeUpload}
          multiple
          accept="image/*"
          maxCount={5}
          disabled={readOnly}
          className="w-full"
        >
          {(watchPlanImages?.length || 0) >= 5 ? null : (
            <div>
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="text-blue-500 text-2xl" />
              </p>
              <p className="ant-upload-text">اضغط أو اسحب الصور إلى هذه المنطقة للتحميل</p>
              <p className="ant-upload-hint text-xs text-gray-500">
                الصيغ المدعومة: JPG, PNG, GIF. الحد الأقصى للحجم: 2 ميجابايت
                {watchPlanImages?.length
                  ? ` (يمكنك تحميل ${5 - watchPlanImages.length} صور أخرى)`
                  : ' (حد أقصى 5 صور)'}
              </p>
            </div>
          )}
        </Upload.Dragger>
      </Form.Item>

      {/* Gallery */}
      <Form.Item
        label={<span className="text-sm font-medium text-gray-700">معرض الصور</span>}
        validateStatus={errors.gallery ? 'error' : ''}
        help={errors.gallery?.message ? String(errors.gallery.message) : ''}
        className="mb-4"
      >
        <Upload.Dragger
          style={{
            border: '2px dashed #d9d9d9',
            borderRadius: '8px',
            padding: '24px',
            backgroundColor: '#fafafa',
          }}
          listType="picture-card"
          fileList={watchGallery}
          onChange={handleGalleryChange}
          onPreview={handlePreview}
          beforeUpload={beforeUpload}
          multiple
          accept="image/*"
          maxCount={10}
          disabled={readOnly}
          className="w-full"
        >
          {(watchGallery?.length || 0) >= 10 ? null : (
            <div>
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="text-blue-500 text-2xl" />
              </p>
              <p className="ant-upload-text">اضغط أو اسحب الصور إلى هذه المنطقة للتحميل</p>
              <p className="ant-upload-hint text-xs text-gray-500">
                الصيغ المدعومة: JPG, PNG, GIF. الحد الأقصى للحجم: 2 ميجابايت
                {watchGallery?.length
                  ? ` (يمكنك تحميل ${10 - watchGallery.length} صور أخرى)`
                  : ' (حد أقصى 10 صور)'}
              </p>
            </div>
          )}
        </Upload.Dragger>
      </Form.Item>

      {/* Submit Button */}
      {!readOnly && (
        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={isLoading || loadingBuildings}
            className="bg-blue-600 hover:bg-blue-700"
            style={{ height: '40px', paddingLeft: '16px', paddingRight: '16px' }}
          >
            {isLoading ? 'جاري الحفظ...' : isEdit ? 'تحديث' : 'إنشاء'}
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        centered
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </form>
  );
};

export default UnitForm;
