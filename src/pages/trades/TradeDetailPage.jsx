import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, User, Settings, ArrowLeft, Edit3, Trash2, RotateCcw } from 'lucide-react';
import * as api from '../../services/api';
import DeleteTradePage from './DeleteTradePage';
import RestoreBuyPage from './RestoreBuyPage';
import { displaySymbol } from '../../utils/marketUtils';

const TradeDetailPage = ({ tradeId: propTradeId, onClose }) => {
    const navigate = useNavigate();
    const { tradeId: urlTradeId } = useParams();
    // Use URL param if available, otherwise use prop
    const tradeId = urlTradeId || propTradeId;
    const [trade, setTrade] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [showDelete, setShowDelete] = useState(false);
    const [showRestore, setShowRestore] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !showDelete && !showRestore) {
                if (onClose) onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showDelete, showRestore, onClose]);

    useEffect(() => {
        if (!tradeId) return;
        const fetchTrade = async () => {
            try {
                setLoading(true);
                // Convert tradeId to number if needed (URL params come as strings)
                const tradeIdNum = typeof tradeId === 'string' ? parseInt(tradeId) : tradeId;
                // Fetch trade details directly by ID (works for both live and demo trades)
                let found = null;
                try {
                    found = await api.getTradeById(tradeIdNum);
                } catch (e) {
                    console.warn('api.getTradeById failed, fallback to getTrades:', e);
                    const data = await api.getTrades({ id: tradeIdNum });
                    found = Array.isArray(data)
                        ? data.find(t => parseInt(t.id) === tradeIdNum)
                        : (data?.data?.find(t => parseInt(t.id) === tradeIdNum) || data);
                }
                setTrade(found);
            } catch (err) {
                console.error('Failed to fetch trade detail:', err);
                setTrade(null);
            } finally {
                setLoading(false);
            }
        };
        fetchTrade();
    }, [tradeId]);

    // Remove loading check to avoid transition lag
    const isFetching = loading && !trade;

    const fmtTime = (t) => {
        if (!t) return '(not set)';
        try {
            return new Date(t).toLocaleString('en-IN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            }).replace(/\//g, '-');
        } catch { return t; }
    };

    // Helper: lots / actual qty display like "1 / 375"
    const lotsDisplay = (() => {
        if (!trade) return '-';
        const lots = trade.qty_input != null ? trade.qty_input : trade.qty;
        const actualQty = trade.actual_qty != null ? trade.actual_qty : trade.qty;
        if (lots != null && actualQty != null && String(lots) !== String(actualQty)) {
            return `${lots} / ${actualQty}`;
        }
        return lots != null ? String(lots) : '-';
    })();

    // Buy rate = entry_price for BUY, exit_price for SELL
    const buyRate = (() => {
        if (!trade) return '-';
        if (trade.type === 'BUY') return trade.entry_price ? parseFloat(trade.entry_price).toFixed(4) : '-';
        return trade.exit_price ? parseFloat(trade.exit_price).toFixed(4) : '-';
    })();

    // Sell rate = entry_price for SELL, exit_price for BUY
    const sellRate = (() => {
        if (!trade) return '-';
        if (trade.type === 'SELL') return trade.entry_price ? parseFloat(trade.entry_price).toFixed(4) : '-';
        return trade.exit_price ? parseFloat(trade.exit_price).toFixed(4) : '-';
    })();

    // Turnover calculations using actual_qty (correct qty for shares)
    const actualQtyNum = parseFloat(trade?.actual_qty || trade?.qty || 0);
    const buyTurnover = (() => {
        if (!trade) return '-';
        const bp = parseFloat(trade.type === 'BUY' ? trade.entry_price : trade.exit_price) || 0;
        return bp ? (bp * actualQtyNum).toFixed(2) : '-';
    })();
    const sellTurnover = (() => {
        if (!trade) return '-';
        const sp = parseFloat(trade.type === 'SELL' ? trade.entry_price : trade.exit_price) || 0;
        return sp ? (sp * actualQtyNum).toFixed(2) : '-';
    })();

    const pnl = parseFloat(trade?.pnl ?? trade?.live_pnl ?? 0);

    const details = trade ? [
        { label: 'ID', value: trade.id },
        { label: 'Script', value: displaySymbol(trade.symbol || trade.scrip) },
        { label: 'Segment', value: trade.market_type || trade.segment || trade.exchange || '-' },
        { label: 'User ID', value: trade.user_id },
        { label: 'Buy Rate', value: buyRate },
        { label: 'Sell Rate', value: sellRate },
        { label: 'Buy IP', value: trade.type === 'BUY' ? (trade.trade_ip || '-') : '-' },
        { label: 'Sell IP', value: trade.type === 'SELL' ? (trade.trade_ip || '-') : (trade.close_ip || '-') },
        { label: 'Lots / Units', value: lotsDisplay },
        { label: 'Profit / Loss', value: pnl.toFixed(2), highlight: true },
        { label: 'Buy Turnover', value: buyTurnover },
        { label: 'Sell Turnover', value: sellTurnover },
        { label: 'Brokerage', value: parseFloat(trade.brokerage || 0).toFixed(2) },
        { label: 'Buy Type', value: trade.order_type || 'Market' },
        { label: 'Sell Type', value: trade.exit_order_type || 'Market' },
        { label: 'Buy Order ID', value: trade.buy_order_id || '(not set)' },
        { label: 'Sell Order ID', value: trade.sell_order_id || '(not set)' },
        { label: 'Bought at', value: trade.entry_time ? fmtTime(trade.entry_time) : '(not set)' },
        { label: 'Sold at', value: trade.exit_time ? fmtTime(trade.exit_time) : '(not set)' },
    ] : [];

    return (
        <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 w-full max-w-full min-w-0 bg-[#1a2035] text-slate-300">
            {/* Back Button & Header */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => {
                        if (urlTradeId) {
                            navigate(-1);
                        } else if (onClose) {
                            onClose();
                        }
                    }}
                    className="flex items-center gap-2 text-white hover:text-green-400 transition-colors font-bold text-xs sm:text-sm"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>BACK</span>
                </button>
            </div>

            <div className="ml-4 space-y-8 max-w-5xl">
                        {/* Styled Exit Button - Aligned lower */}
                        <div className="absolute top-6 right-8">
                            <button
                                onClick={() => {
                                    if (urlTradeId) {
                                        navigate(-1);
                                    } else if (onClose) {
                                        onClose();
                                    }
                                }}
                                className="text-white/40 hover:text-white transition-colors active:scale-95"
                                title="Exit"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Loading State */}
                        {isFetching && (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-[#4caf50] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-400 text-sm">Loading trade details...</p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {!isFetching && trade && (
                        <div className="space-y-4 pt-4">

                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate(`/trades/edit/${trade.id}`)}
                                    className="bg-[#ab47bc] hover:bg-[#9c27b0] text-white font-bold py-2 px-8 rounded transition-all text-[13px] shadow-lg active:scale-95 min-w-[120px]"
                                >
                                    UPDATE
                                </button>
                                <button
                                    onClick={() => setShowDelete(true)}
                                    className="bg-[#f44336] hover:bg-[#d32f2f] text-white font-bold py-2 px-8 rounded transition-all text-[13px] shadow-lg active:scale-95 min-w-[120px]"
                                >
                                    DELETE
                                </button>
                            </div>
                            {trade?.status === 'CLOSED' && (
                                <button
                                    onClick={() => setShowRestore(true)}
                                    className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold py-2 px-6 rounded transition-all text-[13px] shadow-lg active:scale-95 min-w-[140px]"
                                >
                                    RESTORE {trade.type === 'BUY' ? 'BUY' : 'SELL'}
                                </button>
                            )}
                        </div>
                        )}

                        {/* Details Table */}
                        {!isFetching && trade && (
                        <div className="bg-[#1a2235] rounded-none shadow-2xl overflow-hidden border-none text-left mb-6">
                            <table className="w-full border-collapse border-none">
                                <tbody className="text-[14px]">
                                    {details.map((row, idx) => {
                                        const numVal = parseFloat(row.value);
                                        const isNegative = row.highlight && !isNaN(numVal) && numVal < 0;
                                        const isPositive = row.highlight && !isNaN(numVal) && numVal > 0;
                                        return (
                                            <tr key={idx} className="border-b border-white/[0.08] hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 text-slate-400 font-bold w-[240px] border-r border-white/[0.08] text-[13px] tracking-wide">{row.label}</td>
                                                <td className="px-6 py-4 border-none">
                                                    <span className={`font-medium tracking-tight text-[14px] ${isNegative ? 'text-red-400' : isPositive ? 'text-green-400' : 'text-slate-200'}`}>
                                                        {row.value}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        )}
                    </div>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #1a2035; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #4caf50; border-radius: 4px; }
                `}</style>
                {/* DELETE TRADE MODAL */}
                {showDelete && (
                    <DeleteTradePage
                        trade={trade}
                        onClose={() => setShowDelete(false)}
                        onDelete={() => {
                            if (onClose) onClose();
                            navigate('/deleted-trades');
                        }}
                    />
                )}

                {/* RESTORE BUY MODAL */}
                {showRestore && (
                    <RestoreBuyPage
                        trade={trade}
                        onClose={() => setShowRestore(false)}
                        onRestore={() => { if (onClose) onClose(); }}
                    />
                )}
            </div>
    );
};

export default TradeDetailPage;
