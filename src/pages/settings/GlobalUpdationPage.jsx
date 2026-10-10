import React, { useState, useEffect } from 'react';
import {
    Users, LayoutGrid, Settings2, ShieldCheck, AlertTriangle, ArrowRight,
    CheckCircle2, Search, Activity, RotateCcw, ShieldAlert, Cpu, Lock, UserCheck,
    Database, MapPin, X, Info, Layers, Loader2, Clock, History
} from 'lucide-react';
import { globalBatchUpdate, getClients, getSegmentValues, resetSegmentValues, getAuditLog } from '../../services/api';

const GlobalUpdationPage = () => {
    const [step, setStep] = useState(1);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [execResult, setExecResult] = useState(null);

    // Sidebar & History state
    const [activeSegment, setActiveSegment] = useState('MCX');
    const [segmentValues, setSegmentValues] = useState([]);
    const [isSegmentLoading, setIsSegmentLoading] = useState(false);
    const [isResetting, setIsResetting]     = useState(false);
    const [resetParameter, setResetParameter] = useState('Brokerage');
    const [auditLogList, setAuditLogList]   = useState([]);
    const [isLoadingAudit, setIsLoadingAudit] = useState(false);
    
    // User/Broker Data
    const [usersList, setUsersList] = useState([]);
    const [brokersList, setBrokersList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [selection, setSelection] = useState({
        target: 'All Users',
        selectedUsers: [],
        selectedBrokerId: '',
        segment: 'MCX',
        parameter: 'Brokerage', // Category: 'Brokerage' | 'Margin' | 'Max Lot' | 'Timer & Hold Rules'
        
        // Category 1: Brokerage
        brokerageType: 'per_crore', // 'per_crore' or 'per_lot'
        generalBrokerage: '800',
        lotBrokerage: {},

        // Options Brokerages
        optionsIndexBrokerageType: 'per_lot',
        optionsIndexBrokerage: '20.00',
        optionsEquityBrokerageType: 'per_lot',
        optionsEquityBrokerage: '20.00',
        optionsMcxBrokerageType: 'per_lot',
        optionsMcxBrokerage: '20.00',

        // Category 2: Margin
        marginType: 'Exposure', // 'Exposure' or 'Lot'
        intradayExposure: '500',
        holdingExposure: '100',
        lotConfigs: {},

        // Options Margins
        optionsIndexIntraday: '5',
        optionsIndexHolding: '2.00',
        optionsEquityIntraday: '5',
        optionsEquityHolding: '2',
        optionsMcxIntraday: '5',
        optionsMcxHolding: '2',

        // Category 3: Max Lot / Position Limits
        minLot: '1',
        maxLot: '100',
        maxLotScrip: '1000',
        maxSizeAll: '5000',
        
        // Index Specific Limits for Equity/Options
        minIndexLot: '1',
        maxIndexLot: '100',
        maxIndexScrip: '500',
        maxSizeAllIndex: '2000',

        // Options Specific Limits
        optionsEquityMinLot: '0',
        optionsEquityMaxLot: '50',
        optionsEquityMaxScrip: '200',
        optionsMaxEquitySizeAll: '200',

        optionsIndexMinLot: '0',
        optionsIndexMaxLot: '20',
        optionsIndexMaxScrip: '200',
        optionsMaxIndexSizeAll: '200',

        optionsMcxMinLot: '0',
        optionsMcxMaxLot: '50',
        optionsMcxMaxScrip: '200',
        optionsMaxMcxSizeAll: '200',

        // Category 4: Timer & Profit Hold Rules
        minTimeToBookProfit: '50',
        scalpingStopLoss: 'Disabled', // 'Enabled' or 'Disabled'

        newValue: ''
    });

    const mcxScripts = [
        'BULLDEX', 'GOLD', 'SILVER', 'CRUDEOIL', 'CRUDEOIL MINI', 'COPPER', 'NICKEL', 'ZINC',
        'ZINCMINI', 'LEADMINI', 'ALUMINIUM', 'ALUMINI', 'NATURALGAS', 'NATURALGAS MINI',
        'MENTHAOIL', 'COTTON', 'GOLDM', 'SILVER MIC'
    ];

    const comexScripts = [
        'XAU/USD', 'XAG/USD', 'USOIL', 'NGAS', 'COPPER',
        'XAUUSDM', 'XAGUSDM', 'USOILM', 'NGASM', 'COPPERM'
    ];

    const forexScripts = ['USD/INR', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/CAD', 'EUR/USD'];

    const cryptoScripts = ['BTC/USD', 'ETH/USD', 'BNB/USD', 'SOL/USD', 'XRP/USD', 'ADA/USD', 'DOGE/USD', 'DOT/USD', 'AVAX/USD'];

    const getSegmentScripts = (seg) => {
        if (seg === 'Comex') return comexScripts;
        if (seg === 'Forex') return forexScripts;
        if (seg === 'Crypto') return cryptoScripts;
        return mcxScripts;
    };

    const loadAuditHistory = async () => {
        setIsLoadingAudit(true);
        try {
            const data = await getAuditLog();
            setAuditLogList(data?.rows || (Array.isArray(data) ? data : []));
        } catch (e) {
            console.error('Failed to load audit history:', e);
        } finally {
            setIsLoadingAudit(false);
        }
    };

    React.useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [tradersRes, brokersRes] = await Promise.allSettled([
                    getClients({ role: 'TRADER' }),
                    getClients({ role: 'BROKER' }),
                ]);
                if (tradersRes.status === 'fulfilled') setUsersList(tradersRes.value || []);
                if (brokersRes.status === 'fulfilled') setBrokersList(brokersRes.value || []);
                
                const initialLotConfigs = {};
                const initialLotBrokerage = {};
                mcxScripts.concat(comexScripts, forexScripts, cryptoScripts).forEach(s => {
                    initialLotConfigs[s] = { INTRADAY: '1000', HOLDING: '1000', LOT: '1' };
                    initialLotBrokerage[s] = '100.00';
                });
                setSelection(prev => ({ ...prev, lotConfigs: initialLotConfigs, lotBrokerage: initialLotBrokerage }));
                loadAuditHistory();
            } catch (err) {
                console.error('Failed to load batch data:', err);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        setIsSegmentLoading(true);
        getSegmentValues(activeSegment)
            .then(data => setSegmentValues(data || []))
            .catch(() => {})
            .finally(() => setIsSegmentLoading(false));
    }, [activeSegment]);

    const buildConfigUpdatesPayload = () => {
        const seg = selection.segment;
        const p = selection.parameter;
        const updates = {};

        if (p === 'Brokerage') {
            if (seg === 'MCX') {
                updates.mcxBrokerageType = selection.brokerageType;
                updates.mcxBrokerage = selection.generalBrokerage;
                updates.mcxLotBrokerage = selection.lotBrokerage;
            } else if (seg === 'Equity') {
                updates.equityBrokerage = selection.generalBrokerage;
            } else if (seg === 'Options') {
                updates.optionsIndexBrokerageType = selection.optionsIndexBrokerageType;
                updates.optionsIndexBrokerage = selection.optionsIndexBrokerage;
                updates.optionsEquityBrokerageType = selection.optionsEquityBrokerageType;
                updates.optionsEquityBrokerage = selection.optionsEquityBrokerage;
                updates.optionsMcxBrokerageType = selection.optionsMcxBrokerageType;
                updates.optionsMcxBrokerage = selection.optionsMcxBrokerage;
            } else if (['Comex', 'Forex', 'Crypto'].includes(seg)) {
                const cfgKey = seg.toLowerCase() + 'Config';
                updates[cfgKey] = {
                    brokerage: selection.generalBrokerage,
                    brokerageType: selection.brokerageType
                };
            }
        } else if (p === 'Margin') {
            if (seg === 'MCX') {
                updates.mcxExposureType = selection.marginType === 'Exposure' ? 'per_turnover' : 'per_lot';
                updates.mcxIntradayMargin = selection.intradayExposure;
                updates.mcxHoldingMargin = selection.holdingExposure;
                updates.mcxLotMargins = selection.lotConfigs;
            } else if (seg === 'Equity') {
                updates.equityIntradayMargin = selection.intradayExposure;
                updates.equityHoldingMargin = selection.holdingExposure;
            } else if (seg === 'Options') {
                updates.optionsIndexIntraday = selection.optionsIndexIntraday;
                updates.optionsIndexHolding = selection.optionsIndexHolding;
                updates.optionsEquityIntraday = selection.optionsEquityIntraday;
                updates.optionsEquityHolding = selection.optionsEquityHolding;
                updates.optionsMcxIntraday = selection.optionsMcxIntraday;
                updates.optionsMcxHolding = selection.optionsMcxHolding;
            } else if (['Comex', 'Forex', 'Crypto'].includes(seg)) {
                const cfgKey = seg.toLowerCase() + 'Config';
                updates[cfgKey] = {
                    exposureType: selection.marginType === 'Exposure' ? 'per_crore' : 'per_lot',
                    intradayMargin: selection.intradayExposure,
                    holdingMargin: selection.holdingExposure,
                    lotMargins: selection.lotConfigs
                };
            }
        } else if (p === 'Max Lot') {
            if (seg === 'MCX') {
                updates.mcxMinLot = selection.minLot;
                updates.mcxMaxLot = selection.maxLot;
                updates.mcxMaxLotScrip = selection.maxLotScrip;
                updates.mcxMaxSizeAll = selection.maxSizeAll;
                updates.mcxLotMargins = selection.lotConfigs;
            } else if (seg === 'Equity') {
                updates.equityMinLot = selection.minLot;
                updates.equityMaxLot = selection.maxLot;
                updates.equityMinIndexLot = selection.minIndexLot;
                updates.equityMaxIndexLot = selection.maxIndexLot;
                updates.equityMaxScrip = selection.maxLotScrip;
                updates.equityMaxIndexScrip = selection.maxIndexScrip;
                updates.equityMaxSizeAll = selection.maxSizeAll;
                updates.equityMaxSizeAllIndex = selection.maxSizeAllIndex;
            } else if (seg === 'Options') {
                updates.optionsIndexMinLot = selection.optionsIndexMinLot;
                updates.optionsIndexMaxLot = selection.optionsIndexMaxLot;
                updates.optionsIndexMaxScrip = selection.optionsIndexMaxScrip;
                updates.optionsMaxIndexSizeAll = selection.optionsMaxIndexSizeAll;

                updates.optionsEquityMinLot = selection.optionsEquityMinLot;
                updates.optionsEquityMaxLot = selection.optionsEquityMaxLot;
                updates.optionsEquityMaxScrip = selection.optionsEquityMaxScrip;
                updates.optionsMaxEquitySizeAll = selection.optionsMaxEquitySizeAll;

                updates.optionsMcxMinLot = selection.optionsMcxMinLot;
                updates.optionsMcxMaxLot = selection.optionsMcxMaxLot;
                updates.optionsMcxMaxScrip = selection.optionsMcxMaxScrip;
                updates.optionsMaxMcxSizeAll = selection.optionsMaxMcxSizeAll;
            } else if (['Comex', 'Forex', 'Crypto'].includes(seg)) {
                const cfgKey = seg.toLowerCase() + 'Config';
                updates[cfgKey] = {
                    minLot: selection.minLot,
                    maxLot: selection.maxLot,
                    maxLotScrip: selection.maxLotScrip,
                    maxSizeAll: selection.maxSizeAll,
                    lotMargins: selection.lotConfigs
                };
            }
        } else if (p === 'Timer & Hold Rules') {
            if (seg === 'MCX') {
                updates.mcxMinTimeToBookProfit = selection.minTimeToBookProfit;
                updates.mcxScalpingStopLoss = selection.scalpingStopLoss;
            } else if (seg === 'Equity') {
                updates.equityMinTimeToBookProfit = selection.minTimeToBookProfit;
                updates.equityScalpingStopLoss = selection.scalpingStopLoss;
            } else if (seg === 'Options') {
                updates.optionsMinTimeToBookProfit = selection.minTimeToBookProfit;
                updates.optionsScalpingStopLoss = selection.scalpingStopLoss;
            } else if (['Comex', 'Forex', 'Crypto'].includes(seg)) {
                const cfgKey = seg.toLowerCase() + 'Config';
                updates[cfgKey] = {
                    minTimeToBookProfit: selection.minTimeToBookProfit,
                    scalpingStopLoss: selection.scalpingStopLoss
                };
            }
        }

        return updates;
    };

    const handleExecuteUpdate = async () => {
        setIsExecuting(true);
        try {
            const configUpdates = buildConfigUpdatesPayload();
            const data = {
                target: selection.target,
                targetIds: selection.target === 'Single user' || selection.target === 'Multiple users' ? selection.selectedUsers : [],
                brokerId: selection.target === 'Broker-wise users' ? selection.selectedBrokerId : null,
                segment: selection.segment,
                parameter: selection.parameter,
                marginType: selection.marginType,
                value: selection.newValue || selection.generalBrokerage || selection.minTimeToBookProfit,
                configUpdates
            };
            const result = await globalBatchUpdate(data);
            setExecResult({ success: true, message: result?.message || 'Update applied successfully' });
            setShowConfirmModal(false);
            
            getSegmentValues(selection.segment).then(d => setSegmentValues(d || [])).catch(() => {});
            loadAuditHistory();
            setTimeout(() => {
                setStep(1);
                setExecResult(null);
            }, 3000);
        } catch (err) {
            setExecResult({ success: false, message: err.message || 'Execution failed' });
        } finally {
            setIsExecuting(false);
        }
    };

    const steps = [
        { id: 1, title: 'Select Target', icon: Users, desc: 'Choose users' },
        { id: 2, title: 'Choose Segment', icon: LayoutGrid, desc: 'Select market' },
        { id: 3, title: 'Set Value', icon: Settings2, desc: 'Enter value' },
        { id: 4, title: 'Review & Execute', icon: Activity, desc: 'Confirm changes' }
    ];

    const targets = ['All Users', 'Single user', 'Multiple users', 'Broker-wise users'];
    const segments = ['MCX', 'Equity', 'Options', 'Comex', 'Forex', 'Crypto'];
    const parameters = ['Brokerage', 'Margin', 'Max Lot', 'Timer & Hold Rules'];

    const handleSimulation = () => {
        if (selection.target === 'Single user' && selection.selectedUsers.length === 0) return alert('Select a user');
        if (selection.target === 'Multiple users' && selection.selectedUsers.length === 0) return alert('Select users');
        if (selection.target === 'Broker-wise users' && !selection.selectedBrokerId) return alert('Select a broker');

        setIsSimulating(true);
        setTimeout(() => {
            setIsSimulating(false);
            setStep(4);
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-fade-in custom-scrollbar bg-[#1a2035] min-h-screen px-3 sm:px-4 md:px-6 py-4">
            {/* Header */}
            <div className="bg-[#202940] rounded-xl border border-slate-700/50 shadow-lg overflow-hidden">
                <div className="relative p-6 md:p-8">
                    <div className="flex items-start gap-4 md:gap-6">
                        <div className="p-3 bg-[#4CAF50]/10 rounded-lg border border-[#4CAF50]/20 flex-shrink-0">
                            <ShieldCheck className="w-6 h-6 text-[#4CAF50]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Global Parameters Update</h2>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
                                Apply configuration changes across multiple users and market segments. Synchronized directly with Trading Client configuration fields.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stepper */}
            <div className="relative flex items-center justify-between gap-2 md:gap-8 px-2 md:px-6">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-700/30 z-0 rounded-full" />
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#4CAF50] to-[#01B4EA] z-0 transition-all duration-500 rounded-full"
                    style={{ width: `calc(${((step - 1) / 3) * 100}% + 2%)` }}
                />

                {steps.map((s) => {
                    const isDone    = step > s.id;
                    const isActive  = step === s.id;
                    return (
                        <div
                            key={s.id}
                            onClick={() => isDone && setStep(s.id)}
                            className={`relative z-10 flex flex-col items-center gap-2 transition-all duration-500 ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 flex-shrink-0
                                ${isActive  ? 'bg-[#01B4EA] border-[#01B4EA] shadow-lg scale-105'
                                : isDone    ? 'bg-[#4CAF50] border-[#4CAF50]'
                                :             'bg-slate-700 border-slate-600'}`}>
                                {isDone
                                    ? <CheckCircle2 className="w-6 h-6 text-white" />
                                    : <s.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/30'}`} />
                                }
                            </div>
                            <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border
                                ${isActive ? 'bg-[#01B4EA] border-[#01B4EA] text-white' : isDone ? 'bg-[#4CAF50] border-[#4CAF50] text-white' : 'bg-[#202940] border-white/10 text-slate-600'}`}>
                                {s.id}
                            </div>
                            <div className="text-center">
                                <p className={`text-xs md:text-sm font-semibold transition-colors
                                    ${isActive ? 'text-[#01B4EA]' : isDone ? 'text-[#4CAF50]' : 'text-slate-500'}`}>
                                    {s.title}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Execution Core */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 card-panel relative" style={{ overflow: 'hidden', borderRadius: '16px' }}>
                    <div className="p-4 sm:p-6 md:p-12">

                        {/* Step 1 */}
                        {step === 1 && (
                            <div className="space-y-10 animate-fade-in">
                                <div className="space-y-2 mb-8">
                                    <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                                        <Users className="w-5 h-5 text-[#4CAF50]" /> Select Target Users
                                    </h3>
                                    <p className="text-slate-400 text-sm">Choose which users will receive this batch update</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {targets.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => { setSelection({ ...selection, target: t, selectedUsers: [], selectedBrokerId: '' }); }}
                                            className={`p-6 rounded-2xl text-left border transition-all flex flex-col gap-3 group relative overflow-hidden ${selection.target === t ? 'bg-[#01B4EA]/10 border-[#01B4EA] shadow-xl' : 'bg-[#151c2c] border-white/5 hover:border-white/20 hover:bg-[#1a2333]'}`}
                                        >
                                            <div className="flex justify-between items-center w-full relative z-10">
                                                <span className="text-white font-black text-lg tracking-tight">{t}</span>
                                                <div className={`w-3 h-3 rounded-full ${selection.target === t ? 'bg-[#01B4EA] animate-pulse' : 'bg-white/5'}`}></div>
                                            </div>
                                            <p className="text-slate-500 text-[10px] font-bold italic opacity-70 relative z-10">Target scope focused on {t.toLowerCase()} cluster.</p>
                                        </button>
                                    ))}
                                </div>

                                {selection.target === 'Single user' && (
                                    <div className="p-6 bg-[#151c2c] rounded-2xl border border-white/5 space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Select Client</label>
                                        <input
                                            type="text"
                                            placeholder="Search by username or name..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full bg-[#202940] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#01B4EA]/50 placeholder:text-slate-600"
                                        />
                                        <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                                            {usersList.filter(u => !searchQuery || u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                                                <div
                                                    key={u.id}
                                                    onClick={() => setSelection({ ...selection, selectedUsers: [u.id] })}
                                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${selection.selectedUsers[0] === u.id ? 'bg-[#01B4EA]/10 border-[#01B4EA]/50 text-white' : 'bg-[#202940] border-white/5 text-slate-300 hover:border-white/20'}`}
                                                >
                                                    <div>
                                                        <p className="text-sm font-black">{u.username}</p>
                                                        <p className="text-[10px] text-slate-500">{u.full_name}</p>
                                                    </div>
                                                    {selection.selectedUsers[0] === u.id && <CheckCircle2 className="w-4 h-4 text-[#01B4EA]" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selection.target === 'Broker-wise users' && (
                                    <div className="p-6 bg-[#151c2c] rounded-2xl border border-white/5 space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Select Broker</label>
                                        <select 
                                            className="w-full bg-[#202940] border border-white/10 rounded-xl p-3 text-white font-bold outline-none"
                                            value={selection.selectedBrokerId}
                                            onChange={(e) => setSelection({ ...selection, selectedBrokerId: e.target.value })}
                                        >
                                            <option value="">Choose a broker...</option>
                                            {brokersList.map(b => <option key={b.id} value={b.id}>{b.username} - {b.full_name}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <button 
                                        onClick={() => setStep(2)}
                                        className="bg-[#01B4EA] text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#01B4EA]/20 hover:scale-[1.02] transition-all"
                                    >
                                        Next Segment →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2 */}
                        {step === 2 && (
                            <div className="space-y-10 animate-fade-in">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                        <Layers className="w-6 h-6 text-[#4CAF50]" /> Market Segment Selection
                                    </h3>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Select the market segment to update</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                                    {segments.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => { setSelection({ ...selection, segment: s }); }}
                                            className={`p-10 rounded-2xl border transition-all flex flex-col items-center gap-6 group hover:scale-[1.05] relative overflow-hidden ${selection.segment === s ? 'bg-[#4CAF50]/10 border-[#4CAF50] shadow-2xl' : 'bg-[#151c2c] border-white/5 hover:border-white/10'}`}
                                        >
                                            <div className={`p-6 rounded-2xl transition-all duration-500 ${selection.segment === s ? 'bg-[#4CAF50] text-white shadow-xl' : 'bg-[#202940] text-slate-600 group-hover:text-slate-300'}`}>
                                                <LayoutGrid className="w-8 h-8" />
                                            </div>
                                            <span className="text-white font-black text-xs uppercase tracking-[0.3em] font-mono">{s}</span>
                                        </button>
                                    ))}
                                </div>
                                {selection.segment && (
                                    <div className="pt-10 border-t border-white/10">
                                        <button
                                            onClick={() => setStep(3)}
                                            className="w-full bg-[#4CAF50] hover:bg-green-600 text-white font-bold py-4 rounded-lg transition-all shadow-lg"
                                        >
                                            Continue to Configuration →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Categorized Configuration Form */}
                        {step === 3 && (
                            <div className="space-y-8 animate-fade-in text-slate-300">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-[#01B4EA] tracking-tight flex items-center gap-3">
                                        <Settings2 className="w-6 h-6 text-[#01B4EA]" /> Configuration Logic ({selection.segment})
                                    </h3>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Select Category and set universal values</p>
                                </div>

                                {/* Category Selector Buttons */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {parameters.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setSelection({ ...selection, parameter: p })}
                                            className={`p-4 rounded-xl text-center border transition-all text-[10px] font-black uppercase tracking-widest ${selection.parameter === p ? 'bg-[#01B4EA] border-[#01B4EA] text-white shadow-lg' : 'bg-[#151c2c] border-white/5 text-slate-400 hover:text-white'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                {/* Category 1: BROKERAGE FORM */}
                                {selection.parameter === 'Brokerage' && (
                                    <div className="space-y-6 bg-[#151c2c] p-6 rounded-2xl border border-white/5 animate-fade-in">
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 flex items-center justify-between">
                                            <span>Brokerage Config ({selection.segment})</span>
                                            <span className="text-[10px] text-[#01B4EA] lowercase">Exact fields matching Client Edit Form</span>
                                        </h4>

                                        {/* OPTIONS SEGMENT BROKERAGES */}
                                        {selection.segment === 'Options' ? (
                                            <div className="space-y-6">
                                                {/* Index Options */}
                                                <div className="p-4 bg-[#202940]/50 rounded-xl border border-white/5 space-y-3">
                                                    <label className="text-xs font-black text-[#01B4EA] uppercase block">Index Options Brokerage</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Index Options Brokerage Type</span>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setSelection({ ...selection, optionsIndexBrokerageType: 'per_lot' })}
                                                                    className={`flex-1 p-2 rounded-lg text-xs font-bold ${selection.optionsIndexBrokerageType === 'per_lot' ? 'bg-[#01B4EA] text-white' : 'bg-[#151c2c] text-slate-400'}`}
                                                                >
                                                                    Per Lot Basis
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelection({ ...selection, optionsIndexBrokerageType: 'per_crore' })}
                                                                    className={`flex-1 p-2 rounded-lg text-xs font-bold ${selection.optionsIndexBrokerageType === 'per_crore' ? 'bg-[#01B4EA] text-white' : 'bg-[#151c2c] text-slate-400'}`}
                                                                >
                                                                    Per Crore Basis
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Index Options Brokerage</span>
                                                            <input
                                                                type="text"
                                                                className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-sm font-bold outline-none"
                                                                value={selection.optionsIndexBrokerage}
                                                                onChange={e => setSelection({ ...selection, optionsIndexBrokerage: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Equity Options */}
                                                <div className="p-4 bg-[#202940]/50 rounded-xl border border-white/5 space-y-3">
                                                    <label className="text-xs font-black text-[#01B4EA] uppercase block">Equity Options Brokerage</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Equity Options Brokerage Type</span>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setSelection({ ...selection, optionsEquityBrokerageType: 'per_lot' })}
                                                                    className={`flex-1 p-2 rounded-lg text-xs font-bold ${selection.optionsEquityBrokerageType === 'per_lot' ? 'bg-[#01B4EA] text-white' : 'bg-[#151c2c] text-slate-400'}`}
                                                                >
                                                                    Per Lot Basis
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelection({ ...selection, optionsEquityBrokerageType: 'per_crore' })}
                                                                    className={`flex-1 p-2 rounded-lg text-xs font-bold ${selection.optionsEquityBrokerageType === 'per_crore' ? 'bg-[#01B4EA] text-white' : 'bg-[#151c2c] text-slate-400'}`}
                                                                >
                                                                    Per Crore Basis
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Equity Options Brokerage</span>
                                                            <input
                                                                type="text"
                                                                className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-sm font-bold outline-none"
                                                                value={selection.optionsEquityBrokerage}
                                                                onChange={e => setSelection({ ...selection, optionsEquityBrokerage: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* MCX Options */}
                                                <div className="p-4 bg-[#202940]/50 rounded-xl border border-white/5 space-y-3">
                                                    <label className="text-xs font-black text-[#01B4EA] uppercase block">MCX Options Brokerage</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">MCX Options Brokerage Type</span>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setSelection({ ...selection, optionsMcxBrokerageType: 'per_lot' })}
                                                                    className={`flex-1 p-2 rounded-lg text-xs font-bold ${selection.optionsMcxBrokerageType === 'per_lot' ? 'bg-[#01B4EA] text-white' : 'bg-[#151c2c] text-slate-400'}`}
                                                                >
                                                                    Per Lot Basis
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelection({ ...selection, optionsMcxBrokerageType: 'per_crore' })}
                                                                    className={`flex-1 p-2 rounded-lg text-xs font-bold ${selection.optionsMcxBrokerageType === 'per_crore' ? 'bg-[#01B4EA] text-white' : 'bg-[#151c2c] text-slate-400'}`}
                                                                >
                                                                    Per Crore Basis
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">MCX Options Brokerage</span>
                                                            <input
                                                                type="text"
                                                                className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-sm font-bold outline-none"
                                                                value={selection.optionsMcxBrokerage}
                                                                onChange={e => setSelection({ ...selection, optionsMcxBrokerage: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* NON-OPTIONS BROKERAGES */
                                            <div className="space-y-6">
                                                {/* Show Type Selector ONLY for segments that support per_lot vs per_crore */}
                                                {['MCX', 'Comex', 'Forex', 'Crypto'].includes(selection.segment) ? (
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                            {selection.segment === 'MCX' ? 'Mcx Brokerage Type' : `${selection.segment} brokerage type`}
                                                        </label>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <button
                                                                onClick={() => setSelection({ ...selection, brokerageType: 'per_crore' })}
                                                                className={`p-3 rounded-xl border text-xs font-black uppercase tracking-widest ${selection.brokerageType === 'per_crore' ? 'bg-[#01B4EA]/20 border-[#01B4EA] text-[#01B4EA]' : 'bg-[#202940] border-white/5 text-slate-400'}`}
                                                            >
                                                                Per Crore Basis
                                                            </button>
                                                            <button
                                                                onClick={() => setSelection({ ...selection, brokerageType: 'per_lot' })}
                                                                className={`p-3 rounded-xl border text-xs font-black uppercase tracking-widest ${selection.brokerageType === 'per_lot' ? 'bg-[#01B4EA]/20 border-[#01B4EA] text-[#01B4EA]' : 'bg-[#202940] border-white/5 text-slate-400'}`}
                                                            >
                                                                Per Lot Basis
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* EQUITY ONLY SUPPORTS PER CRORE BASIS IN CLIENT FORM */
                                                    <div className="p-3 bg-[#202940] rounded-xl border border-white/5 text-xs text-[#01B4EA] font-bold uppercase tracking-wider">
                                                        * Equity Brokerage is strictly Per Crore Basis (Turnover based) as per Client Configuration.
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                        {selection.segment === 'MCX' ? 'MCX brokerage' : selection.segment === 'Equity' ? 'Equity Brokerage Per Crore' : `${selection.segment} brokerage`}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-[#202940] border border-white/10 rounded-xl p-4 text-white text-xl font-bold focus:outline-none focus:border-[#4CAF50]"
                                                        placeholder="e.g. 800"
                                                        value={selection.generalBrokerage}
                                                        onChange={e => setSelection({ ...selection, generalBrokerage: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Category 2: MARGIN FORM */}
                                {selection.parameter === 'Margin' && (
                                    <div className="space-y-6 bg-[#151c2c] p-6 rounded-2xl border border-white/5 animate-fade-in">
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 flex items-center justify-between">
                                            <span>Margin Config ({selection.segment})</span>
                                            <span className="text-[10px] text-[#01B4EA] lowercase">Exact fields matching Client Edit Form</span>
                                        </h4>

                                        {['MCX', 'Comex', 'Forex', 'Crypto'].includes(selection.segment) ? (
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                        {selection.segment === 'MCX' ? 'Exposure Mcx Type' : `Exposure ${selection.segment} Type`}
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => setSelection({ ...selection, marginType: 'Exposure' })}
                                                            className={`p-3 rounded-xl border text-xs font-black uppercase tracking-widest ${selection.marginType === 'Exposure' ? 'bg-[#01B4EA]/20 border-[#01B4EA] text-[#01B4EA]' : 'bg-[#202940] border-white/5 text-slate-400'}`}
                                                        >
                                                            PER TURNOVER BASIS
                                                        </button>
                                                        <button
                                                            onClick={() => setSelection({ ...selection, marginType: 'Lot' })}
                                                            className={`p-3 rounded-xl border text-xs font-black uppercase tracking-widest ${selection.marginType === 'Lot' ? 'bg-[#01B4EA]/20 border-[#01B4EA] text-[#01B4EA]' : 'bg-[#202940] border-white/5 text-slate-400'}`}
                                                        >
                                                            PER LOT BASIS
                                                        </button>
                                                    </div>
                                                </div>

                                                {selection.marginType === 'Exposure' ? (
                                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                                Intraday Exposure/Margin {selection.segment.toLowerCase()}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="w-full bg-[#202940] border border-white/10 rounded-xl p-4 text-white text-xl font-bold focus:outline-none focus:border-[#4CAF50]"
                                                                placeholder="e.g. 500"
                                                                value={selection.intradayExposure}
                                                                onChange={e => setSelection({ ...selection, intradayExposure: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                                Holding Exposure/Margin {selection.segment.toLowerCase()}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="w-full bg-[#202940] border border-white/10 rounded-xl p-4 text-white text-xl font-bold focus:outline-none focus:border-[#4CAF50]"
                                                                placeholder="e.g. 100"
                                                                value={selection.holdingExposure}
                                                                onChange={e => setSelection({ ...selection, holdingExposure: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4 pt-2">
                                                        <h5 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">
                                                            {selection.segment} Exposure Lot wise:
                                                        </h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                                            {getSegmentScripts(selection.segment).map(scrip => (
                                                                <div key={scrip} className="bg-[#202940]/50 p-3 rounded-xl border border-white/5 space-y-2">
                                                                    <label className="text-[10px] font-black text-[#01B4EA] uppercase block">{scrip}</label>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        <div>
                                                                            <span className="text-[8px] text-slate-500 uppercase block font-bold">Intraday</span>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-xs font-bold outline-none"
                                                                                placeholder="1000"
                                                                                value={selection.lotConfigs[scrip]?.INTRADAY || ''}
                                                                                onChange={(e) => setSelection({
                                                                                    ...selection,
                                                                                    lotConfigs: {
                                                                                        ...selection.lotConfigs,
                                                                                        [scrip]: { ...(selection.lotConfigs[scrip] || {}), INTRADAY: e.target.value }
                                                                                    }
                                                                                })}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[8px] text-slate-500 uppercase block font-bold">Holding</span>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-xs font-bold outline-none"
                                                                                placeholder="1000"
                                                                                value={selection.lotConfigs[scrip]?.HOLDING || ''}
                                                                                onChange={(e) => setSelection({
                                                                                    ...selection,
                                                                                    lotConfigs: {
                                                                                        ...selection.lotConfigs,
                                                                                        [scrip]: { ...(selection.lotConfigs[scrip] || {}), HOLDING: e.target.value }
                                                                                    }
                                                                                })}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[8px] text-slate-500 uppercase block font-bold">Lot</span>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-xs font-bold outline-none"
                                                                                placeholder="1"
                                                                                value={selection.lotConfigs[scrip]?.LOT || ''}
                                                                                onChange={(e) => setSelection({
                                                                                    ...selection,
                                                                                    lotConfigs: {
                                                                                        ...selection.lotConfigs,
                                                                                        [scrip]: { ...(selection.lotConfigs[scrip] || {}), LOT: e.target.value }
                                                                                    }
                                                                                })}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : selection.segment === 'Options' ? (
                                            /* OPTIONS MARGIN CONFIG */
                                            <div className="space-y-6">
                                                <div className="p-4 bg-[#202940]/50 rounded-xl border border-white/5 space-y-3">
                                                    <label className="text-xs font-black text-[#01B4EA] uppercase block">Index Options Margin</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Intraday Exposure/Margin Index Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-sm font-bold outline-none" value={selection.optionsIndexIntraday} onChange={e => setSelection({ ...selection, optionsIndexIntraday: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Holding Exposure/Margin Index Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-sm font-bold outline-none" value={selection.optionsIndexHolding} onChange={e => setSelection({ ...selection, optionsIndexHolding: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-[#202940]/50 rounded-xl border border-white/5 space-y-3">
                                                    <label className="text-xs font-black text-[#01B4EA] uppercase block">Equity Options Margin</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Intraday Exposure/Margin Equity Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-sm font-bold outline-none" value={selection.optionsEquityIntraday} onChange={e => setSelection({ ...selection, optionsEquityIntraday: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Holding Exposure/Margin Equity Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-sm font-bold outline-none" value={selection.optionsEquityHolding} onChange={e => setSelection({ ...selection, optionsEquityHolding: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-[#202940]/50 rounded-xl border border-white/5 space-y-3">
                                                    <label className="text-xs font-black text-[#01B4EA] uppercase block">MCX Options Margin</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Intraday Exposure/Margin MCX Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-sm font-bold outline-none" value={selection.optionsMcxIntraday} onChange={e => setSelection({ ...selection, optionsMcxIntraday: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Holding Exposure/Margin MCX Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-sm font-bold outline-none" value={selection.optionsMcxHolding} onChange={e => setSelection({ ...selection, optionsMcxHolding: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* GENERAL EXPOSURE MARGINS (EQUITY) */
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                        Intraday Exposure/Margin Equity
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-[#202940] border border-white/10 rounded-xl p-4 text-white text-xl font-bold focus:outline-none focus:border-[#4CAF50]"
                                                        placeholder="e.g. 500"
                                                        value={selection.intradayExposure}
                                                        onChange={e => setSelection({ ...selection, intradayExposure: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                        Holding Exposure/Margin Equity
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-[#202940] border border-white/10 rounded-xl p-4 text-white text-xl font-bold focus:outline-none focus:border-[#4CAF50]"
                                                        placeholder="e.g. 100"
                                                        value={selection.holdingExposure}
                                                        onChange={e => setSelection({ ...selection, holdingExposure: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Category 3: MAX LOT & LIMITS FORM */}
                                {selection.parameter === 'Max Lot' && (
                                    <div className="space-y-6 bg-[#151c2c] p-6 rounded-2xl border border-white/5 animate-fade-in">
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 flex items-center justify-between">
                                            <span>Quantity & Lot Size Limits ({selection.segment})</span>
                                            <span className="text-[10px] text-[#01B4EA] lowercase">Exact fields matching Client Edit Form</span>
                                        </h4>

                                        {selection.segment === 'Equity' ? (
                                            /* EQUITY SEGMENT LIMITS (Stock vs Index) */
                                            <div className="space-y-6">
                                                <div className="p-4 bg-[#202940]/50 rounded-xl border border-white/5 space-y-4">
                                                    <label className="text-xs font-black text-[#01B4EA] uppercase block">Equity Stock Futures Limits</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Minimum lot size required per single trade of Equity</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.minLot} onChange={e => setSelection({ ...selection, minLot: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Maximum lot size allowed per single trade of Equity</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.maxLot} onChange={e => setSelection({ ...selection, maxLot: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Maximum lot size allowed per script of Equity to be actively open at a time</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.maxLotScrip} onChange={e => setSelection({ ...selection, maxLotScrip: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Max Size All Equity</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.maxSizeAll} onChange={e => setSelection({ ...selection, maxSizeAll: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-[#202940]/50 rounded-xl border border-white/5 space-y-4">
                                                    <label className="text-xs font-black text-[#01B4EA] uppercase block">Equity Index Futures Limits</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Minimum lot size required per single trade of Equity INDEX</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.minIndexLot} onChange={e => setSelection({ ...selection, minIndexLot: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Maximum lot size allowed per single trade of Equity INDEX</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.maxIndexLot} onChange={e => setSelection({ ...selection, maxIndexLot: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Maximum lot size allowed per script of Equity INDEX to be actively open at a time</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.maxIndexScrip} onChange={e => setSelection({ ...selection, maxIndexScrip: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Max Size All Index</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.maxSizeAllIndex} onChange={e => setSelection({ ...selection, maxSizeAllIndex: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : selection.segment === 'Options' ? (
                                            /* OPTIONS SEGMENT LIMITS (Index vs Equity vs MCX) */
                                            <div className="space-y-6">
                                                <div className="p-4 bg-[#202940]/50 rounded-xl border border-white/5 space-y-4">
                                                    <label className="text-xs font-black text-[#01B4EA] uppercase block">Index Options Limits</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Minimum lot size required per single trade of Index Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsIndexMinLot} onChange={e => setSelection({ ...selection, optionsIndexMinLot: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Maximum lot size allowed per single trade of Index Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsIndexMaxLot} onChange={e => setSelection({ ...selection, optionsIndexMaxLot: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Maximum lot size allowed per script of Index Options to be actively open at a time</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsIndexMaxScrip} onChange={e => setSelection({ ...selection, optionsIndexMaxScrip: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Max Size All Index Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsMaxIndexSizeAll} onChange={e => setSelection({ ...selection, optionsMaxIndexSizeAll: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-[#202940]/50 rounded-xl border border-white/5 space-y-4">
                                                    <label className="text-xs font-black text-[#01B4EA] uppercase block">Stock/Equity Options Limits</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Minimum lot size required per single trade of Equity Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsEquityMinLot} onChange={e => setSelection({ ...selection, optionsEquityMinLot: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Maximum lot size allowed per single trade of Equity Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsEquityMaxLot} onChange={e => setSelection({ ...selection, optionsEquityMaxLot: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Maximum lot size allowed per script of Equity Options to be actively open at a time</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsEquityMaxScrip} onChange={e => setSelection({ ...selection, optionsEquityMaxScrip: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Max Size All Equity Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsMaxEquitySizeAll} onChange={e => setSelection({ ...selection, optionsMaxEquitySizeAll: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-[#202940]/50 rounded-xl border border-white/5 space-y-4">
                                                    <label className="text-xs font-black text-[#01B4EA] uppercase block">MCX Options Limits</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Minimum lot size required per single trade of MCX Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsMcxMinLot} onChange={e => setSelection({ ...selection, optionsMcxMinLot: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Maximum lot size allowed per single trade of MCX Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsMcxMaxLot} onChange={e => setSelection({ ...selection, optionsMcxMaxLot: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Maximum lot size allowed per script of MCX Options to be actively open at a time</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsMcxMaxScrip} onChange={e => setSelection({ ...selection, optionsMcxMaxScrip: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Max Size All MCX Options</span>
                                                            <input type="text" className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-3 text-white text-sm font-bold outline-none" value={selection.optionsMaxMcxSizeAll} onChange={e => setSelection({ ...selection, optionsMaxMcxSizeAll: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* GENERAL LOT LIMITS (MCX / COMEX / FOREX / CRYPTO) */
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                        Minimum lot size required per single trade of {selection.segment.toLowerCase()}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-[#202940] border border-white/10 rounded-xl p-3 text-white text-lg font-bold focus:outline-none focus:border-[#4CAF50]"
                                                        placeholder="e.g. 1"
                                                        value={selection.minLot}
                                                        onChange={e => setSelection({ ...selection, minLot: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                        Maximum lot size allowed per single trade of {selection.segment.toLowerCase()}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-[#202940] border border-white/10 rounded-xl p-3 text-white text-lg font-bold focus:outline-none focus:border-[#4CAF50]"
                                                        placeholder="e.g. 100"
                                                        value={selection.maxLot}
                                                        onChange={e => setSelection({ ...selection, maxLot: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                        Maximum lot size allowed per script of {selection.segment.toLowerCase()} to be actively open at a time
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-[#202940] border border-white/10 rounded-xl p-3 text-white text-lg font-bold focus:outline-none focus:border-[#4CAF50]"
                                                        placeholder="e.g. 1000"
                                                        value={selection.maxLotScrip}
                                                        onChange={e => setSelection({ ...selection, maxLotScrip: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                        {selection.segment === 'MCX' ? 'Max Size All Commodity' : `Max Size All ${selection.segment.toLowerCase()}`}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-[#202940] border border-white/10 rounded-xl p-3 text-white text-lg font-bold focus:outline-none focus:border-[#4CAF50]"
                                                        placeholder="e.g. 5000"
                                                        value={selection.maxSizeAll}
                                                        onChange={e => setSelection({ ...selection, maxSizeAll: e.target.value })}
                                                    />
                                                </div>

                                                {/* SCRIP-WISE MAX LOTS / POSITION LIMITS GRID FOR MCX, COMEX, FOREX, CRYPTO */}
                                                {['MCX', 'Comex', 'Forex', 'Crypto'].includes(selection.segment) && (
                                                    <div className="col-span-full space-y-4 pt-4 border-t border-white/10">
                                                        <h5 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">
                                                            {selection.segment} Scrip-wise MAX LOTS (Position Limit):
                                                        </h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                                            {getSegmentScripts(selection.segment).map(scrip => (
                                                                <div key={scrip} className="bg-[#202940]/50 p-3 rounded-xl border border-white/5 space-y-2">
                                                                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                                                        {scrip} MAX LOTS (Position Limit)
                                                                    </span>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full bg-[#151c2c] border border-white/10 rounded-lg p-2 text-white text-sm font-bold outline-none"
                                                                        placeholder="1"
                                                                        value={selection.lotConfigs[scrip]?.LOT || ''}
                                                                        onChange={(e) => setSelection({
                                                                            ...selection,
                                                                            lotConfigs: {
                                                                                ...selection.lotConfigs,
                                                                                [scrip]: { ...(selection.lotConfigs[scrip] || {}), LOT: e.target.value }
                                                                            }
                                                                        })}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Category 4: TIMER & PROFIT HOLD RULES FORM */}
                                {selection.parameter === 'Timer & Hold Rules' && (
                                    <div className="space-y-6 bg-[#151c2c] p-6 rounded-2xl border border-white/5 animate-fade-in">
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 flex items-center justify-between">
                                            <span>Trade Hold & Profit Rules ({selection.segment})</span>
                                            <span className="text-[10px] text-[#01B4EA] lowercase">Exact fields matching Client Edit Form</span>
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-[#01B4EA]" /> Min. Time to book profit (No. of Seconds)
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-[#202940] border border-white/10 rounded-xl p-4 text-white text-xl font-bold focus:outline-none focus:border-[#4CAF50]"
                                                    placeholder="e.g. 50"
                                                    value={selection.minTimeToBookProfit}
                                                    onChange={e => setSelection({ ...selection, minTimeToBookProfit: e.target.value })}
                                                />
                                                <p className="text-[11px] text-slate-500 italic">Example: 120, will hold active trades for 120 seconds. No trade can be closed before this duration, regardless of P&L status.</p>
                                            </div>

                                            <div className="space-y-2 pt-4 border-t border-white/5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Scalping Stop Loss</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => setSelection({ ...selection, scalpingStopLoss: 'Enabled' })}
                                                        className={`p-3 rounded-xl border text-xs font-black uppercase tracking-widest ${selection.scalpingStopLoss === 'Enabled' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-[#202940] border-white/5 text-slate-400'}`}
                                                    >
                                                        Enabled
                                                    </button>
                                                    <button
                                                        onClick={() => setSelection({ ...selection, scalpingStopLoss: 'Disabled' })}
                                                        className={`p-3 rounded-xl border text-xs font-black uppercase tracking-widest ${selection.scalpingStopLoss === 'Disabled' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-[#202940] border-white/5 text-slate-400'}`}
                                                    >
                                                        Disabled
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-slate-500 italic">If Disabled, multiple orders or re-entries on the same symbol are blocked during the active hold duration.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    disabled={isSimulating}
                                    onClick={handleSimulation}
                                    className="w-full bg-[#4CAF50] hover:bg-green-600 disabled:opacity-30 text-white font-black py-6 rounded-2xl uppercase tracking-[0.2em] text-sm shadow-2xl transition-all flex items-center justify-center gap-4"
                                >
                                    {isSimulating ? <><Activity className="w-5 h-5 animate-spin" /> Preparing Execution Preview...</> : <><ShieldCheck className="w-6 h-6" /> Review & Preview Changes →</>}
                                </button>
                            </div>
                        )}

                        {/* Step 4 */}
                        {step === 4 && (
                            <div className="space-y-10 animate-fade-in">
                                <div className="space-y-6 py-8 border-y border-white/5">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <Settings2 className="w-4 text-[#01B4EA]" /> Execution Summary Table
                                        </h4>
                                        <p className="text-[9px] text-[#4CAF50] font-black italic">Synchronized Client Mode: Active</p>
                                    </div>
                                    
                                    <div className="card-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                                            <table className="table-standard custom-table">
                                                <thead className="bg-white/5 border-b border-white/10">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mapping Node</th>
                                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Update Path</th>
                                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y-8 divide-[#1a2035]">
                                                    <tr className="bg-white/[0.03] border-t-2 border-[#01B4EA]/30">
                                                        <td className="px-6 py-8 text-sm font-bold text-white uppercase tracking-tight">{selection.segment}</td>
                                                        <td className="px-6 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">{selection.parameter}</td>
                                                        <td className="px-6 py-8 text-white font-black text-xl text-[#4CAF50]">
                                                            {selection.parameter === 'Brokerage' ? selection.generalBrokerage : selection.parameter === 'Timer & Hold Rules' ? `${selection.minTimeToBookProfit}s (Hold)` : selection.maxLot}
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-white/[0.01]">
                                                        <td className="px-6 py-5 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Target Scope</td>
                                                        <td className="px-6 py-5 text-sm text-slate-400 font-black uppercase" colSpan={2}>
                                                            <span className="text-white mr-3">{selection.target}</span>
                                                            <span className="text-[#01B4EA] text-[10px]">
                                                                {selection.target === 'Single user' || selection.target === 'Multiple users' ? `${selection.selectedUsers.length} Users` : selection.target === 'Broker-wise users' ? `Broker ID: ${selection.selectedBrokerId}` : 'All Active Traders'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <button onClick={() => setStep(1)} className="flex-1 bg-[#2d3748] hover:bg-slate-700 text-white font-black py-6 rounded-2xl uppercase tracking-widest text-xs transition-all border border-white/5">Cancel</button>
                                    <button
                                        onClick={handleExecuteUpdate}
                                        disabled={isExecuting}
                                        className="btn-primary btn-success-gradient flex-[2] group disabled:opacity-50 disabled:cursor-wait"
                                        style={{ borderRadius: '16px', padding: '20px', fontSize: '14px', letterSpacing: '0.2em' }}
                                    >
                                        {isExecuting ? <><Activity className="w-5 h-5 animate-spin" /> Executing Batch...</> : <><Lock className="w-6 h-6 group-hover:rotate-12 transition-transform" /> Commit Phase 01: Finalize</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Surveillance Side Panel */}
                <div className="space-y-4">
                    {(() => {
                        const PARAMS = [
                            { key: 'Brokerage',           field: 'brokerage_value',           default: 0,         label: 'Brokerage' },
                            { key: 'Margin',              field: 'margin_type',               default: 'PER_LOT', label: 'Margin' },
                            { key: 'Max Lot',             field: 'max_lot_per_scrip',         default: 10,        label: 'Max Lot' },
                            { key: 'Timer & Hold Rules',  field: 'min_time_to_book_profit',   default: 120,       label: 'Timer & Hold' },
                        ];
                        const activeParam = PARAMS.find(p => p.key === resetParameter) || PARAMS[0];

                        return (
                            <div className="card-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                <div className="px-4 pt-4 pb-3 border-b border-white/5 space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applied Settings Viewer</p>
                                    <div className="flex gap-1 flex-wrap">
                                        {['MCX','Equity','Options','Comex','Forex','Crypto'].map(s => (
                                            <button key={s} onClick={() => setActiveSegment(s)}
                                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${activeSegment === s ? 'bg-[#4CAF50] text-white' : 'bg-[#151c2c] text-slate-500 hover:text-white border border-white/5'}`}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        {PARAMS.map(p => (
                                            <button key={p.key} onClick={() => setResetParameter(p.key)}
                                                className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border text-center ${resetParameter === p.key ? 'bg-[#01B4EA]/20 border-[#01B4EA]/50 text-[#01B4EA]' : 'bg-[#151c2c] border-white/5 text-slate-500 hover:text-white'}`}>
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="px-4 py-2.5 bg-[#01B4EA]/5 border-b border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] text-[#01B4EA] font-black uppercase tracking-wider">
                                        {activeSegment} → {activeParam.label}
                                    </span>
                                </div>

                                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                                    {isSegmentLoading ? (
                                        <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#01B4EA]" /></div>
                                    ) : segmentValues.length === 0 ? (
                                        <p className="text-center text-slate-600 text-xs py-8">No users found</p>
                                    ) : (
                                        <div className="divide-y divide-white/5">
                                            {segmentValues
                                                .filter(u => {
                                                    const v = u[activeParam.field];
                                                    return v !== null && v !== undefined && String(v) !== String(activeParam.default) && Number(v) !== Number(activeParam.default);
                                                })
                                                .map(u => (
                                                    <div key={u.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] group">
                                                        <div className="flex-1">
                                                            <p className="text-xs font-black text-white">{u.username}</p>
                                                            <p className="text-[9px] text-slate-600">{u.full_name}</p>
                                                        </div>
                                                        <span className="text-sm font-black text-[#4CAF50]">
                                                            {activeParam.key === 'Timer & Hold Rules' ? `${u.min_time_to_book_profit || 0}s` : u[activeParam.field]}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Global Execution & Audit History Log Table */}
            <div className="bg-[#202940] rounded-2xl border border-slate-700/50 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        <History className="w-5 h-5 text-[#01B4EA]" /> Global Update History Audit Log
                    </h3>
                    <button
                        onClick={loadAuditHistory}
                        className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2 border border-white/10 px-3 py-1.5 rounded-lg"
                    >
                        {isLoadingAudit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Refresh Log
                    </button>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#151c2c] text-slate-400 text-[10px] font-black uppercase border-b border-white/5">
                            <tr>
                                <th className="p-3">Time</th>
                                <th className="p-3">Admin</th>
                                <th className="p-3">Action Type</th>
                                <th className="p-3">Target Table</th>
                                <th className="p-3">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#151c2c] text-slate-300">
                            {auditLogList.length === 0 ? (
                                <tr><td colSpan={5} className="p-6 text-center text-slate-500">No audit logs recorded yet</td></tr>
                            ) : (
                                auditLogList.map((log, idx) => (
                                    <tr key={log.id || idx} className="hover:bg-white/[0.02]">
                                        <td className="p-3 font-mono text-[10px] text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
                                        <td className="p-3 font-bold text-white">{log.username || log.admin_id || 'System'}</td>
                                        <td className="p-3 font-black text-[#01B4EA] text-[10px] uppercase">{log.action_type}</td>
                                        <td className="p-3 font-mono text-[10px] text-slate-400">{log.target_table}</td>
                                        <td className="p-3 text-slate-300 font-sans text-xs leading-snug whitespace-normal break-words max-w-lg" title={log.description}>
                                            <div className="line-clamp-2" title={log.description}>
                                                {log.description}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
                    <div className="bg-[#151c2c] w-full max-w-xl rounded-3xl border border-red-500/30 p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
                            <h3 className="text-2xl font-black text-white">Commit Global Batch Update?</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleExecuteUpdate} disabled={isExecuting} className="bg-red-600 text-white font-bold py-4 rounded-xl">
                                {isExecuting ? 'Executing...' : 'Execute Update'}
                            </button>
                            <button onClick={() => setShowConfirmModal(false)} className="bg-slate-700 text-white py-3 rounded-xl">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalUpdationPage;
