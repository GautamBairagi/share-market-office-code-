import React, { useState, useEffect } from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { getGroupTrades } from '../../services/api';

const GroupTradesPage = () => {
    // Top filters
    const [filters, setFilters] = useState({
        id: '',
        scrip: '',
        segment: 'All',
        userId: '',
        buyRate: '',
        sellRate: '',
        fromDate: '',
        toDate: '',
        timeWindow: '30',
        minUsers: '2'
    });

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null); // G001, G002...

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async (customFilters = filters) => {
        setLoading(true);
        try {
            // Call the API with search inputs + grouping thresholds
            const data = await getGroupTrades({
                scrip: customFilters.scrip,
                segment: customFilters.segment,
                fromDate: customFilters.fromDate,
                toDate: customFilters.toDate,
                timeWindow: customFilters.timeWindow,
                minUsers: customFilters.minUsers
            });
            setGroups(Array.isArray(data) ? data : []);
            
            // If group is selected, find the updated group data
            if (selectedGroup) {
                const updated = data.find(g => g.groupId === selectedGroup.groupId);
                if (updated) setSelectedGroup(updated);
            }
        } catch (err) {
            console.error('Failed to fetch group trades:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        fetchGroups();
    };

    const handleReset = () => {
        const resetFilters = {
            id: '',
            scrip: '',
            segment: 'All',
            userId: '',
            buyRate: '',
            sellRate: '',
            fromDate: '',
            toDate: '',
            timeWindow: '30',
            minUsers: '2'
        };
        setFilters(resetFilters);
        fetchGroups(resetFilters);
    };

    const fmtTime = (t) => {
        if (!t) return '(not set)';
        try {
            return new Date(t).toLocaleString('en-IN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).replace(/\//g, '-');
        } catch { return t; }
    };

    // Filter trades when in detailed group view
    const getFilteredTradesOfGroup = (group) => {
        if (!group || !group.trades) return [];
        return group.trades.filter(t => {
            if (filters.id && !t.id.toString().includes(filters.id)) return false;
            if (filters.scrip && !t.symbol?.toLowerCase().includes(filters.scrip.toLowerCase())) return false;
            if (filters.userId && !(t.username || '').toLowerCase().includes(filters.userId.toLowerCase()) && !t.user_id?.toString().includes(filters.userId)) return false;
            if (filters.buyRate && t.type === 'BUY' && !t.entry_price?.toString().includes(filters.buyRate)) return false;
            if (filters.sellRate && t.type === 'SELL' && !t.entry_price?.toString().includes(filters.sellRate)) return false;
            return true;
        });
    };

    const groupDetailTrades = selectedGroup ? getFilteredTradesOfGroup(selectedGroup) : [];

    return (
        <div className="flex flex-col min-h-full bg-[#1a2035] space-y-5 pb-10">
            {/* Filter Card */}
            <div className="bg-[#1f283e] p-5 rounded-lg border border-white/5 shadow-xl mx-3 sm:mx-6 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                    <div>
                        <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">ID</label>
                        <input
                            type="text"
                            name="id"
                            value={filters.id}
                            onChange={handleFilterChange}
                            className="bg-transparent w-full text-white text-sm py-1.5 outline-none border-b border-slate-600/60 focus:border-[#4CAF50] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">Scrip</label>
                        <input
                            type="text"
                            name="scrip"
                            value={filters.scrip}
                            onChange={handleFilterChange}
                            className="bg-transparent w-full text-white text-sm py-1.5 outline-none border-b border-slate-600/60 focus:border-[#4CAF50] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">Segment</label>
                        <select
                            name="segment"
                            value={filters.segment}
                            onChange={handleFilterChange}
                            className="bg-[#1f283e] w-full text-white text-sm py-1.5 outline-none border-b border-slate-600/60 focus:border-[#4CAF50] transition-colors appearance-none cursor-pointer"
                        >
                            <option value="All" className="bg-[#1f283e]">All</option>
                            <option value="NSE" className="bg-[#1f283e]">Equity</option>
                            <option value="MCX" className="bg-[#1f283e]">MCX</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">User ID</label>
                        <input
                            type="text"
                            name="userId"
                            value={filters.userId}
                            onChange={handleFilterChange}
                            className="bg-transparent w-full text-white text-sm py-1.5 outline-none border-b border-slate-600/60 focus:border-[#4CAF50] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">Buy Rate</label>
                        <input
                            type="text"
                            name="buyRate"
                            value={filters.buyRate}
                            onChange={handleFilterChange}
                            className="bg-transparent w-full text-white text-sm py-1.5 outline-none border-b border-slate-600/60 focus:border-[#4CAF50] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">Sell Rate</label>
                        <input
                            type="text"
                            name="sellRate"
                            value={filters.sellRate}
                            onChange={handleFilterChange}
                            className="bg-transparent w-full text-white text-sm py-1.5 outline-none border-b border-slate-600/60 focus:border-[#4CAF50] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">Time Window (Seconds)</label>
                        <select
                            name="timeWindow"
                            value={filters.timeWindow}
                            onChange={handleFilterChange}
                            className="bg-[#1f283e] w-full text-white text-sm py-1.5 outline-none border-b border-slate-600/60 focus:border-[#4CAF50] transition-colors appearance-none cursor-pointer"
                        >
                            <option value="30" className="bg-[#1f283e]">30 Seconds</option>
                            <option value="45" className="bg-[#1f283e]">45 Seconds</option>
                            <option value="60" className="bg-[#1f283e]">60 Seconds</option>
                            <option value="90" className="bg-[#1f283e]">90 Seconds</option>
                            <option value="120" className="bg-[#1f283e]">120 Seconds</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">Min Users Count</label>
                        <select
                            name="minUsers"
                            value={filters.minUsers}
                            onChange={handleFilterChange}
                            className="bg-[#1f283e] w-full text-white text-sm py-1.5 outline-none border-b border-slate-600/60 focus:border-[#4CAF50] transition-colors appearance-none cursor-pointer"
                        >
                            <option value="2" className="bg-[#1f283e]">2 or more users</option>
                            <option value="3" className="bg-[#1f283e]">3 or more users</option>
                            <option value="4" className="bg-[#1f283e]">4 or more users</option>
                            <option value="5" className="bg-[#1f283e]">5 or more users</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSearch}
                        className="text-white font-bold py-2 px-8 rounded uppercase tracking-widest text-[11px] transition-all active:scale-95 bg-[#4CAF50] hover:bg-[#43A047]"
                    >
                        SEARCH
                    </button>
                    <button
                        onClick={handleReset}
                        className="bg-[#607d8b] hover:bg-[#546e7a] text-white font-bold py-2 px-8 rounded uppercase tracking-widest text-[11px] transition-all"
                    >
                        RESET
                    </button>
                </div>
            </div>

            {/* Results section */}
            {!selectedGroup ? (
                /* Group Summary List */
                <div className="bg-[#1f283e] rounded-lg border border-white/5 shadow-xl mx-3 sm:mx-6 overflow-hidden">
                    <div className="px-5 py-4 bg-[#151d30] border-b border-white/5">
                        <h2 className="text-white font-bold text-sm uppercase tracking-wider">Detected Coordinated Group Trades</h2>
                        <p className="text-slate-500 text-[11px] mt-1">Showing trade execution clusters where multiple users executed identical scrips within {filters.timeWindow} seconds.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="text-slate-400 text-[11px] uppercase tracking-wider bg-[#151d30]" style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                                    <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Actions</th>
                                    <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Group ID</th>
                                    <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Scrip</th>
                                    <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Segment</th>
                                    <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Type</th>
                                    <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Users Count</th>
                                    <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Total Lots</th>
                                    <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Avg Price</th>
                                    <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>First Trade</th>
                                    <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Last Trade</th>
                                    <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Time Span</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] text-slate-300">
                                {loading ? (
                                    <tr>
                                        <td colSpan="11" className="px-6 py-12 text-center text-slate-500 italic" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                            Detecting coordinated group trades...
                                        </td>
                                    </tr>
                                ) : groups.length > 0 ? (
                                    groups.map((g) => {
                                        const cellStyle = { border: '1px solid rgba(255,255,255,0.06)' };
                                        return (
                                            <tr key={g.groupId} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3" style={cellStyle}>
                                                    <button
                                                        onClick={() => setSelectedGroup(g)}
                                                        className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-[15px] h-[15px]" />
                                                        <span className="text-[11px] font-bold">View</span>
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-white font-mono" style={cellStyle}>{g.groupId}</td>
                                                <td className="px-4 py-3 font-bold text-white" style={cellStyle}>{g.symbol}</td>
                                                <td className="px-4 py-3 text-slate-400" style={cellStyle}>{g.market_type}</td>
                                                <td className="px-4 py-3" style={cellStyle}>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${g.type === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {g.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-white" style={cellStyle}>{g.usersCount} users</td>
                                                <td className="px-4 py-3 font-mono" style={cellStyle}>{parseFloat(g.totalLots).toFixed(2)}</td>
                                                <td className="px-4 py-3 font-mono text-slate-200" style={cellStyle}>{parseFloat(g.avgPrice).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-[11px] text-slate-400" style={cellStyle}>{fmtTime(g.firstTradeTime)}</td>
                                                <td className="px-4 py-3 text-[11px] text-slate-400" style={cellStyle}>{fmtTime(g.lastTradeTime)}</td>
                                                <td className="px-4 py-3 font-mono" style={cellStyle}>
                                                    <span className="text-yellow-500 font-semibold">{g.timeDifference}s</span>
                                                    {g.highlyCoordinated && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black rounded-full uppercase tracking-wider">Coordinated Exit</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="px-6 py-12 text-center text-slate-500 italic uppercase text-[11px] tracking-wider" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                            No coordinated trade groups detected matching current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Group Detailed View with styled orange table */
                <div className="space-y-5 mx-3 sm:mx-6">
                    {/* Meta Card */}
                    <div className="bg-[#1f283e] p-5 rounded-lg border border-white/5 shadow-xl relative">
                        <button
                            onClick={() => setSelectedGroup(null)}
                            className="absolute top-4 right-4 bg-[#607d8b] hover:bg-[#546e7a] text-white font-bold py-1.5 px-4 rounded text-xs transition-all"
                        >
                            Back to Groups List
                        </button>
                        <h2 className="text-[#4fc3f7] font-bold text-base font-mono mb-4">Group details: {selectedGroup.groupId}</h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <span className="text-slate-500 text-[10px] uppercase block mb-1">Scrip</span>
                                <span className="text-white font-bold text-sm">{selectedGroup.symbol}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-[10px] uppercase block mb-1">Type</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedGroup.type === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {selectedGroup.type}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-[10px] uppercase block mb-1">Segment</span>
                                <span className="text-white font-semibold text-sm">{selectedGroup.market_type}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-[10px] uppercase block mb-1">Total Lots / Units</span>
                                <span className="text-white font-bold font-mono text-sm">{parseFloat(selectedGroup.totalLots).toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-[10px] uppercase block mb-1">Average Price</span>
                                <span className="text-white font-bold font-mono text-sm">{parseFloat(selectedGroup.avgPrice).toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-[10px] uppercase block mb-1">First Trade Time</span>
                                <span className="text-slate-300 text-xs">{fmtTime(selectedGroup.firstTradeTime)}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-[10px] uppercase block mb-1">Last Trade Time</span>
                                <span className="text-slate-300 text-xs">{fmtTime(selectedGroup.lastTradeTime)}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-[10px] uppercase block mb-1">Time Difference</span>
                                <span className="text-yellow-500 font-bold font-mono text-sm">{selectedGroup.timeDifference} Seconds</span>
                            </div>
                        </div>

                        <div className="mt-5 border-t border-white/5 pt-4">
                            <span className="text-slate-500 text-[10px] uppercase block mb-2">Users Involved</span>
                            <div className="flex flex-wrap gap-2">
                                {selectedGroup.usersList.map((user, idx) => (
                                    <span key={idx} className="bg-slate-700/50 text-slate-200 border border-white/5 px-2.5 py-1 rounded-full text-xs font-semibold">
                                        {user}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Group Trades Table (Custom Orange/Brown Style) */}
                    <div className="bg-[#1f283e] rounded-lg border border-white/5 shadow-xl overflow-hidden">
                        <div className="px-5 py-4 bg-[#151d30] border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Coordinated Trades ({groupDetailTrades.length})</h3>
                            {selectedGroup.highlyCoordinated && (
                                <span className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">
                                    Highly Coordinated Activity detected
                                </span>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr className="text-slate-400 text-[11px] uppercase tracking-wider bg-[#151d30]" style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                                        <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Actions</th>
                                        <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>ID ↕</th>
                                        <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Scrip</th>
                                        <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Segment</th>
                                        <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>User ID</th>
                                        <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Buy Rate</th>
                                        <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Sell Rate</th>
                                        <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Lots / Units</th>
                                        <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Bought at</th>
                                        <th className="px-4 py-3.5 font-semibold" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Sold at</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[13px] text-slate-200">
                                    {groupDetailTrades.length > 0 ? (
                                        groupDetailTrades.map((t) => {
                                            const cellStyle = {
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                backgroundColor: 'rgba(162, 116, 24, 0.25)' // Orange-brown style as per screenshot
                                            };
                                            return (
                                                <tr key={t.id} className="hover:bg-white/[0.05] transition-colors">
                                                    <td className="px-4 py-3" style={cellStyle}>
                                                        <button
                                                            onClick={() => window.open(`/trades/details/${t.id}`, '_blank')}
                                                            className="text-slate-200 hover:text-white transition-colors"
                                                            title="View Detail"
                                                        >
                                                            <Eye className="w-[15px] h-[15px]" />
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-white font-mono" style={cellStyle}>{t.id}</td>
                                                    <td className="px-4 py-3 font-bold text-white" style={cellStyle}>{t.symbol}</td>
                                                    <td className="px-4 py-3 text-slate-300" style={cellStyle}>{t.market_type}</td>
                                                    <td className="px-4 py-3 font-semibold" style={cellStyle}>
                                                        {t.user_id} : {t.username || t.full_name || ''}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-white" style={cellStyle}>
                                                        {t.type === 'BUY' ? parseFloat(t.entry_price || 0).toFixed(2) : (t.exit_price ? parseFloat(t.exit_price).toFixed(2) : '0')}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-white" style={cellStyle}>
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
                                                    <td className="px-4 py-3 text-[11px] text-slate-300 whitespace-nowrap" style={cellStyle}>
                                                        {t.type === 'BUY' ? fmtTime(t.entry_time) : fmtTime(t.exit_time)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[11px] text-slate-300 whitespace-nowrap" style={cellStyle}>
                                                        {t.type === 'SELL' ? fmtTime(t.entry_time) : (t.exit_time ? fmtTime(t.exit_time) : '(not set)')}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="10" className="px-6 py-12 text-center text-slate-500 italic" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                                No trades matched the criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupTradesPage;
