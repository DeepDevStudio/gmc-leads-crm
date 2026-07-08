import axios from 'axios';

// ✅ CHANGE THIS - Use Cloudflare tunnel URL
const API_URL = "http://31.97.62.121:5000/api";

const api = axios.create({
    baseURL: API_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    config => {
        console.log('📤 API Request:', config.method.toUpperCase(), config.url);
        return config;
    },
    error => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    response => {
        console.log('📥 API Response:', response.status, response.config.url);
        return response;
    },
    error => {
        console.error('❌ Response Error:', error.message);
        return Promise.reject(error);
    }
);

export default api;
