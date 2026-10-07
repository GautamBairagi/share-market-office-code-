import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { RotateCcw, SquarePen, ArrowUp, ArrowDown, Eye, Copy, Trash2, Settings, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBrokerPermissions } from '../../hooks/useBrokerPermissions';
import * as api from '../../services/api';
import Toast from '../../components/common/Toast';
import * as XLSX from 'xlsx';

export const clearTradingClientsCache = () => {};
export const setTradingClientsCache = (data) => {};

const TradingClientsPage = ({ onDepositClick, onWithdrawClick, onLogout, onNavigate }) => {
    const { isSuperAdmin, isAdmin, isBroker, user } = useAuth();
    const { permissions } = useBrokerPermissions(user?.userId, user?.role);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [toast, setToast] = useState({ message: '', type: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState(null); // holds client to be deleted

    const scrollContainerRef = useRef(null);

    const fetchClients = async (showLoading = false) => {
        if (showLoading) {
            setLoading(true);
        }
        try {
            console.log(`[TradingClientsPage] Fetching clients for ${user?.role} (ID: ${user?.userId})`);
            const params = { role: 'TRADER' };
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;
            const data = await api.getClients(params);
            console.log(`[TradingClientsPage] ✅ Received ${data?.length || 0} clients:`, data);
            const list = Array.isArray(data) ? data : [];
            setClients(list);
        } catch (err) {
            console.error('[TradingClientsPage] ❌ Failed to fetch clients:', err);
            setToast({ message: `Error loading clients: ${err.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients(true);
    }, [user?.userId]);

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

    const filteredClients = clients.filter(client => {
        const username = client.username || '';
        const fullName = client.full_name || '';
        const matchesSearch = username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === '' ||
            (statusFilter === '1' && client.status === 'Active') ||
            (statusFilter === '0' && client.status === 'Inactive');

        const clientDate = new Date(client.created_at);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        
        // Ensure to Date includes the end of the day
        if (from) from.setHours(0, 0, 0, 0);
        if (to) to.setHours(23, 59, 59, 999);

        const matchesDate = (!from || clientDate >= from) && (!to || clientDate <= to);

        return matchesSearch && matchesStatus && matchesDate;
    });

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
            
            // Format rows matching media_1788188015170.png:
            // User ID | Username | Brokerage | Profit/Loss | Net Amount
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
            
            // Set clean column widths for Excel
            worksheet['!cols'] = [
                { wch: 14 }, // User ID
                { wch: 16 }, // Username
                { wch: 16 }, // Brokerage
                { wch: 16 }, // Profit/Loss
                { wch: 16 }  // Net Amount
            ];
            
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
            
            // Save as users.xlsx
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
                            onClick={fetchClients}
                            className="text-white px-6 py-2.5 rounded font-bold text-xs tracking-widest transition-all shadow-[0_4px_10px_rgba(76,175,80,0.3)] hover:shadow-[0_4px_20px_rgba(76,175,80,0.5)] active:scale-95 uppercase flex-1 sm:flex-none cursor-pointer"
                            style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                        >
                            SEARCH
                        </button>
                        <button 
                            onClick={() => { setSearchTerm(''); setStatusFilter(''); setFromDate(''); setToDate(''); fetchClients(); }} 
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
                        <span className="text-slate-400 text-xs sm:text-sm font-medium">Showing <b className="text-white">{filteredClients.length}</b> of <b className="text-white">{clients.length}</b> items.</span>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <table className="w-full text-left border-collapse custom-table" style={{ minWidth: '900px' }}>
                            <thead className="bg-[#1a2035]/50">
                                <tr className="text-white/90 text-[11px] sm:text-[13px] uppercase tracking-wider">
                                    <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold w-8 sm:w-16 whitespace-nowrap">#</th>
                                    <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold text-center whitespace-nowrap">ACTIONS</th>
                                    <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold text-center whitespace-nowrap">Username</th>
                                    <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">Full Name ↑</th>
                                    <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">Ledger Bal.</th>
                                    {(isAdmin() || isBroker()) && (
                                        <>
                                            <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">Gross P/L</th>
                                            <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">Brokerage</th>
                                            <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">Swap</th>
                                            <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">Net P/L</th>
                                        </>
                                    )}
                                    <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">Demo</th>
                                    <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">Status</th>
                                    {isAdmin() && (
                                        <>
                                            <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">Trades</th>
                                            <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">Backup</th>
                                        </>
                                    )}
                                    <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold whitespace-nowrap">KYC</th>
                                </tr>
                            </thead>
                            <tbody className="text-[11px] sm:text-[13px] text-slate-300">
                                {loading ? (
                                    <tr>
                                        <td colSpan="14" className="px-4 py-12 text-center text-slate-500 font-medium italic">Loading clients...</td>
                                    </tr>
                                ) : filteredClients.length > 0 ? filteredClients.map((client, index) => (
                                    <tr key={client.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-2 sm:px-4 py-3 sm:py-6">{index + 1}</td>
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
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border ${
                                                (client.kycStatus || '').toUpperCase() === 'VERIFIED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
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
                    <div className="px-5 py-6 border-t border-white/5 flex items-center justify-between bg-[#1a2035]">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#5cb85c] text-white text-sm font-bold rounded shadow-lg">1</div>
                    </div>
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
                            Client: <span className="text-white font-bold">{deleteConfirm.username}</span> ({deleteConfirm.full_name})<br/>
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
