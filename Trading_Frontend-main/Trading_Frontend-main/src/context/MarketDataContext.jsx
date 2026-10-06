import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import * as api from '../services/api';

const MarketDataContext = createContext(null);

/**
 * Live market data over Socket.IO:
 * - `request_market_snapshot` / `market_snapshot` (watchlist + crypto + forex + **dashboard**)
 * - `price_update`, `market_data_update`
 *
 * DevTools: Network mein "bar bar" alag rows mat dhoondo — WebSocket = **ek hi connection**.
 * Filter **WS** lagao, us row par click → **Messages** (ya Frames) tab mein har ~1s emit/response dikhega.
 * "Fetch/XHR" filter par sirf REST dikhti hai, socket events yahan nahi.
 */
export const MarketDataProvider = ({ children }) => {
    const [watchlistRows, setWatchlistRows] = useState([]);
    const [cryptoData, setCryptoData] = useState([]);
    const [forexData, setForexData] = useState([]);
    const [commodityData, setCommodityData] = useState([]);
    const [dashboardSections, setDashboardSections] = useState({ nse: {}, mcx: {}, nfo: {} });
    const [dashboardGroups, setDashboardGroups] = useState({});
    const [dashboardCounts, setDashboardCounts] = useState({ nse: 0, mcx: 0, nfo: 0, total: 0 });
    const [nseGroupCounts, setNseGroupCounts] = useState({});
    const [kiteStatus, setKiteStatus] = useState(null);
    const [excludedContracts, setExcludedContracts] = useState([]);
    const [dataReady, setDataReady] = useState(false);

    const socketRef = useRef(null);
    const snapshotIntervalRef = useRef(null);
    const prevSectionsRef = useRef({ nse: {}, mcx: {}, nfo: {} });

    const [binanceError, setBinanceError] = useState(null);

    const applyMarketSnapshot = useCallback((payload) => {
        if (!payload || typeof payload !== 'object') return;

        const { kite_connected, kite_disconnected, watchlist, crypto, forex, commodity, binance_error, dashboard, excludedContracts: ex } = payload;

        setBinanceError(binance_error || null);
        setKiteStatus((prev) => {
            const prevObj = (prev && typeof prev === 'object') ? prev : {};
            // Only force connected=false when server sends explicit disconnect signal.
            // A snapshot that merely failed to build data (kite_connected=false but
            // kite_disconnected=false) must NOT override a positive status set by checkStatus().
            let connected;
            if (kite_connected) {
                connected = true;
            } else if (kite_disconnected) {
                connected = false;
            } else {
                connected = prevObj.connected ?? false;
            }
            return { ...prevObj, connected };
        });

        if (dashboard?.status === 'success' && dashboard.data) {
            setDashboardSections((prev) => {
                prevSectionsRef.current = prev;
                return dashboard.data;
            });
            if (dashboard.counts) setDashboardCounts(dashboard.counts);
            if (dashboard.groups) setDashboardGroups(dashboard.groups);
            if (dashboard.nseGroups) setNseGroupCounts(dashboard.nseGroups);
        }

        if (Array.isArray(watchlist)) {
            const seen = new Set();
            const deduped = watchlist.filter((r) => {
                if (!r?.symbol || seen.has(r.symbol)) return false;
                seen.add(r.symbol);
                return true;
            });
            setWatchlistRows(deduped);
        }

        if (Array.isArray(crypto)) {
            setCryptoData(
                crypto.map((c) => ({
                    ...c,
                    symbol: c.symbol?.startsWith('CRYPTO:') ? c.symbol : `CRYPTO:${c.symbol}`,
                    type: 'CRYPTO'
                }))
            );
        }
        if (Array.isArray(forex)) {
            setForexData(
                forex.map((f) => ({
                    ...f,
                    symbol: f.symbol?.startsWith('FOREX:') ? f.symbol : `FOREX:${f.symbol}`,
                    type: 'FOREX'
                }))
            );
        }
        if (Array.isArray(commodity)) {
            const seen = new Set();
            const dedupedCommodity = [];
            for (const c of commodity) {
                const cleanSym = (c.symbol || '').replace(/^COMMODITY:/i, '').toUpperCase();
                // Filter out duplicate unslashed versions of XAU/USD and XAG/USD
                if (cleanSym === 'XAUUSD' || cleanSym === 'XAGUSD') continue;
                const norm = cleanSym.replace(/[\s\/\_\-]+/g, '');
                if (seen.has(norm)) continue;
                seen.add(norm);
                dedupedCommodity.push({
                    ...c,
                    symbol: c.symbol?.startsWith('COMMODITY:') ? c.symbol : `COMMODITY:${c.symbol}`,
                    type: 'COMMODITY'
                });
            }
            setCommodityData(dedupedCommodity);
        }
        if (Array.isArray(ex)) {
            setExcludedContracts(ex);
        }
        setDataReady(true);
    }, []);

    const requestMarketSnapshot = useCallback((query = {}) => {
        const s = socketRef.current;
        if (s?.connected) s.emit('request_market_snapshot', query);
    }, []);

    const fetchWatchlist = useCallback(() => {
        requestMarketSnapshot({});
    }, [requestMarketSnapshot]);

    const fetchCryptoForex = useCallback(() => {
        requestMarketSnapshot({});
    }, [requestMarketSnapshot]);

    const fetchDashboard = useCallback(() => {
        requestMarketSnapshot({});
    }, [requestMarketSnapshot]);

    const checkStatus = useCallback(async () => {
        try {
            const status = await api.getKiteStatus();
            setKiteStatus(status);
            return status?.connected;
        } catch {
            setKiteStatus((prev) => ({ ...(prev && typeof prev === 'object' ? prev : {}), connected: false }));
            return false;
        }
    }, []);

    useEffect(() => {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
        const socket = io(api.SOCKET_URL, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 2000,
            transports: ['websocket']
        });
        socketRef.current = socket;

        const onSnapshot = (payload) => {
            applyMarketSnapshot(payload);
        };

        socket.on('market_snapshot', onSnapshot);

        socket.on('connect', () => {
            socket.emit('request_market_snapshot', {});
        });

        socket.on('market_snapshot_needed', () => {
            console.log('🔄 Server requested snapshot refresh (Config updated)');
            socket.emit('request_market_snapshot', {});
        });

        socket.on('price_update', (updates) => {
            if (!updates || typeof updates !== 'object') return;

            const now = Date.now();
            const flashDuration = 500;

            const updateRowWithFlashes = (row, upd) => {
                const originalType = row.type;
                const nextRow = { ...row, ...upd };
                if (originalType) {
                    nextRow.type = originalType;
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
            };

            setWatchlistRows((prev) => {
                if (!prev.length) return prev;
                let changed = false;
                const next = prev.map((row) => {
                    const upd = updates[row.symbol];
                    if (!upd) return row;
                    changed = true;
                    return updateRowWithFlashes(row, upd);
                });
                return changed ? next : prev;
            });

            setCryptoData((prev) => {
                if (!prev.length) return prev;
                let changed = false;
                const next = prev.map((row) => {
                    const upd = updates[row.symbol];
                    if (!upd) return row;
                    changed = true;
                    return updateRowWithFlashes(row, upd);
                });
                return changed ? next : prev;
            });

            setForexData((prev) => {
                if (!prev.length) return prev;
                let changed = false;
                const next = prev.map((row) => {
                    const upd = updates[row.symbol];
                    if (!upd) return row;
                    changed = true;
                    return updateRowWithFlashes(row, upd);
                });
                return changed ? next : prev;
            });

            setCommodityData((prev) => {
                if (!prev.length) return prev;
                let changed = false;
                const next = prev.map((row) => {
                    const upd = updates[row.symbol];
                    if (!upd) return row;
                    changed = true;
                    return updateRowWithFlashes(row, upd);
                });
                return changed ? next : prev;
            });

            setDashboardSections((prev) => {
                prevSectionsRef.current = prev;
                let hasChanges = false;
                const next = { nse: { ...prev.nse }, mcx: { ...prev.mcx }, nfo: { ...prev.nfo } };
                for (const [symbol, upd] of Object.entries(updates)) {
                    const exchange = symbol.split(':')[0];
                    const section = exchange === 'NSE' ? 'nse' : exchange === 'MCX' ? 'mcx' : 'nfo';
                    if (next[section]?.[symbol]) {
                        hasChanges = true;
                        next[section][symbol] = updateRowWithFlashes(next[section][symbol], upd);
                    }
                }
                return hasChanges ? next : prev;
            });
        });

        socket.on('market_data_update', ({ type, data }) => {
            if (!data || !Array.isArray(data)) return;
            const prefix = type === 'crypto' ? 'CRYPTO:' : type === 'forex' ? 'FOREX:' : 'COMMODITY:';
            let mapped = data.map((item) => ({
                ...item,
                symbol: item.symbol?.startsWith(prefix) ? item.symbol : `${prefix}${item.symbol}`,
                type: type.toUpperCase()
            }));
            if (type === 'commodity') {
                const unslashed = new Set(['COMMODITY:XAUUSD', 'COMMODITY:XAGUSD']);
                mapped = mapped.filter(item => !unslashed.has(item.symbol));
            }
            if (type === 'crypto') setCryptoData(mapped);
            else if (type === 'forex') setForexData(mapped);
            else if (type === 'commodity') setCommodityData(mapped);
        });

        const emitSnapshot = () => {
            if (socket.connected) socket.emit('request_market_snapshot', {});
        };

        // Snapshot interval removed to follow Requirement 6 (Avoid 1s polling for crypto)
        // Only fetch snapshot on visibility changes or initial connect


        const onVisibility = () => {
            if (!document.hidden && socket.connected) emitSnapshot();
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
            socket.off('market_snapshot', onSnapshot);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [applyMarketSnapshot]);

    const value = {
        watchlistRows,
        setWatchlistRows,
        fetchWatchlist,

        dashboardSections,
        setDashboardSections,
        dashboardGroups,
        dashboardCounts,
        nseGroupCounts,
        prevSectionsRef,
        fetchDashboard,

        cryptoData,
        forexData,
        commodityData,
        fetchCryptoForex,
        binanceError,

        kiteStatus,
        setKiteStatus,
        checkStatus,
        dataReady,
        socketRef,
        requestMarketSnapshot,
        excludedContracts
    };

    return (
        <MarketDataContext.Provider value={value}>
            {children}
        </MarketDataContext.Provider>
    );
};

export const useMarketData = () => {
    const ctx = useContext(MarketDataContext);
    if (!ctx) throw new Error('useMarketData must be used within MarketDataProvider');
    return ctx;
};

export default MarketDataContext;
