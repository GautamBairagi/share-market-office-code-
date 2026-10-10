import React, { useState, useEffect } from 'react';
import { RefreshCcw, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import * as api from '../../services/api';

const IpLoginsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        role: '',
        startDate: '',
        endDate: '',
    });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.search) params.search = filters.search;
            if (filters.role) params.role = filters.role;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            const data = await api.getIpLogins(params);
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch IP logins:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLogs();
    };

    const handleReset = () => {
        setFilters({ search: '', role: '', startDate: '', endDate: '' });
        setTimeout(fetchLogs, 0);
    };

    const handleDelete = (id) => {
        setDeleteConfirm(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            setDeleting(true);
            await api.deleteIpLogin(deleteConfirm);
            setLogs(prev => prev.filter(l => l.id !== deleteConfirm));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to delete:', err);
        } finally {
            setDeleting(false);
        }
    };

    const roleBadges = {
        'SUPERADMIN': { label: 'S-ADMIN', cls: 'badge-pending' },
        'ADMIN': { label: 'ADMIN', cls: 'badge-active' },
        'BROKER': { label: 'BROKER', cls: 'badge' },
        'TRADER': { label: 'CLIENT', cls: 'badge' },
    };

    return (
        <div className="main-content flex flex-col gap-[20px] w-full">
            {/* Filter Bar */}
            <div className="custom-filter">
                <div className="custom-filter-title">
                    <RefreshCcw className="w-3 h-3" />
                    IP Login Filters
                </div>
                <form onSubmit={handleSearch} className="custom-filter-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ border: 'none' }}>
                    <div className="form-group">
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Username / IP / Full Name..."
                            value={filters.search}
                            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                            className="w-full bg-transparent border-b border-white/15 px-1 py-2 text-sm text-white outline-none focus:border-[#4caf50] transition-colors placeholder:text-slate-600"
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                            Role
                        </label>
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
                            className="w-full bg-[#1a2035] border border-white/10 text-white px-3 py-2 rounded text-sm outline-none focus:border-[#4caf50] transition-colors cursor-pointer"
                        >
                            <option value="">ALL ROLES</option>
                            <option value="ADMIN">ADMINS</option>
                            <option value="BROKER">BROKERS</option>
                            <option value="TRADER">CLIENTS</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                            className="w-full bg-transparent border-b border-white/15 px-1 py-2 text-sm text-white outline-none focus:border-[#4caf50] transition-colors"
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                            className="w-full bg-transparent border-b border-white/15 px-1 py-2 text-sm text-white outline-none focus:border-[#4caf50] transition-colors"
                        />
                    </div>

                    <div className="md:col-span-4 action-row" style={{ paddingTop: '8px' }}>
                        <button type="submit" className="btn-primary btn-success-gradient">
                            SEARCH
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="btn-secondary"
                        >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            RESET
                        </button>
                    </div>
                </form>
            </div>

            {/* Logs Table */}
            <div className="card-panel overflow-hidden">
                <div className="table-wrapper overflow-x-auto custom-scrollbar" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="table-standard custom-table">
                        <thead>
                            <tr>
                                <th>Identification</th>
                                <th>Role</th>
                                <th>Network Node</th>
                                <th>Device / Client</th>
                                <th>Security Risk</th>
                                <th style={{ textAlign: 'right' }}>Timestamp (IST)</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="loading-overlay">
                                        <div className="spinner"></div>
                                        <span>Scanning logs...</span>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontWeight: 500 }}>
                                        No authentication logs found
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const badge = roleBadges[log.role] || roleBadges['TRADER'];
                                    return (
                                        <tr key={log.id} className="group">
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{log.username}</span>
                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{log.full_name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(74,222,128,0.4)' }}></div>
                                                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#4ade80', fontWeight: 600 }}>{log.ip}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                                                        {[log.os, log.device_model].filter(Boolean).join(' / ') || 'Unknown Device'}
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {log.userAgent || '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div style={{ flex: 1, maxWidth: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                                                        <div
                                                            style={{
                                                                height: '100%',
                                                                width: `${(log.riskScore || 1) * 10}%`,
                                                                background: log.riskScore >= 7 ? '#ef4444' : log.riskScore >= 4 ? '#f59e0b' : '#22c55e',
                                                                borderRadius: '9999px',
                                                                transition: 'width 0.5s'
                                                            }}
                                                        />
                                                    </div>
                                                    <span style={{
                                                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
                                                        color: log.riskScore >= 7 ? '#f87171' : log.riskScore >= 4 ? '#fbbf24' : '#4ade80'
                                                    }}>
                                                        LV {log.riskScore ?? 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', fontVariantNumeric: 'tabular-nums' }}>
                                                        {new Date(log.timestamp).toLocaleDateString('en-GB')}
                                                    </span>
                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                                                        {new Date(log.timestamp).toLocaleTimeString('en-GB')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center', padding: '12px 8px', minWidth: '80px' }}>
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleDelete(log.id)}
                                                        className="action-icon action-icon-delete"
                                                        title="Delete Record"
                                                        style={{ margin: '0' }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm !== null && (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                    onClick={() => setDeleteConfirm(null)}
                >
                    <div
                        className="modal-responsive bg-[#202940] rounded-lg border border-red-500/30 shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '400px', width: '100%' }}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-[#2d3748]">
                            <h3 className="text-white font-bold text-lg">Confirm Delete</h3>
                            <button onClick={() => setDeleteConfirm(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-slate-300 text-base mb-6">Are you sure you want to delete this login record? This action cannot be undone.</p>
                        </div>
                        <div className="p-4 border-t border-[#2d3748] flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1" style={{ borderRadius: '6px' }}>
                                CANCEL
                            </button>
                            <button onClick={confirmDelete} disabled={deleting} className="btn-danger flex-1" style={{ borderRadius: '6px' }}>
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'DELETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IpLoginsPage;
