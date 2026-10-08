

import axios from 'axios';
import { encryptData, decryptData } from './encryption';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const defaultApiUrl = isLocalhost ? '/api' : 'https://api.shrishreenathjiglobaltraders.com/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

console.log('[API] Initializing with base URL:', API_BASE_URL);

// ═══════════════════════════════════════════════════════════════════════════
// CREATE AXIOS INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,  // 30 second timeout
    withCredentials: true, // Send HttpOnly cookies automatically
    headers: {
        'Content-Type': 'application/json'
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR
// Automatically attach token to every request
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined' && !sessionStorage.getItem('client_public_ip')) {
    fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(d => { if (d && d.ip) sessionStorage.setItem('client_public_ip', d.ip); })
        .catch(() => {});
}

api.interceptors.request.use(
    (config) => {
        const clientIp = sessionStorage.getItem('client_public_ip');

        console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, {
            timestamp: new Date().toISOString()
        });

        if (clientIp) {
            config.headers['X-Client-IP'] = clientIp;
        }

        // Encrypt request payload
        if (config.data && !(config.data instanceof FormData) && !config.data._encrypted) {
            const encryptedPayload = encryptData(config.data);
            if (encryptedPayload) {
                config.data = { _encrypted: true, payload: encryptedPayload };
            }
        }

        return config;
    },
    (error) => {
        console.error('[API] Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR
// Handle errors, token expiration, and unauthorized access
// ═══════════════════════════════════════════════════════════════════════════

api.interceptors.response.use(
    (response) => {
        // Request successful
        console.log(`[API] ✅ ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
        
        // Decrypt response if encrypted
        if (response.data && response.data._encrypted) {
            const decrypted = decryptData(response.data.payload);
            if (decrypted) {
                response.data = decrypted;
            }
        }
        
        return response;
    },
    (error) => {
        const { response, config } = error;
        const serverMsg = response?.data?.message;

        console.error('[API] ❌ Error:', {
            status: response?.status,
            method: config?.method?.toUpperCase(),
            url: config?.url,
            message: serverMsg || error.message
        });

        // Helper: build a clean error object so .message always works in catch blocks
        const makeError = (overrides) => {
            const err = new Error(overrides.message || serverMsg || error.message);
            err.status = response?.status;
            err.response = response;
            Object.assign(err, overrides);
            return err;
        };

        // ─────────────────────────────────────────────────────────────────────
        // ERROR 401: Unauthorized (Token expired or invalid)
        // ─────────────────────────────────────────────────────────────────────

        if (response?.status === 401) {
            // Skip logout redirect for Kite API errors (Kite token != JWT token)
            const url = config?.url || '';
            if (url.includes('/kite/')) {
                console.log('[API] ⚠️ 401 from Kite API — Kite not connected (not a JWT issue)');
                return Promise.reject(makeError({
                    isKiteError: true,
                    message: response?.data?.error || 'Kite not connected'
                }));
            }

            console.log('[API] 🔴 401 Unauthorized - Token expired or invalid');

            // Clear stored data
            localStorage.removeItem('traders_user');
            localStorage.removeItem('traders_session_valid');
            sessionStorage.clear();

            const errorMessage = serverMsg || 'Session expired. Please login again.';

            // Redirect to login
            if (window.location.pathname !== '/login') {
                console.log('[API] 🔄 Redirecting to /login');
                window.location.href = '/login';
            }

            return Promise.reject(makeError({ isAuthError: true, message: errorMessage }));
        }

        // ─────────────────────────────────────────────────────────────────────
        // ERROR 403: Forbidden (Permission denied)
        // ─────────────────────────────────────────────────────────────────────

        if (response?.status === 403) {
            console.log('[API] 🔴 403 Forbidden:', serverMsg);
            return Promise.reject(makeError({
                isForbidden: true,
                message: serverMsg || 'You do not have permission to access this resource'
            }));
        }

        // ─────────────────────────────────────────────────────────────────────
        // ERROR 404: Not Found
        // ─────────────────────────────────────────────────────────────────────

        if (response?.status === 404) {
            console.log('[API] 🔴 404 Not Found');
            return Promise.reject(makeError({
                isNotFound: true,
                message: serverMsg || 'Resource not found'
            }));
        }

        // ─────────────────────────────────────────────────────────────────────
        // ERROR 500: Server Error
        // ─────────────────────────────────────────────────────────────────────

        if (response?.status >= 500) {
            console.log('[API] 🔴 Server Error');
            return Promise.reject(makeError({
                isServerError: true,
                message: serverMsg || 'Server error. Please try again later.'
            }));
        }

        // ─────────────────────────────────────────────────────────────────────
        // ERROR 4xx: Client Error (validation, bad request, etc)
        // ─────────────────────────────────────────────────────────────────────

        if (response?.status >= 400) {
            console.log('[API] 🔴 Client Error:', serverMsg);
            return Promise.reject(makeError({
                isClientError: true,
                message: serverMsg || 'Invalid request'
            }));
        }

        // ─────────────────────────────────────────────────────────────────────
        // Network Error (no internet, timeout, etc)
        // ─────────────────────────────────────────────────────────────────────

        if (!response) {
            console.log('[API] 🔴 Network Error:', error.message);
            return Promise.reject(makeError({
                isNetworkError: true,
                message: error.message || 'Network error. Check your connection.'
            }));
        }

        // Unknown error
        return Promise.reject(makeError({ message: error.message }));
    }
);

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Set token and save to localStorage
 * @param {string} token - JWT token (no longer used with HttpOnly cookies)
 */
export const setToken = (token) => {
    // HttpOnly cookie is set by the backend
    console.log('[API] ✅ Backend handles token via HttpOnly cookie');
};

/**
 * Get token from localStorage
 * @returns {string|null}
 */
export const getToken = () => {
    // Cannot access HttpOnly cookie from JS
    return null;
};

/**
 * Clear token and logout
 */
export const clearToken = () => {
    // Call backend to clear the cookie (fire and forget)
    api.post('/auth/logout').catch(() => {});

    localStorage.removeItem('traders_user');
    localStorage.removeItem('traders_session_valid');
    sessionStorage.clear();
    console.log('[API] ✅ User state cleared - Logged out');
};

/**
 * Check if user is authenticated
 * @returns {boolean} true if user exists in storage
 */
export const isAuthenticated = () => {
    return !!localStorage.getItem('traders_user');
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default api;
