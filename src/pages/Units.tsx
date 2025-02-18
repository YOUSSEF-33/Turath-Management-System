import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { units, employees } from '../data';
import { Eye, Edit, Trash, Plus } from 'lucide-react';

const Units = () => {
  const navigate = useNavigate();

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  const handleView = (id: number) => {
    navigate(`/units/view/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/units/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    // Add delete confirmation and logic here
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه الوحدة؟');
    if (confirmed) {
      // Add delete logic here
      toast.success('تم حذف الوحدة بنجاح');
    }
  };

  const handleCreate = () => {
    navigate('/units/create');
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
            إضافة وحدة جديدة
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">رقم الوحدة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">النوع</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">المساحة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">الحالة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">الموظفون المخصصون</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{unit.number}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getTypeText(unit.type)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{unit.area} م²</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full ${getStatusClass(unit.status)}`}>
                      {getStatusText(unit.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {unit.assignedEmployees
                      .map((empId) => employees.find((e) => e.id === empId)?.name)
                      .join(', ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleView(unit.id)}
                        className="text-blue-600 hover:text-blue-800 ml-2"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(unit.id)}
                        className="text-yellow-600 hover:text-yellow-800 ml-2"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(unit.id)}
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

export default Units;