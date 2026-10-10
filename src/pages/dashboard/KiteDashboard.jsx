import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { RefreshCw, TrendingUp, LogIn, LogOut, Wifi, WifiOff, Search, X, Loader2, Minus, Plus, Settings, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import { useMarketData } from '../../context/MarketDataContext';
import { List } from 'react-window';
import { exchangeFromRow, displaySymbol } from '../../utils/marketUtils';
import '../../styles/marketDataAnimations.css';
const TABS = [
    { key: 'ALL', label: 'ALL', color: '#10b981' },
    { key: 'NFO_FUT', label: 'NFO Fut', color: '#a855f7' },
    { key: 'NFO_OPT', label: 'NFO Opt', color: '#ec4899' },
    { key: 'MCX_FUT', label: 'MCX Fut', color: '#f59e0b' },
    { key: 'MCX_OPT', label: 'MCX Opt', color: '#f97316' },
    { key: 'CRYPTO', label: 'CRYPTO', color: '#f59e0b' },
    { key: 'FOREX', label: 'FOREX', color: '#3b82f6' },
    { key: 'COMMODITY', label: 'COMMODITY', color: '#e91e63' },
];



const ROW_HEIGHT = 92;

const fmt = (n) => {
    if (n == null || n === '' || !isFinite(n)) return '-';
    const num = Number(n);
    if (num === 0) return '0';
    // Cap at 4 decimals, remove trailing zeros
    return parseFloat(num.toFixed(4)).toString();
};

// Format price for bid/ask/ltp - show last value if current is 0 (market closed)
const fmtPrice = (current, lastValue) => {
    const num = Number(current);
    // If current value is 0, use the last known non-zero value
    if (num === 0 && lastValue && Number(lastValue) !== 0) {
        return fmt(lastValue);
    }
    return fmt(num);
};

const MemoRow = React.memo(({ symbol, data, index, nowTs }) => {
    const exchange = exchangeFromRow(data);
    const name = displaySymbol(data);
    const tradingSymbol = data.trading_symbol || symbol.split(':')[1] || symbol;

    const chg = Number(data?.chg_pct || data?.change || 0);
    const up = chg > 0;
    const dn = chg < 0;

    const bidFlash = data._bidFlashUntil > nowTs ? data._bidFlashDir : null;
    const askFlash = data._askFlashUntil > nowTs ? data._askFlashDir : null;
    const ltpFlash = data._ltpFlashUntil > nowTs ? data._ltpFlashDir : null;

    const rowBg = index % 2 === 0 ? 'bg-[#141c30]/50' : 'bg-[#1a2240]/30';

    return (
        <>
            {/* Desktop View */}
            <div className={`hidden md:grid grid-cols-[50px_minmax(180px,1.4fr)_90px_110px_110px_110px_100px_100px_70px_100px_120px] gap-x-4 items-center px-1.5 border-b border-white/[0.03] transition-colors hover:bg-white/[0.04] ${rowBg}`} style={{ height: `${ROW_HEIGHT}px` }}>
                <div className="text-center text-slate-600 text-[11px] font-mono tabular-nums">{index + 1}</div>
                <div className="px-2">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-1.5 h-12 rounded-full shrink-0 ${up ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : dn ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-slate-600'}`} />
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[14px] font-bold text-white truncate leading-tight uppercase">{name}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${exchange === 'NSE' ? 'bg-blue-500/20 text-blue-400' : exchange === 'MCX_FUT' || exchange === 'MCX_OPT' ? 'bg-orange-500/20 text-orange-400' : exchange === 'NFO_OPT' ? 'bg-pink-500/20 text-pink-400' : exchange === 'NFO_FUT' ? 'bg-purple-500/20 text-purple-400' : exchange === 'CRYPTO' ? 'bg-yellow-500/20 text-yellow-400' : exchange === 'FOREX' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-400'}`}>{exchange}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate opacity-60">
                                {tradingSymbol}{data.optionType ? ` · ${data.optionType}` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-center hidden lg:block">
                    <span className="text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded uppercase tracking-tighter">{data.type || '-'}</span>
                </div>
                <div className="text-center">
                    {bidFlash ? (
                        <span className={`price-pill bid-ask-button h-8 text-[13px] font-bold tabular-nums ${bidFlash === 'up' ? 'bid-ask-blink-bid-up' : 'bid-ask-blink-bid-down'}`}>
                            {fmtPrice(data?.bid, data?._lastBid)}
                        </span>
                    ) : (
                        <span className="text-[13px] text-green-400 font-bold tabular-nums">{fmtPrice(data?.bid, data?._lastBid)}</span>
                    )}
                </div>
                <div className="text-center">
                    {askFlash ? (
                        <span className={`price-pill bid-ask-button h-8 text-[13px] font-bold tabular-nums ${askFlash === 'up' ? 'bid-ask-blink-ask-up' : 'bid-ask-blink-ask-down'}`}>
                            {fmtPrice(data?.ask, data?._lastAsk)}
                        </span>
                    ) : (
                        <span className="text-[13px] text-red-400 font-bold tabular-nums">{fmtPrice(data?.ask, data?._lastAsk)}</span>
                    )}
                </div>
                <div className="text-center">
                    <div className="flex flex-col items-center">
                        <span className={`text-[15px] font-extrabold tabular-nums transition-colors duration-300 ${ltpFlash === 'up' ? 'ltp-flash-up' : ltpFlash === 'down' ? 'ltp-flash-down' : up ? 'text-green-400' : dn ? 'text-red-400' : 'text-slate-400'}`}>
                            {fmtPrice(data?.ltp || data?.price, data?._lastLtp)}
                            {ltpFlash && <span className={`text-xs ml-1 ${ltpFlash === 'up' ? 'text-green-400' : 'text-red-400'}`}>{ltpFlash === 'up' ? '↑' : '↓'}</span>}
                        </span>
                    </div>
                </div>
                <div className="text-center text-slate-400 text-xs font-mono hidden xl:block">{data.expiry || '-'}</div>
                <div className="text-center text-slate-400 text-xs font-mono hidden xl:block">{data.strike != null ? fmt(data.strike) : '-'}</div>
                <div className="text-center text-slate-400 text-xs font-mono hidden xl:block">{data.optionType || '-'}</div>
                <div className="text-center">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded text-[11px] font-bold ${up ? 'bg-green-500/10 text-green-400' : dn ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-500'}`}>
                        {up ? '▲' : dn ? '▼' : '–'} {up ? '+' : ''}{chg}%
                    </span>
                </div>
                <div className="text-right text-slate-400 text-xs font-mono pr-4 hidden lg:block tabular-nums">{fmt(data?.vol || data?.volume)}</div>
            </div>

            {/* Mobile View — MATCHING MARKET WATCH STYLE */}
            <div className={`md:hidden h-full px-3 py-2 flex items-center gap-3 border-b border-white/5 ${rowBg}`} style={{ height: `${ROW_HEIGHT}px` }}>
                <div className={`w-1.5 h-14 rounded-full shrink-0 ${up ? 'bg-green-500' : dn ? 'bg-red-500' : 'bg-slate-600'}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-white truncate leading-tight uppercase">{name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${exchange === 'NSE' ? 'bg-blue-500/20 text-blue-400' : exchange === 'MCX_FUT' || exchange === 'MCX_OPT' ? 'bg-orange-500/20 text-orange-400' : exchange === 'NFO_OPT' ? 'bg-pink-500/20 text-pink-400' : exchange === 'NFO_FUT' ? 'bg-purple-500/20 text-purple-400' : exchange === 'CRYPTO' ? 'bg-yellow-500/20 text-yellow-400' : exchange === 'FOREX' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-400'}`}>{exchange}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                        <span className={`text-[12px] tabular-nums font-medium ${bidFlash === 'up' ? 'text-white animate-pulse' : 'text-green-400'}`}>
                            B: {fmtPrice(data?.bid, data?._lastBid)}
                        </span>
                        <span className={`text-[12px] tabular-nums font-medium ${askFlash === 'up' ? 'text-white animate-pulse' : 'text-red-400'}`}>
                            A: {fmtPrice(data?.ask, data?._lastAsk)}
                        </span>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className={`text-[17px] font-extrabold tabular-nums transition-colors duration-300 ${ltpFlash === 'up' ? 'ltp-flash-up' : ltpFlash === 'down' ? 'ltp-flash-down' : up ? 'text-green-400' : dn ? 'text-red-400' : 'text-slate-400'}`}>
                        {fmtPrice(data?.ltp || data?.price, data?._lastLtp)}
                        {ltpFlash && <span className={`text-sm ml-1 ${ltpFlash === 'up' ? 'text-green-400' : 'text-red-400'}`}>{ltpFlash === 'up' ? '↑' : '↓'}</span>}
                    </div>
                    <span className={`text-[12px] font-bold tabular-nums ${up ? 'text-green-400' : dn ? 'text-red-400' : 'text-slate-500'}`}>
                        {up ? '▲' : dn ? '▼' : '–'} {up ? '+' : ''}{chg}%
                    </span>
                </div>
            </div>
        </>
    );
});

const VirtualRow = ({ index, style, rows, nowTs }) => {
    const item = rows[index];
    if (!item) return <div style={style} />;
    return (
        <div style={style}>
            <MemoRow
                symbol={item[0]}
                data={item[1]}
                index={index}
                nowTs={nowTs}
            />
        </div>
    );
};

const KiteDashboard = () => {
    const navigate = useNavigate();
    const marketData = useMarketData();
    const {
        dashboardSections: sections,
        fetchDashboard,
        requestMarketSnapshot,
        kiteStatus,
        setKiteStatus,
        setDashboardSections,
        checkStatus,
        watchlistRows,
        cryptoData,
        forexData,
        commodityData
    } = marketData;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tokenInput, setTokenInput] = useState('');
    const [settingToken, setSettingToken] = useState(false);

    const [activeTab, setActiveTab] = useState('ALL'); // matches TABS[*].key
    const [searchQuery, setSearchQuery] = useState('');
    const [nowTs, setNowTs] = useState(Date.now());
    const [listHeight, setListHeight] = useState(620);
    const listViewportRef = useRef(null);
    const subscribedSigRef = useRef('');
    const [searchRows, setSearchRows] = useState(null);
    const [searchLoading] = useState(false); // always false — local search only

    useEffect(() => {
        const t = setInterval(() => setNowTs(Date.now()), 100);
        return () => clearInterval(t);
    }, []);

    // --- activeEntries: local search + A-Z sort (same as Market Watch) ---
    const activeEntries = useMemo(() => {
        const qRaw = searchQuery.trim();
        const q = qRaw.toLowerCase();

        const kiteRows = watchlistRows || [];
        const cryptoRows = cryptoData || [];
        const forexRows = forexData || [];
        const commodityRows = commodityData || [];

        // Build unified baseRows
        const baseRows = [];
        const seen = new Set();
        [...kiteRows, ...cryptoRows, ...forexRows, ...commodityRows].forEach(r => {
            if (!r?.symbol || seen.has(r.symbol)) return;
            seen.add(r.symbol);
            baseRows.push(r);
        });

        // Tab filter helper
        const tabFilter = (r) => {
            const ex = exchangeFromRow(r);
            if (activeTab === 'ALL') return ex !== 'NSE' && ex !== 'OTHER';
            return ex === activeTab;
        };

        let entries;

        if (qRaw.length >= 1) {
            // Local search within available list, A-Z with starts-with priority
            entries = baseRows.filter(r => {
                if (!r?.symbol) return false;
                if (!tabFilter(r)) return false;
                const name = (r.name || '').toLowerCase();
                const symbol = String(r.symbol).toLowerCase();
                const symbolOnly = symbol.includes(':') ? symbol.split(':')[1] : symbol;
                const disp = (displaySymbol(r) || '').toLowerCase();
                return name.includes(q) || symbol.includes(q) || symbolOnly.includes(q) || disp.includes(q);
            });
            entries.sort((a, b) => {
                const aD = (displaySymbol(a) || '').toLowerCase();
                const bD = (displaySymbol(b) || '').toLowerCase();
                if (aD.startsWith(q) && !bD.startsWith(q)) return -1;
                if (!aD.startsWith(q) && bD.startsWith(q)) return 1;
                return aD.localeCompare(bD);
            });
        } else {
            // No search: tab filter + A-Z sort
            if (activeTab === 'CRYPTO') entries = [...cryptoRows];
            else if (activeTab === 'FOREX') entries = [...forexRows];
            else if (activeTab === 'COMMODITY') entries = [...commodityRows];
            else entries = baseRows.filter(tabFilter);
            entries.sort((a, b) => (displaySymbol(a) || '').localeCompare(displaySymbol(b) || ''));
        }

        // Merge with live tick data
        return entries.map(r => {
            const sym = r.symbol;
            if (!sym) return null;
            const ex = sym.split(':')[0].toLowerCase();
            const live = (sections[ex] || {})[sym] || {};
            const merged = { ...r, ...live };
            // Initialize last values for market close scenario
            if (!merged._lastLtp && merged.ltp && merged.ltp !== 0) merged._lastLtp = merged.ltp;
            if (!merged._lastBid && merged.bid && merged.bid !== 0) merged._lastBid = merged.bid;
            if (!merged._lastAsk && merged.ask && merged.ask !== 0) merged._lastAsk = merged.ask;
            return [sym, merged];
        }).filter(Boolean);
    }, [activeTab, sections, searchQuery, watchlistRows, cryptoData, forexData, commodityData]);

    const kiteSymbolsForSubscription = useMemo(() => {
        const set = new Set();
        activeEntries.forEach(([sym]) => {
            if (sym && (sym.startsWith('NSE:') || sym.startsWith('NFO:') || sym.startsWith('MCX:') || sym.startsWith('CRYPTO:') || sym.startsWith('FOREX:') || sym.startsWith('COMMODITY:'))) {
                set.add(sym);
            }
        });
        return [...set];
    }, [activeEntries]);

    useEffect(() => {
        const socket = marketData.socketRef?.current;
        if (!socket) return;

        const onPrice = (updates) => {
            if (!updates || typeof updates !== 'object') return;
            const now = Date.now();
            const flashDuration = 500;

            setSearchRows((prev) => {
                if (!prev?.length) return prev;
                let changed = false;
                const next = prev.map((row) => {
                    const upd = (updates[row.symbol] || updates[row.instrument_token]);
                    if (!upd) return row;

                    changed = true;
                    const nextRow = { ...row, ...upd };

                    // Track last non-zero values for market close scenarios
                    if (upd.ltp != null && upd.ltp !== 0) {
                        nextRow._lastLtp = upd.ltp;
                    } else if (!nextRow._lastLtp && row.ltp !== 0) {
                        nextRow._lastLtp = row.ltp;
                    }
                    if (upd.bid != null && upd.bid !== 0) {
                        nextRow._lastBid = upd.bid;
                    } else if (!nextRow._lastBid && row.bid !== 0) {
                        nextRow._lastBid = row.bid;
                    }
                    if (upd.ask != null && upd.ask !== 0) {
                        nextRow._lastAsk = upd.ask;
                    } else if (!nextRow._lastAsk && row.ask !== 0) {
                        nextRow._lastAsk = row.ask;
                    }

                    // LTP Flash
                    if (upd.ltp != null && upd.ltp !== row.ltp) {
                        nextRow._ltpFlashUntil = now + flashDuration;
                        nextRow._ltpFlashDir = upd.ltp > row.ltp ? 'up' : 'down';
                    }
                    // Bid Flash
                    if (upd.bid != null && upd.bid !== row.bid) {
                        nextRow._bidFlashUntil = now + flashDuration;
                        nextRow._bidFlashDir = upd.bid > row.bid ? 'up' : 'down';
                    }
                    // Ask Flash
                    if (upd.ask != null && upd.ask !== row.ask) {
                        nextRow._askFlashUntil = now + flashDuration;
                        nextRow._askFlashDir = upd.ask > row.ask ? 'up' : 'down';
                    }
                    return nextRow;
                });
                return changed ? next : prev;
            });
        };

        socket.on('price_update', onPrice);
        return () => socket.off('price_update', onPrice);
    }, [marketData.socketRef]);

    useEffect(() => {
        const socket = marketData.socketRef?.current;
        if (!socket || kiteSymbolsForSubscription.length === 0) return;

        const sig = kiteSymbolsForSubscription.slice().sort().join('|');
        if (sig === subscribedSigRef.current) return;

        const run = () => {
            if (!socket.connected || !kiteSymbolsForSubscription.length) return;
            socket.emit('subscribe_market', kiteSymbolsForSubscription);
            subscribedSigRef.current = sig;
        };

        run();
        socket.on('connect', run);
        return () => {
            socket.off('connect', run);
        };
    }, [kiteSymbolsForSubscription, marketData.socketRef]);

    const onSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    useLayoutEffect(() => {
        const el = listViewportRef.current;
        if (!el) return;
        const update = () => {
            const h = el.clientHeight;
            if (h > 0) setListHeight(Math.max(400, h));
        };
        update();
        const resizeObserver = new ResizeObserver(() => requestAnimationFrame(update));
        resizeObserver.observe(el);
        return () => resizeObserver.disconnect();
    }, [activeEntries.length]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                await checkStatus();
            } catch (err) {
                console.error('Kite dashboard init failed:', err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [checkStatus]);

    const handleLogin = async () => {
        try {
            const data = await api.getKiteLoginURL();
            if (data.login_url) {
                window.open(data.login_url, '_blank', 'width=600,height=700');
                const p = setInterval(async () => {
                    const connected = await checkStatus();
                    if (connected) {
                        requestMarketSnapshot({});
                        clearInterval(p);
                    }
                }, 3000);
                setTimeout(() => clearInterval(p), 300000);
            }
        } catch (err) { setError(err.message); }
    };

    const handleSetToken = async () => {
        if (!tokenInput.trim()) return;
        try {
            setSettingToken(true);
            setError(null);
            await api.setKiteAccessToken(tokenInput.trim());
            setTokenInput('');
            const connected = await checkStatus();
            if (connected) {
                requestMarketSnapshot({});
            }
        }
        catch (err) { setError(err.response?.data?.error || err.message); }
        finally { setSettingToken(false); }
    };

    const handleDisconnect = async () => {
        try {
            await api.disconnectKite();
            setKiteStatus({ connected: false });
            setDashboardSections({ nse: {}, mcx: {}, nfo: {} });
        } catch (err) { setError(err.message); }
    };

    const [syncing, setSyncing] = useState(false);
    const handleSyncInstruments = async () => {
        try {
            setSyncing(true);
            const res = await api.syncKiteInstruments();
            alert(`✅ Sync Complete: ${res.count} instruments saved. Unnecessary scripts removed.`);
            fetchDashboard();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setSyncing(false);
        }
    };

    const tabConfig = TABS.find(t => t.key === activeTab);

    const allCounts = useMemo(() => {
        const kite = watchlistRows || [];
        const counts = { ALL: 0, NSE: 0, NFO_FUT: 0, NFO_OPT: 0, MCX_FUT: 0, MCX_OPT: 0, CRYPTO: 0, FOREX: 0, COMMODITY: 0 };
        kite.forEach(r => {
            const ex = exchangeFromRow(r);
            if (counts[ex] != null) counts[ex]++;
            if (ex !== 'NSE' && ex !== 'OTHER') {
                counts.ALL++;
            }
        });
        counts.CRYPTO = cryptoData?.length || 0;
        counts.FOREX = forexData?.length || 0;
        counts.COMMODITY = commodityData?.length || 0;
        counts.ALL += counts.CRYPTO + counts.FOREX + counts.COMMODITY;
        return counts;
    }, [watchlistRows, cryptoData, forexData, commodityData]);



    if (loading) return (
        <div className="flex flex-1 min-h-0 w-full flex-col items-center justify-center bg-[#0a0f1e] p-4">
            <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">Synchronizing market data...</p>
        </div>
    );

    if (!kiteStatus?.connected) return (
        <div className="flex items-center justify-center h-full bg-transparent p-4">
            <div className="card-panel p-8 max-w-md w-full text-center bg-[#0b0e14] border-white/5 shadow-2xl">
                <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><WifiOff className="w-8 h-8 text-red-400" /></div>
                <h2 className="text-xl font-bold text-white mb-2">Kite Not Connected</h2>
                <p className="text-slate-400 text-sm mb-6 font-medium">Connect Zerodha for live market data.</p>
                <button onClick={handleLogin} className="btn-primary btn-success-gradient mx-auto shadow-lg shadow-green-500/10" style={{ padding: '12px 28px', borderRadius: '10px' }}><LogIn className="w-5 h-5" /> Connect with Zerodha</button>
                <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-white/5" /><span className="text-slate-700 text-[10px] font-bold uppercase tracking-wider">or paste token</span><div className="flex-1 h-px bg-white/5" /></div>
                <div className="flex gap-2">
                    <input type="text" value={tokenInput} onChange={e => setTokenInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSetToken()} placeholder="Access token..." className="flex-1 bg-white/[0.03] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-green-500/30 transition-all font-mono" />
                    <button onClick={handleSetToken} disabled={settingToken || !tokenInput.trim()} className="btn-primary btn-success-gradient shadow-md" style={{ borderRadius: '8px', minWidth: 'auto' }}>{settingToken ? '...' : 'Go'}</button>
                </div>
                {error && <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs font-bold">{error}</div>}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full bg-[#0f1729] overflow-hidden text-white font-sans">
            {/* Header — EXACT HEX FROM MARKET WATCH */}
            <div className="bg-[#1a2240] border-b border-white/5 px-3 sm:px-6 py-3 sm:py-4 shrink-0 transition-colors">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 shrink-0" />
                            <span className="truncate">Live Quotes</span>
                            <div className="flex items-center gap-1.5 ml-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-green-500 text-[10px] uppercase font-black tracking-widest">Live</span>
                            </div>
                        </h1>
                        <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">
                            Connected: {kiteStatus?.user || 'Zerodha'} · Aggregated {allCounts.ALL} Streams
                        </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <button type="button" onClick={() => navigate('/contract-management')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold">
                            <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Contracts</span>
                        </button>
                        <button onClick={handleSyncInstruments} disabled={syncing} title="Sync Instruments (Cleanup DB)" className={`p-1.5 sm:p-2 rounded-lg border border-white/10 transition-all ${syncing ? 'bg-blue-500/20 text-blue-400' : 'bg-[#1a2240] text-slate-400 hover:text-white'}`}>
                            <Database className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
                        </button>
                        <button onClick={fetchDashboard} className="p-1.5 sm:p-2 bg-[#1a2240] text-slate-400 hover:text-white rounded-lg border border-white/10 transition-all">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={handleDisconnect} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 transition-all">
                            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Disconnect</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Search — EXACT HEX FROM MARKET WATCH */}
            <div className="bg-[#141c30] border-b border-white/5 px-3 sm:px-4 py-2 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search (min 2 letters) — Kite instruments + CRYPTO/FOREX…"
                        value={searchQuery}
                        onChange={onSearchChange}
                        className="w-full bg-[#1a2240] border border-white/10 text-white text-xs sm:text-sm pl-10 pr-10 py-2 rounded focus:outline-none focus:border-blue-500"
                    />
                    {searchLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-green-500" aria-hidden />
                    )}
                    {searchQuery && !searchLoading && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Tabs — EXACT HEX FROM MARKET WATCH */}
            <div className="w-full min-w-0 shrink-0 bg-[#141c30] border-b border-white/5">
                <div className="flex min-h-[44px] flex-nowrap items-center gap-2 overflow-x-auto px-3 py-2 sm:px-4 [scrollbar-width:none]">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }}
                            className={`shrink-0 px-3 py-2 rounded-lg text-xs sm:text-sm font-black whitespace-nowrap transition-all active:scale-[0.98] ${activeTab === tab.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'bg-[#1a2240] text-slate-400 hover:bg-slate-700'}`}
                        >
                            {tab.label} ({allCounts[tab.key] || 0})
                        </button>
                    ))}
                </div>
            </div>



            {/* Grid Header — EXACT GEOMETRY FROM MARKET WATCH */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0f1729]">
                <div className="hidden md:grid shrink-0 grid-cols-[50px_minmax(180px,1.4fr)_90px_110px_110px_110px_100px_100px_70px_100px_120px] gap-x-4 items-center bg-[#141c30] text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/10 h-[56px] px-1.5">
                    <div className="text-center font-bold">#</div>
                    <div className="font-bold">Instrument</div>
                    <div className="text-center font-bold hidden lg:block">Type</div>
                    <div className="text-center font-bold">Bid</div>
                    <div className="text-center font-bold">Ask</div>
                    <div className="text-center font-bold">LTP</div>
                    <div className="text-center font-bold hidden xl:block">Expiry</div>
                    <div className="text-center font-bold hidden xl:block">Strike</div>
                    <div className="text-center font-bold hidden xl:block">Opt</div>
                    <div className="text-center font-bold">Change</div>
                    <div className="text-right font-bold pr-4 hidden lg:block">Volume</div>
                </div>

                {/* Body — EXACT GEOMETRY FROM MARKET WATCH */}
                <div className="flex-1 min-h-0" ref={listViewportRef}>
                    {activeEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-600 h-full">
                            <TrendingUp className="w-12 h-12 mb-4 opacity-10" />
                            <p className="text-sm font-bold uppercase tracking-widest opacity-40">No active data streams</p>
                        </div>
                    ) : (
                        <List
                            rowComponent={VirtualRow}
                            rowCount={activeEntries.length}
                            rowHeight={ROW_HEIGHT}
                            rowProps={{
                                rows: activeEntries,
                                nowTs: nowTs
                            }}
                            overscanCount={16}
                            style={{ height: listHeight, width: '100%' }}
                        />
                    )}
                </div>
            </div>

            {error && (
                <div className="fixed bottom-6 right-6 bg-red-500 text-white px-5 py-2.5 rounded-lg shadow-2xl z-50 flex items-center gap-2 text-sm">
                    {error}<button onClick={() => setError(null)} className="text-white/70 hover:text-white ml-2">x</button>
                </div>
            )}
        </div>
    );
};

export default KiteDashboard;
