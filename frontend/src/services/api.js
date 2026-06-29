import axios from 'axios';
const api = axios.create({
    baseURL: 'http://localhost:3333'
});
// Interceptor para injetar o token JWT em cada requisicao
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
export default api;
//# sourceMappingURL=api.js.map