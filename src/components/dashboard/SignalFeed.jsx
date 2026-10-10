import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Target, ShieldAlert, Zap, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

const SignalCard = ({ signal }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            const expiry = new Date(signal.expiryTime);
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft('EXPIRED');
                setIsExpired(true);
                return;
            }

            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);

            setTimeLeft(`${h}h ${m}m ${s}s`);
        };

        calculateTime();
        const timer = setInterval(calculateTime, 1000);
        return () => clearInterval(timer);
    }, [signal.expiryTime]);

    const statusStyles = {
        ACTIVE: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: Zap },
        'TARGET HIT': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: CheckCircle2 },
        'SL HIT': { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: AlertTriangle },
        EXPIRED: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-500', icon: Clock },
    };

    const status = isExpired ? 'EXPIRED' : signal.status || 'ACTIVE';
    const style = statusStyles[status];
    const Icon = style.icon;

    return (
        <div className={`bg-[#1f283e] border ${style.border} rounded-2xl p-6 shadow-2xl transition-all hover:translate-y-[-4px] relative overflow-hidden group`}>
            {/* Status Badge */}
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg ${style.bg} ${style.text} border-l border-b ${style.border}`}>
                <Icon size={12} className={status === 'ACTIVE' ? 'animate-pulse' : ''} />
                {status}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{signal.segment}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{signal.type}</span>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-green-400 transition-colors">
                        {signal.symbol}
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Entry Price</p>
                        <p className="text-base font-black text-white whitespace-nowrap">₹{signal.entryPrice.toString().replace(/(\d+\.?\d*)/g, (m) => parseFloat(m.replace(',','')).toFixed(2))}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <p className="text-[9px] font-black text-red-500 uppercase mb-1">Stop Loss</p>
                        <p className="text-base font-black text-red-400 whitespace-nowrap">₹{parseFloat(signal.stopLoss.toString().replace(',','')).toFixed(2)}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                        <div className="flex items-center gap-2">
                            <Target size={14} className="text-green-500" />
                            <span className="text-[10px] font-black text-slate-300 uppercase">Target 1</span>
                        </div>
                        <span className="text-sm font-black text-green-400">₹{parseFloat(signal.target1.toString().replace(',','')).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                        <div className="flex items-center gap-2">
                            <Target size={14} className="text-green-500" />
                            <span className="text-[10px] font-black text-slate-300 uppercase">Target 2</span>
                        </div>
                        <span className="text-sm font-black text-green-400">₹{parseFloat(signal.target2.toString().replace(',','')).toFixed(2)}</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-500" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Valid: {timeLeft}</span>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-black text-green-400 hover:text-green-300 uppercase tracking-widest transition-all group/btn">
                        Execute Trade <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const SignalFeed = ({ segment = 'ALL' }) => {
    // Mock Signals Data
    const mockSignals = [
        {
            id: 1,
            symbol: 'RELIANCE',
            segment: 'NIFTY50',
            type: 'BUY',
            entryPrice: '2,940 - 2,945',
            stopLoss: '2,910',
            target1: '2,980',
            target2: '3,020',
            status: 'ACTIVE',
            expiryTime: new Date(Date.now() + 3600000 * 2).toISOString() // 2 hours from now
        },
        {
            id: 2,
            symbol: 'HDFCBANK',
            segment: 'BANKNIFTY_INDEX',
            type: 'SELL',
            entryPrice: '1,420 - 1,422',
            stopLoss: '1,440',
            target1: '1,390',
            target2: '1,360',
            status: 'ACTIVE',
            expiryTime: new Date(Date.now() + 60000 * 45).toISOString() // 45 mins from now
        },
        {
            id: 3,
            symbol: 'GOLD MAR FUT',
            segment: 'MCX',
            type: 'BUY',
            entryPrice: '62,450',
            stopLoss: '62,200',
            target1: '62,800',
            target2: '63,100',
            status: 'TARGET HIT',
            expiryTime: new Date(Date.now() - 3600000).toISOString() // Expired
        },
    ];

    const filteredSignals = segment === 'ALL' || segment === 'ALL_STOCKS'
        ? mockSignals
        : mockSignals.filter(s => s.segment === segment);

    if (filteredSignals.length === 0) {
        return (
            <div className="bg-[#1f283e]/50 rounded-3xl border border-dashed border-white/10 p-20 flex flex-col items-center justify-center text-center">
                <ShieldAlert size={48} className="text-slate-700 mb-4" />
                <h4 className="text-white font-black uppercase tracking-widest">No Active Signals</h4>
                <p className="text-slate-500 text-[10px] uppercase font-bold mt-2">Check back later for high-conviction trades in {segment}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSignals.map(signal => (
                <SignalCard key={signal.id} signal={signal} />
            ))}
        </div>
    );
};

export default SignalFeed;
