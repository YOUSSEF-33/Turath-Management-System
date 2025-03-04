import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // If you're using react-router for navigation
import toast from 'react-hot-toast'; // Import react-hot-toast
import { useUserContext } from '../../context/UserContext'; // Import useUserContext
import axiosInstance from '../../axiosInstance';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // For navigation after successful login
  const { setAccessToken, setRefreshToken, setUserInfo } = useUserContext(); // Use useUserContext

  const handleLogin = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.post<{ access_token: string; refresh_token: string; user: any }>('/login', {
        email,
        password,
      });

      const { access_token, refresh_token, user } = response.data;

      // Save tokens separately
       setAccessToken(access_token);
       setRefreshToken(refresh_token);
       setUserInfo(user);

      toast.success('تم تسجيل الدخول بنجاح!', {
        position: 'top-center',
      });
      navigate('/'); 
    } catch (error) {
      toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة', {
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">تسجيل الدخول</h2>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
          <input
            type="email"
            id="email"
            placeholder="أدخل بريدك الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full p-3 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">كلمة المرور</label>
          <input
            type="password"
            id="password"
            placeholder="أدخل كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full p-3 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-3 bg-blue-600 text-white rounded-md text-lg hover:bg-blue-700 focus:outline-none"
        >
          {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
