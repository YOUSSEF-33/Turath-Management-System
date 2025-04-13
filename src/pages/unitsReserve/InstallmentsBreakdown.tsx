import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../axiosInstance'; // Adjust the import path as needed
import { convertToArabicWords } from '../../utils/convertNumbers';
import * as XLSX from 'xlsx';
import { usePermissionsContext } from '../../context/PermissionsContext';
import { toast } from 'react-hot-toast';

interface Installment {
  date: string;
  amount: string;
  type: 'MONTHLY' | 'ANNUAL';
  cheque_number: string | null;
}

interface Reservation {
  id: string;
  installments_schedule: Installment[];
  final_price: string;
  down_payment: string;
  monthly_installment: string;
  months_count: number;
}

const InstallmentsBreakdown = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissionsContext();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const contractRef = useRef<HTMLDivElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [installmentToDelete, setInstallmentToDelete] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Fetch reservation data
  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const response = await axiosInstance.get(`/reservations/${id}`);
        setReservation(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('فشل في تحميل بيانات الحجز');
        console.error(err);
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id]);

  // Handle input changes for all fields
  const handleFieldChange = (index: number, field: keyof Installment, value: string) => {
    if (!reservation) return;
    const newSchedule = [...reservation.installments_schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setReservation({ ...reservation, installments_schedule: newSchedule });
  };

  // Handle print (PDF export)
  const handlePrint = () => {
    if (contractRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
          <head>
            <title>Print</title>
            <style>
              body { direction: rtl; font-family: Arial, sans-serif; }
              .contract { padding: 20px; }
              .contract h1 { text-align: center; margin-bottom: 20px; font-size: 24px; }
              .contract p { text-align: right; margin-bottom: 20px; font-size: 18px; }
              .contract table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .contract table, .contract th, .contract td { border: 1px solid black; }
              .contract th, .contract td { padding: 10px; text-align: right; font-size: 16px; }
              .contract th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            ${contractRef.current.innerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // Export data to Excel
  const exportToExcel = () => {
    if (!reservation) return;

    const data = [
      ['تاريخ الدفعة', 'نوع الدفعة', 'رقم الشيك', 'المبلغ بالأرقام', 'المبلغ بالحروف'],
      ...reservation.installments_schedule.map(installment => [
        installment.date,
        installment.type === 'MONTHLY' ? 'شهري' : 'سنوي',
        installment.cheque_number || '',
        installment.amount,
        convertToArabicWords(installment.amount)
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ملحق الأسعار');
    XLSX.writeFile(wb, 'ملحق_الأسعار.xlsx');
  };

  // Update the save button click handler
  const handleSave = async () => {
    if (!reservation) return;
    
    const savePromise = axiosInstance.put(`/reservations/${id}/installments-schedule`, {
      installments_schedule: reservation.installments_schedule.map(installment => ({
        date: installment.date,
        amount: installment.amount,
        cheque_number: installment.cheque_number,
        type: installment.type
      }))
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

  const handleDelete = (index: number) => {
    setInstallmentToDelete(index);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!reservation || installmentToDelete === null) return;
    
    setDeletingIndex(installmentToDelete);
    setDeleteModalOpen(false);
    
    // Wait for animation to complete before removing the row
    setTimeout(() => {
      const newSchedule = [...reservation.installments_schedule];
      newSchedule.splice(installmentToDelete, 1);
      setReservation({ ...reservation, installments_schedule: newSchedule });
      setDeletingIndex(null);
      setInstallmentToDelete(null);
    }, 500); // Match this with the CSS transition duration
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
  if (!reservation) {
    return <div className="p-6 text-center">لا توجد بيانات متاحة</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Export Buttons */}
      <div className="flex justify-end gap-4 mb-6">
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
            {reservation.installments_schedule.map((installment, index) => (
              <tr 
                key={index} 
                className={`
                  hover:bg-gray-50 transition-all duration-500
                  ${deletingIndex === index ? 'opacity-0 transform -translate-x-full' : ''}
                `}
              >
                <td className="py-3 px-4 border-b">
                  <input
                    type="date"
                    value={installment.date}
                    onChange={(e) => handleFieldChange(index, 'date', e.target.value)}
                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    disabled={!hasPermission('update_reservation_installments_schedule')}
                  />
                </td>
                <td className="py-3 px-4 border-b">
                  <select
                    value={installment.type}
                    onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    disabled={!hasPermission('update_reservation_installments_schedule')}
                  >
                    <option value="MONTHLY">شهري</option>
                    <option value="ANNUAL">سنوي</option>
                  </select>
                </td>
                <td className="py-3 px-4 border-b">
                  <input
                    type="text"
                    value={installment.cheque_number || ''}
                    onChange={(e) => handleFieldChange(index, 'cheque_number', e.target.value)}
                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="أدخل رقم الشيك"
                    disabled={!hasPermission('update_reservation_installments_schedule')}
                  />
                </td>
                <td className="py-3 px-4 border-b">
                  <input
                    type="number"
                    value={installment.amount}
                    onChange={(e) => handleFieldChange(index, 'amount', e.target.value)}
                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right ${
                      !hasPermission('update_reservation_installments_schedule') ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    min="0"
                    step="0.01"
                    disabled={!hasPermission('update_reservation_installments_schedule')}
                  />
                </td>
                <td className="py-3 px-4 border-b text-right">
                  {convertToArabicWords(installment.amount)}
                </td>
                {hasPermission('update_reservation_installments_schedule') && (
                  <td className="py-3 px-4 border-b text-center">
                    <button
                      onClick={() => handleDelete(index)}
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
          </tbody>
        </table>
      </div>

      {/* Add Row Buttons - Only show if user has permission */}
      {hasPermission('update_reservation_installments_schedule') && (
        <div className="mt-4 flex justify-end gap-4">
          <button
            onClick={() => {
              if (!reservation) return;
              const newSchedule = [...reservation.installments_schedule];
              const lastDate = newSchedule.length > 0 
                ? new Date(newSchedule[newSchedule.length - 1].date)
                : new Date();
              
              const nextDate = new Date(lastDate);
              if (newSchedule.length > 0 && newSchedule[newSchedule.length - 1].type === 'MONTHLY') {
                nextDate.setMonth(nextDate.getMonth() + 1);
              } else {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
              }

              newSchedule.push({
                date: nextDate.toISOString().split('T')[0],
                amount: newSchedule.length > 0 ? newSchedule[newSchedule.length - 1].amount : '0',
                type: newSchedule.length > 0 ? newSchedule[newSchedule.length - 1].type : 'MONTHLY',
                cheque_number: null
              });
              setReservation({ ...reservation, installments_schedule: newSchedule });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة دفعة جديدة
          </button>

          <button
            onClick={() => {
              if (!reservation) return;
              const newSchedule = [...reservation.installments_schedule];
              const lastDate = new Date(newSchedule[newSchedule.length - 1].date);
              const nextDate = new Date(lastDate);
              nextDate.setMonth(nextDate.getMonth() + 1);

              newSchedule.push({
                date: nextDate.toISOString().split('T')[0],
                amount: newSchedule[newSchedule.length - 1].amount,
                type: 'MONTHLY',
                cheque_number: null
              });
              setReservation({ ...reservation, installments_schedule: newSchedule });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة دفعة شهرية
          </button>

          <button
            onClick={() => {
              if (!reservation) return;
              const newSchedule = [...reservation.installments_schedule];
              const lastDate = new Date(newSchedule[newSchedule.length - 1].date);
              const nextDate = new Date(lastDate);
              nextDate.setFullYear(nextDate.getFullYear() + 1);

              newSchedule.push({
                date: nextDate.toISOString().split('T')[0],
                amount: newSchedule[newSchedule.length - 1].amount,
                type: 'ANNUAL',
                cheque_number: null
              });
              setReservation({ ...reservation, installments_schedule: newSchedule });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة دفعة سنوية
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
            {reservation.installments_schedule.map((installment, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{installment.date}</td>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>
                  {installment.type === 'MONTHLY' ? 'شهري' : 'سنوي'}
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