import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../axiosInstance';

const EditUnit = () => {
  const navigate = useNavigate();
  const { unitId:id } = useParams();
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
    updated_at: ''
  });

  useEffect(() => {
    const fetchUnitData = async () => {
      try {
        const response = await axiosInstance.get(`/units/${id}`);
        setUnitData(response.data.data);
      } catch (error) {
        toast.error('حدث خطأ أثناء جلب بيانات الوحدة');
        console.log(error);
      }
    };

    fetchUnitData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setUnitData({ ...unitData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
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
    formData.append('_method', "PUT");

    try {
      await axiosInstance.post(`/units/${id}`, formData);
      toast.success('تم تحديث بيانات الوحدة بنجاح');
      navigate(-1);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث بيانات الوحدة');
      console.log(error);
    }
  };

  if (!unitData) {
    return <div className="text-center mt-10 text-red-600">لم يتم العثور على الوحدة</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
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

      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الوحدة</label>
            <input
              type="text"
              name="unit_number"
              value={unitData.unit_number}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
            <select
              name="unit_type"
              value={unitData.unit_type}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="villa">فيلا</option>
              <option value="duplex">دوبلكس</option>
              <option value="apartment">شقة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المساحة (م²)</label>
            <input
              type="text"
              name="area"
              value={unitData.area}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">السعر (جنيه)</label>
            <input
              type="number"
              name="price"
              value={unitData.price}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select
              name="status"
              value={unitData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="available">متاح</option>
              <option value="occupied">مشغول</option>
              <option value="maintenance">صيانة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الطابق</label>
            <input
              type="number"
              name="floor"
              value={unitData.floor}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">غرف النوم</label>
            <input
              type="number"
              name="bedrooms"
              value={unitData.bedrooms}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحمامات</label>
            <input
              type="number"
              name="bathrooms"
              value={unitData.bathrooms}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea
              name="description"
              value={unitData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

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
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              حفظ التغييرات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUnit;
