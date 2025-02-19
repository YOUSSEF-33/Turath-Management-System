import { useNavigate, useParams } from 'react-router-dom';
import { employees, units } from '../../data';

const ViewEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const employee = employees.find(emp => emp.id === Number(id));

  if (!employee) {
    return <div className="p-6 text-center text-red-500">لم يتم العثور على الموظف</div>;
  }

  const assignedUnits = units.filter(unit => employee.assignedUnits.includes(unit.id));

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-100 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">الموظف {employee.name}</h1>
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
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Personal Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">المعلومات الشخصية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">الاسم</p>
                  <p className="text-lg font-medium text-gray-900">{employee.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">المنصب</p>
                  <p className="text-lg font-medium text-gray-900">{employee.position}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">رقم الهاتف</p>
                  <p className="text-lg font-medium text-gray-900">{employee.phone}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                  <p className="text-lg font-medium text-gray-900">{employee.email}</p>
                </div>
              </div>
            </div>

            {/* Assigned Units */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">الوحدات المخصصة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedUnits.length > 0 ? (
                  assignedUnits.map(unit => (
                    <div key={unit.id} className="bg-gray-50 p-4 rounded-lg shadow-md">
                      <p className="text-sm text-gray-500">رقم الوحدة</p>
                      <p className="text-lg font-medium text-gray-900">{unit.number}</p>
                      <p className="text-sm text-gray-500 mt-2">النوع</p>
                      <p className="text-lg font-medium text-gray-900">
                        {unit.type === 'villa' ? 'فيلا' : unit.type === 'duplex' ? 'دوبلكس' : 'شقة'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">لا توجد وحدات مخصصة</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployee;
