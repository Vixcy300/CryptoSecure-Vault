// API Configuration for CryptoSecure Vault
// In production (Vercel), API routes are at /api/*
// Locally, you might run the backend separately or use Vercel dev

const isProduction = import.meta.env.PROD;

// Base URL for API calls
// When deployed on Vercel, the API functions are at the same origin
export const API_BASE_URL = isProduction ? 'https://cryptosecure-vault-backend.onrender.com/api' : 'https://cryptosecure-vault-backend.onrender.com/api';

// Helper function to get full API URL
export function getApiUrl(endpoint) {
    return `${API_BASE_URL}${endpoint}`;
}

export default API_BASE_URL;
