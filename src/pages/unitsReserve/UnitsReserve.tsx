import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import ReservationsTable from '../../components/ReservationsTable';
import { DatePicker, Form, Button } from 'antd';
import dayjs from 'dayjs';

interface Reservation {
  id: number;
  unit_id: number;
  client_id: number;
  status: string;
  contract_date: string;
  final_price: number;
  reservation_deposit: number;
  [key: string]: unknown;
}

const UnitReserve = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/reservations', {
          params: {
            per_page: itemsPerPage,
            page: currentPage,
            status: statusFilter,
            date_from: dateFrom,
            date_to: dateTo,
          },
        });
        
        const formattedData = response.data.data.map((reservation: Reservation) => ({
          ...reservation,
        }));
        
        setReservations(formattedData);
        const totalPages = Math.ceil(response.data.meta.total / itemsPerPage);
        setTotalPages(totalPages);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  },  [currentPage, statusFilter, dateFrom, dateTo, itemsPerPage]);

  const handleReserveUnit = () => {
    navigate('/reservations/reserve');
  };

  const handleFilterSubmit = (values: {
    status?: string;
    date_from?: dayjs.Dayjs;
    date_to?: dayjs.Dayjs;
  }) => {
    setStatusFilter(values.status || '');
    setDateFrom(values.date_from?.format('YYYY-MM-DD') || '');
    setDateTo(values.date_to?.format('YYYY-MM-DD') || '');
    setCurrentPage(1); // Reset to first page when applying filters
  };

  const resetFilters = () => {
    form.resetFields();
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const filters = (
    <Form form={form} onFinish={handleFilterSubmit} layout="vertical" className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Form.Item name="status" label="الحالة" className="mb-0">
          <select
            className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg"
          >
            <option value="">كل الحالات</option>
            <option value="PENDING">معلق </option>
            <option value="CONFIRMED">مؤكد</option>
            <option value="REJECTED">مرفوض</option>
            <option value="SOLD">مباع</option>
          </select>
        </Form.Item>
        <Form.Item name="date_from" label="التاريخ من" className="mb-0">
          <DatePicker placeholder="التاريخ من" format="YYYY-MM-DD" className="w-full" />
        </Form.Item>
        <Form.Item name="date_to" label="التاريخ إلى" className="mb-0">
          <DatePicker placeholder="التاريخ إلى" format="YYYY-MM-DD" className="w-full" />
        </Form.Item>
      </div>
      <div className="mt-4 flex space-x-4">
        <Button type="primary" htmlType="submit">
          بحث
        </Button>
        <Button onClick={resetFilters}>
          إعادة تعيين
        </Button>
      </div>
    </Form>
  );

  return (
    <div className="p-6 bg-gray-50 md:m-4 md:rounded my-2">
      {/* Button to Reserve Unit */}
      <div className='flex justify-between items-center mb-4 mx-6'>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">الوحدات</h2>
        <div className="mb-2 flex justify-start">
          <button
            onClick={handleReserveUnit}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus className="ml-2 h-5 w-5" />
            حجز وحدة
          </button>
        </div>
      </div>
      <ReservationsTable 
        reservations={reservations}
        loading={loading}
        showActions={true}
        showUnitColumn={true}
        showClientColumn={true}
        noDataMessage="لا توجد حجوزات"
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        filters={filters}
      />
    </div>
  );
};

export default UnitReserve;