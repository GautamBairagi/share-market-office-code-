/**
 * SearchResultsModal
 * Full-screen popup table showing ALL fields from backend search results
 * — fully mobile responsive
 */

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, ChevronUp, ChevronDown, Search, Download } from 'lucide-react';

// ─── Pretty column label ──────────────────────────────────────────────────────
const formatLabel = (key) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ─── Cell value renderer ──────────────────────────────────────────────────────
const CellValue = ({ value, colKey }) => {
    if (value === null || value === undefined) return <span className="text-slate-600">—</span>;

    if (typeof value === 'boolean')
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${value ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {value ? 'Yes' : 'No'}
            </span>
        );

    const str = String(value);

    const statusMap = {
        ACTIVE:      'bg-green-500/15 text-green-400 border-green-500/20',
        INACTIVE:    'bg-slate-500/15 text-slate-400 border-slate-500/20',
        BLOCKED:     'bg-red-500/15 text-red-400 border-red-500/20',
        PENDING:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
        APPROVED:    'bg-green-500/15 text-green-400 border-green-500/20',
        REJECTED:    'bg-red-500/15 text-red-400 border-red-500/20',
        CLOSED:      'bg-slate-500/15 text-slate-400 border-slate-500/20',
        OPEN:        'bg-blue-500/15 text-blue-400 border-blue-500/20',
        BUY:         'bg-green-500/15 text-green-400 border-green-500/20',
        SELL:        'bg-red-500/15 text-red-400 border-red-500/20',
        ADMIN:       'bg-purple-500/15 text-purple-400 border-purple-500/20',
        SUPERADMIN:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
        BROKER:      'bg-blue-500/15 text-blue-400 border-blue-500/20',
        CLIENT:      'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    };
    if (statusMap[str]) {
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMap[str]}`}>
                {str}
            </span>
        );
    }

    if ((colKey.includes('date') || colKey.includes('_at') || colKey.includes('time')) && str.length > 8) {
        const d = new Date(str);
        if (!isNaN(d)) return <span className="text-slate-300 text-[11px]">{d.toLocaleString('en-IN')}</span>;
    }

    if ((colKey.includes('amount') || colKey.includes('price') || colKey.includes('balance') || colKey.includes('margin') || colKey.includes('pnl') || colKey.includes('m2m')) && !isNaN(Number(value))) {
        const num = Number(value);
        return (
            <span className={`font-semibold text-[12px] ${num < 0 ? 'text-red-400' : num > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                ₹{num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        );
    }

    if (str.length > 40) return <span className="text-slate-300 text-[11px]" title={str}>{str.slice(0, 38)}…</span>;

    return <span className="text-slate-200 text-[11px]">{str}</span>;
};

// ─── Main component ───────────────────────────────────────────────────────────
const SearchResultsModal = ({ results, query, message, isLoading, error, onClose, onNavigate }) => {
    const [sortCol, setSortCol] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const [filterText, setFilterText] = useState('');
    const [page, setPage] = useState(1);
    const [showFilter, setShowFilter] = useState(false);
    const PAGE_SIZE = 15;

    const columns = useMemo(() => {
        if (!results?.length) return [];
        const keys = Object.keys(results[0]);
        const priority = ['id', 'username', 'full_name', 'name', 'symbol', 'script', 'role', 'status', 'type', 'email', 'mobile', 'phone'];
        return [
            ...priority.filter(k => keys.includes(k)),
            ...keys.filter(k => !priority.includes(k) && typeof results[0][k] !== 'object')
        ];
    }, [results]);

    const filtered = useMemo(() => {
        if (!filterText.trim()) return results || [];
        const q = filterText.toLowerCase();
        return (results || []).filter(row =>
            columns.some(col => String(row[col] ?? '').toLowerCase().includes(q))
        );
    }, [results, filterText, columns]);

    const sorted = useMemo(() => {
        if (!sortCol) return filtered;
        return [...filtered].sort((a, b) => {
            const cmp = String(a[sortCol] ?? '').localeCompare(String(b[sortCol] ?? ''), undefined, { numeric: true });
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortCol, sortDir]);

    const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
    const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleSort = (col) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('asc'); }
        setPage(1);
    };

    const handleNavigate = () => {
        const route = query?.route;
        if (route) onNavigate?.(route.replace(/^\//, ''));
        onClose();
    };

    const handleExport = () => {
        const header = columns.join(',');
        const rows = sorted.map(r => columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','));
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${query?.module || 'search'}_results.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const MODULE_LABELS = {
        users: 'Trading Clients', trades: 'Trades', funds: 'Funds', brokers: 'Brokers',
        admins: 'Admins', orders: 'Pending Orders', notifications: 'Notifications',
        action_ledger: 'Action Ledger', active_positions: 'Active Positions',
        closed_positions: 'Closed Positions', group_trades: 'Group Trades',
        deleted_trades: 'Deleted Trades', ip_logins: 'IP Logins', tickers: 'Tickers',
        bank_details: 'Bank Details', negative_balance: 'Negative Balance',
        banned_orders: 'Banned Orders',
    };
    const moduleLabel = MODULE_LABELS[query?.module] || (query?.module ? query.module.charAt(0).toUpperCase() + query.module.slice(1) : 'Results');

    const modal = (
        <div
            style={{
                position: 'fixed', top: 0, left: 0,
                width: '100vw', height: '100vh',
                zIndex: 99999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px',
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(10px)',
                animation: 'fadeIn 0.18s ease',
                boxSizing: 'border-box',
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '1200px',
                    maxHeight: '95vh',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'linear-gradient(180deg, #0f1729 0%, #0c1221 100%)',
                    border: '1px solid rgba(74,222,128,0.2)',
                    boxShadow: '0 0 60px rgba(74,222,128,0.1), 0 40px 80px rgba(0,0,0,0.6)',
                    animation: 'modalSlideUp 0.22s cubic-bezier(0.16,1,0.3,1) both',
                }}
            >
                {/* Top shimmer */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.6), transparent)' }} />

                {/* ── Header ── */}
                <div
                    className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/5 flex-shrink-0 gap-2 flex-wrap"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                    {/* Left: title */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}>
                            <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                                <path d="M10 1L11.3 7.2L17.5 8.5L11.3 9.8L10 16L8.7 9.8L2.5 8.5L8.7 7.2L10 1Z" fill="rgba(134,239,172,1)" />
                                <path d="M16 13L16.7 15.8L19.5 16.5L16.7 17.2L16 20L15.3 17.2L12.5 16.5L15.3 15.8L16 13Z" fill="rgba(134,239,172,0.5)" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-white font-bold text-[13px] sm:text-[15px] tracking-wide truncate">{moduleLabel} Results</h2>
                                {!isLoading && sorted.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/20 flex-shrink-0">
                                        {sorted.length} records
                                    </span>
                                )}
                            </div>
                            {message && <p className="text-slate-500 text-[10px] sm:text-[11px] mt-0.5 truncate">{message}</p>}
                        </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Filter toggle on mobile, inline on desktop */}
                        <button
                            onClick={() => setShowFilter(v => !v)}
                            className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white transition-all"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <Search className="w-3.5 h-3.5" />
                        </button>

                        {/* Filter input — always visible on sm+ */}
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Filter..."
                                value={filterText}
                                onChange={e => { setFilterText(e.target.value); setPage(1); }}
                                className="pl-7 pr-3 py-1.5 text-[11px] rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: 140 }}
                            />
                        </div>

                        {results?.length > 0 && (
                            <button onClick={handleExport}
                                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white transition-all"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Export</span>
                            </button>
                        )}

                        {query?.route && (
                            <button onClick={handleNavigate}
                                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] font-bold text-green-400 hover:text-green-300 transition-all"
                                style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Open {moduleLabel}</span>
                            </button>
                        )}

                        <button onClick={onClose}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile filter bar */}
                {showFilter && (
                    <div className="sm:hidden px-3 py-2 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Filter results..."
                                value={filterText}
                                onChange={e => { setFilterText(e.target.value); setPage(1); }}
                                className="w-full pl-7 pr-3 py-2 text-[12px] rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Body ── */}
                <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(74,222,128,0.2) transparent' }}>

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-4">
                            <div className="flex gap-1.5">
                                {[0,1,2].map(i => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-green-400"
                                        style={{ animation: `bounce 1s ${i * 0.15}s ease-in-out infinite` }} />
                                ))}
                            </div>
                            <p className="text-slate-500 text-[12px]">AI fetching data from backend...</p>
                        </div>
                    )}

                    {/* High-risk warning */}
                    {!isLoading && !error && query?.requiresConfirmation && (
                        <div className="flex items-center justify-center py-12 sm:py-20 px-4">
                            <div className="text-center max-w-sm">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-xl sm:text-2xl">⚠️</span>
                                </div>
                                <p className="text-yellow-400 text-[13px] sm:text-[14px] font-bold mb-2">Confirmation Required</p>
                                <p className="text-slate-400 text-[11px] sm:text-[12px] leading-relaxed">{message}</p>
                                <p className="text-slate-600 text-[10px] sm:text-[11px] mt-3">
                                    Risk Level: <span className="text-yellow-400 font-bold uppercase">{query.riskLevel}</span>
                                </p>
                                <p className="text-slate-600 text-[10px] sm:text-[11px] mt-1">Use the dedicated module page to perform this action safely.</p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && !isLoading && (
                        <div className="flex items-center justify-center py-12 sm:py-20">
                            <div className="text-center px-4">
                                <p className="text-red-400 text-[13px] sm:text-[14px] font-semibold">❌ {error}</p>
                                <p className="text-slate-600 text-[11px] mt-1">Try rephrasing your query</p>
                            </div>
                        </div>
                    )}

                    {/* Empty */}
                    {!isLoading && !error && sorted.length === 0 && (
                        <div className="flex items-center justify-center py-12 sm:py-20">
                            <p className="text-slate-600 text-[13px]">No results found</p>
                        </div>
                    )}

                    {/* ── Desktop table (sm+) ── */}
                    {!isLoading && !error && sorted.length > 0 && (
                        <>
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
                                    <thead className="sticky top-0 z-10">
                                        <tr style={{ background: 'rgba(15,23,41,0.98)', borderBottom: '1px solid rgba(74,222,128,0.1)' }}>
                                            <th className="px-3 sm:px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 w-10">#</th>
                                            {columns.map(col => (
                                                <th key={col}
                                                    onClick={() => handleSort(col)}
                                                    className="px-3 sm:px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-green-400 cursor-pointer transition-colors whitespace-nowrap select-none">
                                                    <div className="flex items-center gap-1">
                                                        {formatLabel(col)}
                                                        {sortCol === col
                                                            ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-green-400" /> : <ChevronDown className="w-3 h-3 text-green-400" />
                                                            : <ChevronUp className="w-3 h-3 opacity-20" />
                                                        }
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.map((row, idx) => (
                                            <tr key={idx}
                                                className="border-b border-white/[0.03] transition-all cursor-default"
                                                style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.04)'}
                                                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
                                            >
                                                <td className="px-3 sm:px-4 py-2.5 text-[10px] text-slate-600 font-mono">
                                                    {(page - 1) * PAGE_SIZE + idx + 1}
                                                </td>
                                                {columns.map(col => (
                                                    <td key={col} className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                                                        <CellValue value={row[col]} colKey={col} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Mobile card view (xs only) ── */}
                            <div className="sm:hidden space-y-2 p-3">
                                {paginated.map((row, idx) => (
                                    <div key={idx} className="rounded-lg border border-white/8 p-3"
                                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <div className="space-y-1.5">
                                            {columns.map(col => (
                                                <div key={col} className="flex items-start justify-between gap-2 text-xs">
                                                    <span className="text-slate-500 text-[10px] uppercase tracking-wide font-semibold flex-shrink-0 w-24">
                                                        {formatLabel(col)}
                                                    </span>
                                                    <span className="text-right break-all">
                                                        <CellValue value={row[col]} colKey={col} />
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Footer / Pagination ── */}
                {!isLoading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-t border-white/5 flex-shrink-0 gap-2 flex-wrap"
                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <p className="text-[11px] text-slate-600">
                            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                ← Prev
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[11px] font-bold transition-all"
                                        style={{
                                            background: page === p ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.04)',
                                            color: page === p ? 'rgb(134,239,172)' : 'rgb(100,116,139)',
                                            border: page === p ? '1px solid rgba(74,222,128,0.3)' : '1px solid transparent',
                                        }}>
                                        {p}
                                    </button>
                                );
                            })}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                <style>{`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes modalSlideUp {
                        from { opacity: 0; transform: translateY(24px) scale(0.97); }
                        to   { opacity: 1; transform: translateY(0)     scale(1);    }
                    }
                `}</style>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

export default SearchResultsModal;
