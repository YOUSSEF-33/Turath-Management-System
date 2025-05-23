import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Calendar, Edit } from 'lucide-react';
import GenericTable from './GenericTable';
import ReservationsFilter from './ReservationsFilter';
import axiosInstance from '../axiosInstance';
import { toast } from 'react-hot-toast';
import ReservationEditButton from './ReservationEditButton';

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
  user_id?: number;
  client?: { name: string; phone: string };
  [key: string]: unknown;
}

interface FilterValues {
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'SOLD';
  date_from?: string;
  date_to?: string;
  project_id?: number;
  building_id?: number;
  unit_id?: number;
  user_id?: number;
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
  showUnitColumn?: boolean;

  showActions?: boolean;
  extraColumns?: Column[];
  extraActions?: Action[];
  noDataMessage?: string;
}

interface PaginationInfo {
  current: number;
  pageSize: number;
  total: number;
}

const ReservationsTable: React.FC<ReservationsTableProps> = ({
  showUnitColumn = true,
  showActions = true,
  extraColumns = [],
  extraActions = [],
  noDataMessage = "لا توجد حجوزات",
}) => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [filters, setFilters] = useState<FilterValues>({});
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current: 1,
    pageSize: 10,
    total: 0
  });


  // Fetch reservations with filters and pagination
  const fetchReservations = async (filterParams: FilterValues, page: number = 1) => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReservations(filters);
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  // Handle filter submission
  const handleFilterSubmit = (newFilters: FilterValues) => {
    setFilters(newFilters);
    fetchReservations(newFilters, 1); // Reset to first page when filters change
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchReservations(filters, page);
  };

  // Handle view reservation details
  const handleViewReservation = (id: number) => {
    navigate(`/reservations/${id}`);
  };

  // Handle reservation addendum
  const handleReservationAddendum = (id: number) => {
    navigate(`/reservations/${id}/installments-breakdown`);
  };

  const handleEditReservation = (id: number) => {
    navigate(`/reservations/${id}/edit`);
  };

  // Base columns that will always be included
  const baseColumns: Column[] = [
    { 
      header: 'اسم المشروع', 
      key: 'project',
      render: (_value: unknown, row: Record<string, unknown>): React.ReactNode => {
        const unit = row.unit as { building: { project: { name: string } } } | undefined;
        return unit?.building?.project?.name || '-';
      }
    },
    { 
      header: 'بيانات العميل', 
      key: 'client',
      render: (_value: unknown, row: Record<string, unknown>): React.ReactNode => {
        const client = row.client as { name: string; phone: string } | undefined;
        if (!client) return '-';
        return (
          <div className="flex flex-col">
            <span className="font-medium">{client.name || '-'}</span>
            <span className="text-sm text-gray-500">{client.phone || '-'}</span>
          </div>
        );
      }
    },
    { 
      header: 'الحالة', 
      key: 'status',
      render: (value: unknown): React.ReactNode => {
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
      render: (value: unknown): React.ReactNode => {
        if (!value) return '-';
        if (typeof value === 'string') {
          return new Date(value).toLocaleDateString('ar-EG');
        }
        return String(value);
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
    optionalColumns.push({ 
      header: 'رقم الوحدة', 
      key: 'unit_number',
      render: (_value: unknown, row: Record<string, unknown>): React.ReactNode => {
        const unit = row.unit as { unit_number: string } | undefined;
        return unit?.unit_number || '-';
      }
    });
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
    return reservations.length > 0 && reservations.some(res => res[column.key] !== undefined);
  });

  // Combine all columns
  const allColumns: Column[] = [
    ...optionalColumns,
    ...baseColumns,
    ...filteredConditionalColumns,
    ...extraColumns
  ];

  // Add edit action using the new ReservationEditButton
  const getActions = (row: ReservationData): Action[] => {
    const baseActions: Action[] = [
      {
        key: 'view',
        icon: <Eye className="h-5 w-5" />,
        onClick: handleViewReservation,
        color: 'text-gray-600 hover:text-gray-800'
      },
      {
        key: 'addendum',
        icon: <Calendar className="h-5 w-5" />,
        onClick: handleReservationAddendum,
        color: 'text-green-600 hover:text-green-800'
      }
    ];

    if (!showActions) return [];

    return [
      ...baseActions,
      {
        key: 'edit',
        icon: <ReservationEditButton reservationId={row.id} />,
        onClick: () => {}, // This won't be called since we're using ReservationEditButton
        color: ''
      },
      ...extraActions
    ];
  };

  return (
    <div>
      <ReservationsFilter
        onFilterChange={handleFilterChange}
        onFilterSubmit={handleFilterSubmit}
      />
      <GenericTable
        columns={allColumns}
        data={reservations as unknown as Record<string, unknown>[]}
        actions={getActions}
        loading={isLoading}
        noDataMessage={noDataMessage}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: handlePageChange
        }}
      />
    </div>
  );
};

export default ReservationsTable; 