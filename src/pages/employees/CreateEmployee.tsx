import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CreateEmployee = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
  });

  const handleChange = (e:any) => {
    setEmployee({ ...employee, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e:any) => {
    e.preventDefault();
    toast.success('تم إضافة الموظف بنجاح');
    navigate('/employees');
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-100 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">إضافة موظف جديد</h1>
          <button
            onClick={() => navigate('/employees')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            عودة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
              <input
                type="text"
                name="name"
                value={employee.name}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Employee Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المنصب</label>
              <input
                type="text"
                name="position"
                value={employee.position}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Employee Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                name="phone"
                value={employee.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Employee Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                value={employee.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/employees')}
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

export default CreateEmployee;
