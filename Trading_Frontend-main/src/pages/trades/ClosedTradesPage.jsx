import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrades, deleteTrade } from '../../services/api';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Toast from '../../components/common/Toast';
import { Trash2, X } from 'lucide-react';
import { useMarketData } from '../../context/MarketDataContext';
import { displaySymbol } from '../../utils/marketUtils';

const ClosedTradesPage = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({ fromDate: '', toDate: '', scrip: '', username: '' });
    const [selectedTrades, setSelectedTrades] = useState([]);
    const [tradesData, setTradesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTradeId, setDeleteTradeId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'success' });
    const { watchlistRows, cryptoData, forexData, commodityData } = useMarketData();

    useEffect(() => { fetchTrades(); }, []);

    const fetchTrades = async (params = {}) => {
        setLoading(true);
        try {
            const data = await getTrades({ status: 'CLOSED', ...params });
            setTradesData(data.map(t => ({
                id: t.id,
                scrip: t.symbol,
                status: t.status || (String(t.id).startsWith('WS-') ? 'WEEKLY SETTLED' : 'CLOSED'),
                is_weekly_settlement: t.is_weekly_settlement || String(t.id).startsWith('WS-') || t.status === 'WEEKLY SETTLED',
                segment: t.segment || 'MCX',
                username: t.username || 'N/A',
                buyRate: t.type === 'BUY' ? parseFloat(t.entry_price || 0).toFixed(2) : parseFloat(t.exit_price || 0).toFixed(2),
                sellRate: t.type === 'SELL' ? parseFloat(t.entry_price || 0).toFixed(2) : parseFloat(t.exit_price || 0).toFixed(2),
                lots: t.qty,
                brokerage: parseFloat(t.brokerage || 0).toFixed(2),
                profitLoss: parseFloat(t.pnl || 0).toFixed(2),
                boughtAt: t.entry_time ? new Date(t.entry_time).toLocaleString() : '-',
                soldAt: t.exit_time ? new Date(t.exit_time).toLocaleString() : '-',
                buyIp: t.trade_ip || t.buy_ip,
                sellIp: t.sell_ip || t.close_ip,
            })));
        } catch (err) {
            console.error('Failed to fetch closed trades:', err);
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
        setFilters({ fromDate: '', toDate: '', scrip: '', username: '' });
        fetchTrades();
    };

    const handleSelectAll = (e) => {
        setSelectedTrades(e.target.checked ? tradesData.map(t => t.id) : []);
    };

    const handleSelectRow = (id) => {
        setSelectedTrades(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleDeleteTrades = () => {
        if (selectedTrades.length === 0) return;
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            const ids = deleteTradeId ? [deleteTradeId] : selectedTrades;
            await Promise.all(ids.map(id => deleteTrade(id)));
            setSelectedTrades([]);
            setDeleteTradeId(null);
            fetchTrades();
            setToast({ message: `${ids.length} trade(s) deleted successfully`, type: 'success' });
        } catch (err) {
            setToast({ message: err?.response?.data?.message || err?.message || 'Failed to delete', type: 'error' });
        } finally {
            setDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleDeleteRow = (tradeId) => {
        setDeleteTradeId(tradeId);
        setIsDeleteModalOpen(true);
    };

    const handleView = (tradeId) => {
        navigate(`/trades/details/${tradeId}`);
    };

    const handleEdit = (tradeId) => {
        navigate(`/closed-trades/edit/${tradeId}`);
    };

    return (
        <div className="flex flex-col space-y-4 md:space-y-6 w-full">

            {/* Filter Card */}
            <div className="bg-[#1f283e] p-3 sm:p-6 rounded-lg border border-white/10 shadow-xl overflow-hidden">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-end">
                    {/* Filter Fields */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <div>
                            <label className="text-slate-500 text-[10px] sm:text-xs block mb-2">Scrip</label>
                            <input
                                type="text"
                                name="scrip"
                                value={filters.scrip}
                                onChange={handleFilterChange}
                                placeholder="e.g. GOLD"
                                className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-slate-600 focus:border-[#4CAF50] transition-colors placeholder:text-slate-600"
                            />
                        </div>
                        <div>
                            <label className="text-slate-500 text-[10px] sm:text-xs block mb-2">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={filters.username}
                                onChange={handleFilterChange}
                                className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-slate-600 focus:border-[#4CAF50] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-slate-500 text-[10px] sm:text-xs block mb-2">From Date</label>
                            <input
                                type="date"
                                name="fromDate"
                                value={filters.fromDate}
                                onChange={handleFilterChange}
                                className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-slate-600 focus:border-[#4CAF50] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-slate-500 text-[10px] sm:text-xs block mb-2">To Date</label>
                            <input
                                type="date"
                                name="toDate"
                                value={filters.toDate}
                                onChange={handleFilterChange}
                                className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-slate-600 focus:border-[#4CAF50] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-row gap-2 w-full md:w-auto shrink-0">
                        <button
                            onClick={handleSearch}
                            className="bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold py-2.5 px-6 md:px-8 rounded uppercase tracking-wide text-xs transition-all shadow-md flex-1 md:flex-none"
                        >
                            SEARCH
                        </button>
                        <button
                            onClick={handleReset}
                            className="bg-[#607d8b] hover:bg-[#546e7a] text-white font-bold py-2.5 px-6 md:px-8 rounded uppercase tracking-wide text-xs transition-all shadow-md flex-1 md:flex-none"
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
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse custom-table">
                        <thead>
                            <tr className="text-white text-sm bg-[#1a2035] border-b border-white/10">
                                <th className="px-4 py-4 w-12 sticky left-0 bg-[#1a2035] z-10">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={tradesData.length > 0 && selectedTrades.length === tradesData.length}
                                        className="w-5 h-5 rounded bg-slate-700 border-slate-600 cursor-pointer accent-[#2196F3]"
                                    />
                                </th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap text-center">Action</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">ID ↑</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Scrip</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Segment</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Status</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Username</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Buy Rate</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Sell Rate</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Lots / Units</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Brokerage</th>
                                <th className="px-4 py-4 font-bold whitespace-nowrap">Profit/Loss</th>
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
                                        <td className="px-4 py-4 sticky left-0 bg-[#1f283e] z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedTrades.includes(trade.id)}
                                                onChange={() => handleSelectRow(trade.id)}
                                                className="w-5 h-5 rounded bg-slate-700 border-slate-600 cursor-pointer accent-[#2196F3]"
                                            />
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleView(trade.id)} className="text-white transition-colors" title="View">
                                                    <i className="fa-solid fa-eye text-[14px]"></i>
                                                </button>
                                                <button onClick={() => handleEdit(trade.id)} className="text-white transition-colors" title="Edit">
                                                    <i className="fa-solid fa-pencil text-[14px]"></i>
                                                </button>
                                                <button onClick={() => handleDeleteRow(trade.id)} className="text-white transition-colors" title="Delete">
                                                    <Trash2 className="w-[14px] h-[14px]" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-white whitespace-nowrap">{trade.id}</td>
                                        <td className="px-4 py-4 text-[#00BCD4] whitespace-nowrap">
                                            {(() => {
                                                const allScrips = [...(watchlistRows || []), ...(cryptoData || []), ...(forexData || []), ...(commodityData || [])];
                                                const tradeSymUpper = (trade.scrip || '').toUpperCase();
                                                const scrip = allScrips.find(s => {
                                                    const ds = displaySymbol(s).toUpperCase();
                                                    const rs = (s.symbol || '').toUpperCase();
                                                    const ts = rs.split(':').pop();
                                                    return ds === tradeSymUpper || rs === tradeSymUpper || ts === tradeSymUpper;
                                                });
                                                return scrip ? displaySymbol(scrip) : displaySymbol(trade.scrip);
                                            })()}
                                        </td>

                                        <td className="px-4 py-4 whitespace-nowrap">{trade.segment}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {(trade.is_weekly_settlement || trade.status === 'WEEKLY SETTLED' || trade.status === 'SETTLED') ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                    WEEKLY SETTLED
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                    {trade.status || 'CLOSED'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-white font-medium">{trade.username}</td>
                                        <td className="px-4 py-4 whitespace-nowrap font-mono">{trade.buyRate}</td>
                                        <td className="px-4 py-4 whitespace-nowrap font-mono">{trade.sellRate}</td>
                                        <td className="px-4 py-4 whitespace-nowrap font-mono">{trade.lots}</td>
                                        <td className="px-4 py-4 whitespace-nowrap font-mono text-orange-400">{trade.brokerage}</td>
                                        <td className={`px-4 py-4 font-bold whitespace-nowrap ${parseFloat(trade.profitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.profitLoss || '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">{trade.boughtAt}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">{trade.soldAt || '-'}</td>
                                        <td className="px-4 py-4 text-[11px] font-mono whitespace-nowrap">{trade.buyIp && trade.buyIp !== '::1' && trade.buyIp !== '127.0.0.1' ? trade.buyIp : '-'}</td>
                                        <td className="px-4 py-4 text-[11px] font-mono whitespace-nowrap">{trade.sellIp && trade.sellIp !== '::1' && trade.sellIp !== '127.0.0.1' ? trade.sellIp : '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="14" className="px-6 py-8 text-center text-slate-500">
                                        No trades found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Delete Trades Button */}
                <div className="px-6 py-4 bg-[#1a2035] border-t border-white/10">
                    <button
                        onClick={handleDeleteTrades}
                        disabled={selectedTrades.length === 0}
                        className={`${selectedTrades.length === 0
                            ? 'bg-[#9C27B0]/50 cursor-not-allowed'
                            : 'bg-[#9C27B0] hover:bg-[#8E24AA]'
                            } text-white font-bold py-2.5 px-8 rounded uppercase tracking-wide text-xs transition-all shadow-md`}
                    >
                        DELETE TRADES
                    </button>
                </div>
            </div>

            {/* Delete Modal Popup */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1f283e] rounded-lg shadow-2xl border border-white/10 w-full max-w-md mx-4">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <h3 className="text-white font-bold text-lg">Delete Trade</h3>
                            <button onClick={() => { setIsDeleteModalOpen(false); setDeleteTradeId(null); }} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 text-center">
                            <div className="bg-red-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-7 h-7 text-red-500" />
                            </div>
                            <p className="text-slate-300 text-sm mb-1">
                                Delete {deleteTradeId ? '1' : selectedTrades.length} trade(s)?
                            </p>
                            <p className="text-slate-500 text-xs mt-2">This action cannot be undone.</p>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.01]">
                            <button
                                onClick={() => { setIsDeleteModalOpen(false); setDeleteTradeId(null); }}
                                className="flex-1 bg-[#607d8b] hover:bg-[#546e7a] text-white font-bold py-2.5 px-4 rounded uppercase tracking-wide text-xs transition-all"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleteTradeId === null && selectedTrades.length === 0}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded uppercase tracking-wide text-xs transition-all disabled:opacity-50"
                            >
                                {deleting ? 'DELETING...' : 'DELETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            <Toast 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast({ message: '', type: 'success' })} 
            />
        </div>
    );
};

export default ClosedTradesPage;
