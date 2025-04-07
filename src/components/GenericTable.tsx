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
  title?: string;  // Add title property to Action interface
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
    <div>
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-4">
        {/* Create Button */}
        {onCreate && (
          <button
            onClick={onCreate}
            className="inline-flex items-center px-4 py-2 bg-[#8884d8] text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#8884d8] focus:ring-offset-2 w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 ml-2" />
            {createButtonText || 'إنشاء جديد'}
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-full px-4 sm:px-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap ${
                      index === columns.length - 1 ? 'pl-4' : ''
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th scope="col" className="pl-3 sm:pl-4 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap">
                    الإجراءات
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={actions ? columns.length + 1 : columns.length}
                    className="px-3 sm:px-4 py-8 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <div className="loader mx-auto"></div>
                      <span className="mr-2 text-gray-600">جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={actions ? columns.length + 1 : columns.length}
                    className="px-3 sm:px-4 py-8 text-center text-gray-500"
                  >
                    {noDataMessage || 'لا توجد بيانات'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`hover:bg-gray-50 transition-colors ${
                      rowIndex === paginatedData.length - 1 ? '' : 'border-b border-gray-200'
                    }`}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={`${rowIndex}-${column.key}`}
                        className={`px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base text-gray-900 align-middle ${
                          colIndex === columns.length - 1 ? 'pl-4' : ''
                        }`}
                      >
                        {column.render
                          ? column.render(item[column.key], item)
                          : item[column.key]?.toString() || '-'}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className="pl-3 sm:pl-4 py-3 sm:py-4 text-sm whitespace-nowrap">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {actions.map((action) => (
                            <button
                              key={action.key}
                              onClick={() => action.onClick(Number(item.id || 0))}
                              className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${action.color}`}
                              title={action.title}
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 space-x-reverse mt-4 sm:mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                currentPage === page
                  ? 'bg-[#8884d8] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
};

export default GenericTable;