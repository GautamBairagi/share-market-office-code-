import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Pause, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

const fmt = (n) => n != null && n !== 0 ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-';

const OptionsChainTest = () => {
    const navigate = useNavigate();
    const [symbol, setSymbol] = useState('NIFTY');
    const [expiry, setExpiry] = useState('');
    const [range, setRange] = useState(1000);
    const [expiries, setExpiries] = useState([]);
    const [chain, setChain] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expiryLoading, setExpiryLoading] = useState(false);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const pollRef = useRef(null);

    // Fetch expiries when symbol changes
    useEffect(() => {
        const fetchExpiries = async () => {
            setExpiryLoading(true);
            setExpiry('');
            setChain(null);
            setAutoRefresh(false);
            try {
                const res = await api.getOptionsExpiries(symbol);
                setExpiries(res.expiries || []);
                if (res.expiries?.length > 0) {
                    setExpiry(res.expiries[0]);
                }
                setError(null);
            } catch (err) {
                setError(err.response?.data?.error || err.message);
                setExpiries([]);
            } finally {
                setExpiryLoading(false);
            }
        };
        fetchExpiries();
    }, [symbol]);

    // Fetch options chain — silent refresh (no loading spinner on poll)
    const fetchChain = useCallback(async (silent = false) => {
        if (!expiry) return;
        if (!silent) setLoading(true);
        setError(null);
        try {
            const res = await api.getOptionsChain(symbol, expiry, range);
            setChain(res);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            if (!silent) setChain(null);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [symbol, expiry, range]);

    // Auto-polling every 2 seconds when enabled
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (autoRefresh && expiry) {
            pollRef.current = setInterval(() => fetchChain(true), 2000);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [autoRefresh, fetchChain, expiry]);

    // First fetch + start auto-refresh
    const handleFetch = async () => {
        await fetchChain(false);
        setAutoRefresh(true);
    };

    return (
        <div className="flex flex-col h-full bg-[#0f1729] overflow-hidden">
            {/* Header */}
            <div className="bg-[#1a2240] border-b border-white/5 px-6 py-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">Options Chain</h1>
                            <p className="text-slate-500 text-xs mt-0.5">Test Page — GET /api/kite/market/options-chain</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-[#141c30] border-b border-white/5 px-6 py-3 shrink-0 flex flex-wrap items-end gap-4">
                {/* Symbol */}
                <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Symbol</label>
                    <div className="flex gap-1">
                        {SYMBOLS.map(s => (
                            <button
                                key={s}
                                onClick={() => setSymbol(s)}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                                    symbol === s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Expiry */}
                <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Expiry {expiryLoading && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}
                    </label>
                    <select
                        value={expiry}
                        onChange={e => setExpiry(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-white text-sm px-3 py-1.5 rounded focus:outline-none focus:border-blue-500"
                    >
                        {expiries.length === 0 && <option value="">No expiries</option>}
                        {expiries.map(e => (
                            <option key={e} value={e}>{e}</option>
                        ))}
                    </select>
                </div>

                {/* Range */}
                <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Range (+-)</label>
                    <select
                        value={range}
                        onChange={e => setRange(Number(e.target.value))}
                        className="bg-slate-700 border border-slate-600 text-white text-sm px-3 py-1.5 rounded focus:outline-none focus:border-blue-500"
                    >
                        <option value={500}>500</option>
                        <option value={1000}>1000</option>
                        <option value={1500}>1500</option>
                        <option value={2000}>2000</option>
                    </select>
                </div>

                {/* Fetch Button */}
                <button
                    onClick={handleFetch}
                    disabled={loading || !expiry}
                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-5 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Fetch Chain
                </button>

                {/* Auto-refresh toggle */}
                {chain && (
                    <button
                        onClick={() => setAutoRefresh(prev => !prev)}
                        className={`px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all ${
                            autoRefresh ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {autoRefresh ? <><Pause className="w-3.5 h-3.5" /> Live (2s)</> : <><Play className="w-3.5 h-3.5" /> Start Live</>}
                    </button>
                )}
            </div>

            {/* Info Bar */}
            {chain && (
                <div className="bg-[#141c30] border-b border-white/5 px-6 py-2 shrink-0 flex items-center gap-6 text-xs">
                    {autoRefresh && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-green-400 font-bold">LIVE</span></span>}
                    <span className="text-slate-400">LTP: <span className="text-white font-bold">{fmt(chain.ltp)}</span></span>
                    <span className="text-slate-400">ATM: <span className="text-yellow-400 font-bold">{chain.atm}</span></span>
                    <span className="text-slate-400">Step: <span className="text-white font-bold">{chain.step}</span></span>
                    <span className="text-slate-400">Range: <span className="text-white">{chain.range}</span></span>
                    <span className="text-slate-400">Strikes: <span className="text-white font-bold">{chain.count}</span></span>
                    <span className="text-slate-400">Contracts: <span className="text-white font-bold">{chain.totalContracts}</span></span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 shrink-0">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Chain Table */}
            <div className="flex-1 overflow-auto">
                {loading && !chain && (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                    </div>
                )}

                {!chain && !loading && !error && (
                    <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                        Select symbol, expiry and click "Fetch Chain"
                    </div>
                )}

                {chain && chain.data && (
                    <table className="w-full text-xs border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#141c30] border-b border-white/10">
                                {/* CE Side */}
                                <th className="px-2 py-2.5 text-right text-slate-500">OI</th>
                                <th className="px-2 py-2.5 text-right text-slate-500">Chg%</th>
                                <th className="px-2 py-2.5 text-right text-slate-500">Vol</th>
                                <th className="px-2 py-2.5 text-right text-green-500 font-bold">CE Bid</th>
                                <th className="px-2 py-2.5 text-right text-green-500 font-bold">CE Ask</th>
                                <th className="px-2 py-2.5 text-right text-green-500 font-bold">CE LTP</th>
                                {/* Strike */}
                                <th className="px-3 py-2.5 text-center text-yellow-500 font-bold">STRIKE</th>
                                {/* PE Side */}
                                <th className="px-2 py-2.5 text-left text-red-500 font-bold">PE LTP</th>
                                <th className="px-2 py-2.5 text-left text-red-500 font-bold">PE Bid</th>
                                <th className="px-2 py-2.5 text-left text-red-500 font-bold">PE Ask</th>
                                <th className="px-2 py-2.5 text-left text-slate-500">Vol</th>
                                <th className="px-2 py-2.5 text-left text-slate-500">Chg%</th>
                                <th className="px-2 py-2.5 text-left text-slate-500">OI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chain.data.map(row => {
                                const isATM = row.isATM;
                                const isITM = row.classification === 'ITM';
                                const rowBg = isATM
                                    ? 'bg-yellow-500/10 border-y border-yellow-500/30'
                                    : isITM
                                    ? 'bg-blue-500/[0.03]'
                                    : '';

                                return (
                                    <tr key={row.strike} className={`${rowBg} hover:bg-white/[0.03] transition-colors border-b border-white/[0.02]`}>
                                        {/* CE Side */}
                                        <td className="px-2 py-2 text-right text-slate-400 font-mono">{fmt(row.CE?.oi)}</td>
                                        <td className={`px-2 py-2 text-right font-mono ${parseFloat(row.CE?.chg_pct || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {row.CE ? `${row.CE.chg_pct}%` : '-'}
                                        </td>
                                        <td className="px-2 py-2 text-right text-slate-400 font-mono">{fmt(row.CE?.volume)}</td>
                                        <td className="px-2 py-2 text-right text-green-300 font-mono font-bold">{fmt(row.CE?.bid)}</td>
                                        <td className="px-2 py-2 text-right text-green-300 font-mono font-bold">{fmt(row.CE?.ask)}</td>
                                        <td className="px-2 py-2 text-right text-white font-mono font-bold">{fmt(row.CE?.ltp)}</td>

                                        {/* Strike */}
                                        <td className={`px-3 py-2 text-center font-bold font-mono ${isATM ? 'text-yellow-400 text-sm' : 'text-slate-300'}`}>
                                            {row.strike}
                                            {isATM && <span className="ml-1 text-[9px] text-yellow-500 font-normal">ATM</span>}
                                        </td>

                                        {/* PE Side */}
                                        <td className="px-2 py-2 text-left text-white font-mono font-bold">{fmt(row.PE?.ltp)}</td>
                                        <td className="px-2 py-2 text-left text-red-300 font-mono font-bold">{fmt(row.PE?.bid)}</td>
                                        <td className="px-2 py-2 text-left text-red-300 font-mono font-bold">{fmt(row.PE?.ask)}</td>
                                        <td className="px-2 py-2 text-left text-slate-400 font-mono">{fmt(row.PE?.volume)}</td>
                                        <td className={`px-2 py-2 text-left font-mono ${parseFloat(row.PE?.chg_pct || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {row.PE ? `${row.PE.chg_pct}%` : '-'}
                                        </td>
                                        <td className="px-2 py-2 text-left text-slate-400 font-mono">{fmt(row.PE?.oi)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            <div className="bg-[#1a2240] border-t border-white/5 px-6 py-1.5 shrink-0 flex items-center justify-between text-[10px] text-slate-600">
                <span>API: /api/kite/market/options-chain</span>
                {chain && <span>Last fetch: {chain.timestamp}</span>}
            </div>
        </div>
    );
};

export default OptionsChainTest;
