import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import { convertToArabicWords } from '../../utils/convertNumbers';
import { usePermissionsContext } from '../../context/PermissionsContext';
import { toast } from 'react-hot-toast';
import { message } from 'antd';

interface Installment {
  date: string;
  amount: string;
  type: 'MONTHLY' | 'ANNUAL' | 'QUARTERLY';
  cheque_number: string | null;
}

interface AdditionalExpense {
  date: string;
  amount: string;
  type: string;
  cheque_number: string | null;
}

interface Reservation {
  id: string;
  installments_schedule: Installment[];
  additional_expenses: AdditionalExpense[];
  final_price: string;
  down_payment: string;
  monthly_installment: string;
  months_count: number;
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
  const [pdfLoading, setPdfLoading] = useState(false);

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
          inst.type === 'مرافق' || inst.type === 'صيانة'
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
    
    setPdfLoading(true);
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
    } finally {
      setPdfLoading(false);
    }
  };

  // Export data to Excel
  const exportToExcel = async () => {
    if (!regularInstallments) return;
  
    try {
      const response = await axiosInstance.get(`/reservations/${id}/installments-schedule/excel`, {
        responseType: 'blob'
      });
  
      // Create a blob from the Excel data
      const file = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
  
      // Create a link and trigger download
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `ملحق_الأسعار_${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
  
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error('Error downloading Excel file:', err);
      message.error('فشل في تحميل ملف Excel');
    }
  };

  // Function to calculate total for a group of installments
  const calculateTotal = (installments: Installment[]) => {
    return installments.reduce((sum, inst) => sum + parseFloat(inst.amount), 0).toFixed(2);
  };

  // Function to get installments for update (excluding totals)
  const getInstallmentsForUpdate = () => {
    if (!regularInstallments) return [];
    return regularInstallments.filter(inst => 
      inst.type === 'MONTHLY' || inst.type === 'QUARTERLY' || inst.type === 'ANNUAL'
    );
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

  // Function to generate suggestions based on date order and pattern detection
  /* const generateSuggestions = (type: 'installment' | 'expense', index: number) => {
    const allItems = [...regularInstallments, ...additionalExpenses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const currentItem = type === 'installment' ? regularInstallments[index] : additionalExpenses[index];
    const currentDate = new Date(currentItem.date);

    const previousChecks = allItems
      .filter(item => new Date(item.date) < currentDate && item.cheque_number)
      .map(item => item.cheque_number) as string[];

    if (previousChecks.length === 0) {
      setChequeSuggestions(['1', '2', '3', '4', '5']);
      setShowSuggestions({ type, index });
      return;
    }

    const lastCheck = previousChecks[previousChecks.length - 1];
    if (!lastCheck) return;

    // Pattern detection
    const suggestions: string[] = [];

    // Check if the last check number is alphanumeric
    if (/^[a-zA-Z]+[0-9]+[a-zA-Z]*$/.test(lastCheck)) {
      // Pattern like "kh239f"
      const prefix = lastCheck.match(/^[a-zA-Z]+/)?.[0] || '';
      const suffix = lastCheck.match(/[a-zA-Z]*$/)?.[0] || '';
      const number = parseInt(lastCheck.match(/[0-9]+/)?.[0] || '0');

      // Generate next 5 suggestions maintaining the pattern
      for (let i = 1; i <= 5; i++) {
        suggestions.push(`${prefix}${(number + i).toString()}${suffix}`);
      }
    } else if (/^[0-9]+$/.test(lastCheck)) {
      // Pure numeric pattern
      const number = parseInt(lastCheck);
      const padding = lastCheck.length;

      // Generate next 5 suggestions with same padding
      for (let i = 1; i <= 5; i++) {
        suggestions.push((number + i).toString().padStart(padding, '0'));
      }
    } else {
      // For other patterns, just increment a number at the end
      suggestions.push(
        `${lastCheck}-1`,
        `${lastCheck}-2`,
        `${lastCheck}-3`,
        `${lastCheck}-4`,
        `${lastCheck}-5`
      );
    }

    setChequeSuggestions(suggestions);
    setShowSuggestions({ type, index });
  }; */

  // Add useEffect for handling click outside
  /* useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.suggestions-dropdown') && !target.closest('.cheque-input')) {
        setShowSuggestions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); */

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

              // Calculate totals
              const installmentsTotal = Math.round(regularInstallments
                .filter((inst:any) => inst.type !== 'مرافق' && inst.type !== 'صيانة')
                .reduce((sum, inst) => sum + parseFloat(inst.amount), 0));
              
              return (
                <>
                  {regularInstallments
                    .filter((inst:any) => inst.type !== 'مرافق' && inst.type !== 'صيانة')
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
                            // onFocus={() => generateSuggestions('installment', index)}
                            className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cheque-input ${
                              !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="أدخل رقم الشيك"
                            disabled={!hasPermission('update_reservation_installments_schedule')}
                          />
                          {/* {showSuggestions?.type === 'installment' && showSuggestions.index === index && chequeSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto z-50 suggestions-dropdown">
                              <div className="sticky top-0 bg-gray-50 border-b flex justify-between items-center px-2 py-1">
                                <span className="text-xs text-gray-600">اقتراحات الأرقام</span>
                                <button
                                  onClick={() => setShowSuggestions(null)}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                  title="إغلاق"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              </div>
                              <div className="py-1">
                                {chequeSuggestions.map((suggestion, i) => (
                                  <div
                                    key={i}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700 hover:text-blue-600 transition-colors duration-150"
                                    onClick={() => {
                                      handleInstallmentChange(index, 'cheque_number', suggestion);
                                      setShowSuggestions(null);
                                    }}
                                  >
                                    {suggestion}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )} */}
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
                    <td className="py-3 px-4 border-b text-right">الإجمالي</td>
                    <td className="py-3 px-4 border-b"></td>
                    <td className="py-3 px-4 border-b"></td>
                    <td className="py-3 px-4 border-b text-right">{installmentsTotal}</td>
                    <td className="py-3 px-4 border-b text-right">
                      {convertToArabicWords(installmentsTotal.toString())}
                    </td>
                    {hasPermission('update_reservation_installments_schedule') && <td></td>}
                  </tr>

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
                            // onFocus={() => generateSuggestions('expense', expenseIndex)}
                            className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cheque-input ${
                              !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="أدخل رقم الشيك"
                            disabled={!hasPermission('update_reservation_installments_schedule')}
                          />
                          {/* {showSuggestions?.type === 'expense' && showSuggestions.index === expenseIndex && chequeSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto z-50 suggestions-dropdown">
                              <div className="sticky top-0 bg-gray-50 border-b flex justify-between items-center px-2 py-1">
                                <span className="text-xs text-gray-600">اقتراحات الأرقام</span>
                                <button
                                  onClick={() => setShowSuggestions(null)}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                  title="إغلاق"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              </div>
                              <div className="py-1">
                                {chequeSuggestions.map((suggestion, i) => (
                                  <div
                                    key={i}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700 hover:text-blue-600 transition-colors duration-150"
                                    onClick={() => {
                                      handleExpenseChange(expenseIndex, 'cheque_number', suggestion);
                                      setShowSuggestions(null);
                                    }}
                                  >
                                    {suggestion}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )} */}
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
                    <td className="py-3 px-4 border-b text-right">
                      {Math.round(installmentsTotal + additionalExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0))}
                    </td>
                    <td className="py-3 px-4 border-b text-right">
                      {convertToArabicWords(Math.round(installmentsTotal + additionalExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)).toString())}
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