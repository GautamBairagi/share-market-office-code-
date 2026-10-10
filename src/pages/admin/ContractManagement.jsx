import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CheckCircle, XCircle, Search, Loader, ArrowLeft, Zap, AlertTriangle, ChevronRight, RefreshCw, ListFilter } from 'lucide-react';
import { List } from 'react-window';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import { displaySymbol } from '../../utils/marketUtils';

const ROW_HEIGHT = 65;

const ContractRow = React.memo(({ index, style, flatData }) => {
    const item = flatData[index];
    if (!item) return null;

    if (item.isHeader) {
        return (
            <div style={style} className="px-2 sm:px-6 py-2">
                <div className="bg-[#1a2240] px-4 sm:px-6 py-2 sm:py-3 border border-white/10 rounded-t-lg border-b-white/5">
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 sm:gap-3">
                        <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-yellow-400 rounded-full"></span>
                        {item.name}
                    </h2>
                </div>
            </div>
        );
    }

    const { contract } = item;
    const isSelected = contract.isSelected;

    return (
        <div style={style} className="px-2 sm:px-6">
            <div
                className={`px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 border-x border-white/10 transition-all ${isSelected
                    ? 'bg-blue-500/10 hover:bg-blue-500/15'
                    : 'bg-[#141c30]/50 hover:bg-white/5'
                    } ${item.isLast ? 'border-b border-white/10 rounded-b-lg' : 'border-b border-white/5'}`}
            >
                {/* Contract Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 truncate">
                        <span className="text-white font-semibold text-sm sm:text-base">
                            {displaySymbol(contract.symbol)}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            contract.segment === 'MCX' ? 'bg-amber-500/20 text-amber-300' :
                            contract.segment === 'NFO' ? 'bg-purple-500/20 text-purple-300' :
                            'bg-blue-500/20 text-blue-300'
                        }`}>
                            {contract.segment}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            contract.instrument_type === 'FUT' ? 'bg-green-500/20 text-green-300' :
                            contract.instrument_type === 'CE' ? 'bg-sky-500/20 text-sky-300' :
                            'bg-pink-500/20 text-pink-300'
                        }`}>
                            {contract.instrument_type}
                        </span>
                    </div>
                    <div className="text-slate-400 text-[11px] sm:text-sm mt-0.5 truncate">
                        {contract.name} • <span className="hidden sm:inline">Expiry: </span>{contract.expiry}
                    </div>
                </div>

                {/* Status Badge */}
                {isSelected ? (
                    <div className="px-2.5 sm:px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] sm:text-xs font-extrabold rounded-full shrink-0 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                    </div>
                ) : (
                    <div className="px-2.5 sm:px-3 py-1 bg-slate-800/60 text-slate-500 border border-white/5 text-[10px] sm:text-xs font-semibold rounded-full shrink-0">
                        Future Expiry
                    </div>
                )}
            </div>
        </div>
    );
});

const ContractManagement = () => {
    const navigate = useNavigate();
    const [allContracts, setAllContracts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [segmentFilter, setSegmentFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [activeView, setActiveView] = useState('recommendations'); // 'recommendations' or 'contracts'
    const [listHeight, setListHeight] = useState(500);
    const listViewportRef = useRef(null);

    // Smart Rollover State
    const [rolloverSuggestions, setRolloverSuggestions] = useState([]);
    const [rolloverLoading, setRolloverLoading] = useState(false);
    const [rolloverTogglingId, setRolloverTogglingId] = useState(null);
    const [rolloverMessage, setRolloverMessage] = useState(null);

    // Fetch Market-Watch-relevant contracts
    const fetchContracts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.getMarketWatchExpiries();
            const data = response.data || [];
            setAllContracts(data);
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message;
            setRolloverMessage({ type: 'error', text: 'Failed to load contracts: ' + errMsg });
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRolloverSuggestions = useCallback(async () => {
        try {
            setRolloverLoading(true);
            const res = await api.getRolloverSuggestions();
            const suggs = res.suggestions || [];
            setRolloverSuggestions(suggs);
            if (suggs.length === 0) {
                setActiveView('contracts');
            }
        } catch (_) {
            setRolloverSuggestions([]);
            setActiveView('contracts');
        } finally {
            setRolloverLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContracts();
        fetchRolloverSuggestions();
    }, [fetchContracts, fetchRolloverSuggestions]);

    const handleEnableNext = async (suggestion) => {
        const id = suggestion.next_contract;
        try {
            setRolloverTogglingId(id);
            await api.enableNextContract(suggestion.next_contract, suggestion.current_contract);
            setRolloverMessage({ type: 'success', text: `✅ ${suggestion.next_display} is now active!` });
            setTimeout(() => setRolloverMessage(null), 3000);
            await fetchContracts();
            await fetchRolloverSuggestions();
        } catch (err) {
            setRolloverMessage({ type: 'error', text: 'Failed: ' + err.message });
        } finally {
            setRolloverTogglingId(null);
        }
    };

    const handleCompleteRollover = async (suggestion) => {
        const id = suggestion.next_contract;
        try {
            setRolloverTogglingId(id);
            await api.completeRollover(suggestion.next_contract, suggestion.current_contract);
            setRolloverMessage({ 
                type: 'success', 
                text: `✅ Rollover successful! ${suggestion.next_display} is active, and expiring ${suggestion.current_display} is disabled.` 
            });
            setTimeout(() => setRolloverMessage(null), 4000);
            await fetchContracts();
            await fetchRolloverSuggestions();
        } catch (err) {
            setRolloverMessage({ type: 'error', text: 'Failed: ' + err.message });
        } finally {
            setRolloverTogglingId(null);
        }
    };

    const handleDisableCurrent = async (suggestion) => {
        const id = suggestion.current_contract;
        try {
            setRolloverTogglingId(id);
            await api.disableCurrentContract(suggestion.current_contract);
            setRolloverMessage({ type: 'success', text: `✅ Expiring contract ${suggestion.current_display} disabled.` });
            setTimeout(() => setRolloverMessage(null), 3000);
            await fetchContracts();
            await fetchRolloverSuggestions();
        } catch (err) {
            setRolloverMessage({ type: 'error', text: 'Failed: ' + err.message });
        } finally {
            setRolloverTogglingId(null);
        }
    };

    // Filtered Suggestions
    const filteredSuggestions = useMemo(() => {
        return rolloverSuggestions.filter(s => {
            const matchSegment = segmentFilter === 'ALL' || s.segment === segmentFilter;
            const matchType = typeFilter === 'ALL' || 
                (typeFilter === 'FUT' && s.instrument_type === 'FUT') ||
                (typeFilter === 'OPT' && (s.instrument_type === 'CE' || s.instrument_type === 'PE')) ||
                s.instrument_type === typeFilter;
            
            const q = searchQuery.toLowerCase().trim();
            const matchSearch = !q ||
                (s.current_display || '').toLowerCase().includes(q) ||
                (s.next_display || '').toLowerCase().includes(q) ||
                (s.current_contract || '').toLowerCase().includes(q);
            
            return matchSegment && matchType && matchSearch;
        });
    }, [rolloverSuggestions, searchQuery, segmentFilter, typeFilter]);

    // Filtered Contracts
    const { flatData, totalActive } = useMemo(() => {
        let activeCount = 0;
        const filtered = allContracts.filter(contract => {
            const matchSegment = segmentFilter === 'ALL' || contract.segment === segmentFilter;
            const matchType = typeFilter === 'ALL' || 
                (typeFilter === 'FUT' && contract.instrument_type === 'FUT') ||
                (typeFilter === 'OPT' && (contract.instrument_type === 'CE' || contract.instrument_type === 'PE')) ||
                contract.instrument_type === typeFilter;
            
            const q = searchQuery.toLowerCase().trim();
            const matchSearch = !q ||
                (contract.name || '').toLowerCase().includes(q) ||
                contract.symbol.toLowerCase().includes(q) ||
                (contract.expiry || '').toLowerCase().includes(q) ||
                (contract.trading_symbol || '').toLowerCase().includes(q);
            
            if (contract.isSelected) activeCount++;
            return matchSegment && matchType && matchSearch;
        });

        const groups = {};
        filtered.forEach(c => {
            if (!groups[c.name]) groups[c.name] = [];
            groups[c.name].push(c);
        });

        const flat = [];
        Object.entries(groups).forEach(([name, contracts]) => {
            flat.push({ isHeader: true, name });
            contracts.forEach((c, idx) => {
                flat.push({
                    isHeader: false,
                    contract: c,
                    isLast: idx === contracts.length - 1
                });
            });
        });

        return { flatData: flat, totalActive: activeCount };
    }, [allContracts, searchQuery, segmentFilter, typeFilter]);

    // Virtualization height calculation
    useEffect(() => {
        const updateHeight = () => {
            const el = listViewportRef.current;
            if (!el) return;
            const topOffset = el.getBoundingClientRect().top || 250;
            const calculatedHeight = window.innerHeight - topOffset - 20;
            setListHeight(Math.max(280, calculatedHeight));
        };
        
        updateHeight();
        window.addEventListener('resize', updateHeight);
        const observer = new MutationObserver(() => requestAnimationFrame(updateHeight));
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener('resize', updateHeight);
            observer.disconnect();
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#0f1729] overflow-hidden">
            {/* Header */}
            <div className="bg-[#1a2240] border-b border-white/5 px-4 sm:px-6 py-3 sm:py-4 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1.5 sm:p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all sm:mr-2"
                        >
                            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                Smart Rollover & Contracts
                            </h1>
                            <p className="text-slate-400 text-[11px] sm:text-sm mt-0.5 sm:mt-1 hidden xs:block">100% Automated Expiry & Contract Management (NFO + MCX)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-xs sm:text-sm font-medium bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            Active Contracts: <span className="font-bold text-green-400">{totalActive}</span> / <span className="text-slate-300">{allContracts.length} available</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* 100% Automatic Mode Banner */}
            <div className="bg-[#141c30] border-b border-white/10 px-4 sm:px-6 py-2.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                        <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-white text-xs font-bold">100% Automatic Expiry Mode Active</p>
                        <p className="text-slate-400 text-[10px]">
                            NFO & MCX active expiries automatically stream. Expiring contracts auto-rollover seamlessly.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg shrink-0">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-green-400 text-[11px] font-extrabold uppercase tracking-wide">Fully Automated</span>
                </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="bg-[#141c30] border-b border-white/5 px-4 sm:px-6 py-3 shrink-0">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search symbol, script, expiry..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-700/30 border border-slate-600 text-white text-xs sm:text-sm pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 rounded placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Segment Filter */}
                        <select
                            value={segmentFilter}
                            onChange={(e) => setSegmentFilter(e.target.value)}
                            className="flex-1 md:flex-none bg-[#1a2240] border border-slate-600 text-white text-[13px] sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded focus:outline-none focus:border-blue-500 font-medium"
                        >
                            <option value="ALL">All Segments (NFO + MCX)</option>
                            <option value="MCX">MCX Only</option>
                            <option value="NFO">NFO Only</option>
                        </select>

                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="flex-1 md:flex-none bg-[#1a2240] border border-slate-600 text-white text-[13px] sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded focus:outline-none focus:border-blue-500 font-medium"
                        >
                            <option value="ALL">All Types (Fut + Opt)</option>
                            <option value="FUT">Futures Only (FUT)</option>
                            <option value="OPT">Options Only (CE/PE)</option>
                            <option value="CE">Calls Only (CE)</option>
                            <option value="PE">Puts Only (PE)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Single View Switcher Sub-Tabs (Clean Single-List Toggle) */}
            <div className="flex border-b border-white/10 bg-[#141c30] shrink-0">
                <button
                    onClick={() => setActiveView('recommendations')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all select-none relative ${
                        activeView === 'recommendations'
                            ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                            : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                    Rollover Recommendations
                    {filteredSuggestions.length > 0 && (
                        <span className="ml-1.5 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full font-extrabold shrink-0">
                            {filteredSuggestions.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveView('contracts')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all select-none ${
                        activeView === 'contracts'
                            ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                            : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <ListFilter className="w-4 h-4 text-blue-400" />
                    All Active Automated Contracts ({flatData.filter(x => !x.isHeader).length})
                </button>
            </div>

            {/* Notification Bar */}
            {rolloverMessage && (
                <div className={`px-6 py-2.5 text-xs sm:text-sm font-bold tracking-wide border-b transition-all shrink-0 ${
                    rolloverMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                    {rolloverMessage.text}
                </div>
            )}

            {/* View 1: Single List for Rollover Recommendations */}
            {activeView === 'recommendations' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0f1729]">
                    {rolloverLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader className="w-7 h-7 animate-spin text-yellow-400" />
                        </div>
                    ) : filteredSuggestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-xl bg-white/[0.01] text-slate-400 text-center p-6">
                            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
                            <p className="font-bold text-base text-white">All Active Contracts Safe</p>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm">No contracts matching your filters are nearing expiry today. All contracts are running smoothly!</p>
                            <button
                                onClick={() => setActiveView('contracts')}
                                className="mt-4 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold rounded-lg transition-all"
                            >
                                View All Active Automated Contracts
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 max-w-5xl mx-auto">
                            {filteredSuggestions.map((s, i) => (
                                <div
                                    key={i}
                                    className={`rounded-xl border px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all bg-[#141c30] shadow-lg ${
                                        s.urgency === 'EXPIRED' ? 'border-red-500/30' :
                                        s.urgency === 'CRITICAL' ? 'border-amber-500/30' :
                                        'border-blue-500/20'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <AlertTriangle className={`w-4 h-4 shrink-0 ${s.urgency === 'EXPIRED' ? 'text-red-400' : s.urgency === 'CRITICAL' ? 'text-amber-400' : 'text-blue-400'}`} />
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${s.urgency === 'EXPIRED' ? 'bg-red-500/20 text-red-300' : s.urgency === 'CRITICAL' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                                {s.urgency === 'EXPIRED' ? 'EXPIRED' : s.urgency === 'CRITICAL' ? 'EXPIRES TOMORROW' : `${s.days_remaining}d left`}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider ${
                                                s.segment === 'MCX' ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'
                                            }`}>
                                                {s.segment}
                                            </span>
                                            <span className="text-xs text-slate-400 font-semibold">{s.instrument_type}</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2.5 flex-wrap">
                                            <span className="text-white font-bold text-base sm:text-lg truncate">{displaySymbol(s.current_display)}</span>
                                            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                                            <span className="text-green-400 font-bold text-base sm:text-lg truncate">{displaySymbol(s.next_display)}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Expiry Date: <span className="text-slate-300 font-medium">{s.current_expiry}</span> &nbsp;➔&nbsp; Next active: <span className="text-slate-300 font-medium">{s.next_expiry}</span>
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-2.5 flex-wrap sm:flex-nowrap border-t border-white/5 lg:border-none pt-3 lg:pt-0">
                                        {s.next_already_active ? (
                                            <>
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full shrink-0 border border-green-500/20">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Next Active
                                                </span>
                                                <button
                                                    onClick={() => handleDisableCurrent(s)}
                                                    disabled={rolloverTogglingId === s.current_contract}
                                                    className="flex items-center gap-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 disabled:opacity-60 text-amber-300 text-xs font-bold px-3 py-2 rounded-lg transition-all"
                                                >
                                                    {rolloverTogglingId === s.current_contract ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 text-amber-400" />}
                                                    Disable Old
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEnableNext(s)}
                                                    disabled={rolloverTogglingId === s.next_contract}
                                                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-green-500/10"
                                                >
                                                    {rolloverTogglingId === s.next_contract ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                                    Enable Next
                                                </button>
                                                <button
                                                    onClick={() => handleCompleteRollover(s)}
                                                    disabled={rolloverTogglingId === s.next_contract}
                                                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-500/10"
                                                >
                                                    {rolloverTogglingId === s.next_contract ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                                    Rollover (Swap)
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* View 2: Single List for Virtualized Automated Active Contracts */}
            {activeView === 'contracts' && (
                <div className="flex-1 overflow-hidden bg-[#0f1729]" ref={listViewportRef}>
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium">Loading automated active contracts...</p>
                            </div>
                        </div>
                    ) : flatData.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500 font-medium">
                            No active contracts found matching your filters
                        </div>
                    ) : (
                        <List
                            rowComponent={ContractRow}
                            rowCount={flatData.length}
                            rowHeight={(i) => flatData[i].isHeader ? 74 : ROW_HEIGHT}
                            rowProps={{ flatData }}
                            defaultHeight={listHeight}
                            overscanCount={10}
                            style={{ width: '100%', height: listHeight }}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default ContractManagement;
