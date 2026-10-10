/**
 * useAuth Hook
 *
 * Custom React hook for authentication management
 * Use this in any component to access auth functions and user data
 *
 * Example:
 * const { user,  logout, isLoggedIn } = useAuth();
 */

import { useState, useCallback, useEffect } from 'react';
import {
    login as loginFn,
    logout as logoutFn,
    getCurrentUser,
    isLoggedIn as isLoggedInFn,
    refreshUserData,
    updateProfile,
    changePassword
} from '../services/authService';

/**
 * useAuth Hook
 *
 * @returns {object} Auth state and functions
 *   - user: Current user object
 *   - token: JWT token
 *   - isLoggedIn: Boolean indicating login status
 *   - isLoading: Boolean indicating loading state
 *   - error: Error message if any
 *   - login: Function to login user
 *   - logout: Function to logout user
 *   - refreshUser: Function to refresh user data
 *   - updateUser: Function to update user profile
 *   - changePass: Function to change password
 *   - userRole: Current user's role
 *   - clearError: Function to clear error message
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [token, setTokenState] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // ───────────────────────────────────────────────────────────────────────
    // INITIALIZE - Check if user is already logged 
    // ───────────────────────────────────────────────────────────────────────

    useEffect(() => {
        console.log('[useAuth] Initializing...');

        const currentUser = getCurrentUser();
        const loggedIn = isLoggedInFn();

        if (loggedIn && currentUser) {
            setUser(currentUser);
            setTokenState(localStorage.getItem('token'));
            setIsLoggedIn(true);
            console.log('[useAuth] ✅ User already logged in:', currentUser.username);
        } else {
            console.log('[useAuth] ⚠️  No active session');
        }
    }, []);

    // ───────────────────────────────────────────────────────────────────────
    // LOGIN FUNCTION
    // ───────────────────────────────────────────────────────────────────────

    const login = useCallback(async (email, password) => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('[useAuth] 🔐 Logging in:', email);
            const { token: newToken, user: newUser } = await loginFn(email, password);

            setUser(newUser);
            setTokenState(newToken);
            setIsLoggedIn(true);
            setError(null);

            console.log('[useAuth] ✅ Login successful!');
            return { token: newToken, user: newUser };

        } catch (err) {
            const errorMessage = err.message || 'Login failed';
            setError(errorMessage);
            console.error('[useAuth] ❌ Login error:', errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ───────────────────────────────────────────────────────────────────────
    // LOGOUT FUNCTION
    // ───────────────────────────────────────────────────────────────────────

    const logout = useCallback(async () => {
        try {
            setIsLoading(true);
            console.log('[useAuth] 🚪 Logging out...');

            await logoutFn();

            setUser(null);
            setTokenState(null);
            setIsLoggedIn(false);
            setError(null);

            console.log('[useAuth] ✅ Logout successful!');
        } catch (err) {
            console.error('[useAuth] ❌ Logout error:', err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ───────────────────────────────────────────────────────────────────────
    // REFRESH USER DATA
    // ───────────────────────────────────────────────────────────────────────

    const refreshUser = useCallback(async () => {
        try {
            setIsLoading(true);
            console.log('[useAuth] 🔄 Refreshing user data...');

            const updatedUser = await refreshUserData();
            setUser(updatedUser);

            console.log('[useAuth] ✅ User data refreshed');
            return updatedUser;

        } catch (err) {
            console.error('[useAuth] ❌ Refresh error:', err.message);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ───────────────────────────────────────────────────────────────────────
    // UPDATE USER PROFILE
    // ───────────────────────────────────────────────────────────────────────

    const updateUser = useCallback(async (updates) => {
        try {
            setIsLoading(true);
            console.log('[useAuth] 📝 Updating profile...');

            const updatedUser = await updateProfile(updates);
            setUser(updatedUser);

            console.log('[useAuth] ✅ Profile updated');
            return updatedUser;

        } catch (err) {
            console.error('[useAuth] ❌ Update error:', err.message);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ───────────────────────────────────────────────────────────────────────
    // CHANGE PASSWORD
    // ───────────────────────────────────────────────────────────────────────

    const changePass = useCallback(async (oldPassword, newPassword) => {
        try {
            setIsLoading(true);
            console.log('[useAuth] 🔒 Changing password...');

            const result = await changePassword(oldPassword, newPassword);

            console.log('[useAuth] ✅ Password changed');
            return result;

        } catch (err) {
            console.error('[useAuth] ❌ Password change error:', err.message);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ───────────────────────────────────────────────────────────────────────
    // CLEAR ERROR
    // ───────────────────────────────────────────────────────────────────────

    const clearError = useCallback(() => {
        setError(null);
        console.log('[useAuth] Cleared error');
    }, []);

    // ───────────────────────────────────────────────────────────────────────
    // RETURN HOOK VALUES
    // ───────────────────────────────────────────────────────────────────────

    return {
        // State
        user,
        token,
        isLoggedIn,
        isLoading,
        error,

        // Functions
        login,
        logout,
        refreshUser,
        updateUser,
        changePass,
        clearError,

        // Helper
        userRole: user?.role || null,
        userId: user?.id || null,
        username: user?.username || null
    };
};

export default useAuth;
