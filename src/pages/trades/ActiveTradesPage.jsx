import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowUpDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { getTrades, BASE_URL } from '../../services/api';
import { useMarketData } from '../../context/MarketDataContext';
import { displaySymbol, getScripPrice } from '../../utils/marketUtils';
import { calculateEquityPnL, calculateMcxPnL } from '../../utils/equityPnL';
import { calculateUsdPnL, calculateCryptoPnL, calculateForexPnL, calculateComexPnL } from '../../utils/usdPnL';

const ActiveTradesPage = () => {
    const { watchlistRows, cryptoData, forexData, commodityData, kiteStatus } = useMarketData();
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list');
    const [selectedTrade, setSelectedTrade] = useState(null);
    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        try {
            const data = await getTrades({ status: 'OPEN', is_pending: 0 });
            const list = Array.isArray(data) ? data : data?.data || [];
            // Map backend data to UI fields if necessary
            setTrades(list.filter(t => !t.is_pending && t.is_pending !== 1).map(t => ({
                ...t,
                scrip: t.symbol,
                buyRate: t.type === 'BUY' ? parseFloat(t.entry_price || 0).toFixed(2) : (t.exit_price ? parseFloat(t.exit_price).toFixed(2) : '0.00'),
                sellRate: t.type === 'SELL' ? parseFloat(t.entry_price || 0).toFixed(2) : (t.exit_price ? parseFloat(t.exit_price).toFixed(2) : '0.00'),
                lots: t.qty, 
                buyTurnover: t.type === 'BUY' ? (t.entry_price * t.qty).toFixed(2) : '0.00',
                sellTurnover: t.type === 'SELL' ? (t.entry_price * t.qty).toFixed(2) : '0.00',
                user: t.username || 'User',
                margin: parseFloat(t.margin_used || 0).toFixed(2)
            })));
        } catch (err) {
            console.error('Failed to fetch trades', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Dynamic P&L based on Live Prices
    // PRIORITY: Use backend-calculated trade.pnl when live CMP is available from backend.
    // The backend correctly uses CommodityLotService (correct lot_size, USD/INR conversion).
    // Frontend re-calculates only when live price is available to update CMP display.
    const calculatePL = (trade) => {
        const allScrips = [...(watchlistRows || []), ...(cryptoData || []), ...(forexData || []), ...(commodityData || [])];
        const tradeSymUpper = (trade.symbol || '').toUpperCase();
        const scrip = allScrips.find(s => {
            const rs = (s.symbol || '').toUpperCase();
            const ts = rs.split(':').pop();
            return rs === tradeSymUpper || ts === tradeSymUpper;
        });

        // Use last_settlement_price / settlement_price as reference price if trade is carried forward / HOLD
        const isCarriedForward = trade.status === 'HOLD' || trade.is_carried_forward === 1;
        const refPrice = isCarriedForward && (trade.last_settlement_price || trade.settlement_price)
            ? parseFloat(trade.last_settlement_price || trade.settlement_price)
            : parseFloat(trade.entry_price || 0);

        const liveLtp = getScripPrice(scrip);
        const bid = getScripBid(scrip) || liveLtp;
        const ask = getScripAsk(scrip) || liveLtp;
        const exitPrice = trade.type === 'BUY' ? bid : ask;
        const cmp = exitPrice > 0 ? exitPrice : (getScripPrice(scrip) || refPrice);

        let pl = 0;

        // If live market tick or CMP is available, compute live P&L dynamically on every WebSocket tick
        if (scrip && (getScripPrice(scrip) > 0 || exitPrice > 0)) {
            if (trade.is_commodity) {
                const lotSize = parseFloat(trade.lot_size || 1);
                const usdInr = parseFloat(trade.usdinr_value || 95.1);
                const qtyLots = parseFloat(trade.qty || 0);
                const priceToUse = exitPrice > 0 ? exitPrice : cmp;

                const usdInrScrip = forexData?.find(s => {
                    const sym = (s.symbol || '').toUpperCase();
                    return sym === 'FOREX:USD/INR' || sym === 'FOREX:USDINR' || sym.endsWith('USD/INR') || sym.endsWith('USDINR');
                });
                const liveBid = usdInrScrip ? parseFloat(usdInrScrip.bid) || null : null;
                const liveAsk = usdInrScrip ? parseFloat(usdInrScrip.ask) || null : null;
                const mType = (trade.market_type || '').toUpperCase();

                let calcRes;
                if (mType === 'CRYPTO') {
                    calcRes = calculateCryptoPnL({ symbol: trade.symbol, type: trade.type, entryPrice: refPrice, exitPrice: priceToUse, qty: qtyLots, lotSize, fallbackUsdInr: usdInr, liveBid, liveAsk });
                } else if (mType === 'FOREX') {
                    calcRes = calculateForexPnL({ symbol: trade.symbol, type: trade.type, entryPrice: refPrice, exitPrice: priceToUse, qty: qtyLots, lotSize, fallbackUsdInr: usdInr, liveBid, liveAsk });
                } else {
                    calcRes = calculateComexPnL({ symbol: trade.symbol, type: trade.type, entryPrice: refPrice, exitPrice: priceToUse, qty: qtyLots, lotSize, fallbackUsdInr: usdInr, liveBid, liveAsk });
                }

                pl = calcRes.pnlInr;
            } else {
                const isMcxTrade = trade.market_type === 'MCX' || (trade.symbol || '').toUpperCase().startsWith('MCX:');
                if (isMcxTrade) {
                    pl = calculateMcxPnL({
                        type: trade.type,
                        entryPrice: refPrice,
                        exitPrice: cmp,
                        qty: trade.qty,
                        qtyInput: trade.qty_input,
                        lotSize: trade.lot_size || trade.lot_size_at_entry || 1
                    });
                } else {
                    pl = calculateEquityPnL({
                        type: trade.type,
                        entryPrice: refPrice,
                        exitPrice: cmp,
                        qty: trade.qty,
                        qtyInput: trade.qty_input,
                        actualQty: trade.actual_qty,
                        lotSize: trade.lot_size || trade.lot_size_at_entry || 1,
                        tradeMode: trade.trade_mode,
                        equityUnitsMode: trade.equity_units_mode
                    });
                }
            }
        } else {
            // Fallback: use backend calculated P&L if live tick is not available
            pl = parseFloat(trade.pnl || trade.live_pnl || 0);
        }
        return { cmp, pl: pl.toFixed(2), scripData: scrip };
    };

    const handleTradeClick = (trade, e) => {
        // Prevent clicking if we hit the 'X' button or similar, but for now just click row
        setSelectedTrade(trade);
        setView('detail');
    };

    const handleDeleteInit = () => {
        setView('delete_confirm');
    };

    // Mobile Card Component for Trades
    const MobileTradeCard = ({ trade, onClick }) => {
        const { cmp, pl, scripData } = calculatePL(trade);
        const displayName = scripData ? displaySymbol(scripData) : displaySymbol(trade.scrip);
        return (
            <div 
                onClick={() => onClick(trade)}
                className="bg-[#151c2c] p-4 rounded-lg border border-[#2d3748] shadow-md mb-3 active:scale-[0.98] transition-transform"
            >
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className="text-xs text-slate-400 font-mono">#{trade.id}</span>
                        <h3 className="text-white font-bold text-sm uppercase mt-0.5">{displayName}</h3>
                    </div>
                    <div className={`text-sm font-bold ${parseFloat(pl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pl}
                    </div>
                </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex flex-col">
                    <span className="text-slate-500">Buy Rate</span>
                    <span className="text-white font-medium">{trade.buyRate}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-slate-500">Sell Rate</span>
                    <span className="text-white font-medium">{trade.sellRate}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-slate-500">Lots</span>
                    <span className="text-white font-medium">{trade.lots}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[#01B4EA]">CMP</span>
                    <span className="text-white font-bold">{parseFloat(cmp || 0).toFixed(2)}</span>
                </div>
            </div>

            <div className="flex justify-between items-center border-t border-[#2d3748] pt-2">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                        {trade.user.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-300">{trade.user}</span>
                </div>
                <MoreHorizontal className="w-5 h-5 text-slate-500" />
            </div>
        </div>
    );
    };
    const ListView = () => (
        <div className="flex flex-col h-full space-y-4">
             {/* Header */}
             <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-normal text-slate-300 tracking-tight">Active Trades</h2>
                <div className="text-xs text-slate-400">
                    <span className="font-bold text-slate-200">{trades.length}</span> items
                </div>
             </div>

             {/* Desktop Table */}
             <div className="hidden md:flex bg-[#151c2c] rounded border border-[#2d3748] overflow-hidden shadow-xl flex-col flex-1">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="text-slate-200 text-[12px] font-semibold border-b border-[#2d3748] bg-[#151c2c]">
                                <th className="px-6 py-4 w-12 text-center text-slate-400">X</th>
                                <th className="px-6 py-4 cursor-pointer flex items-center gap-1 group whitespace-nowrap">
                                    ID <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-white" />
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap">Scrip</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap">Buy Rate</th>
                                <th className="px-6 py-4 whitespace-nowrap">Sell Rate</th>
                                <th className="px-6 py-4 whitespace-nowrap">Lots / Units</th>
                                <th className="px-6 py-4 whitespace-nowrap">Buy Turnover</th>
                                <th className="px-6 py-4 whitespace-nowrap">Sell Turnover</th>
                                <th className="px-6 py-4 whitespace-nowrap">CMP</th>
                                <th className="px-6 py-4 whitespace-nowrap">Active P/L</th>
                                <th className="px-6 py-4 whitespace-nowrap">Margin Used</th>
                                <th className="px-6 py-4 whitespace-nowrap">Bough</th>
                            </tr>
                        </thead>
                        <tbody className="text-[12px] text-slate-300 font-medium">
                            {trades.map((trade) => (
                                <tr key={trade.id} className="border-b border-[#2d3748] hover:bg-slate-800/20 transition-colors">
                                    <td 
                                        onClick={() => { setSelectedTrade(trade); setView('delete_confirm'); }}
                                        title={`Delete trade ${trade.id}`}
                                        role="button"
                                        className="px-6 py-4 text-center text-slate-400 cursor-pointer hover:text-white font-bold"
                                    >
                                        X
                                    </td>
                                    <td 
                                        onClick={() => handleTradeClick(trade)}
                                        className="px-6 py-4 font-bold text-white cursor-pointer hover:underline"
                                    >
                                        {trade.id}
                                    </td>
                                    <td className="px-6 py-4 uppercase font-bold text-slate-300">
                                        {displaySymbol(trade.scrip)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {(trade.status === 'HOLD' || trade.is_carried_forward === 1) ? (
                                            <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm">
                                                HOLD
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                OPEN
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4">{trade.buyRate}</td>
                                    <td className="px-6 py-4">{trade.sellRate}</td>
                                    <td className="px-6 py-4">{trade.lots}</td>
                                    <td className="px-6 py-4">{trade.buyTurnover}</td>
                                    <td className="px-6 py-4">{trade.sellTurnover}</td>
                                    {(() => {
                                        const { cmp, pl } = calculatePL(trade);
                                        return (
                                            <>
                                                <td className="px-6 py-4">{parseFloat(cmp || 0).toFixed(2)}</td>
                                                <td className={`px-6 py-4 font-bold ${parseFloat(pl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {pl}
                                                </td>
                                            </>
                                        );
                                    })()}
                                    <td className="px-6 py-4">{trade.margin}</td>
                                    <td className="px-6 py-4 text-slate-500 italic">(not set)</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3 pb-20">
                {trades.map((trade) => (
                    <MobileTradeCard 
                        key={trade.id} 
                        trade={trade} 
                        onClick={handleTradeClick}
                    />
                ))}
            </div>
        </div>
    );

    const handleUpdateInit = () => {
        setView('edit');
    };

    const handleSaveUpdate = () => {
        // Here you would typically save the changes
        setView('detail');
    };

    const EditView = () => (
        <div className="flex flex-col h-full bg-[#202940] p-4 md:p-6 space-y-6">
            <div className="flex items-center gap-4 mb-2">
                 <button onClick={() => setView('detail')} className="text-slate-400 text-xs hover:text-white">
                    ← Back
                 </button>
            </div>
            <div className="bg-[#4CAF50] p-3 px-4 rounded-sm shadow-md w-fit mb-4">
                <h2 className="text-white font-medium text-sm tracking-wide uppercase">Update Trades</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 max-w-5xl">
                {/* Scrip */}
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs font-medium mb-1">Scrip</label>
                    <div className="relative">
                        <select className="bg-white text-slate-900 w-full p-2 rounded text-sm outline-none font-bold">
                            <option>{selectedTrade.scrip}</option>
                            <option>Mega</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-[#01B4EA] text-[10px] mt-1">(Mini Works on Silver and Gold only)</p>
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs font-medium mb-1">Username</label>
                    <div className="relative">
                        <select className="bg-white text-slate-900 w-full p-2 rounded text-sm outline-none font-bold">
                            <option value={selectedTrade.userId}>{selectedTrade.user} (Jitu0)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>
                </div>

                {/* Lots / Units */}
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs font-medium mb-1">Lots / Units</label>
                    <input 
                        type="text" 
                        defaultValue={parseFloat(selectedTrade.lots || 0).toFixed(2)} 
                        className="bg-transparent border-b border-slate-600 text-white w-full py-1 focus:outline-none focus:border-[#4CAF50] transition-colors" 
                    />
                </div>

                {/* Buy Rate */}
                <div className="flex flex-col gap-1">
                    <label className="text-[#01B4EA] text-xs font-medium mb-1">Buy Rate</label>
                    <input 
                        type="text" 
                        defaultValue={selectedTrade.buyRate}
                        className="bg-transparent border-b border-slate-600 text-white w-full py-1 focus:outline-none focus:border-[#4CAF50] transition-colors" 
                    />
                </div>

                {/* Sell Rate */}
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs font-medium mb-1">Sell Rate</label>
                    <input 
                        type="text" 
                        defaultValue={parseFloat(selectedTrade.sellRate || 0).toFixed(2)}
                        className="bg-transparent border-b border-slate-600 text-white w-full py-1 focus:outline-none focus:border-[#4CAF50] transition-colors" 
                    />
                </div>

                {/* Transaction Password */}
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs font-medium mb-1">Transaction Password</label>
                    <input 
                        type="password" 
                        className="bg-transparent border-b border-slate-600 text-white w-full py-1 focus:outline-none focus:border-[#4CAF50] transition-colors" 
                    />
                </div>

                <div className="col-span-1 md:col-span-2 mt-4 pb-12">
                     <button 
                        onClick={handleSaveUpdate}
                        className="w-full md:w-auto bg-[#4CAF50] hover:bg-green-600 text-white font-bold py-3 md:py-2 px-8 rounded text-xs uppercase shadow-lg shadow-green-900/20 transition-all"
                    >
                        SAVE
                    </button>
                </div>
            </div>
        </div>
    );

    const DetailView = () => (
        <div className="flex flex-col h-full space-y-6 max-w-4xl pb-12">
             <div className="flex items-center gap-4">
                 <button onClick={() => setView('list')} className="text-slate-400 text-xs hover:text-white">
                    ← Back to List
                 </button>
            </div>

            {/* Header Actions */}
            <div className="flex flex-col md:flex-row gap-4">
                 <div className="flex gap-4">
                    <button 
                        onClick={handleUpdateInit}
                        className="flex-1 md:flex-none bg-[#9C27B0] hover:bg-purple-700 text-white font-bold py-3 md:py-2 px-6 rounded text-xs uppercase shadow-lg"
                    >
                        UPDATE
                    </button>
                    <button 
                        onClick={handleDeleteInit}
                        className="flex-1 md:flex-none bg-[#F44336] hover:bg-red-700 text-white font-bold py-3 md:py-2 px-6 rounded text-xs uppercase shadow-lg"
                    >
                        DELETE
                    </button>
                 </div>
                 <div className="flex gap-4">
                 </div>
            </div>

            {/* Details Table */}
            <div className="bg-[#151c2c] rounded border border-[#2d3748] overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                    <tbody>
                        <tr className="border-b border-[#2d3748] flex flex-col md:table-row">
                            <th className="px-6 py-2 md:py-4 font-semibold text-slate-400 w-full md:w-48 bg-slate-800/30 md:bg-transparent">ID</th>
                            <td className="px-6 py-3 md:py-4 text-white">{selectedTrade.id}</td>
                        </tr>
                        <tr className="border-b border-[#2d3748] flex flex-col md:table-row">
                            <th className="px-6 py-2 md:py-4 font-semibold text-slate-400 bg-slate-800/30 md:bg-transparent">Script</th>
                            <td className="px-6 py-3 md:py-4 text-white uppercase">{selectedTrade.scrip}</td>
                        </tr>
                        <tr className="border-b border-[#2d3748] flex flex-col md:table-row">
                            <th className="px-6 py-2 md:py-4 font-semibold text-slate-400 bg-slate-800/30 md:bg-transparent">Segment</th>
                            <td className="px-6 py-3 md:py-4 text-white">{selectedTrade.segment}</td>
                        </tr>
                        <tr className="border-b border-[#2d3748] flex flex-col md:table-row">
                            <th className="px-6 py-2 md:py-4 font-semibold text-slate-400 bg-slate-800/30 md:bg-transparent">Username</th>
                            <td className="px-6 py-3 md:py-4 text-white">{selectedTrade.user}</td>
                        </tr>
                        <tr className="border-b border-[#2d3748] flex flex-col md:table-row">
                            <th className="px-6 py-2 md:py-4 font-semibold text-slate-400 bg-slate-800/30 md:bg-transparent">Buy Rate</th>
                            <td className="px-6 py-3 md:py-4 text-white">{selectedTrade.buyRate}</td>
                        </tr>
                        <tr className="border-b border-[#2d3748] flex flex-col md:table-row">
                            <th className="px-6 py-2 md:py-4 font-semibold text-slate-400 bg-slate-800/30 md:bg-transparent">Sell Rate</th>
                            <td className="px-6 py-3 md:py-4 text-white">{selectedTrade.sellRate}</td>
                        </tr>
                        <tr className="border-b border-[#2d3748] flex flex-col md:table-row">
                            <th className="px-6 py-2 md:py-4 font-semibold text-slate-400 bg-slate-800/30 md:bg-transparent">Buy IP</th>
                            <td className="px-6 py-3 md:py-4 text-white">{selectedTrade.buyIp}</td>
                        </tr>
                        <tr className="border-b border-[#2d3748] flex flex-col md:table-row">
                            <th className="px-6 py-2 md:py-4 font-semibold text-slate-400 bg-slate-800/30 md:bg-transparent">Sell IP</th>
                            <td className="px-6 py-3 md:py-4 text-white">{selectedTrade.sellIp}</td>
                        </tr>
                        <tr className="border-b border-[#2d3748] flex flex-col md:table-row">
                            <th className="px-6 py-2 md:py-4 font-semibold text-slate-400 bg-slate-800/30 md:bg-transparent">Lots / Units</th>
                            <td className="px-6 py-3 md:py-4 text-white">{selectedTrade.lots}</td>
                        </tr>
                        <tr className="border-b border-[#2d3748] flex flex-col md:table-row">
                            <th className="px-6 py-2 md:py-4 font-semibold text-slate-400 bg-slate-800/30 md:bg-transparent">Profit / Loss</th>
                            <td className="px-6 py-3 md:py-4 text-slate-400 italic">Not booked yet</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    const DeleteConfirmView = () => (
        <div className="flex flex-col h-full space-y-6 max-w-5xl">
             <div className="bg-[#4CAF50] p-3 px-4 rounded-sm shadow-md w-fit">
                <h2 className="text-white font-medium text-sm tracking-wide">Delete Trade</h2>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed border-b border-[#2d3748] pb-6">
                You are about to delete trade of <span className="font-bold text-white">{parseFloat(selectedTrade.lots || 0).toFixed(2)}</span> lots of <span className="font-bold text-white uppercase">{selectedTrade.scrip}</span> of <span className="font-bold text-white">{selectedTrade.user} ({selectedTrade.userId})</span>. 
                Brokerage and Profit/Loss of the Buy and SELL Trade will be refunded to the client and the Trade will be removed. 
                In case it is a partial trade of some parent trade, then no. of lots of parent trade will be reduced by {parseFloat(selectedTrade.lots || 0).toFixed(2)} lots. 
                Enter Transaction Password to continue.
            </p>

            <div className="space-y-6 max-w-md">
                <div className="group">
                    <label className="text-slate-400 text-xs font-medium mb-1 block">Transaction Password</label>
                    <input 
                        type="password" 
                        className="bg-transparent border-b border-slate-600 w-full text-white py-1 focus:outline-none focus:border-[#4CAF50] transition-colors"
                    />
                </div>

                <div className="flex gap-4 pt-2">
                    <button className="bg-[#4CAF50] hover:bg-green-600 text-white font-bold py-2 px-6 rounded text-xs uppercase shadow-lg shadow-green-900/20">
                        DELETE TRADE
                    </button>
                    <button 
                        onClick={() => setView('detail')}
                        className="text-slate-400 hover:text-white text-xs underline py-2"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#202940] p-4 md:p-6">
            {view === 'list' && <ListView />}
            {view === 'detail' && selectedTrade && <DetailView />}
            {view === 'edit' && selectedTrade && <EditView />}
            {view === 'delete_confirm' && selectedTrade && <DeleteConfirmView />}
        </div>
    );
};

export default ActiveTradesPage;
