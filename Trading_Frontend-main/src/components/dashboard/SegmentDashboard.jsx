import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, LayoutGrid, List, Activity, PieChart, ShieldAlert, Search, Clock, Zap, ArrowRight, ArrowLeft, Video, Newspaper } from 'lucide-react';
import { isTradingWindowOpen, getTradingWindowText } from '../../utils/tradingTime';
import PromoBanner from '../common/PromoBanner';
import SignalFeed from './SignalFeed';

const SegmentDashboard = ({ segment = 'NIFTY50', userName }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [showPromo, setShowPromo] = useState(true);
    const isMarketOpen = isTradingWindowOpen(segment);
    const windowText = getTradingWindowText(segment);

    const [scrips, setScrips] = useState([]);

    useEffect(() => {
        const generateData = () => {
            if (segment === 'BANKNIFTY_INDEX') {
                return [
                    { symbol: 'HDFCBANK', name: 'HDFC BANK', last: '1,420.50', chg: '+1.20%', type: 'up', vol: '12.4M' },
                    { symbol: 'ICICIBANK', name: 'ICICI BANK', last: '1,012.30', chg: '-0.45%', type: 'down', vol: '8.2M' },
                    { symbol: 'SBIN', name: 'STATE BANK', last: '745.20', chg: '+0.80%', type: 'up', vol: '15.1M' },
                    { symbol: 'KOTAKBANK', name: 'KOTAK BANK', last: '1,780.00', chg: '+0.10%', type: 'up', vol: '2.4M' },
                    { symbol: 'AXISBANK', name: 'AXIS BANK', last: '1,080.40', chg: '-1.10%', type: 'down', vol: '6.7M' },
                    { symbol: 'FEDERALBNK', name: 'FEDERAL BANK', last: '152.30', chg: '+0.50%', type: 'up', vol: '4.1M' },
                    { symbol: 'INDUSINDBK', name: 'INDUSIND BANK', last: '1,489.00', chg: '-0.20%', type: 'down', vol: '1.9M' },
                ];
            } else if (segment === 'NIFTY50') {
                return [
                    { symbol: 'RELIANCE', name: 'RELIANCE IND', last: '2,940.10', chg: '+2.10%', type: 'up', vol: '5.2M' },
                    { symbol: 'TCS', name: 'TCS LTD', last: '4,120.50', chg: '-0.30%', type: 'down', vol: '1.8M' },
                    { symbol: 'INFY', name: 'INFOSYS LTD', last: '1,680.20', chg: '+0.45%', type: 'up', vol: '3.4M' },
                    { symbol: 'HDFCBANK', name: 'HDFC BANK', last: '1,420.50', chg: '+1.20%', type: 'up', vol: '12M' },
                    { symbol: 'ICICIBANK', name: 'ICICI BANK', last: '1,012.30', chg: '-0.45%', type: 'down', vol: '8M' },
                    { symbol: 'BHARTIARTL', name: 'AIRTEL', last: '1,215.00', chg: '+0.90%', type: 'up', vol: '4.2M' },
                    { symbol: 'ITC', name: 'ITC LTD', last: '410.50', chg: '-1.20%', type: 'down', vol: '22M' },
                    { symbol: 'LT', name: 'L&T LTD', last: '3,450.00', chg: '+0.15%', type: 'up', vol: '1.1M' },
                    { symbol: 'ADANIENT', name: 'ADANI ENT', last: '3,120.00', chg: '+3.40%', type: 'up', vol: '7.8M' },
                    { symbol: 'HINDUNILVR', name: 'HUL LTD', last: '2,380.00', chg: '-0.60%', type: 'down', vol: '2.1M' },
                ];
            } else {
                return []; // NIFTY_INDEX doesn't show stock grid
            }
        };
        setScrips(generateData());
    }, [segment]);

    const filteredScrips = scrips.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">

            {/* ─── Level 1: Visibility Banner (Segment & Time) ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Segment Badge */}
                <div className="bg-[#1f283e] border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 shadow-inner">
                            <Zap className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Active Segment</p>
                            <h4 className="text-lg font-black text-white tracking-widest">{segment}</h4>
                        </div>
                    </div>
                </div>

                {/* Trading Window */}
                <div className="bg-[#1f283e] border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Trading Window</p>
                            <h4 className="text-base font-bold text-slate-200">{windowText || '09:15 AM – 03:15 PM'}</h4>
                        </div>
                    </div>
                </div>

                {/* Live Status */}
                <div className={`rounded-2xl p-5 flex items-center justify-between shadow-2xl transition-all border ${isMarketOpen ? 'bg-green-600/10 border-green-500/30' : 'bg-red-600/10 border-red-500/30'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shadow-inner ${isMarketOpen ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <Activity className={`w-5 h-5 ${isMarketOpen ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Live Market Status</p>
                            <h4 className={`text-lg font-black uppercase tracking-widest ${isMarketOpen ? 'text-green-400' : 'text-red-400'}`}>
                                {isMarketOpen ? '● OPEN' : '● CLOSED'}
                            </h4>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase">Live Clock</p>
                        <p className="text-sm font-black text-white tracking-tighter">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Level 1.2: Promotions & Signals (New Priority) ─── */}
            {showPromo && (
                <PromoBanner
                    title="NIFTY 50 ZERO-HERO EXPIRED"
                    message="Special expiry day signals are now live. High volatility expected. Join our premium WhatsApp group for real-time alerts."
                    onClose={() => setShowPromo(false)}
                />
            )}

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Active Trading Signals</h2>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">High-conviction entries by our analysts</p>
                        </div>
                    </div>
                    <button className="text-green-400 text-[10px] font-black uppercase tracking-widest hover:text-green-300 transition-colors flex items-center gap-2 group">
                        See All History <ArrowRight size={14} className="group-hover/btn:translate-x-1" />
                    </button>
                </div>
                <SignalFeed segment={segment} />
            </div>

            {/* ─── Level 1.5: Closed Alert Banner ─── */}
            {!isMarketOpen && (
                <div className="bg-red-600/10 border border-red-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse shadow-lg shadow-red-900/10">
                    <div className="flex items-center gap-4">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                        <div>
                            <h5 className="text-base font-black text-white uppercase tracking-widest">Trading window closed for this segment</h5>
                            <p className="text-[11px] text-red-400/80 font-bold uppercase tracking-widest">Market execution is currently restricted. Please check trading hours.</p>
                        </div>
                    </div>
                    <div className="px-6 py-2 bg-red-600/20 border border-red-500/30 rounded-full text-[10px] font-black text-red-400 uppercase tracking-widest">
                        Orders Suspended
                    </div>
                </div>
            )}

            {/* ─── Level 2: Index Performance Card ─── */}
            <div className="bg-[#1f283e] rounded-3xl border border-white/5 p-8 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                    <TrendingUp size={180} />
                </div>
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black bg-white/5 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">Market Index Live</span>
                        </div>
                        <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-1">
                            {segment === 'BANKNIFTY_INDEX' ? 'NIFTY BANK' : segment === 'NIFTY50' ? 'NIFTY 50' : 'NIFTY INDEX'}
                        </h2>
                        <div className="flex items-baseline gap-4">
                            <h3 className="text-6xl font-black text-white tracking-tighter">
                                {segment === 'BANKNIFTY_INDEX' ? '47,890.15' : '22,456.20'}
                            </h3>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-black ${segment === 'BANKNIFTY_INDEX' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {segment === 'BANKNIFTY_INDEX' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                {segment === 'BANKNIFTY_INDEX' ? '+112.45 (0.34%)' : '-102.30 (0.45%)'}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Day High</p>
                            <p className="text-sm font-black text-white">{segment === 'BANKNIFTY_INDEX' ? '48,102.00' : '22,580.40'}</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Day Low</p>
                            <p className="text-sm font-black text-white">{segment === 'BANKNIFTY_INDEX' ? '47,650.10' : '22,390.00'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Level 3: Segment Specific Views ─── */}

            {segment === 'NIFTY_INDEX' ? (
                /* NIFTY_INDEX specific Chart/Summary View */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#1f283e] rounded-3xl border border-white/5 p-8 h-[300px] flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-0" />
                        <Activity size={48} className="text-green-500/20 mb-4 animate-pulse z-10" />
                        <h4 className="text-sm font-black text-white uppercase tracking-widest z-10">Real-time Intraday Index Chart</h4>
                        <p className="text-xs text-slate-500 mt-2 font-bold uppercase z-10">Live Tick Data Visualization Placeholder</p>
                    </div>
                    <div className="bg-[#1f283e] rounded-3xl border border-white/5 p-8 flex flex-col gap-6 shadow-2xl">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">Market Summary</h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Advances / Declines', val: '32 / 18', color: 'text-green-400' },
                                { label: 'Top Contributor', val: 'RELIANCE', color: 'text-white' },
                                { label: 'Market Outlook', val: 'NEUTRAL', color: 'text-blue-400' },
                                { label: 'PCR Ratio', val: '1.05', color: 'text-slate-200' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center bg-black/10 p-4 rounded-xl">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">{item.label}</span>
                                    <span className={`text-xs font-black ${item.color}`}>{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* NIFTY50 & BANKNIFTY_INDEX - Stock List Grid */
                <div className="bg-[#1f283e] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                    <div className="px-10 py-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-green-500/10 rounded-xl">
                                <List className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] leading-none mb-1">
                                    {segment === 'BANKNIFTY_INDEX' ? 'Banking Stocks' : 'Nifty 50 Constituent List'}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Showing live prices & volume tracking</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-green-500" />
                            <input
                                type="text"
                                placeholder="Quick search symbol..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-black/40 border border-white/5 rounded-2xl pl-11 pr-6 py-3 text-xs text-white focus:outline-none focus:border-green-500/30 transition-all w-full md:w-64 shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-black/10">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">Symbol / Name</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">LTP (Last Price)</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">CHG %</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">Volume</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Executive Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/2">
                                {filteredScrips.map((s, idx) => (
                                    <tr key={idx} className="hover:bg-green-500/[0.02] transition-colors group">
                                        <td className="px-10 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white group-hover:text-green-400 transition-colors uppercase tracking-widest leading-none mb-1">{s.symbol}</span>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-5">
                                            <span className="text-base font-black text-white tracking-tighter">₹{s.last}</span>
                                        </td>
                                        <td className="px-10 py-5">
                                            <span className={`text-xs font-black inline-flex items-center px-2 py-1 rounded-md ${s.type === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {s.type === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                                                {s.chg}
                                            </span>
                                        </td>
                                        <td className="px-10 py-5">
                                            <span className="text-[11px] font-black text-slate-400">{s.vol}</span>
                                        </td>
                                        <td className="px-10 py-5">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    disabled={!isMarketOpen}
                                                    className={`flex-1 max-w-[80px] py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isMarketOpen ? 'bg-green-600 hover:bg-green-500 text-white shadow-xl shadow-green-900/40 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'}`}
                                                >
                                                    Buy
                                                </button>
                                                <button
                                                    disabled={!isMarketOpen}
                                                    className={`flex-1 max-w-[80px] py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isMarketOpen ? 'bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-900/40 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'}`}
                                                >
                                                    Sell
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {segment === 'NIFTY50' && (
                        <div className="px-10 py-5 bg-black/10 border-t border-white/5 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Displaying Top 10 Constituent Heavyweights</p>
                            <button className="text-[10px] font-black text-green-400 hover:text-green-300 uppercase tracking-[0.2em] transition-all flex items-center gap-2 group">
                                View Full Nifty 50 Matrix <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Level 4: Special Footer Features (Option Chain / Charts) ─── */}
            {segment === 'BANKNIFTY_INDEX' && (
                <div className="bg-gradient-to-r from-blue-600/10 to-transparent border border-blue-500/20 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-dashed shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-500/20 rounded-2xl">
                            <PieChart size={32} className="text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-white uppercase tracking-[0.2em] leading-none mb-2">Live Bank Nifty Option Chain</h4>
                            <p className="text-xs text-slate-500 uppercase tracking-tight font-black">Real-time Greeks, OI Analysis & Smart Spreads</p>
                        </div>
                    </div>
                    <button className="px-10 py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-900/30">
                        Launch Option Analytics
                    </button>
                </div>
            )}

        </div>
    );
};

export default SegmentDashboard;
