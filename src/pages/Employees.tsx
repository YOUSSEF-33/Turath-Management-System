import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { employees, units } from '../data';
import Navbar from '../components/Navbar';
import { Eye, Edit, Trash, Plus } from 'lucide-react';

const Employees = () => {
  const navigate = useNavigate();

  const handleView = (id: number) => {
    navigate(`/employees/view/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/employees/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    // Add delete confirmation and logic here
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا الموظف؟');
    if (confirmed) {
      // Add delete logic here
      toast.success('تم حذف الموظف بنجاح');
    }
  };

  const handleCreate = () => {
    navigate('/employees/create');
  };

  return (
    <div>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus className="ml-2 h-5 w-5" />
            إضافة موظف جديد
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">الاسم</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">المنصب</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">رقم الهاتف</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">البريد الإلكتروني</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">الوحدات المخصصة</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{employee.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{employee.position}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{employee.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{employee.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {employee.assignedUnits
                      .map((unitId) => units.find((u) => u.id === unitId)?.number)
                      .join(', ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleView(employee.id)}
                        className="text-blue-600 hover:text-blue-800 ml-2"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(employee.id)}
                        className="text-yellow-600 hover:text-yellow-800 ml-2"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Employees;