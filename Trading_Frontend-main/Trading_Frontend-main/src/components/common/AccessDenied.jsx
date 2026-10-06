import React from 'react';
import { ShieldX } from 'lucide-react';

/**
 * AccessDenied - Shows when a user tries to access a restricted page
 */
const AccessDenied = ({ onGoBack }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#1a2035] text-center px-4">
            <div className="bg-[#1f283e] rounded-xl p-10 border border-white/10 shadow-2xl max-w-md w-full">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                    <ShieldX className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-white text-xl font-bold mb-2">Access Denied</h2>
                <p className="text-slate-400 text-sm mb-6">
                    You do not have permission to access this page.
                    Contact your administrator for access.
                </p>
                {onGoBack && (
                    <button
                        onClick={onGoBack}
                        className="bg-[#288c6c] hover:bg-[#1f6b51] text-white font-semibold py-2.5 px-8 rounded-md text-sm transition-all"
                    >
                        Go to Dashboard
                    </button>
                )}
            </div>
        </div>
    );
};

export default AccessDenied;
