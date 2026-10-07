import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getLiveM2M, getClientById } from '../../services/api';
import { displaySymbol } from '../../utils/marketUtils';

const ClientActivePositionsPage = ({ client: initialClient, onBack, onNavigateToAccount }) => {
    const { id } = useParams();
    const [client, setClient] = useState(initialClient);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [prevData, setPrevData] = useState({});

    const clientId = id || client?.id;
    const clientName = client?.username || client?.fullName || id || 'TRADER';

    // lotsCount = qty_input (how many lots), totalQty = actual_qty (total shares/units)
    const formatLotsQty = (lotsCount, totalQty) => {
        const lots = parseFloat(lotsCount) || 0;
        const formattedLots = lots % 1 === 0 ? lots.toFixed(0) : lots.toFixed(3).replace(/\.?0+$/, '');
        return `${formattedLots} (${parseFloat(totalQty) || 0})`;
    };

    const formatLotsOnly = (lotsCount) => {
        const lots = parseFloat(lotsCount) || 0;
        return lots % 1 === 0 ? lots.toFixed(0) : lots.toFixed(3).replace(/\.?0+$/, '');
    };

    // Recover client info on refresh or history change
    useEffect(() => {
        if (id && (!client || (client.id !== parseInt(id) && client.id !== id))) {
            getClientById(id).then(data => {
                if (data.profile) {
                    setClient({
                        id: data.profile.id,
                        username: data.profile.username,
                        fullName: data.profile.full_name
                    });
                }
            }).catch(err => console.error("Recover client error:", err));
        }
    }, [id, client]);

    useEffect(() => {
        if (!clientId) { setLoading(false); return; }
        const fetchPositions = async () => {
            try {
                const response = await getLiveM2M(clientId);
                const clientData = response?.clients?.[0] || {};
                const posList = clientData.positions || [];
                setPositions(posList);
            } catch (err) {
                console.error('Failed to fetch client positions:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPositions();
        const interval = setInterval(fetchPositions, 1000);
        return () => clearInterval(interval);
    }, [clientId]);

    useEffect(() => {
        if (positions.length > 0) {
            const currentFlashes = { ...prevData };
            positions.forEach(p => {
                const key = p.symbol;
                const pnlNum = parseFloat(p.pnl || 0);
                const cmpNum = parseFloat(p.cmp || 0);
                
                if (prevData[key + '-pnl'] !== undefined && prevData[key + '-pnl'] !== pnlNum) {
                    currentFlashes[key + '-pnl-flash'] = pnlNum > prevData[key + '-pnl'] ? 'up' : 'down';
                    setTimeout(() => {
                        setPrevData(prev => {
                            const next = { ...prev };
                            delete next[key + '-pnl-flash'];
                            return next;
                        });
                    }, 500);
                }
                if (prevData[key + '-cmp'] !== undefined && prevData[key + '-cmp'] !== cmpNum) {
                    currentFlashes[key + '-cmp-flash'] = cmpNum > prevData[key + '-cmp'] ? 'up' : 'down';
                    setTimeout(() => {
                        setPrevData(prev => {
                            const next = { ...prev };
                            delete next[key + '-cmp-flash'];
                            return next;
                        });
                    }, 500);
                }
                currentFlashes[key + '-pnl'] = pnlNum;
                currentFlashes[key + '-cmp'] = cmpNum;
            });
            setPrevData(currentFlashes);
        }
    }, [positions]);

    const totals = positions.reduce((acc, p) => {
        const buy = parseFloat(p.buyQty || 0);
        const sell = parseFloat(p.sellQty || 0);
        const actualBuy = parseFloat(p.actualBuyQty || 0);
        const actualSell = parseFloat(p.actualSellQty || 0);
        const pnl = parseFloat(p.pnl || 0);
        const margin = parseFloat(p.margin || 0);
        const marginUsed = parseFloat(p.marginUsed || 0);
        return {
            buy: acc.buy + buy,
            sell: acc.sell + sell,
            actualBuy: acc.actualBuy + actualBuy,
            actualSell: acc.actualSell + actualSell,
            total: acc.total + buy + sell,
            net: acc.net + (buy - sell),
            pnl: acc.pnl + pnl,
            margin: acc.margin + margin,
            marginUsed: acc.marginUsed + marginUsed
        };
    }, { buy: 0, sell: 0, actualBuy: 0, actualSell: 0, total: 0, net: 0, pnl: 0, margin: 0, marginUsed: 0 });

    return (
        <div className="flex flex-col bg-[#1a2035] px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-4 md:space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl text-slate-300 font-normal">{clientName.toUpperCase()}'s Active Positions</h1>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-md transition-all text-xs border border-white/10 uppercase font-bold"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Clients
                </button>
            </div>

            {/* Positions Table */}
            <div className="bg-[#1f283e]/50 rounded-lg overflow-hidden border border-white/5 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="text-slate-400 text-[12px] sm:text-[13px] font-bold uppercase tracking-wider bg-white/[0.02]">
                                <th className="px-3 sm:px-4 py-3.5 sm:py-4 font-medium">Scrip</th>
                                <th className="px-3 sm:px-4 py-3.5 sm:py-4 font-medium">Active Buy</th>
                                <th className="px-3 sm:px-4 py-3.5 sm:py-4 font-medium">Active Sell</th>
                                <th className="px-3 sm:px-4 py-3.5 sm:py-4 font-medium">Avg buy rate</th>
                                <th className="px-3 sm:px-4 py-3.5 sm:py-4 font-medium">Avg sell rate</th>
                                <th className="px-3 sm:px-4 py-3.5 sm:py-4 font-medium">Total</th>
                                <th className="px-3 sm:px-4 py-3.5 sm:py-4 font-medium">Net</th>
                                <th className="px-3 sm:px-4 py-3.5 sm:py-4 font-medium text-right">M2m</th>
                                <th className="px-3 sm:px-4 py-3.5 sm:py-4 font-medium text-right">Margin Used</th>
                                <th className="px-3 sm:px-4 py-3.5 sm:py-4 font-medium">CMP</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] sm:text-[14px] text-slate-300">
                            {loading ? (
                                <tr><td colSpan="10" className="px-4 py-10 text-center text-slate-500">Loading positions...</td></tr>
                            ) : positions.length === 0 ? (
                                <tr><td colSpan="10" className="px-4 py-10 text-center text-slate-500">No active positions.</td></tr>
                            ) : positions.map((pos, index) => {
                                const key = pos.symbol;
                                const pnlFlash = prevData[key + '-pnl-flash'];
                                const cmpFlash = prevData[key + '-cmp-flash'];
                                const isCryptoForex = pos.symbol?.startsWith('CRYPTO:') || pos.symbol?.startsWith('FOREX:');
                                const decimals = isCryptoForex ? 4 : 2;
                                const avgBuy = pos.buyQty > 0 ? (pos.buyTotal / pos.buyQty).toFixed(decimals) : (0).toFixed(decimals);
                                const avgSell = pos.sellQty > 0 ? (pos.sellTotal / pos.sellQty).toFixed(decimals) : (0).toFixed(decimals);

                                return (
                                    <tr key={index} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                        <td className="px-3 sm:px-4 py-3.5 text-slate-200">{displaySymbol(pos)}</td>
                                        <td className="px-3 sm:px-4 py-3.5 tabular-nums">{formatLotsQty(pos.buyQty, pos.actualBuyQty)}</td>
                                        <td className="px-3 sm:px-4 py-3.5 tabular-nums">{formatLotsQty(pos.sellQty, pos.actualSellQty)}</td>
                                        <td className="px-3 sm:px-4 py-3.5 tabular-nums">{avgBuy}</td>
                                        <td className="px-3 sm:px-4 py-3.5 tabular-nums">{avgSell}</td>
                                        <td className="px-3 sm:px-4 py-3.5 tabular-nums">{formatLotsOnly(pos.buyQty + pos.sellQty)}</td>
                                        <td className={`px-3 sm:px-4 py-3.5 tabular-nums font-bold ${pos.netQty >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{formatLotsOnly(pos.netQty)}</td>
                                        <td className="px-3 sm:px-4 py-3.5 text-right">
                                            <span className={`inline-block px-2.5 py-1 rounded font-black tabular-nums text-xs sm:text-sm border transition-all duration-300 ${pnlFlash === 'up' ? 'bg-green-500/20' : pnlFlash === 'down' ? 'bg-red-500/20' : ''} ${parseFloat(pos.pnl) >= 0 
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {parseFloat(pos.pnl) >= 0 ? '+' : ''}{parseFloat(pos.pnl).toFixed(decimals)}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3.5 text-right tabular-nums">{parseFloat(pos.marginUsed || 0).toFixed(2)}</td>
                                        <td className={`px-3 sm:px-4 py-3.5 font-bold tabular-nums transition-colors duration-300 ${cmpFlash === 'up' ? 'text-green-400' : cmpFlash === 'down' ? 'text-red-400' : 'text-white'}`}>
                                            {parseFloat(pos.cmp || 0).toFixed(decimals)}
                                        </td>
                                    </tr>
                                );
                            })}
                            {positions.length > 0 && (
                                <tr className="bg-white/[0.03] font-black text-slate-100">
                                    <td className="px-3 sm:px-4 py-4 uppercase">Total</td>
                                    <td className="px-3 sm:px-4 py-4 text-white text-base tabular-nums">{formatLotsQty(totals.buy, totals.actualBuy)}</td>
                                    <td className="px-3 sm:px-4 py-4 text-white text-base tabular-nums">{formatLotsQty(totals.sell, totals.actualSell)}</td>
                                    <td className="px-3 sm:px-4 py-4"></td>
                                    <td className="px-3 sm:px-4 py-4"></td>
                                    <td className="px-3 sm:px-4 py-4 text-white text-base tabular-nums">{formatLotsOnly(totals.total)}</td>
                                    <td className="px-3 sm:px-4 py-4 text-white text-base tabular-nums">{formatLotsOnly(totals.net)}</td>
                                    <td className={`px-3 sm:px-4 py-4 text-right text-base font-bold tabular-nums ${totals.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{totals.pnl.toFixed(2)}</td>
                                    <td className="px-3 sm:px-4 py-4 text-right text-white text-base tabular-nums">{totals.marginUsed.toFixed(2)}</td>
                                    <td className="px-3 sm:px-4 py-4"></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
                <button
                    onClick={() => onNavigateToAccount && onNavigateToAccount(client || { id })}
                    className="bg-[#4caf50] hover:bg-[#45a049] text-white px-8 py-3 rounded-md text-[13px] font-black uppercase tracking-widest shadow-lg shadow-green-900/20 transition-all border border-white/10"
                >
                    GO TO {clientName.toUpperCase()}'S ACCOUNT
                </button>
            </div>

            <style>{`
                @keyframes flash-green {
                    0% { background-color: rgba(76, 175, 80, 0.4); }
                    100% { background-color: transparent; }
                }
                @keyframes flash-red {
                    0% { background-color: rgba(244, 67, 54, 0.4); }
                    100% { background-color: transparent; }
                }
                .flash-up { animation: flash-green 0.5s ease-out; }
                .flash-down { animation: flash-red 0.5s ease-out; }
            `}</style>
        </div>
    );
};

export default ClientActivePositionsPage;
