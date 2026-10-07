import React, { useState, useEffect } from 'react';
import { getTrades } from '../../services/api';
import { displaySymbol } from '../../utils/marketUtils';

const DeletedTradesPage = () => {
    const [filters, setFilters] = useState({ username: '' });
    const [tradesData, setTradesData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchTrades(); }, []);

    const fetchTrades = async (params = {}) => {
        setLoading(true);
        try {
            const data = await getTrades({ status: 'DELETED', ...params });
            const mapped = data.map(t => ({
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
            mapped.sort((a, b) => b.id - a.id);
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

    const handleSearch = () => fetchTrades(filters);

    const handleReset = () => {
        setFilters({ username: '' });
        fetchTrades();
    };

    return (
        <div className="flex flex-col h-full bg-[#1a2035] space-y-4 md:space-y-8 overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">

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
            <div className="bg-[#1f283e] rounded-lg border border-white/10 shadow-xl overflow-hidden">
                {/* Showing items count */}
                <div className="px-6 py-4 bg-[#1a2035] border-b border-white/10">
                    <span className="text-slate-400 text-sm">
                        {loading ? 'Loading...' : <>Showing <b className="text-white">{tradesData.length}</b> items.</>}
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse custom-table">
                        <thead>
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
            </div>
        </div>
    );
};

export default DeletedTradesPage;
