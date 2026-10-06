import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition } from 'react';
import { Search, Loader, TrendingUp, Ban, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { List } from 'react-window';
import { useMarketData } from '../../context/MarketDataContext';
import * as api from '../../services/api';
import { exchangeFromRow, displaySymbol } from '../../utils/marketUtils';
import '../../styles/marketDataAnimations.css';

/** Taller rows (~2× old 46px) — easier to read, smoother virtual scroll feel */
const ROW_HEIGHT = 92;
/** Short debounce — list appears quickly after 2nd character */
const SEARCH_DEBOUNCE_MS = 120;

const EXCHANGE_TABS = ['ALL', 'NSE', 'NFO', 'MCX', 'CRYPTO', 'FOREX'];

function rowFromKiteQuote(fullKey, quote, hit) {
    const ltp = quote?.last_price ?? 0;
    const close = quote?.ohlc?.close ?? 0;
    const chgPct = close ? Number((((ltp - close) / close) * 100).toFixed(2)) : 0;
    return {
        symbol: fullKey,
        name: hit?.name || '',
        type: hit?.type || '',
        expiry: hit?.expiry ? String(hit.expiry).slice(0, 10) : '',
        ltp,
        bid: quote?.depth?.buy?.[0]?.price ?? 0,
        ask: quote?.depth?.sell?.[0]?.price ?? 0,
        oi: quote?.oi ?? 0,
        volume: quote?.volume ?? 0,
        change: chgPct,
        instrument_token: hit?.instrument_token
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

    const fmt = (n) => (n != null ? Number(n).toLocaleString('en-IN') : '-');
    const exchange = exchangeFromRow(row);
    const name = displaySymbol(row);

    return (
        <div className="h-full min-h-0">
            <div className={`md:hidden h-full px-3 py-2 flex items-center gap-3 border-b border-white/5 ${rowBg}`}>
                <div className={`w-1.5 h-14 rounded-full shrink-0 ${isUp ? 'bg-green-500' : isDown ? 'bg-red-500' : 'bg-slate-600'}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-white truncate leading-tight">{name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${exchange === 'NSE' ? 'bg-blue-500/20 text-blue-400' : exchange === 'MCX' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}`}>{exchange}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                        <span className={`text-[12px] ${bidFlash === 'up' ? 'bid-ask-chip bid-ask-chip-up' : bidFlash === 'down' ? 'bid-ask-chip bid-ask-chip-down' : 'text-green-400'}`}>B: {fmt(row.bid || 0)}</span>
                        <span className={`text-[12px] ${askFlash === 'up' ? 'bid-ask-chip bid-ask-chip-up' : askFlash === 'down' ? 'bid-ask-chip bid-ask-chip-down' : 'text-red-400'}`}>A: {fmt(row.ask || 0)}</span>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className={`text-[17px] font-extrabold tabular-nums ${changeColor}`}>
                        {fmt(row.ltp || 0)}
                        {ltpArrow && <span className={`text-sm ml-1 ${ltpArrow === 'up' ? 'text-green-400' : 'text-red-400'}`}>{ltpArrow === 'up' ? '↑' : '↓'}</span>}
                    </div>
                    <span className={`text-[12px] font-bold tabular-nums ${changeColor}`}>{isUp ? '▲' : isDown ? '▼' : '–'} {isUp ? '+' : ''}{changeVal}%</span>
                </div>
            </div>

            <div className={`hidden md:grid shrink-0 grid-cols-[40px_110px_50px_minmax(180px,1.4fr)_90px_110px_110px_110px_100px_100px_70px_100px_120px] items-center px-1.5 border-b border-white/[0.03] ${rowBg}`} style={{ height: `${ROW_HEIGHT}px` }}>
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
                    <span className={bidFlash === 'up' ? 'price-pill bid-ask-button bid-ask-blink-up' : bidFlash === 'down' ? 'price-pill bid-ask-button bid-ask-blink-down' : 'text-[13px] text-green-400 font-bold tabular-nums'}>
                        {fmt(row.bid || 0)}
                    </span>
                </div>
                <div className="text-center">
                    <span className={askFlash === 'up' ? 'price-pill bid-ask-button bid-ask-blink-up' : askFlash === 'down' ? 'price-pill bid-ask-button bid-ask-blink-down' : 'text-[13px] text-red-400 font-bold tabular-nums'}>
                        {fmt(row.ask || 0)}
                    </span>
                </div>
                <div className="text-center">
                    <span className={`text-[15px] font-extrabold tabular-nums ${changeColor}`}>
                        {fmt(row.ltp || 0)}
                        {ltpArrow && <span className={`text-xs ml-1 ${ltpArrow === 'up' ? 'text-green-400' : 'text-red-400'}`}>{ltpArrow === 'up' ? '↑' : '↓'}</span>}
                    </span>
                </div>
                {selectedExchange !== 'CRYPTO' && selectedExchange !== 'FOREX' ? (
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

    useEffect(() => {
        const t = setInterval(() => setNowTs(Date.now()), 100);
        return () => clearInterval(t);
    }, []);

    const [listHeight, setListHeight] = useState(620);

    const listViewportRef = useRef(null);
    const subscribedSigRef = useRef('');
    const searchAbortRef = useRef(0);

    const [searchRows, setSearchRows] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);

    const baseRows = useMemo(() => {
        const kite = watchlistRows || [];
        const crypto = cryptoData || [];
        const forex = forexData || [];
        const seen = new Set();
        const out = [];
        for (const r of [...kite, ...crypto, ...forex]) {
            if (!r?.symbol || seen.has(r.symbol)) continue;
            seen.add(r.symbol);
            out.push(r);
        }
        return out;
    }, [watchlistRows, cryptoData, forexData]);

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
        return [...set].filter((s) => s.startsWith('NSE:') || s.startsWith('NFO:') || s.startsWith('MCX:'));
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
        const raw = searchTerm.trim();
        if (raw.length < 2) {
            setSearchRows(null);
            setSearchLoading(false);
            searchAbortRef.current += 1;
            return;
        }

        setSearchLoading(true);
        const t = setTimeout(async () => {
            const myId = ++searchAbortRef.current;
            try {
                const hits = await api.searchKiteInstruments(raw);
                if (searchAbortRef.current !== myId) return;

                const hitsArr = hits || [];
                const preliminary = hitsArr.map((hit) => {
                    const fullKey = `${hit.exchange}:${hit.symbol}`;
                    return rowFromKiteQuote(fullKey, null, hit);
                });
                setSearchRows(preliminary);
                setSearchLoading(false);

                if (hitsArr.length === 0) return;

                try {
                    const keys = hitsArr.map((h) => `${h.exchange}:${h.symbol}`);
                    const quotes = await api.getKiteQuote(keys.join(','));
                    if (searchAbortRef.current !== myId) return;
                    const rows = hitsArr.map((hit) => {
                        const fullKey = `${hit.exchange}:${hit.symbol}`;
                        const tok = hit.instrument_token != null ? String(hit.instrument_token) : null;
                        const q = tok && quotes ? quotes[tok] : null;
                        return rowFromKiteQuote(fullKey, q, hit);
                    });
                    setSearchRows(rows);
                } catch {
                    /* keep preliminary rows if quotes fail */
                }
            } catch {
                if (searchAbortRef.current === myId) {
                    setSearchRows([]);
                    setSearchLoading(false);
                }
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket) return;
        const onPrice = (updates) => {
            if (!updates || typeof updates !== 'object') return;
            setSearchRows((prev) => {
                if (!prev?.length) return prev;
                let changed = false;
                const next = prev.map((row) => {
                    const upd = updates[row.symbol];
                    if (!upd) return row;
                    changed = true;
                    return {
                        ...row,
                        ltp: upd.ltp ?? row.ltp,
                        bid: upd.bid ?? row.bid,
                        ask: upd.ask ?? row.ask,
                        volume: upd.volume ?? row.volume,
                        change: upd.change ?? upd.net_change ?? row.change
                    };
                });
                return changed ? next : prev;
            });
        };
        socket.on('price_update', onPrice);
        return () => socket.off('price_update', onPrice);
    }, [socketRef]);

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
            if (searchRows === null) return [];
            
            let rows = searchRows
                .map((r) => ({ ...r }))
                .filter((r) => r?.symbol && !excludedSet.has(r.symbol));
            const seen = new Set(rows.map((r) => r.symbol));

            const mergeCf = [...(cryptoData || []), ...(forexData || [])];
            mergeCf.forEach((r) => {
                const symKey = r?.symbol;
                if (!symKey || excludedSet.has(symKey) || seen.has(symKey)) return;
                const sym = String(symKey).toLowerCase();
                const nm = String(r.name || '').toLowerCase();
                if (sym.startsWith(q) || sym.includes(':' + q) || nm.startsWith(q)) {
                    seen.add(symKey);
                    rows.push({ ...r });
                }
            });

            if (selectedExchange !== 'ALL') {
                rows = rows.filter((r) => exchangeFromRow(r) === selectedExchange);
            }
            return rows;
        }

        return baseRows.filter((row) => {
            if (!row || !row.symbol) return false;
            if (excludedSet.has(row.symbol)) return false;
            
            const exchange = exchangeFromRow(row);
            if (selectedExchange !== 'ALL' && exchange !== selectedExchange) return false;
            if (!q) return true;

            const symbol = String(row.symbol).toLowerCase();
            const name = String(row.name || '').toLowerCase();
            return symbol.startsWith(q) || symbol.includes(':' + q) || name.startsWith(q);
        });
    }, [baseRows, bannedSymbols, selectedExchange, searchTerm, searchRows, cryptoData, forexData, excludedContracts]);

    const exchangeCounts = useMemo(() => {
        const counts = { ALL: 0, NSE: 0, NFO: 0, MCX: 0, CRYPTO: 0, FOREX: 0 };
        const excludedSet = new Set(excludedContracts || []);
        baseRows.forEach((row) => {
            if (!row || excludedSet.has(row.symbol)) return;
            counts.ALL += 1;
            const ex = exchangeFromRow(row);
            if (counts[ex] != null) counts[ex] += 1;
        });
        return counts;
    }, [baseRows, bannedSymbols, excludedContracts]);
    const rowData = useMemo(() => ({
        rows: filteredRows,
        nowTs,
        bannedSymbols,
        onToggleBan: (symbol) => {
            setBannedSymbols((prev) => {
                const next = new Set(prev);
                if (next.has(symbol)) next.delete(symbol);
                else next.add(symbol);
                return next;
            });
        },
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
            <div className="bg-[#1a2240] border-b border-white/5 px-3 sm:px-6 py-3 sm:py-4 shrink-0">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 shrink-0" />
                            <span className="truncate">Market Watch</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">
                            Search: Zerodha instruments (backend) · 2+ chars · list live + socket
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {selectedSymbols.size > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                <button className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-red-500/30 transition-all">
                                    BAN SELECTED ({selectedSymbols.size})
                                </button>
                                <button className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-green-500/30 transition-all">
                                    UNBAN SELECTED ({selectedSymbols.size})
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
                        placeholder="Search (min 2 letters) — Kite instruments + CRYPTO/FOREX…"
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
                            {exchange} ({exchangeCounts[exchange] || 0})
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0a0f1e]">
                <div className="hidden md:grid shrink-0 grid-cols-[40px_110px_50px_minmax(180px,1.4fr)_90px_110px_110px_110px_100px_100px_70px_100px_120px] items-center bg-[#141c30] text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/10 h-[56px] px-1.5">
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
                    {dataReady && !baseRows.length && searchTerm.trim().length < 2 ? (
                        <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-12 text-center text-slate-500">
                            <TrendingUp className="w-12 h-12 mb-4 opacity-10" />
                            <p>{isLiveConnected ? 'No symbols found' : 'Kite not connected'}</p>
                        </div>
                    ) : filteredRows.length === 0 ? (
                        <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-12 text-center text-slate-500">
                            <TrendingUp className="w-12 h-12 mb-4 opacity-10" />
                            <p>
                                {searchTerm.trim().length >= 2
                                    ? (searchLoading ? 'Searching…' : 'No matches — try another symbol')
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
