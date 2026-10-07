import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, SquarePen, X, Download, Loader2, Eye } from 'lucide-react';
import * as api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrokerPermissions } from '../../hooks/useBrokerPermissions';

const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const pad = (num) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

const formatTransactionType = (type) => {
    if (!type) return '—';
    const t = type.toUpperCase();
    if (t === 'DEPOSIT') return 'Deposit';
    if (t === 'WITHDRAW') return 'Withdraw';
    return type;
};

const TraderFundsPage = ({ onNavigate, onEditFund, onCreateFund }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { permissions } = useBrokerPermissions(user?.userId, user?.role);
    const [allUsers, setAllUsers] = useState([]);
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        userId: '',
        amount: ''
    });

    const [fundsData, setFundsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, fund: null });
    const [deleting, setDeleting] = useState(false);

    // Pagination
    const PAGE_SIZE = 15;
    const [currentPage, setCurrentPage] = useState(1);

    // Load all users to get their roles
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const users = await api.getClients();
                setAllUsers(users || []);
            } catch (err) {
                console.error('Failed to load users:', err);
            }
        };
        loadUsers();
    }, []);

    useEffect(() => {
        if (user?.id && allUsers.length > 0) {
            fetchFunds();
        }
    }, [user?.id, allUsers.length]);

    const fetchFunds = async (params = {}) => {
        setLoading(true);
        setCurrentPage(1); // reset to first page on every fetch
        try {
            const data = await api.getTraderFunds(params);
            console.log('[Funds] Full data:', data);
            console.log('[Funds] Sample fund:', data[0]);

            setFundsData(data.map(f => ({
                id: f.id,
                user_id: f.user_id,
                username: f.username,
                name: f.full_name || '—',
                amount: f.amount,
                txnType: f.type,
                notes: f.remarks || '—',
                pgTxnId: f.pg_txn_id || f.pgTxnId || '—',
                createdAt: formatDate(f.created_at)
            })));
        } catch (err) {
            console.error('Failed to fetch funds', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        const params = {};
        if (filters.userId) params.userId = filters.userId;
        if (filters.amount) params.amount = filters.amount;
        if (filters.fromDate) params.fromDate = filters.fromDate;
        if (filters.toDate) params.toDate = filters.toDate;
        fetchFunds(params);
    };

    const handleReset = () => {
        setFilters({ fromDate: '', toDate: '', userId: '', amount: '' });
        fetchFunds();
    };

    const openDeleteModal = (fund) => {
        setDeleteModal({ show: true, fund });
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.deleteFund(deleteModal.fund.id);
            setDeleteModal({ show: false, fund: null });
            fetchFunds();
        } catch (err) {
            alert(err?.response?.data?.message || err?.message || 'Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const params = {};
            if (filters.userId) params.userId = filters.userId;
            if (filters.amount) params.amount = filters.amount;
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;

            // Fetch current filtered data
            const data = await api.getTraderFunds(params);

            // Create CSV
            const headers = ['ID', 'Username', 'Name', 'Type', 'Amount', 'Notes', 'Created At'];
            const rows = data.map(f => [
                f.id,
                f.username,
                f.full_name || '—',
                f.type,
                f.amount,
                f.remarks || '—',
                new Date(f.created_at).toLocaleString()
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `funds_report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            alert(err?.response?.data?.message || err?.message || 'Failed to download report');
        } finally {
            setDownloading(false);
        }
    };

    // Pagination derived values
    const totalPages = Math.max(1, Math.ceil(fundsData.length / PAGE_SIZE));
    const paginatedFunds = fundsData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const getPageNumbers = () => {
        const pages = [];
        const delta = 2;
        const left = Math.max(2, currentPage - delta);
        const right = Math.min(totalPages - 1, currentPage + delta);
        pages.push(1);
        if (left > 2) pages.push('...');
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < totalPages - 1) pages.push('...');
        if (totalPages > 1) pages.push(totalPages);
        return pages;
    };

    return (
        <div className="flex flex-col bg-[#1a2035] space-y-4 md:space-y-8 w-full">

            <div className="px-3 sm:px-4 md:px-6 space-y-4 md:space-y-8 pb-6 md:pb-10">
                {/* Top Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row gap-4 flex-1 w-full md:w-auto">
                        <div className="group w-full md:w-auto md:min-w-[180px]">
                            <label className="block text-[10px] text-slate-500 mb-1.5 font-black uppercase tracking-widest">From Date</label>
                            <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange}
                                className="bg-transparent text-slate-200 px-4 py-2.5 rounded text-sm outline-none border border-slate-600 focus:border-green-400 w-full transition-colors" />
                        </div>
                        <div className="group w-full md:w-auto md:min-w-[180px]">
                            <label className="block text-[10px] text-slate-500 mb-1.5 font-black uppercase tracking-widest">To Date</label>
                            <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange}
                                className="bg-transparent text-slate-200 px-4 py-2.5 rounded text-sm outline-none border border-slate-600 focus:border-green-400 w-full transition-colors" />
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadReport}
                        disabled={downloading || fundsData.length === 0}
                        className="bg-[#00BCD4] hover:bg-[#00ACC1] disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded uppercase tracking-wide text-[11px] transition-all shadow-md whitespace-nowrap w-full md:w-auto flex items-center justify-center gap-2"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {downloading ? 'DOWNLOADING...' : 'DOWNLOAD FUNDS REPORT'}
                    </button>
                </div>

                {/* Filter Section */}
                <div className="bg-[#1f283e] p-6 rounded-lg border border-white/10 shadow-xl">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-56">
                                <label className="text-slate-500 text-xs block mb-2">Username</label>
                                <input type="text" name="userId" value={filters.userId} onChange={handleFilterChange}
                                    className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-slate-600 focus:border-[#4CAF50] transition-colors" />
                            </div>
                            <div className="w-full md:w-56">
                                <label className="text-slate-500 text-xs block mb-2">Amount</label>
                                <input type="text" name="amount" value={filters.amount} onChange={handleFilterChange}
                                    className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-slate-600 focus:border-[#4CAF50] transition-colors" />
                            </div>
                        </div>
                        <div className="flex flex-row gap-4">
                            <button onClick={handleSearch} className="flex-1 md:flex-none text-white font-bold py-2.5 px-8 rounded uppercase tracking-wide text-[11px] transition-all shadow-[0_4px_10px_rgba(76,175,80,0.3)] hover:shadow-[0_4px_20px_rgba(76,175,80,0.5)] active:scale-95"
                                style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}>SEARCH</button>
                            <button onClick={handleReset} className="flex-1 md:flex-none bg-[#607d8b] hover:bg-[#546e7a] text-white font-bold py-2.5 px-8 rounded uppercase tracking-wide text-[11px] transition-all shadow-md">RESET</button>
                        </div>
                    </div>
                </div>

                <div>
                    {!user?.isSubBroker && (user?.role !== 'BROKER' || permissions.payinAllowed === 'Yes' || permissions.payoutAllowed === 'Yes') && (
                        <button onClick={onCreateFund}
                            className="w-full md:w-auto text-white font-bold py-2.5 px-8 rounded uppercase tracking-wide text-xs transition-all shadow-[0_4px_10px_rgba(76,175,80,0.3)] hover:shadow-[0_4px_20px_rgba(76,175,80,0.5)] active:scale-95"
                            style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}>CREATE NEW FUND</button>
                    )}
                </div>

                {/* Results Table */}
                <div className="bg-[#1f283e] rounded-lg border border-white/10 shadow-xl overflow-hidden">
                    <div className="px-6 py-4 bg-[#1a2035] border-b border-white/10">
                        <span className="text-slate-400 text-sm">
                            Showing <b className="text-white">{paginatedFunds.length}</b> of <b className="text-white">{fundsData.length}</b> items.
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse custom-table">
                            <thead>
                                <tr className="text-white text-sm bg-[#1a2035] border-b border-white/10">
                                    <th className="px-4 py-4 w-10"></th>
                                    <th className="px-4 py-4 font-bold">ID ⇑</th>
                                    <th className="px-4 py-4 font-bold">username</th>
                                    <th className="px-4 py-4 font-bold">name</th>
                                    <th className="px-4 py-4 font-bold">Amount</th>
                                    <th className="px-4 py-4 font-bold">Txn Type</th>
                                    <th className="px-4 py-4 font-bold">Notes</th>
                                    <th className="px-4 py-4 font-bold">PG Txn ID</th>
                                    <th className="px-4 py-4 font-bold">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-300">
                                {paginatedFunds.length > 0 ? (
                                    paginatedFunds.map((fund) => {
                                        const typeUpper = (fund.txnType || fund.type || '').toUpperCase();
                                        const notesUpper = (fund.notes || '').toUpperCase();
                                        const isSettlement = typeUpper === 'WEEKLY_SETTLEMENT' || notesUpper.includes('WEEKLY SETTLEMENT');
                                        const isDeposit = typeUpper === 'DEPOSIT';
                                        const rawAmt = parseFloat(fund.amount || 0);
                                        const isPos = rawAmt >= 0;

                                        return (
                                            <tr key={fund.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-4">
                                                    <button
                                                        onClick={() => navigate(`/funds/view/${fund.id}`, { state: { fund } })}
                                                        className="text-white hover:text-green-400 transition-colors p-1.5 rounded hover:bg-white/5"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-[16px] h-[16px]" />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 text-white">{fund.id}</td>
                                                <td className="px-4 py-4 text-[#00BCD4]">{fund.username}</td>
                                                <td className="px-4 py-4">{fund.name}</td>
                                                <td className={`px-4 py-4 font-mono ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                                                    {isPos ? '+' : '-'}{Math.abs(rawAmt).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {isSettlement ? (
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isPos ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                                            SETTLEMENT
                                                        </span>
                                                    ) : (
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isDeposit ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                            {isDeposit ? 'DEPOSIT' : 'WITHDRAW'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">{fund.notes}</td>
                                                <td className="px-4 py-4">{fund.pgTxnId}</td>
                                                <td className="px-4 py-4">{fund.createdAt}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-8 text-center text-slate-500">No funds found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                        <div className="px-5 py-4 border-t border-white/5 bg-[#1a2035] flex items-center justify-between gap-3 flex-wrap">
                            <span className="text-slate-400 text-xs">
                                Page <b className="text-white">{currentPage}</b> of <b className="text-white">{totalPages}</b>
                            </span>
                            <div className="flex items-center gap-1.5">
                                {/* Prev */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
                                >
                                    ← Prev
                                </button>

                                {/* Page Numbers */}
                                {getPageNumbers().map((pg, idx) =>
                                    pg === '...' ? (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-500 text-xs">…</span>
                                    ) : (
                                        <button
                                            key={pg}
                                            onClick={() => setCurrentPage(pg)}
                                            className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                                                currentPage === pg
                                                    ? 'text-white shadow-lg'
                                                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                                            }`}
                                            style={currentPage === pg ? { background: 'linear-gradient(60deg, #288c6c, #4ea752)' } : {}}
                                        >
                                            {pg}
                                        </button>
                                    )
                                )}

                                {/* Next */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1e253a] border border-white/10 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-white/5">
                            <h3 className="text-white font-bold text-lg">Delete Fund Entry</h3>
                            <button onClick={() => setDeleteModal({ show: false, fund: null })} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 text-center">
                            <div className="bg-red-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-7 h-7 text-red-500" />
                            </div>
                            <p className="text-slate-300 text-sm mb-1">
                                Delete <span className="text-white font-bold">{(deleteModal.fund?.txnType || '').toUpperCase()}</span> of
                                <span className="text-white font-bold"> ₹{deleteModal.fund?.amount}</span> for
                                <span className="text-[#00BCD4] font-bold"> {deleteModal.fund?.username}</span>?
                            </p>
                            <p className="text-slate-500 text-xs mt-2">Balance will be reversed automatically.</p>
                        </div>

                        <div className="flex p-4 gap-3 bg-black/20">
                            <button onClick={() => setDeleteModal({ show: false, fund: null })}
                                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all">
                                NO, KEEP IT
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg disabled:opacity-50">
                                {deleting ? 'DELETING...' : 'YES, DELETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TraderFundsPage;
