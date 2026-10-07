import React, { useState, useEffect } from 'react';
import { RotateCcw, Loader2, Download } from 'lucide-react';
import { getTraderFunds } from '../../services/api';

const NegativeBalanceTxnsPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ userId: '', amount: '', fromDate: '', toDate: '' });
    const [fromDateInput, setFromDateInput] = useState('');
    const [toDateInput, setToDateInput] = useState('');

    const weeklyTotal = data.reduce((sum, row) => {
        const rowDate = new Date(row.created_at);
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        if (rowDate >= startOfWeek) {
            return sum + parseFloat(row.amount || 0);
        }
        return sum;
    }, 0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getTraderFunds(filters);
            setData(res);
        } catch (err) {
            console.error('Failed to fetch negative balance txns:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReset = () => {
        setFilters({ userId: '', amount: '', fromDate: '', toDate: '' });
        setFromDateInput('');
        setToDateInput('');
        setTimeout(() => fetchData(), 0);
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const updatedFilters = {
                userId: filters.userId,
                amount: filters.amount,
                fromDate: fromDateInput,
                toDate: toDateInput
            };
            const res = await getTraderFunds(updatedFilters);
            setData(res);
        } catch (err) {
            console.error('Failed to fetch negative balance txns:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        try {
            setLoading(true);
            const exportFilters = {
                ...filters,
                fromDate: fromDateInput,
                toDate: toDateInput,
                export: 'csv'
            };

            const apiBase = import.meta.env.VITE_API_URL || 'https://api.shrishreenathjiglobaltraders.com/api';
            const response = await fetch(`${apiBase}/funds?${new URLSearchParams(exportFilters)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `negative-balance-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Failed to download report:', err);
            alert('Failed to download report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-content flex flex-col gap-[20px] w-full">
            {/* Top Date Filter */}
            <div className="custom-filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={fromDateInput}
                        onChange={(e) => setFromDateInput(e.target.value)}
                        className="px-6 py-3 focus:outline-none bg-transparent text-slate-200 font-medium text-sm min-w-[150px] border border-slate-600 focus:border-green-400 rounded transition-colors"
                    />
                    <input
                        type="date"
                        value={toDateInput}
                        onChange={(e) => setToDateInput(e.target.value)}
                        className="px-6 py-3 focus:outline-none bg-transparent text-slate-200 font-medium text-sm min-w-[150px] border border-slate-600 focus:border-green-400 rounded transition-colors"
                    />
                </div>
                <button
                    onClick={handleDownloadReport}
                    disabled={loading}
                    className="btn-primary"
                    style={{ background: '#17a2b8' }}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    DOWNLOAD REPORT
                </button>
            </div>

            {/* Search Card */}
            <div className="custom-filter">
                <div className="custom-filter-grid" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: '700px', gap: '40px', marginBottom: '24px' }}>
                    <div className="form-group">
                        <label className="block text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-2">Username</label>
                        <input
                            type="text"
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                            className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-[#5cb85c] transition-all"
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-2">Amount</label>
                        <input
                            type="text"
                            value={filters.amount}
                            onChange={(e) => setFilters({ ...filters, amount: e.target.value })}
                            className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-[#5cb85c] transition-all"
                        />
                    </div>
                </div>
                <div className="action-row">
                    <button onClick={handleSearch} className="btn-primary btn-success-gradient">
                        SEARCH
                    </button>
                    <button onClick={handleReset} className="btn-secondary" style={{ background: '#808080', borderColor: '#808080', color: 'white' }}>
                        <RotateCcw className="w-4 h-4" /> RESET
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div>
                <h3 className="text-white text-[25px] font-medium tracking-tight">
                    Total amount adjusted during the week: <span style={{ color: weeklyTotal < 0 ? '#f87171' : '#4ade80' }}>
                        ₹{weeklyTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </h3>
            </div>

            {/* Table */}
            <div className="card-panel" style={{ overflow: 'hidden' }}>
                <div className="card-panel-header">
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>Showing <b style={{ color: 'white' }}>{data.length}</b> of <b style={{ color: 'white' }}>{data.length}</b> items.</span>
                </div>

                <div className="table-wrapper overflow-x-auto custom-scrollbar" style={{ border: 'none', borderRadius: 0, minHeight: '100px' }}>
                    <table className="table-standard custom-table" style={{ minWidth: '1000px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '64px' }}></th>
                                <th>Username</th>
                                <th>Name</th>
                                <th>Amount</th>
                                <th>Txn Type</th>
                                <th>Notes</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="loading-overlay"><div className="spinner"></div><span>Loading...</span></td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>No records found.</td></tr>
                            ) : data.map((row, i) => (
                                <tr key={row.id || i}>
                                    <td>{i + 1}</td>
                                    <td style={{ color: '#00BCD4', fontWeight: 700 }}>{row.username}</td>
                                    <td>{row.full_name || '-'}</td>
                                    <td style={{ fontWeight: 700, color: parseFloat(row.amount) < 0 ? '#f87171' : '#4ade80' }}>
                                        ₹{parseFloat(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td>{row.txn_type || row.type || '-'}</td>
                                    <td>{row.notes || row.remarks || '-'}</td>
                                    <td>{row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 700, borderRadius: '4px', background: '#288c6c' }}>1</div>
                </div>
            </div>
        </div>
    );
};

export default NegativeBalanceTxnsPage;
