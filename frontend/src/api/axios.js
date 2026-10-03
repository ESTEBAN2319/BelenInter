import axios from 'axios';

const clienteAxios = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// Interceptor para enviar el Token JWT
clienteAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token_beleninter');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default clienteAxios;