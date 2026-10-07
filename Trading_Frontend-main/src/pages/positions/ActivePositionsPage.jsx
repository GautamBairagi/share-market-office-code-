import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { displaySymbol, getScripPrice, getScripBid, getScripAsk } from '../../utils/marketUtils';
import { calculateEquityPnL, calculateMcxPnL } from '../../utils/equityPnL';
import { calculateUsdPnL, calculateCryptoPnL, calculateForexPnL, calculateComexPnL } from '../../utils/usdPnL';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useMarketData } from '../../context/MarketDataContext';

const ActivePositionsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { watchlistRows, cryptoData, forexData, commodityData, dashboardSections } = useMarketData();

    const [positionsData, setPositionsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEquity, setShowEquity] = useState(false);
    
    // Detail View State
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [symbolDetails, setSymbolDetails] = useState([]);

    const fetchPositions = async () => {
        try {
            const { getActivePositions } = await import('../../services/api');
            const data = await getActivePositions();
            setPositionsData(data);
        } catch (err) {
            console.error('Fetch positions error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const symbolParam = queryParams.get('symbol');
        if (symbolParam) {
            setSelectedSymbol(symbolParam);
            fetchSymbolDetails(symbolParam);
        } else {
            setSelectedSymbol(null);
            setSymbolDetails([]);
        }
    }, [location.search]);

    const fetchSymbolDetails = async (symbol) => {
        setDetailLoading(true);
        try {
            const { getTrades } = await import('../../services/api');
            const trades = await getTrades({ scrip: symbol });
            
            const groups = {};
            trades.forEach(t => {
                // Exact symbol match check and active status check
                if (t.symbol.toUpperCase() !== symbol.toUpperCase()) return;
                if (t.status !== 'OPEN' && t.status !== 'HOLD') return;
                if (t.is_pending) return;
                
                const isHold = t.status === 'HOLD' || t.is_carried_forward === 1;
                const status = isHold ? 'HOLD' : 'OPEN';
                const uid = t.user_id;
                const key = `${uid}_${status}`;

                if (!groups[key]) {
                    groups[key] = {
                        key,
                        userId: uid,
                        username: t.username || 'N/A',
                        fullName: t.full_name || 'N/A',
                        status: status,
                        lotSize: parseFloat(t.lot_size || 1),
                        activeBuyLots: 0,
                        activeSellLots: 0,
                        activeBuy: 0,
                        activeSell: 0,
                        totalValue: 0,
                        totalQtyForAvg: 0
                    };
                }
                const lotsQty = parseFloat(t.qty_input != null ? t.qty_input : t.qty || 0);
                const actualQty = parseFloat(t.actual_qty != null ? t.actual_qty : t.qty || 0);
                const entryPrice = parseFloat(t.entry_price || 0);

                if (t.type === 'BUY') {
                    groups[key].activeBuyLots += lotsQty;
                    groups[key].activeBuy += actualQty;
                } else if (t.type === 'SELL') {
                    groups[key].activeSellLots += lotsQty;
                    groups[key].activeSell += actualQty;
                }
                groups[key].totalValue += (entryPrice * actualQty);
                groups[key].totalQtyForAvg += actualQty;
            });

            const rows = Object.values(groups).map(g => ({
                ...g,
                avgPrice: g.totalQtyForAvg > 0 ? (g.totalValue / g.totalQtyForAvg) : 0,
                overallActiveLots: g.activeBuyLots - g.activeSellLots,
                overallActive: g.activeBuy - g.activeSell
            }));
            
            setSymbolDetails(rows);
        } catch (err) {
            console.error('Fetch symbol details error:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleRowClick = (symbol) => {
        navigate(`?symbol=${encodeURIComponent(symbol)}`);
    };

    const handleBackClick = () => {
        navigate('/active-positions');
    };

    // Filter positions based on selected toggle
    const filteredPositions = positionsData.filter(pos => {
        const isEquity = pos.market_type === 'EQUITY';
        return showEquity ? isEquity : !isEquity;
    });

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

    // Calculate live M2M based on real-time prices
    const calculateM2M = (pos) => {
        const allScrips = [
            ...(watchlistRows || []),
            ...(cryptoData || []),
            ...(forexData || []),
            ...(commodityData || []),
            ...Object.values(dashboardSections?.nse || {}),
            ...Object.values(dashboardSections?.mcx || {}),
            ...Object.values(dashboardSections?.nfo || {})
        ];
        const posSymUpper = (pos.symbol || '').toUpperCase();
        const scrip = allScrips.find(s => {
            const rs = (s.symbol || '').toUpperCase();
            const ts = rs.split(':').pop();
            return rs === posSymUpper || ts === posSymUpper;
        });

        const cmpPrice = getScripPrice(scrip) || parseFloat(pos.avg_price || 0);
        const bid = getScripBid(scrip) || cmpPrice;
        const ask = getScripAsk(scrip) || cmpPrice;
        const exitPrice = pos.type === 'BUY' ? bid : ask;

        const avgPrice = parseFloat(pos.avg_price || 0);
        const totalQty = parseFloat(pos.total_qty || 0);

        let m2m = 0;
        if (pos.is_commodity) {
            const lotSize = parseFloat(pos.lot_size || 1);
            const usdInr = parseFloat(pos.usdinr_value || 95.1);
            const qtyLots = pos.total_lots != null ? parseFloat(pos.total_lots) : (totalQty / lotSize);

            const usdInrScrip = forexData?.find(s => {
                const sym = (s.symbol || '').toUpperCase();
                return sym === 'FOREX:USD/INR' || sym === 'FOREX:USDINR' || sym.endsWith('USD/INR') || sym.endsWith('USDINR');
            });
            const liveBid = usdInrScrip ? parseFloat(usdInrScrip.bid) || null : null;
            const liveAsk = usdInrScrip ? parseFloat(usdInrScrip.ask) || null : null;
            const mType = (pos.market_type || '').toUpperCase();

            let calcRes;
            if (mType === 'CRYPTO') {
                calcRes = calculateCryptoPnL({ symbol: pos.symbol, type: pos.type, entryPrice: avgPrice, exitPrice: exitPrice, qty: qtyLots, lotSize, fallbackUsdInr: usdInr, liveBid, liveAsk });
            } else if (mType === 'FOREX') {
                calcRes = calculateForexPnL({ symbol: pos.symbol, type: pos.type, entryPrice: avgPrice, exitPrice: exitPrice, qty: qtyLots, lotSize, fallbackUsdInr: usdInr, liveBid, liveAsk });
            } else {
                calcRes = calculateComexPnL({ symbol: pos.symbol, type: pos.type, entryPrice: avgPrice, exitPrice: exitPrice, qty: qtyLots, lotSize, fallbackUsdInr: usdInr, liveBid, liveAsk });
            }

            m2m = calcRes.pnlInr;
        } else {
            const isMcxPos = pos.market_type === 'MCX' || (pos.symbol || '').toUpperCase().startsWith('MCX:');
            if (isMcxPos) {
                const lotsCount = parseFloat(pos.total_lots != null ? pos.total_lots : pos.total_qty || 0);
                m2m = calculateMcxPnL({
                    type: pos.type,
                    entryPrice: avgPrice,
                    exitPrice: exitPrice,
                    qty: lotsCount,
                    qtyInput: pos.total_lots,
                    lotSize: pos.lot_size || 1
                });
            } else {
                const qtyForPnl = (pos.equity_units_mode === 1 || pos.trade_mode === 'UNITS')
                    ? parseFloat(pos.total_qty || 0)
                    : parseFloat(pos.total_lots != null ? pos.total_lots : pos.total_qty || 0);

                m2m = calculateEquityPnL({
                    type: pos.type,
                    entryPrice: avgPrice,
                    exitPrice: exitPrice,
                    qty: qtyForPnl,
                    lotSize: pos.lot_size || 1,
                    tradeMode: pos.trade_mode,
                    equityUnitsMode: pos.equity_units_mode
                });
            }
        }

        return { cmp: cmpPrice, m2m };
    };

    const totals = filteredPositions.reduce((acc, pos) => {
        const totalQty = parseFloat(pos.total_qty || 0);
        const lotSize = parseFloat(pos.lot_size || 1);
        const lots = pos.total_lots != null ? parseFloat(pos.total_lots) : (totalQty / lotSize);

        const buyQty = pos.type === 'BUY' ? totalQty : 0;
        const buyLots = pos.type === 'BUY' ? lots : 0;
        const sellQty = pos.type === 'SELL' ? totalQty : 0;
        const sellLots = pos.type === 'SELL' ? lots : 0;
        const netQty = pos.type === 'BUY' ? totalQty : -totalQty;
        const netLots = pos.type === 'BUY' ? lots : -lots;

        const { m2m } = calculateM2M(pos);

        return {
            buyLots: acc.buyLots + buyLots,
            buyQty: acc.buyQty + buyQty,
            sellLots: acc.sellLots + sellLots,
            sellQty: acc.sellQty + sellQty,
            totalLots: acc.totalLots + lots,
            totalQty: acc.totalQty + totalQty,
            netLots: acc.netLots + netLots,
            netQty: acc.netQty + netQty,
            m2m: acc.m2m + m2m
        };
    }, { buyLots: 0, buyQty: 0, sellLots: 0, sellQty: 0, totalLots: 0, totalQty: 0, netLots: 0, netQty: 0, m2m: 0 });

    const detailTotals = symbolDetails.reduce((acc, row) => {
        return {
            buyLots: acc.buyLots + row.activeBuyLots,
            buyQty: acc.buyQty + row.activeBuy,
            sellLots: acc.sellLots + row.activeSellLots,
            sellQty: acc.sellQty + row.activeSell,
            overallLots: acc.overallLots + row.overallActiveLots,
            overallQty: acc.overallQty + row.overallActive
        };
    }, { buyLots: 0, buyQty: 0, sellLots: 0, sellQty: 0, overallLots: 0, overallQty: 0 });

    return (
        <div className="main-content custom-scrollbar" style={{ overflowY: 'auto', height: '100%' }}>
            {/* Page Heading */}
            <div className="page-header-responsive flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-white text-xl md:text-2xl font-bold tracking-tight uppercase">
                        {selectedSymbol ? `${displaySymbol(selectedSymbol)} DETAILS` : 'ACTIVE POSITIONS'}
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                        {selectedSymbol 
                            ? `Detailed open positions breakdown for ${displaySymbol(selectedSymbol)}` 
                            : 'Monitor your current open positions in real-time'}
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
            <div className="card-panel">
                {!selectedSymbol ? (
                    <>
                        <div className="card-panel-header">
                            <button 
                                onClick={() => setShowEquity(!showEquity)}
                                className="btn-primary" 
                                style={{ background: showEquity ? '#2e7d32' : '#ab47bc', minWidth: 'auto' }}
                            >
                                {showEquity ? 'SHOW DERIVATIVE POSITIONS' : 'SHOW EQUITY POSITIONS'}
                            </button>
                        </div>

                        <div className="card-panel-body" style={{ padding: 0 }}>
                            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                                <table className="table-standard custom-table">
                                    <thead>
                                        <tr>
                                            <th>Scrip</th>
                                            <th style={{ textAlign: 'center' }}>Active Buy</th>
                                            <th style={{ textAlign: 'center' }}>Active Sell</th>
                                            <th style={{ textAlign: 'center' }}>Avg buy rate</th>
                                            <th style={{ textAlign: 'center' }}>Avg sell rate</th>
                                            <th style={{ textAlign: 'center' }}>Total</th>
                                            <th style={{ textAlign: 'center' }}>Net</th>
                                            <th style={{ textAlign: 'center' }}>M2m</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="8" className="loading-overlay">Loading positions...</td></tr>
                                        ) : filteredPositions.length > 0 ? (
                                            filteredPositions.map((pos, index) => {
                                                const totalQty = parseFloat(pos.total_qty || 0);
                                                const lotSize = parseFloat(pos.lot_size || 1);
                                                const totalLots = pos.total_lots != null ? parseFloat(pos.total_lots) : (totalQty / lotSize);

                                                const isCryptoForex = pos.symbol?.startsWith('CRYPTO:') || pos.symbol?.startsWith('FOREX:');
                                                const decimals = isCryptoForex ? 4 : 2;

                                                const avgBuyRate = pos.type === 'BUY' ? parseFloat(pos.avg_price || 0).toFixed(decimals) : (0).toFixed(decimals);
                                                const avgSellRate = pos.type === 'SELL' ? parseFloat(pos.avg_price || 0).toFixed(decimals) : (0).toFixed(decimals);
                                                
                                                // Dynamic live M2M calculation
                                                const { m2m } = calculateM2M(pos);
                                                const m2mValue = m2m.toFixed(decimals);

                                                return (
                                                    <tr 
                                                        key={index} 
                                                        onClick={() => handleRowClick(pos.symbol)}
                                                        className="cursor-pointer hover:bg-white/5 transition-all"
                                                    >
                                                        <td className="font-semibold py-3">
                                                            <span className="inline-block bg-[#2e7d32] text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                                                {displaySymbol(pos)}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {pos.type === 'BUY' ? formatLotsQty(totalLots, totalQty) : '0 (0)'}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {pos.type === 'SELL' ? formatLotsQty(totalLots, totalQty) : '0 (0)'}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>{avgBuyRate}</td>
                                                        <td style={{ textAlign: 'center' }}>{avgSellRate}</td>
                                                        <td style={{ textAlign: 'center' }}>{formatLotsOnly(totalLots)}</td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {pos.type === 'BUY' ? formatLotsOnly(totalLots) : formatLotsOnly(-totalLots)}
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontWeight: 700, color: parseFloat(m2mValue) >= 0 ? '#22c55e' : '#ef4444' }}>
                                                            {m2mValue}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>No active positions.</td></tr>
                                        )}
                                        {/* Total Row */}
                                        {filteredPositions.length > 0 && !loading && (
                                            <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 700, fontStyle: 'italic', color: '#f1f5f9' }}>
                                                <td>Total</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {totals.buyLots.toFixed(3).replace(/\.?0+$/, '')} ({totals.buyQty})
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {totals.sellLots.toFixed(3).replace(/\.?0+$/, '')} ({totals.sellQty})
                                                </td>
                                                <td></td>
                                                <td></td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {formatLotsOnly(totals.totalLots)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {formatLotsOnly(totals.netLots)}
                                                </td>
                                                <td style={{ textAlign: 'center', color: totals.m2m >= 0 ? '#22c55e' : '#ef4444' }}>
                                                    {totals.m2m.toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Detail View Container */}
                        <div className="card-panel-header flex items-center justify-between">
                            <h2 className="text-white text-base md:text-lg font-bold">
                                {displaySymbol(selectedSymbol)} Positions Breakdown
                            </h2>
                        </div>

                        <div className="card-panel-body" style={{ padding: 0 }}>
                            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                                <table className="table-standard custom-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th style={{ textAlign: 'center' }}>Status</th>
                                            <th style={{ textAlign: 'center' }}>Active Buy</th>
                                            <th style={{ textAlign: 'center' }}>Active Sell</th>
                                            <th style={{ textAlign: 'center' }}>Avg Rate</th>
                                            <th style={{ textAlign: 'center' }}>Overall Active</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailLoading ? (
                                            <tr>
                                                <td colSpan="6" className="py-12">
                                                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                                        <span>Loading client breakdown...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : symbolDetails.length > 0 ? (
                                            symbolDetails.map((row, index) => (
                                                <tr key={index}>
                                                    <td className="py-3">
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
                                                    <td style={{ textAlign: 'center' }}>
                                                        {row.status === 'HOLD' ? (
                                                            <span className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded tracking-wider uppercase">
                                                                HOLD
                                                            </span>
                                                        ) : (
                                                            <span className="inline-block bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wider uppercase">
                                                                OPEN
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {formatLotsQty(row.activeBuyLots, row.activeBuy)}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {formatLotsQty(row.activeSellLots, row.activeSell)}
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                                                        {parseFloat(row.avgPrice || 0).toFixed(2)}
                                                    </td>
                                                    <td style={{ 
                                                        textAlign: 'center', 
                                                        fontWeight: 700, 
                                                        color: row.overallActive > 0 ? '#22c55e' : row.overallActive < 0 ? '#ef4444' : '#94a3b8' 
                                                    }}>
                                                        {formatLotsQty(row.overallActiveLots, row.overallActive)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>No open positions for this scrip.</td></tr>
                                        )}
                                        {symbolDetails.length > 0 && !detailLoading && (
                                            <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 700, fontStyle: 'italic', color: '#f1f5f9' }}>
                                                <td>Total</td>
                                                <td></td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {detailTotals.buyLots.toFixed(3).replace(/\.?0+$/, '')} ({detailTotals.buyQty})
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {detailTotals.sellLots.toFixed(3).replace(/\.?0+$/, '')} ({detailTotals.sellQty})
                                                </td>
                                                <td></td>
                                                <td style={{ 
                                                    textAlign: 'center', 
                                                    color: detailTotals.overallQty > 0 ? '#22c55e' : detailTotals.overallQty < 0 ? '#ef4444' : '#f1f5f9' 
                                                }}>
                                                    {detailTotals.overallLots.toFixed(3).replace(/\.?0+$/, '')} ({detailTotals.overallQty})
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ActivePositionsPage;
