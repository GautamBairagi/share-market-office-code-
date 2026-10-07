import React, { useState } from 'react';
import { X, AlertCircle, ArrowLeft } from 'lucide-react';
import * as api from '../../services/api';

const ResetAccountPage = ({ client, onClose, onResetConfirm }) => {
    const [transactionPassword, setTransactionPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const clientName = client?.full_name || client?.fullName || '';
    const clientUsername = client?.username || '';
    const clientId = client?.id || '';

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');

        if (!transactionPassword) {
            setError('Please enter transaction password');
            return;
        }

        setLoading(true);
        try {
            await api.verifyTransactionPassword(transactionPassword);
            await api.resetAccount(clientId);
            if (onResetConfirm) onResetConfirm();
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to reset account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 p-3 sm:p-4 w-full max-w-full min-w-0 bg-[#1a2035] text-slate-300">
            {/* Back Button */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-2 text-white hover:text-green-400 transition-colors font-bold text-xs sm:text-sm"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>BACK</span>
                </button>
            </div>

            <div className="max-w-4xl mx-auto mt-6">
                <div className="flex justify-end mb-4">
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Header Badge */}
                <div className="relative z-20 mb-[-1.5rem] ml-4 inline-block">
                    <div className="px-6 py-3 rounded-md shadow-2xl" style={{ background: 'linear-gradient(60deg, #66bb6a, #43a047)' }}>
                        <h4 className="text-white text-base font-bold m-0 tracking-tight">Reset Account</h4>
                    </div>
                </div>

                <div className="bg-[#202940] rounded shadow-[0_4px_20px_0_rgba(0,0,0,.5)] p-5 pt-10">
                    <div className="p-2">
                        <p className="text-[#eeeeee] text-[15px] font-normal leading-relaxed mb-10">
                            You are about to clear all history of User <span className="text-white font-bold">{clientName}</span> ({clientUsername}) (ID: {clientId}).
                            All trades, Brokerage and Profit/Loss of the user will be deleted and can not be recovered.
                            However, Ledger Balance of the user would remain the same and all Deposit and Withdrawal
                            transactions would remain in the system. Enter Transaction Password to continue.
                        </p>

                        {error && (
                            <div className="flex items-center gap-3 px-5 py-4 rounded bg-red-500/10 border border-red-500/30 mb-6">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                <p className="text-red-400 text-[14px] font-semibold">{error}</p>
                                <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400"><X className="w-4 h-4" /></button>
                            </div>
                        )}

                        <form onSubmit={handleReset} className="mt-6">
                            <div className="flex flex-col md:flex-row items-end gap-x-8 gap-y-6">
                                <div className="flex-1 min-w-[250px] group relative">
                                    <label className="block text-sm mb-2 font-light text-[#bcc0cf]/70 transition-colors group-focus-within:text-[#9c27b0]">
                                        Transaction Password
                                    </label>
                                    <input
                                        type="password"
                                        value={transactionPassword}
                                        onChange={(e) => setTransactionPassword(e.target.value)}
                                        className="w-full bg-transparent border-b border-[#555] py-1.5 text-white focus:outline-none focus:border-[#9c27b0] transition-all text-base"
                                        autoFocus
                                    />
                                </div>
                                <div className="pb-0.5">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-2.5 rounded text-white font-bold text-[11px] uppercase tracking-widest transition-all shadow-lg hover:shadow-2xl active:scale-95 disabled:opacity-50"
                                        style={{ background: 'linear-gradient(60deg, #66bb6a, #43a047)' }}
                                    >
                                        {loading ? 'RESETTING...' : 'RESET ACCOUNT'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetAccountPage;
