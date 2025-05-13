import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import { convertToArabicWords } from '../../utils/convertNumbers';
import { usePermissionsContext } from '../../context/PermissionsContext';
import { toast } from 'react-hot-toast';
import { message } from 'antd';
import * as XLSX from 'xlsx';

interface Installment {
  date: string;
  amount: string;
  type: 'MONTHLY' | 'ANNUAL' | 'QUARTERLY' | string;
  cheque_number: string | null;
}

interface AdditionalExpense {
  date: string;
  amount: string;
  type: string;
  cheque_number: string | null;
}

const InstallmentsBreakdown = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissionsContext();
  const [regularInstallments, setRegularInstallments] = useState<Installment[]>([]);
  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const contractRef = useRef<HTMLDivElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [installmentToDelete, setInstallmentToDelete] = useState<{type: 'installment' | 'expense', index: number} | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch reservation data
  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const response = await axiosInstance.get(`/reservations/${id}`);
        const data = response.data.data;
        
        // Separate installments and expenses
        const regular = data.installments_schedule.filter((inst: any) => 
          inst.type === 'MONTHLY' || inst.type === 'QUARTERLY' || inst.type === 'ANNUAL'
        );
        
        const expenses = data.installments_schedule.filter((inst: any) => 
          inst.type === 'وديعة صيانة' || inst.type === 'حصة جراش + مرافق'
        );
        
        setRegularInstallments(regular);
        setAdditionalExpenses(expenses);
        setLoading(false);
      } catch (err) {
        setError('فشل في تحميل بيانات الحجز');
        console.error(err);
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id]);

  //console.log(regularInstallments);
  console.log(additionalExpenses)

  // Handle input changes for installments
  const handleInstallmentChange = (index: number, field: keyof Installment, value: string) => {
    setRegularInstallments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handle input changes for expenses  
  const handleExpenseChange = (index: number, field: keyof AdditionalExpense, value: string) => {
    setAdditionalExpenses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handle print (PDF export)
  const handlePrint = async () => {
    if (!regularInstallments) return;
    
    try {
      const response = await axiosInstance.get(`/reservations/${id}/installments-schedule/pdf`, {
        responseType: 'blob'
      });
      
      // Create a blob from the PDF stream
      const file = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a link and trigger download
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `ملحق_الأسعار_${id}.pdf`; // Set filename for download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error('Error fetching PDF:', err);
      message.error('فشل في تحميل ملف PDF');
    }
  };

  // Export data to Excel
  const exportToExcel = async () => {
    if (!regularInstallments) return;
  
    try {
      // Prepare regular installments data
      const regularData = regularInstallments
        .filter(inst => ['MONTHLY', 'QUARTERLY', 'ANNUAL'].includes(inst.type))
        .map(inst => ({
          'تاريخ الدفعة': inst.date,
          'نوع الدفعة': inst.type === 'MONTHLY' ? 'شهري' : 
                        inst.type === 'QUARTERLY' ? 'ربع سنوي' : 'سنوي',
          'رقم الشيك': inst.cheque_number || '',
          'المبلغ بالأرقام': Math.round(parseFloat(inst.amount)),
          'المبلغ بالحروف': convertToArabicWords(inst.amount)
        }));

      // Add الاجمالي row for regular installments
      const regularTotal = Math.round(calculateRegularInstallmentsTotal());
      regularData.push({
        'تاريخ الدفعة': '',
        'نوع الدفعة': 'الاجمالي',
        'رقم الشيك': '',
        'المبلغ بالأرقام': regularTotal,
        'المبلغ بالحروف': convertToArabicWords(regularTotal.toString())
      });

      // Add additional expenses data (both from regularInstallments and additionalExpenses)
      const allAdditionalExpenses = [
        ...regularInstallments.filter(inst => ['حصة جراش + مرافق', 'وديعة صيانة'].includes(inst.type)),
        ...additionalExpenses
      ];

      const additionalData = allAdditionalExpenses.map(inst => ({
        'تاريخ الدفعة': inst.date,
        'نوع الدفعة': inst.type,
        'رقم الشيك': inst.cheque_number || '',
        'المبلغ بالأرقام': Math.round(parseFloat(inst.amount)),
        'المبلغ بالحروف': convertToArabicWords(inst.amount)
      }));

      // Add الاجمالي الكلي row
      const grandTotal = Math.round(calculateGrandTotal());
      additionalData.push({
        'تاريخ الدفعة': '',
        'نوع الدفعة': 'الاجمالي الكلي',
        'رقم الشيك': '',
        'المبلغ بالأرقام': grandTotal,
        'المبلغ بالحروف': convertToArabicWords(grandTotal.toString())
      });

      // Combine all data
      const allData = [...regularData, ...additionalData];

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(allData, { skipHeader: false });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ملحق الأسعار');
      
      // Auto-size columns
      const maxWidth = allData.reduce((w, r) => Math.max(w, r['المبلغ بالحروف'].length), 10);
      const wscols = [
        { wch: 12 }, // تاريخ الدفعة
        { wch: 15 }, // نوع الدفعة
        { wch: 12 }, // رقم الشيك
        { wch: 15 }, // المبلغ بالأرقام
        { wch: maxWidth } // المبلغ بالحروف
      ];
      ws['!cols'] = wscols;

      // Save file
      XLSX.writeFile(wb, `ملحق_الأسعار_${id}.xlsx`);
      
      message.success('تم تصدير الملف بنجاح');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      message.error('فشل في تصدير الملف');
    }
  };

  const handleExcelImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Filter out total rows and transform data
      const transformedInstallments = jsonData
        .filter((row: any) => {
          const type = row['نوع الدفعة']?.toString().trim();
          return !['الاجمالي', 'الاجمالي الكلي'].includes(type);
        })
        .map((row: any) => {
          // Convert amount to string and handle any formatting
          const amount = row['المبلغ بالأرقام']?.toString().replace(/[^\d.-]/g, '') || '0';
          
          // Handle payment type mapping
          let type = row['نوع الدفعة']?.toString().trim();
          switch(type?.toLowerCase()) {
            case 'شهري':
              type = 'MONTHLY';
              break;
            case 'ربع سنوي':
              type = 'QUARTERLY';
              break;
            case 'سنوي':
              type = 'ANNUAL';
              break;
            case 'حصة جراش + مرافق':
            case 'وديعة صيانة':
              // Keep these types as is
              break;
            default:
              type = 'MONTHLY'; // Default to monthly if unspecified
          }

          // Parse and format date
          let date = row['تاريخ الدفعة'];
          if (date) {
            // Handle Excel date number format
            if (typeof date === 'number') {
              date = new Date(Math.round((date - 25569) * 86400 * 1000));
            } else {
              // Try to parse string date
              date = new Date(date);
            }
            // Format date to YYYY-MM-DD
            date = date.toISOString().split('T')[0];
          } else {
            date = new Date().toISOString().split('T')[0];
          }

          return {
            date,
            amount: Math.round(parseFloat(amount)).toString(),
            type,
            cheque_number: row['رقم الشيك']?.toString() || null
          };
        });

      // Separate regular installments and additional expenses
      const regular = transformedInstallments.filter(inst => 
        ['MONTHLY', 'QUARTERLY', 'ANNUAL'].includes(inst.type)
      );
      
      const expenses = transformedInstallments.filter(inst => 
        ['حصة جراش + مرافق', 'وديعة صيانة'].includes(inst.type)
      );

      // Sort regular installments by date
      regular.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setRegularInstallments(regular);
      setAdditionalExpenses(expenses);

      message.success('تم استيراد البيانات بنجاح');
    } catch (error) {
      console.error('Error importing Excel file:', error);
      message.error('حدث خطأ أثناء استيراد الملف');
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Function to calculate total for regular installments
  const calculateRegularInstallmentsTotal = () => {
    return regularInstallments
      .filter(inst => ['MONTHLY', 'QUARTERLY', 'ANNUAL'].includes(inst.type))
      .reduce((sum, inst) => sum + parseFloat(inst.amount), 0);
  };

  // Function to calculate total for additional expenses
  const calculateAdditionalExpensesTotal = () => {
    return [...regularInstallments, ...additionalExpenses]
      .filter(inst => ['حصة جراش + مرافق', 'وديعة صيانة'].includes(inst.type))
      .reduce((sum, inst) => sum + parseFloat(inst.amount), 0);
  };

  // Function to calculate grand total
  const calculateGrandTotal = () => {
    return Math.round(calculateRegularInstallmentsTotal() + calculateAdditionalExpensesTotal());
  };

  // Update the save button click handler
  const handleSave = async () => {
    const allInstallments = [
      ...regularInstallments,
      ...additionalExpenses
    ];

    const savePromise = axiosInstance.put(`/reservations/${id}/installments-schedule`, {
      installments_schedule: allInstallments
    });

    toast.promise(savePromise, {
      loading: 'جاري حفظ التغييرات...',
      success: 'تم حفظ التغييرات بنجاح',
      error: 'حدث خطأ أثناء حفظ التغييرات'
    });

    try {
      await savePromise;
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleDelete = (type: 'installment' | 'expense', index: number) => {
    setInstallmentToDelete({ type, index });
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!installmentToDelete) return;
    
    setDeleteModalOpen(false);
    
    setTimeout(() => {
      if (installmentToDelete.type === 'installment') {
        setRegularInstallments(prev => prev.filter((_, i) => i !== installmentToDelete.index));
      } else {
        setAdditionalExpenses(prev => prev.filter((_, i) => i !== installmentToDelete.index));
      }
      setInstallmentToDelete(null);
    }, 500);
  };

  // Loading state
  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  // Error state
  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  // No reservation data
  if (!regularInstallments) {
    return <div className="p-6 text-center">لا توجد بيانات متاحة</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Export Buttons */}
      <div className="flex justify-end gap-4 mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleExcelImport}
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
        />
        <button 
          onClick={() => navigate(`/reservations/${id}`)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          عرض التفاصيل
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importLoading || !hasPermission('update_reservation_installments_schedule')}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {importLoading ? 'جاري الاستيراد...' : 'استيراد من Excel'}
        </button>
        <button 
          onClick={exportToExcel} 
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          تصدير إلى Excel
        </button>
        <button 
          onClick={handlePrint} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          طباعة
        </button>
      </div>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">ملحق الأسعار</h1>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف هذه الدفعة؟</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setInstallmentToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Installments Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 border-b text-right font-semibold text-gray-700">تاريخ الدفعة</th>
              <th className="py-3 px-4 border-b text-right font-semibold text-gray-700">نوع الدفعة</th>
              <th className="py-3 px-4 border-b text-right font-semibold text-gray-700">رقم الشيك</th>
              <th className="py-3 px-4 border-b text-right font-semibold text-gray-700">المبلغ بالأرقام</th>
              <th className="py-3 px-4 border-b text-right font-semibold text-gray-700">المبلغ بالحروف</th>
              {hasPermission('update_reservation_installments_schedule') && (
                <th className="py-3 px-4 border-b text-right font-semibold text-gray-700">إجراءات</th>
              )}
            </tr>
          </thead>
          <tbody>
            {(() => {
              if (!regularInstallments) return null;

              const installmentsTotal = Math.round(calculateRegularInstallmentsTotal());
              
              return (
                <>
                  {/* Regular Installments */}
                  {regularInstallments
                    .filter(inst => ['MONTHLY', 'QUARTERLY', 'ANNUAL'].includes(inst.type))
                    .map((installment, index) => (
                    <tr 
                      key={index}
                      className="hover:bg-gray-50 transition-all duration-500"
                    >
                      <td className="py-3 px-4 border-b">
                        <input
                          type="date"
                          value={installment.date}
                          onChange={(e) => handleInstallmentChange(index, 'date', e.target.value)}
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          disabled={!hasPermission('update_reservation_installments_schedule')}
                        />
                      </td>
                      <td className="py-3 px-4 border-b">
                        <select
                          value={installment.type}
                          onChange={(e) => handleInstallmentChange(index, 'type', e.target.value)}
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          disabled={!hasPermission('update_reservation_installments_schedule')}
                        >
                          <option value="MONTHLY">شهري</option>
                          <option value="QUARTERLY">ربع سنوي</option>
                          <option value="ANNUAL">سنوي</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 border-b relative">
                        <div className="relative">
                          <input
                            type="text"
                            value={installment.cheque_number || ''}
                            onChange={(e) => handleInstallmentChange(index, 'cheque_number', e.target.value)}
                            className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cheque-input ${
                              !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="أدخل رقم الشيك"
                            disabled={!hasPermission('update_reservation_installments_schedule')}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 border-b">
                        <input
                          type="number"
                          value={Math.round(parseFloat(installment.amount))}
                          onChange={(e) => handleInstallmentChange(index, 'amount', Math.round(parseFloat(e.target.value)).toString())}
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right ${
                            !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          min="0"
                          step="1"
                          disabled={!hasPermission('update_reservation_installments_schedule')}
                        />
                      </td>
                      <td className="py-3 px-4 border-b text-right">
                        {convertToArabicWords(installment.amount)}
                      </td>
                      {hasPermission('update_reservation_installments_schedule') && (
                        <td className="py-3 px-4 border-b text-center">
                          <button
                            onClick={() => handleDelete('installment', index)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors duration-200"
                            title="حذف الدفعة"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {/* Total Installments Row */}
                  <tr className="bg-blue-50 font-bold">
                    <td className="py-3 px-4 border-b text-right">إجمالي الأقساط</td>
                    <td className="py-3 px-4 border-b"></td>
                    <td className="py-3 px-4 border-b"></td>
                    <td className="py-3 px-4 border-b text-right">{installmentsTotal}</td>
                    <td className="py-3 px-4 border-b text-right">
                      {convertToArabicWords(installmentsTotal.toString())}
                    </td>
                    {hasPermission('update_reservation_installments_schedule') && <td></td>}
                  </tr>

                  {/* Additional Prices Rows */}
                  {regularInstallments
                    .filter(inst => ['حصة جراش + مرافق', 'وديعة صيانة'].includes(inst.type))
                    .map((inst, index) => (
                      <tr key={`additional-${index}`} className="bg-gray-50">
                        <td className="py-3 px-4 border-b text-right">{inst.date}</td>
                        <td className="py-3 px-4 border-b text-right font-medium">{inst.type}</td>
                        <td className="py-3 px-4 border-b text-right">{inst.cheque_number || '-'}</td>
                        <td className="py-3 px-4 border-b text-right">{Math.round(parseFloat(inst.amount))}</td>
                        <td className="py-3 px-4 border-b text-right">
                          {convertToArabicWords(inst.amount)}
                        </td>
                        {hasPermission('update_reservation_installments_schedule') && <td></td>}
                      </tr>
                    ))}

                  {/* Additional Expenses Rows */}
                  {additionalExpenses.map((expense, expenseIndex) => (
                    <tr key={`expense-${expenseIndex}`} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">
                        <input
                          type="date"
                          value={expense.date}
                          onChange={(e) => handleExpenseChange(expenseIndex, 'date', e.target.value)}
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          disabled={!hasPermission('update_reservation_installments_schedule')}
                        />
                      </td>
                      <td className="py-3 px-4 border-b">
                        <select
                          value={expense.type}
                          onChange={(e) => handleExpenseChange(expenseIndex, 'type', e.target.value)}
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          disabled={true}
                        >
                          <option value="مرافق">مرافق</option>
                          <option value="صيانة">صيانة</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 border-b relative">
                        <div className="relative">
                          <input
                            type="text"
                            value={expense.cheque_number || ''}
                            onChange={(e) => handleExpenseChange(expenseIndex, 'cheque_number', e.target.value)}
                            className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cheque-input ${
                              !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="أدخل رقم الشيك"
                            disabled={!hasPermission('update_reservation_installments_schedule')}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 border-b">
                        <input
                          type="number"
                          value={Math.round(parseFloat(expense.amount))}
                          onChange={(e) => handleExpenseChange(expenseIndex, 'amount', Math.round(parseFloat(e.target.value)).toString())}
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right ${
                            !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          min="0"
                          step="1"
                          disabled={!hasPermission('update_reservation_installments_schedule')}
                        />
                      </td>
                      <td className="py-3 px-4 border-b text-right">
                        {convertToArabicWords(expense.amount)}
                      </td>
                      {hasPermission('update_reservation_installments_schedule') && <td></td>}
                    </tr>
                  ))}

                  {/* Final Total Row */}
                  <tr className="bg-green-50 font-bold">
                    <td className="py-3 px-4 border-b text-right">الإجمالي الكلي</td>
                    <td className="py-3 px-4 border-b"></td>
                    <td className="py-3 px-4 border-b"></td>
                    <td className="py-3 px-4 border-b text-right">{calculateGrandTotal()}</td>
                    <td className="py-3 px-4 border-b text-right">
                      {convertToArabicWords(calculateGrandTotal().toString())}
                    </td>
                    {hasPermission('update_reservation_installments_schedule') && <td></td>}
                  </tr>
                </>
              );
            })()}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      {hasPermission('update_reservation_installments_schedule') && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              const newSchedule = [...regularInstallments];
              
              // Sort by date to find the last date
              const sortedByDate = [...newSchedule].sort((a, b) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              
              const lastDate = sortedByDate.length > 0 
                ? new Date(sortedByDate[sortedByDate.length - 1].date)
                : new Date();
                
              const nextDate = new Date(lastDate);
              nextDate.setMonth(nextDate.getMonth() + 1);

              const newInstallment: Installment = {
                date: nextDate.toISOString().split('T')[0],
                amount: sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].amount : "0",
                type: 'MONTHLY',
                cheque_number: null
              };

              newSchedule.push(newInstallment);
              
              // Sort the entire schedule by date
              newSchedule.sort((a, b) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              
              setRegularInstallments(newSchedule);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة دفعة جديدة
          </button>
        </div>
      )}

      {/* Save Button - Only show if user has permission */}
      {hasPermission('update_reservation_installments_schedule') && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            حفظ التغييرات
          </button>
        </div>
      )}

      {/* Hidden Div for PDF Export */}
      <div ref={contractRef} style={{ display: 'none' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '24px' }}>ملحق الأسعار</h1>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>تاريخ الدفعة</th>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>نوع الدفعة</th>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>رقم الشيك</th>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>المبلغ بالأرقام</th>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>المبلغ بالحروف</th>
            </tr>
          </thead>
          <tbody>
            {regularInstallments.map((installment, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{installment.date}</td>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>
                  {installment.type === 'MONTHLY' ? 'شهري' : installment.type === 'QUARTERLY' ? 'ربع سنوي' : 'سنوي'}
                </td>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{installment.cheque_number || ''}</td>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{installment.amount}</td>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{convertToArabicWords(installment.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InstallmentsBreakdown;