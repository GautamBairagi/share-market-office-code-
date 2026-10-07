import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import * as api from '../../services/api';

const UpdateTradePage = ({ trade, onClose, onUpdate }) => {
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

    const [formData, setFormData] = useState({
        symbol: trade?.symbol || '',
        scripType: 'Mega',
        userId: trade?.user_id || '',
        qty: trade?.qty ? parseFloat(trade.qty).toFixed(2) : '',
        entry_price: trade?.entry_price ? parseFloat(trade.entry_price).toFixed(2) : '',
        exit_price: trade?.exit_price ? parseFloat(trade.exit_price).toFixed(2) : '',
        transactionPassword: ''
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.updateTrade(trade.id, formData);
            if (onUpdate) onUpdate();
            onClose();
        } catch (err) {
            alert(err?.response?.data?.message || err?.message || 'Failed to update trade');
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
                    <h2 className="text-white font-bold uppercase tracking-tight text-[14px]">Update Trade #{trade?.id}</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-black/20 p-1 rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 bg-[#1a2035]">
                    <style>{`
                        input:-webkit-autofill,
                        input:-webkit-autofill:hover,
                        input:-webkit-autofill:focus,
                        input:-webkit-autofill:active{
                            -webkit-box-shadow: 0 0 0 30px #1a2035 inset !important;
                            -webkit-text-fill-color: white !important;
                        }
                    `}</style>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Scrip Section */}
                                <div className="space-y-3">
                                    <label className="block text-slate-400 text-[13px] font-medium tracking-wide uppercase opacity-70">Scrip</label>
                                    <div className="space-y-0.5">
                                        <select
                                            className="w-full bg-white text-black font-bold py-2 px-3 rounded-t border-b border-gray-200 focus:outline-none text-[14px]"
                                            value={formData.symbol}
                                            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                        >
                                            <option value={formData.symbol}>{formData.symbol}</option>
                                        </select>
                                        <select
                                            className="w-full bg-white text-black font-bold py-2 px-3 rounded-b focus:outline-none text-[14px]"
                                            value={formData.scripType}
                                            onChange={(e) => setFormData({ ...formData, scripType: e.target.value })}
                                        >
                                            <option value="Mega">Mega</option>
                                            <option value="Mini">Mini</option>
                                        </select>
                                    </div>
                                    <p className="text-[11px] bg-blue-600 inline-block px-1.5 py-0.5 text-white font-medium">(Mini Works on Silver and Gold only)</p>
                                </div>

                                {/* Username Section */}
                                <div className="space-y-3">
                                    <label className="block text-slate-400 text-[13px] font-medium tracking-wide uppercase opacity-70">Username</label>
                                    <select
                                        className="w-full bg-white text-black font-bold py-2 px-3 rounded focus:outline-none border-none text-[14px]"
                                        value={formData.userId}
                                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                    >
                                        <option value={formData.userId}>Demo0174 (Demo ji)</option>
                                    </select>
                                </div>

                                {/* Lots / Units */}
                                <div className="space-y-1.5">
                                    <label className="block text-slate-400 text-[13px] font-medium tracking-wide uppercase opacity-70">Lots / Units</label>
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        className="w-full bg-transparent border-b border-white/20 text-white font-mono text-[15px] py-1 focus:outline-none focus:border-[#4caf50] transition-colors"
                                        value={formData.qty}
                                        onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                                    />
                                </div>

                                {/* Buy Rate */}
                                <div className="space-y-1.5">
                                    <label className="block text-slate-400 text-[13px] font-medium tracking-wide uppercase opacity-70">Buy Rate</label>
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        className="w-full bg-transparent border-b border-white/20 text-white font-mono text-[15px] py-1 focus:outline-none focus:border-[#4caf50] transition-colors"
                                        value={formData.entry_price}
                                        onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                                    />
                                </div>

                                {/* Sell Rate */}
                                <div className="space-y-1.5">
                                    <label className="block text-slate-400 text-[13px] font-medium tracking-wide uppercase opacity-70">Sell Rate</label>
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        className="w-full bg-transparent border-b border-white/20 text-white font-mono text-[15px] py-1 focus:outline-none focus:border-[#4caf50] transition-colors"
                                        value={formData.exit_price}
                                        onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
                                    />
                                </div>

                                {/* Transaction Password */}
                                <div className="space-y-1.5">
                                    <label className="block text-slate-400 text-[13px] font-medium tracking-wide uppercase opacity-70">Transaction Password</label>
                                    <input
                                        type="password"
                                        autoComplete="new-password"
                                        className="w-full bg-transparent border-b border-white/20 text-white font-mono text-[15px] py-1 focus:outline-none focus:border-[#4caf50] transition-colors"
                                        value={formData.transactionPassword}
                                        onChange={(e) => setFormData({ ...formData, transactionPassword: e.target.value })}
                                        placeholder=""
                                    />
                                </div>

                                {/* Save Button */}
                                <div className="col-span-full pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold py-2 px-8 rounded transition-all text-[14px] shadow-lg active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                                    >
                                        {loading ? 'SAVING...' : 'SAVE'}
                                    </button>
                                </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdateTradePage;
