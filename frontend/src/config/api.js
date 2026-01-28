// API Configuration
// Uses environment variable in production, falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cryptosecure-vault-backend.onrender.com/api';

export default API_BASE_URL;
