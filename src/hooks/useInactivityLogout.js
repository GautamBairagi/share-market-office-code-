import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * useInactivityLogout Hook
 *
 * Automatically logs out user after 15 minutes of inactivity
 * Resets timer on any user interaction (clicks, keyboard, mouse movement)
 *
 * Usage: Add to App or top-level component
 * const { logout } = useAuth();
 * useInactivityLogout(logout, 10 * 60 * 1000); // 10 minutes in milliseconds
 */
export const useInactivityLogout = (inactivityTime = 10 * 60 * 1000) => {
    const { logout, user } = useAuth();
    const timeoutRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // Function to reset the inactivity timer
    const resetTimer = () => {
        lastActivityRef.current = Date.now();

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout - logout after inactivityTime
        timeoutRef.current = setTimeout(() => {
            console.log('[useInactivityLogout] ⏱️  Inactivity timeout reached! Logging out...');
            logout();
        }, inactivityTime);

        console.log(`[useInactivityLogout] ⏰ Timer reset. Will logout in ${inactivityTime / 1000 / 60} minutes`);
    };

    useEffect(() => {
        // Only set up listener if user is logged in
        if (!user) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            return;
        }

        // Activity events to track
        const events = ['mousedown', 'keydown', 'click', 'scroll', 'touchstart'];

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Initialize timer on mount
        resetTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [user, inactivityTime, logout]);

    return {
        resetTimer
    };
};

export default useInactivityLogout;
