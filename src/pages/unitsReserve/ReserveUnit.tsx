import React, { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Check } from "lucide-react";
import axiosInstance from "../../axiosInstance";
import toast from "react-hot-toast";
import { DatePicker, Select } from 'antd';
import type { SelectProps } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import dayjs from 'dayjs';

// Define proper interfaces for our data structures
interface Project {
    id: number;
    name: string;
    is_active: boolean;
    installment_options: {
        ANNUAL?: number;
        MONTHLY?: number;
        QUARTERLY?: number;
    };
    deposit_percentage: number;
    additional_expenses: AdditionalExpense[];
    documents_background?: MediaFile;
}

interface Building {
    id: number;
    project_id: number;
    name: string;
}

interface Unit {
    id: number;
    building_id: number;
    unit_number: string;
    unit_type: string;
    price: string;
    status: string;
    area: string;
    floor: string;
    bedrooms: string;
    bathrooms: string;
}

interface AdditionalExpense {
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
}

interface MediaFile {
    id: number;
    name: string;
    url: string;
    small_url?: string;
    medium_url?: string;
    disk?: string;
}

interface ClientData {
    name: string;
    phone: string;
    nationalId: string;
    address: string;
    email: string;
    job: string;
    nationality: string;
}

interface ReservationDates {
    reservation_date: string;
    contract_date: string;
}

interface UnitDetails {
    unit_number: string;
    unit_type: string;
    price: number;
    status: string;
    area: number;
    floor: number;
    bedrooms: number;
    bathrooms: number;
    reservation_deposit: number | null;
    down_payment: number | null;
    final_price: number;
    monthly_installment: number | null;
    selected_installment_types: string[];
    installment_details: Record<string, InstallmentDetail>;
}

interface InstallmentDetail {
    type: string;
    count: number | null;
    amount: number | null;
}

interface Attachments {
    national_id_images: File[];
    reservation_deposit_receipt: File | null;
    attachments: File[];
}

interface FormErrors {
    [key: string]: string;
}

// Add this translation map at the top of the file after the interfaces
const INSTALLMENT_TYPE_TRANSLATIONS: Record<string, string> = {
    'MONTHLY': 'شهري',
    'QUARTERLY': 'ربع سنوي',
    'ANNUAL': 'سنوي'
};

// Add these utility functions after the interfaces
const formatNumber = (value: number | null): string => {
    if (value === null) return '';
    return value.toLocaleString('en-US');
};

const parseFormattedNumber = (value: string): number | null => {
    if (!value) return null;
    return parseFloat(value.replace(/,/g, ''));
};

const ReserveUnit = () => {
    // State for projects, buildings, and units
    const [projects, setProjects] = useState<Project[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    // State for selected project, building, and unit
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<number | null>(null);

    //console.log(units)

    // Client Data State
    const [clientData, setClientData] = useState<ClientData>({
        name: "",
        phone: "",
        nationalId: "",
        address: "",
        email: "",
        job: "",
        nationality: "",
    });

    const [reservationDates, setReservationDates] = useState<ReservationDates>({
        reservation_date: "",
        contract_date: "",
    });

    console.log(projects)

    // Attachments State with upload status tracking
    const [attachments, setAttachments] = useState<Attachments>({
        national_id_images: [],
        reservation_deposit_receipt: null,
        attachments: [],
    });

    // Track uploaded media IDs
    const [uploadedMedia, setUploadedMedia] = useState<{
        national_id_images: number[];
        reservation_deposit_receipt: number | null;
        attachments: number[];
    }>({
        national_id_images: [],
        reservation_deposit_receipt: null,
        attachments: [],
    });

    // Unit Details State
    const [unitDetails, setUnitDetails] = useState<UnitDetails>({
        unit_number: '',
        unit_type: '',
        price: 0,
        status: '',
        area: 0,
        floor: 0,
        bedrooms: 0,
        bathrooms: 0,
        reservation_deposit: null,
        down_payment: null,
        final_price: 0,
        monthly_installment: null,
        selected_installment_types: [],
        installment_details: {}
    });

    // Add new state for installment types
    const [availableInstallmentTypes, setAvailableInstallmentTypes] = useState<string[]>([]);

    //console.log(unitDetails)

    // Loading and validation states
    const [loading] = useState<boolean>(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [uploading, setUploading] = useState<{ [key: string]: boolean }>({
        national_id_images: false,
        reservation_deposit_receipt: false,
        attachments: false
    });

    // Add these loading states
    const [submitLoading, setSubmitLoading] = useState(false);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [buildingsLoading, setBuildingsLoading] = useState(false);
    const [unitsLoading, setUnitsLoading] = useState(false);

    const contractRef = useRef<HTMLDivElement>(null);

    // Filter functions with proper Ant Design types
    const filterProjects: SelectProps['filterOption'] = (input, option) => {
        if (!option) return false;
        const optionValue = (option as DefaultOptionType).label;
        return optionValue?.toString().toLowerCase().includes(input.toLowerCase()) ?? false;
    };

    const filterBuildings: SelectProps['filterOption'] = (input, option) => {
        if (!option) return false;
        const optionValue = (option as DefaultOptionType).label;
        return optionValue?.toString().toLowerCase().includes(input.toLowerCase()) ?? false;
    };

    const filterUnits: SelectProps['filterOption'] = (input, option) => {
        if (!option) return false;
        const optionValue = (option as DefaultOptionType).label;
        return optionValue?.toString().toLowerCase().includes(input.toLowerCase()) ?? false;
    };

    // Validation functions
    const validateInput = (value: string, type: string) => {
        if (type === "number") {
            const numberValue = parseFloat(value);
            return !isNaN(numberValue) && numberValue >= 0;
        } else if (type === "text") {
            return value.trim().length > 0;
        } else if (type === "email") {
            if (value === "") return true; // Empty email is valid since it's optional
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        } else if (type === "date") {
            return !isNaN(Date.parse(value));
        }
        return true;
    };

    const validateForm = (): FormErrors => {
        const errors: FormErrors = {};

        // Validate client data
        if (!clientData.name) errors.name = 'الرجاء إدخال اسم العميل';
        if (!clientData.phone) errors.phone = 'الرجاء إدخال رقم الهاتف';
        if (!clientData.nationalId) errors.nationalId = 'الرجاء إدخال الرقم القومي';
        if (!clientData.address) errors.address = 'الرجاء إدخال العنوان';
        if (clientData.email && !validateInput(clientData.email, 'email')) {
            errors.email = 'الرجاء إدخال بريد إلكتروني صحيح';
        }
        if (!clientData.job) errors.job = 'الرجاء إدخال الوظيفة';
        if (!clientData.nationality) errors.nationality = 'الرجاء إدخال الجنسية';

        // Validate media uploads
        if (attachments.national_id_images.length === 0) {
            errors.national_id_images = 'الرجاء رفع صورة البطاقة الشخصية';
        }
        if (!attachments.reservation_deposit_receipt) {
            errors.reservation_deposit_receipt = 'الرجاء رفع إيصال السداد';
        }

        // Validate payment details
        if (unitDetails.reservation_deposit === null || unitDetails.reservation_deposit <= 0) {
            errors.reservation_deposit = 'الرجاء إدخال قيمة دفعة الحجز';
        }
        if (unitDetails.down_payment === null || unitDetails.down_payment <= 0) {
            errors.down_payment = 'الرجاء إدخال قيمة الدفعة المقدمة';
        }

        // Validate installment details
        if (unitDetails.selected_installment_types.length === 0) {
            errors.installment = 'الرجاء اختيار نوع التقسيط';
        }

        return errors;
    };

    // Input handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string, type: string) => {
        const { value } = e.target;

        // For email, update the value without validation since we'll validate on submit
        if (type === "email") {
            setClientData((prev) => ({ ...prev, [key]: value }));
            // Clear error when field is updated
            if (errors[key]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[key];
                    return newErrors;
                });
            }
            return;
        }

        // For other fields, keep the existing validation
        if (validateInput(value, type)) {
            setClientData((prev) => ({ ...prev, [key]: value }));
            // Clear error when field is updated
            if (errors[key]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[key];
                    return newErrors;
                });
            }
        }
    };

    const handleUnitDetailChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const { value } = e.target;
        const numValue = parseFormattedNumber(value);
        if (numValue !== null && numValue < 0) return;

        setUnitDetails(prev => ({
            ...prev,
            [key]: numValue
        }));
    };

    const handleDateChange = (date: dayjs.Dayjs | null, field: keyof ReservationDates) => {
        if (date) {
            setReservationDates(prev => ({
                ...prev,
                [field]: date.format('YYYY-MM-DD')
            }));
        }
    };

    // Media upload function
    const uploadFileToMedia = async (file: File, collectionName: string): Promise<number> => {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('collection_name', collectionName);

        try {
            const response = await axiosInstance.post('/media', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response.data && response.data.data && response.data.data[0]) {
                return response.data.data[0].id;
            } else {
                throw new Error('Invalid response format from media upload');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    };

    // File upload handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Check file limit for national ID
        if (type === 'national_id_images') {
            const currentFiles = attachments.national_id_images.length;
            const newFiles = Array.from(files).length;
            if (currentFiles + newFiles > 2) {
                toast.error('يمكن رفع ملفين كحد أقصى للبطاقة الشخصية');
                return;
            }
        }

        // Update attachments state first with the selected files
        if (type === "national_id_images" || type === "attachments") {
            setAttachments((prev) => ({
                ...prev,
                [type]: [...prev[type], ...Array.from(files)],
            }));

            // Mark this type as uploading
            setUploading(prev => ({
                ...prev,
                [type]: true
            }));

            // Upload each file and collect their IDs
            try {
                const collectionName = type === "national_id_images" ? "national-id-images" : "attachments";
                const uploadPromises = Array.from(files).map(file =>
                    uploadFileToMedia(file, collectionName)
                );

                const uploadedIds = await Promise.all(uploadPromises);

                // Update the uploaded media IDs
                setUploadedMedia(prev => ({
                    ...prev,
                    [type]: [...prev[type], ...uploadedIds]
                }));

                toast.success(`تم رفع الملفات بنجاح`);
            } catch (error) {
                console.error(`Error uploading ${type}:`, error);
                toast.error(`حدث خطأ أثناء رفع الملفات`);

                // Remove the failed uploads from attachments
                setAttachments(prev => ({
                    ...prev,
                    [type]: prev[type].slice(0, prev[type].length - files.length)
                }));
            } finally {
                setUploading(prev => ({
                    ...prev,
                    [type]: false
                }));
            }
        } else {
            // For single file uploads
            const file = files[0];
            setAttachments((prev) => ({
                ...prev,
                [type]: file,
            }));

            // Mark this type as uploading
            setUploading(prev => ({
                ...prev,
                [type]: true
            }));

            try {
                const collectionName = "reservation-deposit-receipts";
                const uploadedId = await uploadFileToMedia(file, collectionName);

                setUploadedMedia(prev => ({
                    ...prev,
                    [type]: uploadedId
                }));

                toast.success(`تم رفع الملف بنجاح`);
            } catch (error) {
                console.error(`Error uploading ${type}:`, error);
                toast.error(`حدث خطأ أثناء رفع الملف`);

                // Remove the failed upload
                setAttachments(prev => ({
                    ...prev,
                    [type]: null
                }));
            } finally {
                setUploading(prev => ({
                    ...prev,
                    [type]: false
                }));
            }
        }
    };

    // Remove file handler
    const removeFile = (type: string, index?: number) => {
        if ((type === "national_id_images" || type === "attachments") && index !== undefined) {
            // Remove file from attachments
            setAttachments((prev) => ({
                ...prev,
                [type]: prev[type].filter((_, i) => i !== index),
            }));

            // Also remove the corresponding ID if it exists
            if (uploadedMedia[type].length > index) {
                setUploadedMedia((prev) => ({
                    ...prev,
                    [type]: prev[type].filter((_, i) => i !== index),
                }));
            }
        } else {
            // For single file types
            setAttachments((prev) => ({
                ...prev,
                [type]: null,
            }));

            setUploadedMedia((prev) => ({
                ...prev,
                [type]: null,
            }));
        }
    };

    // Fetch projects
    useEffect(() => {
        const fetchData = async () => {
            setProjectsLoading(true);
            try {
                const projectsResponse = await axiosInstance.get('/projects');
                setProjects(projectsResponse.data.data);
            } catch (error) {
                console.error('Error fetching projects:', error);
                toast.error('فشل في تحميل المشاريع');
            } finally {
                setProjectsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch buildings when project is selected
    useEffect(() => {
        const fetchBuildings = async () => {
            if (selectedProject) {
                setBuildingsLoading(true);
                setSelectedBuilding(null); // Reset building selection
                setSelectedUnit(null); // Reset unit selection
                try {
                    const buildingsResponse = await axiosInstance.get('/buildings', {
                        params: { project_id: selectedProject }
                    });
                    setBuildings(buildingsResponse.data.data);

                    // Get project details to load installment options
                    const projectDetails = projects.find(p => p.id === selectedProject);
                    if (projectDetails) {
                        // This will be applied when a unit is selected
                    }
                } catch (error) {
                    console.error('Error fetching buildings:', error);
                    toast.error('فشل في تحميل المباني');
                } finally {
                    setBuildingsLoading(false);
                }
            } else {
                setBuildings([]);
            }
        };

        fetchBuildings();
    }, [selectedProject, projects]);

    // Fetch units when building is selected
    useEffect(() => {
        const fetchUnits = async () => {
            if (selectedBuilding) {
                setUnitsLoading(true);
                setSelectedUnit(null); // Reset unit selection
                try {
                    const unitsResponse = await axiosInstance.get('/units', {
                        params: { building_id: selectedBuilding }
                    });
                    setUnits(unitsResponse.data.data);
                } catch (error) {
                    console.error('Error fetching units:', error);
                    toast.error('فشل في تحميل الوحدات');
                } finally {
                    setUnitsLoading(false);
                }
            } else {
                setUnits([]);
            }
        };

        fetchUnits();
    }, [selectedBuilding]);

    // Update unit details when a unit is selected
    useEffect(() => {
        if (selectedUnit && units.length > 0) {
            const unit = units.find(u => u.id === selectedUnit);
            if (unit) {
                const initialDetails: UnitDetails = {
                    unit_number: unit.unit_number,
                    unit_type: unit.unit_type,
                    price: Number(unit.price),
                    status: unit.status,
                    area: Number(unit.area),
                    floor: Number(unit.floor),
                    bedrooms: Number(unit.bedrooms),
                    bathrooms: Number(unit.bathrooms),
                    reservation_deposit: null,
                    down_payment: null,
                    final_price: Number(unit.price),
                    monthly_installment: null,
                    selected_installment_types: [],
                    installment_details: {}
                };

                // Apply default deposit percentage from project if available
                if (selectedProject) {
                    const project = projects.find(p => p.id === selectedProject);
                    if (project?.deposit_percentage) {
                        const downPayment = (Number(unit.price) * project.deposit_percentage) / 100;
                        initialDetails.down_payment = downPayment;
                    }

                    // Select monthly installment by default if available
                    if (project?.installment_options?.MONTHLY) {
                        initialDetails.selected_installment_types = ['MONTHLY'];
                        initialDetails.installment_details = {
                            'MONTHLY': {
                                type: 'MONTHLY',
                                count: null,
                                amount: null
                            }
                        };
                    }
                }

                setUnitDetails(initialDetails);
            }
        }
    }, [selectedUnit, units, selectedProject, projects]);

    // Update useEffect for project selection
    useEffect(() => {
        if (selectedProject) {
            const project = projects.find(p => p.id === selectedProject);
            if (project) {
                // Convert installment options object keys to array
                const installmentTypes = Object.keys(project.installment_options || {});
                setAvailableInstallmentTypes(installmentTypes);
                
                // Select monthly installment by default if available
                if (project.installment_options?.MONTHLY) {
                    setUnitDetails(prev => ({
                        ...prev,
                        selected_installment_types: ['MONTHLY'],
                        installment_details: {
                            'MONTHLY': {
                                type: 'MONTHLY',
                                count: null,
                                amount: null
                            }
                        }
                    }));
                }
            }
        }
    }, [selectedProject, projects]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            console.log(formErrors);
            toast.error('يرجى التحقق من صحة البيانات المدخلة');
            return;
        }

        if (uploading.national_id_images || uploading.reservation_deposit_receipt || uploading.attachments) {
            toast.error('يرجى الانتظار حتى اكتمال رفع الملفات');
            return;
        }

        setSubmitLoading(true);

        try {
            const formData = new FormData();
           

            formData.append('client[name]', clientData.name);
            formData.append('client[phone]', clientData.phone);
            formData.append('client[national_id]', clientData.nationalId);
            formData.append('client[address]', clientData.address);
            formData.append('client[email]', clientData.email);
            formData.append('client[job]', clientData.job);
            formData.append('client[nationality]', clientData.nationality);

            // Append reservation dates
            formData.append('reservation_date', reservationDates.reservation_date);
            formData.append('contract_date', reservationDates.contract_date);

            // Append unit details
            if (selectedUnit) {
                formData.append('unit_id', selectedUnit.toString());
            }
            formData.append('reservation_deposit', unitDetails.reservation_deposit?.toString() || '');
            formData.append('down_payment', unitDetails.down_payment?.toString() || '');
            formData.append('final_price', unitDetails.final_price.toString());

            // Append installment details
            unitDetails.selected_installment_types.forEach((type, index) => {
                const detail = unitDetails.installment_details[type];
                formData.append(`installments_details[${index}][type]`, type);
                formData.append(`installments_details[${index}][count]`, detail?.count?.toString() || '');
                formData.append(`installments_details[${index}][amount]`, detail?.amount?.toString() || '');
            });

            // Append uploaded media
            Object.entries(uploadedMedia).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((id, index) => {
                        formData.append(`${key}[${index}]`, id.toString());
                    });
                } else if (value !== null) {
                    formData.append(key, value.toString());
                }
            });

            // Log the form data for debugging
            console.log('Sending form data:', {
                client: {
                    name: clientData.name,
                    phone: clientData.phone,
                    national_id: clientData.nationalId,
                    address: clientData.address,
                    email: clientData.email,
                    job: clientData.job,
                    nationality: clientData.nationality
                },
                reservationDates,
                selectedUnit,
                unitDetails,
                uploadedMedia
            });

            const response = await axiosInstance.post('/reservations', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Response:', response.data);

            if (response.status >= 200 && response.status < 300) {
                toast.success('تم حجز الوحدة بنجاح');
                // Reset form or redirect
                const reservationId = response.data.data.id;
                window.location.href = `/reservations/${reservationId}`;
            } else {
                console.log(response.data);
                toast.error(response.data.message || 'حدث خطأ أثناء حجز الوحدة');
            }
        } catch (error: unknown) {
            console.error('Error submitting form:', error);
            if (error && typeof error === 'object' && 'response' in error) {
                const errorResponse = error.response as { data?: { errors?: Record<string, string[]>; message?: string } };
                if (errorResponse.data?.errors) {
                    const newErrors: FormErrors = {};
                    Object.entries(errorResponse.data.errors).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            newErrors[key] = value[0];
                        }
                    });
                    setErrors(newErrors);
                    toast.error('يرجى التحقق من صحة البيانات المدخلة');
                } else if (errorResponse.data?.message) {
                    toast.error(errorResponse.data.message);
                } else {
                    toast.error('حدث خطأ أثناء حجز الوحدة');
                }
            } else {
                toast.error('حدث خطأ أثناء حجز الوحدة');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    // Add this function before the return statement
    const calculateTotalAmount = () => {
        let total = unitDetails.down_payment || 0;
        Object.values(unitDetails.installment_details).forEach((details) => {
            if (details && details.count !== null && details.amount !== null) {
                total += details.count * details.amount;
            }
        });
        return total;
    };

    // Update handleInstallmentTypeSelect function
    const handleInstallmentTypeSelect = (type: string) => {
        const existingInstallment = unitDetails.selected_installment_types.includes(type);

        if (existingInstallment) {
            setUnitDetails(prev => ({
                ...prev,
                selected_installment_types: prev.selected_installment_types.filter(t => t !== type),
                installment_details: Object.fromEntries(
                    Object.entries(prev.installment_details).filter(([key]) => key !== type)
                )
            }));
        } else {
            setUnitDetails(prev => ({
                ...prev,
                selected_installment_types: [...prev.selected_installment_types, type],
                installment_details: {
                    ...prev.installment_details,
                    [type]: {
                        type,
                        count: null,
                        amount: null
                    } as InstallmentDetail
                }
            }));
        }
    };

    // Update handleInstallmentDetailChange function
    const handleInstallmentDetailChange = (type: string, field: 'count' | 'amount', value: string) => {
        const numValue = parseFormattedNumber(value);
        if (numValue !== null && numValue < 0) return;

        setUnitDetails(prev => ({
            ...prev,
            installment_details: {
                ...prev.installment_details,
                [type]: {
                    ...prev.installment_details[type],
                    [field]: numValue
                }
            }
        }));
    };

    if (loading) {
        return <div className="loader"></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">حجز وحدة</h1>
                    <p className="mt-2 text-sm text-gray-600">قم بتعبئة النموذج التالي لحجز الوحدة</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Project, Building, and Unit Selection */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">اختيار الوحدة</h2>
                            <p className="mt-1 text-sm text-gray-500">اختر المشروع والمبنى والوحدة التي ترغب في حجزها</p>
                        </div>
                        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Project Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">المشروع *</label>
                                <Select
                                    value={selectedProject}
                                    onChange={(value) => setSelectedProject(value)}
                                    className={`w-full ${errors.project ? 'border-red-500' : ''}`}
                                    placeholder={projectsLoading ? "جاري التحميل..." : "اختر المشروع"}
                                    loading={projectsLoading}
                                    showSearch
                                    filterOption={filterProjects}
                                    notFoundContent={projectsLoading ? "جاري التحميل..." : "لا توجد نتائج"}
                                >
                                    {projects?.map((project) => (
                                        <Select.Option key={project.id} value={project.id} label={project.name}>
                                            {project.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                                {errors.project && <p className="mt-1 text-sm text-red-600">{errors.project}</p>}
                            </div>

                            {/* Building Selection */}
                            {selectedProject && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">المبنى *</label>
                                    <Select
                                        value={selectedBuilding}
                                        onChange={(value) => setSelectedBuilding(value)}
                                        className={`w-full ${errors.building ? 'border-red-500' : ''}`}
                                        placeholder={buildingsLoading ? "جاري التحميل..." : "اختر المبنى"}
                                        loading={buildingsLoading}
                                        showSearch
                                        filterOption={filterBuildings}
                                        notFoundContent={buildingsLoading ? "جاري التحميل..." : "لا توجد نتائج"}
                                    >
                                        {buildings?.map((building:any) => (
                                            <Select.Option key={building.id} value={building.id} label={building.name}>
                                                {building.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                    {errors.building && <p className="mt-1 text-sm text-red-600">{errors.building}</p>}
                                </div>
                            )}

                            {/* Unit Selection */}
                            {selectedBuilding && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">الوحدة *</label>
                                    <Select
                                        value={selectedUnit}
                                        onChange={(value) => setSelectedUnit(value)}
                                        className={`w-full ${errors.unit ? 'border-red-500' : ''}`}
                                        placeholder={unitsLoading ? "جاري التحميل..." : "اختر الوحدة"}
                                        loading={unitsLoading}
                                        showSearch
                                        filterOption={filterUnits}
                                        notFoundContent={unitsLoading ? "جاري التحميل..." : "لا توجد نتائج"}
                                    >
                                        {units.map((unit) => (
                                            <Select.Option
                                                key={unit.id}
                                                value={unit.id}
                                                label={`${unit.unit_number} - ${unit.unit_type}`}
                                                disabled={unit.status !== "متاحة"}
                                            >
                                                {unit.unit_number} - {unit.unit_type}
                                                {unit.status !== "متاحة" && " (غير متاحه) ❌"}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                    {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Only show the following sections if a unit is selected */}
                    {selectedUnit && (
                        <>
                            {/* Unit Details and Payment Terms */}
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-800">معلومات الوحدة</h2>
                                    <p className="mt-1 text-sm text-gray-500">تفاصيل الوحدة المختارة</p>
                                </div>
                                <div className="px-6 py-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الوحدة</label>
                                            <input
                                                type="text"
                                                value={unitDetails.unit_number}
                                                disabled
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">نوع الوحدة</label>
                                            <input
                                                type="text"
                                                value={unitDetails.unit_type}
                                                disabled
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                                            <input
                                                type="text"
                                                value={`${unitDetails.price.toLocaleString()} جنيه`}
                                                disabled
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">المساحة</label>
                                            <input
                                                type="text"
                                                value={`${unitDetails.area} متر مربع`}
                                                disabled
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">الطابق</label>
                                            <input
                                                type="text"
                                                value={unitDetails.floor}
                                                disabled
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">عدد الغرف</label>
                                            <input
                                                type="text"
                                                value={unitDetails.bedrooms}
                                                disabled
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">عدد الحمامات</label>
                                            <input
                                                type="text"
                                                value={unitDetails.bathrooms}
                                                disabled
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Client Data Section */}
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-800">بيانات العميل</h2>
                                    <p className="mt-1 text-sm text-gray-500">معلومات العميل الشخصية</p>
                                </div>
                                <div className="px-6 py-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
                                            <input
                                                type="text"
                                                value={clientData.name}
                                                onChange={(e) => handleInputChange(e, "name", "text")}
                                                className={`block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                                placeholder="أدخل اسم العميل"
                                                id="name"
                                            />
                                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                                            <input
                                                type="text"
                                                value={clientData.phone}
                                                onChange={(e) => handleInputChange(e, "phone", "text")}
                                                className={`block w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                                placeholder="أدخل رقم الهاتف"
                                                id="phone"
                                            />
                                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                        </div>

                                        {/* National ID */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">الرقم القومي *</label>
                                            <input
                                                type="text"
                                                value={clientData.nationalId}
                                                onChange={(e) => handleInputChange(e, "nationalId", "text")}
                                                className={`block w-full border ${errors.nationalId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                                placeholder="أدخل الرقم القومي"
                                                id="nationalId"
                                            />
                                            {errors.nationalId && <p className="mt-1 text-sm text-red-600">{errors.nationalId}</p>}
                                        </div>

                                        {/* Address */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label>
                                            <input
                                                type="text"
                                                value={clientData.address}
                                                onChange={(e) => handleInputChange(e, "address", "text")}
                                                className={`block w-full border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                                placeholder="أدخل العنوان"
                                                id="address"
                                            />
                                            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                                        </div>

                                        {/* Job */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">الوظيفة *</label>
                                            <input
                                                type="text"
                                                value={clientData.job}
                                                onChange={(e) => handleInputChange(e, "job", "text")}
                                                className={`block w-full border ${errors.job ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                                placeholder="أدخل الوظيفة"
                                                id="job"
                                            />
                                            {errors.job && <p className="mt-1 text-sm text-red-600">{errors.job}</p>}
                                        </div>

                                        {/* Nationality */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">الجنسية *</label>
                                            <input
                                                type="text"
                                                value={clientData.nationality}
                                                onChange={(e) => handleInputChange(e, "nationality", "text")}
                                                className={`block w-full border ${errors.nationality ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                                placeholder="أدخل الجنسية"
                                                id="nationality"
                                            />
                                            {errors.nationality && <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                                            <input
                                                type="email"
                                                value={clientData.email}
                                                onChange={(e) => handleInputChange(e, "email", "email")}
                                                className={`block w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                                placeholder="أدخل البريد الإلكتروني"
                                                id="email"
                                            />
                                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reservation Dates Section */}
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Reservation Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الحجز *</label>
                                            <DatePicker
                                                className={`w-full ${errors.reservation_date ? 'border-red-500' : ''}`}
                                                placeholder="اختر تاريخ الحجز"
                                                format="YYYY-MM-DD"
                                                onChange={(date) => handleDateChange(date, 'reservation_date')}
                                                value={reservationDates.reservation_date ? dayjs(reservationDates.reservation_date) : null}
                                            />
                                            {errors.reservation_date && <p className="mt-1 text-sm text-red-600">{errors.reservation_date}</p>}
                                        </div>

                                        {/* Contract Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ العقد *</label>
                                            <DatePicker
                                                className={`w-full ${errors.contract_date ? 'border-red-500' : ''}`}
                                                placeholder="اختر تاريخ العقد"
                                                format="YYYY-MM-DD"
                                                onChange={(date) => handleDateChange(date, 'contract_date')}
                                                value={reservationDates.contract_date ? dayjs(reservationDates.contract_date) : null}
                                            />
                                            {errors.contract_date && <p className="mt-1 text-sm text-red-600">{errors.contract_date}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Attachments Section */}
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-800">المرفقات</h2>
                                    <p className="mt-1 text-sm text-gray-500">قم برفع المستندات المطلوبة</p>
                                </div>
                                <div className="px-6 py-5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* National ID Card */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">صورة البطاقة الشخصية *</label>
                                            <div id="national_id_images" className="space-y-2">
                                                {attachments.national_id_images.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {attachments.national_id_images.map((file, index) => (
                                                            <div key={index} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                                                                <span className="truncate max-w-[200px] text-sm">{file.name}</span>
                                                                <div className="flex items-center">
                                                                    {uploading.national_id_images && index === attachments.national_id_images.length - 1 ? (
                                                                        <div className="animate-spin h-5 w-5 border-t-2 border-blue-500 border-r-2 rounded-full mr-2"></div>
                                                                    ) : uploadedMedia.national_id_images[index] ? (
                                                                        <Check className="h-5 w-5 text-green-500 mr-2" />
                                                                    ) : null}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeFile("national_id_images", index)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                        disabled={uploading.national_id_images}
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <label className="flex items-center justify-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                            <Upload className="h-5 w-5 mr-2 text-gray-500" />
                                                            <span className="text-sm text-gray-600">إضافة المزيد</span>
                                                            <input
                                                                type="file"
                                                                onChange={(e) => handleFileUpload(e, "national_id_images")}
                                                                className="hidden"
                                                                multiple
                                                                accept="image/*"
                                                                disabled={uploading.national_id_images}
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                        <Upload className="h-6 w-6 mr-2 text-gray-500" />
                                                        <span className="text-sm text-gray-600">اختيار ملف</span>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => handleFileUpload(e, "national_id_images")}
                                                            className="hidden"
                                                            multiple
                                                            accept="image/*"
                                                            disabled={uploading.national_id_images}
                                                        />
                                                    </label>
                                                )}
                                                {errors.national_id_images && <p className="mt-2 text-sm text-red-600">{errors.national_id_images}</p>}
                                            </div>
                                        </div>

                                        {/* Reservation Deposit Receipt */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">إيصال السداد *</label>
                                            <div id="reservation_deposit_receipt" className="space-y-2">
                                                {attachments.reservation_deposit_receipt ? (
                                                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                                                        <span className="truncate max-w-[200px] text-sm">{attachments.reservation_deposit_receipt.name}</span>
                                                        <div className="flex items-center">
                                                            {uploading.reservation_deposit_receipt ? (
                                                                <div className="animate-spin h-5 w-5 border-t-2 border-blue-500 border-r-2 rounded-full mr-2"></div>
                                                            ) : uploadedMedia.reservation_deposit_receipt ? (
                                                                <Check className="h-5 w-5 text-green-500 mr-2" />
                                                            ) : null}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile("reservation_deposit_receipt")}
                                                                className="text-red-500 hover:text-red-700"
                                                                disabled={uploading.reservation_deposit_receipt}
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                        <Upload className="h-6 w-6 mr-2 text-gray-500" />
                                                        <span className="text-sm text-gray-600">اختيار ملف</span>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => handleFileUpload(e, "reservation_deposit_receipt")}
                                                            className="hidden"
                                                            accept="image/*"
                                                            disabled={uploading.reservation_deposit_receipt}
                                                        />
                                                    </label>
                                                )}
                                                {errors.reservation_deposit_receipt && <p className="mt-2 text-sm text-red-600">{errors.reservation_deposit_receipt}</p>}
                                            </div>
                                        </div>

                                        {/* Additional Attachments */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">مرفقات إضافية</label>
                                            <div id="attachments" className="space-y-2">
                                                {attachments.attachments.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {attachments.attachments.map((file, index) => (
                                                            <div key={index} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                                                                <span className="truncate max-w-[200px] text-sm">{file.name}</span>
                                                                <div className="flex items-center">
                                                                    {uploading.attachments && index === attachments.attachments.length - 1 ? (
                                                                        <div className="animate-spin h-5 w-5 border-t-2 border-blue-500 border-r-2 rounded-full mr-2"></div>
                                                                    ) : uploadedMedia.attachments[index] ? (
                                                                        <Check className="h-5 w-5 text-green-500 mr-2" />
                                                                    ) : null}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeFile("attachments", index)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                        disabled={uploading.attachments}
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <label className="flex items-center justify-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                            <Upload className="h-5 w-5 mr-2 text-gray-500" />
                                                            <span className="text-sm text-gray-600">إضافة المزيد</span>
                                                            <input
                                                                type="file"
                                                                onChange={(e) => handleFileUpload(e, "attachments")}
                                                                className="hidden"
                                                                multiple
                                                                accept="image/*"
                                                                disabled={uploading.attachments}
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                        <Upload className="h-6 w-6 mr-2 text-gray-500" />
                                                        <span className="text-sm text-gray-600">اختيار ملف</span>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => handleFileUpload(e, "attachments")}
                                                            className="hidden"
                                                            multiple
                                                            accept="image/*"
                                                            disabled={uploading.attachments}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Information Section */}
                            <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-800">معلومات الدفع</h2>
                                    <p className="mt-1 text-sm text-gray-500">تفاصيل الدفع وشروط التقسيط</p>
                                </div>
                                <div className="px-6 py-5">
                                    <div className="space-y-8">

                                        {/* Payment Summary Card */}
                                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                            <h3 className="text-lg font-medium text-gray-800 mb-4">ملخص الدفع</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-white rounded-md p-4 shadow-sm">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">دفعة الحجز *</label>
                                                    <div className="relative rounded-md shadow-sm">
                                                        <input
                                                            type="text"
                                                            value={formatNumber(unitDetails.reservation_deposit)}
                                                            onChange={(e) => handleUnitDetailChange(e, 'reservation_deposit')}
                                                            className={`block w-full pr-12 py-2.5 sm:text-sm border ${errors.reservation_deposit ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                                                            placeholder="أدخل قيمة دفعة الحجز"
                                                        />
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                            <span className="text-gray-500 sm:text-sm">جنيه</span>
                                                        </div>
                                                    </div>
                                                    {errors.reservation_deposit && (
                                                        <p className="mt-2 text-sm text-red-600">{errors.reservation_deposit}</p>
                                                    )}
                                                </div>

                                                <div className="bg-white rounded-md p-4 shadow-sm">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">الدفعة المقدمة *</label>
                                                    <div className="relative rounded-md shadow-sm">
                                                        <input
                                                            type="text"
                                                            value={formatNumber(unitDetails.down_payment)}
                                                            onChange={(e) => handleUnitDetailChange(e, 'down_payment')}
                                                            className={`block w-full pr-12 py-2.5 sm:text-sm border ${errors.down_payment ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                                                            placeholder="أدخل قيمة الدفعة المقدمة"
                                                        />
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                            <span className="text-gray-500 sm:text-sm">جنيه</span>
                                                        </div>
                                                    </div>
                                                    {errors.down_payment && (
                                                        <p className="mt-2 text-sm text-red-600">{errors.down_payment}</p>
                                                    )}
                                                </div>

                                            </div>
                                        </div>

                                        {/* Installment Options */}
                                        <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
                                            <div className="px-6 py-5 border-b border-gray-200">
                                                <h2 className="text-xl font-semibold text-gray-800">خيارات التقسيط</h2>
                                                <p className="mt-1 text-sm text-gray-500">اختر نظام التقسيط المناسب</p>
                                            </div>

                                            <div className="px-6 py-5">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                    {availableInstallmentTypes.map((type) => (
                                                        <button
                                                            type="button"
                                                            key={type}
                                                            onClick={() => handleInstallmentTypeSelect(type)}
                                                            className={`p-4 rounded-lg border ${unitDetails.selected_installment_types.includes(type)
                                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                    : 'border-gray-300 hover:border-blue-400'
                                                                } transition-all duration-200`}
                                                        >
                                                            {INSTALLMENT_TYPE_TRANSLATIONS[type]}
                                                        </button>
                                                    ))}
                                                </div>

                                                {unitDetails.selected_installment_types.length > 0 && (
                                                    <div className="space-y-6">
                                                        {unitDetails.selected_installment_types.map((type) => (
                                                            <div key={type} className="bg-gray-50 p-4 rounded-lg">
                                                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                                                    {INSTALLMENT_TYPE_TRANSLATIONS[type]}
                                                                </h3>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                            عدد الأقساط
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={formatNumber(unitDetails.installment_details[type]?.count)}
                                                                            onChange={(e) => handleInstallmentDetailChange(type, 'count', e.target.value)}
                                                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                            placeholder="عدد الأقساط"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                            قيمة القسط
                                                                        </label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="text"
                                                                                value={formatNumber(unitDetails.installment_details[type]?.amount)}
                                                                                onChange={(e) => handleInstallmentDetailChange(type, 'amount', e.target.value)}
                                                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                                placeholder="قيمة القسط"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Total Amount After Installments */}
                                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                            <h3 className="text-lg font-medium text-gray-800 mb-4">المبلغ الإجمالي</h3>
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="bg-white rounded-md p-4 shadow-sm">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ الإجمالي بعد التقسيط</label>
                                                    <div className="relative rounded-md shadow-sm">
                                                        <input
                                                            type="text"
                                                            value={formatNumber(calculateTotalAmount())}
                                                            disabled
                                                            className="block w-full pr-12 py-2.5 sm:text-sm border border-gray-300 rounded-md bg-gray-50"
                                                        />
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                            <span className="text-gray-500 sm:text-sm">جنيه</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Expenses */}
                                        {selectedProject && projects.find(p => p.id === selectedProject)?.additional_expenses && (
                                            <div className="border-t border-gray-200 pt-6">
                                                <h3 className="text-lg font-medium text-gray-900 mb-4">المصروفات الإضافية</h3>
                                                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                                    <div className="space-y-4">
                                                        {projects.find(p => p.id === selectedProject)?.additional_expenses?.map((expense, index) => (
                                                            <div key={index} className="bg-white rounded-md p-4 shadow-sm">
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">{expense.name}</label>
                                                                <div className="relative rounded-md shadow-sm">
                                                                    <input
                                                                        type="text"
                                                                        value={expense.type === 'fixed' ?
                                                                            formatNumber(expense.value) :
                                                                            formatNumber((unitDetails.price * expense.value) / 100)
                                                                        }
                                                                        disabled
                                                                        className="block w-full pr-12 py-2.5 sm:text-sm border border-gray-300 rounded-md bg-gray-50"
                                                                    />
                                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                        <span className="text-gray-500 sm:text-sm">جنيه</span>
                                                                    </div>
                                                                </div>
                                                                {expense.type === 'percentage' && (
                                                                    <p className="mt-1 text-xs text-gray-500">نسبة {expense.value}% من سعر الوحدة</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitLoading || uploading.national_id_images || uploading.reservation_deposit_receipt || uploading.attachments}
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                                >
                                    {submitLoading ? (
                                        <>
                                            <svg className="animate-spin -mr-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            جاري إرسال البيانات...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-5 w-5 ml-2" />
                                            إرسال البيانات
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </form>

                {/* Contract Form (hidden) */}
                <div ref={contractRef} style={{ display: "none" }}>
                    {/* This is the printable contract template */}
                </div>
            </div>
        </div>
    );
};

export default ReserveUnit;