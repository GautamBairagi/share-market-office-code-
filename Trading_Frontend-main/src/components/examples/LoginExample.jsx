/**
 * Login Component Example
 *
 * Shows how to:
 * - Use useAuth hook
 * - Handle login with email/password
 * - Store token automatically
 * - Handle errors
 * - Redirect on success
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const LoginExample = () => {
    const navigate = useNavigate();
    const { login, isLoading, error, clearError } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // ───────────────────────────────────────────────────────────────────────
    // HANDLE FORM INPUT CHANGE
    // ───────────────────────────────────────────────────────────────────────

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        clearError();  // Clear error when user types
    };

    // ───────────────────────────────────────────────────────────────────────
    // HANDLE LOGIN SUBMIT
    // ───────────────────────────────────────────────────────────────────────

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('[LoginExample] Form submitted:', formData.email);

        try {
            // Call login function
            // This automatically:
            // 1. Sends request to /api/auth/login
            // 2. Gets token from response
            // 3. Stores token in localStorage
            // 4. Stores user data
            const { user } = await login(formData.email, formData.password);

            console.log('[LoginExample] ✅ Login successful! User:', user.username);

            // Token is now automatically attached to all future requests!
            // Navigate to dashboard
            navigate('/dashboard');

        } catch (err) {
            console.error('[LoginExample] ❌ Login failed:', err.message);
            // Error is already stored in state and displayed below
        }
    };

    // ───────────────────────────────────────────────────────────────────────
    // RENDER
    // ───────────────────────────────────────────────────────────────────────

    return (
        <div className="login-container">
            <h2>Login</h2>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="alert alert-error">
                    ❌ {error}
                </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit} className="login-form">
                {/* EMAIL INPUT */}
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="admin@example.com"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* PASSWORD INPUT */}
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* SUBMIT BUTTON */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                >
                    {isLoading ? '⏳ Logging in...' : '🔐 Login'}
                </button>
            </form>

            {/* INFO */}
            <p className="info">
                ℹ️ After login:
                <br />✅ Token saved to localStorage
                <br />✅ Token automatically attached to all API requests
                <br />✅ No manual Authorization header needed
            </p>
        </div>
    );
};

export default LoginExample;
