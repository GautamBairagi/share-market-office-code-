import React, { useState } from 'react';
import { X, AlertCircle, ArrowLeft } from 'lucide-react';
import * as api from '../../services/api';

const ChangePasswordPage = ({ client, onClose, onChangePasswordConfirm }) => {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const clientName = client?.full_name || client?.fullName || '';
    const clientUsername = client?.username || '';
    const clientId = client?.id || '';

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');

        if (!newPassword) {
            setError('Please enter a new password');
            return;
        }

        setLoading(true);
        try {
            await api.updateUserPasswords(clientId, { newPassword });
            if (onChangePasswordConfirm) onChangePasswordConfirm();
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to change password');
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
                    <div className="px-6 py-4 rounded-md shadow-2xl" style={{ background: 'linear-gradient(60deg, #66bb6a, #43a047)' }}>
                        <h4 className="text-white text-lg font-bold m-0 tracking-tight">Change User Password</h4>
                    </div>
                </div>

                <div className="bg-[#202940] rounded shadow-[0_4px_20px_0_rgba(0,0,0,.5)] p-5 pt-10">
                    <div className="p-2">
                        <p className="text-[#eeeeee] text-[14px] font-normal leading-relaxed mb-8">
                            Change Password of User <span className="text-white font-bold">{clientName}</span> ({clientUsername}) (ID: {clientId}).
                        </p>

                        {error && (
                            <div className="flex items-center gap-3 px-5 py-4 rounded bg-red-500/10 border border-red-500/30 mb-6">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                <p className="text-red-400 text-[14px] font-semibold">{error}</p>
                                <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400"><X className="w-4 h-4" /></button>
                            </div>
                        )}

                        <form onSubmit={handleUpdate}>
                            <div className="max-w-md">
                                <div className="group relative">
                                    <label className="block text-sm mb-2 font-light text-[#bcc0cf] transition-colors group-focus-within:text-[#4caf50]">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-transparent border-b border-[#555] py-1 text-white focus:outline-none focus:border-[#4caf50] transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="mt-12">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-2.5 rounded text-white font-bold text-[11px] uppercase tracking-widest transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
                                    style={{ background: 'linear-gradient(60deg, #66bb6a, #43a047)' }}
                                >
                                    {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
