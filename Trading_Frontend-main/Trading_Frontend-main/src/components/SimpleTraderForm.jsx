import React, { useState } from 'react';
import { ArrowLeft, User, DollarSign, Lock, Shield, Mail, Phone } from 'lucide-react';
import * as api from '../services/api';

const SimpleTraderForm = ({ onBack, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        username: '',
        password: '',
        creditLimit: '0',
        // Config settings
        isDemo: false,
        allowFreshEntry: true,
        allowOrdersBetweenHL: true,
        tradeEquityUnits: false,
        accountStatus: true,
        autoCloseEnabled: true,
        autoClosePct: '90',
        notifyPct: '70',
        minProfitTime: '120',
        scalpingSlEnabled: 'Enabled'
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Step 1: Create the user
            const result = await api.createClient({
                fullName: formData.fullName || undefined,
                email: formData.email || undefined,
                mobile: formData.mobile || undefined,
                username: formData.username || undefined,
                password: formData.password || undefined,
                creditLimit: formData.creditLimit,
                isDemo: formData.isDemo,
                status: formData.accountStatus ? 'Active' : 'Suspended',
                role: 'TRADER'
            });

            const userId = result.id;

            // Step 2: Save client settings
            await api.updateClientSettings(userId, {
                allowFreshEntry: formData.allowFreshEntry ? 1 : 0,
                allowOrdersBetweenHL: formData.allowOrdersBetweenHL ? 1 : 0,
                tradeEquityUnits: formData.tradeEquityUnits ? 1 : 0,
                autoCloseEnabled: formData.autoCloseEnabled ? 1 : 0,
                autoClosePct: formData.autoClosePct,
                notifyPct: formData.notifyPct,
                minProfitTime: formData.minProfitTime,
                scalpingSlEnabled: formData.scalpingSlEnabled
            });

            if (onSave) onSave(result);
        } catch (err) {
            setError(err.message || 'Failed to create trader');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-[#1b2236] font-sans flex flex-col items-center px-4 py-10 pb-24 sm:pb-12">
            <div className="w-full max-w-2xl bg-[#202940] rounded shadow-2xl border border-white/5 overflow-hidden">
                {/* Header */}
                <div className="bg-[#4caf50] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="text-white hover:bg-black/10 p-2 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-white text-xl font-bold uppercase tracking-wider">Add Trader:</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full bg-[#1a2035] border border-white/10 rounded px-10 py-3 text-white focus:outline-none focus:border-[#4caf50] transition-all"
                                    placeholder="Enter full name"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-[#1a2035] border border-white/10 rounded px-10 py-3 text-white focus:outline-none focus:border-[#4caf50] transition-all"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Mobile</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className="w-full bg-[#1a2035] border border-white/10 rounded px-10 py-3 text-white focus:outline-none focus:border-[#4caf50] transition-all"
                                    placeholder="Enter mobile number"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Username</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-[#1a2035] border border-white/10 rounded px-10 py-3 text-white focus:outline-none focus:border-[#4caf50] transition-all"
                                    placeholder="trader_user"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-[#1a2035] border border-white/10 rounded px-10 py-3 text-white focus:outline-none focus:border-[#4caf50] transition-all"
                                    placeholder="Enter password"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Initial Credit Limit</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="number"
                                    name="creditLimit"
                                    value={formData.creditLimit}
                                    onChange={handleChange}
                                    className="w-full bg-[#1a2035] border border-white/10 rounded px-10 py-3 text-white focus:outline-none focus:border-[#4caf50] transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Configuration Section */}
                    <div className="pt-6 border-t border-white/5 space-y-8">
                        <h3 className="text-white text-lg font-black uppercase tracking-widest flex items-center gap-2">
                             Config:
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Left Column - Checkboxes */}
                            <div className="space-y-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        name="isDemo" 
                                        checked={formData.isDemo} 
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-white/10 bg-[#1a2035] text-[#4caf50] focus:ring-0 cursor-pointer" 
                                    />
                                    <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">demo account?</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        name="allowOrdersBetweenHL" 
                                        checked={formData.allowOrdersBetweenHL} 
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-white/10 bg-[#1a2035] text-[#4caf50] focus:ring-0 cursor-pointer" 
                                    />
                                    <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Allow Orders between High - Low?</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        name="accountStatus" 
                                        checked={formData.accountStatus} 
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-white/10 bg-[#1a2035] text-[#4caf50] focus:ring-0 cursor-pointer" 
                                    />
                                    <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Account Status</span>
                                </label>

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-300 font-medium">auto-Close all active trades when the losses reach % of Ledger-balance</p>
                                        <input 
                                            type="number" 
                                            name="autoClosePct"
                                            value={formData.autoClosePct}
                                            onChange={handleChange}
                                            className="w-full bg-[#1a2035] border-b border-white/10 py-1 text-white font-bold focus:outline-none focus:border-[#4caf50]"
                                        />
                                        <p className="text-[10px] text-slate-500 italic">Example: 95, will close when losses reach 95% of ledger balance</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-300 font-medium">Min. Time to book profit (No. of Seconds)</p>
                                        <input 
                                            type="number" 
                                            name="minProfitTime"
                                            value={formData.minProfitTime}
                                            onChange={handleChange}
                                            className="w-full bg-[#1a2035] border-b border-white/10 py-1 text-white font-bold focus:outline-none focus:border-[#4caf50]"
                                        />
                                        <p className="text-[10px] text-slate-500 italic">Example: 120, will hold the trade for 2 minutes before closing a trade in profit</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        name="allowFreshEntry" 
                                        checked={formData.allowFreshEntry} 
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-white/10 bg-[#1a2035] text-[#4caf50] focus:ring-0 cursor-pointer" 
                                    />
                                    <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Allow Fresh Entry Order above high & below low?</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        name="tradeEquityUnits" 
                                        checked={formData.tradeEquityUnits} 
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-white/10 bg-[#1a2035] text-[#4caf50] focus:ring-0 cursor-pointer" 
                                    />
                                    <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Trade equity as units Instead of lots.</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        name="autoCloseEnabled" 
                                        checked={formData.autoCloseEnabled} 
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-white/10 bg-[#1a2035] text-[#4caf50] focus:ring-0 cursor-pointer" 
                                    />
                                    <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Auto Close Trades if condition met</span>
                                </label>

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-300 font-medium">Notify client when the losses reach % of Ledger-balance</p>
                                        <input 
                                            type="number" 
                                            name="notifyPct"
                                            value={formData.notifyPct}
                                            onChange={handleChange}
                                            className="w-full bg-[#1a2035] border-b border-white/10 py-1 text-white font-bold focus:outline-none focus:border-[#4caf50]"
                                        />
                                        <p className="text-[10px] text-slate-500 italic">Example: 70, will send notification to customer every 5-minutes until losses cross 70% of ledger balance</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-300 font-medium">Scalping Stop Loss</p>
                                        <select 
                                            name="scalpingSlEnabled"
                                            value={formData.scalpingSlEnabled}
                                            onChange={handleChange}
                                            className="w-full bg-[#1a2035] border border-white/10 rounded px-3 py-2 text-white font-bold focus:outline-none focus:border-[#4caf50]"
                                        >
                                            <option value="Enabled">Enabled</option>
                                            <option value="Disabled">Disabled</option>
                                        </select>
                                        <p className="text-[10px] text-slate-500 italic">If Disabled, Stop Loss or Booking Loss can be done after Min. time of profit booking.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#4caf50] hover:bg-[#43a047] text-white py-3 rounded font-bold uppercase tracking-[2px] shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
                        >
                            {loading ? 'CREATING...' : 'CREATE TRADER'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SimpleTraderForm;
