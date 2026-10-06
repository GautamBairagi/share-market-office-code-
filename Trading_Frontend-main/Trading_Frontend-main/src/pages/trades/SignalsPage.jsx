import React from 'react';
import { Zap, Clock, Info } from 'lucide-react';
import SignalFeed from '../../components/dashboard/SignalFeed';
import { useAuth } from '../../context/AuthContext';

const SignalsPage = () => {
    const { currentSegment } = useAuth();

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="relative">
                <div className="bg-[#1f283e] rounded-md shadow-2xl relative pt-12 pb-8 px-8">
                    <div
                        className="absolute -top-6 left-4 rounded-md shadow-[0_4px_20px_0_rgba(0,0,0,0.14),0_7px_10px_-5px_rgba(76,175,80,0.4)] px-10 py-5 z-10"
                        style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                    >
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-white" />
                            <h2 className="text-white text-base font-bold uppercase tracking-tight">Active Signals</h2>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
                        <p className="text-slate-400 text-sm max-w-2xl">
                            Real-time trading opportunities for the **{currentSegment}** segment. Follow these calls carefully and manage your risk.
                        </p>
                        <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Feed auto-updates every 30s</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trading Tips */}
            <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6 flex items-start gap-4">
                <Info className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Signal Best Practices</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Always enter within the specified range. If price has already moved past Target 1 before you enter, avoid the trade.
                        Maintain strict Stop Loss as mentioned to protect your capital.
                    </p>
                </div>
            </div>

            {/* Signal Grid */}
            <div className="mb-12">
                <SignalFeed segment={currentSegment} />
            </div>

            {/* Disclaimer */}
            <div className="px-8 py-6 bg-black/20 rounded-2xl border border-white/5 text-center">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                    Signals are for educational purposes only. Trading involves significant risk.
                </p>
            </div>
        </div>
    );
};

export default SignalsPage;
