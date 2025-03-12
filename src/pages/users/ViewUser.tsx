import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import toast from 'react-hot-toast';

interface Role {
  id: number;
  name: string;
  readable_name: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
  role: Role;
}

const ViewUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      setUser(response.data.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدم');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">لم يتم العثور على المستخدم</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">تفاصيل المستخدم</h1>
          <button
            onClick={() => navigate('/users')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            عودة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User ID */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">رقم المستخدم</h3>
              <p className="mt-1 text-lg text-gray-900">{user.id}</p>
            </div>

            {/* Full Name */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">الاسم الكامل</h3>
              <p className="mt-1 text-lg text-gray-900">{`${user.first_name} ${user.last_name}`}</p>
            </div>

            {/* Email */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">البريد الإلكتروني</h3>
              <p className="mt-1 text-lg text-gray-900">{user.email}</p>
            </div>

            {/* Phone */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">رقم الهاتف</h3>
              <p className="mt-1 text-lg text-gray-900">{user.phone || '-'}</p>
            </div>

            {/* Role */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">الدور</h3>
              <p className="mt-1 text-lg text-gray-900">{user.role?.readable_name || '-'}</p>
            </div>

            {/* Created At */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">تاريخ الإنشاء</h3>
              <p className="mt-1 text-lg text-gray-900">
                {new Date(user.created_at).toLocaleDateString('ar-SA')}
              </p>
            </div>

            {/* Updated At */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">تاريخ آخر تحديث</h3>
              <p className="mt-1 text-lg text-gray-900">
                {new Date(user.updated_at).toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={() => navigate(`/users/edit/${user.id}`)}
              className="px-6 py-2 text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
            >
              تعديل المستخدم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUser; 