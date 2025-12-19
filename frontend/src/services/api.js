import axios from 'axios';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  registerProfessional: async (professionalData) => {
    const response = await api.post('/auth/professional/register', professionalData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

// Admin services
export const adminService = {
  getPendingProfessionals: async () => {
    const response = await api.get('/admin/professionals/pending');
    return response.data;
  },

  getAllProfessionals: async () => {
    const response = await api.get('/admin/professionals');
    return response.data;
  },

  approveProfessional: async (id) => {
    const response = await api.put(`/admin/professionals/${id}/approve`);
    return response.data;
  },

  rejectProfessional: async (id, reason) => {
    const response = await api.put(`/admin/professionals/${id}/reject`, { reason });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  }
};

// User services
export const userService = {
  getProfessionals: async (filters = {}) => {
    const response = await api.get('/user/professionals', { params: filters });
    return response.data;
  },

  getProfessionalById: async (id) => {
    const response = await api.get(`/user/professionals/${id}`);
    return response.data;
  }
};

export default api;
