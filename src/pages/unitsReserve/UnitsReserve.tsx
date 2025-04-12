import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import ReservationsTable from '../../components/ReservationsTable';
import { toast } from 'react-hot-toast';

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
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch reservations with filters and pagination
  const fetchReservations = async (filterParams: any, page: number = 1) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/reservations', {
        params: {
          ...filterParams,
          page,
          per_page: pagination.pageSize
        }
      });
      
      setReservations(response.data.data);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.data.meta?.total || 0
      }));
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('فشل في تحميل الحجوزات');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReservations(filters);
  }, []);

  const handleReserveUnit = () => {
    navigate('/reservations/reserve');
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleFilterSubmit = (newFilters: any) => {
    setFilters(newFilters);
    fetchReservations(newFilters, 1); // Reset to first page when filters change
  };

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
        showActions={true}
        showUnitColumn={true}
        showClientColumn={true}
        noDataMessage="لا توجد حجوزات"
        onFilterChange={handleFilterChange}
        onFilterSubmit={handleFilterSubmit}
      />
    </div>
  );
};

export default UnitReserve;