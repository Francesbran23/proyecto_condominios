import axios from 'axios';

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || '').replace(/\/+$/, ''),
});

api.interceptors.request.use(config => {
  const token = window.sessionStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && window.sessionStorage.getItem('authToken')) {
      window.sessionStorage.removeItem('authToken');
      window.location.assign('/');
    }
    return Promise.reject(error);
  }
);

export default api;
