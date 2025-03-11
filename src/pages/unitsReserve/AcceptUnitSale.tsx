import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../axiosInstance'; // Adjust the import path as needed
import { convertToArabicWords } from '../../utils/convertNumbers';
import * as XLSX from 'xlsx';

const AcceptUnitSale = () => {
  const { id } = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState({ totalAmount: 0, checkDate: '', checkNumber: '', maintenanceDeposit: '', maintenanceDate: '', maintenanceCheckNumber: '' });
  const contractRef = useRef<HTMLDivElement>(null);

  // Fetch reservation data
  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const response = await axiosInstance.get(`/reservations/${id}`);
        setReservation(response.data.data);

        // Generate installment rows
        const { final_price, down_payment, monthly_installment, months_count } = response.data.data;
        const installmentRows = generateInstallmentRows(final_price, down_payment, monthly_installment, months_count);
        setRows(installmentRows);

        // Set total amount
        setTotal(prev => ({ ...prev, totalAmount: parseFloat(final_price) }));
        setLoading(false);
      } catch (err) {
        setError('فشل في تحميل بيانات الحجز');
        console.error(err);
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id]);

  // Generate installment rows
  const generateInstallmentRows = (finalPrice: string, downPayment: string, monthlyInstallment: string, monthsCount: number) => {
    const rows = [];
    let currentDate = new Date(); // Start from today

    for (let i = 0; i < monthsCount; i++) {
      const paymentDate = new Date(currentDate);
      paymentDate.setMonth(currentDate.getMonth() + i); // Add i months to the current date

      rows.push({
        paymentDate: paymentDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        checkNumber: `CHK${1000 + i}`, // Sequential check numbers
        amountNumber: monthlyInstallment, // Monthly installment amount
        amountWords: convertToArabicWords(monthlyInstallment), // Convert to Arabic words
      });
    }

    return rows;
  };

  // Handle input changes for rows
  const handleInputChange = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  // Handle input changes for total
  const handleTotalChange = (field: string, value: string) => {
    setTotal({ ...total, [field]: value });
  };

  // Add a new row
  const addRow = () => {
    setRows([...rows, { paymentDate: '', checkNumber: '', amountNumber: '', amountWords: '' }]);
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

  // Handle form submission
  const handleSubmit = () => {
    console.log({ reservationId: reservation.id, rows, total });
    alert('تم قبول البيانات بنجاح');
  };

  // Export data to Excel
  const exportToExcel = () => {
    const data = [
      ['تاريخ الدفعه', 'رقم الشيك', 'القيمه بالارقام', 'القيمه بالحروف'],
      ...rows.map(row => [row.paymentDate, row.checkNumber, row.amountNumber, row.amountWords]),
      ['الإجمالي', '', total.totalAmount, convertToArabicWords(total.totalAmount)],
      ['وديعة صيانة ومرافق', total.maintenanceDate, total.maintenanceCheckNumber, total.maintenanceDeposit, convertToArabicWords(total.maintenanceDeposit)],
      ['تفاصيل الحجز', '', '', ''],
      ['السعر النهائي', reservation.final_price, '', ''],
      ['الدفعة المقدمة', reservation.down_payment, '', ''],
      ['القسط الشهري', reservation.monthly_installment, '', ''],
      ['عدد الشهور', reservation.months_count, '', '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'بيانات الحجز');
    XLSX.writeFile(wb, 'بيانات_الحجز.xlsx');
  };

  // Export data to PDF
  const exportToPDF = () => {
    handlePrint();
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
      <button onClick={exportToExcel} className="mx-2 mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
        تصدير إلى Excel
      </button>
      <button onClick={exportToPDF} className="mb-4 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900">
        تصدير إلى PDF
      </button>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">ملحق الحجز</h1>

      {/* Reservation Details */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">تفاصيل الحجز</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>السعر النهائي:</strong> {reservation.final_price} جنيه
          </div>
          <div>
            <strong>الدفعة المقدمة:</strong> {reservation.down_payment} جنيه
          </div>
          <div>
            <strong>القسط الشهري:</strong> {reservation.monthly_installment} جنيه
          </div>
          <div>
            <strong>عدد الشهور:</strong> {reservation.months_count}
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">تاريخ الدفعه</th>
              <th className="py-2 px-4 border-b">رقم الشيك</th>
              <th className="py-2 px-4 border-b">القيمه بالارقام</th>
              <th className="py-2 px-4 border-b">القيمه بالحروف</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="py-2 px-4 border-b">
                  <input
                    type="date"
                    value={row.paymentDate}
                    onChange={(e) => handleInputChange(index, 'paymentDate', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
                <td className="py-2 px-4 border-b">
                  <input
                    type="text"
                    value={row.checkNumber}
                    onChange={(e) => handleInputChange(index, 'checkNumber', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
                <td className="py-2 px-4 border-b">
                  <input
                    type="number"
                    value={row.amountNumber}
                    onChange={(e) => handleInputChange(index, 'amountNumber', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
                <td className="py-2 px-4 border-b">
                  <input
                    type="text"
                    value={convertToArabicWords(row.amountNumber)}
                    onChange={(e) => handleInputChange(index, 'amountWords', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
              </tr>
            ))}
            <tr>
              <td className="py-2 px-4 border-b" colSpan={2}>الإجمالي</td>
              <td className="py-2 px-4 border-b">
                <input
                  type="number"
                  value={total.totalAmount}
                  onChange={(e) => handleTotalChange('totalAmount', e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                />
              </td>
              <td className="py-2 px-4 border-b">
                <input
                  type="text"
                  value={convertToArabicWords(total.totalAmount)}
                  onChange={(e) => handleTotalChange('totalAmount', e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <button onClick={addRow} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        إضافة صف
      </button>

      {/* Maintenance Deposit Section */}
      <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">وديعه صيانه و مرافق</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">تاريخ الدفعه</th>
              <th className="py-2 px-4 border-b">رقم الشيك</th>
              <th className="py-2 px-4 border-b">القيمه بالارقام</th>
              <th className="py-2 px-4 border-b">القيمه بالحروف</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border-b">
                <input
                  type="date"
                  value={total.maintenanceDate}
                  onChange={(e) => handleTotalChange('maintenanceDate', e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                />
              </td>
              <td className="py-2 px-4 border-b">
                <input
                  type="text"
                  value={total.maintenanceCheckNumber}
                  onChange={(e) => handleTotalChange('maintenanceCheckNumber', e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                />
              </td>
              <td className="py-2 px-4 border-b">
                <input
                  type="number"
                  value={total.maintenanceDeposit}
                  onChange={(e) => handleTotalChange('maintenanceDeposit', e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                />
              </td>
              <td className="py-2 px-4 border-b">
                <input
                  type="text"
                  value={convertToArabicWords(total.maintenanceDeposit)}
                  onChange={(e) => handleTotalChange('maintenanceDeposit', e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Submit Button */}
      <button onClick={handleSubmit} className="mt-6 w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
        قبول
      </button>

      {/* Hidden Div for PDF Export */}
      <div ref={contractRef} style={{ display: 'none' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '24px' }}>قبول بيع الوحدة</h1>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>تاريخ الدفعه</th>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>رقم الشيك</th>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>القيمه بالارقام</th>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>القيمه بالحروف</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{row.paymentDate}</td>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{row.checkNumber}</td>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{row.amountNumber}</td>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{convertToArabicWords(row.amountNumber)}</td>
              </tr>
            ))}
            <tr>
              <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }} colSpan={2}>الإجمالي</td>
              <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{total.totalAmount}</td>
              <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{convertToArabicWords(total.totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        {/* Maintenance Deposit Table for PDF */}
        <h2 style={{ textAlign: 'right', marginTop: '20px', fontSize: '18px' }}>وديعة صيانة ومرافق</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>تاريخ الدفعة</th>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>رقم الشيك</th>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>القيمة بالأرقام</th>
              <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px', backgroundColor: '#f2f2f2' }}>القيمة بالحروف</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{total.maintenanceDate}</td>
              <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{total.maintenanceCheckNumber}</td>
              <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{total.maintenanceDeposit}</td>
              <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontSize: '16px' }}>{convertToArabicWords(total.maintenanceDeposit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AcceptUnitSale;