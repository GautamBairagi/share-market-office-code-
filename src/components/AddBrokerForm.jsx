import React, { useState, useEffect, useCallback, memo } from 'react';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Components - MATCHING THE SCREENSHOT EXACTLY (Moved outside to prevent focus loss)
const SectionHeader = memo(({ title }) => (
    <div className="w-full bg-[#4f4a4a] py-3 px-6 mb-6 mt-2 text-center">
        <h3 className="text-white text-[24px] font-bold tracking-wide">{title}:</h3>
    </div>
));

const InputGroup = memo(({ label, subtext, value, onChange, name, type = "text", placeholder = "", disabled }) => (
    <div className="mb-3">
        <label htmlFor={name} className="block text-[14px] font-normal" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>
            {label}
        </label>
        <div className="relative pt-1">
            <input
                id={name}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full bg-transparent border-b border-slate-700 text-white py-1 text-sm focus:outline-none focus:border-[#4caf50] transition-colors ${disabled ? 'cursor-default' : ''}`}
                placeholder={placeholder}
            />
        </div>
        {subtext && <p className="text-[14px] mt-2 font-normal leading-normal" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>{subtext}</p>}
    </div>
));

const PermissionRow = memo(({ label, value, onChange, options, disabled }) => (
    <div className="flex justify-between items-center py-1">
        <label className="text-[14px] font-normal leading-tight pr-4" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>
            {label}
        </label>
        <div className="relative min-w-[70px]">
            <select
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full bg-white text-black font-bold px-2 py-0.5 text-[14px] border border-gray-300 rounded-sm appearance-none cursor-pointer outline-none shadow-sm ${disabled ? 'opacity-80 cursor-default' : ''}`}
            >
                {options.map(opt => <option key={opt} value={opt} className="bg-white">{opt}</option>)}
            </select>
            {!disabled && (
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                    <i className="fa-solid fa-chevron-down text-[10px]"></i>
                </div>
            )}
        </div>
    </div>
));

const SelectGroup = memo(({ label, subtext, value, onChange, options, name, disabled }) => (
    <div className="mb-8">
        <label htmlFor={name} className="block text-[14px] font-normal mb-2" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>
            {label}
        </label>
        <div className="relative">
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full bg-white text-black font-bold px-3 py-2 text-[15px] border border-gray-300 rounded-sm appearance-none cursor-pointer outline-none shadow-sm ${disabled ? 'opacity-80 cursor-default' : ''}`}
            >
                {options.map(opt => <option key={opt} value={opt} className="bg-white">{opt}</option>)}
            </select>
            {!disabled && (
                <div className="absolute right-3 top-[50%] -translate-y-1/2 pointer-events-none text-black">
                    <i className="fa-solid fa-chevron-down text-[12px]"></i>
                </div>
            )}
        </div>
        {subtext && <p className="text-[14px] mt-2 font-normal leading-normal" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>{subtext}</p>}
    </div>
));

const SegmentBlock = memo(({ title, segmentKey, config, formData, handleSegmentChange, isViewOnly }) => {
    const data = formData.segments[segmentKey];
    return (
        <div className="mb-8">
            <SectionHeader title={title} />
            {/* WEB VIEW Layout - Untouched */}
            <div className="hidden md:grid md:grid-cols-2 gap-x-12 px-2">
                {/* Left Column */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <input
                            type="checkbox"
                            checked={data.enabled}
                            disabled={isViewOnly}
                            onChange={(e) => handleSegmentChange(segmentKey, 'enabled', e.target.checked)}
                            className={`w-[18px] h-[18px] bg-transparent border border-[#4f5361] rounded-sm cursor-pointer accent-[#4caf50] ${isViewOnly ? 'cursor-default opacity-50' : ''}`}
                        />
                        <span className="text-[14px] font-normal" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>Trading Enabled</span>
                    </div>
                    <InputGroup
                        label="Brokerage"
                        value={data.brokerage}
                        disabled={isViewOnly}
                        onChange={(e) => handleSegmentChange(segmentKey, 'brokerage', e.target.value)}
                        name={`${segmentKey}_brokerage`}
                    />
                    <InputGroup
                        label="Intraday Exposure/Margin"
                        value={data.intraday}
                        disabled={isViewOnly}
                        onChange={(e) => handleSegmentChange(segmentKey, 'intraday', e.target.value)}
                        name={`${segmentKey}_intraday`}
                        subtext="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade."
                    />
                </div>
                {/* Right Column */}
                <div className="md:pt-0">
                    {config.hasBrokerageType && (
                        <SelectGroup
                            label="Brokerage Type"
                            value={data.brokerageType}
                            disabled={isViewOnly}
                            options={['Per Crore Basis', 'Per Lot Basis']}
                            onChange={(e) => handleSegmentChange(segmentKey, 'brokerageType', e.target.value)}
                            name={`${segmentKey}_brokerageType`}
                        />
                    )}
                    {config.hasExposureType && (
                        <SelectGroup
                            label="Exposure Type"
                            value={data.exposureType}
                            disabled={isViewOnly}
                            options={['Per Turnover Basis', 'Fixed Exposure']}
                            onChange={(e) => handleSegmentChange(segmentKey, 'exposureType', e.target.value)}
                            name={`${segmentKey}_exposureType`}
                        />
                    )}
                    <InputGroup
                        label="Holding Exposure/Margin"
                        value={data.holding}
                        disabled={isViewOnly}
                        onChange={(e) => handleSegmentChange(segmentKey, 'holding', e.target.value)}
                        name={`${segmentKey}_holding`}
                        subtext="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient."
                    />
                </div>
            </div>

            {/* APP VIEW Layout - Specific Ordering */}
            <div className="md:hidden space-y-4 px-2">
                <div className="flex items-center gap-3 mb-4">
                    <input
                        type="checkbox"
                        checked={data.enabled}
                        disabled={isViewOnly}
                        onChange={(e) => handleSegmentChange(segmentKey, 'enabled', e.target.checked)}
                        className={`w-[18px] h-[18px] bg-transparent border border-[#4f5361] rounded-sm cursor-pointer accent-[#4caf50] ${isViewOnly ? 'cursor-default opacity-50' : ''}`}
                    />
                    <span className="text-[14px] font-normal" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>Trading Enabled</span>
                </div>

                {config.hasBrokerageType && (
                    <SelectGroup
                        label="Brokerage Type"
                        value={data.brokerageType}
                        disabled={isViewOnly}
                        options={['Per Crore Basis', 'Per Lot Basis']}
                        onChange={(e) => handleSegmentChange(segmentKey, 'brokerageType', e.target.value)}
                        name={`${segmentKey}_brokerageType_mobile`}
                    />
                )}

                <InputGroup
                    label="Brokerage"
                    value={data.brokerage}
                    disabled={isViewOnly}
                    onChange={(e) => handleSegmentChange(segmentKey, 'brokerage', e.target.value)}
                    name={`${segmentKey}_brokerage_mobile`}
                />

                {config.hasExposureType && (
                    <SelectGroup
                        label="Exposure Type"
                        value={data.exposureType}
                        disabled={isViewOnly}
                        options={['Per Turnover Basis', 'Fixed Exposure']}
                        onChange={(e) => handleSegmentChange(segmentKey, 'exposureType', e.target.value)}
                        name={`${segmentKey}_exposureType_mobile`}
                    />
                )}

                <InputGroup
                    label="Intraday Exposure/Margin"
                    value={data.intraday}
                    disabled={isViewOnly}
                    onChange={(e) => handleSegmentChange(segmentKey, 'intraday', e.target.value)}
                    name={`${segmentKey}_intraday_mobile`}
                    subtext="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade."
                />

                <InputGroup
                    label="Holding Exposure/Margin"
                    value={data.holding}
                    disabled={isViewOnly}
                    onChange={(e) => handleSegmentChange(segmentKey, 'holding', e.target.value)}
                    name={`${segmentKey}_holding_mobile`}
                    subtext="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient."
                />
            </div>
        </div>
    );
});

const AddBrokerForm = ({ onBack, onSave, brokerId, mode = 'add' }) => {
    const { user } = useAuth();
    const isBrokerCreating = user?.role === 'BROKER';
    const isViewOnly = mode === 'view';
    const isEditMode = mode === 'edit';

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        // Personal Details
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        username: '',
        password: '',
        transactionPasswordSet: '',

        // Config
        accountStatus: 'Active',
        sharePL: '0',
        shareBrokerage: '50',
        shareSwap: '10',
        brokerageShareType: 'Percentage',
        tradingClientsLimit: '10',
        subBrokersLimit: '3',

        // Permissions - Sub-brokers get view-only by default
        permissions: {
            subBrokerActions: 'No',
            payinAllowed: 'Yes',        // View funds
            payoutAllowed: 'Yes',       // View funds
            createClientsAllowed: 'No',
            clientTasksAllowed: 'No',
            tradeActivityAllowed: 'Yes', // View trades & pending orders
            notificationsAllowed: 'Yes',
            canViewBackupData: 'No'
        },

        // Segments
        segments: {
            comex_commodity_future: { enabled: false, brokerageType: 'Per Crore Basis', brokerage: '', exposureType: 'Per Turnover Basis', intraday: '', holding: '' },
            comex_currency_future: { enabled: false, brokerageType: 'Per Crore Basis', brokerage: '', exposureType: 'Per Turnover Basis', intraday: '', holding: '' },
            comex_crypto_future: { enabled: false, brokerageType: 'Per Crore Basis', brokerage: '', exposureType: 'Per Turnover Basis', intraday: '', holding: '' },
            nse_all_future: { enabled: false, brokerage: '', intraday: '', holding: '' },
            nse_equity_opt_short: { enabled: false, brokerageType: 'Per Crore Basis', brokerage: '', intraday: '', holding: '' },
            nse_equity_opt: { enabled: false, brokerageType: 'Per Crore Basis', brokerage: '', intraday: '', holding: '' },
            nse_index_opt_short: { enabled: false, brokerageType: 'Per Crore Basis', brokerage: '', intraday: '', holding: '' },
            nse_index_opt: { enabled: false, brokerageType: 'Per Crore Basis', brokerage: '', intraday: '', holding: '' },
            nse_equity_spot: { enabled: false, brokerage: '', intraday: '', holding: '' },
            mcx_all_future: { enabled: false, brokerageType: 'Per Crore Basis', brokerage: '', exposureType: 'Per Turnover Basis', intraday: '', holding: '' },
            mcx_comm_opt: { enabled: false, brokerageType: 'Per Crore Basis', brokerage: '', intraday: '', holding: '' },
            mcx_comm_opt_short: { enabled: false, brokerageType: 'Per Crore Basis', brokerage: '', intraday: '', holding: '' }
        },

        // MCX Lot Wise Margins
        mcxMargins: {
            ALUMINI: { intraday: '1', holding: '1', lot: '1' },
            ALUMINIUM: { intraday: '1', holding: '1', lot: '1' },
            COPPER: { intraday: '1', holding: '1', lot: '1' },
            COTTON: { intraday: '1', holding: '1', lot: '1' },
            CRUDEOIL: { intraday: '1', holding: '1', lot: '1' },
            CRUDEOILM: { intraday: '1', holding: '1', lot: '1' },
            GOLD: { intraday: '1', holding: '1', lot: '1' },
            GOLDGUINEA: { intraday: '1', holding: '1', lot: '1' },
            GOLDM: { intraday: '1', holding: '1', lot: '1' },
            GOLDPETAL: { intraday: '1', holding: '1', lot: '1' },
            LEAD: { intraday: '1', holding: '1', lot: '1' },
            LEADMINI: { intraday: '1', holding: '1', lot: '1' },
            MCXBULLDEX: { intraday: '1', holding: '1', lot: '1' },
            NATGASMINI: { intraday: '1', holding: '1', lot: '1' },
            NATURALGAS: { intraday: '1', holding: '1', lot: '1' },
            NICKEL: { intraday: '1', holding: '1', lot: '1' },
            SILVER: { intraday: '1', holding: '1', lot: '1' },
            SILVERM: { intraday: '1', holding: '1', lot: '1' },
            SILVERMIC: { intraday: '1', holding: '1', lot: '1' },
            ZINC: { intraday: '1', holding: '1', lot: '1' },
            ZINCMINI: { intraday: '1', holding: '1', lot: '1' },
            MGOLD: { intraday: '1', holding: '1', lot: '1' },
            MCRUDEOIL: { intraday: '1', holding: '1', lot: '1' },
            MSILVER: { intraday: '1', holding: '1', lot: '1' },
            MNATURALGAS: { intraday: '1', holding: '1', lot: '1' },
            MCOPPER: { intraday: '1', holding: '1', lot: '1' },
            MLEAD: { intraday: '1', holding: '1', lot: '1' },
            MZINC: { intraday: '1', holding: '1', lot: '1' },
            MALUMINIUM: { intraday: '1', holding: '1', lot: '1' }
        },

        // MCX Lot Wise Brokerage
        mcxBrokerage: {
            ALUMINI: '1', ALUMINIUM: '1', COPPER: '1', COTTON: '1', CRUDEOIL: '1', CRUDEOILM: '1',
            GOLD: '1', GOLDGUINEA: '1', GOLDM: '1', GOLDPETAL: '1', LEAD: '1', LEADMINI: '1',
            MCXBULLDEX: '1', NATGASMINI: '1', NATURALGAS: '1', NICKEL: '1', SILVER: '1',
            SILVERM: '1', SILVERMIC: '1', ZINC: '1', ZINCMINI: '1',
            MGOLD: '1', MCRUDEOIL: '1', MSILVER: '1', MNATURALGAS: '1', MCOPPER: '1',
            MLEAD: '1', MZINC: '1', MALUMINIUM: '1'
        },

        // Swap Charges (per day per lot)
        swapRate: '5',  // Default ₹5 per lot per day for overnight holding

        finalTransactionPassword: ''
    });

    useEffect(() => {
        if (brokerId) {
            fetchBrokerData();
        }
    }, [brokerId]);

    const fetchBrokerData = async () => {
        setFetching(true);
        try {
            const data = await api.getBrokerShares(brokerId);
            const res = await api.getClientById(brokerId);
            const user = res.profile;

            if (user) {
                const nameParts = (user.full_name || '').split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';

                setFormData(prev => ({
                    ...prev,
                    firstName,
                    lastName,
                    email: user.email || '',
                    mobile: user.mobile || '',
                    username: user.username || '',
                    accountStatus: user.status || 'Active',
                    sharePL: String(data.share_pl_pct ?? '0'),
                    shareBrokerage: String(data.share_brokerage_pct ?? '50'),
                    shareSwap: String(data.share_swap_pct ?? '10'),
                    brokerageShareType: data.brokerage_type || 'Percentage',
                    tradingClientsLimit: String(data.trading_clients_limit ?? '10'),
                    subBrokersLimit: String(data.sub_brokers_limit ?? '3'),
                    swapRate: String(data.swap_rate ?? '5'),  // Load swap rate on edit
                    permissions: data.permissions || prev.permissions,
                    segments: (data.segments && data.segments.segmentConfig) ? { ...prev.segments, ...data.segments.segmentConfig } : prev.segments,
                    mcxMargins: (data.segments && data.segments.mcxMargins) ? { ...prev.mcxMargins, ...data.segments.mcxMargins } : prev.mcxMargins,
                    mcxBrokerage: (data.segments && data.segments.mcxBrokerage) ? { ...prev.mcxBrokerage, ...data.segments.mcxBrokerage } : prev.mcxBrokerage,
                }));
            }
        } catch (err) {
            console.error('Failed to fetch broker details:', err);
            setError('Failed to fetch broker details');
        } finally {
            setFetching(false);
        }
    };

    const handleChange = useCallback((e) => {
        if (isViewOnly) return;
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, [isViewOnly]);

    const handlePermissionChange = useCallback((field, value) => {
        if (isViewOnly) return;
        setFormData(prev => ({
            ...prev,
            permissions: { ...prev.permissions, [field]: value }
        }));
    }, [isViewOnly]);

    const handleSegmentChange = useCallback((segment, field, value) => {
        if (isViewOnly) return;
        setFormData(prev => ({
            ...prev,
            segments: {
                ...prev.segments,
                [segment]: { ...prev.segments[segment], [field]: value }
            }
        }));
    }, [isViewOnly]);

    const handleMcxMarginChange = useCallback((scrip, field, value) => {
        if (isViewOnly) return;
        setFormData(prev => ({
            ...prev,
            mcxMargins: {
                ...prev.mcxMargins,
                [scrip]: { ...prev.mcxMargins[scrip], [field]: value }
            }
        }));
    }, [isViewOnly]);

    const handleMcxBrokerageChange = useCallback((scrip, value) => {
        if (isViewOnly) return;
        setFormData(prev => ({
            ...prev,
            mcxBrokerage: { ...prev.mcxBrokerage, [scrip]: value }
        }));
    }, [isViewOnly]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isViewOnly) return;
        setLoading(true);
        setError('');
        try {
            // ─── VALIDATION ───────────────────────
            // Check Admin's Transaction Password is provided for authorization
            if (!formData.finalTransactionPassword || formData.finalTransactionPassword.trim() === '') {
                setError('❌ Your Transaction Password is required to authorize this change!');
                setLoading(false);
                return;
            }

            // Verify transaction password (using the authorization field)
            try {
                await api.verifyTransactionPassword(formData.finalTransactionPassword);
            } catch (verifyErr) {
                setError('❌ Invalid transaction password! Please enter your correct password.');
                setLoading(false);
                return;
            }

            // Mandatory only for Create mode
            if (!isEditMode && (!formData.transactionPasswordSet || formData.transactionPasswordSet.trim() === '')) {
                setError('❌ Transaction Password for newly created broker is required!');
                setLoading(false);
                return;
            }

            let userId = brokerId;

            if (!isEditMode) {
                // ── CREATE: build user ──
                const createPayload = {
                    fullName: `${formData.firstName} ${formData.lastName}`.trim() || undefined,
                    email: formData.email || undefined,
                    mobile: formData.mobile || undefined,
                    username: formData.username || undefined,
                    password: formData.password || undefined,
                    role: 'BROKER',
                };
                const result = await api.createClient(createPayload);
                userId = result.id;

                // Set account status if not Active
                if (formData.accountStatus && formData.accountStatus !== 'Active') {
                    await api.updateUser(userId, { status: formData.accountStatus });
                }
            } else {
                // ── EDIT: update basic info ──
                const updatePayload = {};
                const fullName = `${formData.firstName} ${formData.lastName}`.trim();
                if (fullName) updatePayload.fullName = fullName;
                if (formData.email) updatePayload.email = formData.email;
                if (formData.mobile) updatePayload.mobile = formData.mobile;
                if (formData.accountStatus) updatePayload.status = formData.accountStatus;

                if (Object.keys(updatePayload).length > 0) {
                    await api.updateUser(userId, updatePayload);
                }

                // Optional password change in edit mode
                if (formData.password) {
                    await api.updateUserPasswords(userId, { newPassword: formData.password });
                }
            }

            // ── Set broker's transaction password if provided ──
            if (formData.transactionPasswordSet) {
                await api.updateUserPasswords(userId, {
                    transactionPassword: formData.transactionPasswordSet
                });
            }

            // ── Save broker shares + permissions + segments + MCX config ──
            await api.updateBrokerShares(userId, {
                sharePL: formData.sharePL,
                shareBrokerage: formData.shareBrokerage,
                shareSwap: formData.shareSwap,
                brokerageType: formData.brokerageShareType,
                tradingClientsLimit: formData.tradingClientsLimit,
                subBrokersLimit: formData.subBrokersLimit,
                permissions: formData.permissions,
                swapRate: formData.swapRate,  // Daily swap rate for overnight holdings
                segments: {
                    segmentConfig: formData.segments,
                    mcxMargins: formData.mcxMargins,
                    mcxBrokerage: formData.mcxBrokerage,
                },
            });

            if (onSave) onSave({ id: userId });
        } catch (err) {
            setError(err.message || 'Failed to process request');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="w-full bg-[#1b2236] font-sans flex flex-col items-center px-0 sm:px-4 pb-24 sm:pb-12">
            <div className="w-full max-w-7xl">

                {/* Back Button */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="mt-4 mb-2 flex items-center gap-2 text-white hover:text-green-400 transition-colors ml-4 sm:ml-0"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        <span className="text-sm font-bold uppercase tracking-wider">Back</span>
                    </button>
                )}

                {/* Main Card Wrapper with Floating Header - Fully responsive edge-to-edge for mobile */}
                <div className="relative w-full sm:w-full px-4 py-10 pt-16 sm:px-6 md:px-8 lg:px-12 mt-14 sm:mt-16 animate-fadeIn bg-[#1f283e] rounded-none sm:rounded-lg border-x-0 sm:border border-white/5 shadow-2xl">

                    {/* Floating Header Ribbon */}
                    <div className="absolute -top-6 left-1 sm:left-6 z-20">
                        {/* Main Tab */}
                        <div
                            className="px-5 sm:px-6 py-2.5 rounded shadow-[0_4px_20px_0_rgba(0,0,0,0.3)] min-w-[160px] sm:min-w-[180px]"
                            style={{ background: isViewOnly ? 'linear-gradient(60deg, #607d8b, #455a64)' : (isEditMode ? 'linear-gradient(60deg, #2196f3, #1976d2)' : 'linear-gradient(60deg, rgb(40, 140, 108), rgb(78, 167, 82))') }}
                        >
                            <h2 className="text-white text-[15px] sm:text-[18px] font-bold m-0 tracking-wide text-center uppercase">
                                {isViewOnly ? 'View Broker:' : (isEditMode ? 'Edit Broker:' : 'Add Broker:')}
                            </h2>
                        </div>
                        {/* Shadow Fold/Tail Piece */}
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#1e7e34] -z-10 rounded-sm transform rotate-45 hidden sm:block"></div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded px-4 py-3 text-sm">
                                {error}
                            </div>
                        )}

                        {/* 1. PERSONAL DETAILS */}
                        <div className="mb-6 mt-8">
                            <SectionHeader title="Personal Details" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4 px-4">
                                <InputGroup label="First Name" subtext="Insert Real name of the broker. Will be visible in website" name="firstName" value={formData.firstName} onChange={handleChange} disabled={isViewOnly} />
                                <InputGroup label="Last Name" subtext="Insert Real name of the broker. Will be visible in website" name="lastName" value={formData.lastName} onChange={handleChange} disabled={isViewOnly} />
                                <InputGroup label="Username" subtext="username for loggin-in with, is not case sensitive. must be unique for every trader. should not contain symbols." name="username" value={formData.username} onChange={handleChange} disabled={isViewOnly} />
                                {!isViewOnly && (
                                    <InputGroup
                                        label={isEditMode ? "New Password (optional)" : "Password"}
                                        subtext={isEditMode ? "Leave blank to keep current password" : "Password for logging in, is case sensitive."}
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={isViewOnly}
                                    />
                                )}
                                {!isViewOnly && (
                                    <div className="mb-3">
                                        <label className="block text-[14px] font-normal" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>
                                            Transaction Password to set <span style={{ color: '#ff6b6b' }}>*</span>
                                        </label>
                                        <div className="relative pt-1">
                                            <input
                                                type="password"
                                                name="transactionPasswordSet"
                                                value={formData.transactionPasswordSet}
                                                onChange={handleChange}
                                                disabled={isViewOnly}
                                                className={`w-full bg-transparent border-b border-slate-700 text-white py-1 text-sm focus:outline-none focus:border-[#4caf50] transition-colors ${isViewOnly ? 'cursor-default' : ''}`}
                                                placeholder="Enter transaction password"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="border-[#4f5361]/20 my-8" />

                        {/* 2. CONFIG */}
                        <div className="mb-6">
                            <SectionHeader title="Config" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4 px-4">
                                <div className="mb-8 flex items-center pt-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                name="accountStatus"
                                                checked={formData.accountStatus === 'Active'}
                                                disabled={isViewOnly}
                                                onChange={(e) => setFormData(prev => ({ ...prev, accountStatus: e.target.checked ? 'Active' : 'Suspended' }))}
                                                className={`w-5 h-5 bg-transparent border-2 border-[#4f5361] rounded transition-all appearance-none checked:bg-[#4caf50] checked:border-[#4caf50] ${isViewOnly ? 'cursor-default opacity-50' : ''}`}
                                            />
                                            <i className="fa-solid fa-check absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[10px] opacity-0 check-icon transition-opacity"></i>
                                        </div>
                                        <span className="text-[14px] font-normal group-hover:text-white/80 transition-colors">Account Status</span>
                                    </label>
                                    <style>{`
                                        input:checked + .check-icon { opacity: 1; }
                                    `}</style>
                                </div>
                                <InputGroup label="Profit/Loss Share in %" subtext="Example: 30, will give broker 30% of total brokerage collected from clients" name="sharePL" value={formData.sharePL} onChange={handleChange} disabled={isViewOnly} />
                                <InputGroup label="Brokerage Share in %" subtext="Example: 30, will give broker 30% of total brokerage collected from clients. This field is irrelevant if the Brokerage Share Type is set to 'Fixed'." name="shareBrokerage" value={formData.shareBrokerage} onChange={handleChange} disabled={isViewOnly} />
                                <InputGroup label="Swap Share in %" subtext="Example: 30, will give broker 30% of total swap collected from clients" name="shareSwap" value={formData.shareSwap} onChange={handleChange} disabled={isViewOnly} />
                                <SelectGroup label="Brokerage Share Type" subtext="If fixed is selected, Then Brokerage set in sections below like MCX, NSE, etc. will be your brokerage and any amount above that will be of broker. If Percentage is selected then Brokerage set in sections below will be the minimum brokerage which can be set in Client's account and Broker will get % wise share in brokerage set above." options={['Percentage', 'Fixed']} name="brokerageShareType" value={formData.brokerageShareType} onChange={handleChange} disabled={isViewOnly} />
                                <InputGroup label="Trading Clients Limit" subtext="Max. no. of Trading Clients" name="tradingClientsLimit" value={formData.tradingClientsLimit} onChange={handleChange} disabled={isViewOnly} />
                                <InputGroup label="Sub Brokers Limit" subtext="Max. no. of Sub-brokers" name="subBrokersLimit" value={formData.subBrokersLimit} onChange={handleChange} disabled={isViewOnly} />
                            </div>
                        </div>

                        <hr className="border-[#4f5361]/20 my-8" />

                        {/* 3. PERMISSIONS - Only show for ADMIN/SUPERADMIN */}
                        {!isBrokerCreating && (
                            <>
                                <div className="mb-6">
                                    <SectionHeader title="Permissions" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 px-8 mt-4">
                                        <PermissionRow label="Sub Brokers Actions (Create, Edit)" options={['Yes', 'No']} value={formData.permissions.subBrokerActions} onChange={(e) => handlePermissionChange('subBrokerActions', e.target.value)} disabled={isViewOnly} />
                                        <PermissionRow label="Payin Allowed" options={['Yes', 'No']} value={formData.permissions.payinAllowed} onChange={(e) => handlePermissionChange('payinAllowed', e.target.value)} disabled={isViewOnly} />
                                        <PermissionRow label="Payout Allowed" options={['Yes', 'No']} value={formData.permissions.payoutAllowed} onChange={(e) => handlePermissionChange('payoutAllowed', e.target.value)} disabled={isViewOnly} />
                                        <PermissionRow label="Create Clients Allowed (Create, Update and Reset Password)" options={['Yes', 'No']} value={formData.permissions.createClientsAllowed} onChange={(e) => handlePermissionChange('createClientsAllowed', e.target.value)} disabled={isViewOnly} />
                                        <PermissionRow label="Client Tasks Allowed (Account Reset, Recalculate brokerage etc.)" options={['Yes', 'No']} value={formData.permissions.clientTasksAllowed} onChange={(e) => handlePermissionChange('clientTasksAllowed', e.target.value)} disabled={isViewOnly} />
                                        <PermissionRow label="Trade Activity Allowed (Create, Update, Restore, Delete Trade)" options={['Yes', 'No']} value={formData.permissions.tradeActivityAllowed} onChange={(e) => handlePermissionChange('tradeActivityAllowed', e.target.value)} disabled={isViewOnly} />
                                        <PermissionRow label="Notifications Allowed" options={['Yes', 'No']} value={formData.permissions.notificationsAllowed} onChange={(e) => handlePermissionChange('notificationsAllowed', e.target.value)} disabled={isViewOnly} />
                                        <PermissionRow label="Can View Backup Data" options={['Yes', 'No']} value={formData.permissions.canViewBackupData || 'No'} onChange={(e) => handlePermissionChange('canViewBackupData', e.target.value)} disabled={isViewOnly} />
                                    </div>
                                </div>

                                <hr className="border-[#4f5361]/20 my-8" />
                            </>
                        )}

                        {/* 4. TRADING SEGMENTS - IN EXACT ORDER */}
                        <div className="flex flex-col w-full">
                            <div className="order-1 md:order-1 w-full">
                                <SegmentBlock title="COMEX Commodity Future" segmentKey="comex_commodity_future" config={{ hasBrokerageType: true, hasExposureType: true }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                            <div className="order-2 md:order-2 w-full">
                                <SegmentBlock title="COMEX Currency Future" segmentKey="comex_currency_future" config={{ hasBrokerageType: true, hasExposureType: true }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                            <div className="order-3 md:order-3 w-full">
                                <SegmentBlock title="COMEX Crypto Future" segmentKey="comex_crypto_future" config={{ hasBrokerageType: true, hasExposureType: true }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                            <div className="order-4 md:order-4 w-full">
                                <SegmentBlock title="NSE ALL Future" segmentKey="nse_all_future" config={{ hasBrokerageType: false, hasExposureType: false }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                            <div className="order-6 md:order-5 w-full">
                                <SegmentBlock title="NSE Equity Options (Shortselling)" segmentKey="nse_equity_opt_short" config={{ hasBrokerageType: true, hasExposureType: false }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                            <div className="order-5 md:order-6 w-full">
                                <SegmentBlock title="NSE Equity Options" segmentKey="nse_equity_opt" config={{ hasBrokerageType: true, hasExposureType: false }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                            <div className="order-8 md:order-7 w-full">
                                <SegmentBlock title="NSE Index Options (Shortselling)" segmentKey="nse_index_opt_short" config={{ hasBrokerageType: true, hasExposureType: false }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                            <div className="order-7 md:order-8 w-full">
                                <SegmentBlock title="NSE Index Options" segmentKey="nse_index_opt" config={{ hasBrokerageType: true, hasExposureType: false }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                            <div className="order-9 md:order-9 w-full">
                                <SegmentBlock title="NSE Equity Spot" segmentKey="nse_equity_spot" config={{ hasBrokerageType: false, hasExposureType: false }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                            <div className="order-10 md:order-10 w-full">
                                <SegmentBlock title="MCX ALL Future" segmentKey="mcx_all_future" config={{ hasBrokerageType: true, hasExposureType: true }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                            <div className="order-12 md:order-11 w-full">
                                <SegmentBlock title="MCX Commodity Options (Shortselling)" segmentKey="mcx_comm_opt_short" config={{ hasBrokerageType: true, hasExposureType: false }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                            <div className="order-11 md:order-12 w-full">
                                <SegmentBlock title="MCX Commodity Options" segmentKey="mcx_comm_opt" config={{ hasBrokerageType: true, hasExposureType: false }} formData={formData} handleSegmentChange={handleSegmentChange} isViewOnly={isViewOnly} />
                                <hr className="border-[#4f5361]/20 my-8" />
                            </div>
                        </div>

                        {/* 5. MCX LOT WISE MARGINS */}
                        <div className="mb-6">
                            <SectionHeader title="MCX Lot wise Margins" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 px-8 mt-4">
                                {Object.keys(formData.mcxMargins).map(scrip => (
                                    <React.Fragment key={scrip}>
                                        <InputGroup
                                            label={`${scrip} INTRADAY`}
                                            name={`mcx_margin_${scrip}_intraday`}
                                            value={formData.mcxMargins[scrip].intraday}
                                            disabled={isViewOnly}
                                            onChange={(e) => handleMcxMarginChange(scrip, 'intraday', e.target.value)}
                                        />
                                        <InputGroup
                                            label={`${scrip} HOLDING`}
                                            name={`mcx_margin_${scrip}_holding`}
                                            value={formData.mcxMargins[scrip].holding}
                                            disabled={isViewOnly}
                                            onChange={(e) => handleMcxMarginChange(scrip, 'holding', e.target.value)}
                                        />
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <hr className="border-[#4f5361]/20 my-8" />

                        {/* 6. MCX LOT WISE BROKERAGE */}
                        <div className="mb-6">
                            <SectionHeader title="MCX Lot wise Brokerage" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 px-8 mt-4">
                                {Object.keys(formData.mcxBrokerage).map(scrip => (
                                    <InputGroup
                                        key={scrip}
                                        label={`${scrip}:`}
                                        name={`mcx_brokerage_${scrip}`}
                                        value={formData.mcxBrokerage[scrip]}
                                        disabled={isViewOnly}
                                        onChange={(e) => handleMcxBrokerageChange(scrip, e.target.value)}
                                    />
                                ))}
                            </div>
                        </div>

                        <hr className="border-[#4f5361]/20 my-8" />

                        {/* 7. SWAP CHARGES RATE */}
                        <div className="mb-6">
                            <SectionHeader title="Swap Charges (Overnight Holding)" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 px-8 mt-4">
                                <InputGroup
                                    label="Daily Swap Rate (per lot)"
                                    name="swapRate"
                                    type="number"
                                    value={formData.swapRate}
                                    onChange={handleChange}
                                    disabled={isViewOnly}
                                    placeholder="5"
                                    subtext="Example: 5 means ₹5 per lot per day for overnight holdings"
                                />
                            </div>
                        </div>

                        <hr className="border-[#4f5361]/20 my-8" />

                        {/* 8. TRANSACTION PASSWORD */}
                        <div className="mb-6">
                            <SectionHeader title="Transaction Password" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 px-8 mt-4">
                                <InputGroup
                                    label="Your Transaction Password"
                                    type="password"
                                    name="finalTransactionPassword"
                                    value={formData.finalTransactionPassword}
                                    onChange={handleChange}
                                    disabled={isViewOnly}
                                />
                            </div>
                        </div>

                        {/* CREATE/UPDATE BUTTON */}
                        <div className="flex flex-wrap justify-start px-2 sm:px-8 mt-12 pb-10 gap-3">
                            {!isViewOnly && (
                                <button
                                    type="submit"
                                    disabled={loading || fetching}
                                    className="bg-[#4caf50] hover:bg-[#43a047] text-white px-6 sm:px-12 py-3 rounded shadow-lg shadow-green-900/40 font-bold text-xs tracking-widest uppercase transition-all disabled:opacity-60 flex-1 sm:flex-none"
                                >
                                    {loading ? 'PROCESSING...' : (isEditMode ? 'UPDATE BROKER' : 'CREATE BROKER')}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onBack}
                                className="bg-[#808080] hover:bg-[#707070] text-white px-6 sm:px-12 py-3 rounded font-bold text-xs tracking-widest uppercase transition-all flex-1 sm:flex-none"
                            >
                                {isViewOnly ? 'BACK' : 'CANCEL'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AddBrokerForm;



