import { useNavigate, useParams } from 'react-router-dom';
import { units, employees } from '../../data';

const ViewUnit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const unit = units.find(u => u.id === Number(id));



  if (!unit) {
    return <div className="p-6 text-center text-red-500">لم يتم العثور على الوحدة</div>;
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
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-100 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">الوحدة {unit.number}</h1>
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
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Unit Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">معلومات الوحدة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">رقم الوحدة</p>
                  <p className="text-lg font-medium text-gray-900">{unit.number}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">النوع</p>
                  <p className="text-lg font-medium text-gray-900">{getTypeText(unit.type)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">المساحة</p>
                  <p className="text-lg font-medium text-gray-900">{unit.area} م²</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">السعر</p>
                  <p className="text-lg font-medium text-gray-900">{unit.price} جنيه</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">الحالة</p>
                  <p className="text-lg font-medium text-gray-900">{getStatusText(unit.status)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">كود الوحدة</p>
                  <p className="text-lg font-medium text-gray-900">{unit.code}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">الوصف</h3>
              <p className="text-gray-700 leading-relaxed">{unit.description}</p>
            </div>

            {/* Unit Images */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">صور الوحدة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unit.images.map((image, index) => (
                  <img
                    key={index}
                    src={`/images/${image}`}
                    alt={`Unit Image ${index + 1}`}
                    className="rounded-lg shadow-md w-full h-48 object-cover"
                  />
                ))}
              </div>
            </div>

            {/* Engineering Plan */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">صور المخطط</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unit.engineeringPlan.map((image, index) => (
                  <img
                    key={index}
                    src={`/images/${image}`}
                    alt={`Unit Image ${index + 1}`}
                    className="rounded-lg shadow-md w-full h-48 object-cover"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Employees */}
        {/* <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">الموظفون المخصصون</h3>
          {assignedEmployees.length > 0 ? (
            <ul className="space-y-4">
              {assignedEmployees.map(employee => (
                <li
                  key={employee.id}
                  className="bg-gray-50 p-4 rounded-lg flex items-center justify-between"
                >
                  <span className="text-lg font-medium text-gray-900">{employee.name}</span>
                  <span className="text-gray-500">{employee.position}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">لا يوجد موظفون مخصصون</p>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default ViewUnit;