import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, SquarePen, Trash2, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTrades, deleteTrade } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMarketData } from '../../context/MarketDataContext';
import { displaySymbol } from '../../utils/marketUtils';

const PAGE_SIZE = 20;

let tradesPageCache = null;

export const clearTradesPageCache = () => {
    tradesPageCache = null;
    try { sessionStorage.removeItem('trades_page_cache'); } catch (e) {}
};

export const setTradesPageCache = (data) => {
    tradesPageCache = data;
    try { sessionStorage.setItem('trades_page_cache', JSON.stringify(data)); } catch (e) {}
};

const getInitialTrades = () => {
    if (tradesPageCache && Array.isArray(tradesPageCache) && tradesPageCache.length > 0) {
        return tradesPageCache;
    }
    try {
        const stored = sessionStorage.getItem('trades_page_cache');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                tradesPageCache = parsed;
                return parsed;
            }
        }
    } catch (e) {}
    return [];
};

const TradesPage = ({ onCreateClick, onNavigate }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const initialTrades = getInitialTrades();
    const [trades, setTrades] = useState(initialTrades);
    const [loading, setLoading] = useState(() => initialTrades.length === 0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedTrades, setSelectedTrades] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ show: false, trade: null });
    const [deleting, setDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Sorting state
    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('desc');

    const { watchlistRows, cryptoData, forexData, commodityData } = useMarketData();

    const [filters, setFilters] = useState({
        fromDate: '', toDate: '', id: '', scrip: '', segment: 'All',
        userId: '', buyRate: '', sellRate: '', lots: ''
    });

    const scripMap = useMemo(() => {
        const map = new Map();
        const add = (s) => {
            if (!s?.symbol) return;
            const sym = s.symbol.toUpperCase();
            if (!map.has(sym)) map.set(sym, s);
            const clean = sym.includes(':') ? sym.split(':')[1] : sym;
            if (!map.has(clean)) map.set(clean, s);
        };
        (watchlistRows || []).forEach(add);
        (cryptoData || []).forEach(add);
        (forexData || []).forEach(add);
        (commodityData || []).forEach(add);
        return map;
    }, [watchlistRows, cryptoData, forexData, commodityData]);

    useEffect(() => {
        const timer = setTimeout(() => fetchTrades(false), 300);
        return () => clearTimeout(timer);
    }, [filters.fromDate, filters.toDate, filters.id, filters.scrip, filters.userId]);

    const fetchTrades = async (showLoading = false) => {
        if (showLoading && trades.length === 0 && (!tradesPageCache || tradesPageCache.length === 0)) {
            setLoading(true);
        } else {
            setIsRefreshing(true);
        }

        try {
            const backendFilters = {
                fromDate: filters.fromDate,
                toDate: filters.toDate,
                id: filters.id,
                scrip: filters.scrip,
                username: filters.userId,
                limit: 1000
            };
            const data = await getTrades(backendFilters);
            const list = Array.isArray(data) ? data : (data?.data || []);
            setTradesPageCache(list);
            setTrades(list);
        } catch (err) {
            console.error('Failed to fetch trades:', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredTrades = useMemo(() => {
        return trades.filter(t => {
            if (filters.id && !t.id.toString().includes(filters.id)) return false;
            if (filters.scrip && !t.symbol?.toLowerCase().includes(filters.scrip.toLowerCase())) return false;
            if (filters.segment !== 'All') {
                const symbol = (t.symbol || t.scrip || '').toUpperCase();
                const marketType = (t.market_type || '').toUpperCase();
                if (filters.segment === 'MCX') {
                    const mcx = ['GOLD','GOLDM','SILVER','SILVERM','CRUDEOIL','COPPER','NICKEL','ZINC','LEAD','ALUMINIUM','NATURALGAS'];
                    if (!mcx.some(s => symbol.includes(s)) && marketType !== 'MCX') return false;
                } else if (filters.segment === 'NSE') {
                    const mcxExcl = ['GOLD','GOLDM','SILVER','SILVERM','CRUDEOIL','COPPER','NICKEL','ZINC','LEAD','ALUMINIUM','NATURALGAS'];
                    if (mcxExcl.some(s => symbol.includes(s)) || marketType === 'MCX' || marketType === 'CRYPTO' || marketType === 'FOREX') return false;
                } else if (filters.segment === 'CRYPTO') {
                    if (marketType !== 'CRYPTO' && !symbol.startsWith('CRYPTO:')) return false;
                } else if (filters.segment === 'FOREX') {
                    if (marketType !== 'FOREX' && !symbol.startsWith('FOREX:')) return false;
                }
            }
            if (filters.userId && !(t.username || '').toLowerCase().includes(filters.userId.toLowerCase()) && !t.user_id?.toString().includes(filters.userId)) return false;
            if (filters.fromDate || filters.toDate) {
                const tradeDate = new Date(t.entry_time).toISOString().split('T')[0];
                if (filters.fromDate && tradeDate < filters.fromDate) return false;
                if (filters.toDate && tradeDate > filters.toDate) return false;
            }
            return true;
        });
    }, [trades, filters]);

    const sortedTrades = useMemo(() => {
        let result = [...filteredTrades];
        if (sortField) {
            result.sort((a, b) => {
                let valA = a[sortField] ?? '';
                let valB = b[sortField] ?? '';

                if (['id', 'qty', 'entry_price', 'exit_price', 'pnl', 'brokerage', 'user_id'].includes(sortField)) {
                    valA = parseFloat(valA) || 0;
                    valB = parseFloat(valB) || 0;
                } else if (typeof valA === 'string') {
                    valA = valA.toLowerCase();
                    valB = String(valB).toLowerCase();
                }

                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [filteredTrades, sortField, sortDirection]);

    const totalPages = Math.max(1, Math.ceil(sortedTrades.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedTrades = sortedTrades.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handleReset = () => {
        setFilters({ fromDate: '', toDate: '', id: '', scrip: '', segment: 'All', userId: '', buyRate: '', sellRate: '', lots: '' });
        setCurrentPage(1);
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteTrade(deleteModal.trade.id);
            setDeleteModal({ show: false, trade: null });
            fetchTrades();
        } catch (err) {
            alert(err?.response?.data?.message || err?.message || 'Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const handleSelectAll = (e) => {
        setSelectedTrades(e.target.checked ? pagedTrades.map(t => t.id) : []);
    };

    const handleExport = () => {
        if (sortedTrades.length === 0) return alert('No trades to export');
        const headers = ['ID', 'Scrip', 'Type', 'Username', 'Buy Rate', 'Sell Rate', 'Lots', 'Status', 'Entry Time'];
        const csvContent = [
            headers.join(','),
            ...sortedTrades.map(t => [
                t.id, t.symbol, t.type, t.username,
                t.type === 'BUY' ? t.entry_price : (t.exit_price || ''),
                t.type === 'SELL' ? t.entry_price : (t.exit_price || ''),
                t.qty, t.status, t.entry_time
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'trades_export.csv';
        link.click();
    };

    const fmtTime = (t) => {
        if (!t) return '-';
        try {
            return new Date(t).toLocaleString('en-IN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });
        } catch { return t; }
    };

    const getSymbolDisplay = (t) => {
        const tradeSymUpper = (t.symbol || '').toUpperCase();
        const cleanSym = tradeSymUpper.includes(':') ? tradeSymUpper.split(':')[1] : tradeSymUpper;
        const scrip = scripMap.get(tradeSymUpper) || scripMap.get(cleanSym);
        return scrip ? displaySymbol(scrip) : displaySymbol(t.symbol);
    };

    const getStatusStyle = (t) => {
        if (t.status === 'HOLD' || t.is_carried_forward === 1) return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
        if (t.status === 'OPEN' && t.is_pending) return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
        if (t.status === 'OPEN') return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
        if (t.status === 'CLOSED' || t.status === 'SETTLED') return 'bg-green-500/20 text-green-400 border border-green-500/30';
        if (t.status === 'CANCELLED') return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
        if (t.status === 'DELETED') return 'bg-red-500/20 text-red-400 border border-red-500/30';
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    };

    const getStatusLabel = (t) => {
        if (t.status === 'HOLD' || t.is_carried_forward === 1) return 'HOLD';
        if (t.is_pending && t.status === 'OPEN') return 'PENDING';
        return t.status;
    };

    const getPaginationPages = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (safePage > 3) pages.push('...');
            for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
            if (safePage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex flex-col min-h-full bg-[#1a2035] space-y-4 pb-10">

            {/* Top Actions Bar */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 px-3 sm:px-4 md:px-6 pt-4 flex-wrap">
                {!user?.isSubBroker && (
                    <button
                        onClick={onCreateClick || (() => {})}
                        className="text-white font-bold py-3 px-8 rounded uppercase tracking-widest text-[11px] transition-all active:scale-95 w-full sm:w-auto"
                        style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)', boxShadow: '0 4px 15px rgba(76,175,80,0.35)' }}
                    >
                        CREATE TRADES
                    </button>
                )}
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full xl:w-auto">
                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 flex-1 sm:flex-none">
                        <div className="group min-w-[140px]">
                            <label className="block text-[10px] text-slate-500 mb-1.5 font-black uppercase tracking-widest">From Date</label>
                            <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange}
                                className="bg-[#1f283e] text-slate-200 text-xs py-2.5 px-3 rounded-md outline-none border border-slate-600/50 focus:border-green-400 cursor-pointer w-full transition-colors" />
                        </div>
                        <div className="group min-w-[140px]">
                            <label className="block text-[10px] text-slate-500 mb-1.5 font-black uppercase tracking-widest">To Date</label>
                            <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange}
                                className="bg-[#1f283e] text-slate-200 text-xs py-2.5 px-3 rounded-md outline-none border border-slate-600/50 focus:border-green-400 cursor-pointer w-full transition-colors" />
                        </div>
                    </div>
                    <button onClick={handleExport}
                        className="bg-[#00BCD4] hover:bg-[#00ACC1] text-white font-bold py-2.5 px-6 rounded-md uppercase tracking-widest text-[11px] transition-all shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto active:scale-95 h-10">
                        <Download className="w-4 h-4" /> EXPORT TRADES
                    </button>
                </div>
            </div>

            {/* Filter Card */}
            <div className="bg-[#1f283e] p-5 rounded-lg border border-white/5 shadow-xl mx-3 sm:mx-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                    {[
                        { label: 'ID', name: 'id', type: 'text' },
                        { label: 'Scrip', name: 'scrip', type: 'text' },
                        { label: 'User ID', name: 'userId', type: 'text' },
                    ].map(f => (
                        <div key={f.name}>
                            <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">{f.label}</label>
                            <input type={f.type} name={f.name} value={filters[f.name]} onChange={handleFilterChange}
                                className="bg-transparent w-full text-white text-sm py-1.5 outline-none border-b border-slate-600/60 focus:border-[#4CAF50] transition-colors" />
                        </div>
                    ))}
                    <div>
                        <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">Segment</label>
                        <select name="segment" value={filters.segment} onChange={handleFilterChange}
                            className="bg-[#1f283e] w-full text-white text-sm py-1.5 outline-none border-b border-slate-600/60 focus:border-[#4CAF50] transition-colors appearance-none cursor-pointer">
                            {['All', 'NSE', 'MCX', 'CRYPTO', 'FOREX'].map(s => (
                                <option key={s} value={s} className="bg-[#1f283e]">{s === 'NSE' ? 'Equity' : s}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => fetchTrades()}
                        className="text-white font-bold py-2 px-8 rounded uppercase tracking-widest text-[11px] transition-all active:scale-95 cursor-pointer"
                        style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}>
                        SEARCH
                    </button>
                    <button onClick={handleReset} className="bg-[#607d8b] hover:bg-[#546e7a] text-white font-bold py-2 px-8 rounded uppercase tracking-widest text-[11px] transition-all cursor-pointer">RESET</button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-[#1f283e] rounded-lg border border-white/5 shadow-xl mx-2 sm:mx-6">
                {/* Table Header */}
                <div className="px-5 py-3 bg-[#151d30] border-b border-white/5 flex items-center justify-between rounded-t-lg">
                    <span className="text-slate-400 text-xs">
                        Showing <b className="text-white">{pagedTrades.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(safePage * PAGE_SIZE, sortedTrades.length)}</b> of <b className="text-white">{sortedTrades.length}</b> items
                    </span>
                    {isRefreshing && (
                        <span className="text-xs text-green-400 font-medium flex items-center gap-1.5 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span> Updating...
                        </span>
                    )}
                    {selectedTrades.length > 0 && (
                        <span className="text-xs text-blue-400 font-semibold">{selectedTrades.length} selected</span>
                    )}
                </div>

                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full text-left whitespace-nowrap" style={{ minWidth: '1000px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr className="text-slate-400 text-[11px] uppercase tracking-wider bg-[#151d30]" style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                                <th className="px-4 py-3.5 w-10">
                                    <input type="checkbox" onChange={handleSelectAll}
                                        checked={pagedTrades.length > 0 && selectedTrades.length === pagedTrades.length}
                                        className="w-4 h-4 rounded accent-[#4CAF50] cursor-pointer" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Actions</th>
                                <th onClick={() => handleSort('id')} className="px-4 py-3.5 font-semibold cursor-pointer select-none hover:text-green-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                    ID {sortField === 'id' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                                </th>
                                <th onClick={() => handleSort('status')} className="px-4 py-3.5 font-semibold cursor-pointer select-none hover:text-green-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                    Status {sortField === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('symbol')} className="px-4 py-3.5 font-semibold cursor-pointer select-none hover:text-green-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                    Scrip {sortField === 'symbol' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('market_type')} className="px-4 py-3.5 font-semibold cursor-pointer select-none hover:text-green-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                    Segment {sortField === 'market_type' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('user_id')} className="px-4 py-3.5 font-semibold cursor-pointer select-none hover:text-green-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                    User ID {sortField === 'user_id' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('entry_price')} className="px-4 py-3.5 font-semibold cursor-pointer select-none hover:text-green-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                    Buy Rate {sortField === 'entry_price' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('exit_price')} className="px-4 py-3.5 font-semibold cursor-pointer select-none hover:text-green-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                    Sell Rate {sortField === 'exit_price' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('qty')} className="px-4 py-3.5 font-semibold cursor-pointer select-none hover:text-green-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                    Lots / Units {sortField === 'qty' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('entry_time')} className="px-4 py-3.5 font-semibold cursor-pointer select-none hover:text-green-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                    Bought at {sortField === 'entry_time' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('exit_time')} className="px-4 py-3.5 font-semibold cursor-pointer select-none hover:text-green-400 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                    Sold at {sortField === 'exit_time' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] text-slate-300">
                            {loading && trades.length === 0 ? (
                                <tr>
                                    <td colSpan="12" className="px-6 py-12 text-center text-slate-400 italic" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs text-slate-400">Loading trades...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : pagedTrades.length > 0 ? pagedTrades.map((t) => {
                                const isOpen = t.status === 'OPEN' && !t.is_pending;
                                const isClosed = t.status === 'CLOSED';
                                const rowHighlight = isClosed ? 'bg-[#1a2e1a]/40' : '';
                                const cellStyle = { border: '1px solid rgba(255,255,255,0.06)' };
                                return (
                                    <tr key={t.id} className={`hover:bg-white/[0.025] transition-colors ${rowHighlight}`}>
                                        <td className="px-4 py-3" style={cellStyle}>
                                            <input type="checkbox" checked={selectedTrades.includes(t.id)}
                                                onChange={() => setSelectedTrades(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                                                className="w-4 h-4 rounded accent-[#4CAF50] cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-3" style={cellStyle}>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/trades/details/${t.id}`)}
                                                    className="text-slate-400 hover:text-blue-400 transition-colors"
                                                    title="View Detail"
                                                >
                                                    <Eye className="w-[15px] h-[15px]" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/trades/edit/${t.id}`)}
                                                    className="text-slate-400 hover:text-amber-400 transition-colors"
                                                    title="Edit"
                                                >
                                                    <SquarePen className="w-[15px] h-[15px]" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ show: true, trade: t })}
                                                    className="text-slate-400 hover:text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-[15px] h-[15px]" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-white" style={cellStyle}>{t.id}</td>
                                        <td className="px-4 py-3 whitespace-nowrap" style={cellStyle}>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(t)}`}>
                                                {getStatusLabel(t)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-white" style={cellStyle}>{getSymbolDisplay(t)}</td>
                                        <td className="px-4 py-3 text-slate-400" style={cellStyle}>{t.market_type || '-'}</td>
                                        <td className="px-4 py-3" style={cellStyle}>
                                            <span className="text-slate-300 font-medium">
                                                {t.user_id} : {t.username || t.full_name || ''}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-200" style={cellStyle}>
                                            {t.type === 'BUY' ? parseFloat(t.entry_price || 0).toFixed(2) : (t.exit_price ? parseFloat(t.exit_price).toFixed(2) : '0')}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-200" style={cellStyle}>
                                            {t.type === 'SELL' ? parseFloat(t.entry_price || 0).toFixed(2) : (t.exit_price ? parseFloat(t.exit_price).toFixed(2) : '0')}
                                        </td>
                                        <td className="px-4 py-3 font-mono" style={cellStyle}>
                                            {(() => {
                                                const lots = t.qty_input != null ? t.qty_input : t.qty;
                                                const actual = t.actual_qty != null ? t.actual_qty : t.qty;
                                                return lots != null && actual != null && String(lots) !== String(actual)
                                                    ? `${lots} / ${actual}`
                                                    : lots;
                                            })()}
                                        </td>
                                        <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap" style={cellStyle}>
                                            {t.type === 'BUY' ? fmtTime(t.entry_time) : fmtTime(t.exit_time)}
                                        </td>
                                        <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap" style={cellStyle}>
                                            {t.type === 'SELL' ? fmtTime(t.entry_time) : (t.exit_time ? fmtTime(t.exit_time) : '(not set)')}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="12" className="px-6 py-12 text-center text-slate-500 italic" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>No trades found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-4 border-t border-white/5 bg-[#151d30] rounded-b-lg flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs text-slate-500">Page {safePage} of {totalPages}</span>
                    <div className="flex items-center gap-1.5">
                        {/* Prev */}
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {getPaginationPages().map((page, idx) =>
                            page === '...' ? (
                                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-500 text-xs">…</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-all ${
                                        safePage === page
                                            ? 'bg-[#4CAF50] text-white shadow-lg shadow-green-900/30'
                                            : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {page}
                                </button>
                            )
                        )}

                        {/* Next */}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirm Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1e253a] border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b border-white/5">
                            <h3 className="text-white font-bold text-base uppercase tracking-wide">Delete Trade</h3>
                            <button onClick={() => setDeleteModal({ show: false, trade: null })} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 text-center">
                            <div className="bg-red-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <Trash2 className="w-6 h-6 text-red-400" />
                            </div>
                            <p className="text-slate-300 text-sm">
                                Delete trade <span className="text-white font-bold">#{deleteModal.trade?.id}</span>?
                            </p>
                            <p className="text-slate-500 text-xs mt-2">{deleteModal.trade?.type} — {displaySymbol(deleteModal.trade?.symbol)} × {deleteModal.trade?.qty}</p>
                        </div>
                        <div className="flex p-4 gap-3 bg-black/20">
                            <button onClick={() => setDeleteModal({ show: false, trade: null })}
                                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-all">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg disabled:opacity-50">
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradesPage;
