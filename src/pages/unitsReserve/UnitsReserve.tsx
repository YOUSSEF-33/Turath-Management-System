import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Check, X } from 'lucide-react'; // Added Check and X icons
import { useState } from 'react';
import GenericTable from '../../components/GenericTable';

// Mock data for reserved, sold, and pending units
const reservedUnits = [
  { id: 1, number: '101', type: 'villa', area: 200, client: 'علي محمد' },
  { id: 2, number: '102', type: 'apartment', area: 120, client: 'فاطمة أحمد' },
];

const soldUnits = [
  { id: 3, number: '201', type: 'duplex', area: 180, client: 'خالد سعيد' },
  { id: 4, number: '202', type: 'villa', area: 250, client: 'ليلى عبدالله' },
];

const pendingUnits = [
  { id: 5, number: '301', type: 'studio', area: 80, client: 'محمد علي' },
  { id: 6, number: '302', type: 'apartment', area: 110, client: 'سارة يوسف' },
];

const UnitReserve = () => {
  const navigate = useNavigate();
  const [reservedPage, setReservedPage] = useState(1);
  const [soldPage, setSoldPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const itemsPerPage = 5;

  const handleReserveUnit = () => {
    navigate('/units-reserve/reserve');
  };

  const handleViewUnit = (id: number) => {
    navigate(`/units/view/${id}`);
  };

  const handleAcceptUnit = (id: number) => {
    // Logic to accept the unit
    console.log(`Unit ${id} accepted`);
  };

  const handleRejectUnit = (id: number) => {
    // Logic to reject the unit
    console.log(`Unit ${id} rejected`);
  };

  const reservedColumns = [
    { header: 'رقم الوحدة', key: 'number' },
    { header: 'النوع', key: 'type' },
    { header: 'المساحة', key: 'area' },
    { header: 'العميل', key: 'client' },
  ];

  const soldColumns = [
    { header: 'رقم الوحدة', key: 'number' },
    { header: 'النوع', key: 'type' },
    { header: 'المساحة', key: 'area' },
    { header: 'العميل', key: 'client' },
  ];

  const pendingColumns = [
    { header: 'رقم الوحدة', key: 'number' },
    { header: 'النوع', key: 'type' },
    { header: 'المساحة', key: 'area' },
    { header: 'العميل', key: 'client' },
  ];

  const reservedActions = [
    { key: 'view', icon: <Eye className="h-5 w-5" />, onClick: handleViewUnit, color: 'text-blue-600' },
  ];

  const soldActions = [
    { key: 'view', icon: <Eye className="h-5 w-5" />, onClick: handleViewUnit, color: 'text-blue-600' },
  ];

  const pendingActions = [
    { key: 'accept', icon: <Check className="h-5 w-5" />, onClick: handleAcceptUnit, color: 'text-green-600' },
    { key: 'reject', icon: <X className="h-5 w-5" />, onClick: handleRejectUnit, color: 'text-red-600' },
  ];

  return (
    <div className="p-6 bg-gray-50 md:m-4 md:rounded my-2">
      {/* Button to Reserve Unit */}
      <div className="mb-6 flex justify-start">
        <button
          onClick={handleReserveUnit}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="ml-2 h-5 w-5" />
          حجز وحدة
        </button>
      </div>

      {/* Reserved Units Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">الوحدات المحجوزة</h2>
        <GenericTable
          columns={reservedColumns}
          data={reservedUnits}
          actions={reservedActions}
          itemsPerPage={itemsPerPage}
          currentPage={reservedPage}
          onPageChange={setReservedPage}
        />
      </div>

      {/* Sold Units Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">الوحدات المباعة</h2>
        <GenericTable
          columns={soldColumns}
          data={soldUnits}
          actions={soldActions}
          itemsPerPage={itemsPerPage}
          currentPage={soldPage}
          onPageChange={setSoldPage}
        />
      </div>

      {/* Pending Units Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">الوحدات المعلقه</h2>
        <GenericTable
          columns={pendingColumns}
          data={pendingUnits}
          actions={pendingActions}
          itemsPerPage={itemsPerPage}
          currentPage={pendingPage}
          onPageChange={setPendingPage}
        />
      </div>
    </div>
  );
};

export default UnitReserve;