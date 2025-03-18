import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import GenericTable from '../../components/GenericTable';
import axiosInstance from '../../axiosInstance';

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
  const [units, setUnits] = useState<Array<Record<string, unknown>>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');


  useEffect(() => {
    const fetchUnits = async () => {
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
        const formattedData = response.data.data.map((unit: Reservation) => ({
          ...unit,
          contract_date: new Date(unit.contract_date).toLocaleDateString('en-GB'),
          // status: (
          //   <span className={`px-2 py-1 rounded-full ${unit.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800' :
          //     unit.status === 'CONFIRMED' ? 'bg-green-200 text-green-800' :
          //       unit.status === 'REJECTED' ? 'bg-red-200 text-red-800' :
          //         unit.status === 'SOLD' ? 'bg-blue-200 text-blue-800' : ''
          //     }`}>
          //     {unit.status}
          //   </span>
          // )
        }));
        setUnits(formattedData);
        const totalPages = Math.ceil(response.data.meta.total / itemsPerPage);
        setTotalPages(totalPages);
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };

    fetchUnits();
  },  [currentPage, statusFilter, dateFrom, dateTo, itemsPerPage]);

  const handleReserveUnit = () => {
    navigate('/units-reserve/reserve');
  };

  const handleViewUnit = (id: number) => {
    navigate(`/units-reserve/details/${id}`);
  };

  const handleReserveAddendum = (id: number) => {
    navigate(`/units-reserve/details/${id}/accept`);
  };

  const columns = [
    { header: 'رقم الوحدة', key: 'unit_id' },
    { header: 'العميل', key: 'client_id' },
    { header: 'الحالة', key: 'status' },
    { header: 'تاريخ العقد', key: 'contract_date' },
    { header: 'السعر النهائي', key: 'final_price' },
    { header: 'دفعة الحجز', key: 'reservation_deposit' },
  ];

  const actions = [
    { key: 'view', icon: <Eye className="h-5 w-5" />, onClick: handleViewUnit, color: 'text-blue-600' },
    { key: 'booking', icon: <Calendar className="h-5 w-5" />, onClick: handleReserveAddendum, color: 'text-green-600' },
  ];

  const filters = (
    <div className="flex justify-start space-x-4">
      <div className="flex flex-col">
        <label htmlFor="statusFilter" className="mb-1 text-gray-700">الحالة</label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="mx-4 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg"
        >
          <option value="">كل الحالات</option>
          <option value="PENDING">معلق </option>
          <option value="CONFIRMED">مؤكد</option>
          <option value="REJECTED">مرفوض</option>
          <option value="SOLD">مباع</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label htmlFor="dateFrom" className="mb-1 text-gray-700">التاريخ من</label>
        <input
          id="dateFrom"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="dateTo" className="mb-1 text-gray-700">التاريخ إلى</label>
        <input
          id="dateTo"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg"
        />
      </div>
    </div>
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
      <GenericTable
        columns={columns}
        data={units}
        actions={actions}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        filters={filters}
      />
    </div>
  );
};

export default UnitReserve;