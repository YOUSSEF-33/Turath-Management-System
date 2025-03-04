import axios from 'axios';

const baseURL = 'https://knownstate.knownlege.com/api';
const refreshURL = `${baseURL}/refresh`;

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config:any) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error:any) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response:any) => {
    return response;
  },
  async (error:any) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(refreshURL, { token: refreshToken });
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          return axiosInstance(originalRequest);
        } catch (err) {
          console.error('Refresh token expired or invalid', err);
          // Handle token refresh failure (e.g., redirect to login)
          window.location.href = '/login'; // Redirect to login page
        }
      } else {
        // No refresh token available, redirect to login
        window.location.href = '/login'; // Redirect to login page
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
