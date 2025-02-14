import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { units, employees } from '../../data';

const ViewUnit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const unit = units.find(u => u.id === Number(id));

  if (!unit) {
    return <div>لم يتم العثور على الوحدة</div>;
  }

  const assignedEmployees = employees.filter(emp => unit.assignedEmployees.includes(emp.id));

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'متاح';
      case 'occupied':
        return 'مشغول';
      case 'maintenance':
        return 'صيانة';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'villa':
        return 'فيلا';
      case 'duplex':
        return 'دوبلكس';
      case 'apartment':
        return 'شقة';
      default:
        return type;
    }
  };

  return (
    <div>
      <Navbar title="تفاصيل الوحدة" />
      <div className="p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">معلومات الوحدة</h3>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">رقم الوحدة</p>
                  <p className="text-base text-gray-900">{unit.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">النوع</p>
                  <p className="text-base text-gray-900">{getTypeText(unit.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">المساحة</p>
                  <p className="text-base text-gray-900">{unit.area} م²</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الحالة</p>
                  <p className="text-base text-gray-900">{getStatusText(unit.status)}</p>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <h3 className="text-lg font-semibold text-gray-900">الموظفون المخصصون</h3>
              <div className="mt-3">
                {assignedEmployees.length > 0 ? (
                  <ul className="space-y-2">
                    {assignedEmployees.map(employee => (
                      <li key={employee.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span>{employee.name}</span>
                        <span className="text-gray-500">{employee.position}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">لا يوجد موظفون مخصصون</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => navigate('/units')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              عودة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUnit;