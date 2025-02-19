import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { units } from '../../data';

const EditUnit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const unit = units.find(u => u.id === Number(id));

  const [unitData, setUnitData] = useState({
    number: unit?.number || '',
    type: unit?.type || 'apartment',
    area: unit?.area || '',
    price: unit?.price || '',
    status: unit?.status || 'available',
    images: unit?.images || []
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUnitData({ ...unitData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setUnitData({ ...unitData, images: [...unitData.images, ...newImages] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add unit update logic here
    toast.success('تم تحديث بيانات الوحدة بنجاح');
    navigate('/units');
  };

  if (!unit) {
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
              name="number"
              value={unitData.number}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
            <select
              name="type"
              value={unitData.type}
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
              type="number"
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">صور الوحدة</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {unitData.images.map((img, index) => (
                <img key={index} src={img} alt={`unit-${index}`} className="w-full h-32 object-cover rounded-lg" />
              ))}
            </div>
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
