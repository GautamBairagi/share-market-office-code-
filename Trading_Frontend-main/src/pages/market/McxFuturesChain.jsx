import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Pause, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';

const fmt = (n) => n != null && n !== 0 ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-';

const RANGE_BY_SYMBOL = {
    GOLD: 5000,
    GOLDM: 5000,
    SILVER: 10000,
    SILVERM: 10000,
    CRUDEOIL: 1000,
    CRUDEOILM: 1000,
    NATURALGAS: 50,
    NATGASMINI: 50,
};

const getRangeForSymbol = (symbol) => RANGE_BY_SYMBOL[symbol] ?? 2000;

const McxFuturesChain = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('futures'); // 'futures' | 'options'
    const [filter, setFilter] = useState('ALL');

    // Futures state
    const [futData, setFutData] = useState(null);
    const [futLoading, setFutLoading] = useState(false);
    const [futAuto, setFutAuto] = useState(false);
    const futPollRef = useRef(null);

    // Options state
    const [optSymbol, setOptSymbol] = useState('GOLD');
    const [optExpiry, setOptExpiry] = useState('');
    const [optRange, setOptRange] = useState(getRangeForSymbol('GOLD'));
    const [optExpiries, setOptExpiries] = useState([]);
    const [optData, setOptData] = useState(null);
    const [optLoading, setOptLoading] = useState(false);
    const [optAuto, setOptAuto] = useState(false);
    const optPollRef = useRef(null);

    const [error, setError] = useState(null);

    const ALLOWED_SYMBOLS = ['GOLD', 'GOLDM', 'SILVER', 'SILVERM', 'CRUDEOIL', 'CRUDEOILM', 'NATURALGAS', 'NATGASMINI'];

    // ═══════════════ FUTURES TAB ═══════════════

    const fetchFutures = useCallback(async (silent = false) => {
        if (!silent) setFutLoading(true);
        setError(null);
        try {
            const res = await api.getMcxFutures(filter);
            setFutData(res);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            if (!silent) setFutLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        if (tab === 'futures') { fetchFutures(false); setFutAuto(false); }
    }, [filter, tab]);

    useEffect(() => {
        if (futPollRef.current) clearInterval(futPollRef.current);
        if (futAuto && tab === 'futures') {
            futPollRef.current = setInterval(() => fetchFutures(true), 2000);
        }
        return () => { if (futPollRef.current) clearInterval(futPollRef.current); };
    }, [futAuto, fetchFutures, tab]);

    // ═══════════════ OPTIONS TAB ═══════════════

    // Fetch expiries when symbol changes
    useEffect(() => {
        if (tab !== 'options') return;
        setOptRange(getRangeForSymbol(optSymbol));
        setOptExpiry('');
        setOptData(null);
        setOptAuto(false);
        const fetch = async () => {
            try {
                const res = await api.getMcxExpiries(optSymbol);
                setOptExpiries(res.expiries || []);
                if (res.expiries?.length > 0) setOptExpiry(res.expiries[0]);
            } catch (err) {
                setOptExpiries([]);
                setError(err.response?.data?.error || err.message);
            }
        };
        fetch();
    }, [optSymbol, tab]);

    const fetchOptions = useCallback(async (silent = false) => {
        if (!optExpiry) return;
        if (!silent) setOptLoading(true);
        setError(null);
        try {
            const res = await api.getMcxOptions(optSymbol, optExpiry, optRange);
            setOptData(res);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            if (!silent) setOptData(null);
        } finally {
            if (!silent) setOptLoading(false);
        }
    }, [optSymbol, optExpiry, optRange]);

    useEffect(() => {
        if (optPollRef.current) clearInterval(optPollRef.current);
        if (optAuto && tab === 'options') {
            optPollRef.current = setInterval(() => fetchOptions(true), 2000);
        }
        return () => { if (optPollRef.current) clearInterval(optPollRef.current); };
    }, [optAuto, fetchOptions, tab]);

    // Cleanup on tab switch
    useEffect(() => {
        if (tab === 'futures') { setOptAuto(false); }
        else { setFutAuto(false); }
    }, [tab]);

    const isLive = tab === 'futures' ? futAuto : optAuto;

    return (
        <div className="flex flex-col h-full bg-[#0f1729] overflow-hidden">
            {/* Header */}
            <div className="bg-[#1a2240] border-b border-white/5 px-6 py-3 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-bold text-white">MCX Derivatives</h1>
                        {isLive && <span className="flex items-center gap-1.5 ml-3"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-green-400 text-xs font-bold">LIVE</span></span>}
                    </div>
                    {/* Tab Switch */}
                    <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5">
                        <button onClick={() => setTab('futures')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${tab === 'futures' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            Futures
                        </button>
                        <button onClick={() => setTab('options')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${tab === 'options' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            Options Chain
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══════════════ FUTURES TAB CONTROLS ═══════════════ */}
            {tab === 'futures' && (
                <div className="bg-[#141c30] border-b border-white/5 px-6 py-2.5 shrink-0 flex flex-wrap items-center gap-3">
                    {['ALL', 'MAIN', 'MINI'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${filter === f ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                            {f}
                        </button>
                    ))}
                    <div className="w-px h-5 bg-white/10" />
                    <button onClick={() => { fetchFutures(false); setFutAuto(true); }} disabled={futLoading}
                        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5">
                        {futLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Fetch
                    </button>
                    {futData && (
                        <button onClick={() => setFutAuto(p => !p)}
                            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ${futAuto ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {futAuto ? <><Pause className="w-3 h-3" /> Live (2s)</> : <><Play className="w-3 h-3" /> Start Live</>}
                        </button>
                    )}
                    {futData && <span className="text-slate-500 text-[10px] ml-auto">{futData.count} contracts</span>}
                </div>
            )}

            {/* ═══════════════ OPTIONS TAB CONTROLS ═══════════════ */}
            {tab === 'options' && (
                <div className="bg-[#141c30] border-b border-white/5 px-6 py-2.5 shrink-0 flex flex-wrap items-end gap-3">
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Symbol</label>
                        <select value={optSymbol} onChange={e => setOptSymbol(e.target.value)}
                            className="bg-slate-700 border border-slate-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none">
                            {ALLOWED_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Expiry</label>
                        <select value={optExpiry} onChange={e => setOptExpiry(e.target.value)}
                            className="bg-slate-700 border border-slate-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none">
                            {optExpiries.length === 0 ? <option value="">No expiries</option> : optExpiries.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Range</label>
                        <select value={optRange} onChange={e => setOptRange(Number(e.target.value))}
                            className="bg-slate-700 border border-slate-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none">
                            {[getRangeForSymbol(optSymbol)].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <button onClick={() => { fetchOptions(false); setOptAuto(true); }} disabled={optLoading || !optExpiry}
                        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5">
                        {optLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Fetch
                    </button>
                    {optData && (
                        <button onClick={() => setOptAuto(p => !p)}
                            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ${optAuto ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {optAuto ? <><Pause className="w-3 h-3" /> Live (2s)</> : <><Play className="w-3 h-3" /> Start Live</>}
                        </button>
                    )}
                </div>
            )}

            {/* Options Info Bar */}
            {tab === 'options' && optData && (
                <div className="bg-[#141c30] border-b border-white/5 px-6 py-1.5 shrink-0 flex items-center gap-5 text-[11px]">
                    <span className="text-slate-400">Future: <span className="text-white font-bold">{optData.future?.tradingsymbol}</span></span>
                    <span className="text-slate-400">LTP: <span className="text-white font-bold">{fmt(optData.ltp)}</span></span>
                    <span className="text-slate-400">ATM: <span className="text-yellow-400 font-bold">{optData.atm}</span></span>
                    <span className="text-slate-400">Step: <span className="text-white">{optData.step}</span></span>
                    <span className="text-slate-400">Strikes: <span className="text-white font-bold">{optData.count}</span></span>
                    <span className="text-slate-400">Contracts: <span className="text-white font-bold">{optData.totalContracts}</span></span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2 shrink-0">
                    <p className="text-red-400 text-xs">{error}</p>
                </div>
            )}

            {/* ═══════════════ FUTURES TABLE ═══════════════ */}
            {tab === 'futures' && (
                <div className="flex-1 overflow-auto">
                    {futLoading && !futData ? (
                        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
                    ) : !futData ? (
                        <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Click "Fetch" to load MCX futures</div>
                    ) : (
                        <table className="w-full text-xs border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#141c30] border-b border-white/10 text-[10px] uppercase tracking-wider">
                                    <th className="px-3 py-2.5 text-left text-orange-500 font-bold">Symbol</th>
                                    <th className="px-3 py-2.5 text-left text-slate-400">Contract</th>
                                    <th className="px-3 py-2.5 text-left text-slate-400">Expiry</th>
                                    <th className="px-3 py-2.5 text-left text-slate-400">Type</th>
                                    <th className="px-3 py-2.5 text-right text-green-500 font-bold">Bid</th>
                                    <th className="px-3 py-2.5 text-right text-red-500 font-bold">Ask</th>
                                    <th className="px-3 py-2.5 text-right text-yellow-500 font-bold">LTP</th>
                                    <th className="px-3 py-2.5 text-right text-slate-400">Chg%</th>
                                    <th className="px-3 py-2.5 text-right text-slate-400">Open</th>
                                    <th className="px-3 py-2.5 text-right text-slate-400">High</th>
                                    <th className="px-3 py-2.5 text-right text-slate-400">Low</th>
                                    <th className="px-3 py-2.5 text-right text-slate-400">Volume</th>
                                    <th className="px-3 py-2.5 text-right text-slate-400">OI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {futData.data.map(item => {
                                    const chg = parseFloat(item.chg_pct || 0);
                                    return (
                                        <tr key={item.tradingsymbol} className="hover:bg-white/[0.03] transition-colors border-b border-white/[0.03]">
                                            <td className="px-3 py-2.5">
                                                <span className="text-orange-400 font-bold text-[12px]">{item.label}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-white font-bold">{item.displayName}</td>
                                            <td className="px-3 py-2.5 text-slate-400">{item.expiry}</td>
                                            <td className="px-3 py-2.5">
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.isMain ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {item.isMain ? 'MAIN' : 'MINI'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-green-300 font-mono font-bold">{fmt(item.bid)}</td>
                                            <td className="px-3 py-2.5 text-right text-red-300 font-mono font-bold">{fmt(item.ask)}</td>
                                            <td className="px-3 py-2.5 text-right text-white font-mono font-extrabold text-[13px]">{fmt(item.ltp)}</td>
                                            <td className={`px-3 py-2.5 text-right font-mono font-bold ${chg >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {chg >= 0 ? '+' : ''}{item.chg_pct}%
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-slate-400 font-mono">{fmt(item.open)}</td>
                                            <td className="px-3 py-2.5 text-right text-green-400/60 font-mono">{fmt(item.high)}</td>
                                            <td className="px-3 py-2.5 text-right text-red-400/60 font-mono">{fmt(item.low)}</td>
                                            <td className="px-3 py-2.5 text-right text-slate-400 font-mono">{fmt(item.volume)}</td>
                                            <td className="px-3 py-2.5 text-right text-slate-400 font-mono">{fmt(item.oi)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ═══════════════ OPTIONS CHAIN TABLE ═══════════════ */}
            {tab === 'options' && (
                <div className="flex-1 overflow-auto">
                    {optLoading && !optData ? (
                        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
                    ) : !optData ? (
                        <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Select symbol + expiry and click "Fetch"</div>
                    ) : (
                        <table className="w-full text-xs border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#141c30] border-b border-white/10">
                                    <th className="px-2 py-2 text-right text-slate-500">OI</th>
                                    <th className="px-2 py-2 text-right text-slate-500">Vol</th>
                                    <th className="px-2 py-2 text-right text-slate-500">Chg%</th>
                                    <th className="px-2 py-2 text-right text-green-500 font-bold">CE Bid</th>
                                    <th className="px-2 py-2 text-right text-green-500 font-bold">CE Ask</th>
                                    <th className="px-2 py-2 text-right text-green-500 font-bold">CE LTP</th>
                                    <th className="px-3 py-2 text-center text-yellow-500 font-bold">STRIKE</th>
                                    <th className="px-2 py-2 text-left text-red-500 font-bold">PE LTP</th>
                                    <th className="px-2 py-2 text-left text-red-500 font-bold">PE Bid</th>
                                    <th className="px-2 py-2 text-left text-red-500 font-bold">PE Ask</th>
                                    <th className="px-2 py-2 text-left text-slate-500">Chg%</th>
                                    <th className="px-2 py-2 text-left text-slate-500">Vol</th>
                                    <th className="px-2 py-2 text-left text-slate-500">OI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {optData.data.map(row => {
                                    const isATM = row.isATM;
                                    const isITM = row.classification === 'ITM';
                                    const rowBg = isATM ? 'bg-yellow-500/10 border-y border-yellow-500/30' : isITM ? 'bg-purple-500/[0.03]' : '';
                                    return (
                                        <tr key={row.strike} className={`${rowBg} hover:bg-white/[0.03] transition-colors border-b border-white/[0.02]`}>
                                            <td className="px-2 py-2 text-right text-slate-400 font-mono">{fmt(row.CE?.oi)}</td>
                                            <td className="px-2 py-2 text-right text-slate-400 font-mono">{fmt(row.CE?.volume)}</td>
                                            <td className={`px-2 py-2 text-right font-mono ${parseFloat(row.CE?.chg_pct || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {row.CE ? `${row.CE.chg_pct}%` : '-'}
                                            </td>
                                            <td className="px-2 py-2 text-right text-green-300 font-mono font-bold">{fmt(row.CE?.bid)}</td>
                                            <td className="px-2 py-2 text-right text-green-300 font-mono font-bold">{fmt(row.CE?.ask)}</td>
                                            <td className="px-2 py-2 text-right text-white font-mono font-bold">{fmt(row.CE?.ltp)}</td>
                                            <td className={`px-3 py-2 text-center font-bold font-mono ${isATM ? 'text-yellow-400 text-sm' : 'text-slate-300'}`}>
                                                {row.strike}{isATM && <span className="ml-1 text-[9px] text-yellow-500">ATM</span>}
                                            </td>
                                            <td className="px-2 py-2 text-left text-white font-mono font-bold">{fmt(row.PE?.ltp)}</td>
                                            <td className="px-2 py-2 text-left text-red-300 font-mono font-bold">{fmt(row.PE?.bid)}</td>
                                            <td className="px-2 py-2 text-left text-red-300 font-mono font-bold">{fmt(row.PE?.ask)}</td>
                                            <td className={`px-2 py-2 text-left font-mono ${parseFloat(row.PE?.chg_pct || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {row.PE ? `${row.PE.chg_pct}%` : '-'}
                                            </td>
                                            <td className="px-2 py-2 text-left text-slate-400 font-mono">{fmt(row.PE?.volume)}</td>
                                            <td className="px-2 py-2 text-left text-slate-400 font-mono">{fmt(row.PE?.oi)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="bg-[#1a2240] border-t border-white/5 px-6 py-1.5 shrink-0 flex items-center justify-between text-[10px] text-slate-600">
                <span>{tab === 'futures' ? '/api/kite/market/mcx-futures' : '/api/kite/market/mcx-options'}</span>
                <span>{(tab === 'futures' ? futData : optData)?.timestamp || ''}</span>
            </div>
        </div>
    );
};

export default McxFuturesChain;
