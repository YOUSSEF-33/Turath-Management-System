import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // If you're using react-router for navigation
import toast from 'react-hot-toast'; // Import react-hot-toast
import { useUserContext } from '../../context/UserContext'; // Import useUserContext
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import axiosInstance from '../../axiosInstance';

// Define proper types for the API response
interface UserRole {
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
  role: UserRole;
}

interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate(); // For navigation after successful login
  const { setAccessToken, setRefreshToken, setUserInfo } = useUserContext(); // Use useUserContext
  const { login } = useAuth(); // Use useAuth for login

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleLogin = async () => {
    let valid = true;

    if (!validateEmail(email)) {
      setEmailError('يرجى إدخال بريد إلكتروني صالح');
      valid = false;
    } else {
      setEmailError('');
    }

    if (password.length < 6) {
      setPasswordError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!valid) return;

    setLoading(true);

    try {
      const response = await axiosInstance.post<LoginResponse>('/login', {
        email,
        password,
      });

      const { access_token, refresh_token, user } = response.data;

      // Save tokens and user info
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      setUserInfo(user);
      
      // Update Auth context with access token
      login(access_token);

      toast.success('تم تسجيل الدخول بنجاح!', {
        position: 'top-center',
      });
      navigate('/reservations'); 
    } catch (err) {
      toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      console.error('Login error:', err);
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
          {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
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
          {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-3 bg-blue-600 text-white rounded-md text-lg hover:bg-blue-700 focus:outline-none flex justify-center items-center"
        >
          {loading ? <span className="loader"></span> : 'تسجيل الدخول'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
