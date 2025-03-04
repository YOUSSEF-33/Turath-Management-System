import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, Edit, Trash, Plus } from 'lucide-react';
import { units, employees } from '../data';
import GenericTable from '../components/GenericTable';

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
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه الوحدة؟');
    if (confirmed) {
      toast.success('تم حذف الوحدة بنجاح');
    }
  };

  const handleCreate = () => {
    navigate('/units/create');
  };

  const columns: Column[] = [
    { key: 'number', header: 'رقم الوحدة' },
    { key: 'type', header: 'النوع', render: (value) => getTypeText(value) },
    { key: 'area', header: 'المساحة', render: (value) => `${value} م²` },
    {
      key: 'status',
      header: 'الحالة',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full ${getStatusClass(value)}`}>
          {getStatusText(value)}
        </span>
      ),
    },
    {
      key: 'assignedEmployees',
      header: 'الموظفون المخصصون',
      render: (value) =>
        value.map((empId: number) => employees.find((e) => e.id === empId)?.name).join(', '),
    },
  ];

  const actions: Action[] = [
    { key: 'view', icon: <Eye className="h-5 w-5" />, onClick: handleView, color: 'text-blue-600' },
    { key: 'edit', icon: <Edit className="h-5 w-5" />, onClick: handleEdit, color: 'text-yellow-600' },
    { key: 'delete', icon: <Trash className="h-5 w-5" />, onClick: handleDelete, color: 'text-red-600' },
  ];

  return (
    <GenericTable
      data={units}
      columns={columns}
      actions={actions}
      onCreate={handleCreate}
      createButtonText="إضافة وحدة جديدة"
    />
  );
};

export default Units;