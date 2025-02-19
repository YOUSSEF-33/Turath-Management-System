import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CreateUnit = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [archPlanningImages, setArchPlanningImages] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('تم إضافة الوحدة بنجاح');
    navigate('/units');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleArchPlanningImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchPlanningImages(Array.from(e.target.files));
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">إضافة وحدة جديدة</h1>
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
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Two-column layout for large screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unit Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الوحدة</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Unit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="villa">فيلا</option>
                <option value="duplex">دوبلكس</option>
                <option value="apartment">شقة</option>
              </select>
            </div>

            {/* Unit Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المساحة (م²)</label>
              <input
                type="number"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر (جنيه)</label>
              <input
                type="number"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            
          </div>

          {/* Unit Images */}
          <div className="mt-6">

            {/* Unit Status */}
            <div className='mb-2'>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="available">متاح</option>
                <option value="occupied">مشغول</option>
                <option value="maintenance">صيانة</option>
              </select>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">صور الوحدة</label>
            <input
              type="file"
              multiple
              onChange={handleImageUpload}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(image)}
                  alt={`Unit Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>

          {/* Architectural Planning Images */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">صور الرسم الهندسي</label>
            <input
              type="file"
              multiple
              onChange={handleArchPlanningImageUpload}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              {archPlanningImages.map((image, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(image)}
                  alt={`Arch Planning Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-3">
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
              إضافة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUnit;
