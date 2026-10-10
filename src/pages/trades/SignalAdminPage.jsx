import React, { useState } from 'react';
import { Send, Clock, Target, ShieldAlert, Zap, Search, Plus, Trash2, SquarePen, CheckCircle2, XCircle } from 'lucide-react';
import { displaySymbol } from '../../utils/marketUtils';

const SignalAdminPage = () => {
    const [signals, setSignals] = useState([
        { id: 1, symbol: 'RELIANCE', segment: 'NIFTY50', type: 'BUY', entry: '2940-2945', sl: '2910', t1: '2980', t2: '3020', status: 'Active' },
        { id: 2, symbol: 'HDFCBANK', segment: 'BANKNIFTY_INDEX', type: 'SELL', entry: '1420-1422', sl: '1440', t1: '1390', t2: '1360', status: 'Active' },
    ]);

    const [isAdding, setIsAdding] = useState(false);
    const [newSignal, setNewSignal] = useState({
        symbol: '',
        segment: 'NIFTY50',
        type: 'BUY',
        entry: '',
        sl: '',
        t1: '',
        t2: '',
        validity: '2', // hours
    });

    const handleAddSignal = (e) => {
        e.preventDefault();
        const signal = {
            id: Date.now(),
            ...newSignal,
            status: 'Active'
        };
        setSignals([signal, ...signals]);
        setIsAdding(false);
        // Reset form
        setNewSignal({ symbol: '', segment: 'NIFTY50', type: 'BUY', entry: '', sl: '', t1: '', t2: '', validity: '2' });
    };

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
                            <h2 className="text-white text-base font-bold uppercase tracking-tight">Signal Management</h2>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
                        <p className="text-slate-400 text-sm max-w-2xl">
                            Broadcast high-conviction trading signals to specific segments. Manage active calls and monitor performance in real-time.
                        </p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="btn-success-gradient btn-md flex items-center justify-center gap-2 group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            Post New Signal
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Active Signals', val: signals.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Targets Hit', val: '12', color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'SL Triggered', val: '2', color: 'text-red-400', bg: 'bg-red-500/10' },
                    { label: 'Win Rate', val: '86%', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#1f283e] p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center shadow-lg">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</span>
                        <div className={`text-2xl font-black ${stat.color}`}>{stat.val}</div>
                    </div>
                ))}
            </div>

            {/* Signal List Table */}
            <div className="bg-[#1f283e] rounded-3xl border border-white/5 shadow-2xl overflow-hidden mb-12">
                <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Active & Recent Signals</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search signals..."
                            className="bg-black/20 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-green-500/50 w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-black/10 border-b border-white/5">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Signal Detail</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry Range</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Stop Loss</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Targets</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {signals.map((s) => (
                                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white group-hover:text-green-400 transition-colors uppercase">{displaySymbol(s.symbol)}</span>
                                            <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">{s.segment} • {s.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-sm font-black text-white uppercase tracking-tighter">
                                        ₹{s.entry.toString().replace(/(\d+\.?\d*)/g, (m) => parseFloat(m).toFixed(2))}
                                    </td>
                                    <td className="px-8 py-4 text-sm font-black text-red-400 uppercase tracking-tighter">
                                        ₹{parseFloat(s.sl || 0).toFixed(2)}
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-green-400 uppercase">T1: ₹{parseFloat(s.t1 || 0).toFixed(2)}</span>
                                            <span className="text-[10px] font-bold text-green-400/70 uppercase">T2: ₹{parseFloat(s.t2 || 0).toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.status === 'Active' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            }`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="action-icon action-icon-view" title="Mark Target Hit">
                                                <CheckCircle2 size={18} />
                                            </button>
                                            <button className="action-icon action-icon-view" title="Mark SL Hit">
                                                <XCircle size={18} />
                                            </button>
                                            <button className="action-icon action-icon-edit" title="Edit">
                                                <SquarePen size={18} />
                                            </button>
                                            <button
                                                onClick={() => setSignals(signals.filter(sig => sig.id !== s.id))}
                                                className="action-icon action-icon-delete"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for adding signal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAdding(false)} />
                    <div className="bg-[#1f283e] w-full max-w-2xl rounded-3xl border border-white/10 relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-3">
                                <Send className="w-5 h-5 text-green-400" />
                                <h3 className="text-white font-black uppercase tracking-widest text-lg">Broadcast New Signal</h3>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSignal} className="p-4 sm:p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Symbol / Script</label>
                                <input
                                    required
                                    placeholder="e.g. RELIANCE"
                                    value={newSignal.symbol}
                                    onChange={e => setNewSignal({ ...newSignal, symbol: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-green-500/50"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Segment</label>
                                <select
                                    value={newSignal.segment}
                                    onChange={e => setNewSignal({ ...newSignal, segment: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-green-500/50"
                                >
                                    <option value="NIFTY50">NIFTY 50</option>
                                    <option value="BANKNIFTY_INDEX">BANK NIFTY</option>
                                    <option value="MCX">MCX</option>
                                    <option value="ALL_STOCKS">EQUITY CASH</option>
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Trade Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewSignal({ ...newSignal, type: 'BUY' })}
                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newSignal.type === 'BUY' ? 'bg-green-600 text-white shadow-lg' : 'bg-black/20 text-slate-500 border border-white/5'}`}
                                    >
                                        BUY / LONG
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewSignal({ ...newSignal, type: 'SELL' })}
                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newSignal.type === 'SELL' ? 'bg-red-600 text-white shadow-lg' : 'bg-black/20 text-slate-500 border border-white/5'}`}
                                    >
                                        SELL / SHORT
                                    </button>
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Entry Range</label>
                                <input
                                    required
                                    placeholder="e.g. 2940 - 2945"
                                    value={newSignal.entry}
                                    onChange={e => setNewSignal({ ...newSignal, entry: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-green-500/50"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-red-500/70 uppercase tracking-widest mb-2 block">Stop Loss</label>
                                <input
                                    required
                                    placeholder="e.g. 2910"
                                    value={newSignal.sl}
                                    onChange={e => setNewSignal({ ...newSignal, sl: e.target.value })}
                                    className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-5 py-3 text-sm text-red-400 focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 block">Signal Validity (Hrs)</label>
                                <input
                                    type="number"
                                    value={newSignal.validity}
                                    onChange={e => setNewSignal({ ...newSignal, validity: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-green-500/50"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-green-500/70 uppercase tracking-widest mb-2 block">Target 1</label>
                                <input
                                    required
                                    placeholder="e.g. 2980"
                                    value={newSignal.t1}
                                    onChange={e => setNewSignal({ ...newSignal, t1: e.target.value })}
                                    className="w-full bg-green-500/5 border border-green-500/20 rounded-xl px-5 py-3 text-sm text-green-400 focus:outline-none focus:border-green-500/50"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-green-500/70 uppercase tracking-widest mb-2 block">Target 2</label>
                                <input
                                    required
                                    placeholder="e.g. 3020"
                                    value={newSignal.t2}
                                    onChange={e => setNewSignal({ ...newSignal, t2: e.target.value })}
                                    className="w-full bg-green-500/5 border border-green-500/20 rounded-xl px-5 py-3 text-sm text-green-400 focus:outline-none focus:border-green-500/50"
                                />
                            </div>

                            <div className="col-span-2 pt-4">
                                <button type="submit" className="w-full btn-success-gradient btn-lg uppercase tracking-[0.2em] font-black text-sm shadow-2xl">
                                    Broadcast Signal to Segment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignalAdminPage;
