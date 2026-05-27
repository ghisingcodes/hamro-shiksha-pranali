import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Add token and schoolId to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const schoolId = localStorage.getItem('schoolId');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Use schoolId from localStorage or from user object
  const finalSchoolId = schoolId || user?.schoolId;
  if (finalSchoolId) {
    config.headers['X-School-Id'] = finalSchoolId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('schoolId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);