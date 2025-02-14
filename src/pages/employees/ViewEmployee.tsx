import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { employees, units } from '../../data';

const ViewEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const employee = employees.find(emp => emp.id === Number(id));

  if (!employee) {
    return <div>لم يتم العثور على الموظف</div>;
  }

  const assignedUnits = units.filter(unit => employee.assignedUnits.includes(unit.id));

  return (
    <div>
      <Navbar title="تفاصيل الموظف" />
      <div className="p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">المعلومات الشخصية</h3>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">الاسم</p>
                  <p className="text-base text-gray-900">{employee.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">المنصب</p>
                  <p className="text-base text-gray-900">{employee.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">رقم الهاتف</p>
                  <p className="text-base text-gray-900">{employee.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                  <p className="text-base text-gray-900">{employee.email}</p>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <h3 className="text-lg font-semibold text-gray-900">الوحدات المخصصة</h3>
              <div className="mt-3">
                {assignedUnits.length > 0 ? (
                  <ul className="space-y-2">
                    {assignedUnits.map(unit => (
                      <li key={unit.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span>{unit.number}</span>
                        <span className="text-gray-500">{unit.type === 'villa' ? 'فيلا' : unit.type === 'duplex' ? 'دوبلكس' : 'شقة'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">لا توجد وحدات مخصصة</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => navigate('/employees')}
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

export default ViewEmployee;