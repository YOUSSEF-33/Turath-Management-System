import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { buildingValidationSchema } from '../../utils/validation';
import { useApiMutation, useApiGet } from '../../utils/hooks';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BuildingFormData } from '../../types/forms';

interface BuildingFormProps {
  initialData?: BuildingFormData;
  isEdit?: boolean;
  buildingId?: number;
  projectId?: number;
}

const BuildingForm: React.FC<BuildingFormProps> = ({
  initialData,
  isEdit = false,
  buildingId,
  projectId: defaultProjectId,
}) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuildingFormData>({
    resolver: yupResolver(buildingValidationSchema),
    defaultValues: {
      ...initialData,
      project_id: defaultProjectId
    }
  });

  const { data: projects, loading: loadingProjects } = useApiGet<{ id: number; name: string }[]>({
    url: '/projects',
    dependencies: []
  });

  const { mutate: submitBuilding, loading: isLoading } = useApiMutation({
    url: isEdit ? `/buildings/${buildingId}` : '/buildings',
    method: isEdit ? 'PUT' : 'POST',
    onSuccess: () => {
      toast.success(isEdit ? 'تم تحديث المبنى بنجاح' : 'تم إنشاء المبنى بنجاح');
      navigate('/buildings');
    }
  });

  const onSubmit = (data: BuildingFormData) => {
    submitBuilding(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!defaultProjectId && (
        <div>
          <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
            المشروع
          </label>
          <select
            id="project_id"
            {...register('project_id')}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.project_id ? 'border-red-300' : ''
            }`}
            disabled={loadingProjects}
          >
            <option value="">اختر المشروع</option>
            {projects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.project_id && (
            <p className="mt-1 text-sm text-red-600">{errors.project_id.message}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          اسم المبنى
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.name ? 'border-red-300' : ''
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || loadingProjects}
          className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            (isLoading || loadingProjects) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'جاري الحفظ...' : isEdit ? 'تحديث' : 'إنشاء'}
        </button>
      </div>
    </form>
  );
};

export default BuildingForm; 