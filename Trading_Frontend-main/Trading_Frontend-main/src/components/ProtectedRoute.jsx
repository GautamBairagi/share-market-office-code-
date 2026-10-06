/**
 * Protected Route Component
 *
 * Ensures only authenticated users can access certain routes
 * If not logged in, redirects to login page
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * ProtectedRoute Component
 *
 * @param {object} props
 * @param {React.Component} props.component - Component to render if authenticated
 * @param {array} props.requiredRoles - Optional: array of allowed roles
 *
 * Example Usage:
 * <Routes>
 *   <Route path="/login" element={<LoginExample />} />
 *   <Route path="/dashboard" element={
 *     <ProtectedRoute component={Dashboard} />
 *   } />
 *   <Route path="/admin" element={
 *     <ProtectedRoute
 *       component={AdminPanel}
 *       requiredRoles={['ADMIN', 'SUPERADMIN']}
 *     />
 *   } />
 * </Routes>
 */
const ProtectedRoute = ({ component: Component, requiredRoles = null }) => {
    const { isLoggedIn, userRole, isLoading } = useAuth();

    console.log('[ProtectedRoute] Checking access...', {
        isLoggedIn,
        userRole,
        requiredRoles
    });

    // Still loading user data
    if (isLoading) {
        return (
            <div className="loading-container">
                <p>⏳ Loading...</p>
            </div>
        );
    }

    // User not logged in - redirect to login
    if (!isLoggedIn) {
        console.log('[ProtectedRoute] ❌ Not authenticated - Redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    // Check if user has required role
    if (requiredRoles && !requiredRoles.includes(userRole)) {
        console.log('[ProtectedRoute] ❌ User role', userRole, 'not in allowed roles:', requiredRoles);
        return (
            <div className="access-denied-container">
                <h2>❌ Access Denied</h2>
                <p>You do not have permission to access this page.</p>
                <p>Required role: {requiredRoles.join(', ')}</p>
                <p>Your role: {userRole}</p>
            </div>
        );
    }

    // User is authenticated and has required role
    console.log('[ProtectedRoute] ✅ Access granted');
    return <Component />;
};

export default ProtectedRoute;
