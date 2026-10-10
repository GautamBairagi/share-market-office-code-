import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrades, getTradeById } from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { displaySymbol } from '../../utils/marketUtils';

const TradeViewPage = () => {
    const { tradeId } = useParams();
    const navigate = useNavigate();
    const [trade, setTrade] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrade = async () => {
            setLoading(true);
            try {
                let foundTrade = null;
                try {
                    foundTrade = await getTradeById(tradeId);
                } catch (e) {
                    const data = await getTrades({ id: tradeId });
                    foundTrade = Array.isArray(data) ? data.find(t => t.id === parseInt(tradeId)) : data;
                }
                if (foundTrade) {
                    setTrade(foundTrade);
                }
            } catch (err) {
                console.error('Failed to fetch trade:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrade();
    }, [tradeId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#1a2035]">
                <p className="text-slate-400">Loading trade details...</p>
            </div>
        );
    }

    if (!trade) {
        return (
            <div className="flex flex-col h-full bg-[#1a2035] space-y-4 p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="text-center text-slate-400">Trade not </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#1a2035] space-y-6 overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Header */}
            <div className="mb-4">
                <h1 className="text-white text-2xl md:text-3xl font-bold tracking-tight uppercase">
                    Trade Details
                </h1>
                <p className="text-slate-400 text-sm mt-1">Trade #{trade.id}</p>
            </div>

            {/* Details Card */}
            <div className="bg-[#1f283e] rounded-lg border border-white/10 shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Symbol */}
                        <div>
                            <label className="text-slate-500 text-xs uppercase tracking-widest font-medium block mb-2">
                                Symbol
                            </label>
                            <p className="text-white text-lg font-bold">{displaySymbol(trade.symbol)}</p>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="text-slate-500 text-xs uppercase tracking-widest font-medium block mb-2">
                                Trade Type
                            </label>
                            <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${
                                trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                                {trade.type}
                            </span>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="text-slate-500 text-xs uppercase tracking-widest font-medium block mb-2">
                                Quantity
                            </label>
                            <p className="text-white text-lg font-mono">{trade.qty}</p>
                        </div>

                        {/* Entry Price */}
                        <div>
                            <label className="text-slate-500 text-xs uppercase tracking-widest font-medium block mb-2">
                                Entry Price
                            </label>
                            <p className="text-white text-lg font-mono">{parseFloat(trade.entry_price || 0).toFixed(2)}</p>
                        </div>

                        {/* Exit Price */}
                        <div>
                            <label className="text-slate-500 text-xs uppercase tracking-widest font-medium block mb-2">
                                Exit Price
                            </label>
                            <p className="text-white text-lg font-mono">{parseFloat(trade.exit_price || 0).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Username */}
                        <div>
                            <label className="text-slate-500 text-xs uppercase tracking-widest font-medium block mb-2">
                                Username
                            </label>
                            <p className="text-white text-lg">{trade.username || 'N/A'}</p>
                        </div>

                        {/* Segment */}
                        <div>
                            <label className="text-slate-500 text-xs uppercase tracking-widest font-medium block mb-2">
                                Segment
                            </label>
                            <p className="text-white text-lg">{trade.segment || 'MCX'}</p>
                        </div>

                        {/* P&L */}
                        <div>
                            <label className="text-slate-500 text-xs uppercase tracking-widest font-medium block mb-2">
                                Profit / Loss
                            </label>
                            <p className={`text-lg font-bold ${parseFloat(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {parseFloat(trade.pnl || 0).toFixed(2)}
                            </p>
                        </div>

                        {/* Entry Time */}
                        <div>
                            <label className="text-slate-500 text-xs uppercase tracking-widest font-medium block mb-2">
                                Entry Time
                            </label>
                            <p className="text-white text-sm">{trade.entry_time ? new Date(trade.entry_time).toLocaleString() : '-'}</p>
                        </div>

                        {/* Exit Time */}
                        <div>
                            <label className="text-slate-500 text-xs uppercase tracking-widest font-medium block mb-2">
                                Exit Time
                            </label>
                            <p className="text-white text-sm">{trade.exit_time ? new Date(trade.exit_time).toLocaleString() : '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[#1a2035] border-t border-white/10 px-6 md:px-8 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-[#607d8b] hover:bg-[#546e7a] text-white font-bold py-2.5 px-8 rounded uppercase tracking-wide text-xs transition-all shadow-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TradeViewPage;
