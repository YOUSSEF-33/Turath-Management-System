import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { projectValidationSchema } from '../../utils/validation';
import { useApiMutation } from '../../utils/hooks';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ProjectFormData } from '../../types/forms';

interface ProjectFormProps {
  initialData?: ProjectFormData;
  isEdit?: boolean;
  projectId?: number;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  isEdit = false,
  projectId,
}) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: yupResolver(projectValidationSchema),
    defaultValues: initialData
  });

  const { mutate: submitProject, loading: isLoading } = useApiMutation({
    url: isEdit ? `/projects/${projectId}` : '/projects',
    method: isEdit ? 'PUT' : 'POST',
    onSuccess: () => {
      toast.success(isEdit ? 'تم تحديث المشروع بنجاح' : 'تم إنشاء المشروع بنجاح');
      navigate('/projects');
    }
  });

  const onSubmit = (data: ProjectFormData) => {
    submitProject(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          اسم المشروع
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
          disabled={isLoading}
          className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'جاري الحفظ...' : isEdit ? 'تحديث' : 'إنشاء'}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm; 