import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const ScripDataPage = () => {
    const [filters, setFilters] = useState({
        date: '02/02/2026',
        hour: '12',
        minute: '55',
        scrip: 'GOLD26AFRFUT'
    });

    const scripData = [
        { id: 2401846975, scripId: "GOLD26AFRFUT", exchangeTime: "2026-02-02 12:54:01", systemTime: "2026-02-02 12:54:02", bid: "140351", ask: "140479", high: "147407", low: "137065", ltp: "140157" },
        { id: 2401850829, scripId: "GOLD26AFRFUT", exchangeTime: "2026-02-02 12:54:04", systemTime: "2026-02-02 12:54:04", bid: "140428", ask: "140679", high: "147407", low: "137065", ltp: "140500" },
        { id: 2401855636, scripId: "GOLD26AFRFUT", exchangeTime: "2026-02-02 12:54:07", systemTime: "2026-02-02 12:54:08", bid: "140472", ask: "140735", high: "147407", low: "137065", ltp: "140500" },
        { id: 2401856903, scripId: "GOLD26AFRFUT", exchangeTime: "2026-02-02 12:54:08", systemTime: "2026-02-02 12:54:08", bid: "140472", ask: "140735", high: "147407", low: "137065", ltp: "140500" },
        { id: 2401858853, scripId: "GOLD26AFRFUT", exchangeTime: "2026-02-02 12:54:09", systemTime: "2026-02-02 12:54:10", bid: "140459", ask: "140727", high: "147407", low: "137065", ltp: "140459" },
        { id: 2401860008, scripId: "GOLD26AFRFUT", exchangeTime: "2026-02-02 12:54:10", systemTime: "2026-02-02 12:54:11", bid: "140460", ask: "140727", high: "147407", low: "137065", ltp: "140727" },
        { id: 2401864853, scripId: "GOLD26AFRFUT", exchangeTime: "2026-02-02 12:54:13", systemTime: "2026-02-02 12:54:14", bid: "140221", ask: "140591", high: "147407", low: "137065", ltp: "140727" },
        { id: 2401868255, scripId: "GOLD26AFRFUT", exchangeTime: "2026-02-02 12:54:15", systemTime: "2026-02-02 12:54:16", bid: "140221", ask: "140589", high: "147407", low: "137065", ltp: "140727" },
    ];

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
        <div className="flex flex-col h-full text-[#a0aec0] space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            {/* Top Filter Bar */}
            <div className="bg-[#151c2c] p-4 sm:p-6 rounded-lg border border-[#2d3748] shadow-xl">
                <div className="flex flex-col md:flex-row gap-0.5 mb-2">
                    <div className="flex-[3] bg-white rounded-l overflow-hidden border-r border-slate-200">
                        <input
                            type="text"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            className="w-full px-4 py-2.5 text-slate-800 bg-white focus:outline-none text-sm font-bold"
                        />
                    </div>
                    <div className="flex-1 bg-white relative border-r border-slate-200">
                        <select
                            className="w-full px-4 py-2.5 text-slate-800 bg-white focus:outline-none text-sm font-bold appearance-none cursor-pointer"
                            value={filters.hour}
                            onChange={(e) => setFilters({ ...filters, hour: e.target.value })}
                        >
                            {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="flex-1 bg-white relative border-r border-slate-200">
                        <select
                            className="w-full px-4 py-2.5 text-slate-800 bg-white focus:outline-none text-sm font-bold appearance-none cursor-pointer"
                            value={filters.minute}
                            onChange={(e) => setFilters({ ...filters, minute: e.target.value })}
                        >
                            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="flex-[4] bg-white relative mr-4 rounded-r sm:rounded-none">
                        <select
                            className="w-full px-4 py-2.5 text-slate-800 bg-white focus:outline-none text-sm font-bold appearance-none cursor-pointer"
                            value={filters.scrip}
                            onChange={(e) => setFilters({ ...filters, scrip: e.target.value })}
                        >
                            <option value="GOLD26AFRFUT">GOLD26AFRFUT</option>
                            <option value="SILVER26FEBFUT">SILVER26FEBFUT</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <button className="flex-[4] bg-[#17a2b8] hover:bg-[#138496] text-white font-bold py-2.5 px-8 rounded shadow-md text-xs uppercase tracking-widest transition-all">
                        SHOW DATA
                    </button>
                </div>
                <p className="text-[11px] font-medium text-slate-400 italic">
                    Note: Time is in 24 hours format. For example, For 8 PM, Select 20 in hours.
                </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium pt-2">
                <span>Showing <span className="text-white font-bold">69</span> of items.</span>
            </div>

            {/* Scrip Data Table */}
            <div className="flex-1 bg-[#151c2c] rounded-lg border border-[#2d3748] overflow-hidden flex flex-col shadow-xl">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead className="sticky top-0 bg-[#202940] z-10 border-b border-[#2d3748]">
                            <tr className="text-[#a0aec0] text-[11px] font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                        Scrip ID <span className="text-[9px] align-top">↑↑</span>
                                    </div>
                                </th>
                                <th className="px-6 py-4">Exchange Time</th>
                                <th className="px-6 py-4">System Time</th>
                                <th className="px-6 py-4">Bid</th>
                                <th className="px-6 py-4">Ask</th>
                                <th className="px-6 py-4">High</th>
                                <th className="px-6 py-4">Low</th>
                                <th className="px-6 py-4">LTP</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px]">
                            {scripData.map((data, idx) => (
                                <tr key={data.id} className="border-b border-[#2d3748] hover:bg-[#1c2638] transition-colors group">
                                    <td className="px-6 py-3.5 text-blue-400 font-medium">{data.id}</td>
                                    <td className="px-6 py-3.5 text-white font-medium">{data.scripId}</td>
                                    <td className="px-6 py-3.5 text-white font-mono">{data.exchangeTime}</td>
                                    <td className="px-6 py-3.5 text-white font-mono">{data.systemTime}</td>
                                    <td className="px-6 py-3.5 text-white font-bold">{parseFloat(data.bid || 0).toFixed(2)}</td>
                                    <td className="px-6 py-3.5 text-white font-bold">{parseFloat(data.ask || 0).toFixed(2)}</td>
                                    <td className="px-6 py-3.5 text-white font-bold">{parseFloat(data.high || 0).toFixed(2)}</td>
                                    <td className="px-6 py-3.5 text-white font-bold">{parseFloat(data.low || 0).toFixed(2)}</td>
                                    <td className="px-6 py-3.5 text-white font-bold">{parseFloat(data.ltp || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ScripDataPage;
