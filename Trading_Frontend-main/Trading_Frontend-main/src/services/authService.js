/**
 * Authentication Service
 *
 * Handles:
 * - Login with email/password
 * - Token storage and retrieval
 * - Logout and session cleanup
 * - User data management
 * - Protected routes
 */

import api, { setToken, clearToken, getToken } from '../utils/api';

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Login user with email and password
 *
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} - User data and token
 *
 * Example:
 * const user = await login('admin@example.com', 'password123');
 * console.log(user);
 * // { id: 1, username: 'admin', email: 'admin@example.com', token: 'eyJ...', role: 'SUPERADMIN' }
 */
export const login = async (email, password) => {
    try {
        console.log('[Auth] 🔐 Attempting login for:', email);

        // Call backend login endpoint
        const response = await api.post('/auth/login', {
            email,
            password
        });

        const { token, user } = response.data;

        console.log('[Auth] ✅ Login successful!');
        console.log('[Auth] User:', user);

        // Save token
        setToken(token);
        
        // Save user data for AuthContext
        localStorage.setItem('traders_user', JSON.stringify(user));
        localStorage.setItem('traders_session_valid', 'true');
        console.log('[Auth] ✅ User data saved');

        return { token, user };

    } catch (error) {
        console.error('[Auth] ❌ Login failed:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// LOGOUT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Logout user and clear session
 *
 * Example:
 * await logout();
 * // User is logged out, redirected to /login
 */
export const logout = async () => {
    try {
        console.log('[Auth] 🚪 Logging out user...');

        // Optional: Call backend logout endpoint (for server-side cleanup)
        try {
            await api.post('/auth/logout');
            console.log('[Auth] ✅ Backend logout called');
        } catch (err) {
            console.warn('[Auth] ⚠️  Backend logout failed (continuing anyway):', err.message);
        }

        // Clear all data
        clearToken();
        console.log('[Auth] ✅ Logout complete');

        // Redirect to login
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }

    } catch (error) {
        console.error('[Auth] ❌ Logout error:', error);
        // Force logout anyway
        clearToken();
        window.location.href = '/login';
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET CURRENT USER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get currently logged-in user data
 *
 * @returns {object|null} - User data or null if not logged in
 *
 * Example:
 * const user = getCurrentUser();
 * console.log(user.username);  // 'admin'
 */
export const getCurrentUser = () => {
    try {
        const userJson = localStorage.getItem('traders_user');
        if (!userJson) {
            console.log('[Auth] No user data found');
            return null;
        }

        const user = JSON.parse(userJson);
        console.log('[Auth] ✅ User retrieved:', user.username);
        return user;

    } catch (error) {
        console.error('[Auth] ❌ Error parsing user data:', error);
        return null;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET USER ROLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get current user's role
 *
 * @returns {string|null} - User role ('SUPERADMIN', 'ADMIN', 'BROKER', etc)
 *
 * Example:
 * const role = getUserRole();
 * if (role === 'ADMIN') { ... }
 */
export const getUserRole = () => {
    const user = getCurrentUser();
    return user?.role || null;
};

// ═══════════════════════════════════════════════════════════════════════════
// CHECK IF AUTHENTICATED
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if user is authenticated
 *
 * @returns {boolean} - true if user has valid token
 *
 * Example:
 * if (isLoggedIn()) {
 *   // Show dashboard
 * } else {
 *   // Show login page
 * }
 */
export const isLoggedIn = () => {
    const token = getToken();
    const user = getCurrentUser();

    const result = !!(token && user);
    console.log('[Auth] Is logged in?', result ? '✅ Yes' : '❌ No');
    return result;
};

// ═══════════════════════════════════════════════════════════════════════════
// REFRESH USER DATA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Refresh user data from server
 * Useful for getting latest user info after updates
 *
 * @returns {Promise<object>} - Updated user data
 *
 * Example:
 * const updatedUser = await refreshUserData();
 */
export const refreshUserData = async () => {
    try {
        console.log('[Auth] 🔄 Refreshing user data...');

        const response = await api.get('/auth/me');
        const user = response.data;

        // Update stored user data
        localStorage.setItem('traders_user', JSON.stringify(user));
        localStorage.setItem('traders_session_valid', 'true');
        console.log('[Auth] ✅ User data refreshed');

        return user;

    } catch (error) {
        console.error('[Auth] ❌ Failed to refresh user data:', error);
        // If refresh fails, logout user
        await logout();
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE PROFILE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update user profile
 *
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} - Updated user data
 *
 * Example:
 * const updatedUser = await updateProfile({ full_name: 'New Name' });
 */
export const updateProfile = async (updates) => {
    try {
        console.log('[Auth] 📝 Updating profile:', updates);

        const response = await api.put('/auth/profile', updates);
        const user = response.data;

        // Update stored user data
        localStorage.setItem('traders_user', JSON.stringify(user));
        localStorage.setItem('traders_session_valid', 'true');
        console.log('[Auth] ✅ Profile updated');

        return user;

    } catch (error) {
        console.error('[Auth] ❌ Failed to update profile:', error);
        throw new Error(error.response?.data?.message || 'Profile update failed');
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Change user password
 *
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} - Success message
 *
 * Example:
 * await changePassword('old123', 'new456');
 */
export const changePassword = async (oldPassword, newPassword) => {
    try {
        console.log('[Auth] 🔒 Changing password...');

        const response = await api.post('/auth/change-password', {
            oldPassword,
            newPassword
        });

        console.log('[Auth] ✅ Password changed successfully');
        return response.data;

    } catch (error) {
        console.error('[Auth] ❌ Failed to change password:', error);
        throw new Error(error.response?.data?.message || 'Password change failed');
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// VERIFY TOKEN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verify if stored token is still valid
 *
 * @returns {Promise<boolean>} - true if token is valid
 *
 * Example:
 * const isValid = await verifyToken();
 * if (!isValid) { redirect to login }
 */
export const verifyToken = async () => {
    try {
        console.log('[Auth] 🔍 Verifying token...');

        const token = getToken();
        if (!token) {
            console.log('[Auth] ❌ No token found');
            return false;
        }

        // Call backend to verify token
        await api.get('/auth/verify');
        console.log('[Auth] ✅ Token is valid');
        return true;

    } catch (error) {
        console.log('[Auth] ❌ Token verification failed');
        // Token invalid, logout
        await logout();
        return false;
    }
};
