import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Direct URL since we are exposing it on host
    // In production with docker networking, this might differ if SSR, but for loose coupling client-side rendering localhost is fine if port is mapped.
});

export default api;
