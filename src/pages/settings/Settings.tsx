import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import { Spin, Alert } from 'antd';

const Settings = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axiosInstance.get('/me');
        setUserInfo(response.data.data);
      } catch (err) {
        setError('فشل في تحميل معلومات المستخدم');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  if (loading) {
    return <div className="p-6 text-center"><Spin size="large" /></div>;
  }

  if (error) {
    return <div className="p-6 text-center"><Alert message={error} type="error" /></div>;
  }

  return (
    <div className="p-6 bg-gray-50 md:m-4 md:rounded my-2" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">معلومات المستخدم</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>الاسم الأول:</strong> {userInfo.first_name}
          </div>
          <div>
            <strong>اسم العائلة:</strong> {userInfo.last_name}
          </div>
          <div>
            <strong>البريد الإلكتروني:</strong> {userInfo.email}
          </div>
          <div>
            <strong>الهاتف:</strong> {userInfo.phone || 'غير متوفر'}
          </div>
          <div>
            <strong>الدور:</strong> {userInfo.role.readable_name}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
