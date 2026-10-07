import React, { useState, useEffect } from 'react';
import { getTrades } from '../services/api';
import { displaySymbol } from '../utils/marketUtils';

const ActivePositionsTable = ({ clientId, username }) => {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const params = { status: 'OPEN', is_pending: 0 };
                if (clientId) params.user_id = clientId;
                const trades = await getTrades(params);

                // Group trades by symbol into positions
                const posMap = {};
                trades.forEach(t => {
                    const key = t.symbol;
                    if (!posMap[key]) {
                        posMap[key] = { scrip: key, buyQty: 0, sellQty: 0, buyTotal: 0, sellTotal: 0, marginUsed: 0, pnl: 0 };
                    }
                    const qty = parseInt(t.qty) || 0;
                    const price = parseFloat(t.entry_price) || 0;
                    if (t.type === 'BUY') {
                        posMap[key].buyQty += qty;
                        posMap[key].buyTotal += price * qty;
                    } else {
                        posMap[key].sellQty += qty;
                        posMap[key].sellTotal += price * qty;
                    }
                    posMap[key].marginUsed += parseFloat(t.margin_used || 0);
                    posMap[key].pnl += parseFloat(t.pnl || 0);
                });

                setPositions(Object.values(posMap).map(p => ({
                    ...p,
                    total: p.buyQty + p.sellQty,
                    net: p.buyQty - p.sellQty,
                    avgBuyRate: p.buyQty > 0 ? (p.buyTotal / p.buyQty).toFixed(2) : '0.00',
                    avgSellRate: p.sellQty > 0 ? (p.sellTotal / p.sellQty).toFixed(2) : '0.00',
                })));
            } catch (err) {
                console.error('ActivePositionsTable fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPositions();
    }, [clientId]);

    const totals = positions.reduce(
        (acc, p) => ({ buy: acc.buy + p.buyQty, sell: acc.sell + p.sellQty, total: acc.total + p.total, net: acc.net + p.net, pnl: acc.pnl + p.pnl, margin: acc.margin + p.marginUsed }),
        { buy: 0, sell: 0, total: 0, net: 0, pnl: 0, margin: 0 }
    );

    const MobileCard = ({ pos }) => (
        <div className="bg-[#1f283e] p-4 rounded-lg border border-white/5 shadow-md mb-3">
            <div className="flex justify-between items-center mb-3">
                <span className="bg-[#4CAF50] text-white px-3 py-1 rounded-full text-xs font-bold uppercase truncate max-w-[200px]">
                    {displaySymbol(pos.scrip)}
                </span>
                <span className={`text-sm font-bold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pos.pnl.toFixed(2)}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="flex flex-col">
                    <span className="text-slate-500">Buy Qty</span>
                    <span className="text-white font-medium">{pos.buyQty}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-slate-500">Sell Qty</span>
                    <span className="text-white font-medium">{pos.sellQty}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-slate-500">Net</span>
                    <span className="text-white font-bold">{pos.net}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-slate-500">Margin Used</span>
                    <span className="text-white font-medium">{pos.marginUsed.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );

    const title = username ? `${username}'s Active Positions` : 'Active Positions';

    return (
        <div className="mb-6">
            <div className="bg-[#1f283e] rounded-t-lg border-t border-x border-white/5 px-6 py-4 flex justify-between items-center shadow-sm">
                <h2 className="text-lg md:text-2xl font-normal text-slate-300 tracking-wide">{title}</h2>
                <p className="text-xs text-slate-500">
                    {loading ? 'Loading...' : `${positions.length} scrip(s)`}
                </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-[#1f283e] rounded-b-lg border border-white/5 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="text-slate-300 text-[13px] font-normal border-b border-white/10 bg-[#1f283e]">
                                <th className="px-6 py-4">Scrip</th>
                                <th className="px-6 py-4">Active Buy</th>
                                <th className="px-6 py-4">Active Sell</th>
                                <th className="px-6 py-4">Avg Buy Rate</th>
                                <th className="px-6 py-4">Avg Sell Rate</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Net</th>
                                <th className="px-6 py-4">M2M P/L</th>
                                <th className="px-6 py-4">Margin Used</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] text-slate-300">
                            {loading ? (
                                <tr><td colSpan="9" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                            ) : positions.length === 0 ? (
                                <tr><td colSpan="9" className="px-6 py-8 text-center text-slate-500">No active positions</td></tr>
                            ) : positions.map((pos) => (
                                <tr key={pos.scrip} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-slate-300 uppercase font-medium">{displaySymbol(pos.scrip)}</td>
                                    <td className="px-6 py-4">{pos.buyQty}</td>
                                    <td className="px-6 py-4">{pos.sellQty}</td>
                                    <td className="px-6 py-4">{pos.avgBuyRate}</td>
                                    <td className="px-6 py-4">{pos.avgSellRate}</td>
                                    <td className="px-6 py-4">{pos.total}</td>
                                    <td className="px-6 py-4">{pos.net}</td>
                                    <td className={`px-6 py-4 font-bold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {pos.pnl.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">{pos.marginUsed.toFixed(2)}</td>
                                </tr>
                            ))}
                            {/* Total Row */}
                            {!loading && positions.length > 0 && (
                                <tr className="bg-[#1f283e] border-t border-white/10 font-bold text-slate-200">
                                    <td className="px-6 py-4">Total</td>
                                    <td className="px-6 py-4">{totals.buy}</td>
                                    <td className="px-6 py-4">{totals.sell}</td>
                                    <td className="px-6 py-4"></td>
                                    <td className="px-6 py-4"></td>
                                    <td className="px-6 py-4">{totals.total}</td>
                                    <td className="px-6 py-4">{totals.net}</td>
                                    <td className={`px-6 py-4 ${totals.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {totals.pnl.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">{totals.margin.toFixed(2)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 mt-2">
                {loading ? (
                    <p className="text-slate-500 text-center py-6">Loading...</p>
                ) : positions.length === 0 ? (
                    <p className="text-slate-500 text-center py-6">No active positions</p>
                ) : positions.map((pos) => (
                    <MobileCard key={pos.scrip} pos={pos} />
                ))}
            </div>
        </div>
    );
};

export default ActivePositionsTable;
