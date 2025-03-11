import React, { useState, useEffect, useRef } from "react";
import { Search, Upload, Trash2, Check, Printer } from "lucide-react";
import { InputField } from "../../components/InputField";
import axiosInstance from "../../axiosInstance";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ReverseUnit = () => {
    // State for projects, buildings, and units
    const navigate = useNavigate();
    const [projects, setProjects] = useState<any[]>([]);
    const [buildings, setBuildings] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);

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
        nationalIdCard: [],
        reservation_deposit_receipt: null,
        attachments: [],
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
        months: 0,
        downPayment: 0,
        finalPrice: 0,
        monthlyInstallment: 0,
        reservationDeposit: 0,
    });

    const [loading, setLoading] = useState<boolean>(false);

    const validateInput = (value: string, type: string) => {
        if (type === "number") {
            const numberValue = parseFloat(value);
            return !isNaN(numberValue) && numberValue >= 0;
        } else if (type === "text") {
            return value.trim().length > 0;
        } else if (type === "date") {
            return !isNaN(Date.parse(value));
        }
        return true;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string, type: string) => {
        const { value } = e.target;
        if (validateInput(value, type)) {
            setClientData((prev: any) => ({ ...prev, [key]: value }));
        }
    };

    const handleUnitDetailsChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const { value } = e.target;
        if (validateInput(value, "number")) {
            setUnitDetails((prev: any) => ({ ...prev, [key]: parseFloat(value) }));
        }
    };


    const handleSubmit = async () => {
        const formData = new FormData();

        // Append unit_id
        formData.append("unit_id", selectedUnit);

        // Append client data
        formData.append("client[name]", clientData.name);
        formData.append("client[email]", clientData.email);
        formData.append("client[phone]", clientData.phone);
        formData.append("client[address]", clientData.address);

        // Append unit details
        formData.append("final_price", unitDetails.finalPrice);
        formData.append("reservation_deposit", unitDetails.reservationDeposit);
        formData.append("down_payment", unitDetails.downPayment);
        formData.append("monthly_installment", unitDetails.monthlyInstallment);
        formData.append("months_count", unitDetails.months);
        formData.append("contract_date", clientData.contractDate);

        // Append national ID images
        if (attachments.nationalIdCard && attachments.nationalIdCard.length > 0) {
            attachments.nationalIdCard.forEach((file: File, index: number) => {
                formData.append(`national_id_images[${index}]`, file);
            });
        }

        // Append reservation deposit receipt
        if (attachments.reservation_deposit_receipt) {
            formData.append("reservation_deposit_receipt", attachments.reservation_deposit_receipt);
        }

        // Append additional attachments
        if (attachments.attachments && attachments.attachments.length > 0) {
            attachments.attachments.forEach((file: File, index: number) => {
                formData.append(`attachments[${index}]`, file);
            });
        }

        try {
            const response = await axiosInstance.post("/reservations", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            toast.success("تم إرسال البيانات بنجاح");
            navigate("/units-reserve");
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("حدث خطأ أثناء إرسال البيانات");
        }
    };

    if (loading) {
        return <div className="loader"></div>;
    }

    // Filter buildings based on selected project
    const filteredBuildings = buildings?.filter(
        (building) => building.project_id === selectedProject
    );

    // Filter units based on selected building
    const filteredUnits = units.filter(
        (unit) => unit.building_id === selectedBuilding
    );

    // Update unit details when a unit is selected
    useEffect(() => {
        if (selectedUnit) {
            const unit: any = units.find((u: any) => u.id === selectedUnit);
            if (unit) {
                setUnitDetails({
                    unit_number: unit.unit_number,
                    unit_type: unit.unit_type,
                    price: unit.price,
                    status: unit.status,
                    area: unit.area,
                    floor: unit.floor,
                    bedrooms: unit.bedrooms,
                    bathrooms: unit.bathrooms,
                    finalPrice: unit.price,
                    months: unit.months || 0,
                    downPayment: unit.downPayment || 0,
                    monthlyInstallment: unit.monthlyInstallment || 0,
                    reservationDeposit: unit.reservationDeposit || 0,
                });
            }
        }
    }, [selectedUnit]);

    // Calculate final price and monthly installment
    useEffect(() => {
        const price = parseFloat(unitDetails.price);
        const months = unitDetails.months;
        const downPayment = unitDetails.downPayment;

        if (!isNaN(price) && !isNaN(months) && !isNaN(downPayment) && months > 0) {
            const remainingAmount = price - downPayment;
            const monthlyInstallment = remainingAmount / months;

            setUnitDetails((prevState: any) => ({
                ...prevState,
                finalPrice: price.toFixed(2),
                monthlyInstallment: monthlyInstallment.toFixed(2),
            }));
        }
    }, [unitDetails.price, unitDetails.months, unitDetails.downPayment]);

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const files = e.target.files;
        if (files) {
            if (type === "nationalIdCard" || type === "attachments") {
                setAttachments((prev: any) => ({
                    ...prev,
                    [type]: [...prev[type], ...Array.from(files)],
                }));
            } else {
                console.log({
                    [type]: files[0],
                })
                setAttachments((prev: any) => ({
                    ...prev,
                    [type]: files[0],
                }));
            }
        }
    };

    const removeFile = (type: string, index?: number) => {
        if ((type === "nationalIdCard" || type === "attachments") && index !== undefined) {
            setAttachments((prev: any) => ({
                ...prev,
                [type]: prev[type].filter((_: any, i: number) => i !== index),
            }));
        } else {
            setAttachments((prev: any) => ({
                ...prev,
                [type]: null,
            }));
        }
    };


    const contractRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (contractRef.current) {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title >.</title>
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const projectsResponse = await axiosInstance.get('/projects');
                setProjects(projectsResponse.data.data);
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchBuildings = async () => {
            if (selectedProject) {
                try {
                    const buildingsResponse = await axiosInstance.get(`/projects/${selectedProject}`);
                    setBuildings(buildingsResponse.data.data.buildings);
                    console.log(buildingsResponse.data.data.buildings)
                } catch (error) {
                    console.error('Error fetching buildings:', error);
                }
            }
        };

        fetchBuildings();
    }, [selectedProject]);

    //console.log(buildings)

    useEffect(() => {
        const fetchUnits = async () => {
            if (selectedBuilding) {
                try {
                    const unitsResponse = await axiosInstance.get(`/buildings/${selectedBuilding}`);
                    setUnits(unitsResponse.data.data.units);
                } catch (error) {
                    console.error('Error fetching units:', error);
                }
            }
        };

        fetchUnits();
    }, [selectedBuilding]);

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
                        {projects?.map((project) => (
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
                            {filteredBuildings?.map((building) => (
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
                            onChange={(e: any) => handleInputChange(e, key, key === "contractDate" ? "date" : "text")}
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
                        { key: "nationalIdCard", label: "صورة البطاقة الشخصية", multiple: true },
                        { key: "reservation_deposit_receipt", label: "إيصال السداد", multiple: false },
                        { key: "attachments", label: "مرفقات إضافية", multiple: true },
                    ].map(({ key, label, multiple }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                            {attachments[key] && (multiple ? attachments[key].length > 0 : attachments[key]) ? (
                                multiple ? (
                                    // Render multiple files for nationalIdCard and attachments
                                    attachments[key].map((file: File, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-4 border border-gray-300 rounded-lg mb-2">
                                            <span>{file.name}</span>
                                            <button
                                                onClick={() => removeFile(key, index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    // Render single file for reservation_deposit_receipt
                                    <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg mb-2">
                                        <span>{attachments[key].name}</span>
                                        <button
                                            onClick={() => removeFile(key)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                )
                            ) : (
                                <label className="flex items-center justify-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <Upload className="h-5 w-5 mr-2" />
                                    <span>اختيار ملف</span>
                                    <input
                                        type="file"
                                        onChange={(e) => handleFileUpload(e, key)}
                                        className="hidden"
                                        multiple={multiple} // Set multiple based on the field
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
                        reservationDeposit: "إيصال السداد",
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
                                onChange={(e: any) => handleUnitDetailsChange(e, key)}
                                placeholder={`أدخل ${label}`}
                                disabled={isDisabled}
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

            {/* CONTRACT FORM */}
            <div
                ref={contractRef}
                style={{
                    direction: 'rtl',
                    fontFamily: 'Arial, sans-serif',
                    padding: '20px', // Reduced padding
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    maxWidth: '800px',
                    margin: '10px auto', // Reduced margin
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: "none"
                }}
            >
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '15px', // Reduced margin
                    borderBottom: '2px solid #3498db',
                    paddingBottom: '8px' // Reduced padding
                }}>
                    <img
                        src="/images/output-onlinepngtools.png"
                        alt="Company Logo"
                        style={{
                            maxWidth: '150px', // Reduced width
                            maxHeight: '60px', // Reduced height
                            objectFit: 'contain'
                        }}
                    />
                </div>

                {/* Date */}
                <p style={{
                    fontSize: '12px', // Reduced font size
                    color: '#7f8c8d',
                    marginBottom: '20px', // Reduced margin
                    textAlign: 'left'
                }}>
                    التاريخ: {new Date().toLocaleDateString("ar-EG")}
                </p>

                {/* Client Information */}
                <div style={{ marginBottom: '20px' }}> {/* Reduced margin */}
                    <h2 style={{
                        fontSize: '18px', // Reduced font size
                        color: '#2c3e50',
                        marginBottom: '10px', // Reduced margin
                        borderBottom: '2px solid #3498db',
                        paddingBottom: '6px' // Reduced padding
                    }}>
                        بيانات العميل
                    </h2>

                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px' }}> {/* Reduced spacing */}
                        <tbody>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>اسم العميل</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{clientData.name}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>

                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>رقم الهاتف</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{clientData.phone}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>الرقم القومي</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{clientData.nationalId}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>

                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>العنوان</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{clientData.address}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>البريد الإلكتروني</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{clientData.email}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>

                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>تاريخ التعاقد</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{clientData.contractDate}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Unit Information */}
                <div style={{ marginBottom: '20px' }}> {/* Reduced margin */}
                    <h2 style={{
                        fontSize: '18px', // Reduced font size
                        color: '#2c3e50',
                        marginBottom: '10px', // Reduced margin
                        borderBottom: '2px solid #3498db',
                        paddingBottom: '6px' // Reduced padding
                    }}>
                        بيانات الوحدة
                    </h2>

                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px' }}> {/* Reduced spacing */}
                        <tbody>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>رقم الوحدة</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{unitDetails.unit_number}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>نوع الوحدة</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{unitDetails.unit_type}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>المساحة</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{unitDetails.area}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>السعر</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{unitDetails.price}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>عدد الغرف</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{unitDetails.bedrooms}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>عدد الحمامات</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{unitDetails.bathrooms}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Payment Information */}
                <div style={{ marginBottom: '20px' }}> {/* Reduced margin */}
                    <h2 style={{
                        fontSize: '18px', // Reduced font size
                        color: '#2c3e50',
                        marginBottom: '10px', // Reduced margin
                        borderBottom: '2px solid #3498db',
                        paddingBottom: '6px' // Reduced padding
                    }}>
                        الثمن وطريقة السداد
                    </h2>

                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px' }}> {/* Reduced spacing */}
                        <tbody>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>السعر النهائي</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{unitDetails.finalPrice}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>الدفعة المقدمة</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{unitDetails.downPayment}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0', width: '50%' }}>
                                    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                        <div style={{ width: '100px', padding: '8px 10px', borderLeft: '1px solid #e0e0e0', color: '#7f8c8d', fontSize: '12px', backgroundColor: '#f8f9fa' }}>القسط الشهري</div> {/* Reduced padding and font size */}
                                        <div style={{ padding: '8px 10px', color: '#2c3e50', fontSize: '14px', fontWeight: '500', flex: 1 }}>{unitDetails.monthlyInstallment}</div> {/* Reduced padding and font size */}
                                    </div>
                                </td>
                                <td style={{ padding: '0', width: '50%' }}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Terms Section */}
                <div style={{ marginBottom: '20px' }}> {/* Reduced margin */}
                    <h2 style={{
                        fontSize: '18px', // Reduced font size
                        color: '#2c3e50',
                        marginBottom: '10px', // Reduced margin
                        borderBottom: '2px solid #3498db',
                        paddingBottom: '6px' // Reduced padding
                    }}>
                        شروط الحجز
                    </h2>

                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '15px', // Reduced padding
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <p style={{ fontSize: '12px', color: '#7f8c8d', lineHeight: '1.6', marginBottom: '10px' }}> {/* Reduced font size and margin */}
                            % يتم التوقيع على العقد خلال المدة المتفق عليها في الاستمارة وفي حالة عدم إتمام التعاقد خلال تلك المدة بخصم 50 من قيمة إستمارة الحجز دون الحاجة إلى أي تنبيه او استفسار بكم فقدان.
                        </p>
                        <p style={{ fontSize: '12px', color: '#7f8c8d', lineHeight: '1.6' }}> {/* Reduced font size */}
                            لا يوجد أي حقوق للعميل في الوحدة المحجوزة إلا بعد إتمام التعاقد.
                        </p>
                    </div>
                </div>

                {/* Signatures */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '30px', // Reduced margin
                    paddingTop: '15px', // Reduced padding
                    borderTop: '2px solid #e0e0e0'
                }}>
                    <div style={{
                        textAlign: 'center',
                        width: '45%'
                    }}>
                        <div style={{
                            height: '1px',
                            margin: '15px 0' // Reduced margin
                        }}></div>
                        <p style={{
                            color: '#7f8c8d',
                            marginTop: '6px', // Reduced margin
                            fontSize: '16px' // Reduced font size
                        }}>اسم العميل</p>
                        ..................
                    </div>

                    <div style={{
                        textAlign: 'center',
                        width: '45%'
                    }}>
                        <div style={{
                            height: '1px',
                            margin: '15px 0' // Reduced margin
                        }}></div>
                        <p style={{
                            color: '#7f8c8d',
                            marginTop: '6px', // Reduced margin
                            fontSize: '16px' // Reduced font size
                        }}>توقيع العميل</p>
                        ..................
                    </div>
                    <div style={{
                        textAlign: 'center',
                        width: '45%'
                    }}>
                        <div style={{
                            height: '1px',
                            margin: '15px 0' // Reduced margin
                        }}></div>
                        <p style={{
                            color: '#7f8c8d',
                            marginTop: '6px', // Reduced margin
                            fontSize: '16px' // Reduced font size
                        }}> المبيعات</p>
                        ..................
                    </div>

                    <div style={{
                        textAlign: 'center',
                        width: '45%'
                    }}>
                        <div style={{
                            height: '1px',
                            margin: '15px 0' // Reduced margin
                        }}></div>
                        <p style={{
                            color: '#7f8c8d',
                            marginTop: '6px', // Reduced margin
                            fontSize: '16px' // Reduced font size
                        }}>مسؤول الحجز</p>
                        ..................
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReverseUnit;