import React, { useState, useEffect } from 'react';
import { RefreshCcw, Download } from 'lucide-react';
import * as api from '../../services/api';
import { displaySymbol } from '../../utils/marketUtils';

const TradeIpTrackingPage = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await api.getTradeIpTracking();
            setRecords(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch trade IP audit:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (records.length === 0) {
            alert('No records to export');
            return;
        }

        // Prepare CSV headers
        const headers = ['Trade ID', 'Username', 'Symbol', 'Trade IP', 'Entry Time'];

        // Prepare CSV rows
        const rows = records.map(r => [
            r.trade_id,
            r.username,
            r.symbol,
            r.trade_ip,
            new Date(r.entry_time).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            })
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `trade-ip-tracking-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    return (
        <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 bg-transparent min-h-full">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-[#1e293b] to-[#0f172a] p-3 sm:p-6 rounded-lg shadow-md border border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-white text-lg sm:text-xl font-bold tracking-wide">Trade IP Audit Trail</h2>
                        <p className="text-slate-400 text-xs mt-1 hidden sm:block">Track all trades with IP addresses and timestamps</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={exportToCSV}
                            title="Download Report"
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs tracking-widest uppercase rounded-md transition-all shadow-md hover:shadow-lg active:scale-95 min-h-10"
                        >
                            <Download className="w-4 h-4 shrink-0" />
                            <span className="hidden sm:inline">Download Report</span>
                            <span className="sm:hidden">Export</span>
                        </button>
                        <button
                            onClick={fetchRecords}
                            title="Refresh Data"
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs tracking-widest uppercase rounded-md transition-all min-h-10"
                        >
                            <RefreshCcw className="w-4 h-4 shrink-0" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-[#1e293b] rounded-md shadow-lg border-none overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1 table-wrapper">
                    <table className="w-full text-left border-collapse min-w-full">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#0f172a]/80 backdrop-blur-sm">
                                <th className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-bold text-white tracking-wide whitespace-nowrap">Trade ID</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-bold text-white tracking-wide whitespace-nowrap">Username</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-bold text-white tracking-wide whitespace-nowrap">Symbol</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-bold text-white tracking-wide whitespace-nowrap">IP</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-bold text-white tracking-wide text-right whitespace-nowrap">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-16 text-center text-slate-500 italic text-sm">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="spinner"></div>
                                            <span>Loading records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-24 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-500 italic text-sm">
                                            <p>No records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                records.map((r) => (
                                    <tr key={r.trade_id} className="border-b border-slate-700/50 hover:bg-white/2 transition-colors">
                                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-300 font-mono truncate">{r.trade_id}</td>
                                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-300 truncate">{r.username}</td>
                                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-300 font-semibold">{displaySymbol(r.symbol)}</td>
                                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-300 font-mono truncate" title={r.trade_ip}>{r.trade_ip}</td>
                                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-400 text-right whitespace-nowrap">
                                            <span className="hidden md:inline">
                                                {new Date(r.entry_time).toLocaleString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                })}
                                            </span>
                                            <span className="md:hidden">
                                                {new Date(r.entry_time).toLocaleString('en-IN', {
                                                    day: '2-digit', month: 'short', year: '2-digit',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TradeIpTrackingPage;
