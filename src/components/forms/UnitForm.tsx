import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { unitValidationSchema } from '../../utils/validation';
import { useApiMutation, useApiGet } from '../../utils/hooks';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, Button, Modal, message } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { UnitFormData } from '../../types/forms';
import { useState } from 'react';

interface UnitFormProps {
  initialData?: UnitFormData;
  isEdit?: boolean;
  unitId?: number;
  buildingId?: number;
}

const UnitForm: React.FC<UnitFormProps> = ({
  initialData,
  isEdit = false,
  unitId,
  buildingId: defaultBuildingId,
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
    watch
  } = useForm<UnitFormData>({
    resolver: yupResolver(unitValidationSchema),
    defaultValues: {
      ...initialData,
      building_id: defaultBuildingId
    }
  });

  const { data: buildings, loading: loadingBuildings } = useApiGet<{ id: number; name: string }[]>({
    url: '/buildings',
    dependencies: []
  });

  const { mutate: submitUnit, loading: isLoading } = useApiMutation({
    url: isEdit ? `/units/${unitId}` : '/units',
    method: isEdit ? 'PUT' : 'POST',
    onSuccess: () => {
      toast.success(isEdit ? 'تم تحديث الوحدة بنجاح' : 'تم إنشاء الوحدة بنجاح');
      reset();
      navigate('/units');
    }
  });

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
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const handlePlanImagesChange = useCallback(({ fileList }: { fileList: UploadFile[] }) => {
    // Validate file size (2MB)
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
  }, [setValue]);

  const handleGalleryChange = useCallback(({ fileList }: { fileList: UploadFile[] }) => {
    // Validate file size (2MB)
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
  }, [setValue]);

  const onSubmit = async (data: UnitFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'plan_images' || key === 'gallery') {
          value.forEach((file: UploadFile) => {
            if (file.originFileObj) {
              formData.append(key, file.originFileObj);
            }
          });
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    submitUnit(formData);
  };

  const watchPlanImages = watch('plan_images');
  const watchGallery = watch('gallery');

  // Custom upload button
  const uploadButton = (
    <div className="flex flex-col items-center justify-center text-gray-500">
      <PlusOutlined className="text-2xl mb-2" />
      <div className="mt-1">أضف صورة</div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!defaultBuildingId && (
        <div>
          <label htmlFor="building_id" className="block text-sm font-medium text-gray-700">
            المبنى
          </label>
          <select
            id="building_id"
            {...register('building_id')}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.building_id ? 'border-red-300' : ''
            }`}
            disabled={loadingBuildings}
          >
            <option value="">اختر المبنى</option>
            {buildings?.map((building) => (
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

      <div>
        <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700">
          رقم الوحدة
        </label>
        <input
          type="text"
          id="unit_number"
          {...register('unit_number')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.unit_number ? 'border-red-300' : ''
          }`}
        />
        {errors.unit_number && (
          <p className="mt-1 text-sm text-red-600">{errors.unit_number.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="unit_type" className="block text-sm font-medium text-gray-700">
          نوع الوحدة
        </label>
        <input
          type="text"
          id="unit_type"
          {...register('unit_type')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.unit_type ? 'border-red-300' : ''
          }`}
        />
        {errors.unit_type && (
          <p className="mt-1 text-sm text-red-600">{errors.unit_type.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          السعر
        </label>
        <input
          type="number"
          id="price"
          {...register('price')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.price ? 'border-red-300' : ''
          }`}
        />
        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="area" className="block text-sm font-medium text-gray-700">
          المساحة
        </label>
        <input
          type="text"
          id="area"
          {...register('area')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.area ? 'border-red-300' : ''
          }`}
        />
        {errors.area && (
          <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
          الطابق
        </label>
        <input
          type="number"
          id="floor"
          {...register('floor')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.floor ? 'border-red-300' : ''
          }`}
        />
        {errors.floor && (
          <p className="mt-1 text-sm text-red-600">{errors.floor.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
          غرف النوم
        </label>
        <input
          type="number"
          id="bedrooms"
          {...register('bedrooms')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.bedrooms ? 'border-red-300' : ''
          }`}
        />
        {errors.bedrooms && (
          <p className="mt-1 text-sm text-red-600">{errors.bedrooms.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
          الحمامات
        </label>
        <input
          type="number"
          id="bathrooms"
          {...register('bathrooms')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.bathrooms ? 'border-red-300' : ''
          }`}
        />
        {errors.bathrooms && (
          <p className="mt-1 text-sm text-red-600">{errors.bathrooms.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          الوصف
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.description ? 'border-red-300' : ''
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          صور المخطط
        </label>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <Upload
            listType="picture-card"
            fileList={watchPlanImages}
            onChange={handlePlanImagesChange}
            onPreview={handlePreview}
            beforeUpload={() => false}
            multiple={true}
            accept="image/*"
            className="upload-list-inline"
            maxCount={5}
            showUploadList={{
              showPreviewIcon: true,
              showRemoveIcon: true,
              showDownloadIcon: false,
              removeIcon: <DeleteOutlined className="text-red-500" />,
              previewIcon: <EyeOutlined className="text-blue-500" />
            }}
          >
            {(watchPlanImages?.length || 0) >= 5 ? null : uploadButton}
          </Upload>
          <p className="text-xs text-gray-500 mt-2">* الصيغ المدعومة: JPG, PNG, GIF. الحد الأقصى للحجم: 2 ميجابايت</p>
        </div>
        {errors.plan_images && (
          <p className="mt-1 text-sm text-red-600">{errors.plan_images.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          معرض الصور
        </label>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <Upload
            listType="picture-card"
            fileList={watchGallery}
            onChange={handleGalleryChange}
            onPreview={handlePreview}
            beforeUpload={() => false}
            multiple={true}
            accept="image/*"
            className="upload-list-inline"
            maxCount={10}
            showUploadList={{
              showPreviewIcon: true,
              showRemoveIcon: true,
              showDownloadIcon: false,
              removeIcon: <DeleteOutlined className="text-red-500" />,
              previewIcon: <EyeOutlined className="text-blue-500" />
            }}
          >
            {(watchGallery?.length || 0) >= 10 ? null : uploadButton}
          </Upload>
          <p className="text-xs text-gray-500 mt-2">* الصيغ المدعومة: JPG, PNG, GIF. الحد الأقصى للحجم: 2 ميجابايت</p>
        </div>
        {errors.gallery && (
          <p className="mt-1 text-sm text-red-600">{errors.gallery.message}</p>
        )}
      </div>

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

      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </form>
  );
};

export default UnitForm; 