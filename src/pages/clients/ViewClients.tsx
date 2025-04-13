import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Eye } from 'lucide-react';
import { Button, Input, DatePicker, Form } from 'antd';
import dayjs from 'dayjs';
import { usePermissionsContext } from '../../context/PermissionsContext';

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  updated_at: string;
}

interface Action {
  key: string;
  icon: JSX.Element;
  onClick: (id: number) => void;
  color: string;
  permission?: string;
}

const ViewClients: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissionsContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<{
    phone?: string;
    email?: string;
    reserved_from?: string;
    reserved_to?: string;
  }>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Function to format the date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-based
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get('/clients', {
        params: {
          page: currentPage,
          per_page: itemsPerPage,
          ...filters, // Include filters in the request
        },
      });
      setClients(response.data.data);

      // Set total pages from response metadata
      if (response.data.meta && response.data.meta.total) {
        const total = Math.ceil(response.data.meta.total / itemsPerPage);
        setTotalPages(total);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, filters]); // Refetch data when filters change

  const handleView = (client: number) => {
    navigate(`/clients/${client}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterSubmit = (values: {
    phone?: string;
    email?: string;
    reserved_from?: dayjs.Dayjs;
    reserved_to?: dayjs.Dayjs;
  }) => {
    const formattedFilters = {
      phone: values.phone,
      email: values.email,
      reserved_from: values.reserved_from?.format('YYYY-MM-DD'),
      reserved_to: values.reserved_to?.format('YYYY-MM-DD'),
    };
    setFilters(formattedFilters);
    setCurrentPage(1); // Reset to the first page when applying filters
  };

  const actions: Action[] = [
    { 
      key: 'view', 
      icon: <Eye className="h-5 w-5" />, 
      onClick: handleView, 
      color: 'text-blue-600',
      permission: 'view_clients'
    },
  ];

  // Filter actions based on permissions
  const filteredActions = actions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-100 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">العملاء</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            عودة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">قائمة العملاء</h3>

          {/* Filters Form */}
          <Form onFinish={handleFilterSubmit} layout="vertical" className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Form.Item name="phone" className="mb-0">
                <Input placeholder="رقم الهاتف" className="w-full" />
              </Form.Item>
              <Form.Item name="email" className="mb-0">
                <Input placeholder="البريد الإلكتروني" className="w-full" />
              </Form.Item>
              <Form.Item name="reserved_from" className="mb-0">
                <DatePicker placeholder="ناريخ الحجز (من)" format="YYYY-MM-DD" className="w-full" />
              </Form.Item>
              <Form.Item name="reserved_to" className="mb-0">
                <DatePicker placeholder="ناريخ الحجز (إلى)" format="YYYY-MM-DD" className="w-full" />
              </Form.Item>
            </div>
            <div className="mt-4">
              <Button type="primary" htmlType="submit">
                 بحث
              </Button>
            </div>
          </Form>

          <GenericTable
            columns={[
              { header: 'رقم العميل', key: 'id' },
              { header: 'اسم العميل', key: 'name' },
              { header: 'الهاتف', key: 'phone' },
              { header: 'البريد الإلكتروني', key: 'email' },
              { header: 'العنوان', key: 'address' },
              {
                header: 'أول اضافة في',
                key: 'created_at',
                render: (value) => formatDate(value as string), // Format the date
              },
            ]}
            data={clients as unknown as Record<string, unknown>[]}
            actions={filteredActions}
            loading={loading}
            onCreate={hasPermission('create_clients') ? () => navigate('/clients/create') : undefined}
            createButtonText="إضافة عميل جديد"
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ViewClients;