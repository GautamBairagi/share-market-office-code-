import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * ConfirmModal - Reusable confirmation dialog
 * Usage: Reset Password, Delete, any destructive action
 */
const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning', // 'warning' | 'danger'
}) => {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        setLoading(false);
        onClose();
    };

    const iconColor = type === 'danger' ? '#dc2626' : '#d97706';
    const confirmBg = type === 'danger'
        ? 'bg-[#dc2626] hover:bg-[#b91c1c]'
        : 'bg-[#288c6c] hover:bg-[#1f6b51]';

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div
                className="bg-[#1f2a3a] rounded-lg shadow-2xl w-full max-w-[520px] mx-4 border border-white/10 animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <AlertTriangle style={{ color: iconColor }} className="w-5 h-5" />
                        <h3 className="text-white text-[15px] font-semibold">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-slate-300 text-[14px] leading-relaxed">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end flex-wrap gap-3 px-4 sm:px-6 py-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 sm:flex-none min-w-[90px] h-[42px] px-5 rounded-md border border-white/20 text-slate-300 hover:text-white hover:border-white/40 text-[13px] font-medium transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`flex-1 sm:flex-none min-w-[110px] h-[42px] px-5 rounded-md text-white text-[13px] font-semibold transition-all ${confirmBg} ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
