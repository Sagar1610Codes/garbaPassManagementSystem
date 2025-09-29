import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add cache control headers
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data,
      params: config.params
    });
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config?.method?.toUpperCase()} ${response.config?.url}`, {
      status: response.status,
      data: response.data
    });
    
    // Handle paginated responses (from advancedResults middleware)
    if (response.data && response.data.data !== undefined) {
      return response.data;
    }
    
    return response.data || response;
  },
  (error) => {
    const errorResponse = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
      config: error.config
    };
    
    console.error('API Error:', errorResponse);
    
    // Handle specific status codes
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      // You might want to redirect to login here
      // window.location.href = '/login';
    }
    
    return Promise.reject(errorResponse);
  }
);

// Auth API
// Helper function to create a custom config for file uploads
const createFormDataConfig = (data) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
};

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (formData, token) => {
    // Create a new instance of axios for this request to avoid header conflicts
    const instance = axios.create({
      baseURL: API_URL,
      withCredentials: true,
    });
    
    // Add auth token if exists
    const authToken = localStorage.getItem('token');
    if (authToken) {
      instance.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    }
    
    return instance.post(`/auth/register/${token}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getMe: () => api.get('/auth/me'),
  logout: () => api.get('/auth/logout'),
  verifyInvitation: (token) => api.get(`/auth/verify-invite/${token}`),
  sendInvitation: (email) => api.post('/auth/invite', { email }),
  getPass: (email) => api.get(`/pass/${email}`)
};

export default api;
