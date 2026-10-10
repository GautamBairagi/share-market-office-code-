import React, { useState, useEffect } from 'react';
import { getTrades } from '../services/api';

const ActiveTradesTable = ({ clientId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                const params = { status: 'OPEN', is_pending: 0 };
                if (clientId) params.user_id = clientId;
                const rows = await getTrades(params);
                const list = Array.isArray(rows) ? rows : rows?.data || [];
                setData(list.filter(t => !t.is_pending && t.is_pending !== 1));
            } catch (err) {
                console.error('ActiveTradesTable fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrades();
    }, [clientId]);

    const MobileActiveTradeCard = ({ item }) => {
        const pl = parseFloat(item.pnl || 0);
        return (
            <div className="bg-[#151c2c] p-4 rounded-lg border border-[#2d3748] shadow-md mb-3">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className="text-xs text-slate-400 font-mono">#{item.id}</span>
                        <h3 className="text-[#90caf9] font-bold text-sm uppercase mt-0.5">{item.symbol}</h3>
                    </div>
                    <div className={`text-sm font-bold ${pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pl.toFixed(2)}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="flex flex-col">
                        <span className="text-slate-500">{item.type === 'BUY' ? 'Buy Rate' : 'Sell Rate'}</span>
                        <span className="text-white font-medium">{parseFloat(item.entry_price || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-slate-500">Qty</span>
                        <span className="text-white font-medium">{item.qty}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-500">Type</span>
                        <span className={`font-bold ${item.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{item.type}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-slate-500">Holding Margin</span>
                        <span className="text-white font-medium">{parseFloat(item.holding_margin !== undefined ? item.holding_margin : (item.margin_used || 0)).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="mb-6">
            <div className="bg-[#151c2c] rounded-t-lg border-t border-x border-[#2d3748] px-6 py-4 flex justify-between items-center shadow-sm">
                <h2 className="text-lg md:text-xl font-normal text-slate-300 tracking-wide">Active Trades</h2>
                <p className="text-xs text-slate-500">
                    {loading ? 'Loading...' : `Showing ${data.length} trade(s)`}
                </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-[#151c2c] rounded-b-lg border border-[#2d3748] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="text-slate-300 text-[13px] font-normal border-b border-[#2d3748] bg-[#151c2c]">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Scrip</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Buy Rate</th>
                                <th className="px-6 py-4">Sell Rate</th>
                                <th className="px-6 py-4">Qty</th>
                                <th className="px-6 py-4">Buy Turnover</th>
                                <th className="px-6 py-4">Sell Turnover</th>
                                <th className="px-6 py-4">Active P/L</th>
                                <th className="px-6 py-4">Brokerage</th>
                                <th className="px-6 py-4">Holding Margin Required</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] text-slate-300">
                            {loading ? (
                                <tr><td colSpan="12" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="12" className="px-6 py-8 text-center text-slate-500">No active trades</td></tr>
                            ) : data.map((item) => {
                                const pl = parseFloat(item.pnl || 0);
                                const buyTurnover = item.type === 'BUY' ? (parseFloat(item.entry_price) * item.qty).toFixed(2) : '0.00';
                                const sellTurnover = item.type === 'SELL' ? (parseFloat(item.entry_price) * item.qty).toFixed(2) : '0.00';
                                return (
                                    <tr key={item.id} className="border-b border-[#2d3748] hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 text-slate-400 font-mono">{item.id}</td>
                                        <td className="px-6 py-4 text-[#90caf9] uppercase">{item.symbol}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(item.status === 'HOLD' || item.is_carried_forward === 1) ? (
                                                <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                    HOLD
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                    OPEN
                                                </span>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 font-bold ${item.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{item.type}</td>
                                        <td className="px-6 py-4">{item.type === 'BUY' ? parseFloat(item.entry_price).toFixed(2) : '-'}</td>
                                        <td className="px-6 py-4">{item.type === 'SELL' ? parseFloat(item.entry_price).toFixed(2) : '-'}</td>
                                        <td className="px-6 py-4">{item.qty}</td>
                                        <td className="px-6 py-4">{buyTurnover}</td>
                                        <td className="px-6 py-4">{sellTurnover}</td>
                                        <td className={`px-6 py-4 font-bold ${pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pl.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {(item.status === 'HOLD' || item.is_carried_forward === 1) ? (
                                                <span className="text-amber-300 font-bold">₹0.00</span>
                                            ) : (
                                                `₹${parseFloat(item.brokerage || 0).toFixed(2)}`
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{parseFloat(item.holding_margin !== undefined ? item.holding_margin : (item.margin_used || 0)).toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 mt-2">
                {loading ? (
                    <p className="text-slate-500 text-center py-6">Loading...</p>
                ) : data.length === 0 ? (
                    <p className="text-slate-500 text-center py-6">No active trades</p>
                ) : data.map((item) => (
                    <MobileActiveTradeCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
};

export default ActiveTradesTable;
