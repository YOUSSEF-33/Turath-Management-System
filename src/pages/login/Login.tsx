import  { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // If you're using react-router for navigation
import toast from 'react-hot-toast'; // Import react-hot-toast

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // For navigation after successful login

  const handleLogin = () => {
    setLoading(true);

    // Simulate a login process (replace with actual API call later)
    setTimeout(() => {
      if (email === 'test@example.com' && password === 'password123') {
        // Successful login
        toast.success('تم تسجيل الدخول بنجاح!', {
          position: 'top-center',
        });
        navigate('/dashboard'); // Navigate to Dashboard page
      } else {
        // Failed login
        toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة', {
          position: 'top-center',
        });
      }
      setLoading(false);
    }, 1000);
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
