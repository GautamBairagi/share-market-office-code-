import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition } from 'react';
import { Search, Loader, TrendingUp, Ban, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { List } from 'react-window';
import { useMarketData } from '../../context/MarketDataContext';
import * as api from '../../services/api';
import { exchangeFromRow, displaySymbol } from '../../utils/marketUtils';
import { formatPrice as fmt, formatPriceFallback as fmtPrice } from '../../utils/formatPrice';
import '../../styles/marketDataAnimations.css';

/** Taller rows (~2× old 46px) — easier to read, smoother virtual scroll feel */
const ROW_HEIGHT = 92;
/** Short debounce — list appears quickly after 2nd character */
const SEARCH_DEBOUNCE_MS = 120;

const EXCHANGE_TABS = ['ALL', 'NFO_FUT', 'NFO_OPT', 'MCX_FUT', 'MCX_OPT', 'CRYPTO', 'FOREX', 'COMMODITY'];
const TAB_LABEL = {
    ALL: 'ALL',
    NFO_FUT: 'NFO Fut', NFO_OPT: 'NFO Opt',
    MCX_FUT: 'MCX Fut', MCX_OPT: 'MCX Opt',
    CRYPTO: 'CRYPTO', FOREX: 'FOREX', COMMODITY: 'COMMODITY'
};

function rowFromKiteQuote(fullKey, quote, hit) {
    const ltp = quote?.last_price ?? 0;
    const close = quote?.ohlc?.close ?? 0;
    const chgPct = close ? Number((((ltp - close) / close) * 100).toFixed(2)) : 0;
    const bid = quote?.depth?.buy?.[0]?.price ?? 0;
    const ask = quote?.depth?.sell?.[0]?.price ?? 0;
    return {
        symbol: fullKey,
        name: hit?.name || '',
        type: hit?.type || '',
        expiry: hit?.expiry ? String(hit.expiry).slice(0, 10) : '',
        ltp,
        bid,
        ask,
        oi: quote?.oi ?? 0,
        volume: quote?.volume ?? 0,
        change: chgPct,
        instrument_token: hit?.instrument_token,
        // Initialize last values with current values (for market close scenario)
        _lastLtp: ltp !== 0 ? ltp : undefined,
        _lastBid: bid !== 0 ? bid : undefined,
        _lastAsk: ask !== 0 ? ask : undefined
    };
}

const MarketRow = React.memo(function MarketRow({
    row,
    index,
    nowTs,
    isBanned,
    onToggleBan,
    selectedExchange,
    isSelected,
    onToggleSelect
}) {
    if (!row) return null;
    const isUp = (Number(row.change) || 0) > 0;
    const isDown = (Number(row.change) || 0) < 0;
    const changeVal = Math.abs(Number(row.change) || 0).toFixed(2);
    const changeColor = isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-slate-400';
    const changeBg = isUp ? 'bg-green-500/10' : isDown ? 'bg-red-500/10' : 'bg-white/5';
    const rowBg = index % 2 === 0 ? 'bg-[#141c30]/50' : 'bg-[#1a2240]/30';

    const bidFlash = row._bidFlashUntil > nowTs ? row._bidFlashDir : null;
    const askFlash = row._askFlashUntil > nowTs ? row._askFlashDir : null;
    const ltpArrow = row._ltpFlashUntil > nowTs ? row._ltpFlashDir : null;

    const exchange = exchangeFromRow(row);
    const name = displaySymbol(row);

    return (
        <div className="h-full min-h-0">
            <div className={`md:hidden h-full px-3 py-2 flex items-center gap-3 border-b border-white/5 ${rowBg}`}>
                <div className={`w-1.5 h-14 rounded-full shrink-0 ${isUp ? 'bg-green-500' : isDown ? 'bg-red-500' : 'bg-slate-600'}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-white truncate leading-tight">{name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${exchange === 'NSE' ? 'bg-blue-500/20 text-blue-400' : exchange === 'MCX_FUT' || exchange === 'MCX_OPT' ? 'bg-orange-500/20 text-orange-400' : exchange === 'NFO_OPT' ? 'bg-pink-500/20 text-pink-400' : 'bg-purple-500/20 text-purple-400'}`}>{TAB_LABEL[exchange] || exchange}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                        <span className={`text-[12px] ${bidFlash === 'up' ? 'bid-ask-chip bid-ask-chip-bid-up' : bidFlash === 'down' ? 'bid-ask-chip bid-ask-chip-bid-down' : 'text-green-400'}`}>B: {fmtPrice(row.bid || 0, row._lastBid)}</span>
                        <span className={`text-[12px] ${askFlash === 'up' ? 'bid-ask-chip bid-ask-chip-ask-up' : askFlash === 'down' ? 'bid-ask-chip bid-ask-chip-ask-down' : 'text-red-400'}`}>A: {fmtPrice(row.ask || 0, row._lastAsk)}</span>
                    </div>
                </div>
                <div className="text-right shrink-0 min-w-[90px]">
                    <div className={`text-[17px] font-extrabold tabular-nums px-1.5 py-0.5 rounded inline-flex items-center justify-end ${ltpArrow === 'up' ? 'ltp-flash-up' : ltpArrow === 'down' ? 'ltp-flash-down' : changeColor}`}>
                        <span>{fmtPrice(row.ltp || 0, row._lastLtp)}</span>
                        <span className="w-3.5 inline-block text-right ml-0.5">
                            {ltpArrow ? <span className={`text-xs ${ltpArrow === 'up' ? 'text-green-400' : 'text-red-400'}`}>{ltpArrow === 'up' ? '↑' : '↓'}</span> : ''}
                        </span>
                    </div>
                    <div className={`text-[12px] font-bold tabular-nums ${changeColor}`}>{isUp ? '▲' : isDown ? '▼' : '–'} {isUp ? '+' : ''}{changeVal}%</div>
                </div>
            </div>

            <div className={`hidden md:grid shrink-0 grid-cols-[40px_110px_50px_minmax(180px,1.4fr)_90px_110px_110px_110px_100px_100px_70px_100px_120px] gap-x-4 items-center px-1.5 border-b border-white/[0.03] ${rowBg}`} style={{ height: `${ROW_HEIGHT}px` }}>
                <div className="flex justify-center">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(row.symbol)}
                        className="w-6 h-6 rounded border-white/20 bg-white/5 checked:bg-blue-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                    />
                </div>
                <div className="flex justify-center px-1">
                    {isBanned ? (
                        <button
                            type="button"
                            onClick={() => onToggleBan(row.symbol)}
                            className="w-full py-2 px-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-[10px] shadow-sm transition-all uppercase"
                        >
                            Remove Ban
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onToggleBan(row.symbol)}
                            className="w-full py-2 px-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-[10px] shadow-sm transition-all uppercase"
                        >
                            Add To Ban
                        </button>
                    )}
                </div>
                <div className="text-slate-600 text-sm font-mono text-center">{index + 1}</div>
                <div className="px-2">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-1.5 h-12 rounded-full shrink-0 ${isUp ? 'bg-green-500' : isDown ? 'bg-red-500' : 'bg-slate-600'}`} />
                        <div className="min-w-0">
                            <div className="text-[14px] font-bold text-white truncate leading-tight">{name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{exchange}{row.optionType ? ` · ${row.optionType}` : ''}</div>
                        </div>
                    </div>
                </div>
                <div className="text-center hidden lg:block">
                    <span className="text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded">{row.type || '-'}</span>
                </div>
                <div className="text-center">
                    <span className={bidFlash === 'up' ? 'price-pill bid-ask-button bid-ask-blink-bid-up' : bidFlash === 'down' ? 'price-pill bid-ask-button bid-ask-blink-bid-down' : 'text-[13px] text-green-400 font-bold tabular-nums'}>
                        {fmtPrice(row.bid || 0, row._lastBid)}
                    </span>
                </div>
                <div className="text-center">
                    <span className={askFlash === 'up' ? 'price-pill bid-ask-button bid-ask-blink-ask-up' : askFlash === 'down' ? 'price-pill bid-ask-button bid-ask-blink-ask-down' : 'text-[13px] text-red-400 font-bold tabular-nums'}>
                        {fmtPrice(row.ask || 0, row._lastAsk)}
                    </span>
                </div>
                <div className="text-center">
                    <span className={`text-[15px] font-extrabold tabular-nums px-1.5 py-0.5 rounded transition-colors duration-300 inline-flex items-center justify-center ${ltpArrow === 'up' ? 'ltp-flash-up' : ltpArrow === 'down' ? 'ltp-flash-down' : changeColor}`}>
                        <span>{fmtPrice(row.ltp || 0, row._lastLtp)}</span>
                        <span className="w-3.5 inline-block text-center ml-0.5">
                            {ltpArrow ? <span className={`text-xs ${ltpArrow === 'up' ? 'text-green-400' : 'text-red-400'}`}>{ltpArrow === 'up' ? '↑' : '↓'}</span> : ''}
                        </span>
                    </span>
                </div>
                {selectedExchange !== 'CRYPTO' && selectedExchange !== 'FOREX' && selectedExchange !== 'COMMODITY' ? (
                    <>
                        <div className="text-center text-slate-400 text-xs font-mono hidden xl:block">{row.expiry || '-'}</div>
                        <div className="text-center text-slate-400 text-xs font-mono hidden xl:block">{row.strike != null ? fmt(row.strike) : '-'}</div>
                        <div className="text-center text-slate-400 text-xs font-mono hidden xl:block">{row.optionType || '-'}</div>
                    </>
                ) : (
                    <>
                        <div />
                        <div />
                        <div />
                    </>
                )}
                <div className="text-center">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded text-[11px] font-bold ${changeBg} ${changeColor}`}>
                        {isUp ? '▲' : isDown ? '▼' : '–'} {isUp ? '+' : ''}{changeVal}%
                    </span>
                </div>
                <div className="text-right text-slate-400 text-xs font-mono pr-4 hidden lg:block tabular-nums">{fmt(row.volume || 0)}</div>
            </div>
        </div>
    );
}, (prev, next) =>
    prev.row === next.row &&
    prev.index === next.index &&
    prev.nowTs === next.nowTs &&
    prev.isBanned === next.isBanned &&
    prev.selectedExchange === next.selectedExchange
);
const VirtualRow = ({ index, style, rows, nowTs, bannedSymbols, onToggleBan, selectedExchange, selectedSymbols, onToggleSelect }) => {
    const row = rows[index];
    if (!row) return <div style={style} />;
    return (
        <div style={style}>
            <MarketRow
                row={row}
                index={index}
                nowTs={nowTs}
                isBanned={bannedSymbols.has(row.symbol)}
                onToggleBan={onToggleBan}
                selectedExchange={selectedExchange}
                isSelected={selectedSymbols.has(row.symbol)}
                onToggleSelect={onToggleSelect}
            />
        </div>
    );
};

const MarketWatchPage = () => {
    const navigate = useNavigate();
    const {
        watchlistRows,
        cryptoData,
        forexData,
        commodityData,
        kiteStatus,
        socketRef,
        dataReady,
        excludedContracts
    } = useMarketData();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExchange, setSelectedExchange] = useState('ALL');
    const [bannedSymbols, setBannedSymbols] = useState(new Set());
    const [selectedSymbols, setSelectedSymbols] = useState(new Set());
    const [nowTs, setNowTs] = useState(Date.now());
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, text: '', type: '' });

    useEffect(() => {
        const t = setInterval(() => setNowTs(Date.now()), 100);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        fetchBannedScrips();
    }, []);

    const fetchBannedScrips = async () => {
        try {
            const data = await api.getBannedScrips();
            setBannedSymbols(new Set(data || []));
        } catch (err) {
            console.error('Failed to fetch banned scrips:', err);
        }
    };

    const showToast = (text, type = 'success') => {
        setToast({ show: true, text, type });
        setTimeout(() => setToast({ show: false, text: '', type: '' }), 3000);
    };

    const handleToggleBan = async (symbol) => {
        const isCurrentlyBanned = bannedSymbols.has(symbol);
        const action = isCurrentlyBanned ? 'unban' : 'ban';
        try {
            await api.toggleBannedScrip(symbol, action);
            setBannedSymbols(prev => {
                const next = new Set(prev);
                if (isCurrentlyBanned) next.delete(symbol);
                else next.add(symbol);
                return next;
            });
            showToast(`${symbol} ${action === 'ban' ? 'banned' : 'unbanned'} successfully`);
        } catch (err) {
            showToast(err.message || 'Failed to update ban status', 'error');
        }
    };

    const handleBulkToggleBan = async (action) => {
        if (selectedSymbols.size === 0) return;
        setSubmitting(true);
        const symbols = Array.from(selectedSymbols);
        try {
            await api.bulkToggleBannedScrips(symbols, action);
            setBannedSymbols(prev => {
                const next = new Set(prev);
                symbols.forEach(s => {
                    if (action === 'ban') next.add(s);
                    else next.delete(s);
                });
                return next;
            });
            setSelectedSymbols(new Set());
            showToast(`${symbols.length} scrips ${action === 'ban' ? 'banned' : 'unbanned'} successfully`);
        } catch (err) {
            showToast(err.message || 'Bulk operation failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const [listHeight, setListHeight] = useState(620);

    const listViewportRef = useRef(null);
    const subscribedSigRef = useRef('');

    const [searchRows, setSearchRows] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);

    const [indices, setIndices] = useState([]);
    const [indicesError, setIndicesError] = useState(null);

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const data = await api.getIndices();
                if (data && Array.isArray(data)) {
                    const mapped = data.map(idx => ({
                        ...idx,
                        symbol: `NSE:${idx.name}`,
                        exchange: 'NSE',
                        category: 'NSE',
                        type: 'INDEX',
                        // Ensure all price fields are set (backend now provides these)
                        ltp: Number(idx.ltp || 0),
                        bid: Number(idx.bid || 0),
                        ask: Number(idx.ask || 0),
                        change: Number(idx.change || 0),
                        chg_pct: Number(idx.chg_pct || 0),
                        volume: Number(idx.volume || 0)
                    }));
                    setIndices(mapped);

                    // Check if all values are 0 (indicates Kite not authenticated)
                    if (mapped.every(idx => idx.ltp === 0 && idx.bid === 0 && idx.ask === 0)) {
                        setIndicesError('🔴 Zerodha Kite not authenticated. Connect via Kite Dashboard to get live indices rates.');
                    } else {
                        setIndicesError(null);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch indices:', err);
                setIndicesError('Failed to fetch indices');
            }
        };
        fetchIndices();
    }, []);

    const baseRows = useMemo(() => {
        const kite = watchlistRows || [];
        const crypto = cryptoData || [];
        const forex = forexData || [];
        const commodity = commodityData || [];
        const idx = indices || [];
        const seen = new Set();
        const out = [];
        for (const r of [...idx, ...kite, ...crypto, ...forex, ...commodity]) {
            if (!r?.symbol || seen.has(r.symbol)) continue;
            seen.add(r.symbol);
            // Ensure last values are initialized for NFO/MCX markets
            const row = { ...r };
            if (!row._lastLtp && r.ltp && r.ltp !== 0) row._lastLtp = r.ltp;
            if (!row._lastBid && r.bid && r.bid !== 0) row._lastBid = r.bid;
            if (!row._lastAsk && r.ask && r.ask !== 0) row._lastAsk = r.ask;
            out.push(row);
        }
        return out;
    }, [watchlistRows, cryptoData, forexData, commodityData, indices]);

    const isLiveConnected = kiteStatus?.connected === true;

    const kiteSymbolsForSubscription = useMemo(() => {
        const set = new Set();
        baseRows.forEach((r) => {
            if (r?.symbol) set.add(r.symbol);
        });
        const q = searchTerm.trim();
        if (q.length >= 2 && Array.isArray(searchRows)) {
            searchRows.forEach((r) => {
                if (r?.symbol) set.add(r.symbol);
            });
        }
        return [...set].filter((s) => s.startsWith('NSE:') || s.startsWith('NFO:') || s.startsWith('MCX:') || s.startsWith('CRYPTO:') || s.startsWith('FOREX:') || s.startsWith('COMMODITY:'));
    }, [baseRows, searchTerm, searchRows]);

    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket || kiteSymbolsForSubscription.length === 0) return;

        const kiteSymbols = kiteSymbolsForSubscription;
        const sig = kiteSymbols.slice().sort().join('|');
        if (sig === subscribedSigRef.current) return;

        const run = () => {
            if (!socket.connected || !kiteSymbols.length) return;
            socket.emit('subscribe_market', kiteSymbols);
            subscribedSigRef.current = sig;
        };

        run();
        socket.on('connect', run);
        return () => {
            socket.off('connect', run);
        };
    }, [kiteSymbolsForSubscription, socketRef]);

    useEffect(() => {
        setSearchRows(null);
        setSearchLoading(false);
    }, [searchTerm]);


    useEffect(() => {
        const socket = socketRef?.current;
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
                    const originalType = row.type;
                    const nextRow = { ...row, ...upd };
                    if (originalType) {
                        nextRow.type = originalType;
                    }

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
                    if (upd.ltp != null && (Math.abs(upd.ltp - row.ltp) > 0.0001)) {
                        nextRow._ltpFlashUntil = now + flashDuration;
                        nextRow._ltpFlashDir = upd.ltp > row.ltp ? 'up' : 'down';
                    }
                    if (upd.bid != null && (Math.abs(upd.bid - row.bid) > 0.0001)) {
                        nextRow._bidFlashUntil = now + flashDuration;
                        nextRow._bidFlashDir = upd.bid > row.bid ? 'up' : 'down';
                    }
                    if (upd.ask != null && (Math.abs(upd.ask - row.ask) > 0.0001)) {
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
    }, [socketRef, socketRef.current]);

    useLayoutEffect(() => {
        const el = listViewportRef.current;
        if (!el) return;
        const update = () => {
            const h = el.clientHeight;
            if (h > 0) setListHeight(Math.max(280, h));
        };
        update();
        const resizeObserver = new ResizeObserver(() => requestAnimationFrame(update));
        resizeObserver.observe(el);
        return () => resizeObserver.disconnect();
    }, [baseRows.length]);

    const filteredRows = useMemo(() => {
        const qRaw = searchTerm.trim();
        const q = qRaw.toLowerCase();
        const excludedSet = new Set(excludedContracts || []);

        if (qRaw.length >= 2) {
            // ── Search mode: local baseRows only, A-Z with starts-with priority ──
            const results = baseRows.filter(row => {
                if (!row || !row.symbol) return false;
                if (excludedSet.has(row.symbol)) return false;
                const ex = exchangeFromRow(row);
                if (selectedExchange === 'ALL') { if (ex === 'NSE' || ex === 'OTHER') return false; }
                else { if (ex !== selectedExchange) return false; }
                const name = (row.name || '').toLowerCase();
                const symbol = String(row.symbol).toLowerCase();
                const symbolOnly = symbol.includes(':') ? symbol.split(':')[1] : symbol;
                const disp = (displaySymbol(row) || '').toLowerCase();
                return name.includes(q) || symbol.includes(q) || symbolOnly.includes(q) || disp.includes(q);
            });

            results.sort((a, b) => {
                const aD = (displaySymbol(a) || '').toLowerCase();
                const bD = (displaySymbol(b) || '').toLowerCase();
                if (aD.startsWith(q) && !bD.startsWith(q)) return -1;
                if (!aD.startsWith(q) && bD.startsWith(q)) return 1;
                return aD.localeCompare(bD);
            });

            return results;
        }

        // ── No search: A-Z alphabetical order ──
        const results = baseRows.filter(row => {
            if (!row || !row.symbol) return false;
            if (excludedSet.has(row.symbol)) return false;
            const exchange = exchangeFromRow(row);
            if (selectedExchange === 'ALL') return exchange !== 'NSE' && exchange !== 'OTHER';
            return exchange === selectedExchange;
        });
        results.sort((a, b) => (displaySymbol(a) || '').localeCompare(displaySymbol(b) || ''));
        return results;
    }, [baseRows, selectedExchange, searchTerm, searchRows, excludedContracts, cryptoData, forexData, commodityData]);

    const exchangeCounts = useMemo(() => {
        const counts = { ALL: 0, NSE: 0, NFO_FUT: 0, NFO_OPT: 0, MCX_FUT: 0, MCX_OPT: 0, CRYPTO: 0, FOREX: 0, COMMODITY: 0 };
        const excludedSet = new Set(excludedContracts || []);
        baseRows.forEach((row) => {
            if (!row || excludedSet.has(row.symbol)) return;
            const ex = exchangeFromRow(row);
            if (ex !== 'NSE' && ex !== 'OTHER' && counts[ex] != null) {
                counts[ex] += 1;
                counts.ALL += 1;
            } else if (ex === 'NSE') {
                counts.NSE += 1;
            }
        });
        return counts;
    }, [baseRows, bannedSymbols, excludedContracts]);
    const rowData = useMemo(() => ({
        rows: filteredRows,
        nowTs,
        bannedSymbols,
        onToggleBan: handleToggleBan,
        selectedExchange,
        selectedSymbols,
        onToggleSelect: (symbol) => {
            setSelectedSymbols((prev) => {
                const next = new Set(prev);
                if (next.has(symbol)) next.delete(symbol);
                else next.add(symbol);
                return next;
            });
        }
    }), [filteredRows, nowTs, bannedSymbols, selectedExchange, selectedSymbols]);

    const showBlockingLoader = !dataReady && baseRows.length === 0;

    if (showBlockingLoader) {
        return (
            <div className="flex flex-1 min-h-0 w-full flex-col items-center justify-center bg-[#0a0f1e] p-4">
                <Loader className="w-8 h-8 animate-spin text-green-500 mx-auto mb-3" />
                <p className="text-slate-400">Loading market data...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full bg-[#0f1729] overflow-hidden">
            {indicesError && (
                <div className="bg-red-500/10 border-b border-red-500/30 px-3 sm:px-6 py-2 shrink-0">
                    <p className="text-red-400 text-xs sm:text-sm font-medium">{indicesError}</p>
                </div>
            )}
            <div className="bg-[#1a2240] border-b border-white/5 px-3 sm:px-6 py-3 sm:py-4 shrink-0">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 shrink-0" />
                            <span className="truncate">Market Watch</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">
                            Search: Zerodha instruments (backend) · live + socket
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {selectedSymbols.size > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                <button
                                    onClick={() => handleBulkToggleBan('ban')}
                                    disabled={submitting}
                                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-red-500/30 transition-all flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                                    ADD TO BAN ({selectedSymbols.size})
                                </button>
                                <button
                                    onClick={() => handleBulkToggleBan('unban')}
                                    disabled={submitting}
                                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-green-500/30 transition-all flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                    REMOVE BAN ({selectedSymbols.size})
                                </button>
                                <div className="w-px h-4 bg-white/10 mx-1" />
                            </div>
                        )}
                        <button type="button" onClick={() => navigate('/contract-management')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                            <Settings className="w-4 h-4" /> Contracts
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-[#141c30] border-b border-white/5 px-3 sm:px-4 py-2 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search — Kite instruments + CRYPTO/FOREX…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1a2240] border border-white/10 text-white text-xs sm:text-sm pl-10 pr-10 py-2 rounded focus:outline-none focus:border-blue-500"
                    />
                    {searchLoading && (
                        <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-green-500" aria-hidden />
                    )}
                </div>
            </div>

            <div className="w-full min-w-0 shrink-0 bg-[#141c30] border-b border-white/5">
                <div
                    className="flex min-h-[44px] flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain touch-pan-x px-3 py-2 sm:px-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {EXCHANGE_TABS.map((exchange) => (
                        <button
                            key={exchange}
                            type="button"
                            onClick={() => startTransition(() => setSelectedExchange(exchange))}
                            className={`shrink-0 px-3 py-2 rounded-lg text-xs sm:text-sm font-black whitespace-nowrap transition-all active:scale-[0.98] ${selectedExchange === exchange ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'bg-[#1a2240] text-slate-400 hover:bg-slate-700'}`}
                        >
                            {TAB_LABEL[exchange] || exchange} ({exchangeCounts[exchange] || 0})
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0a0f1e]">
                {/* Toast Notification */}
                {toast.show && (
                    <div className={`fixed top-24 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded shadow-2xl transition-all border ${toast.type === 'success' ? 'bg-[#1b2a21] border-green-500/30 text-green-400' : 'bg-[#2a1b1b] border-red-500/30 text-red-400'
                        }`}>
                        {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="text-[14px] font-medium tracking-wide">{toast.text}</p>
                    </div>
                )}
                {/* Header — 13 Columns matching Row layout */}
                <div className="hidden md:grid shrink-0 grid-cols-[40px_110px_50px_minmax(180px,1.4fr)_90px_110px_110px_110px_100px_100px_70px_100px_120px] gap-x-4 items-center bg-[#141c30] text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/10 h-[56px] px-1.5">
                    <div className="flex justify-center">
                        <input
                            type="checkbox"
                            checked={filteredRows.length > 0 && selectedSymbols.size === filteredRows.length}
                            onChange={() => {
                                if (selectedSymbols.size === filteredRows.length) setSelectedSymbols(new Set());
                                else setSelectedSymbols(new Set(filteredRows.map(r => r.symbol)));
                            }}
                            className="w-6 h-6 rounded border-white/20 bg-white/5 checked:bg-blue-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                        />
                    </div>
                    <div className="text-center font-bold">Ban Action</div>
                    <div className="text-center font-bold text-slate-600">#</div>
                    <div className="font-bold">Symbol</div>
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

                <div ref={listViewportRef} className="flex-1 min-h-0 w-full flex flex-col">
                    {dataReady && !baseRows.length && searchTerm.trim().length < 1 ? (
                        <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-12 text-center text-slate-500">
                            <TrendingUp className="w-12 h-12 mb-4 opacity-10" />
                            <p>{isLiveConnected ? 'No symbols found' : 'Kite not connected'}</p>
                        </div>
                    ) : (filteredRows.length === 0) ? (
                        <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-12 text-center text-slate-500">
                            <TrendingUp className="w-12 h-12 mb-4 opacity-10" />
                            <p>
                                {searchTerm.trim().length >= 1
                                    ? (searchLoading ? 'Searching...' : 'No matches — try another symbol')
                                    : 'No symbols in this filter'}
                            </p>
                        </div>
                    ) : (
                        <List
                            rowComponent={VirtualRow}
                            rowCount={filteredRows.length}
                            rowHeight={ROW_HEIGHT}
                            rowProps={rowData}
                            defaultHeight={Math.max(280, listHeight)}
                            overscanCount={16}
                            style={{ height: Math.max(280, listHeight), width: '100%' }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketWatchPage;
