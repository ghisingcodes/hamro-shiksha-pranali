import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Add token and schoolId to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const schoolId = localStorage.getItem('schoolId');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (schoolId) {
    config.headers['X-School-Id'] = schoolId;
  }
  return config;
});

// Handle 401 responses
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

// API endpoint helpers
export const academicSeasonApi = {
  getAll: () => api.get('/academic-seasons'),
  create: (data: any) => api.post('/academic-seasons', data),
  update: (id: string, data: any) => api.put(`/academic-seasons/${id}`, data),
  delete: (id: string) => api.delete(`/academic-seasons/${id}`),
  duplicate: (id: string, copyClasses: boolean) => api.post(`/academic-seasons/duplicate/${id}`, { copyClasses }),
};

export const classApi = {
  getAll: () => api.get('/classes'),
  create: (data: any) => api.post('/classes', data),
  update: (id: string, data: any) => api.put(`/classes/${id}`, data),
  delete: (id: string) => api.delete(`/classes/${id}`),
};

export const classSectionApi = {
  getAll: (seasonId?: string, classId?: string) => api.get(`/class-sections?seasonId=${seasonId}&classId=${classId}`),
  create: (data: any) => api.post('/class-sections', data),
  addSection: (id: string, name: string) => api.post(`/class-sections/${id}/sections`, { name }),
  deleteSection: (id: string, name: string) => api.delete(`/class-sections/${id}/sections/${name}`),
  updateRoutine: (id: string, data: any) => api.put(`/class-sections/${id}/routine`, data),
};

export const subjectApi = {
  getAll: (classId?: string, seasonId?: string) => api.get(`/subjects?classId=${classId}&seasonId=${seasonId}`),
  create: (data: any) => api.post('/subjects', data),
  update: (id: string, data: any) => api.put(`/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/subjects/${id}`),
};

export const studentApi = {
  getAll: () => api.get('/students'),
  getOne: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  getParentChildren: (phone: string) => api.get(`/students/parent-children?phone=${phone}`),
};

export const academicRecordApi = {
  getAll: (seasonId?: string, classId?: string, section?: string) => 
    api.get(`/academic-records?seasonId=${seasonId}&classId=${classId}&section=${section}`),
  create: (data: any) => api.post('/academic-records', data),
  update: (id: string, data: any) => api.put(`/academic-records/${id}`, data),
  delete: (id: string) => api.delete(`/academic-records/${id}`),
  promote: (data: any) => api.post('/academic-records/promote', data),
};

export const enrollmentRecordApi = {
  getAll: (studentId?: string, seasonId?: string) => 
    api.get(`/enrollment-records?studentId=${studentId}&seasonId=${seasonId}`),
  create: (data: any) => api.post('/enrollment-records', data),
  update: (id: string, data: any) => api.put(`/enrollment-records/${id}`, data),
  delete: (id: string) => api.delete(`/enrollment-records/${id}`),
};

export const teacherApi = {
  getAll: (schoolId?: string, seasonId?: string) => 
    api.get(`/teachers?schoolId=${schoolId}&seasonId=${seasonId}`),
  getOne: (id: string) => api.get(`/teachers/${id}`),
  create: (data: any) => api.post('/teachers', data),
  update: (id: string, data: any) => api.put(`/teachers/${id}`, data),
  delete: (id: string) => api.delete(`/teachers/${id}`),
  renewContract: (id: string, data: any) => api.post(`/teachers/${id}/renew-contract`, data),
  processLeave: (id: string, data: any) => api.post(`/teachers/${id}/leave`, data),
  createUserAccount: (id: string, data: any) => api.post(`/teachers/${id}/create-user`, data),
};

export const attendanceApi = {
  getAll: (filter: any) => api.get('/attendance', { params: filter }),
  createBulk: (data: any) => api.post('/attendance/bulk', data),
  update: (id: string, data: any) => api.put(`/attendance/${id}`, data),
  delete: (id: string) => api.delete(`/attendance/${id}`),
};

export const studentActivityApi = {
  getAll: (filter: any) => api.get('/student-activities', { params: filter }),
  createBulk: (data: any) => api.post('/student-activities/bulk', data),
  update: (id: string, data: any) => api.put(`/student-activities/${id}`, data),
  delete: (id: string) => api.delete(`/student-activities/${id}`),
};

export const userApi = {
  getAll: (role?: string) => api.get(`/users${role ? `?role=${role}` : ''}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  toggleStatus: (id: string) => api.put(`/users/${id}/toggle-status`, {}),
  changePassword: (data: any) => api.post('/users/change-password', data),
};

export const staffApi = {
  getAll: () => api.get('/staff'),
  create: (data: any) => api.post('/staff', data),
  update: (id: string, data: any) => api.put(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
};

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  schoolSignup: (data: any) => api.post('/auth/school-signup', data),
};