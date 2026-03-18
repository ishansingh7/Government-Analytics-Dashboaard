import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Update if backend runs on different port
});

// Add a request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth failures globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    // If token is invalid/expired or user is missing, force logout to avoid repeated failures
    if (status === 401 && (message === 'Not authorized, no token' || message === 'Not authorized, token failed' || message === 'Not authorized, user not found')) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
