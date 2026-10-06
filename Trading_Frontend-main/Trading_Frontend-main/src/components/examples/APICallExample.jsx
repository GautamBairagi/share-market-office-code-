/**
 * API Call Example
 *
 * Shows how to:
 * - Make API calls WITHOUT manually writing Authorization header
 * - The token is automatically attached by the axios interceptor
 * - Handle success and error responses
 */

import React, { useState, useEffect } from 'react';
import api from '../../utils/api';  // Import the axios instance
import useAuth from '../../hooks/useAuth';

const APICallExample = () => {
    const { user, logout } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ═══════════════════════════════════════════════════════════════════════
    // EXAMPLE 1: GET USER PROFILE
    // ═══════════════════════════════════════════════════════════════════════

    const getUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('[APICallExample] 🔍 Fetching user profile...');

            // ✅ NO MANUAL TOKEN ATTACHMENT NEEDED!
            // The interceptor automatically adds:
            // headers: { Authorization: 'Bearer <token>' }
            const response = await api.get('/api/auth/me');

            console.log('[APICallExample] ✅ Profile fetched:', response.data);
            setData(response.data);

        } catch (err) {
            console.error('[APICallExample] ❌ Error:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // EXAMPLE 2: GET DASHBOARD DATA
    // ═══════════════════════════════════════════════════════════════════════

    const getDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('[APICallExample] 📊 Fetching dashboard...');

            // ✅ AUTOMATIC TOKEN ATTACHMENT!
            const response = await api.get('/api/dashboard');

            console.log('[APICallExample] ✅ Dashboard data:', response.data);
            setData(response.data);

        } catch (err) {
            console.error('[APICallExample] ❌ Error:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // EXAMPLE 3: POST REQUEST (AI COMMAND)
    // ═══════════════════════════════════════════════════════════════════════

    const executeAICommand = async (text) => {
        try {
            setLoading(true);
            setError(null);

            console.log('[APICallExample] 🤖 Executing AI command:', text);

            // ✅ POST WITH AUTOMATIC TOKEN!
            const response = await api.post('/api/ai/ai-command', {
                text: text
            });

            console.log('[APICallExample] ✅ Command executed:', response.data);
            setData(response.data);

        } catch (err) {
            console.error('[APICallExample] ❌ Error:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // EXAMPLE 4: PUT REQUEST (UPDATE USER)
    // ═══════════════════════════════════════════════════════════════════════

    const updateUserProfile = async (updates) => {
        try {
            setLoading(true);
            setError(null);

            console.log('[APICallExample] 📝 Updating profile:', updates);

            // ✅ PUT WITH AUTOMATIC TOKEN!
            const response = await api.put('/api/auth/profile', updates);

            console.log('[APICallExample] ✅ Profile updated:', response.data);
            setData(response.data);

        } catch (err) {
            console.error('[APICallExample] ❌ Error:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // EXAMPLE 5: DELETE REQUEST
    // ═══════════════════════════════════════════════════════════════════════

    const deleteItem = async (itemId) => {
        try {
            setLoading(true);
            setError(null);

            console.log('[APICallExample] 🗑️  Deleting item:', itemId);

            // ✅ DELETE WITH AUTOMATIC TOKEN!
            const response = await api.delete(`/api/items/${itemId}`);

            console.log('[APICallExample] ✅ Item deleted:', response.data);
            setData(response.data);

        } catch (err) {
            console.error('[APICallExample] ❌ Error:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <div className="api-example-container">
            <h2>API Call Examples</h2>

            {/* USER INFO */}
            <div className="user-info">
                <p>👤 Logged in as: <strong>{user?.username}</strong></p>
                <p>📧 Email: <strong>{user?.email}</strong></p>
                <button onClick={logout} className="btn btn-logout">
                    🚪 Logout
                </button>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="alert alert-error">
                    ❌ {error}
                </div>
            )}

            {/* BUTTONS */}
            <div className="button-group">
                <button
                    onClick={getUserProfile}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? '⏳ Loading...' : '👤 Get Profile'}
                </button>

                <button
                    onClick={getDashboardData}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? '⏳ Loading...' : '📊 Get Dashboard'}
                </button>

                <button
                    onClick={() => executeAICommand('ID 16 me 5000 add karo')}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? '⏳ Loading...' : '🤖 AI Command'}
                </button>

                <button
                    onClick={() => updateUserProfile({ full_name: 'New Name' })}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? '⏳ Loading...' : '📝 Update Profile'}
                </button>
            </div>

            {/* RESULT */}
            {data && (
                <div className="result">
                    <h3>✅ Result:</h3>
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
            )}

            {/* INFO BOX */}
            <div className="info-box">
                <h3>💡 Key Points:</h3>
                <ul>
                    <li>✅ Token is <strong>automatically attached</strong> to every request</li>
                    <li>✅ No manual Authorization header needed</li>
                    <li>✅ 401 errors trigger automatic logout</li>
                    <li>✅ Works with GET, POST, PUT, DELETE</li>
                    <li>✅ All requests use <code>api</code> instance from <code>utils/api.js</code></li>
                </ul>
            </div>

            {/* CODE EXAMPLES */}
            <div className="code-examples">
                <h3>📝 Code Examples:</h3>

                <h4>GET Request:</h4>
                <pre>
                    {`import api from '../../utils/api';

const response = await api.get('/api/auth/me');
console.log(response.data);  // No manual token needed!`}
                </pre>

                <h4>POST Request:</h4>
                <pre>
                    {`const response = await api.post('/api/ai/ai-command', {
  text: 'ID 16 me 5000 add karo'
});`}
                </pre>

                <h4>PUT Request:</h4>
                <pre>
                    {`const response = await api.put('/api/auth/profile', {
  full_name: 'New Name'
});`}
                </pre>

                <h4>ERROR HANDLING:</h4>
                <pre>
                    {`try {
  const response = await api.get('/api/protected-route');
} catch (error) {
  // 401 → Auto logout & redirect
  // 403 → Access denied
  // 404 → Not found
  // 500 → Server error
  console.error(error.message);
}`}
                </pre>
            </div>
        </div>
    );
};

export default APICallExample;
