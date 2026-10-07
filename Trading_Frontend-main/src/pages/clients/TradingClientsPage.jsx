import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { RotateCcw, SquarePen, ArrowUp, ArrowDown, Eye, Copy, Trash2, Settings, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBrokerPermissions } from '../../hooks/useBrokerPermissions';
import * as api from '../../services/api';
import Toast from '../../components/common/Toast';
import * as XLSX from 'xlsx';

let tradingClientsCache = null;
let tradingClientsTotalCache = null;

export const clearTradingClientsCache = () => {
    tradingClientsCache = null;
    tradingClientsTotalCache = null;
    try {
        sessionStorage.removeItem('tc_clients_cache');
        sessionStorage.removeItem('tc_clients_total');
        localStorage.removeItem('tc_clients_cache');
        localStorage.removeItem('tc_clients_total');
    } catch (e) { }
};

export const setTradingClientsCache = (data, total = null) => {
    if (data && !Array.isArray(data) && Array.isArray(data.users)) {
        if (total === null || total === undefined) total = data.total;
        data = data.users;
    }
    tradingClientsCache = data;
    if (total !== null && total !== undefined && !isNaN(Number(total))) {
        tradingClientsTotalCache = Number(total);
    }
    try {
        if (data) {
            const dataStr = JSON.stringify(data);
            sessionStorage.setItem('tc_clients_cache', dataStr);
            localStorage.setItem('tc_clients_cache', dataStr);
        }
        if (total !== null && total !== undefined && !isNaN(Number(total))) {
            const totalStr = String(total);
            sessionStorage.setItem('tc_clients_total', totalStr);
            localStorage.setItem('tc_clients_total', totalStr);
        }
    } catch (e) { }
};

const getInitialClients = () => {
    if (tradingClientsCache && Array.isArray(tradingClientsCache) && tradingClientsCache.length > 0) {
        return tradingClientsCache;
    }
    try {
        const stored = sessionStorage.getItem('tc_clients_cache') || localStorage.getItem('tc_clients_cache');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                tradingClientsCache = parsed;
                return parsed;
            }
        }
    } catch (e) { }
    return [];
};

const getInitialTotalClients = () => {
    if (typeof tradingClientsTotalCache === 'number' && tradingClientsTotalCache > 0) {
        return tradingClientsTotalCache;
    }
    try {
        const stored = sessionStorage.getItem('tc_clients_total') || localStorage.getItem('tc_clients_total');
        if (stored) {
            const num = parseInt(stored, 10);
            if (!isNaN(num) && num > 0) {
                tradingClientsTotalCache = num;
                return num;
            }
        }
    } catch (e) { }
    return 0;
};

const TradingClientsPage = ({ onDepositClick, onWithdrawClick, onLogout, onNavigate }) => {
    const { isSuperAdmin, isAdmin, isBroker, user } = useAuth();
    const { permissions } = useBrokerPermissions(user?.userId, user?.role);

    const initialClients = getInitialClients();
    const initialTotal = getInitialTotalClients();
    const [clients, setClients] = useState(initialClients);
    const [totalClients, setTotalClients] = useState(initialTotal);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [loading, setLoading] = useState(() => initialClients.length === 0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [toast, setToast] = useState({ message: '', type: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState(null); // holds client to be deleted

    // Fast Page Cache for 0ms transitions
    const pageCacheRef = useRef({});

    // Sorting state
    const [sortField, setSortField] = useState('full_name');
    const [sortDirection, setSortDirection] = useState('asc');

    const scrollContainerRef = useRef(null);

    const fetchClients = async (pageToFetch = currentPage, showLoading = false) => {
        const cacheKey = `${pageToFetch}_${itemsPerPage}_${searchTerm}_${statusFilter}_${fromDate}_${toDate}`;

        // Fast Instant Cache Read (0ms lag)
        if (pageCacheRef.current[cacheKey]) {
            const cached = pageCacheRef.current[cacheKey];
            setClients(cached.users);
            setTotalClients(cached.total);
            return;
        }

        if (showLoading && clients.length === 0 && (!tradingClientsCache || tradingClientsCache.length === 0)) {
            setLoading(true);
        } else if (pageToFetch !== 1 || searchTerm || statusFilter || fromDate || toDate || clients.length === 0 || totalClients === 0) {
            setIsRefreshing(true);
        }

        try {
            console.log(`[TradingClientsPage] Fetching page ${pageToFetch} (${itemsPerPage}/page) for ${user?.role}`);
            const params = {
                role: 'TRADER',
                page: pageToFetch,
                limit: itemsPerPage,
                paginate: 'true'
            };
            if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
            if (statusFilter === '1') params.status = 'Active';
            if (statusFilter === '0') params.status = 'Inactive';
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;

            const data = await api.getClients(params);
            const list = data?.users || (Array.isArray(data) ? data : []);
            const total = data?.total !== undefined ? data.total : (totalClients || list.length);

            // Save to fast in-memory page cache
            pageCacheRef.current[cacheKey] = { users: list, total };

            // Save to persistent cache when on default initial view
            const isDefaultView = !searchTerm && !statusFilter && !fromDate && !toDate && pageToFetch === 1;
            if (isDefaultView) {
                setTradingClientsCache(list, total);
            }

            setClients(list);
            setTotalClients(total);

            // Silent Background Pre-fetch for NEXT page (Zero lag when clicking Next)
            const maxPages = Math.ceil(total / itemsPerPage);
            if (pageToFetch < maxPages) {
                const nextCacheKey = `${pageToFetch + 1}_${itemsPerPage}_${searchTerm}_${statusFilter}_${fromDate}_${toDate}`;
                if (!pageCacheRef.current[nextCacheKey]) {
                    api.getClients({ ...params, page: pageToFetch + 1 })
                        .then(nextData => {
                            const nextList = nextData?.users || (Array.isArray(nextData) ? nextData : []);
                            const nextTotal = nextData?.total !== undefined ? nextData.total : total;
                            pageCacheRef.current[nextCacheKey] = { users: nextList, total: nextTotal };
                        })
                        .catch(() => { });
                }
            }
        } catch (err) {
            console.error('[TradingClientsPage] ❌ Failed to fetch clients:', err);
            setToast({ message: `Error loading clients: ${err.message}`, type: 'error' });
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchClients(currentPage);
    }, [user?.userId, currentPage, itemsPerPage]);

    // When filters change, reset page to 1 and clear cache
    useEffect(() => {
        pageCacheRef.current = {};
        setCurrentPage(1);
        fetchClients(1, true);
    }, [searchTerm, statusFilter, fromDate, toDate]);

    // Restore scroll position before paint and attach scroll listener
    useLayoutEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const savedScroll = sessionStorage.getItem('tradingClientsScrollPos');
        if (savedScroll) {
            el.scrollTop = parseInt(savedScroll, 10);
        }

        const handleScroll = () => {
            sessionStorage.setItem('tradingClientsScrollPos', el.scrollTop);
        };
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [loading]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedClients = React.useMemo(() => {
        let result = [...clients];
        if (sortField) {
            result.sort((a, b) => {
                let valA = a[sortField] ?? '';
                let valB = b[sortField] ?? '';

                if (['ledger_balance', 'gross_pl', 'brokerage', 'swap_charges', 'net_pl', 'active_trades_count', 'id'].includes(sortField)) {
                    valA = parseFloat(valA) || 0;
                    valB = parseFloat(valB) || 0;
                } else if (typeof valA === 'string') {
                    valA = valA.toLowerCase();
                    valB = String(valB).toLowerCase();
                }

                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [clients, sortField, sortDirection]);

    const totalPages = Math.max(1, Math.ceil((totalClients || clients.length) / itemsPerPage));
    const paginatedClients = sortedClients;

    const toggleStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            await api.updateUserStatus(userId, newStatus);
            setToast({ message: `Status updated to ${newStatus}`, type: 'success' });
            fetchClients();
        } catch (err) {
            console.error('Failed to update status:', err);
            setToast({ message: 'Failed to update status', type: 'error' });
        }
    };

    const handleView = (client) => {
        onNavigate('trading-clients/details', client);
    };

    const handleEdit = (client) => {
        onNavigate('trading-clients/edit', client);
    };

    const handleCopy = (client) => {
        onNavigate('trading-clients/copy', client);
    };

    const handleDeposit = (client) => {
        onNavigate('trading-clients/deposit', client);
    };

    const handleWithdraw = (client) => {
        onNavigate('trading-clients/withdraw', client);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        try {
            await api.deleteUser(deleteConfirm.id);
            setToast({ message: `Client "${deleteConfirm.username}" deleted successfully`, type: 'success' });
            fetchClients();
        } catch (err) {
            setToast({ message: 'Failed to delete client: ' + err.message, type: 'error' });
        } finally {
            setDeleteConfirm(null);
        }
    };

    const exportUsersPlExcel = async () => {
        try {
            setToast({ message: 'Generating Excel report...', type: 'info' });

            const params = { role: 'TRADER' };
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;

            const data = await api.getClients(params);
            const clientsList = Array.isArray(data) ? data : [];

            const excelRows = clientsList.map(client => {
                const brokerageVal = parseFloat(client.brokerage || 0);
                const grossPlVal = parseFloat(client.gross_pl || 0);
                const netAmountVal = grossPlVal - brokerageVal;

                return {
                    'User ID': client.id,
                    'Username': client.username || '',
                    'Brokerage': Number(brokerageVal.toFixed(2)),
                    'Profit/Loss': Number(grossPlVal.toFixed(2)),
                    'Net Amount': Number(netAmountVal.toFixed(2))
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(excelRows);
            worksheet['!cols'] = [
                { wch: 14 },
                { wch: 16 },
                { wch: 16 },
                { wch: 16 },
                { wch: 16 }
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
            XLSX.writeFile(workbook, 'users.xlsx');
            setToast({ message: 'Excel file downloaded successfully!', type: 'success' });
        } catch (err) {
            console.error('Export Excel error:', err);
            setToast({ message: 'Failed to generate Excel: ' + err.message, type: 'error' });
        }
    };

    return (
        <>
            <style>{`@keyframes tcPageFadeIn { from { opacity: 0.75; } to { opacity: 1; } }`}</style>
            <div ref={scrollContainerRef} className="relative flex flex-col h-full bg-[#1a2035] shadow-inner space-y-4 md:space-y-8 overflow-y-auto custom-scrollbar" style={{ animation: 'tcPageFadeIn 0.15s ease-out' }}>
                <div className="px-3 sm:px-4 md:px-6 space-y-4 md:space-y-8 pb-6 md:pb-10">
                    {/* Search Container 1 */}
                    <div className="bg-[#1f283e] p-4 sm:p-6 md:p-8 rounded shadow-2xl border border-white/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                            <div className="group">
                                <label className="block text-sm text-slate-400 mb-2 font-medium">Username</label>
                                <input
                                    type="text"
                                    className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-[#5cb85c] transition-colors"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search username..."
                                />
                            </div>
                            <div className="group">
                                <label className="block text-sm text-slate-400 mb-2 font-medium">Account Status</label>
                                <select
                                    className="w-full bg-[#1f283e] border-b border-white/10 text-white py-2 focus:outline-none focus:border-[#5cb85c] appearance-none"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Status</option>
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => fetchClients()}
                                className="text-white px-6 py-2.5 rounded font-bold text-xs tracking-widest transition-all shadow-[0_4px_10px_rgba(76,175,80,0.3)] hover:shadow-[0_4px_20px_rgba(76,175,80,0.5)] active:scale-95 uppercase flex-1 sm:flex-none cursor-pointer"
                                style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                            >
                                SEARCH
                            </button>
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter(''); setFromDate(''); setToDate(''); setCurrentPage(1); fetchClients(); }}
                                className="bg-[#808080] hover:bg-[#707070] text-white px-6 py-2.5 rounded font-bold text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all uppercase flex-1 sm:flex-none cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4" /> RESET
                            </button>
                        </div>
                    </div>

                    {/* Date Select & Export Container 2 */}
                    <div className="bg-[#1f283e] p-4 sm:p-6 md:p-8 rounded shadow-2xl border border-white/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 md:mb-6 max-w-md">
                            <div className="group">
                                <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest">From Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-[#151c2c] border border-white/10 rounded-md py-2.5 px-3 text-white focus:outline-none focus:border-[#4CAF50] transition-all [color-scheme:dark] text-xs font-bold"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>
                            <div className="group">
                                <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest">To Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-[#151c2c] border border-white/10 rounded-md py-2.5 px-3 text-white focus:outline-none focus:border-[#4CAF50] transition-all [color-scheme:dark] text-xs font-bold"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex">
                            <button
                                onClick={exportUsersPlExcel}
                                className="text-white px-6 py-2.5 rounded font-bold text-xs tracking-widest transition-all shadow-[0_4px_10px_rgba(23,162,184,0.3)] hover:shadow-[0_4px_20px_rgba(23,162,184,0.5)] active:scale-95 uppercase w-full sm:w-auto cursor-pointer"
                                style={{ background: 'linear-gradient(60deg, #17a2b8, #138496)' }}
                            >
                                EXPORT USERS P&L HISTORY
                            </button>
                        </div>
                    </div>

                    {/* Create Button - NOT for sub-brokers */}
                    {!user?.isSubBroker && (isAdmin() || (user?.role === 'BROKER' && permissions.createClientsAllowed === 'Yes')) && (
                        <div className="flex justify-start">
                            <button
                                onClick={() => onNavigate('trading-clients/create')}
                                className="w-full sm:w-auto text-white py-3 px-6 sm:px-8 rounded-md font-bold text-[11px] uppercase tracking-widest transition-all shadow-[0_4px_10px_rgba(76,175,80,0.3)] hover:shadow-[0_4px_20px_rgba(76,175,80,0.5)] active:scale-95 text-center cursor-pointer"
                                style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                            >
                                + CREATE TRADING CLIENT
                            </button>
                        </div>
                    )}

                    {/* Table Container */}
                    <div className="bg-[#1f283e] overflow-hidden rounded-lg border border-white/5 shadow-2xl">
                        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-[#1a2035] border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-slate-400 text-xs sm:text-sm font-medium">
                                    Showing <b className="text-white">{clients.length ? (currentPage - 1) * itemsPerPage + 1 : 0}</b> to <b className="text-white">{Math.min(currentPage * itemsPerPage, totalClients > 0 ? totalClients : clients.length)}</b> of <b className="text-white">{totalClients > 0 ? totalClients.toLocaleString() : (loading ? '...' : clients.length.toLocaleString())}</b> items. (Total: {totalClients > 0 ? totalClients.toLocaleString() : (loading ? '...' : clients.length.toLocaleString())})
                                </span>
                                {/* <div className="flex items-center gap-1.5 ml-2">
                                <span className="text-xs text-slate-500 font-medium">Rows:</span>
                                <select 
                                    value={itemsPerPage} 
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                        pageCacheRef.current = {};
                                    }}
                                    className="bg-[#151c2c] border border-white/10 text-white text-xs rounded px-2 py-1 outline-none cursor-pointer"
                                >
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={250}>250</option>
                                    <option value={500}>500</option>
                                </select>
                            </div> */}
                            </div>
                            {isRefreshing && (
                                <span className="text-xs text-green-400 font-medium flex items-center gap-1.5 animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span> Updating...
                                </span>
                            )}
                        </div>

                        <div className="overflow-x-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <table className="w-full text-left border-collapse custom-table" style={{ minWidth: '900px' }}>
                                <thead className="bg-[#1a2035]/50">
                                    <tr className="text-white/90 text-[11px] sm:text-[13px] uppercase tracking-wider">
                                        <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold w-8 sm:w-16 whitespace-nowrap">#</th>
                                        <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold text-center whitespace-nowrap">ACTIONS</th>
                                        <th onClick={() => handleSort('username')} className="px-2 sm:px-4 py-3 sm:py-5 font-bold text-center whitespace-nowrap cursor-pointer select-none hover:text-green-400 transition-colors">
                                            Username {sortField === 'username' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                        </th>
                                        <th onClick={() => handleSort('full_name')} className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap cursor-pointer select-none hover:text-green-400 transition-colors">
                                            Full Name {sortField === 'full_name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                        </th>
                                        <th onClick={() => handleSort('ledger_balance')} className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap cursor-pointer select-none hover:text-green-400 transition-colors">
                                            Ledger Bal. {sortField === 'ledger_balance' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                        </th>
                                        {(isAdmin() || isBroker()) && (
                                            <>
                                                <th onClick={() => handleSort('gross_pl')} className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap cursor-pointer select-none hover:text-green-400 transition-colors">
                                                    Gross P/L {sortField === 'gross_pl' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                                </th>
                                                <th onClick={() => handleSort('brokerage')} className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap cursor-pointer select-none hover:text-green-400 transition-colors">
                                                    Brokerage {sortField === 'brokerage' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                                </th>
                                                <th onClick={() => handleSort('swap_charges')} className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap cursor-pointer select-none hover:text-green-400 transition-colors">
                                                    Swap {sortField === 'swap_charges' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                                </th>
                                                <th onClick={() => handleSort('net_pl')} className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap cursor-pointer select-none hover:text-green-400 transition-colors">
                                                    Net P/L {sortField === 'net_pl' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                                </th>
                                            </>
                                        )}
                                        <th onClick={() => handleSort('is_demo')} className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap cursor-pointer select-none hover:text-green-400 transition-colors">
                                            Demo {sortField === 'is_demo' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                        </th>
                                        <th onClick={() => handleSort('status')} className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap cursor-pointer select-none hover:text-green-400 transition-colors">
                                            Status {sortField === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                        </th>
                                        {isAdmin() && (
                                            <>
                                                <th onClick={() => handleSort('active_trades_count')} className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap cursor-pointer select-none hover:text-green-400 transition-colors">
                                                    Trades {sortField === 'active_trades_count' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                                </th>
                                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">Backup</th>
                                            </>
                                        )}
                                        <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">KYC</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] sm:text-[13px] text-slate-300">
                                    {loading && clients.length === 0 ? (
                                        <tr>
                                            <td colSpan="14" className="px-4 py-12 text-center text-slate-400 font-medium">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-xs text-slate-400">Loading trading clients...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginatedClients.length > 0 ? paginatedClients.map((client, index) => (
                                        <tr key={client.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-2 sm:px-4 py-3 sm:py-6">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td className="px-2 sm:px-4 py-3 sm:py-6">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <button className="text-white hover:text-blue-400 transition-colors cursor-pointer" onClick={() => handleView(client)} title="View">
                                                            <i className="fa-solid fa-eye text-[14px]"></i>
                                                        </button>
                                                        <button className="text-white hover:text-blue-400 transition-colors cursor-pointer" onClick={() => handleEdit(client)} title="Edit">
                                                            <i className="fa-solid fa-pencil text-[14px]"></i>
                                                        </button>
                                                        {isAdmin() && (
                                                            <>
                                                                <button className="text-white hover:text-blue-400 transition-colors cursor-pointer" onClick={() => handleCopy(client)} title="Copy">
                                                                    <i className="fa-solid fa-copy text-[14px]"></i>
                                                                </button>
                                                                <button className="text-white hover:text-red-400 transition-colors cursor-pointer" onClick={() => setDeleteConfirm(client)} title="Delete">
                                                                    <Trash2 className="w-[14px] h-[14px]" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {(isAdmin() || permissions.payinAllowed === 'Yes') && (
                                                            <div onClick={() => handleDeposit(client)} className="w-[18px] h-[18px] bg-[#5cb85c] hover:bg-[#4caf50] rounded-full flex items-center justify-center cursor-pointer transition-all shadow-sm">
                                                                <i className="fa-solid fa-arrow-down text-white text-[10px] font-black"></i>
                                                            </div>
                                                        )}
                                                        {(isAdmin() || permissions.payoutAllowed === 'Yes') && (
                                                            <div onClick={() => handleWithdraw(client)} className="w-[18px] h-[18px] bg-[#f44336] hover:bg-[#d32f2f] rounded-full flex items-center justify-center cursor-pointer transition-all shadow-sm">
                                                                <i className="fa-solid fa-arrow-up text-white text-[10px] font-black"></i>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-white font-medium">{client.username}</td>
                                            <td className="px-4 py-4 whitespace-nowrap font-medium text-white">{client.full_name}</td>
                                            <td className="px-4 py-4 whitespace-nowrap font-mono text-white/80">{parseFloat(client.ledger_balance || 0).toFixed(2)}</td>
                                            {(isAdmin() || isBroker()) && (
                                                <>
                                                    <td className="px-4 py-4 whitespace-nowrap">{parseFloat(client.gross_pl || 0).toFixed(2) || '0.00'}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap">{parseFloat(client.brokerage || 0).toFixed(2) || '0.00'}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap">{parseFloat(client.swap_charges || 0).toFixed(2) || '0.00'}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap font-bold text-white">{parseFloat(client.net_pl || 0).toFixed(2) || '0.00'}</td>
                                                </>
                                            )}
                                            <td className="px-2 sm:px-4 py-3 sm:py-6">{client.is_demo ? 'Yes' : 'No'}</td>
                                            <td className="px-2 sm:px-4 py-3 sm:py-6">
                                                <button
                                                    onClick={() => toggleStatus(client.id, client.status)}
                                                    title={`Click to change to ${client.status === 'Active' ? 'Inactive' : 'Active'}`}
                                                    className={`badge ${client.status === 'Active' ? 'badge-active' : 'badge-inactive'} badge-interactive flex items-center gap-1 cursor-pointer`}
                                                >
                                                    <RotateCcw className="w-3 h-3 opacity-70" />
                                                    {client.status || 'Inactive'}
                                                </button>
                                            </td>
                                            {isAdmin() && (
                                                <>
                                                    <td className="px-2 sm:px-4 py-3 sm:py-6 font-bold text-blue-400">{client.active_trades_count || 0}</td>
                                                    <td className="px-2 sm:px-4 py-3 sm:py-6">
                                                        <button className="text-white hover:text-green-400 p-1 rounded bg-white/5 transition-all cursor-pointer" title="Export Backup (PDF)">
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                            <td className="px-2 sm:px-4 py-3 sm:py-6">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border ${(client.kycStatus || '').toUpperCase() === 'VERIFIED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                                    (client.kycStatus || '').toUpperCase() === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                        'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                                    }`}>
                                                    {(client.kycStatus || '').toUpperCase() === 'VERIFIED' ? 'VERIFIED' :
                                                        (client.kycStatus || '').toUpperCase() === 'REJECTED' ? 'REJECTED' : 'PENDING'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="14" className="px-4 py-12 text-center text-slate-500 font-medium italic">No trading clients found matching your search.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between bg-[#1a2035] flex-wrap gap-4">
                                <span className="text-slate-400 text-sm">
                                    Page <b className="text-white">{currentPage}</b> of <b className="text-white">{totalPages.toLocaleString()}</b>
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium cursor-pointer"
                                    >
                                        Prev
                                    </button>

                                    {(() => {
                                        const pageSet = new Set();
                                        [1, totalPages, currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2].forEach(num => {
                                            if (num >= 1 && num <= totalPages) pageSet.add(num);
                                        });
                                        const visiblePages = Array.from(pageSet).sort((a, b) => a - b);
                                        return visiblePages.map((p, i, arr) => {
                                            if (i > 0 && arr[i] - arr[i - 1] > 1) {
                                                return (
                                                    <React.Fragment key={`ellipsis-${p}`}>
                                                        <span className="text-slate-500 px-1 select-none">...</span>
                                                        <button
                                                            onClick={() => setCurrentPage(p)}
                                                            className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-all cursor-pointer ${currentPage === p ? 'bg-[#5cb85c] text-white shadow-lg' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                                                        >
                                                            {p}
                                                        </button>
                                                    </React.Fragment>
                                                );
                                            }
                                            return (
                                                <button
                                                    key={p}
                                                    onClick={() => setCurrentPage(p)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-all cursor-pointer ${currentPage === p ? 'bg-[#5cb85c] text-white shadow-lg' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        });
                                    })()}

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 rounded bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium cursor-pointer"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== INLINE DELETE CONFIRMATION MODAL ===== */}
                {deleteConfirm && (
                    <div
                        className="fixed inset-0 z-[999] flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <div
                            className="bg-[#1f283e] border border-red-500/20 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                                    <Trash2 className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">Delete Trading Client</h3>
                                    <p className="text-slate-400 text-sm mt-0.5">This action cannot be undone.</p>
                                </div>
                            </div>
                            <p className="text-slate-300 mb-2">
                                Are you sure you want to delete this record?
                            </p>
                            <p className="text-slate-500 text-sm mb-8">
                                Client: <span className="text-white font-bold">{deleteConfirm.username}</span> ({deleteConfirm.full_name})<br />
                                Ledger Balance: <span className="text-white font-bold">₹{parseFloat(deleteConfirm.ledger_balance || 0).toFixed(2)}</span>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-3 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 font-bold text-sm transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="flex-1 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: '', type: 'success' })}
                />
            </div>
        </>
    );
};

export default TradingClientsPage;
