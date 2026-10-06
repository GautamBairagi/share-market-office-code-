import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import * as api from '../../services/api';

const DeleteTradePage = ({ trade, onClose, onDelete }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password) {
            alert('Please enter transaction password');
            return;
        }
        setLoading(true);
        try {
            await api.deleteTrade(trade.id, { transactionPassword: password });

            if (onDelete) onDelete();
            onClose();
        } catch (err) {
            alert(err?.response?.data?.message || err?.message || 'Failed to delete trade');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
            {/* Modal Container */}
            <div className="bg-[#202940] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="bg-[#4caf50] h-14 flex items-center justify-between px-6 shadow-md sticky top-0 z-10">
                    <h2 className="text-white font-bold uppercase tracking-tight text-[14px]">Delete Trade #{trade?.id}</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-black/20 p-1 rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 bg-[#1a2035]">
                    <p className="text-[14px] leading-relaxed mb-6 opacity-90">
                        You are about to delete trade of <span className="text-white font-bold">{parseFloat(trade?.qty || 0).toFixed(2)}</span> lots of <span className="text-white font-bold">{trade?.symbol || 'SCRIP'}</span> of <span className="text-white font-bold">{trade?.user_id || 'User'}</span>. Brokerage and Profit/Loss of the Buy and SELL Trade will be refunded to the client and the Trade will be removed. In case it is a partial trade of some parent trade, then no. of lots of parent trade will be reduced by <span className="text-white font-bold">{parseFloat(trade?.qty || 0).toFixed(2)}</span> lots. Enter Transaction Password to continue.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-end gap-x-8 gap-y-6">
                        <div className="flex-1 space-y-3 w-full">
                            <label className="block text-slate-400 text-[14px] font-medium tracking-wide">Transaction Password</label>
                            <input
                                type="password"
                                autoComplete="new-password"
                                className="w-full bg-transparent border-b border-white/20 text-white font-mono text-[16px] py-2 focus:outline-none focus:border-[#4caf50] transition-colors"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder=""
                            />
                            <style>{`
                                input:-webkit-autofill {
                                    -webkit-box-shadow: 0 0 0 30px #1a2035 inset !important;
                                    -webkit-text-fill-color: white !important;
                                }
                            `}</style>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold py-2 px-8 rounded transition-all text-[14px] shadow-lg active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                        >
                            {loading ? 'DELETING...' : 'DELETE'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DeleteTradePage;
