import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import * as api from '../../services/api';

const FieldLegend = ({ title, rightControl }) => (
    <div className="inline-flex items-center gap-4 text-lg font-bold mb-8 bg-[#1a2035]/50 px-4 py-2 rounded tracking-wider" style={{ color: '#bcc0cf' }}>
        <span>{title}:</span>
        {rightControl && <div>{rightControl}</div>}
    </div>
);

const InputField = ({ label, name, value, onChange, type = "text", placeholder, hint }) => (
    <div className="mb-6 group px-2 text-left">
        <label
            htmlFor={name}
            className="block text-[14px] font-normal mb-[3.2px]"
            style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}
        >
            {label}
        </label>
        <input
            id={name}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-transparent border-b border-white/20 py-1 text-white focus:outline-none focus:border-[#4caf50] transition-colors text-[16px]"
        />
        {hint && <p className="text-[14px] mt-2 font-normal leading-normal" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>{hint}</p>}
    </div>
);

const CheckboxField = ({ label, name, checked, onChange, disabled }) => (
    <label htmlFor={name} className={`flex items-center gap-3 cursor-pointer group mb-3 px-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="relative flex items-center justify-center">
            <input
                id={name}
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="appearance-none w-5 h-5 border border-slate-600 rounded-sm checked:bg-[#4caf50] checked:border-[#4caf50] transition-all cursor-pointer disabled:cursor-not-allowed"
            />
            {checked && <Check className="w-3.5 h-3.5 text-white absolute pointer-events-none" />}
        </div>
        <span
            className="text-[14px] group-hover:text-white transition-colors"
            style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}
        >
            {label}
        </span>
    </label>
);

const CopyTradingClientForm = ({ client, onClose, onSave }) => {
    const location = useLocation();
    const sourceClient = client || location.state?.client || location.state?.selectedClient;

    const [formData, setFormData] = useState({
        fullName: sourceClient?.full_name || sourceClient?.fullName || '',
        mobile: sourceClient?.mobile || '',
        username: '',
        password: '',
        city: sourceClient?.city || '',
        isDemoAccount: sourceClient?.isDemo || sourceClient?.is_demo === 1 || sourceClient?.demoAccount === 'Yes' || false,
        transactionPassword: ''
    });

    const [sourceUsername, setSourceUsername] = useState(sourceClient?.username || '');
    const [fullSourceProfile, setFullSourceProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch complete profile & settings of the source client
    useEffect(() => {
        const sourceId = sourceClient?.id;
        if (sourceId) {
            const fetchFullSourceData = async () => {
                setLoadingProfile(true);
                try {
                    console.log('[CopyTradingClientForm] Loading full configuration from client ID:', sourceId);
                    const data = await api.getClientById(sourceId);
                    console.log('[CopyTradingClientForm] ✅ Loaded full source data:', data);
                    setFullSourceProfile(data);

                    const profile = data?.profile || {};
                    setSourceUsername(profile.username || sourceClient.username || '');
                    setFormData(prev => ({
                        ...prev,
                        fullName: profile.full_name || prev.fullName,
                        mobile: profile.mobile || prev.mobile,
                        city: profile.city || prev.city,
                        isDemoAccount: profile.is_demo === 1 || prev.isDemoAccount
                    }));
                } catch (err) {
                    console.error('[CopyTradingClientForm] Failed to load source client configuration:', err);
                } finally {
                    setLoadingProfile(false);
                }
            };
            fetchFullSourceData();
        }
    }, [sourceClient?.id]);

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

        if (!formData.fullName || formData.fullName.trim() === '') {
            setError('❌ Full Name is required');
            setLoading(false);
            return;
        }
        if (!formData.username || formData.username.trim() === '') {
            setError('❌ Username is required');
            setLoading(false);
            return;
        }
        if (!formData.password || formData.password.trim() === '') {
            setError('❌ Password is required');
            setLoading(false);
            return;
        }
        if (!formData.transactionPassword || formData.transactionPassword.trim() === '') {
            setError('❌ Transaction Password is required! Please enter transaction password.');
            setLoading(false);
            return;
        }

        // ─── VERIFY TRANSACTION PASSWORD ───
        try {
            await api.verifyTransactionPassword(formData.transactionPassword);
        } catch (verifyErr) {
            setError('❌ Invalid transaction password! Please enter the correct password.');
            setLoading(false);
            return;
        }

        try {
            const sourceProfile = fullSourceProfile?.profile || sourceClient || {};
            const sourceSettings = fullSourceProfile?.settings || {};
            const rawConfig = sourceSettings.config || (typeof sourceSettings.config_json === 'string' ? JSON.parse(sourceSettings.config_json) : (sourceSettings.config_json || {}));

            // Step 1: Create client user
            const result = await api.createClient({
                fullName: formData.fullName,
                username: formData.username,
                password: formData.password,
                mobile: formData.mobile,
                city: formData.city,
                creditLimit: sourceProfile.ledger_balance || sourceProfile.credit_limit || sourceProfile.creditLimit || 0,
                role: 'TRADER'
            });

            const userId = result.id;

            // Step 2: Update user profile
            await api.updateUser(userId, {
                isDemo: formData.isDemoAccount,
                status: 'Active',
                city: formData.city || null,
                exposureMultiplier: 1
            });

            // Step 3: Copy ALL configuration (MCX lot margins, Lot brokerages, Bid gaps, Equity Futures, Options, Short Selling, Expiry rules, Comex, Forex, Crypto, Notes)
            const configToSave = {
                ...(rawConfig || {}),
                fullName: formData.fullName,
                mobile: formData.mobile,
                username: formData.username,
                city: formData.city,
                isDemoAccount: formData.isDemoAccount,
                accountStatus: true
            };
            delete configToSave.documents;
            delete configToSave.password;

            const brokerId = sourceSettings.broker_id || sourceProfile.broker_id || (sourceClient.parentId ? parseInt(sourceClient.parentId) : null);

            const payload = {
                allowFreshEntry: sourceSettings.allow_fresh_entry !== undefined ? (sourceSettings.allow_fresh_entry ? 1 : 0) : (rawConfig.allowFreshEntry ? 1 : 0),
                allowOrdersBetweenHL: sourceSettings.allow_orders_between_hl !== undefined ? (sourceSettings.allow_orders_between_hl ? 1 : 0) : (rawConfig.allowOrdersBetweenHL !== false ? 1 : 1),
                tradeEquityUnits: sourceSettings.trade_equity_units !== undefined ? (sourceSettings.trade_equity_units ? 1 : 0) : (rawConfig.tradeEquityUnits ? 1 : 0),
                autoClosePct: String(sourceSettings.auto_close_pct || rawConfig.autoClosePercentage || rawConfig.autoClosePct || '90'),
                notifyPct: String(sourceSettings.notify_at_m2m_pct || rawConfig.notifyPercentage || rawConfig.notifyPct || '70'),
                banAllSegmentLimitOrder: sourceSettings.ban_all_segment_limit_order !== undefined ? (sourceSettings.ban_all_segment_limit_order ? 1 : 0) : (rawConfig.banAllSegmentLimitOrder ? 1 : 0),
                brokerId: brokerId,
                config: configToSave
            };

            console.log('[CopyTradingClientForm] Saving complete copied payload for user ID', userId, payload);
            await api.updateClientSettings(userId, payload);

            // Step 4: Set transaction password for the new user
            if (formData.transactionPassword) {
                await api.updateUserPasswords(userId, { transactionPassword: formData.transactionPassword });
            }

            onSave(formData);
        } catch (err) {
            console.error('[CopyTradingClientForm] Error during copying client:', err);
            setError(err.message || 'Failed to copy client');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 w-full max-w-full min-w-0 bg-[#1a2035] text-slate-300">
            {/* Back Button */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 border-b border-white/10 pb-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-2 text-white hover:text-green-400 transition-colors font-bold text-xs sm:text-sm"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>BACK</span>
                </button>
            </div>

            <div className="max-w-6xl mx-auto mt-4 mb-6">
                {/* Floating Ribbon Header */}
                <div className="relative z-20 -mb-8 ml-2 sm:ml-4 flex flex-col items-start">
                    <div
                        className="px-4 sm:px-6 py-3 sm:py-4 rounded-md shadow-xl relative z-10"
                        style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                    >
                        <h2 className="text-white text-base font-normal leading-none tracking-tight">
                            Create Trading Client {sourceUsername ? `(Copy of ${sourceUsername})` : ''}:
                        </h2>
                    </div>
                    <div className="w-4 h-4 bg-[#388e3c] -mt-2 ml-2 rounded-sm rotate-45 relative z-0"></div>
                </div>

                {/* Card Content (Clean Mini Form) */}
                <div className="bg-[#202940] rounded shadow-2xl p-4 sm:p-6 md:p-8 pt-14 sm:pt-16 border border-white/5">
                    {loadingProfile && (
                        <div className="mb-4 text-xs font-bold text-green-400 bg-green-500/10 px-3 py-2 rounded border border-green-500/20 animate-pulse">
                            ⏳ Fetching complete settings & margins from source client...
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {/* PERSONAL DETAILS */}
                            <fieldset className="border-none p-0 m-0">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <FieldLegend title="Personal Details" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                                    {/* LEFT COLUMN */}
                                    <div className="space-y-1">
                                        <InputField
                                            label="Name"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            hint="Insert Real name of the trader. Will be visible in trading App"
                                        />
                                        <InputField
                                            label="Username"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            hint="username for loggin-in with, is not case sensitive. must be unique for every trader. should not contain symbols."
                                        />
                                        <InputField
                                            label="City"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            hint="Optional"
                                        />
                                    </div>

                                    {/* RIGHT COLUMN */}
                                    <div className="space-y-1">
                                        <InputField
                                            label="Mobile"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            hint="Optional"
                                        />
                                        <InputField
                                            label="Password"
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            hint="password for loggin-in with, is case sensitive. Leave Blank if you want password remain unchanged."
                                        />
                                    </div>

                                    {/* SHARED BOTTOM ROW */}
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-12 mt-2 border-t border-white/5 pt-4">
                                        <div className="flex items-center pt-2">
                                            <CheckboxField
                                                label="demo account?"
                                                name="isDemoAccount"
                                                checked={formData.isDemoAccount}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <InputField
                                            label="Transaction Password"
                                            name="transactionPassword"
                                            type="password"
                                            value={formData.transactionPassword}
                                            onChange={handleChange}
                                            placeholder="Enter transaction password (mandatory)"
                                        />
                                    </div>
                                </div>
                            </fieldset>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm mt-4 bg-red-500/10 p-4 rounded border border-red-500/20">
                                {error}
                            </p>
                        )}

                        <div className="mt-4 pt-6 border-t border-white/5 flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-10 py-2.5 text-white rounded font-bold text-sm uppercase transition-all shadow-md active:scale-95 ${loading ? 'bg-slate-600 cursor-not-allowed opacity-60' : 'bg-[#5cb85c] hover:bg-[#43a047]'}`}
                            >
                                {loading ? 'SAVING...' : 'SAVE CLIENT'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-10 py-2 bg-[#808080] hover:bg-[#707070] text-white rounded font-bold text-sm uppercase transition-all shadow-lg"
                            >
                                CANCEL
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CopyTradingClientForm;
