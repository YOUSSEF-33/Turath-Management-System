import React, { useState, useRef } from 'react';
import { convertToArabicWords } from '../../utils/convertNumbers';
import * as XLSX from 'xlsx'; // Import the xlsx library

const AcceptUnitSale = () => {
  const [rows, setRows] = useState([
    { paymentDate: '2023-01-01', checkNumber: '123456', amountNumber: '1000', amountWords: 'ألف' },
    { paymentDate: '2023-02-01', checkNumber: '123457', amountNumber: '2000', amountWords: 'ألفين' },
    { paymentDate: '2023-03-01', checkNumber: '123458', amountNumber: '3000', amountWords: 'ثلاثة آلاف' }
  ]);
  const [total, setTotal] = useState({ totalAmount: 0, checkDate: '', checkNumber: '', maintenanceDeposit: '', maintenanceDate: '', maintenanceCheckNumber: '' });
  const contractRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handleTotalChange = (field: string, value: string) => {
    setTotal({ ...total, [field]: value });
  };

  const addRow = () => {
    setRows([...rows, { paymentDate: '', checkNumber: '', amountNumber: '', amountWords: '' }]);
  };

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

  const handleSubmit = () => {
    console.log({ rows, total });
    alert('تم قبول البيانات بنجاح');
  };

  // Function to export data to Excel
  const exportToExcel = () => {
    // Prepare the data for export
    const data = [
      ['تاريخ الدفعه', 'رقم الشيك', 'القيمه بالارقام', 'القيمه بالحروف'],
      ...rows.map(row => [row.paymentDate, row.checkNumber, row.amountNumber, row.amountWords]),
      ['الإجمالي', '', total.totalAmount, convertToArabicWords(total.totalAmount)],
      ['وديعة صيانة ومرافق', total.maintenanceDate, total.maintenanceCheckNumber, total.maintenanceDeposit, convertToArabicWords(total.maintenanceDeposit)]
    ];

    // Create a worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Create a workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Export the file
    XLSX.writeFile(wb, 'بيانات_البيع.xlsx');
  };

  const exportToPDF = ()=>{
    handlePrint();
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Add Export to Excel Button */}
      <button onClick={exportToExcel} className="mx-2 mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
        تصدير إلى Excel
      </button>
      <button onClick={exportToPDF} className="mb-4 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900">
        تصدير إلى PDF
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">ملحق الحجز</h1>
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
      <button onClick={addRow} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        إضافة صف
      </button>
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
      <button onClick={handleSubmit} className="mt-6 w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
        قبول
      </button>
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

        {/* New Table for Maintenance Deposit */}
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