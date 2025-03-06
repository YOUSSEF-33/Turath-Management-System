import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../axiosInstance';
import { InputField } from '../../components/InputField';

const CreateProject = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({ name: '' });
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    let errors = { name: '' };

    if (name.trim().length < 3) {
      errors.name = 'اسم المشروع يجب أن يكون على الأقل 3 أحرف';
      valid = false;
    }

    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await axiosInstance.post('/projects', { name, description });
      toast.success('تم إضافة المشروع بنجاح');
      navigate('/projects');
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة المشروع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">إضافة مشروع جديد</h1>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            عودة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Project Name */}
          <div className="mb-6">
            <InputField
              label="اسم المشروع"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم المشروع"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Project Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف المشروع</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className=" mx-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`${loading? "loader": "bg-blue-600 px-4 py-2 text-white rounded-lg hover:bg-blue-700"}`}
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

export default CreateProject;
