import { Plus } from 'lucide-react';
import { useState } from 'react';

interface Column {
  key: string;
  header: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface Action {
  key: string;
  icon: React.ReactNode;
  onClick: (id: number) => void;
  color?: string;
}

interface GenericTableProps {
  data: Record<string, unknown>[];
  columns: Column[];
  actions?: Action[];
  onCreate?: () => void;
  createButtonText?: string;
  noDataMessage?: string;
  itemsPerPage?: number;
  loading?: boolean;
  filters?: React.ReactNode;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const GenericTable = ({
  data,
  columns,
  actions,
  onCreate,
  createButtonText = 'إضافة جديد',
  noDataMessage = 'لا توجد بيانات لعرضها',
  loading = false,
  filters,
  totalPages = 1,
  onPageChange,
}: GenericTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const paginatedData = data;

  return (
    <div className="p-6">
      {onCreate && (
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={onCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus className="ml-2 h-5 w-5" />
            {createButtonText}
          </button>
        </div>
      )}
      {filters && <div className="mb-4">{filters}</div>}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-right text-sm font-semibold text-gray-600"
                  >
                    {column.header}
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                    الإجراءات
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-4 text-center text-sm text-gray-900">
                    <div className="loader mx-auto"></div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-4 text-center text-sm text-gray-900">
                    {noDataMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column) => (
                      <td 
                        key={column.key} 
                        className={`px-6 py-4 text-sm text-gray-900 ${column.key === 'is_active' ? 'text-center' : ''}`}
                      >
                        {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex justify-center space-x-2">
                          {actions.map((action) => (
                            <button
                              key={action.key}
                              onClick={() => action.onClick(Number(row.id || 0))}
                              className={`${action.color || 'text-gray-600'} mx-2 hover:text-${
                                action.color?.split('-')[1] || 'gray'
                              }-800`}
                            >
                              {action.icon}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center p-4 bg-gray-100">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            السابق
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenericTable;