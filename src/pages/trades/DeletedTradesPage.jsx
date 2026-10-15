import React, { useState, useEffect } from 'react';
import { getTrades } from '../../services/api';
import { displaySymbol } from '../../utils/marketUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 15;

const DeletedTradesPage = () => {
    const [filters, setFilters] = useState({ username: '' });
    const [tradesData, setTradesData] = useState([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchTrades({}, 1); }, []);

    const fetchTrades = async (params = {}, page = currentPage) => {
        setLoading(true);
        try {
            const queryParams = { status: 'DELETED', page, limit: PAGE_SIZE, ...params };
            const res = await getTrades(queryParams);
            const rows = Array.isArray(res) ? res : (res?.data || []);
            const serverTotal = res?.total ?? rows.length;
            const serverTotalPages = res?.totalPages ?? Math.max(1, Math.ceil(serverTotal / PAGE_SIZE));
            setTotal(serverTotal);
            setTotalPages(serverTotalPages);
            setCurrentPage(page);

            const mapped = rows.map(t => ({
                id: t.id,
                scrip: displaySymbol(t.symbol),
                segment: t.segment || 'MCX',
                username: t.username || 'N/A',
                buyRate: t.type === 'BUY' ? parseFloat(t.entry_price || 0).toFixed(2) : parseFloat(t.exit_price || 0).toFixed(2),
                sellRate: t.type === 'SELL' ? parseFloat(t.entry_price || 0).toFixed(2) : parseFloat(t.exit_price || 0).toFixed(2),
                lots: t.qty,
                profitLoss: parseFloat(t.pnl || 0).toFixed(2),
                timeDiff: t.exit_time && t.entry_time ? Math.floor((new Date(t.exit_time) - new Date(t.entry_time)) / 1000) + 's' : '-',
                boughtAt: t.entry_time ? new Date(t.entry_time).toLocaleString() : '-',
                soldAt: t.exit_time ? new Date(t.exit_time).toLocaleString() : '-',
                buyIp: t.trade_ip || t.buy_ip,
                sellIp: t.sell_ip || t.close_ip,
            }));
            setTradesData(mapped);
        } catch (err) {
            console.error('Failed to fetch deleted trades:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => fetchTrades(filters, 1);

    const handleReset = () => {
        setFilters({ username: '' });
        fetchTrades({}, 1);
    };

    const handlePageChange = (page) => {
        fetchTrades(filters, page);
    };

    const getPaginationPages = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const rangeEnd = total === 0 ? 0 : rangeStart + tradesData.length - 1;

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-[#1a2035] gap-4 md:gap-6 overflow-hidden px-3 sm:px-4 md:px-6 py-3 sm:py-4">

            {/* Filter Card */}
            <div className="bg-[#1f283e] p-4 sm:p-6 rounded-lg border border-white/10 shadow-xl">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Filter Field */}
                    <div className="w-full md:w-64">
                        <label className="text-slate-500 text-xs block mb-2">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={filters.username}
                            onChange={handleFilterChange}
                            className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-slate-600 focus:border-[#4CAF50] transition-colors"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                        <button
                            onClick={handleSearch}
                            className="bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold py-3 md:py-2 px-6 rounded uppercase tracking-wide text-xs transition-all shadow-md flex-1 md:flex-none"
                        >
                            SEARCH
                        </button>
                        <button
                            onClick={handleReset}
                            className="bg-[#607d8b] hover:bg-[#546e7a] text-white font-bold py-3 md:py-2 px-6 rounded uppercase tracking-wide text-xs transition-all shadow-md flex-1 md:flex-none"
                        >
                            RESET
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="bg-[#1f283e] rounded-lg border border-white/10 shadow-xl overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="px-6 py-4 bg-[#1a2035] border-b border-white/10 shrink-0">
                    <span className="text-slate-400 text-sm">
                        {loading ? 'Loading...' : <>Showing <b className="text-white">{rangeStart}–{rangeEnd}</b> of <b className="text-white">{total}</b> items.</>}
                    </span>
                </div>

                <div className="overflow-auto flex-1 min-h-0 custom-scrollbar">
                    <table className="w-full text-left border-collapse custom-table">
                        <thead className="sticky top-0 z-10">
                            <tr className="text-white text-sm bg-[#1a2035] border-b border-white/10">
                                <th className="px-4 py-4 font-bold whitespace-nowrap">ID ↑</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Scrip</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Segment</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Username</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Buy Rate</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Sell Rate</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Lots / Units</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Profit/Loss</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Time Diff</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Bought at</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Sold at</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Buy IP</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Sell IP</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {tradesData.length > 0 ? (
                                tradesData.map((trade) => (
                                    <tr key={trade.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-4 text-white whitespace-nowrap">{trade.id}</td>
                                        <td className="px-4 py-4 text-[#00BCD4] whitespace-nowrap">{trade.scrip}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">{trade.segment}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-white font-medium">{trade.username}</td>
                                        <td className="px-4 py-4 whitespace-nowrap font-mono">{trade.buyRate}</td>
                                        <td className="px-4 py-4 whitespace-nowrap font-mono">{trade.sellRate}</td>
                                        <td className="px-4 py-4 whitespace-nowrap font-mono">{trade.lots}</td>
                                        <td className={`px-4 py-4 font-bold whitespace-nowrap ${parseFloat(trade.profitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.profitLoss || '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">{trade.timeDiff || '-'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">{trade.boughtAt}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">{trade.soldAt || '-'}</td>
                                        <td className="px-4 py-4 text-[11px] font-mono whitespace-nowrap">{trade.buyIp && trade.buyIp !== '::1' && trade.buyIp !== '127.0.0.1' ? trade.buyIp : '-'}</td>
                                        <td className="px-4 py-4 text-[11px] font-mono whitespace-nowrap">{trade.sellIp && trade.sellIp !== '::1' && trade.sellIp !== '127.0.0.1' ? trade.sellIp : '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="13" className="px-6 py-8 text-center text-slate-500">
                                        No trades found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-4 border-t border-white/5 bg-[#151d30] flex items-center justify-between gap-3 flex-wrap shrink-0">
                    <span className="text-xs text-slate-500">Page {currentPage} of {totalPages} (Total: {total})</span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
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
                                    onClick={() => handlePageChange(page)}
                                    className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-all ${
                                        currentPage === page
                                            ? 'bg-[#4CAF50] text-white shadow-lg shadow-green-900/30'
                                            : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {page}
                                </button>
                            )
                        )}
                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeletedTradesPage;
