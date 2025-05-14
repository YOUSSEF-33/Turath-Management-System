import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { Upload, Trash2, Check } from "lucide-react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";

interface EditReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    reservationId: number;
    onSuccess: () => void;
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

interface InstallmentDetail {
    type: string;
    count: number | null;
    amount: number | null;
}

interface MediaFile {
    id: number;
    name: string;
    url: string;
    small_url?: string;
    medium_url?: string;
    disk?: string;
}

interface FormErrors {
    [key: string]: string;
}

const INSTALLMENT_TYPE_TRANSLATIONS: Record<string, string> = {
    'MONTHLY': 'شهري',
    'QUARTERLY': 'ربع سنوي',
    'ANNUAL': 'سنوي'
};

const formatNumber = (value: number | null): string => {
    if (value === null) return '';
    return value.toLocaleString('en-US');
};

const parseFormattedNumber = (value: string): number | null => {
    if (!value) return null;
    return parseFloat(value.replace(/,/g, ''));
};

const EditReservationModal: React.FC<EditReservationModalProps> = ({
    isOpen,
    onClose,
    reservationId,
    onSuccess
}) => {
    // State for form data
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

    const [installmentDetails, setInstallmentDetails] = useState<InstallmentDetail[]>([]);
    const [selectedInstallmentTypes, setSelectedInstallmentTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    // Media states
    const [attachments, setAttachments] = useState<{
        national_id_images: File[];
        reservation_deposit_receipt: File | null;
        attachments: File[];
    }>({
        national_id_images: [],
        reservation_deposit_receipt: null,
        attachments: [],
    });

    const [existingMedia, setExistingMedia] = useState<{
        national_id_images: MediaFile[];
        reservation_deposit_receipt: MediaFile | null;
        attachments: MediaFile[];
    }>({
        national_id_images: [],
        reservation_deposit_receipt: null,
        attachments: [],
    });

    const [uploading, setUploading] = useState<{ [key: string]: boolean }>({
        national_id_images: false,
        reservation_deposit_receipt: false,
        attachments: false
    });

    // Payment details state
    const [paymentDetails, setPaymentDetails] = useState({
        reservation_deposit: null as number | null,
        down_payment: null as number | null,
        final_price: 0,
    });

    // Fetch reservation data
    useEffect(() => {
        const fetchReservationData = async () => {
            if (!reservationId) return;
            
            setLoading(true);
            try {
                const response = await axiosInstance.get(`/reservations/${reservationId}`);
                const data = response.data.data;

                // Set client data
                setClientData({
                    name: data.client.name,
                    phone: data.client.phone,
                    nationalId: data.client.national_id,
                    address: data.client.address,
                    email: data.client.email,
                    job: data.client.job,
                    nationality: data.client.nationality,
                });

                // Set dates
                setReservationDates({
                    reservation_date: data.reservation_date,
                    contract_date: data.contract_date,
                });

                // Set payment details
                setPaymentDetails({
                    reservation_deposit: parseFloat(data.reservation_deposit),
                    down_payment: parseFloat(data.down_payment),
                    final_price: parseFloat(data.final_price),
                });

                // Set installment details
                setInstallmentDetails(data.installments_details || []);
                setSelectedInstallmentTypes(data.installments_details?.map((detail: InstallmentDetail) => detail.type) || []);

                // Set existing media
                setExistingMedia({
                    national_id_images: data.national_id_images || [],
                    reservation_deposit_receipt: data.reservation_deposit_receipt,
                    attachments: data.attachments || [],
                });

            } catch (error) {
                console.error('Error fetching reservation:', error);
                toast.error('فشل في تحميل بيانات الحجز');
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchReservationData();
        }
    }, [reservationId, isOpen]);

    // Input handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const { value } = e.target;
        setClientData(prev => ({
            ...prev,
            [key]: value
        }));
        // Clear error when field is updated
        if (errors[key]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    const handleDateChange = (date: dayjs.Dayjs | null, field: keyof ReservationDates) => {
        if (date) {
            setReservationDates(prev => ({
                ...prev,
                [field]: date.format('YYYY-MM-DD')
            }));
        }
    };

    const handlePaymentDetailChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const { value } = e.target;
        const numValue = parseFormattedNumber(value);
        if (numValue !== null && numValue < 0) return;

        setPaymentDetails(prev => ({
            ...prev,
            [key]: numValue
        }));
    };

    // File upload handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(prev => ({ ...prev, [type]: true }));

        try {
            const formData = new FormData();
            Array.from(files).forEach(file => {
                formData.append('files', file);
            });
            formData.append('collection_name', type === 'national_id_images' ? 'national-id-images' : 
                                            type === 'reservation_deposit_receipt' ? 'reservation-deposit-receipts' : 
                                            'attachments');

            const response = await axiosInstance.post('/media', formData);
            
            if (response.data.data) {
                if (Array.isArray(response.data.data)) {
                    setExistingMedia(prev => ({
                        ...prev,
                        [type]: [...(prev[type] || []), ...response.data.data]
                    }));
                } else {
                    setExistingMedia(prev => ({
                        ...prev,
                        [type]: response.data.data
                    }));
                }
                toast.success('تم رفع الملف بنجاح');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('فشل في رفع الملف');
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    // Remove file handler
    const removeFile = async (type: string, fileId: number) => {
        try {
            await axiosInstance.delete(`/media/${fileId}`);
            setExistingMedia(prev => ({
                ...prev,
                [type]: Array.isArray(prev[type]) 
                    ? prev[type].filter((file: MediaFile) => file.id !== fileId)
                    : null
            }));
            toast.success('تم حذف الملف بنجاح');
        } catch (error) {
            console.error('Error removing file:', error);
            toast.error('فشل في حذف الملف');
        }
    };

    // Form validation
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!clientData.name) newErrors.name = 'الرجاء إدخال اسم العميل';
        if (!clientData.phone) newErrors.phone = 'الرجاء إدخال رقم الهاتف';
        if (!clientData.nationalId) newErrors.nationalId = 'الرجاء إدخال الرقم القومي';
        if (!clientData.address) newErrors.address = 'الرجاء إدخال العنوان';
        if (!clientData.job) newErrors.job = 'الرجاء إدخال الوظيفة';
        if (!clientData.nationality) newErrors.nationality = 'الرجاء إدخال الجنسية';

        if (!paymentDetails.reservation_deposit) newErrors.reservation_deposit = 'الرجاء إدخال قيمة دفعة الحجز';
        if (!paymentDetails.down_payment) newErrors.down_payment = 'الرجاء إدخال قيمة الدفعة المقدمة';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error('يرجى التحقق من صحة البيانات المدخلة');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();

            // Append client data
            Object.entries(clientData).forEach(([key, value]) => {
                formData.append(`client[${key}]`, value);
            });

            // Append dates
            formData.append('reservation_date', reservationDates.reservation_date);
            formData.append('contract_date', reservationDates.contract_date);

            // Append payment details
            formData.append('reservation_deposit', paymentDetails.reservation_deposit?.toString() || '');
            formData.append('down_payment', paymentDetails.down_payment?.toString() || '');
            formData.append('final_price', paymentDetails.final_price.toString());

            // Append installment details
            installmentDetails.forEach((detail, index) => {
                formData.append(`installments_details[${index}][type]`, detail.type);
                formData.append(`installments_details[${index}][count]`, detail.count?.toString() || '');
                formData.append(`installments_details[${index}][amount]`, detail.amount?.toString() || '');
            });

            await axiosInstance.put(`/reservations/${reservationId}`, formData);
            
            toast.success('تم تحديث الحجز بنجاح');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating reservation:', error);
            toast.error('فشل في تحديث الحجز');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="تعديل الحجز"
            open={isOpen}
            onCancel={onClose}
            width={1000}
            footer={[
                <button
                    key="cancel"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 ml-2"
                >
                    إلغاء
                </button>,
                <button
                    key="submit"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
            ]}
        >
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Client Information */}
                    <div className="bg-white rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">بيانات العميل</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
                                <input
                                    type="text"
                                    value={clientData.name}
                                    onChange={(e) => handleInputChange(e, "name")}
                                    className={`block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                                <input
                                    type="text"
                                    value={clientData.phone}
                                    onChange={(e) => handleInputChange(e, "phone")}
                                    className={`block w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                />
                                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                            </div>

                            {/* Add other client fields similarly */}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="bg-white rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">تواريخ الحجز</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الحجز *</label>
                                <DatePicker
                                    className="w-full"
                                    value={reservationDates.reservation_date ? dayjs(reservationDates.reservation_date) : null}
                                    onChange={(date) => handleDateChange(date, 'reservation_date')}
                                    format="YYYY-MM-DD"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ العقد *</label>
                                <DatePicker
                                    className="w-full"
                                    value={reservationDates.contract_date ? dayjs(reservationDates.contract_date) : null}
                                    onChange={(date) => handleDateChange(date, 'contract_date')}
                                    format="YYYY-MM-DD"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-white rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">تفاصيل الدفع</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">دفعة الحجز *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formatNumber(paymentDetails.reservation_deposit)}
                                        onChange={(e) => handlePaymentDetailChange(e, 'reservation_deposit')}
                                        className={`block w-full pr-12 border ${errors.reservation_deposit ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">جنيه</span>
                                    </div>
                                </div>
                                {errors.reservation_deposit && <p className="mt-1 text-sm text-red-600">{errors.reservation_deposit}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الدفعة المقدمة *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formatNumber(paymentDetails.down_payment)}
                                        onChange={(e) => handlePaymentDetailChange(e, 'down_payment')}
                                        className={`block w-full pr-12 border ${errors.down_payment ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">جنيه</span>
                                    </div>
                                </div>
                                {errors.down_payment && <p className="mt-1 text-sm text-red-600">{errors.down_payment}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Media Section */}
                    <div className="bg-white rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">المرفقات</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* National ID Images */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">صور البطاقة الشخصية</label>
                                <div className="space-y-2">
                                    {existingMedia.national_id_images.map((file) => (
                                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <span className="truncate">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile('national_id_images', file.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <Upload className="h-6 w-6 mr-2 text-gray-500" />
                                        <span className="text-sm text-gray-600">إضافة صور جديدة</span>
                                        <input
                                            type="file"
                                            onChange={(e) => handleFileUpload(e, "national_id_images")}
                                            className="hidden"
                                            multiple
                                            accept="image/*"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Reservation Receipt */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">إيصال الحجز</label>
                                <div className="space-y-2">
                                    {existingMedia.reservation_deposit_receipt && (
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <span className="truncate">{existingMedia.reservation_deposit_receipt.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile('reservation_deposit_receipt', existingMedia.reservation_deposit_receipt.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}
                                    <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <Upload className="h-6 w-6 mr-2 text-gray-500" />
                                        <span className="text-sm text-gray-600">تحديث إيصال الحجز</span>
                                        <input
                                            type="file"
                                            onChange={(e) => handleFileUpload(e, "reservation_deposit_receipt")}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default EditReservationModal; 