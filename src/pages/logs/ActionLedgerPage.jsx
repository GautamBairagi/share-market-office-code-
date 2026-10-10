import React, { useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';
import * as api from '../../services/api';

const ActionLedgerPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    
    const [filters, setFilters] = useState({
        message: '',
    });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await api.getActionLedger({
                message: filters.message,
                page,
                limit
            });
            // Handle both array and object responses
            if (Array.isArray(data)) {
                setLogs(data);
                setTotal(data.length);
            } else {
                setLogs(data?.rows || []);
                setTotal(data?.total || 0);
            }
        } catch (err) {
            console.error('Failed to fetch action ledger:', err);
            setLogs([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const formatLogDescription = (desc) => {
        if (!desc) return '';
        // Remove prefixes like MCX:, NSE:, NFO:, COMMODITY:, FOREX:, CRYPTO: (case insensitive, optional spaces)
        let cleaned = desc.replace(/\b(MCX|NSE|NFO|COMMODITY|FOREX|CRYPTO):\s*/gi, '');
        // Find numbers with more than 2 decimal places and fix them to 2
        return cleaned.replace(/(\d+\.\d{3,})/g, (match) => {
            return parseFloat(match).toFixed(2);
        });
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const handleReset = () => {
        setFilters({ message: '' });
        setPage(1);
        // We'll fetch within the next tick or rely on a useEffect if we add page to deps
        setTimeout(fetchLogs, 0);
    };

    return (
        <div className="flex flex-col gap-4 p-2 sm:p-4 bg-transparent min-h-full">
            {/* Search Section */}
            <div className="bg-[#1e293b] p-6 rounded-md shadow-lg border-none">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-end gap-6">
                    <div className="flex-1 w-full">
                        <label className="block text-slate-400 text-sm mb-2 font-medium">Message</label>
                        <input 
                            type="text"
                            value={filters.message}
                            onChange={(e) => setFilters({ message: e.target.value })}
                            className="w-full bg-transparent border-b border-[#4ade80] py-2 text-white outline-none focus:border-b-2 transition-all placeholder-slate-600"
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 pb-1">
                        <button 
                            type="submit"
                            className="bg-[#4caf50] hover:bg-[#43a047] text-white font-bold py-2.5 px-10 rounded transition-all text-sm tracking-widest uppercase shadow-md"
                        >
                            SEARCH
                        </button>
                        <button 
                            type="button"
                            onClick={handleReset}
                            className="flex items-center gap-2 text-slate-300 hover:text-white font-bold text-xs tracking-widest uppercase transition-colors"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            RESET
                        </button>
                    </div>
                </form>
            </div>

            {/* Results Table Section */}
            <div className="bg-[#1e293b] rounded-md shadow-lg border-none overflow-hidden flex flex-col">
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1e293b] sticky top-0 z-10 border-b border-slate-700 shadow-sm">
                                <th className="px-6 py-4 text-base font-bold text-white tracking-wide bg-[#1e293b]">Message</th>
                                <th className="px-6 py-4 text-base font-bold text-white tracking-wide text-right bg-[#1e293b]">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="">
                            {loading ? (
                                <tr>
                                    <td colSpan="2" className="px-6 py-20 text-center text-slate-500 italic">
                                        Loading records...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-500 italic">
                                            <p className="text-lg">No records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors border-b border-slate-800 last:border-b-0">
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                                                {formatLogDescription(log.description)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400 text-right whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && logs.length > 0 && (
                    <div className="px-6 py-4 bg-black/10 flex items-center justify-between border-t border-white/5">
                        <p className="text-xs text-slate-400">
                            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} items
                        </p>
                        
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-400">
                                Page {page} of {Math.max(1, Math.ceil(total / limit))}
                            </span>
                            <div className="flex gap-2">
                                 <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 transition-colors rounded text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold"
                                 >Prev</button>
                                 <button 
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= Math.max(1, Math.ceil(total / limit))}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 transition-colors rounded text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold"
                                 >Next</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActionLedgerPage;
