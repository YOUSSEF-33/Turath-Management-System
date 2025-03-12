import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../axiosInstance';

const EditBuilding = () => {
  const navigate = useNavigate();
  const { buildingId, projectId } = useParams<{ buildingId: string, projectId: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', description: '' });
  const [dataLoading, setDataLoading] = useState(true); // New state for data loading

  useEffect(() => {
    const fetchBuilding = async () => {
      try {
        const response = await axiosInstance.get(`/buildings/${buildingId}`);
        setName(response.data.data.name);
        setDescription(response.data.data.description);
      } catch (error) {
        toast.error('حدث خطأ أثناء جلب بيانات المبنى');
      } finally {
        setDataLoading(false); // Set data loading to false after fetching
      }
    };

    fetchBuilding();
  }, [buildingId]);

  const validate = () => {
    let valid = true;
    let errors = { name: '', description: '' };

    if (name.trim().length < 3) {
      errors.name = 'اسم المبنى يجب أن يكون على الأقل 3 أحرف';
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
      await axiosInstance.put(`/buildings/${buildingId}`, { name, description, project_id: projectId });
      toast.success('تم تحديث المبنى بنجاح');
      navigate(`/projects/${buildingId}`);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث المبنى');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return <div>Loading...</div>; // Show loading indicator while fetching data
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">تعديل المبنى</h1>
          <button
            onClick={() => navigate(`/projects/${buildingId}`)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            عودة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Building Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المبنى</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Building Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف المبنى</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/projects/${buildingId}`)}
              className="mx-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`${loading ? "loader" : "bg-blue-600 px-4 py-2 text-white rounded-lg hover:bg-blue-700"}`}
              disabled={loading}
            >
              {loading ? '' : 'تحديث'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBuilding;
