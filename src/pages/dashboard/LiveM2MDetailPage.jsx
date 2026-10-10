import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getLiveM2M, getClientById } from '../../services/api';
import { displaySymbol } from '../../utils/marketUtils';

const LiveM2MDetailPage = ({ selectedClient: initialClient, onBack, onClientClick }) => {
    const { id } = useParams();
    const [selectedClient, setSelectedClient] = useState(initialClient);
    const [subClients, setSubClients] = useState([]);
    const [backendStats, setBackendStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [prevData, setPrevData] = useState({});
    const [isBroker, setIsBroker] = useState(false);
    const [isBrokerList, setIsBrokerList] = useState(false);

    // Recover client data if missing (on refresh or history back)
    useEffect(() => {
        if (id && (!selectedClient || (selectedClient.id !== parseInt(id) && selectedClient.id !== id))) {
            getClientById(id).then(data => {
                if (data.profile) {
                    setSelectedClient({
                        id: data.profile.id,
                        username: data.profile.username,
                        fullName: data.profile.full_name
                    });
                }
            }).catch(err => console.error("Failed to recover client:", err));
        }
    }, [id, selectedClient]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const clientId = id || selectedClient?.id || selectedClient?.userId;
                if (!clientId) return;
                const response = await getLiveM2M(clientId);

                let clients = response?.clients || [];
                const stats = response?.stats || {};
                setIsBroker(!!response?.isBroker);
                setIsBrokerList(!!response?.isBrokerList);

                setSubClients(prev => {
                    // Update state and track changes for animation
                    const newData = clients.map(c => ({
                        ...c,
                        ledger: parseFloat(c.ledger || 0).toFixed(2),
                        m2m: parseFloat(c.m2m || 0).toFixed(2),
                        activePL: parseFloat(c.activePL || 0).toFixed(2),
                        closedPL: parseFloat(c.closedPL || 0).toFixed(2),
                        margin: parseFloat(c.margin || 0).toFixed(2),
                        marginUsed: parseFloat(c.marginUsed || 0).toFixed(2),
                        holding: '0',
                        trades: c.activeTrades || 0,
                        positions: c.positions || []
                    }));
                    return newData;
                });
                setBackendStats(stats);
            } catch (err) {
                console.error('Failed to fetch M2M detail:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 1000); // 🚀 Increased to 1s for real-time feel
        return () => clearInterval(interval);
    }, [id, selectedClient]);

    // Track flashes
    useEffect(() => {
        if (subClients.length > 0) {
            const currentFlashes = { ...prevData };
            subClients.forEach(c => {
                c.positions?.forEach(p => {
                    const key = `${c.id}-${p.symbol}`;
                    if (prevData[key] !== undefined && prevData[key] !== p.pnl) {
                        currentFlashes[key + '-pnl'] = p.pnl > prevData[key] ? 'up' : 'down';
                        setTimeout(() => {
                            setPrevData(prev => {
                                const next = { ...prev };
                                delete next[key + '-pnl'];
                                return next;
                            });
                        }, 500);
                    }
                    if (prevData[key + '-cmp'] !== undefined && prevData[key + '-cmp'] !== p.cmp) {
                        currentFlashes[key + '-cmp-dir'] = p.cmp > prevData[key + '-cmp'] ? 'up' : 'down';
                        setTimeout(() => {
                            setPrevData(prev => {
                                const next = { ...prev };
                                delete next[key + '-cmp-dir'];
                                return next;
                            });
                        }, 500);
                    }
                    currentFlashes[key] = p.pnl;
                    currentFlashes[key + '-cmp'] = p.cmp;
                });
            });
            setPrevData(currentFlashes);
        }
    }, [subClients]);

    const StatCard = ({ title, data }) => (
        <div className="bg-[#1f283e] rounded-md shadow-2xl relative mt-0 sm:mt-6 mb-0 shrink-0 border border-white/5">
            {/* Offset Header */}
            <div
                className="absolute -top-5 sm:-top-6 left-3 sm:left-4 right-3 sm:right-4 rounded-md shadow-lg px-4 sm:px-6 py-3 sm:py-4 z-10"
                style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
            >
                <h3 className="text-white text-[11px] sm:text-xs md:text-base font-bold uppercase tracking-tight truncate">{title}</h3>
            </div>

            {/* Card Body */}
            <div className="pt-10 sm:pt-12 px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col justify-evenly min-h-[160px] sm:min-h-[180px]">
                {data.map((item, index) => (
                    <div key={index}>
                        <div className="flex justify-between items-center py-3 sm:py-4">
                            <span className="text-slate-400 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wide truncate mr-2">{item.label}</span>
                            <h3 className="text-white text-sm sm:text-lg md:text-xl font-bold tracking-tight tabular-nums whitespace-nowrap">
                                {item.value?.toString().split(' ')[0] || "0.00"}{' '}
                                {item.value?.toString().includes('Lakhs') && (
                                    <span className="text-[9px] sm:text-xs font-normal text-slate-400 ml-0.5">Lakhs</span>
                                )}
                            </h3>
                        </div>
                        {index < data.length - 1 && (
                            <hr className="border-white/5" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const totals = subClients.reduce((acc, c) => ({
        ledger: acc.ledger + parseFloat(c.ledger),
        m2m: acc.m2m + parseFloat(c.m2m),
        activePL: acc.activePL + parseFloat(c.activePL),
        closedPL: acc.closedPL + parseFloat(c.closedPL || 0),
        trades: acc.trades + parseInt(c.trades),
        margin: acc.margin + parseFloat(c.margin),
        marginUsed: acc.marginUsed + parseFloat(c.marginUsed || 0),
        holding: acc.holding + parseFloat(c.holding)
    }), { ledger: 0, m2m: 0, activePL: 0, closedPL: 0, trades: 0, margin: 0, marginUsed: 0, holding: 0 });

    const parseFormattedVal = (group, segment) => {
        if (!backendStats || !backendStats[group]) return 0;
        const val = backendStats[group][segment];
        if (val === undefined || val === null) return 0;
        // Strip commas and " Lakhs" to get raw number
        const clean = val.toString().replace(/[^\d.-]/g, '');
        return parseFloat(clean) || 0;
    };

    const getStat = (group, segment) => {
        if (!backendStats || !backendStats[group]) return '0.00';
        const val = backendStats[group][segment];
        if (val === undefined) return '0.00';
        // Backend now returns already-formatted strings
        return val;
    };

    // Positions of the FIRST client in our filtered list (usually just one)
    const positions = subClients[0]?.positions || [];

    const positionTotals = positions.reduce((acc, p) => ({
        marginUsed: acc.marginUsed + parseFloat(p.marginUsed || 0)
    }), { marginUsed: 0 });

    return (
        <div className="flex flex-col bg-[#1a2035] px-3 sm:px-4 md:px-6 py-3 sm:py-4 gap-y-14 md:gap-y-12 pb-10">

            {/* Broker Summary Header Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <div className="bg-[#1f283e] p-3 sm:p-4 md:p-6 rounded-lg border border-white/5 shadow-xl transition-all hover:border-[#4caf50]/30 group">
                    <p className="text-slate-400 text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2 text-right group-hover:text-[#4caf50] transition-colors">Client Ledger</p>
                    <h3 className="text-white text-sm sm:text-lg md:text-2xl font-black text-right tabular-nums">{totals.ledger.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-[#1f283e] p-3 sm:p-4 md:p-6 rounded-lg border border-white/5 shadow-xl transition-all hover:border-[#4caf50]/30 group">
                    <p className="text-slate-400 text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2 text-right group-hover:text-[#4caf50] transition-colors">Active P/L</p>
                    <h3 className={`text-sm sm:text-lg md:text-2xl font-black text-right tabular-nums transition-colors duration-500 ${totals.activePL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {totals.activePL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="bg-[#1f283e] p-3 sm:p-4 md:p-6 rounded-lg border border-white/5 shadow-xl transition-all hover:border-[#4caf50]/30 group">
                    <p className="text-slate-400 text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2 text-right group-hover:text-[#4caf50] transition-colors">Open Positions</p>
                    <h3 className="text-white text-sm sm:text-lg md:text-2xl font-black text-right tabular-nums">{totals.trades}</h3>
                </div>
                <div className="bg-[#1f283e] p-3 sm:p-4 md:p-6 rounded-lg border border-white/5 shadow-xl transition-all hover:border-[#4caf50]/30 group">
                    <p className="text-slate-400 text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2 text-right group-hover:text-[#4caf50] transition-colors">Margin Used</p>
                    <h3 className="text-white text-sm sm:text-lg md:text-2xl font-black text-right tabular-nums">{totals.marginUsed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>

            <div className="relative mt-12 sm:mt-16 md:mt-20">
                <div className="bg-[#1f283e] rounded-md shadow-2xl relative pt-12">
                    {/* Header Ribbon */}
                    <div
                        className="absolute -top-5 sm:-top-6 left-3 sm:left-4 rounded-md shadow-lg px-4 sm:px-10 py-3 sm:py-5 z-10 w-[calc(100%-24px)] sm:w-[calc(100%-32px)] flex items-center justify-between gap-2"
                        style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                    >
                        <h2 className="text-white text-[10px] sm:text-sm md:text-lg font-bold tracking-tight uppercase truncate">
                            {isBroker
                                ? `Live M2M under: ${(selectedClient?.fullName || selectedClient?.username || 'SHRI SHRI NATHJI').toUpperCase().replace('VIKRAM', 'SHRI SHRI NATHJI')}`
                                : `Live Active Positions: ${(selectedClient?.username || selectedClient?.fullName || 'TRADER').toUpperCase()}`
                            }
                        </h2>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1 sm:gap-2 bg-white/10 hover:bg-white/20 text-white px-2 sm:px-4 py-1 sm:py-1.5 rounded-md transition-all text-[9px] sm:text-[10px] border border-white/20 uppercase font-black shrink-0"
                        >
                            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline sm:inline">Back</span> <span className="xs:hidden">Back</span>
                        </button>
                    </div>

                    <div className="px-6 py-4 overflow-x-auto">
                        {isBroker ? (
                            isBrokerList ? (
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead className="border-b border-white/5">
                                        <tr className="text-[#a0aec0] text-[9px] sm:text-[11px] font-black uppercase tracking-widest leading-none">
                                            <th className="px-3 sm:px-4 py-4 sm:py-6">User ID</th>
                                            <th className="px-3 sm:px-4 py-4 sm:py-6">Role</th>
                                            <th className="px-3 sm:px-4 py-4 sm:py-6">Closed Profit/Loss</th>
                                            <th className="px-3 sm:px-4 py-4 sm:py-6">Active Trades</th>
                                            <th className="px-3 sm:px-4 py-4 sm:py-6 text-right">Margin Used</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[13px] font-medium text-slate-300">
                                        {loading ? (
                                            <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500 animate-pulse uppercase font-black text-xs">Fetching Real-time Data...</td></tr>
                                        ) : subClients.length === 0 ? (
                                            <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500 uppercase font-black text-xs">No active brokers.</td></tr>
                                        ) : null}
                                        {subClients.map((client, index) => {
                                            return (
                                                <tr key={index} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                                                        <button
                                                            onClick={() => onClientClick(client)}
                                                            className="inline-block px-4 py-1 rounded-full text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(76,175,80,0.4)] hover:shadow-[0_4px_20px_rgba(76,175,80,0.6)] transition-all cursor-pointer border border-white/10"
                                                            style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                                                        >
                                                            {client.id} : {client.username}
                                                        </button>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${client.role === 'ADMIN'
                                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                            }`}>
                                                            {client.role || 'BROKER'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                                                         <span className={`inline-block px-3 py-1 rounded font-black tabular-nums text-[10px] sm:text-xs md:text-sm border transition-all duration-300 ${parseFloat(client.activePL) >= 0 
                                                             ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                                             : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                             }`}>
                                                             {client.activePL}
                                                         </span>
                                                     </td>
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-white text-[10px] sm:text-xs md:text-sm">{client.trades}</td>
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-white text-[10px] sm:text-xs md:text-sm font-bold">{client.marginUsed}</td>
                                                </tr>
                                            );
                                        })}
                                        {/* Total Row */}
                                        <tr className="bg-black/20 font-black text-white uppercase text-[10px] sm:text-[12px] tracking-widest border-t-2 border-white/10">
                                            <td className="px-3 sm:px-4 py-4 sm:py-6">TOTAL</td>
                                            <td className="px-3 sm:px-4 py-4 sm:py-6"></td>
                                            <td className={`px-3 sm:px-4 py-4 sm:py-6 tabular-nums ${totals.activePL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {totals.activePL > 0 ? '+' : ''}{totals.activePL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 sm:px-4 py-4 sm:py-6 tabular-nums">{totals.trades}</td>
                                            <td className="px-3 sm:px-4 py-4 sm:py-6 tabular-nums text-right">{totals.marginUsed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead className="border-b border-white/5">
                                        <tr className="text-[#a0aec0] text-[9px] sm:text-[11px] font-black uppercase tracking-widest leading-none">
                                            <th className="px-3 sm:px-4 py-4 sm:py-6">User ID</th>
                                            <th className="px-3 sm:px-4 py-4 sm:py-6">Role</th>
                                            <th className="px-3 sm:px-4 py-4 sm:py-6">Ledger Balance</th>
                                            <th className="px-3 sm:px-4 py-4 sm:py-6">M2M</th>
                                            <th className="px-3 sm:px-4 py-4 sm:py-6">Active Profit/Loss</th>
                                            <th className="px-3 sm:px-4 py-4 sm:py-6">Active Trades</th>
                                            <th className="px-3 sm:px-4 py-4 sm:py-6">Margin Used</th>
                                            <th className="px-3 sm:px-4 py-4 sm:py-6 text-right">Holding Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[13px] font-medium text-slate-300">
                                        {loading ? (
                                            <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-500 animate-pulse uppercase font-black text-xs">Fetching Real-time Data...</td></tr>
                                        ) : subClients.length === 0 ? (
                                            <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-500 uppercase font-black text-xs">No active traders.</td></tr>
                                        ) : null}
                                        {subClients.map((client, index) => {
                                            return (
                                                <tr key={index} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                                                        <button
                                                            onClick={() => onClientClick(client)}
                                                            className="inline-block px-4 py-1 rounded-full text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(76,175,80,0.4)] hover:shadow-[0_4px_20px_rgba(76,175,80,0.6)] transition-all cursor-pointer border border-white/10"
                                                            style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                                                        >
                                                            {client.id} : {client.username}
                                                        </button>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${client.role === 'ADMIN'
                                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                            : client.role === 'BROKER'
                                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                            }`}>
                                                            {client.role || 'TRADER'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-white text-[10px] sm:text-xs md:text-sm">{client.ledger}</td>
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-white text-[10px] sm:text-xs md:text-sm">{client.m2m}</td>
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                                                         <span className={`inline-block px-3 py-1 rounded font-black tabular-nums text-[10px] sm:text-xs md:text-sm border transition-all duration-300 ${parseFloat(client.activePL) >= 0 
                                                             ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                                             : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                             }`}>
                                                             {client.activePL}
                                                         </span>
                                                     </td>
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-white text-[10px] sm:text-xs md:text-sm">{client.trades}</td>
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-white text-[10px] sm:text-xs md:text-sm font-bold">{client.marginUsed}</td>
                                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-white text-[10px] sm:text-xs md:text-sm font-bold">{client.margin}</td>
                                                </tr>
                                            );
                                        })}
                                        {/* Total Row */}
                                        <tr className="bg-black/20 font-black text-white uppercase text-[10px] sm:text-[12px] tracking-widest border-t-2 border-white/10">
                                            <td className="px-3 sm:px-4 py-4 sm:py-6">TOTAL</td>
                                            <td className="px-3 sm:px-4 py-4 sm:py-6"></td>
                                            <td className="px-3 sm:px-4 py-4 sm:py-6 tabular-nums">{totals.ledger.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-3 sm:px-4 py-4 sm:py-6 tabular-nums">{totals.m2m.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className={`px-3 sm:px-4 py-4 sm:py-6 tabular-nums ${totals.activePL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {totals.activePL > 0 ? '+' : ''}{totals.activePL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 sm:px-4 py-4 sm:py-6 tabular-nums">{totals.trades}</td>
                                            <td className="px-3 sm:px-4 py-4 sm:py-6 tabular-nums">{totals.marginUsed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-3 sm:px-4 py-4 sm:py-6 tabular-nums text-right">{totals.margin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="border-b border-white/5">
                                    <tr className="text-[#a0aec0] text-[9px] sm:text-[11px] font-black uppercase tracking-widest leading-none">
                                        <th className="px-3 sm:px-4 py-4 sm:py-6">Instrument</th>
                                        <th className="px-3 sm:px-4 py-4 sm:py-6">Net Qty</th>
                                        <th className="px-3 sm:px-4 py-4 sm:py-6">Avg Rate</th>
                                        <th className="px-3 sm:px-4 py-4 sm:py-6">CMP</th>
                                        <th className="px-3 sm:px-4 py-4 sm:py-6">Profit/Loss</th>
                                        <th className="px-3 sm:px-4 py-4 sm:py-6 text-right">Margin Used</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[13px] font-medium text-slate-300">
                                    {loading ? (
                                        <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-500 animate-pulse uppercase font-black text-xs">Fetching Real-time Data...</td></tr>
                                    ) : positions.length === 0 ? (
                                        <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-500 uppercase font-black text-xs">No active positions for this user.</td></tr>
                                    ) : null}
                                    {positions.map((pos, index) => {
                                        const key = `${subClients[0]?.id}-${pos.symbol}`;
                                        const pnlFlash = prevData[key + '-pnl'];
                                        const cmpFlash = prevData[key + '-cmp-dir'];

                                        return (
                                            <tr key={index} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-3 sm:px-4 py-3 sm:py-4 text-[#4caf50] font-black uppercase text-[10px] sm:text-xs md:text-sm">
                                                    {displaySymbol(pos)}
                                                </td>
                                                <td className={`px-3 sm:px-4 py-3 sm:py-4 tabular-nums font-bold text-[10px] sm:text-xs md:text-sm ${pos.netQty >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                                                    {pos.netQty}
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 sm:py-4 tabular-nums text-slate-400 text-[10px] sm:text-xs md:text-sm">{pos.avgPrice}</td>
                                                <td className={`px-3 sm:px-4 py-3 sm:py-4 tabular-nums font-bold transition-colors duration-300 text-[10px] sm:text-xs md:text-sm ${cmpFlash === 'up' ? 'text-green-400' : cmpFlash === 'down' ? 'text-red-400' : 'text-white'}`}>
                                                    {pos.cmp?.toFixed(pos.symbol?.startsWith('CRYPTO:') || pos.symbol?.startsWith('FOREX:') ? 4 : 2)}
                                                </td>
                                                <td className={`px-3 sm:px-4 py-3 sm:py-4 font-black tabular-nums transition-all duration-300 text-[10px] sm:text-xs md:text-sm ${pnlFlash === 'up' ? 'bg-green-500/20' : pnlFlash === 'down' ? 'bg-red-500/20' : ''} ${parseFloat(pos.pnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {parseFloat(pos.pnl) > 0 ? '+' : ''}{pos.pnl}
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 sm:py-4 tabular-nums text-right text-[10px] sm:text-xs md:text-sm">{pos.marginUsed}</td>
                                            </tr>
                                        );
                                    })}
                                    {/* Total Row */}
                                    <tr className="bg-black/20 font-black text-white uppercase text-[10px] sm:text-[12px] tracking-widest border-t-2 border-white/10">
                                        <td className="px-3 sm:px-4 py-4 sm:py-6" colSpan={4}>TOTAL UNREALIZED P/L</td>
                                        <td className={`px-3 sm:px-4 py-4 sm:py-6 tabular-nums ${totals.activePL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {totals.activePL > 0 ? '+' : ''}{totals.activePL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 sm:px-4 py-4 sm:py-6 tabular-nums text-right">{positionTotals.marginUsed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* SEGMENT ROWS - ONLY IF STATS AVAILABLE */}
            {backendStats && (
                <div className="flex flex-col gap-y-14 md:gap-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14 md:gap-8">
                        <StatCard
                            title="Buy Turnover"
                            data={[
                                { label: "Mcx", value: `₹${getStat('buyTurnover', 'mcx')}` },
                                { label: "NSE Futures", value: `₹${getStat('buyTurnover', 'nse')}` },
                                { label: "Options", value: `₹${getStat('buyTurnover', 'options')}` },
                                { label: "COMEX", value: `₹${getStat('buyTurnover', 'comex')}` },
                                { label: "FOREX", value: `₹${getStat('buyTurnover', 'forex')}` },
                                { label: "CRYPTO", value: `₹${getStat('buyTurnover', 'crypto')}` },
                            ]}
                        />
                        <StatCard
                            title="Sell Turnover"
                            data={[
                                { label: "Mcx", value: `₹${getStat('sellTurnover', 'mcx')}` },
                                { label: "NSE Futures", value: `₹${getStat('sellTurnover', 'nse')}` },
                                { label: "Options", value: `₹${getStat('sellTurnover', 'options')}` },
                                { label: "COMEX", value: `₹${getStat('sellTurnover', 'comex')}` },
                                { label: "FOREX", value: `₹${getStat('sellTurnover', 'forex')}` },
                                { label: "CRYPTO", value: `₹${getStat('sellTurnover', 'crypto')}` },
                            ]}
                        />
                        <StatCard
                            title="Total Turnover"
                            data={[
                                { label: "Mcx", value: `₹${getStat('totalTurnover', 'mcx')}` },
                                { label: "NSE Futures", value: `₹${getStat('totalTurnover', 'nse')}` },
                                { label: "Options", value: `₹${getStat('totalTurnover', 'options')}` },
                                { label: "COMEX", value: `₹${getStat('totalTurnover', 'comex')}` },
                                { label: "FOREX", value: `₹${getStat('totalTurnover', 'forex')}` },
                                { label: "CRYPTO", value: `₹${getStat('totalTurnover', 'crypto')}` },
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14 md:gap-8">
                        <StatCard
                            title="Segment P/L"
                            data={[
                                { label: "Mcx", value: `₹${getStat('profitLoss', 'mcx')}` },
                                { label: "NSE Futures", value: `₹${getStat('profitLoss', 'nse')}` },
                                { label: "Options", value: `₹${getStat('profitLoss', 'options')}` },
                                { label: "COMEX", value: `₹${getStat('profitLoss', 'comex')}` },
                                { label: "FOREX", value: `₹${getStat('profitLoss', 'forex')}` },
                                { label: "CRYPTO", value: `₹${getStat('profitLoss', 'crypto')}` },
                            ]}
                        />
                        <StatCard
                            title="Active Flows"
                            data={[
                                { label: "Mcx", value: `${backendStats.activeBuy?.mcx || 0} Buy / ${backendStats.activeSell?.mcx || 0} Sell` },
                                { label: "NSE Futures", value: `${backendStats.activeBuy?.nse || 0} Buy / ${backendStats.activeSell?.nse || 0} Sell` },
                                { label: "Options", value: `${backendStats.activeBuy?.options || 0} Buy / ${backendStats.activeSell?.options || 0} Sell` },
                                { label: "COMEX", value: `${backendStats.activeBuy?.comex || 0} Buy / ${backendStats.activeSell?.comex || 0} Sell` },
                                { label: "FOREX", value: `${backendStats.activeBuy?.forex || 0} Buy / ${backendStats.activeSell?.forex || 0} Sell` },
                                { label: "CRYPTO", value: `${backendStats.activeBuy?.crypto || 0} Buy / ${backendStats.activeSell?.crypto || 0} Sell` },
                            ]}
                        />
                        <StatCard
                            title="Brokerage"
                            data={[
                                { label: "Mcx", value: `₹${getStat('brokerage', 'mcx')}` },
                                { label: "NSE Future", value: `₹${getStat('brokerage', 'nse')}` },
                                { label: "Options", value: `₹${getStat('brokerage', 'options')}` },
                                { label: "COMEX", value: `₹${getStat('brokerage', 'comex')}` },
                                { label: "FOREX", value: `₹${getStat('brokerage', 'forex')}` },
                                { label: "CRYPTO", value: `₹${getStat('brokerage', 'crypto')}` },
                            ]}
                        />
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 0px;
                }
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

export default LiveM2MDetailPage;
