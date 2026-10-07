import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast - Success/Error/Warning/Info notifications
 * Auto-hides after `duration` ms
 */
const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    const config = {
        success: { icon: <CheckCircle className="w-5 h-5" />, bg: 'bg-[#16a34a]', label: 'Success' },
        error: { icon: <XCircle className="w-5 h-5" />, bg: 'bg-[#dc2626]', label: 'Error' },
        warning: { icon: <AlertTriangle className="w-5 h-5" />, bg: 'bg-[#d97706]', label: 'Warning' },
        info: { icon: <Info className="w-5 h-5" />, bg: 'bg-[#2563eb]', label: 'Info' },
    };

    const { icon, bg } = config[type] || config.success;

    return (
        <div className="fixed bottom-6 right-6 z-[1000] animate-in slide-in-from-right-5 fade-in duration-300">
            <div className={`${bg} text-white flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-2xl min-w-[280px] max-w-[400px]`}>
                <div className="flex-shrink-0">{icon}</div>
                <span className="text-[14px] font-medium flex-1">{message}</span>
                <button onClick={onClose} className="flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
