import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';

const SelectField = ({ label, name, value, onChange, options }) => (
    <div className="form-group" style={{ marginBottom: '24px' }}>
        <label className="block text-[13px] font-semibold mb-2" style={{ color: '#5b8dd9' }}>
            {label}
        </label>
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-transparent border-b border-white/10 py-2 pr-8 text-white text-[14px] focus:outline-none focus:border-[#5cb85c] appearance-none transition-colors cursor-pointer"
            >
                {options.map(o => (
                    <option key={o.value} value={o.value} style={{ background: '#1a2035' }}>
                        {o.label}
                    </option>
                ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
        </div>
    </div>
);

const InputField = ({ label, name, value, onChange, placeholder = '0', hint }) => (
    <div className="form-group" style={{ marginBottom: '24px' }}>
        <label className="block text-[13px] font-semibold mb-2" style={{ color: '#5b8dd9' }}>
            {label}
        </label>
        <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-transparent border-b border-white/10 py-2 text-white text-[14px] focus:outline-none focus:border-[#5cb85c] transition-colors"
        />
        {hint && <p className="text-[11px] mt-1.5 text-slate-500">{hint}</p>}
    </div>
);

const ScripField = ({ label, name, value, onChange }) => (
    <div className="form-group" style={{ marginBottom: '12px' }}>
        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>
            {label}
        </label>
        <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-transparent border-b border-white/10 py-1.5 text-white text-[13px] focus:outline-none focus:border-[#5cb85c] transition-colors"
        />
    </div>
);

const DEFAULT_AWAY_POINTS = {
    MCXBULLDEX: '0', GOLD: '0', SILVER: '0', CRUDEOIL: '0',
    COPPER: '0', NICKEL: '0', ZINC: '0', LEAD: '0',
    NATURALGAS: '0', MENTHAOIL: '0', COTTON: '0', GOLDM: '0',
    SILVERM: '0', 'SILVER MIC': '0',
};

const ExpiryRulesPage = () => {
    const [saving, setSaving] = useState(false);
    const [runningSettlement, setRunningSettlement] = useState(false);
    const [settlementResult, setSettlementResult] = useState(null);
    const [runningResetID, setRunningResetID] = useState(false);
    const [resetIDResult, setResetIDResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [formData, setFormData] = useState({
        autoSquareOff: 'No',
        nseSquareOffTime: '15:20',
        mcxSquareOffTime: '23:30',
        cryptoSquareOffTime: '23:30',
        forexSquareOffTime: '23:30',
        comexSquareOffTime: '23:30',
        allowExpiringScrip: 'No',
        daysBeforeExpiry: '0',
        mcxOptionsAwayPoints: { ...DEFAULT_AWAY_POINTS },
        weeklySettlementDay: 'Sunday',
        weeklySettlementTime: '12:00',
        weeklySettlementEnabled: 'Yes',
        resetIdDay: 'Sunday',
        resetIdTime: '12:00',
        resetIdEnabled: 'Yes'
    });

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const data = await api.getExpiryRules();
                if (data && Object.keys(data).length) {
                    setFormData({
                        autoSquareOff: data.autoSquareOff || 'No',
                        nseSquareOffTime: data.nseSquareOffTime || '15:20',
                        mcxSquareOffTime: data.mcxSquareOffTime || '23:30',
                        cryptoSquareOffTime: data.cryptoSquareOffTime || '23:30',
                        forexSquareOffTime: data.forexSquareOffTime || '23:30',
                        comexSquareOffTime: data.comexSquareOffTime || '23:30',
                        allowExpiringScrip: data.allowExpiringScrip || 'No',
                        daysBeforeExpiry: String(data.daysBeforeExpiry || '0'),
                        mcxOptionsAwayPoints: { ...DEFAULT_AWAY_POINTS, ...(data.mcxOptionsAwayPoints || {}) },
                        weeklySettlementDay: data.weeklySettlementDay || 'Sunday',
                        weeklySettlementTime: data.weeklySettlementTime || '12:00',
                        weeklySettlementEnabled: data.weeklySettlementEnabled || 'Yes',
                        resetIdDay: data.resetIdDay || data.reset_id_day || 'Sunday',
                        resetIdTime: data.resetIdTime || data.reset_id_time || '12:00',
                        resetIdEnabled: data.resetIdEnabled || data.reset_id_enabled || 'Yes'
                    });
                }
            } catch (err) {
                console.error('Failed to load expiry rules:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRules();
    }, []);

    const handleChange = (e) => {
        let { name, value } = e.target;
        
        // Auto-format time: if it's 4 digits (e.g. 1212), convert to 12:12
        if (['nseSquareOffTime', 'mcxSquareOffTime', 'cryptoSquareOffTime', 'forexSquareOffTime', 'comexSquareOffTime', 'weeklySettlementTime', 'resetIdTime'].includes(name)) {
            const digits = value.replace(/\D/g, '');
            if (digits.length === 4 && !value.includes(':')) {
                value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
            }
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAwayPointChange = (scrip, value) => {
        setFormData(prev => ({
            ...prev,
            mcxOptionsAwayPoints: { ...prev.mcxOptionsAwayPoints, [scrip]: value },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.updateExpiryRules(formData);
            setToast({ show: true, message: 'Expiry rules, Settlement & Reset ID settings saved successfully!', type: 'success' });
        } catch (err) {
            setToast({ show: true, message: err?.response?.data?.message || err?.message || 'Failed to save settings.', type: 'error' });
        } finally {
            setSaving(false);
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        }
    };

    const handleRunResetID = async () => {
        const confirmRun = window.confirm(
            'RUN RESET ID PROCESS NOW?\n\nThis will refresh all trader client IDs for the new weekly cycle:\n- Closed trades from past weeks will hide from active dashboard\n- Brokerage, Gross P&L, Swap, Net P&L reset to 0.00\n- Active/Open positions and Opening Ledger Balance remain intact\n- All historical data remains safe for PDF export.'
        );
        if (!confirmRun) return;

        setRunningResetID(true);
        setResetIDResult(null);
        try {
            const res = await api.runResetID();
            setResetIDResult(res.data);
            setToast({
                show: true,
                message: `Reset ID Process Completed! Updated ${res.data?.affected_traders || 0} trader IDs.`,
                type: 'success'
            });
        } catch (err) {
            setToast({
                show: true,
                message: err?.response?.data?.message || err?.message || 'Failed to execute Reset ID process.',
                type: 'error'
            });
        } finally {
            setRunningResetID(false);
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
        }
    };

    const handleRunSettlement = async (force = false) => {
        const confirmRun = window.confirm(
            force
                ? 'FORCE RE-RUN SETTLEMENT?\n\nThis will re-calculate and overwrite weekly settlement for all traders, even if already settled for this week.'
                : 'Are you sure you want to run the Weekly Settlement now?\n\nThis will calculate weekly Realized P&L, settle ledgers, carry forward valid trades (HOLD with ₹0 brokerage), and reset current-week turnover counters.'
        );
        if (!confirmRun) return;

        setRunningSettlement(true);
        setSettlementResult(null);
        try {
            const res = await api.runWeeklySettlement({ force });
            setSettlementResult(res.data);
            setToast({
                show: true,
                message: `Settlement completed! Processed: ${res.data?.total_traders || 0} traders (${res.data?.completed_count || 0} settled).`,
                type: 'success'
            });
        } catch (err) {
            setToast({
                show: true,
                message: err?.response?.data?.message || err?.message || 'Failed to execute weekly settlement.',
                type: 'error'
            });
        } finally {
            setRunningSettlement(false);
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
        }
    };

    return (
        <div className="main-content custom-scrollbar" style={{ overflowY: 'auto', height: '100%', paddingBottom: '80px' }}>

            {toast.show && (
                <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-xl text-sm font-bold transition-all ${
                    toast.type === 'success'
                        ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                        : 'bg-red-500/20 border border-red-500/30 text-red-400'
                }`}>
                    {toast.message}
                </div>
            )}

            <div className="max-w-5xl mx-auto">

                {loading && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                    </div>
                )}

                {!loading && (
                <>
                <div className="page-header-responsive" style={{ marginBottom: '24px' }}>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Expiry Rules</h1>
                        <p className="text-slate-500 text-sm mt-1">Configure global expiry and square-off settings for all trading clients.</p>
                    </div>
                </div>

                <div className="card-panel">
                    <div className="card-panel-body">

                        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 className="text-[18px] font-bold text-white">Expiry Rules:</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
                            <SelectField
                                label="Auto Square-off on Expiry Day"
                                name="autoSquareOff"
                                value={formData.autoSquareOff}
                                onChange={handleChange}
                                options={[{ value: 'No', label: 'NO' }, { value: 'Yes', label: 'YES' }]}
                            />
                            <InputField
                                label="Square-off Time for NSE (Equity, Futures, Options)"
                                name="nseSquareOffTime"
                                value={formData.nseSquareOffTime}
                                onChange={handleChange}
                                placeholder="15:20"
                                hint="Time in HH:MM format (e.g. 15:20)"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16" style={{ marginTop: '16px' }}>
                            <InputField
                                label="Square-off Time for MCX (Futures, Options)"
                                name="mcxSquareOffTime"
                                value={formData.mcxSquareOffTime}
                                onChange={handleChange}
                                placeholder="23:30"
                                hint="Time in HH:MM format (e.g. 23:30)"
                            />
                            <InputField
                                label="Square-off Time for Crypto"
                                name="cryptoSquareOffTime"
                                value={formData.cryptoSquareOffTime}
                                onChange={handleChange}
                                placeholder="23:30"
                                hint="Time in HH:MM format (e.g. 23:30)"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16" style={{ marginTop: '16px' }}>
                            <InputField
                                label="Square-off Time for Forex"
                                name="forexSquareOffTime"
                                value={formData.forexSquareOffTime}
                                onChange={handleChange}
                                placeholder="23:30"
                                hint="Time in HH:MM format (e.g. 23:30)"
                            />
                            <InputField
                                label="Square-off Time for Comex"
                                name="comexSquareOffTime"
                                value={formData.comexSquareOffTime}
                                onChange={handleChange}
                                placeholder="23:30"
                                hint="Time in HH:MM format (e.g. 23:30)"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16" style={{ marginTop: '16px' }}>
                            <SelectField
                                label="Allow buying of expiring scrip"
                                name="allowExpiringScrip"
                                value={formData.allowExpiringScrip}
                                onChange={handleChange}
                                options={[{ value: 'No', label: 'NO' }, { value: 'Yes', label: 'YES' }]}
                            />
                            <InputField
                                label="Days before expiry to stop buying"
                                name="daysBeforeExpiry"
                                value={formData.daysBeforeExpiry}
                                onChange={handleChange}
                                placeholder="0"
                            />
                        </div>

                        {/* ─── WEEKLY SETTLEMENT & CARRY FORWARD SETTINGS ─── */}
                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-[16px] font-bold text-white tracking-wide">
                                        Weekly Settlement & Carry Forward (Bill Cut)
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Automated weekly P&L settlement, ledger credit/debit, turnover reset, and margin-based trade carry-forward (HOLD with ₹0 brokerage).
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8" style={{ marginTop: '16px' }}>
                                <SelectField
                                    label="Weekly Settlement Day"
                                    name="weeklySettlementDay"
                                    value={formData.weeklySettlementDay}
                                    onChange={handleChange}
                                    options={[
                                        { value: 'Sunday', label: 'Sunday (Recommended)' },
                                        { value: 'Saturday', label: 'Saturday' },
                                        { value: 'Monday', label: 'Monday' },
                                        { value: 'Friday', label: 'Friday' }
                                    ]}
                                />
                                <InputField
                                    label="Weekly Settlement Time (IST)"
                                    name="weeklySettlementTime"
                                    value={formData.weeklySettlementTime}
                                    onChange={handleChange}
                                    placeholder="12:00"
                                    hint="Time in HH:MM format (e.g. 12:00 PM IST)"
                                />
                                <SelectField
                                    label="Automated Weekly Settlement"
                                    name="weeklySettlementEnabled"
                                    value={formData.weeklySettlementEnabled}
                                    onChange={handleChange}
                                    options={[
                                        { value: 'Yes', label: 'YES (Enabled)' },
                                        { value: 'No', label: 'NO (Manual Only)' }
                                    ]}
                                />
                            </div>

                            {/* Manual Settlement Runner Box */}
                            <div className="mt-4 p-4 rounded-lg bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs text-white font-bold uppercase tracking-wider">
                                        Manual Settlement Trigger (SuperAdmin Only)
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Run immediate weekly settlement for all traders. Safe & Idempotent (prevents duplicate settlements).
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleRunSettlement(false)}
                                        disabled={runningSettlement}
                                        className="px-5 py-2.5 rounded text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all duration-200 cursor-pointer border border-green-400/30"
                                        style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                                    >
                                        {runningSettlement ? 'Processing…' : '⚡ Run Weekly Settlement Now'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRunSettlement(true)}
                                        disabled={runningSettlement}
                                        className="px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer"
                                        title="Force re-calculate settlement even if already run for this week"
                                    >
                                        🔥 Force Re-Run
                                    </button>
                                </div>
                            </div>

                            {settlementResult && (
                                <div className="mt-3 p-3 rounded bg-green-500/10 border border-green-500/20 text-green-300 text-xs">
                                    <strong>Settlement Summary ({settlementResult.week_start} to {settlementResult.week_end}):</strong> Total Traders: {settlementResult.total_traders} | Completed: {settlementResult.completed_count} | Skipped: {settlementResult.skipped_count} {settlementResult.skipped_count > 0 ? '(Already settled for this week)' : ''} | Failed: {settlementResult.failed_count}
                                </div>
                            )}
                        </div>

                        {/* ─── RESET ID & WEEKLY ID REFRESH SCHEDULER ─── */}
                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-[16px] font-bold text-white tracking-wide">
                                        Reset ID & Weekly View Refresh Scheduler
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Automatically refreshes client trading IDs every Sunday at 12:00 PM IST. Past closed trades hide from active view, brokerage & P&L stats reset to ₹0.00, while active positions and ledger balances stay intact. Full history is preserved for PDF export.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8" style={{ marginTop: '16px' }}>
                                <SelectField
                                    label="Reset ID Day"
                                    name="resetIdDay"
                                    value={formData.resetIdDay}
                                    onChange={handleChange}
                                    options={[
                                        { value: 'Sunday', label: 'Sunday (Recommended - 12:00 PM)' },
                                        { value: 'Saturday', label: 'Saturday' },
                                        { value: 'Monday', label: 'Monday' },
                                        { value: 'Friday', label: 'Friday' }
                                    ]}
                                />
                                <InputField
                                    label="Reset ID Time (IST)"
                                    name="resetIdTime"
                                    value={formData.resetIdTime}
                                    onChange={handleChange}
                                    placeholder="12:00"
                                    hint="Time in HH:MM format (e.g. 12:00 PM IST)"
                                />
                                <SelectField
                                    label="Automated Reset ID"
                                    name="resetIdEnabled"
                                    value={formData.resetIdEnabled}
                                    onChange={handleChange}
                                    options={[
                                        { value: 'Yes', label: 'YES (Enabled)' },
                                        { value: 'No', label: 'NO (Manual Only)' }
                                    ]}
                                />
                            </div>

                            {/* Manual Reset ID Trigger Box */}
                            <div className="mt-4 p-4 rounded-lg bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs text-white font-bold uppercase tracking-wider">
                                        Manual Reset ID Trigger (SuperAdmin Only)
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Immediately refresh active trader IDs for the new week without deleting historical trade data.
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleRunResetID}
                                        disabled={runningResetID}
                                        className="px-5 py-2.5 rounded text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all duration-200 cursor-pointer border border-blue-400/30"
                                        style={{ background: 'linear-gradient(60deg, #1d4ed8, #2563eb)' }}
                                    >
                                        {runningResetID ? 'Refreshing…' : '🔄 Run Reset ID Now'}
                                    </button>
                                </div>
                            </div>

                            {resetIDResult && (
                                <div className="mt-3 p-3 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                                    <strong>Reset ID Summary ({resetIDResult.reset_at}):</strong> Refreshed Traders: {resetIDResult.affected_traders} | Type: {resetIDResult.reset_type} | Message: {resetIDResult.message}
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <h4 className="text-[13px] text-slate-400 uppercase font-bold tracking-widest mb-6">
                                MCX Options Away Points:
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-2">
                                {Object.entries(formData.mcxOptionsAwayPoints).map(([scrip, val]) => (
                                    <ScripField
                                        key={scrip}
                                        label={`${scrip}:`}
                                        name={scrip}
                                        value={val}
                                        onChange={(e) => handleAwayPointChange(scrip, e.target.value)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="action-row" style={{ justifyContent: 'flex-end', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary btn-success-gradient"
                            >
                                {saving ? 'Saving…' : 'Save Expiry & Settlement Settings'}
                            </button>
                        </div>

                    </div>
                </div>
                </>
                )}

            </div>
        </div>
    );
};

export default ExpiryRulesPage;
