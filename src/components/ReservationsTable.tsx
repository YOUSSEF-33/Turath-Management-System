import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Calendar } from 'lucide-react';
import GenericTable from './GenericTable';

interface ReservationData {
  id: number;
  client_id?: number;
  unit_id?: number;
  status: string;
  contract_date: string;
  final_price: number | string;
  down_payment?: number | string;
  monthly_installment?: number | string;
  months_count?: number;
  reservation_deposit?: number | string;
  [key: string]: unknown;
}

interface Column {
  header: string;
  key: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface Action {
  key: string;
  icon: React.ReactNode;
  onClick: (id: number) => void;
  color: string;
}

interface ReservationsTableProps {
  reservations: ReservationData[];
  loading?: boolean;
  showUnitColumn?: boolean;
  showClientColumn?: boolean;
  showActions?: boolean;
  extraColumns?: Column[];
  extraActions?: Action[];
  noDataMessage?: string;
  // Pagination props
  itemsPerPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // Filters
  filters?: React.ReactNode;
}

const ReservationsTable: React.FC<ReservationsTableProps> = ({
  reservations,
  loading = false,
  showUnitColumn = true,
  showClientColumn = true,
  showActions = true,
  extraColumns = [],
  extraActions = [],
  noDataMessage = "لا توجد حجوزات",
  itemsPerPage,
  totalPages,
  onPageChange,
  filters,
}) => {
  const navigate = useNavigate();

  // Handle view reservation details
  const handleViewReservation = (id: number) => {
    navigate(`/units-reserve/details/${id}`);
  };

  // Handle reservation addendum
  const handleReservationAddendum = (id: number) => {
    navigate(`/units-reserve/details/${id}/accept`);
  };

  // Base columns that will always be included
  const baseColumns: Column[] = [
    { header: 'رقم الحجز', key: 'id' },
    { 
      header: 'الحالة', 
      key: 'status',
      render: (value: unknown) => {
        const status = value as string;
        const statusColors: Record<string, string> = {
          'معلق': 'text-yellow-500',
          'مؤكد': 'text-green-500',
          'مرفوض': 'text-red-500',
          'مباع': 'text-blue-500',
          'PENDING': 'text-yellow-500',
          'CONFIRMED': 'text-green-500',
          'REJECTED': 'text-red-500',
          'SOLD': 'text-blue-500'
        };
        return <span className={statusColors[status] || 'text-gray-500'}>{status}</span>;
      } 
    },
    { 
      header: 'تاريخ العقد', 
      key: 'contract_date', 
      render: (value: unknown) => {
        if (!value) return '-';
        if (typeof value === 'string') {
          return new Date(value as string).toLocaleDateString('ar-EG');
        }
        return value;
      } 
    },
    { 
      header: 'السعر النهائي', 
      key: 'final_price',
      render: (value: unknown): React.ReactNode => value ? `${value} جنيه` : '-'
    },
  ];

  // Optional columns based on props
  const optionalColumns: Column[] = [];
  
  if (showUnitColumn) {
    optionalColumns.push({ header: 'رقم الوحدة', key: 'unit_id' });
  }
  
  if (showClientColumn) {
    optionalColumns.push({ header: 'رقم العميل', key: 'client_id' });
  }

  // Conditional columns that should be included if the data exists
  const conditionalColumns: Column[] = [
    { 
      header: 'الدفعة المقدمة', 
      key: 'down_payment',
      render: (value: unknown): React.ReactNode => value ? `${value} جنيه` : '-'
    },
    { 
      header: 'القسط الشهري', 
      key: 'monthly_installment',
      render: (value: unknown): React.ReactNode => value ? `${value} جنيه` : '-'
    },
    { 
      header: 'عدد الأشهر', 
      key: 'months_count' 
    },
    {
      header: 'دفعة الحجز',
      key: 'reservation_deposit',
      render: (value: unknown): React.ReactNode => value ? `${value} جنيه` : '-'
    }
  ];

  // Filter out conditional columns if they don't exist in the data
  const filteredConditionalColumns = conditionalColumns.filter(column => {
    // Check if at least one reservation has this property
    return reservations.length > 0 && reservations.some(res => res[column.key] !== undefined);
  });

  // Combine all columns
  const allColumns: Column[] = [
    ...optionalColumns,
    ...baseColumns,
    ...filteredConditionalColumns,
    ...extraColumns
  ];

  // Default actions for reservations
  const defaultActions: Action[] = showActions ? [
    { 
      key: 'view', 
      icon: <Eye className="h-5 w-5" />, 
      onClick: handleViewReservation, 
      color: 'text-blue-600' 
    },
    { 
      key: 'booking', 
      icon: <Calendar className="h-5 w-5" />, 
      onClick: handleReservationAddendum, 
      color: 'text-green-600' 
    },
  ] : [];

  // Combine default and extra actions
  const allActions: Action[] = [...defaultActions, ...extraActions];

  return (
    <GenericTable
      columns={allColumns}
      data={reservations as unknown as Record<string, unknown>[]}
      actions={allActions}
      loading={loading}
      noDataMessage={noDataMessage}
      itemsPerPage={itemsPerPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      filters={filters}
    />
  );
};

export default ReservationsTable; 