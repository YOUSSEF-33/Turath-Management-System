import React, { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../axiosInstance';
import { InputField } from '../../components/InputField';
import { uploadMedia, validateMediaFile } from '../../utils/mediaUtils';

interface AdditionalExpense {
  name: string;
  type: 'PERCENTAGE' | 'FIXED_VALUE';
  value: number;
}

const CreateProject = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentsBackground, setDocumentsBackground] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [installmentOptions, setInstallmentOptions] = useState<string[]>([]);
  const [depositPercentage, setDepositPercentage] = useState<number | ''>('');
  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([]);
  const [errors, setErrors] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateMediaFile(file);
      if (!validation.isValid) {
        toast.error(validation.error || 'خطأ في الملف');
        e.target.value = '';
        return;
      }
      setDocumentsBackground(file);
    }
  };

  const validate = () => {
    let valid = true;
    const errors = { name: '' };

    if (name.trim().length < 3) {
      errors.name = 'اسم المشروع يجب أن يكون على الأقل 3 أحرف';
      valid = false;
    }

    if (depositPercentage !== '' && (depositPercentage < 0 || depositPercentage > 100)) {
      toast.error('نسبة الدفعة المقدمة يجب أن تكون بين 0 و 100');
      valid = false;
    }

    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // First, upload the media file if one is selected
      let mediaId: number | null = null;
      if (documentsBackground) {
        setUploading(true);
        try {
          mediaId = await uploadMedia(documentsBackground, {
            collectionName: 'documents-background',
            onSuccess: () => toast.success('تم رفع الملف بنجاح'),
            onError: () => toast.error('حدث خطأ أثناء رفع الملف')
          });
        } catch (error) {
          console.error('File upload error:', error);
          setLoading(false);
          setUploading(false);
          return; // Stop the process if media upload fails
        } finally {
          setUploading(false);
        }
      }

      // Then create the project with the media ID
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('is_active', isActive ? '1' : '0');
      
      // Only append the documents_background if we have one
      if (mediaId) {
        formData.append('documents_background', String(mediaId));
      }
      
      if (depositPercentage !== '') {
        formData.append('deposit_percentage', String(depositPercentage));
      }

      // Send arrays directly without JSON.stringify
      if (installmentOptions.length > 0) {
        installmentOptions.forEach((option, index) => {
          formData.append(`installment_options[${index}]`, option);
        });
      }

      if (additionalExpenses.length > 0) {
        additionalExpenses.forEach((expense, index) => {
          formData.append(`additional_expenses[${index}][name]`, expense.name);
          formData.append(`additional_expenses[${index}][type]`, expense.type);
          formData.append(`additional_expenses[${index}][value]`, String(expense.value));
        });
      }

      await axiosInstance.post('/projects', formData);
      toast.success('تم إضافة المشروع بنجاح');
      navigate('/projects');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
        const errorData = error.response.data as { message?: string };
        if (errorData.message) {
          toast.error(errorData.message);
        } else {
          toast.error('حدث خطأ أثناء إضافة المشروع');
        }
      } else {
        toast.error('حدث خطأ أثناء إضافة المشروع');
      }
    } finally {
      setLoading(false);
    }
  };

  const addAdditionalExpense = () => {
    setAdditionalExpenses([...additionalExpenses, { name: '', type: 'PERCENTAGE', value: 0 }]);
  };

  const removeAdditionalExpense = (index: number) => {
    setAdditionalExpenses(additionalExpenses.filter((_, i) => i !== index));
  };

  const updateAdditionalExpense = (index: number, field: keyof AdditionalExpense, value: string | number) => {
    const newExpenses = [...additionalExpenses];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    setAdditionalExpenses(newExpenses);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">إضافة مشروع جديد</h1>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>عودة</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Project Name */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <InputField
                label="اسم المشروع *"
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="أدخل اسم المشروع"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Project Description */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف المشروع
                <span className="text-gray-400 text-xs mr-1">(اختياري)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                rows={3}
                placeholder="أدخل وصف المشروع..."
              />
            </div>

            {/* Active Status */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 transform ${isActive ? 'translate-x-6' : ''}`}></div>
                </div>
                <span className="text-sm font-medium text-gray-700">مشروع نشط</span>
              </label>
            </div>

            {/* Installment Options */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                نظام التقسيط
                <span className="text-gray-400 text-xs mr-1">(اختياري)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['MONTHLY', 'QUARTERLY', 'ANNUAL'].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      installmentOptions.includes(option)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={installmentOptions.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setInstallmentOptions([...installmentOptions, option]);
                        } else {
                          setInstallmentOptions(installmentOptions.filter((opt) => opt !== option));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="mr-3 text-sm font-medium text-gray-700">
                      {option === 'MONTHLY' ? 'شهري' : option === 'QUARTERLY' ? 'ربع سنوي' : 'سنوي'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Deposit Percentage */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نسبة الدفعة المقدمة
                <span className="text-gray-400 text-xs mr-1">(اختياري)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="أدخل النسبة المئوية"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* Additional Expenses */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  المصاريف الإضافية
                  <span className="text-gray-400 text-xs mr-1">(اختياري)</span>
                </label>
                <button
                  type="button"
                  onClick={addAdditionalExpense}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  إضافة مصروف
                </button>
              </div>
              <div className="space-y-4">
                {additionalExpenses.map((expense, index) => (
                  <div key={index} className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-sm font-medium text-gray-700">مصروف {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeAdditionalExpense(index)}
                        className="text-red-600 hover:text-red-500 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">اسم المصروف *</label>
                        <input
                          type="text"
                          value={expense.name}
                          onChange={(e) => updateAdditionalExpense(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">نوع المصروف *</label>
                        <select
                          value={expense.type}
                          onChange={(e) => updateAdditionalExpense(index, 'type', e.target.value as 'PERCENTAGE' | 'FIXED_VALUE')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          required
                        >
                          <option value="PERCENTAGE">نسبة مئوية</option>
                          <option value="FIXED_VALUE">قيمة ثابتة</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">القيمة *</label>
                        <input
                          type="number"
                          value={expense.value}
                          onChange={(e) => updateAdditionalExpense(index, 'value', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Background Upload */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                خلفية المستندات المطبوعة
                <span className="text-gray-400 text-xs mr-1">(اختياري)</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors duration-200 bg-white">
                <div className="space-y-2 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>رفع ملف</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        disabled={loading || uploading}
                      />
                    </label>
                    <p className="pr-1">أو اسحب وأفلت</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF حتى 3MB أو PDF
                  </p>
                  {uploading ? (
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <svg className="animate-spin h-4 w-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري الرفع...
                    </div>
                  ) : documentsBackground ? (
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {documentsBackground.name}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-3 border-t pt-6">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>إلغاء</span>
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-white">جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">إضافة المشروع</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
