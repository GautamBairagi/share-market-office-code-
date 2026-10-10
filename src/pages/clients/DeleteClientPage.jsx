import React, { useState } from 'react';
import { X, AlertCircle, ArrowLeft } from 'lucide-react';
import * as api from '../../services/api';

const DeleteClientPage = ({ client, onClose, onDeleteConfirm }) => {
    const [transactionPassword, setTransactionPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const clientName = client?.full_name || client?.fullName || '';
    const clientUsername = client?.username || '';
    const clientId = client?.id || '';

    const handleDelete = async (e) => {
        e.preventDefault();
        setError('');

        if (!transactionPassword) {
            setError('Please enter transaction password');
            return;
        }

        setLoading(true);
        try {
            // Verify transaction password first
            await api.verifyTransactionPassword(transactionPassword);

            // Then delete the user
            await api.deleteUser(clientId);

            if (onDeleteConfirm) onDeleteConfirm();
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to delete client');
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

                {/* Box Header Badge */}
                <div className="relative z-20 mb-[-1.5rem] ml-4 inline-block">
                    <div className="px-6 py-4 rounded-md shadow-2xl" style={{ background: 'linear-gradient(60deg, #66bb6a, #43a047)' }}>
                        <h4 className="text-white text-lg font-bold m-0 tracking-tight">
                            Delete Trading Client
                        </h4>
                    </div>
                </div>

                {/* Card Content */}
                <div className="bg-[#202940] rounded-lg shadow-[0_4px_20px_0_rgba(0,0,0,.5)] p-5 pt-12">
                    <div className="p-2">
                        <p className="text-[#eeeeee] text-[15px] font-normal leading-relaxed mb-10">
                            You are about to delete trading client <span className="text-white font-bold">{clientName}</span> {clientUsername} ({clientId}). Please Note, once deleted, you will not be able to recover <span className="text-cyan-400">this account</span>. Enter <span className="text-cyan-400">Transaction Password</span> to continue.
                        </p>

                        {error && (
                            <div className="flex items-center gap-3 px-5 py-4 rounded bg-red-500/10 border border-red-500/30 mb-6">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                <p className="text-red-400 text-[14px] font-semibold">{error}</p>
                                <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleDelete} className="mt-6">
                            <div className="flex flex-col md:flex-row items-end gap-x-8 gap-y-10 w-full mb-10">
                                <div className="flex-1 group relative w-full md:w-auto">
                                    <label className="block text-sm mb-4 font-light text-[#bcc0cf] transition-colors group-focus-within:text-[#4caf50]">
                                        Transaction Password
                                    </label>
                                    <input
                                        type="password"
                                        value={transactionPassword}
                                        onChange={(e) => setTransactionPassword(e.target.value)}
                                        className="w-full bg-transparent border-b border-[#555] py-2 text-white focus:outline-none focus:border-[#4caf50] transition-all text-sm"
                                    />
                                </div>

                                <div className="pb-1">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-2.5 rounded text-white font-bold text-[11px] uppercase tracking-widest transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
                                        style={{ background: 'linear-gradient(60deg, #66bb6a, #43a047)' }}
                                    >
                                        {loading ? 'DELETING...' : 'DELETE ACCOUNT'}
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

export default DeleteClientPage;
