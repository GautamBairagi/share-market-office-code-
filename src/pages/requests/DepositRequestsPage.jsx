import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Search, RotateCcw, X } from 'lucide-react';
import { getRequests, updateRequestStatus } from '../../services/api';

const DepositRequestsPage = () => {
    const [depositRequests, setDepositRequests] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState({ show: false, text: '', type: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getRequests({ type: 'DEPOSIT' });
            setDepositRequests(res);
        } catch (err) {
            showToast('Failed to fetch deposit requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const showToast = (text, type = 'success') => {
        setToast({ show: true, text, type });
        setTimeout(() => setToast({ show: false, text: '', type: '' }), 3000);
    };

    const handleAction = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;

        setActionLoading(id);
        try {
            await updateRequestStatus(id, status, `${status} by Admin`);
            showToast(`Request ${status.toLowerCase()} successfully`);
            fetchData();
        } catch (err) {
            showToast(err.message || 'Action failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="main-content flex flex-col gap-[20px] w-full relative">
            {/* Toast */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded shadow-2xl transition-all border ${toast.type === 'success' ? 'bg-[#1b2a21] border-green-500/30 text-green-400' : 'bg-[#2a1b1b] border-red-500/30 text-red-400'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    <p className="text-[14px] font-medium tracking-wide">{toast.text}</p>
                </div>
            )}

            <div className="page-header-responsive">
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>
                    Showing <span style={{ color: 'white', fontWeight: 700 }}>{depositRequests.length}</span> items.
                </span>
                <button onClick={fetchData} className="btn-secondary btn-sm">
                    <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> REFRESH
                </button>
            </div>

            <div className="card-panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="table-wrapper overflow-x-auto custom-scrollbar" style={{ flex: 1, border: 'none', borderRadius: 0 }}>
                    <table className="table-standard custom-table" style={{ minWidth: '1000px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>ID</th>
                                <th style={{ textAlign: 'center' }}>User Details</th>
                                <th style={{ textAlign: 'center' }}>Amount Info</th>
                                <th style={{ textAlign: 'center' }}>File</th>
                                <th style={{ textAlign: 'center' }}>Time</th>
                                <th style={{ textAlign: 'center' }}>Status / Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="loading-overlay">
                                        <div className="spinner"></div>
                                        <span>Loading Deposits...</span>
                                    </td>
                                </tr>
                            ) : depositRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontWeight: 500 }}>
                                        No deposit requests found
                                    </td>
                                </tr>
                            ) : depositRequests.map((req) => (
                                <tr key={req.id}>
                                    <td style={{ fontWeight: 700, color: 'white' }}>{req.id}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                            <span style={{ color: '#60a5fa', fontWeight: 700 }}>{req.full_name || 'User'}</span>
                                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>@{req.username}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                            <span style={{ color: '#4CAF50', fontWeight: 700, fontSize: '15px' }}>₹{parseFloat(req.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <span style={{ fontSize: '11px', color: '#64748b' }}>Bal: ₹{parseFloat(req.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div 
                                            className="relative group/img" 
                                            style={{ display: 'inline-block', cursor: req.screenshot_url ? 'pointer' : 'default' }}
                                            onClick={() => req.screenshot_url && setPreviewImage(req.screenshot_url)}
                                        >
                                            <div style={{ width: '80px', height: '110px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                                {req.screenshot_url ? (
                                                    <img
                                                        src={req.screenshot_url}
                                                        alt="Proof"
                                                        className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-all duration-300"
                                                    />
                                                ) : (
                                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '0 4px', fontWeight: 700 }}>NO PROOF UPLOADED</div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                    <Search className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', color: 'white', fontWeight: 500 }}>
                                        {new Date(req.created_at).toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            {req.status === 'PENDING' ? (
                                                <div className="action-row" style={{ justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleAction(req.id, 'APPROVED')}
                                                        disabled={actionLoading === req.id}
                                                        className="btn-primary btn-sm btn-success-gradient"
                                                    >
                                                        {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req.id, 'REJECTED')}
                                                        disabled={actionLoading === req.id}
                                                        className="btn-danger btn-sm"
                                                    >
                                                        {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`badge ${req.status === 'APPROVED' ? 'badge-active' : 'badge-inactive'}`}>
                                                    {req.status}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Preview Modal */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <div 
                        className="relative max-w-[90vw] max-h-[90vh] bg-slate-900/60 rounded-lg p-2 border border-white/10 shadow-2xl flex items-center justify-center animate-in zoom-in-95 duration-200" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={previewImage} 
                            alt="Full proof preview" 
                            className="max-w-full max-h-[85vh] rounded-md object-contain"
                        />
                        <button 
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 text-white hover:text-red-400 bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all"
                            aria-label="Close preview"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepositRequestsPage;
