import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../axiosInstance';
import { uploadMedia, validateMediaFile } from '../../utils/mediaUtils';

interface AdditionalExpense {
  name: string;
  type: 'PERCENTAGE' | 'FIXED_VALUE';
  value: number;
}

interface DocumentBackground {
  id: number;
  name: string;
  small_url: string;
  medium_url: string;
  url: string;
  disk: string;
}

const EditProject = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentsBackground, setDocumentsBackground] = useState<File | null>(null);
  const [existingDocumentBackground, setExistingDocumentBackground] = useState<DocumentBackground | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [installmentOptions, setInstallmentOptions] = useState<string[]>([]);
  const [depositPercentage, setDepositPercentage] = useState<number | ''>('');
  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([]);
  const [errors, setErrors] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axiosInstance.get(`/projects/${id}`);
        const project = response.data.data;
        setName(project.name);
        setDescription(project.description || '');
        setIsActive(project.is_active);
        setInstallmentOptions(project.installment_options || []);
        setDepositPercentage(project.deposit_percentage || '');
        setAdditionalExpenses(project.additional_expenses || []);
        if (project.documents_background) {
          setExistingDocumentBackground(project.documents_background);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('حدث خطأ أثناء جلب بيانات المشروع');
      } finally {
        setDataLoading(false);
      }
    };

    fetchProject();
  }, [id]);

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

      // Then update the project with the media ID
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('is_active', isActive ? '1' : '0');
      
      // Handle documents_background
      if (mediaId) {
        // If a new file was uploaded, use its ID
        formData.append('documents_background', String(mediaId));
      } else if (!existingDocumentBackground) {
        // If no existing file and no new file, send null to remove the file
        formData.append('documents_background', '');
      }
      // If there's an existing file and no new file was uploaded, don't send documents_background
      
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

      await axiosInstance.put(`/projects/${id}`, formData);
      toast.success('تم تحديث المشروع بنجاح');
      navigate('/projects');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('حدث خطأ أثناء تحديث المشروع');
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

  if (dataLoading) {
    return <div className='loader'></div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">تعديل المشروع</h1>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            عودة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Project Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المشروع</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Project Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف المشروع</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Active Status */}
          <div className="mb-6">
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
          <div className="mb-6">
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
          <div className="mb-6">
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
          <div className="mb-6">
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
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              خلفية المستندات المطبوعة
              <span className="text-gray-400 text-xs mr-1">(اختياري)</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors duration-200 bg-white">
              <div className="space-y-2 text-center">
                {existingDocumentBackground && !documentsBackground ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{existingDocumentBackground.name}</span>
                    </div>
                    <div className="flex justify-center space-x-2">
                      <a
                        href={existingDocumentBackground.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        عرض الملف
                      </a>
                      <button
                        type="button"
                        onClick={() => setExistingDocumentBackground(null)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                      >
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        حذف الملف
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className=" mx-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`${loading ? "loader" : "bg-blue-600 px-4 py-2 text-white rounded-lg hover:bg-blue-700"}`}
              disabled={loading}
            >
              {loading ? '' : 'تحديث'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProject;
