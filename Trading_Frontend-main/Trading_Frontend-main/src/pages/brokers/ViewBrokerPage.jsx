import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { RotateCcw, ArrowLeft, FileText, Trash2 } from 'lucide-react';
import * as api from '../../services/api';

const ViewBrokerPage = ({ onBack }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Fetch on mount and whenever returning to this page
    useEffect(() => {
        if (id) fetchBrokerClients();
    }, [id]);

    // Refetch when user returns from edit/delete (location/pathname changes)
    useEffect(() => {
        if (id && location.pathname === `/brokers/view/${id}`) {
            console.log('[BROKER_VIEW] 🔄 Refetching clients after navigation...');
            fetchBrokerClients();
        }
    }, [location.pathname, id]);

    const fetchBrokerClients = async () => {
        setLoading(true);
        try {
            const data = await api.getBrokerClients(id);
            setClients(data || []);
        } catch (err) {
            console.error('Failed to fetch broker clients:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client => {
        const matchesSearch = !searchTerm ||
            (client.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.username || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || client.status === statusFilter;
        const clientDate = client.created_at ? new Date(client.created_at).toISOString().split('T')[0] : null;
        const matchesFrom = !fromDate || (clientDate && clientDate >= fromDate);
        const matchesTo = !toDate || (clientDate && clientDate <= toDate);
        return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await api.deleteUser(deleteConfirm.id);
            fetchBrokerClients();
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to delete client:', err);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 w-full max-w-full min-w-0">
            {/* Back Button & Broker Info Header */}
            <div className="flex items-center gap-2 sm:gap-4">
                <button
                    onClick={() => onBack ? onBack() : navigate('/brokers')}
                    className="flex items-center gap-2 text-white hover:text-green-400 transition-colors font-bold text-xs sm:text-sm"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> BACK
                </button>
            </div>

            {/* Add Client Button */}
            <div className="flex justify-start">
                <button
                    onClick={() => navigate(`/trading-clients/create`, { state: { preselectedBrokerId: id } })}
                    className="text-white py-2 sm:py-3 px-4 sm:px-6 lg:px-8 rounded-md font-bold text-[10px] sm:text-[11px] uppercase tracking-widest transition-all shadow-[0_4px_10px_rgba(76,175,80,0.3)] hover:shadow-[0_4px_20px_rgba(76,175,80,0.5)] active:scale-95"
                    style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                >
                    + ADD CLIENT
                </button>
            </div>

            {/* Search & Filter */}
            <div className="bg-[#202940] rounded-lg border border-white/5 shadow-2xl p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    <div>
                        <label className="block text-[9px] sm:text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest">Username</label>
                        <input
                            type="text"
                            placeholder="Search username..."
                            className="w-full bg-[#151c2c] border border-white/10 rounded-md py-2 sm:py-2.5 px-2.5 sm:px-3 text-white focus:outline-none focus:border-[#4CAF50] transition-all text-xs font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] sm:text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest">Account Status</label>
                        <select
                            className="w-full bg-[#151c2c] border border-white/10 rounded-md py-2 sm:py-2.5 px-2.5 sm:px-3 text-white focus:outline-none focus:border-[#4CAF50] transition-all text-xs font-bold"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[9px] sm:text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest">From Date</label>
                        <input
                            type="date"
                            className="w-full bg-[#151c2c] border border-white/10 rounded-md py-2 sm:py-2.5 px-2.5 sm:px-3 text-white focus:outline-none focus:border-[#4CAF50] transition-all [color-scheme:dark] text-xs font-bold"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] sm:text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest">To Date</label>
                        <input
                            type="date"
                            className="w-full bg-[#151c2c] border border-white/10 rounded-md py-2 sm:py-2.5 px-2.5 sm:px-3 text-white focus:outline-none focus:border-[#4CAF50] transition-all [color-scheme:dark] text-xs font-bold"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <button
                        onClick={() => {}}
                        className="text-white px-6 sm:px-8 py-2 sm:py-2.5 rounded font-bold text-xs tracking-widest transition-all shadow-[0_4px_10px_rgba(76,175,80,0.3)] hover:shadow-[0_4px_20px_rgba(76,175,80,0.5)] active:scale-95 uppercase flex-1 sm:flex-none"
                        style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                    >SEARCH</button>
                    <button
                        onClick={() => { setSearchTerm(''); setStatusFilter(''); setFromDate(''); setToDate(''); }}
                        className="bg-[#808080] hover:bg-[#707070] text-white px-6 sm:px-8 py-2 sm:py-2.5 rounded font-bold text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all uppercase flex-1 sm:flex-none"
                    >
                        <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> RESET
                    </button>
                </div>
            </div>

            {/* Clients Table */}
            <div className="bg-[#1f283e] overflow-hidden rounded-lg border border-white/5 shadow-2xl w-full max-w-full min-w-0">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#1a2035] border-b border-white/5 flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm font-medium">
                        Broker's Clients — Showing <b className="text-white">{filteredClients.length}</b> of <b className="text-white">{clients.length}</b> clients.
                    </span>
                </div>

                <div className="w-full max-w-full overflow-x-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full text-left border-collapse text-xs sm:text-sm" style={{ minWidth: '1300px' }}>
                        <thead className="bg-[#1a2035]/50">
                            <tr className="text-white/90 text-[11px] sm:text-[13px] uppercase tracking-wider">
                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold w-8 sm:w-16">#</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold text-center">ACTIONS</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold text-center">Username</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold">Full Name ↑</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold">Ledger Bal.</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold">Gross P/L</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold">Brokerage</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold">Swap</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold">Net P/L</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold">Demo</th>
                                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] text-slate-300">
                            {loading ? (
                                <tr>
                                    <td colSpan="11" className="px-4 py-12 text-center text-slate-500 font-medium italic">
                                        Loading clients...
                                    </td>
                                </tr>
                            ) : filteredClients.length > 0 ? filteredClients.map((client, index) => (
                                <tr key={client.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-2 sm:px-4 py-3 sm:py-6">{index + 1}</td>
                                    <td className="px-2 sm:px-4 py-3 sm:py-6">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <button
                                                    onClick={() => navigate(`/trading-clients/details`, { state: { client } })}
                                                    className="text-white hover:text-blue-400 transition-colors text-xs sm:text-sm"
                                                    title="View"
                                                >
                                                    <i className="fa-solid fa-eye text-[12px] sm:text-[14px]"></i>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/trading-clients/edit/${client.id}`)}
                                                    className="text-white hover:text-blue-400 transition-colors text-xs sm:text-sm"
                                                    title="Edit"
                                                >
                                                    <i className="fa-solid fa-pencil text-[12px] sm:text-[14px]"></i>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/trading-clients/copy`, { state: { client } })}
                                                    className="text-white hover:text-blue-400 transition-colors text-xs sm:text-sm"
                                                    title="Duplicate"
                                                >
                                                    <i className="fa-solid fa-copy text-[12px] sm:text-[14px]"></i>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(client)}
                                                    className="text-white hover:text-red-400 transition-colors text-xs sm:text-sm"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <div onClick={() => navigate('/trading-clients/deposit', { state: { selectedClient: client } })} className="w-4 sm:w-[18px] h-4 sm:h-[18px] bg-[#5cb85c] hover:bg-[#4caf50] rounded-full flex items-center justify-center cursor-pointer transition-all shadow-sm">
                                                    <i className="fa-solid fa-arrow-down text-white text-[8px] sm:text-[10px] font-black"></i>
                                                </div>
                                                <div onClick={() => navigate('/trading-clients/withdraw', { state: { selectedClient: client } })} className="w-4 sm:w-[18px] h-4 sm:h-[18px] bg-[#f44336] hover:bg-[#d32f2f] rounded-full flex items-center justify-center cursor-pointer transition-all shadow-sm">
                                                    <i className="fa-solid fa-arrow-up text-white text-[8px] sm:text-[10px] font-black"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-white font-medium">{client.username}</td>
                                    <td className="px-4 py-4 whitespace-nowrap font-medium text-white">{client.full_name || '-'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap font-mono text-white/80">{parseFloat(client.ledger_balance || 0).toFixed(2)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">{parseFloat(client.gross_pl || 0).toFixed(2)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">{parseFloat(client.brokerage || 0).toFixed(2)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">{parseFloat(client.swap_charges || 0).toFixed(2)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap font-bold text-white">{parseFloat(client.net_pl || 0).toFixed(2)}</td>
                                    <td className="px-2 sm:px-4 py-3 sm:py-6">{client.is_demo ? 'Yes' : 'No'}</td>
                                    <td className="px-2 sm:px-4 py-3 sm:py-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            client.status === 'Active'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {client.status || 'Active'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="11" className="px-4 py-12 text-center text-slate-500 font-medium italic">
                                        No clients found for this broker.
                                    </td>
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

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div
                    className="fixed inset-0 z-[999] flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setDeleteConfirm(null)}
                >
                    <div
                        className="bg-[#1a2035] border border-white/10 rounded-lg p-6 max-w-sm mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-white mb-4">Delete Client?</h3>
                        <p className="text-slate-300 mb-6">
                            Are you sure you want to delete <span className="font-bold text-orange-400">{deleteConfirm.username}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 bg-[#808080] hover:bg-[#707070] text-white px-4 py-2.5 rounded font-bold text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 bg-[#f44336] hover:bg-[#d32f2f] text-white px-4 py-2.5 rounded font-bold text-sm transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1a2035; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #4CAF50; border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default ViewBrokerPage;
