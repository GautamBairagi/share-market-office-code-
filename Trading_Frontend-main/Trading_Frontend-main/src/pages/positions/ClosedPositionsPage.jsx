import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { displaySymbol } from '../../utils/marketUtils';
import { ArrowLeft, Loader2 } from 'lucide-react';

const ClosedPositionsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [rawTrades, setRawTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSymbol, setSelectedSymbol] = useState(null);

    const fetchClosedTrades = async () => {
        setLoading(true);
        try {
            const { getClosedPositions } = await import('../../services/api');
            const data = await getClosedPositions();
            setRawTrades(data);
        } catch (err) {
            console.error('Fetch closed error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClosedTrades();
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const symbolParam = queryParams.get('symbol');
        if (symbolParam) {
            setSelectedSymbol(symbolParam);
        } else {
            setSelectedSymbol(null);
        }
    }, [location.search]);

    const handleRowClick = (symbol) => {
        navigate(`?symbol=${encodeURIComponent(symbol)}`);
    };

    const handleBackClick = () => {
        navigate('/closed-positions');
    };

    // Process main summary table data
    const processData = (trades) => {
        const groups = {};
        trades.forEach(t => {
            const sym = t.symbol;
            if (!sym) return;
            const symUpper = sym.toUpperCase();
            
            if (!groups[symUpper]) {
                groups[symUpper] = {
                    symbol: sym,
                    lots: 0,
                    totalBuyValue: 0,
                    totalSellValue: 0,
                    totalBuyQty: 0,
                    totalSellQty: 0,
                    pnl: 0,
                    brokerage: 0,
                    netPnL: 0
                };
            }
            
            const qty = parseFloat(t.qty || 0);
            const pnl = parseFloat(t.pnl || 0);
            const brokerage = parseFloat(t.brokerage || 0);
            const swap = parseFloat(t.swap || 0);
            
            const buyRate = t.type === 'BUY' ? parseFloat(t.entry_price || 0) : parseFloat(t.exit_price || 0);
            const sellRate = t.type === 'SELL' ? parseFloat(t.entry_price || 0) : parseFloat(t.exit_price || 0);
            
            groups[symUpper].lots += qty;
            groups[symUpper].totalBuyValue += buyRate * qty;
            groups[symUpper].totalBuyQty += qty;
            groups[symUpper].totalSellValue += sellRate * qty;
            groups[symUpper].totalSellQty += qty;
            groups[symUpper].pnl += pnl;
            groups[symUpper].brokerage += brokerage;
            groups[symUpper].netPnL += (pnl - brokerage - swap);
        });

        return Object.values(groups).map(g => ({
            symbol: g.symbol,
            lots: g.lots,
            avgBuyRate: g.totalBuyQty > 0 ? (g.totalBuyValue / g.totalBuyQty) : 0,
            avgSellRate: g.totalSellQty > 0 ? (g.totalSellValue / g.totalSellQty) : 0,
            pnl: g.pnl,
            brokerage: g.brokerage,
            netPnL: g.netPnL
        }));
    };

    // Process breakdown detail data for a specific symbol
    const processDetails = (trades, symbol) => {
        const userGroups = {};
        trades.forEach(t => {
            const sym = t.symbol;
            if (!sym || sym.toUpperCase() !== symbol.toUpperCase()) return;
            
            const uid = t.user_id;
            if (!userGroups[uid]) {
                userGroups[uid] = {
                    userId: uid,
                    username: t.username || 'N/A',
                    fullName: t.full_name || 'N/A',
                    lots: 0,
                    totalBuyValue: 0,
                    totalSellValue: 0,
                    totalBuyQty: 0,
                    totalSellQty: 0,
                    pnl: 0,
                    brokerage: 0,
                    netPnL: 0
                };
            }
            
            const qty = parseFloat(t.qty || 0);
            const pnl = parseFloat(t.pnl || 0);
            const brokerage = parseFloat(t.brokerage || 0);
            const swap = parseFloat(t.swap || 0);
            
            const buyRate = t.type === 'BUY' ? parseFloat(t.entry_price || 0) : parseFloat(t.exit_price || 0);
            const sellRate = t.type === 'SELL' ? parseFloat(t.entry_price || 0) : parseFloat(t.exit_price || 0);
            
            userGroups[uid].lots += qty;
            userGroups[uid].totalBuyValue += buyRate * qty;
            userGroups[uid].totalBuyQty += qty;
            userGroups[uid].totalSellValue += sellRate * qty;
            userGroups[uid].totalSellQty += qty;
            userGroups[uid].pnl += pnl;
            userGroups[uid].brokerage += brokerage;
            userGroups[uid].netPnL += (pnl - brokerage - swap);
        });

        return Object.values(userGroups).map(g => ({
            userId: g.userId,
            username: g.username,
            fullName: g.fullName,
            lots: g.lots,
            avgBuyRate: g.totalBuyQty > 0 ? (g.totalBuyValue / g.totalBuyQty) : 0,
            avgSellRate: g.totalSellQty > 0 ? (g.totalSellValue / g.totalSellQty) : 0,
            pnl: g.pnl,
            brokerage: g.brokerage,
            netPnL: g.netPnL
        }));
    };

    const closedData = processData(rawTrades);
    const symbolDetails = selectedSymbol ? processDetails(rawTrades, selectedSymbol) : [];

    const mainTotals = closedData.reduce((acc, pos) => ({
        lots: acc.lots + pos.lots,
        pnl: acc.pnl + pos.pnl,
        brokerage: acc.brokerage + pos.brokerage,
        netPnL: acc.netPnL + pos.netPnL
    }), { lots: 0, pnl: 0, brokerage: 0, netPnL: 0 });

    const detailTotals = symbolDetails.reduce((acc, pos) => ({
        lots: acc.lots + pos.lots,
        pnl: acc.pnl + pos.pnl,
        brokerage: acc.brokerage + pos.brokerage,
        netPnL: acc.netPnL + pos.netPnL
    }), { lots: 0, pnl: 0, brokerage: 0, netPnL: 0 });

    return (
        <div className="flex flex-col space-y-4 w-full">
            {/* Page Heading */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-white text-xl md:text-2xl font-bold tracking-tight uppercase">
                        {selectedSymbol ? `${displaySymbol(selectedSymbol)} DETAILS` : 'CLOSED POSITIONS'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {selectedSymbol 
                            ? `Detailed performance breakdown for ${displaySymbol(selectedSymbol)}` 
                            : 'Review your historical closed positions and performance'}
                    </p>
                </div>
                {selectedSymbol && (
                    <button 
                        onClick={handleBackClick}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-md transition-all text-xs border border-white/10 uppercase font-bold"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to List
                    </button>
                )}
            </div>

            {/* Table Section */}
            <div className="bg-[#1f283e] rounded-lg border border-white/5 shadow-2xl overflow-hidden w-full">
                {!selectedSymbol ? (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap custom-table">
                            <thead>
                                <tr className="text-slate-400 text-[13px] font-medium border-b border-white/5 bg-white/[0.01]">
                                    <th className="px-6 py-5">Scrip</th>
                                    <th className="px-6 py-5 text-center">Lots</th>
                                    <th className="px-6 py-5 text-center">Avg buy rate</th>
                                    <th className="px-6 py-5 text-center">Avg sell rate</th>
                                    <th className="px-6 py-5 text-center">Profit / Loss</th>
                                    <th className="px-6 py-5 text-center">Brokerage</th>
                                    <th className="px-6 py-5 text-center">Net P/L</th>
                                </tr>
                            </thead>
                            <tbody className="text-[14px] text-slate-300">
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center py-10">Loading closed positions...</td></tr>
                                ) : closedData.length > 0 ? (
                                    closedData.map((pos, index) => (
                                        <tr 
                                            key={index} 
                                            onClick={() => handleRowClick(pos.symbol)}
                                            className="border-b border-white/5 hover:bg-white/[0.01] transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-5 font-semibold">
                                                <span className="inline-block bg-[#2e7d32] text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                                    {displaySymbol(pos)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">{pos.lots}</td>
                                            <td className="px-6 py-5 text-center">{pos.avgBuyRate.toFixed(2)}</td>
                                            <td className="px-6 py-5 text-center">{pos.avgSellRate.toFixed(2)}</td>
                                            <td className={`px-6 py-5 text-center font-bold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {pos.pnl.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-5 text-center">{pos.brokerage.toFixed(2)}</td>
                                            <td className={`px-6 py-5 text-center font-bold ${pos.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {pos.netPnL.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="7" className="text-center py-10 text-slate-500">No closed positions.</td></tr>
                                    )}
                                {closedData.length > 0 && !loading && (
                                    <tr className="bg-white/[0.02] font-bold text-white border-t border-white/10">
                                        <td className="px-6 py-6 uppercase tracking-wider">Total</td>
                                        <td className="px-6 py-6 text-center text-base">{mainTotals.lots}</td>
                                        <td className="px-6 py-6 text-center"></td>
                                        <td className="px-6 py-6 text-center"></td>
                                        <td className={`px-6 py-6 text-center text-base ${mainTotals.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{mainTotals.pnl.toFixed(2)}</td>
                                        <td className="px-6 py-6 text-center text-base">{mainTotals.brokerage.toFixed(2)}</td>
                                        <td className={`px-6 py-6 text-center text-base ${mainTotals.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>{mainTotals.netPnL.toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap custom-table">
                            <thead>
                                <tr className="text-slate-400 text-[13px] font-medium border-b border-white/5 bg-white/[0.01]">
                                    <th className="px-6 py-5">User</th>
                                    <th className="px-6 py-5 text-center">Lots</th>
                                    <th className="px-6 py-5 text-center">Avg buy rate</th>
                                    <th className="px-6 py-5 text-center">Avg sell rate</th>
                                    <th className="px-6 py-5 text-center">Profit / Loss</th>
                                    <th className="px-6 py-5 text-center">Brokerage</th>
                                    <th className="px-6 py-5 text-center">Net P/L</th>
                                </tr>
                            </thead>
                            <tbody className="text-[14px] text-slate-300">
                                {symbolDetails.length > 0 ? (
                                    symbolDetails.map((row, index) => (
                                        <tr key={index} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                            <td className="px-6 py-5">
                                                <span 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/trading-clients/details/${row.userId}`, { 
                                                            state: { 
                                                                client: { 
                                                                    id: row.userId, 
                                                                    username: row.username, 
                                                                    fullName: row.fullName 
                                                                } 
                                                            } 
                                                        });
                                                    }}
                                                    className="inline-flex items-center bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm cursor-pointer transition-colors"
                                                >
                                                    {row.userId} : {row.fullName} ({row.username})
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">{row.lots}</td>
                                            <td className="px-6 py-5 text-center">{row.avgBuyRate.toFixed(2)}</td>
                                            <td className="px-6 py-5 text-center">{row.avgSellRate.toFixed(2)}</td>
                                            <td className={`px-6 py-5 text-center font-bold ${row.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {row.pnl.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-5 text-center">{row.brokerage.toFixed(2)}</td>
                                            <td className={`px-6 py-5 text-center font-bold ${row.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {row.netPnL.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="7" className="text-center py-10 text-slate-500">No details found.</td></tr>
                                )}
                                {symbolDetails.length > 0 && (
                                    <tr className="bg-white/[0.02] font-bold text-white border-t border-white/10">
                                        <td className="px-6 py-6 uppercase tracking-wider">Total</td>
                                        <td className="px-6 py-6 text-center text-base">{detailTotals.lots}</td>
                                        <td className="px-6 py-6 text-center"></td>
                                        <td className="px-6 py-6 text-center"></td>
                                        <td className={`px-6 py-6 text-center text-base ${detailTotals.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{detailTotals.pnl.toFixed(2)}</td>
                                        <td className="px-6 py-6 text-center text-base">{detailTotals.brokerage.toFixed(2)}</td>
                                        <td className={`px-6 py-6 text-center text-base ${detailTotals.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>{detailTotals.netPnL.toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClosedPositionsPage;
