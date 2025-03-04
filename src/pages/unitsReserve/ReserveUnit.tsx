import React, { useState, useEffect, useRef } from "react";
import { Search, Upload, Trash2, Check, Printer } from "lucide-react";
import { InputField } from "../../components/InputField";

// Define the InputField component


const ReverseUnit = () => {
    // Static data for projects, buildings, and units
    const projects = [
        { id: 1, name: "مشروع 1" },
        { id: 2, name: "مشروع 2" },
    ];

    const buildings = [
        { id: 1, name: "المبنى 1", projectId: 1 },
        { id: 2, name: "المبنى 2", projectId: 1 },
        { id: 3, name: "المبنى 3", projectId: 2 },
    ];

    const units = [
        {
            id: 1,
            unit_number: "101",
            unit_type: "شقة",
            price: "500000",
            status: "متاح",
            area: "120",
            floor: "1",
            bedrooms: "2",
            bathrooms: "1",
            buildingId: 1,
        },
        {
            id: 2,
            unit_number: "102",
            unit_type: "دوبلكس",
            price: "700000",
            status: "متاح",
            area: "150",
            floor: "2",
            bedrooms: "3",
            bathrooms: "2",
            buildingId: 1,
        },
        {
            id: 3,
            unit_number: "201",
            unit_type: "فيلا",
            price: "1000000",
            status: "متاح",
            area: "200",
            floor: "1",
            bedrooms: "4",
            bathrooms: "3",
            buildingId: 2,
        },
    ];

    // State for selected project, building, and unit
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);

    // Client Data State
    const [clientData, setClientData] = useState<any>({
        name: "",
        phone: "",
        nationalId: "",
        address: "",
        email: "",
        contractDate: "",
    });

    // Attachments State
    const [attachments, setAttachments] = useState<any>({
        bookingForm: null,
        paymentReceipt: null,
        nationalIdCard: null,
    });

    // Unit Details State
    const [unitDetails, setUnitDetails] = useState<any>({
        unit_number: "",
        unit_type: "",
        price: "",
        status: "",
        area: "",
        floor: "",
        bedrooms: "",
        bathrooms: "",
        months: "",
        downPayment: "",
        finalPrice: "0",
        monthlyInstallment: "0",
    });

    // Filter buildings based on selected project
    const filteredBuildings = buildings.filter(
        (building) => building.projectId === selectedProject
    );

    // Filter units based on selected building
    const filteredUnits = units.filter(
        (unit) => unit.buildingId === selectedBuilding
    );

    // Update unit details when a unit is selected
    useEffect(() => {
        if (selectedUnit) {
            const unit: any = units.find((u: any) => u.id === selectedUnit);
            if (unit) {
                setUnitDetails({
                    unit_number: unit.unit_number,
                    unit_type: unit.unit_type,
                    price: unit.price.toString(),
                    status: unit.status,
                    area: unit.area,
                    floor: unit.floor.toString(),
                    bedrooms: unit.bedrooms.toString(),
                    bathrooms: unit.bathrooms.toString(),
                    finalPrice: unit.price.toString(),
                });
            }
        }
    }, [selectedUnit]);

    // Calculate final price and monthly installment
    useEffect(() => {
        const price = parseFloat(unitDetails.price);
        const months = parseInt(unitDetails.months, 10);
        const downPayment = parseFloat(unitDetails.downPayment);

        if (!isNaN(price) && !isNaN(months) && !isNaN(downPayment) && months > 0) {
            const remainingAmount = price - downPayment;
            const monthlyInstallment = remainingAmount / months;

            setUnitDetails((prevState: any) => ({
                ...prevState,
                finalPrice: price.toFixed(2).toString(),
                monthlyInstallment: monthlyInstallment.toFixed(2).toString(),
            }));
        }
    }, [unitDetails.price, unitDetails.months, unitDetails.downPayment]);

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachments((prev: any) => ({
                ...prev,
                [type]: file,
            }));
        }
    };

    // Remove a file
    const removeFile = (type: string) => {
        setAttachments((prev: any) => ({
            ...prev,
            [type]: null,
        }));
    };

    // Handle form submission
    const handleSubmit = () => {
        // Log form data to the console
        console.log({
            clientData,
            unitDetails,
            attachments,
        });

        alert("تم إرسال البيانات بنجاح");
    };

    const contractRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (contractRef.current) {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Contract</title>
                        <style>
                            body { direction: rtl; font-family: Arial, sans-serif; }
                            .contract { padding: 20px; }
                            .contract h1 { text-align: center; margin-bottom: 20px; font-size: 24px; }
                            .contract p { text-align: right; margin-bottom: 20px; font-size: 18px; }
                            .contract table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            .contract table, .contract th, .contract td { border: 1px solid black; }
                            .contract th, .contract td { padding: 10px; text-align: right; font-size: 16px; }
                            .contract th { background-color: #f2f2f2; }
                            .contract .policies { margin-top: 20px; font-size: 16px; }
                            .contract .signatures { margin-top: 40px; display: flex; justify-content: space-between; }
                            .contract .signatures div { width: 45%; text-align: center; font-size: 16px; }
                            .contract .signatures div:after { content: ""; display: block; border-top: 1px solid black; margin-top: 50px; }
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

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">حجز وحدة</h1>

            {/* Project, Building, and Unit Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Project Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اختر المشروع</label>
                    <select
                        value={selectedProject || ""}
                        onChange={(e) => setSelectedProject(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="" disabled>
                            اختر المشروع
                        </option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Building Selection */}
                {selectedProject && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المبنى</label>
                        <select
                            value={selectedBuilding || ""}
                            onChange={(e) => setSelectedBuilding(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="" disabled>
                                اختر المبنى
                            </option>
                            {filteredBuildings.map((building) => (
                                <option key={building.id} value={building.id}>
                                    {building.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Unit Selection */}
                {selectedBuilding && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">اختر الوحدة</label>
                        <select
                            value={selectedUnit || ""}
                            onChange={(e) => setSelectedUnit(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="" disabled>
                                اختر الوحدة
                            </option>
                            {filteredUnits.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.unit_number} - {unit.unit_type}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Client Data Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">بيانات العميل</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries({
                        name: "اسم العميل",
                        phone: "رقم الهاتف",
                        nationalId: "الرقم القومي",
                        address: "العنوان",
                        email: "البريد الإلكتروني",
                        contractDate: "تاريخ التعاقد",
                    }).map(([key, label]) => (
                        <InputField
                            key={key}
                            label={label}
                            type={key === "contractDate" ? "date" : "text"}
                            value={clientData[key]}
                            onChange={(e) => setClientData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                            placeholder={`أدخل ${label}`}
                        />
                    ))}
                </div>
            </div>

            {/* Attachments Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">المرفقات</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { key: "bookingForm", label: "استمارة الحجز" },
                        { key: "paymentReceipt", label: "إيصال السداد" },
                        { key: "nationalIdCard", label: "صورة البطاقة الشخصية" },
                    ].map(({ key, label }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                            {attachments[key] ? (
                                <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
                                    <span>{attachments[key].name}</span>
                                    <button
                                        onClick={() => removeFile(key)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <Upload className="h-5 w-5 mr-2" />
                                    <span>اختيار ملف</span>
                                    <input
                                        type="file"
                                        onChange={(e) => handleFileUpload(e, key)}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Unit Details Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">تفاصيل الوحدة والسعر</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries({
                        price: "السعر",
                        months: "عدد الشهور",
                        downPayment: "الدفعة المقدمة",
                        finalPrice: "السعر النهائي",
                        monthlyInstallment: "القسط الشهري",
                    }).map(([key, label], index, array) => {
                        const isDisabled = ["finalPrice", "monthlyInstallment"].includes(key);
                        const isLastInput = index === array.length - 1;

                        return (
                            <InputField
                                key={key}
                                label={label}
                                type="number"
                                value={unitDetails[key]}
                                onChange={(e) => setUnitDetails((prev: any) => ({ ...prev, [key]: e.target.value }))}
                                placeholder={`أدخل ${label}`}
                                disabled={isDisabled}
                                className={isLastInput ? "col-span-2" : ""}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
            >
                <Check className="h-5 w-5 mr-2" />
                إرسال البيانات
            </button>

            <button
                onClick={handlePrint}
                className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center transition-colors mt-4"
            >
                <Printer className="h-5 w-5 mr-2" />
                طباعة العقد
            </button>

            <div
                ref={contractRef}
                style={{
                    direction: 'rtl',
                    fontFamily: 'Arial, sans-serif',
                    padding: '30px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    maxWidth: '800px',
                    margin: '20px auto',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: "none"
                }}
            >
                {/* Header */}
                <h1 style={{
                    fontSize: '28px',
                    color: '#2c3e50',
                    textAlign: 'center',
                    marginBottom: '25px',
                    borderBottom: '2px solid #3498db',
                    paddingBottom: '10px'
                }}>
                    شركة العقارات
                </h1>

                {/* Date */}
                <p style={{
                    fontSize: '14px',
                    color: '#7f8c8d',
                    marginBottom: '30px',
                    textAlign: 'left'
                }}>
                    التاريخ: {new Date().toLocaleDateString("ar-EG")}
                </p>

                {/* Client Information */}
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{
                        fontSize: '20px',
                        color: '#2c3e50',
                        marginBottom: '15px',
                        borderBottom: '2px solid #3498db',
                        paddingBottom: '8px'
                    }}>
                        بيانات العميل
                    </h2>

                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>اسم العميل</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{clientData.name}</div>
                                    </div>
                                </td>

                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>رقم الهاتف</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{clientData.phone}</div>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>الرقم القومي</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{clientData.nationalId}</div>
                                    </div>
                                </td>

                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>العنوان</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{clientData.address}</div>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>البريد الإلكتروني</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{clientData.email}</div>
                                    </div>
                                </td>

                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>تاريخ التعاقد</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{clientData.contractDate}</div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Unit Information */}
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{
                        fontSize: '20px',
                        color: '#2c3e50',
                        marginBottom: '15px',
                        borderBottom: '2px solid #3498db',
                        paddingBottom: '8px'
                    }}>
                        بيانات الوحدة
                    </h2>

                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>رقم الوحدة</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{unitDetails.unit_number}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>نوع الوحدة</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{unitDetails.unit_type}</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>المساحة</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{unitDetails.area}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>السعر</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{unitDetails.price}</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>عدد الغرف</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{unitDetails.bedrooms}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>عدد الحمامات</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{unitDetails.bathrooms}</div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Payment Information */}
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{
                        fontSize: '20px',
                        color: '#2c3e50',
                        marginBottom: '15px',
                        borderBottom: '2px solid #3498db',
                        paddingBottom: '8px'
                    }}>
                        الثمن وطريقة السداد
                    </h2>

                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>السعر النهائي</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{unitDetails.finalPrice}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>الدفعة المقدمة</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{unitDetails.downPayment}</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '120px', padding: '12px 15px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '14px', backgroundColor: '#f8f9fa' }}>القسط الشهري</div>
                                        <div style={{ padding: '12px 15px', color: '#2c3e50', fontSize: '16px', fontWeight: '500', flex: 1 }}>{unitDetails.monthlyInstallment}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '0', width: '50%' }}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {/* Terms Section */}
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{
                        fontSize: '20px',
                        color: '#2c3e50',
                        marginBottom: '15px',
                        borderBottom: '2px solid #3498db',
                        paddingBottom: '8px'
                    }}>
                        شروط الحجز
                    </h2>

                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '20px',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <p style={{ fontSize: '14px', color: '#7f8c8d', lineHeight: '1.6', marginBottom: '15px' }}>
                            % يتم التوقيع على العقد خلال المدة المتفق عليها في الاستمارة وفي حالة عدم إتمام التعاقد خلال تلك المدة بخصم 50 من قيمة إستمارة الحجز دون الحاجة إلى أي تنبيه او استفسار بكم فقدان.
                        </p>
                        <p style={{ fontSize: '14px', color: '#7f8c8d', lineHeight: '1.6' }}>
                            لا يوجد أي حقوق للعميل في الوحدة المحجوزة إلا بعد إتمام التعاقد.
                        </p>
                    </div>
                </div>

                {/* Signatures */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '40px',
                    paddingTop: '20px',
                    borderTop: '2px solid #e0e0e0'
                }}>
                    <div style={{
                        textAlign: 'center',
                        width: '45%'
                    }}>
                        <div style={{
                            height: '1px',
                            borderBottom: '2px dashed #bdc3c7',
                            margin: '20px 0'
                        }}></div>
                        <p style={{
                            color: '#7f8c8d',
                            marginTop: '8px',
                            fontSize: '14px'
                        }}>توقيع العميل</p>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        width: '45%'
                    }}>
                        <div style={{
                            height: '1px',
                            borderBottom: '2px dashed #bdc3c7',
                            margin: '20px 0'
                        }}></div>
                        <p style={{
                            color: '#7f8c8d',
                            marginTop: '8px',
                            fontSize: '14px'
                        }}>توقيع الشركة</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReverseUnit;