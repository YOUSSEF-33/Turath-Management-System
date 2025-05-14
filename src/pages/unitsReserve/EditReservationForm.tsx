import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, DatePicker, Form, Input, Select, Spin, Upload, message } from 'antd';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../axiosInstance';
import dayjs from 'dayjs';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { Check, Trash2 } from 'lucide-react';
import { uploadMedia } from '../../utils/mediaUtils';

interface ImageData {
  id: number;
  name: string;
  url: string;
  medium_url?: string;
  small_url?: string;
  disk?: string;
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

interface UnitData {
  unit_number: string;
  unit_type: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  plan_images: ImageData[];
  gallery: ImageData[];
  price?: number;
  building?: {
    name?: string;
    project?: {
      name?: string;
      installment_options?: Record<string, any>;
    };
  };
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

interface FormErrors {
  [key: string]: string;
}

interface Attachments {
  [key: string]: File[] | File | null;
  national_id_images: File[];
  reservation_deposit_receipt: File | null;
  attachments: File[];
}

interface UploadedMedia {
  [key: string]: number[] | number | null;
  national_id_images: number[];
  reservation_deposit_receipt: number | null;
  attachments: number[];
}

interface ExistingMedia {
  [key: string]: MediaFile[] | MediaFile | null;
  national_id_images: MediaFile[];
  reservation_deposit_receipt: MediaFile | null;
  attachments: MediaFile[];
}

const INSTALLMENT_TYPE_TRANSLATIONS: Record<string, string> = {
  'MONTHLY': 'شهري',
  'QUARTERLY': 'ربع سنوي',
  'ANNUAL': 'سنوي'
};

const EditReservation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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

  // Add state for available installment types
  const [availableInstallmentTypes, setAvailableInstallmentTypes] = useState<string[]>([]);

  // Attachments State
  const [attachments, setAttachments] = useState<Attachments>({
    national_id_images: [],
    reservation_deposit_receipt: null,
    attachments: [],
  });

  // Track uploaded media IDs
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia>({
    national_id_images: [],
    reservation_deposit_receipt: null,
    attachments: [],
  });

  // Track existing media
  const [existingMedia, setExistingMedia] = useState<ExistingMedia>({
    national_id_images: [],
    reservation_deposit_receipt: null,
    attachments: [],
  });

  // Track upload loading states
  const [uploading, setUploading] = useState<{
    national_id_images: boolean;
    reservation_deposit_receipt: boolean;
    attachments: boolean;
  }>({
    national_id_images: false,
    reservation_deposit_receipt: false,
    attachments: false,
  });

  // Fetch reservation data
  useEffect(() => {
    const fetchReservationData = async () => {
      try {
        const response = await axiosInstance.get(`/reservations/${id}`);
        const data = response.data.data;

        // Set client data
        setClientData({
          name: data.client.name || "",
          phone: data.client.phone || "",
          nationalId: data.client.national_id || "",
          address: data.client.address || "",
          email: data.client.email || "",
          job: data.client.job || "",
          nationality: data.client.nationality || "",
        });

        // Set reservation dates
        setReservationDates({
          reservation_date: data.reservation_date || "",
          contract_date: data.contract_date || "",
        });

        // Set unit details
        const unit = data.unit;
        setUnitDetails({
          unit_number: unit.unit_number,
          unit_type: unit.unit_type,
          price: Number(unit.price),
          status: unit.status,
          area: Number(unit.area),
          floor: Number(unit.floor),
          bedrooms: Number(unit.bedrooms),
          bathrooms: Number(unit.bathrooms),
          reservation_deposit: Number(data.reservation_deposit),
          down_payment: Number(data.down_payment),
          final_price: Number(data.final_price),
          monthly_installment: data.monthly_installment ? Number(data.monthly_installment) : null,
          selected_installment_types: data.installments_details.map((detail: any) => detail.type),
          installment_details: data.installments_details.reduce((acc: any, detail: any) => {
            acc[detail.type] = {
              type: detail.type,
              count: detail.count,
              amount: detail.amount
            };
            return acc;
          }, {})
        });

        // Set available installment types from project
        if (unit.building?.project?.installment_options) {
          setAvailableInstallmentTypes(Object.keys(unit.building.project.installment_options));
        }

        // Set existing media
        setExistingMedia({
          national_id_images: data.national_id_images || [],
          reservation_deposit_receipt: data.reservation_deposit_receipt || null,
          attachments: data.attachments || [],
        });

        // Set uploaded media IDs from existing media
        setUploadedMedia({
          national_id_images: (data.national_id_images || []).map((img: MediaFile) => img.id),
          reservation_deposit_receipt: data.reservation_deposit_receipt?.id || null,
          attachments: (data.attachments || []).map((img: MediaFile) => img.id),
        });

      } catch (error) {
        console.error('Error fetching reservation:', error);
        toast.error('فشل في تحميل بيانات الحجز');
      } finally {
        setLoading(false);
      }
    };

    fetchReservationData();
  }, [id]);

  // Input validation function
  const validateInput = (value: string, type: string): boolean => {
    switch (type) {
      case "name":
        return /^[\u0600-\u06FFa-zA-Z\s]+$/.test(value);
      case "phone":
        return /^[0-9+\s-]+$/.test(value);
      case "nationalId":
        return /^[0-9]+$/.test(value);
      case "email":
        return true; // Email will be validated on submit
      default:
        return true;
    }
  };

  // Form validation
  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};

    // Validate client data
    if (!clientData.name) {
      errors.name = 'الرجاء إدخال اسم العميل';
    }
    if (!clientData.phone) {
      errors.phone = 'الرجاء إدخال رقم الهاتف';
    }
    if (!clientData.nationalId) {
      errors.nationalId = 'الرجاء إدخال رقم البطاقة';
    }
    if (!clientData.email) {
      errors.email = 'الرجاء إدخال البريد الإلكتروني';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
      errors.email = 'الرجاء إدخال بريد إلكتروني صحيح';
    }

    // Validate dates
    if (!reservationDates.reservation_date) {
      errors.reservation_date = 'الرجاء اختيار تاريخ الحجز';
    }
    if (!reservationDates.contract_date) {
      errors.contract_date = 'الرجاء اختيار تاريخ التعاقد';
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
    const numValue = parseFloat(value.replace(/,/g, ''));
    if (isNaN(numValue) || numValue < 0) return;

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

  // Handle installment type selection
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
          }
        }
      }));
    }
  };

  // Handle installment detail change
  const handleInstallmentDetailChange = (type: string, field: 'count' | 'amount', value: string) => {
    const numValue = parseFloat(value.replace(/,/g, ''));
    if (isNaN(numValue) || numValue < 0) return;

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.error('يرجى التحقق من صحة البيانات المدخلة');
      return;
    }

    if (Object.values(uploading).some(Boolean)) {
      toast.error('يرجى الانتظار حتى اكتمال رفع الملفات');
      return;
    }

    setSubmitLoading(true);

    try {
      const formData = new FormData();

      // Append client data
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

      // Append payment details
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

      // Append media IDs
      uploadedMedia.national_id_images.forEach((id, index) => {
        formData.append(`national_id_images[${index}]`, id.toString());
      });

      if (uploadedMedia.reservation_deposit_receipt) {
        formData.append('reservation_deposit_receipt', uploadedMedia.reservation_deposit_receipt.toString());
      }

      uploadedMedia.attachments.forEach((id, index) => {
        formData.append(`attachments[${index}]`, id.toString());
      });

      await axiosInstance.put(`/reservations/${id}`, formData);
      toast.success('تم تحديث الحجز بنجاح');
      navigate(`/reservations/${id}`);
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error('فشل في تحديث الحجز');
    } finally {
      setSubmitLoading(false);
    }
  };

  // File upload handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Set uploading state
    setUploading(prev => ({
      ...prev,
      [type]: true
    }));

    // Update attachments state
    setAttachments(prev => ({
      ...prev,
      [type]: type === "reservation_deposit_receipt" ? files[0] : [...(prev[type] as File[]), ...Array.from(files)]
    }));

    try {
      const collectionName = type === "national_id_images" ? "national-id-images" : "attachments";
      const uploadPromises = Array.from(files).map(file =>
        uploadMedia(file, { collectionName })
      );

      const uploadedIds = await Promise.all(uploadPromises);

      // Update uploaded media state
      setUploadedMedia(prev => ({
        ...prev,
        [type]: type === "reservation_deposit_receipt" 
          ? uploadedIds[0] 
          : [...(prev[type] as number[]), ...uploadedIds]
      }));

      toast.success(`تم رفع الملفات بنجاح`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('فشل في رفع الملفات');

      // Revert attachments state on error
      setAttachments(prev => ({
        ...prev,
        [type]: type === "reservation_deposit_receipt" ? null : (prev[type] as File[]).slice(0, (prev[type] as File[]).length - files.length)
      }));
    } finally {
      setUploading(prev => ({
        ...prev,
        [type]: false
      }));
    }
  };

  const removeFile = (type: string, index: number) => {
    if (type === "reservation_deposit_receipt") {
      setAttachments(prev => ({
        ...prev,
        [type]: null
      }));
      setUploadedMedia(prev => ({
        ...prev,
        [type]: null
      }));
    } else {
      setAttachments(prev => ({
        ...prev,
        [type]: (prev[type] as File[]).filter((_: File, i: number) => i !== index)
      }));
      setUploadedMedia(prev => ({
        ...prev,
        [type]: (prev[type] as number[]).filter((_: number, i: number) => i !== index)
      }));
    }
  };

  const removeExistingFile = (type: string, id: number) => {
    setExistingMedia(prev => ({
      ...prev,
      [type]: Array.isArray(prev[type]) 
        ? prev[type].filter(file => file.id !== id)
        : null
    }));
    setUploadedMedia(prev => ({
      ...prev,
      [type]: Array.isArray(prev[type])
        ? prev[type].filter(mediaId => mediaId !== id)
        : null
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="جاري تحميل البيانات..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">تعديل الحجز</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Unit Details */}
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
              </div>
            </div>
          </div>

          {/* Client Data */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">بيانات العميل</h2>
              <p className="mt-1 text-sm text-gray-500">معلومات العميل الشخصية</p>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
                  <input
                    type="text"
                    value={clientData.name}
                    onChange={(e) => handleInputChange(e, "name", "text")}
                    className={`block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="أدخل اسم العميل"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                  <input
                    type="text"
                    value={clientData.phone}
                    onChange={(e) => handleInputChange(e, "phone", "text")}
                    className={`block w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="أدخل رقم الهاتف"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرقم القومي *</label>
                  <input
                    type="text"
                    value={clientData.nationalId}
                    onChange={(e) => handleInputChange(e, "nationalId", "text")}
                    className={`block w-full border ${errors.nationalId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="أدخل الرقم القومي"
                  />
                  {errors.nationalId && <p className="mt-1 text-sm text-red-600">{errors.nationalId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => handleInputChange(e, "email", "email")}
                    className={`block w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="أدخل البريد الإلكتروني"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label>
                  <input
                    type="text"
                    value={clientData.address}
                    onChange={(e) => handleInputChange(e, "address", "text")}
                    className={`block w-full border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="أدخل العنوان"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوظيفة *</label>
                  <input
                    type="text"
                    value={clientData.job}
                    onChange={(e) => handleInputChange(e, "job", "text")}
                    className={`block w-full border ${errors.job ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="أدخل الوظيفة"
                  />
                  {errors.job && <p className="mt-1 text-sm text-red-600">{errors.job}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الجنسية *</label>
                  <input
                    type="text"
                    value={clientData.nationality}
                    onChange={(e) => handleInputChange(e, "nationality", "text")}
                    className={`block w-full border ${errors.nationality ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="أدخل الجنسية"
                  />
                  {errors.nationality && <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Reservation Dates */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Payment Information */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
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
                          value={unitDetails.reservation_deposit?.toLocaleString() || ''}
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
                          value={unitDetails.down_payment?.toLocaleString() || ''}
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

                {/* Installment Types */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">نوع التقسيط *</h3>
                  <div className="space-x-4 space-x-reverse">
                    {availableInstallmentTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleInstallmentTypeSelect(type)}
                        className={`p-4 rounded-lg border ${
                          unitDetails.selected_installment_types.includes(type)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-blue-400'
                        } transition-all duration-200 mb-4 ml-4`}
                      >
                        {INSTALLMENT_TYPE_TRANSLATIONS[type]}
                      </button>
                    ))}
                  </div>
                  {errors.installment && <p className="mt-2 text-sm text-red-600">{errors.installment}</p>}
                </div>

                {/* Installment Details */}
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
                              value={unitDetails.installment_details[type]?.count?.toLocaleString() || ''}
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
                                value={unitDetails.installment_details[type]?.amount?.toLocaleString() || ''}
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
          </div>

          {/* Attachments */}
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
                    {/* Show existing national ID images */}
                    {existingMedia.national_id_images.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="truncate max-w-[200px] text-sm">{file.name}</span>
                        <div className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <button
                            type="button"
                            onClick={() => removeExistingFile("national_id_images", file.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Show newly uploaded files */}
                    {attachments.national_id_images.length > 0 && (
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
                      </div>
                    )}

                    {/* Upload button */}
                    <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload className="h-6 w-6 mr-2 text-gray-500" />
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
                    {errors.national_id_images && <p className="mt-2 text-sm text-red-600">{errors.national_id_images}</p>}
                  </div>
                </div>

                {/* Reservation Deposit Receipt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">إيصال السداد *</label>
                  <div id="reservation_deposit_receipt" className="space-y-2">
                    {/* Show existing receipt */}
                    {existingMedia.reservation_deposit_receipt && existingMedia.reservation_deposit_receipt.id && (
                      <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="truncate max-w-[200px] text-sm">{existingMedia.reservation_deposit_receipt.name}</span>
                        <div className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <button
                            type="button"
                            onClick={() => removeExistingFile("reservation_deposit_receipt", existingMedia.reservation_deposit_receipt.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show newly uploaded file */}
                    {attachments.reservation_deposit_receipt && (
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
                            onClick={() => removeFile("reservation_deposit_receipt", 0)}
                            className="text-red-500 hover:text-red-700"
                            disabled={uploading.reservation_deposit_receipt}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Upload button - only show if no file is selected */}
                    {!existingMedia.reservation_deposit_receipt && !attachments.reservation_deposit_receipt && (
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
                    {/* Show existing attachments */}
                    {existingMedia.attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="truncate max-w-[200px] text-sm">{file.name}</span>
                        <div className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <button
                            type="button"
                            onClick={() => removeExistingFile("attachments", file.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Show newly uploaded files */}
                    {attachments.attachments.length > 0 && (
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
                      </div>
                    )}

                    {/* Upload button */}
                    <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload className="h-6 w-6 mr-2 text-gray-500" />
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
                </div>
              </div>
            </div>
          </div>

          {/* Additional Payments */}
          <Card className="shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">مدفوعات إضافية</h2>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-4">
                {[
                  { type: 'حصة جراش + مرافق', amount: 150000.00, date: '2025-05-14' },
                  { type: 'وديعة صيانة', amount: 140014.14, date: '2025-05-14' }
                ].map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{payment.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {payment.amount.toLocaleString()} جنيه
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(payment.date).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Payment Summary */}
          <Card className="shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">ملخص المدفوعات</h2>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">سعر الوحدة</div>
                    <div className="text-lg font-medium text-gray-900">
                      {Number(unitDetails.price).toLocaleString()} جنيه
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">السعر النهائي</div>
                    <div className="text-lg font-medium text-gray-900">
                      {Number(unitDetails.final_price).toLocaleString()} جنيه
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">دفعة الحجز</div>
                    <div className="text-lg font-medium text-gray-900">
                      {Number(unitDetails.reservation_deposit).toLocaleString()} جنيه
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">الدفعة المقدمة</div>
                    <div className="text-lg font-medium text-gray-900">
                      {Number(unitDetails.down_payment).toLocaleString()} جنيه
                    </div>
                  </div>
                </div>
                
                {/* Installment Summary */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">تفاصيل الأقساط</h3>
                  <div className="space-y-4">
                    {unitDetails.selected_installment_types.map((type) => {
                      const detail = unitDetails.installment_details[type];
                      return (
                        <div key={type} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-900">
                                {INSTALLMENT_TYPE_TRANSLATIONS[type]}
                              </div>
                              <div className="text-sm text-gray-500">
                                عدد الأقساط: {detail.count}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {Number(detail.amount).toLocaleString()} جنيه
                              </div>
                              <div className="text-sm text-gray-500">
                                إجمالي: {(Number(detail.amount) * Number(detail.count)).toLocaleString()} جنيه
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Button Bar */}
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 shadow">
            <div className="flex justify-end space-x-4 space-x-reverse">
              <button
                type="button"
                onClick={() => navigate(`/reservations/${id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitLoading || Object.values(uploading).some(Boolean)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {submitLoading ? (
                  <>
                    <svg className="animate-spin -mr-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 ml-2" />
                    حفظ التعديلات
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReservation;