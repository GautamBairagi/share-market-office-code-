import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as api from '../../services/api';
import { formatPrice as fmt, formatPriceFallback as fmtPrice } from '../../utils/formatPrice';
import { displaySymbol } from '../../utils/marketUtils';


const MarketDataPage = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('crypto');
    const [cryptoData, setCryptoData] = useState([]);
    const [forexData, setForexData] = useState([]);
    const [commodityData, setCommodityData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastUpdate, setLastUpdate] = useState(null);
    const socketRef = useRef(null);
    const prevPricesRef = useRef({});
    const [flashStates, setFlashStates] = useState({});

    const fetchInitial = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.getAllMarketData();
            if (res.crypto) setCryptoData(res.crypto);
            if (res.forex) setForexData(res.forex);
            if (res.commodity) setCommodityData(res.commodity);
            [...(res.crypto || []), ...(res.forex || []), ...(res.commodity || [])].forEach(item => {
                prevPricesRef.current[item.symbol] = item.ltp || item.price;
            });
            setLastUpdate(new Date().toLocaleTimeString());
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInitial(); }, []);

    useEffect(() => {
        const socket = io(api.SOCKET_URL, {
            reconnection: true, reconnectionDelay: 2000, transports: ['websocket', 'polling']
        });
        socketRef.current = socket;
        socket.on('connect', () => setWsConnected(true));

        // Live price updates via 'price_update' event
        socket.on('price_update', (updates) => {
            if (!updates) return;
            const updateFn = (prev) => prev.map(item => {
                const upd = updates[item.symbol];
                if (!upd) return item;
                const originalType = item.type;
                const nextItem = { ...item, ...upd };
                if (originalType) nextItem.type = originalType;
                return nextItem;
            });
            setCryptoData(updateFn);
            setForexData(updateFn);
            setCommodityData(updateFn);
            setLastUpdate(new Date().toLocaleTimeString());
        });

        socket.on('market_data_update', ({ type, data }) => {
            if (!data || !Array.isArray(data)) return;
            const newFlash = {};
            data.forEach(item => {
                const prev = prevPricesRef.current[item.symbol];
                if (prev !== undefined && prev !== item.ltp) {
                    newFlash[item.symbol] = item.ltp > prev ? 'up' : 'down';
                }
                prevPricesRef.current[item.symbol] = item.ltp;
            });
            if (Object.keys(newFlash).length > 0) {
                setFlashStates(prev => ({ ...prev, ...newFlash }));
                setTimeout(() => setFlashStates(prev => {
                    const next = { ...prev };
                    Object.keys(newFlash).forEach(k => delete next[k]);
                    return next;
                }), 800);
            }
            if (type === 'crypto') setCryptoData(data);
            else if (type === 'forex') setForexData(data);
            else if (type === 'commodity') setCommodityData(data);
            setLastUpdate(new Date().toLocaleTimeString());
        });
        socket.on('disconnect', () => setWsConnected(false));
        return () => { socket.disconnect(); socketRef.current = null; };
    }, []);

    const activeData = tab === 'crypto' ? cryptoData : tab === 'forex' ? forexData : commodityData;
    const filtered = activeData.filter(item => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return item.symbol?.toLowerCase().includes(q) || item.name?.toLowerCase().includes(q);
    });

    return (
        <div className="flex flex-col h-full bg-[#0f1729] overflow-hidden">
            {/* Header — responsive */}
            <div className="bg-[#1a2240] border-b border-white/5 px-3 sm:px-6 py-2.5 sm:py-3 shrink-0">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1 shrink-0">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-base sm:text-lg font-bold text-white truncate">Live Quotes</h1>
                        <span className="flex items-center gap-1 shrink-0">
                            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className={`text-[10px] sm:text-xs font-bold ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
                                {wsConnected ? 'LIVE' : 'OFF'}
                            </span>
                        </span>
                    </div>
                    {/* Tab Switch */}
                    <div className="flex gap-0.5 bg-slate-800 rounded-lg p-0.5 shrink-0">
                        <button onClick={() => setTab('crypto')}
                            className={`px-3 sm:px-5 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${tab === 'crypto' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            Crypto
                        </button>
                        <button onClick={() => setTab('forex')}
                            className={`px-3 sm:px-5 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${tab === 'forex' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            Forex
                        </button>
                        <button onClick={() => setTab('commodity')}
                            className={`px-3 sm:px-5 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${tab === 'commodity' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            Commodity
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls — responsive */}
            <div className="bg-[#141c30] border-b border-white/5 px-3 sm:px-6 py-2 shrink-0 flex items-center gap-2 sm:gap-3">
                <div className="relative flex-1 max-w-[200px] sm:max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input type="text" placeholder="Filter..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-700/40 border border-slate-600/50 text-white text-xs pl-8 pr-7 py-1.5 rounded-lg placeholder-slate-500 focus:outline-none focus:border-blue-500/50" />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                            <X className="w-3 h-3 text-slate-500 hover:text-white" />
                        </button>
                    )}
                </div>
                <button onClick={fetchInitial} disabled={loading}
                    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 sm:px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shrink-0">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Refresh</span>
                </button>
                <span className="ml-auto text-slate-500 text-[9px] sm:text-[10px] hidden sm:inline">
                    {filtered.length} symbols {lastUpdate && `| ${lastUpdate}`}
                </span>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-3 sm:px-6 py-2 shrink-0">
                    <p className="text-red-400 text-xs">{error}</p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {loading && activeData.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    </div>
                ) : activeData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4 px-10 text-center">
                        <div className="text-slate-500 text-sm">
                            {tab === 'crypto' ? 'Binance data currently unavailable.' : 'Twelve Data data currently unavailable.'}
                        </div>
                        {tab === 'crypto' && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg max-w-xs">
                                <p className="text-red-400 text-[11px]">
                                    Possibility: Server IP is temporarily rate-limited or blocked by exchange.
                                </p>
                            </div>
                        )}
                        <button onClick={fetchInitial} className="text-amber-500 text-xs hover:underline">
                            Try Refreshing
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ═══ MOBILE CARD VIEW (< 768px) ═══ */}
                        <div className="md:hidden divide-y divide-white/5">
                            {filtered.map((item, idx) => {
                                const flash = flashStates[item.symbol];
                                const isUp = item.direction === 'up';
                                const isDown = item.direction === 'down';
                                const changeColor = isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-slate-400';

                                return (
                                    <div key={item.symbol}
                                        className={`px-3 py-3 flex items-center gap-3 transition-colors ${flash === 'up' ? 'bg-green-500/10' : flash === 'down' ? 'bg-red-500/10' : ''
                                            }`}>
                                        {/* Icon */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${item.category === 'crypto' ? 'bg-amber-500/20 text-amber-400' :
                                            item.category === 'commodity' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {(displaySymbol(item) || '').charAt(0)}
                                        </div>
                                        {/* Name + Symbol */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-bold text-white truncate">{item.name || displaySymbol(item)}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-slate-500">{displaySymbol(item.symbol)}</span>
                                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${item.category === 'crypto' ? 'bg-amber-500/20 text-amber-400' :
                                                    item.category === 'commodity' ? 'bg-orange-500/20 text-orange-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>{item.category || tab}</span>
                                            </div>
                                        </div>
                                        {/* Price + Change */}
                                        <div className="text-right shrink-0 min-w-[80px]">
                                            <div className={`text-[15px] font-extrabold px-1.5 py-0.5 rounded inline-flex items-center justify-end ${flash === 'up' ? 'ltp-flash-up' : flash === 'down' ? 'ltp-flash-down' : 'text-white'
                                                }`}>
                                                {fmt(item.ltp || item.price)}
                                            </div>
                                            <div className="flex flex-col items-end mt-0.5">
                                                <div className="flex gap-2 text-[9px] text-slate-500 font-mono">
                                                    <span>B: {fmt(item.bid)}</span>
                                                    <span>A: {fmt(item.ask)}</span>
                                                </div>
                                                <span className={`text-[11px] font-bold ${changeColor}`}>
                                                    {isUp ? '▲' : isDown ? '▼' : '–'} {isUp ? '+' : ''}{item.chg_pct || item.changePct || '0.00'}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ═══ DESKTOP TABLE VIEW (>= 768px) ═══ */}
                        <table className="w-full text-sm border-collapse hidden md:table">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#141c30] border-b border-white/10 text-[10px] uppercase tracking-wider">
                                    <th className="px-3 py-2.5 text-left text-slate-400 w-10">#</th>
                                    <th className="px-3 py-2.5 text-left text-slate-400">Symbol</th>
                                    <th className="px-3 py-2.5 text-left text-slate-400 hidden lg:table-cell">Category</th>
                                    <th className="px-3 py-2.5 text-right text-green-500 font-bold">Bid</th>
                                    <th className="px-3 py-2.5 text-right text-red-500 font-bold">Ask</th>
                                    <th className="px-3 py-2.5 text-right text-yellow-500 font-bold">Price</th>
                                    <th className="px-3 py-2.5 text-right text-slate-400">Change %</th>
                                    <th className="px-3 py-2.5 text-right text-slate-400 hidden lg:table-cell">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item, idx) => {
                                    const flash = flashStates[item.symbol];
                                    const isUp = item.direction === 'up';
                                    const isDown = item.direction === 'down';

                                    return (
                                        <tr key={item.symbol}
                                            className={`hover:bg-white/[0.03] transition-all border-b border-white/[0.03] ${flash === 'up' ? 'bg-green-500/10' : flash === 'down' ? 'bg-red-500/10' : ''
                                                }`}>
                                            <td className="px-3 py-2.5 text-slate-600 text-xs font-mono">{idx + 1}</td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${item.category === 'crypto' ? 'bg-amber-500/20 text-amber-400' :
                                                        item.category === 'commodity' ? 'bg-orange-500/20 text-orange-400' :
                                                            'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {(displaySymbol(item) || '').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold text-[13px]">{item.name || displaySymbol(item)}</div>
                                                        <div className="text-slate-500 text-[10px]">{displaySymbol(item.symbol)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 hidden lg:table-cell">
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${item.category === 'crypto' ? 'bg-amber-500/20 text-amber-400' :
                                                    item.category === 'commodity' ? 'bg-orange-500/20 text-orange-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>{item.category || tab}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-[12px] text-green-400/80">
                                                {fmt(item.bid || item.ltp || item.price)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-[12px] text-red-400/80">
                                                {fmt(item.ask || item.ltp || item.price)}
                                            </td>
                                            <td className={`px-3 py-2.5 text-right font-mono font-extrabold text-[14px] ${flash === 'up' ? 'ltp-flash-up' : flash === 'down' ? 'ltp-flash-down' : 'text-white'
                                                }`}>
                                                {fmt(item.ltp || item.price)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${isUp ? 'bg-green-500/10 text-green-400' : isDown ? 'bg-red-500/10 text-red-400' : 'text-slate-500'
                                                    }`}>
                                                    {isUp ? '▲' : isDown ? '▼' : '–'} {isUp ? '+' : ''}{item.chg_pct || item.changePct || '0.00'}%
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-slate-500 text-[11px] hidden lg:table-cell">
                                                {lastUpdate || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {/* Footer — responsive */}
            <div className="bg-[#1a2240] border-t border-white/5 px-3 sm:px-6 py-1.5 shrink-0 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-600">
                <span>Twelve Data | WS: {wsConnected ? 'On' : 'Off'}</span>
                <span>{filtered.length} {tab === 'crypto' ? 'coins' : 'pairs'}</span>
            </div>
        </div>
    );
};

export default MarketDataPage;
