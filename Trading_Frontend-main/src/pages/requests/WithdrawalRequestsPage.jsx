import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, X, ChevronDown, Check, AlertTriangle, Eye, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { getRequests, updateRequestStatus } from '../../services/api';

// Dummy data removed, using real fetch

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    'Pending': { bg: 'rgba(251,191,36,0.15)', color: '#f59e0b', dot: '#f59e0b' },
    'Approved': { bg: 'rgba(76,175,80,0.15)', color: '#4caf50', dot: '#4caf50' },
    'Rejected': { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', dot: '#ef4444' },
    'Processing': { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', dot: '#3b82f6' },
    'On Hold': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7', dot: '#a855f7' },
    'Failed': { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', dot: '#9ca3af' },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
    return (
        <span style={{ background: cfg.bg, color: cfg.color, display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }}></span>
            {status}
        </span>
    );
};

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toasts, remove }) => (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
            <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '6px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)', color: 'white', fontSize: '14px', fontWeight: '500',
                background: t.type === 'success' ? '#4caf50' : t.type === 'error' ? '#ef4444' : '#3b82f6'
            }}>
                {t.type === 'success' ? <CheckCircle style={{ width: 16, height: 16 }} /> : t.type === 'error' ? <XCircle style={{ width: 16, height: 16 }} /> : <Clock style={{ width: 16, height: 16 }} />}
                {t.msg}
                <button onClick={() => remove(t.id)} style={{ marginLeft: '8px', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}><X style={{ width: 14, height: 14 }} /></button>
            </div>
        ))}
    </div>
);

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger }) => {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#1f283e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', padding: '24px', width: '380px', maxWidth: '90vw' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <AlertTriangle style={{ width: 20, height: 20, color: danger ? '#f87171' : '#fbbf24' }} />
                    <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>{title}</h3>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>{message}</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onConfirm} style={{ padding: '8px 20px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', color: 'white', background: danger ? '#ef4444' : '#4caf50', border: 'none', cursor: 'pointer' }}>
                        {danger ? 'Yes, Reject' : 'Yes, Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ req, onClose, onAction }) => {
    const [tab, setTab] = useState('client');
    const [charges, setCharges] = useState(req.charges);
    const [note, setNote] = useState('');
    const [rejReason, setRejReason] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAction = (type) => setConfirm({ type });

    const doAction = async () => {
        setLoading(true);
        try {
            await onAction(req.id, confirm.type, { charges, note, rejReason });
            setConfirm(null);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const TABS = ['client', 'withdrawal', 'action', 'audit'];
    const TAB_LABELS = { client: 'Client Info', withdrawal: 'Withdrawal Details', action: 'Admin Action', audit: 'Audit Log' };

    const Row = ({ label, value, accent }) => (
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', width: '176px', flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: '13px', fontWeight: '500', color: accent ? '#4caf50' : '#e2e8f0' }}>{value || '—'}</span>
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
            <div style={{ width: '100%', maxWidth: '640px', height: '100%', background: '#1a2035', borderLeft: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ background: '#4caf50', minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', flexShrink: 0 }}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px', sm: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Withdrawal Details</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', sm: '12px' }}>#{req.id}</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: '8px', borderRadius: '50%' }}><X style={{ width: 20, height: 20 }} /></button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#1f283e', flexShrink: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: '12px 16px', fontSize: '11px', sm: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em',
                            background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                            color: tab === t ? '#4caf50' : '#94a3b8',
                            borderBottom: tab === t ? '2px solid #4caf50' : '2px solid transparent',
                            transition: 'color 0.15s'
                        }}>
                            {TAB_LABELS[t]}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }} className="custom-scrollbar">

                    {tab === 'client' && (
                        <div>
                            <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: 'bold' }}>Section A – Client Information</p>
                            <Row label="Client Name" value={req.clientName} />
                            <Row label="Client ID" value={req.clientId} />
                            <Row label="Email" value={req.email} />
                            <Row label="Phone" value={req.phone} />
                            <Row label="KYC Status" value={req.kyc} accent={req.kyc === 'Verified'} />
                            <Row label="Account Type" value={req.accountType} />
                            <Row label="Broker" value={req.broker} />
                            <Row label="Current Balance" value={fmt(req.availableBalance)} accent />
                            <Row label="Blocked Margin" value={fmt(req.availableBalance - req.withdrawableBalance)} style={{ color: '#f87171' }} />
                            <Row label="Withdrawable Balance" value={fmt(req.withdrawableBalance)} accent />
                            <Row label="Negative Balance" value={fmt(req.negativeBalance)} />
                        </div>
                    )}

                    {tab === 'withdrawal' && (
                        <div>
                            <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: 'bold' }}>Section B – Withdrawal Details</p>
                            <Row label="Withdrawal ID" value={req.id} />
                            <Row label="Transaction ID" value={req.txnId} />
                            <Row label="Requested Amount" value={fmt(req.amount)} accent />
                            <Row label="Charges" value={fmt(req.charges)} />
                            <Row label="Net Transfer Amount" value={fmt(req.netAmount)} accent />
                            <Row label="Currency" value="INR" />
                            <Row label="Payment Method" value={req.paymentMethod} />
                            <Row label="Bank Name" value={req.bankName} />
                            <Row label="Account Holder" value={req.accountHolder} />
                            <Row label="Account Number" value={req.accountNo} />
                            <Row label="IFSC Code" value={req.ifsc} />
                            <Row label="UPI ID" value={req.upiId} />
                            <Row label="Request Date & Time" value={req.requestDate} />
                            <Row label="User IP Address" value={req.ip} />
                            <Row label="Requested From" value={req.requestedFrom} />
                        </div>
                    )}

                    {tab === 'action' && (
                        <div>
                            <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: 'bold' }}>Section C – Admin Action Panel</p>
                            {req.status !== 'Pending' ? (
                                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '16px', color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>
                                    Actions only available for <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Pending</span> requests.
                                    <br /><span style={{ fontSize: '12px', marginTop: '4px', display: 'inline-block' }}>Current status: <StatusBadge status={req.status} /></span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>Modify Charges</label>
                                        <input type="number" value={charges} onChange={e => setCharges(e.target.value)}
                                            style={{ width: '100%', background: '#202940', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '10px 16px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>Admin Note</label>
                                        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Optional note..."
                                            style={{ width: '100%', background: '#202940', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '10px 16px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>Rejection Reason</label>
                                        <input type="text" value={rejReason} onChange={e => setRejReason(e.target.value)} placeholder="Required if rejecting..."
                                            style={{ width: '100%', background: '#202940', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '10px 16px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '8px' }}>
                                        <button onClick={() => handleAction('Approved')} disabled={loading}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '4px', color: 'white', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer', background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}>
                                            <Check style={{ width: 16, height: 16 }} /> Approve
                                        </button>
                                        <button onClick={() => handleAction('Rejected')} disabled={loading}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '4px', color: 'white', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer', background: '#ef4444' }}>
                                            <XCircle style={{ width: 16, height: 16 }} /> Reject
                                        </button>
                                        <button onClick={() => handleAction('On Hold')} disabled={loading}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '4px', color: 'white', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer', background: '#9333ea' }}>
                                            <Clock style={{ width: 16, height: 16 }} /> Put On Hold
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'audit' && (
                        <div>
                            <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: 'bold' }}>Section D – Audit Log</p>
                            <Row label="Is Auto Approved" value="No" />
                            <Row label="Approved By" value={req.handledBy} />
                            <Row label="Approved At" value={req.status === 'Approved' ? req.updatedAt : '—'} />
                            <Row label="Rejected By" value={req.status === 'Rejected' ? req.handledBy : '—'} />
                            <Row label="Rejected At" value={req.status === 'Rejected' ? req.updatedAt : '—'} />
                            <Row label="Txn Reference No." value={req.txnId} />
                            <Row label="Payment Gateway" value="Manual" />

                            <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold' }}>Activity Timeline</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { time: req.requestDate, label: 'Withdrawal Requested', by: req.clientName, color: '#f59e0b' },
                                    req.status !== 'Pending' && { time: req.updatedAt, label: `Status changed to ${req.status}`, by: req.handledBy, color: STATUS_CONFIG[req.status]?.color },
                                ].filter(Boolean).map((ev, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '6px', flexShrink: 0, background: ev.color }}></div>
                                        <div>
                                            <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '500', margin: 0 }}>{ev.label}</p>
                                            <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>{ev.time} · by <span style={{ color: '#94a3b8' }}>{ev.by}</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <ConfirmDialog
                    open={!!confirm}
                    title={confirm?.type === 'Rejected' ? 'Reject Withdrawal?' : confirm?.type === 'On Hold' ? 'Put On Hold?' : 'Approve Withdrawal?'}
                    message={confirm?.type === 'Rejected' ? 'This action will reject the withdrawal request. This cannot be undone.' : confirm?.type === 'On Hold' ? 'Request will be put on hold pending further review.' : 'Confirm approval. The amount will be processed for transfer.'}
                    danger={confirm?.type === 'Rejected'}
                    onConfirm={doAction}
                    onCancel={() => setConfirm(null)}
                />
                {loading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, borderRadius: '8px' }}>
                        <div style={{ width: '32px', height: '32px', border: '4px solid #4caf50', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const WithdrawalRequestsPage = () => {
    const [data, setData] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getRequests({ type: 'WITHDRAW' });
            setData(res.map(r => ({
                id: r.id,
                txnId: `TXN-${r.id}`,
                clientName: r.full_name || r.username,
                clientId: r.username,
                amount: parseFloat(r.amount),
                charges: 0, // Placeholder if not in DB
                netAmount: parseFloat(r.amount), // Adjusted if charges added
                availableBalance: parseFloat(r.current_balance || 0),
                withdrawableBalance: parseFloat(r.withdrawable_balance || 0),
                status: r.status,
                requestDate: new Date(r.created_at).toLocaleString(),
                requestedFrom: 'App',
                handledBy: r.processed_by || '—',
                updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleString() : '—',
                email: r.email || '—',
                phone: r.mobile || '—',
                kyc: r.kyc_status || 'PENDING',
                accountType: r.account_type || '—',
                broker: r.broker_name || '—',
                bankName: r.bank_name || '—',
                accountHolder: r.account_holder || '—',
                accountNo: r.account_number || '—',
                ifsc: r.ifsc_code || '—',
                upiId: r.upi_id || '—',
                paymentMethod: r.payment_method || '—'
            })));
        } catch (err) {
            addToast('Failed to fetch requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [brokerFilter, setBrokerFilter] = useState('');
    const [minAmt, setMinAmt] = useState('');
    const [maxAmt, setMaxAmt] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [detailReq, setDetailReq] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [bulkConfirm, setBulkConfirm] = useState(null);
    const toastId = useRef(0);

    const addToast = (msg, type = 'success') => {
        const id = ++toastId.current;
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    const applyFilters = () => {
        let d = [...data];
        if (search) d = d.filter(r => r.clientName.toLowerCase().includes(search.toLowerCase()) || r.clientId.toLowerCase().includes(search.toLowerCase()) || r.txnId.toLowerCase().includes(search.toLowerCase()));
        if (statusFilter) d = d.filter(r => r.status === statusFilter);
        if (brokerFilter) d = d.filter(r => r.broker === brokerFilter);
        if (minAmt) d = d.filter(r => r.amount >= Number(minAmt));
        if (maxAmt) d = d.filter(r => r.amount <= Number(maxAmt));
        setFiltered(d);
    };

    const resetFilters = () => {
        setSearch(''); setStatusFilter(''); setBrokerFilter(''); setMinAmt(''); setMaxAmt('');
        setFiltered(data);
    };

    useEffect(() => { applyFilters(); }, [data]);

    const handleAction = async (id, type, meta) => {
        try {
            await updateRequestStatus(id, type, meta.note || meta.rejReason);
            addToast(`Withdrawal ${id} — ${type} successfully!`, type === 'Rejected' ? 'error' : 'success');
            fetchData();
        } catch (err) {
            addToast('Action failed: ' + err.message, 'error');
        }
    };

    const doBulkAction = () => {
        setData(prev => prev.map(r => selectedRows.includes(r.id) && r.status === 'Pending' ? { ...r, status: bulkConfirm.type, handledBy: 'Admin001', updatedAt: new Date().toLocaleString() } : r));
        addToast(`${selectedRows.length} requests ${bulkConfirm.type}!`, bulkConfirm.type === 'Rejected' ? 'error' : 'success');
        setSelectedRows([]);
        setBulkConfirm(null);
    };

    const toggleRow = (id) => setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    const toggleAll = () => setSelectedRows(selectedRows.length === filtered.length ? [] : filtered.map(r => r.id));

    const stats = {
        total: data.length,
        pending: data.filter(r => r.status === 'Pending').length,
        approved: data.filter(r => r.status === 'Approved').length,
        rejected: data.filter(r => r.status === 'Rejected').length,
        totalAmt: data.reduce((s, r) => s + r.amount, 0),
        processing: data.filter(r => r.status === 'Processing').reduce((s, r) => s + r.amount, 0),
    };

    const brokers = [...new Set(data.map(r => r.broker))];

    const STAT_CARDS = [
        { label: 'Total Requests', value: stats.total, color: '#4caf50', icon: 'fa-list-check' },
        { label: 'Pending', value: stats.pending, color: '#f59e0b', icon: 'fa-clock' },
        { label: 'Approved', value: stats.approved, color: '#4caf50', icon: 'fa-circle-check' },
        { label: 'Rejected', value: stats.rejected, color: '#ef4444', icon: 'fa-circle-xmark' },
        { label: 'Total Amount', value: fmt(stats.totalAmt), color: '#3b82f6', icon: 'fa-indian-rupee-sign' },
        { label: 'Processing Amount', value: fmt(stats.processing), color: '#a855f7', icon: 'fa-rotate' },
    ];

    const inputStyle = {
        width: '100%', background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '4px', padding: '10px 12px', color: 'white', fontSize: '14px',
        outline: 'none', boxSizing: 'border-box',
    };
    const selectStyle = { ...inputStyle, appearance: 'none', cursor: 'pointer' };

    return (
        <div className="main-content flex flex-col gap-[16px] w-full p-4">
            <style>{`
                .wd-row-pending { background: rgba(251,191,36,0.04); }
                .wd-row:hover { background: rgba(255,255,255,0.02); }
            `}</style>

            {/* ── Responsive Header ── */}
            <div className="card-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px' }}>
                <div className="card-header-success" style={{ padding: '16px 20px', borderRadius: 0, marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                        Withdrawal Requests
                    </h2>

                    {selectedRows.length > 0 && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: '500' }}>{selectedRows.length} selected</span>
                            <div className="flex gap-2">
                                <button onClick={() => setBulkConfirm({ type: 'Approved' })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', color: 'white', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', background: 'rgba(255,255,255,0.15)' }}>
                                    <Check style={{ width: 13, height: 13 }} /> Bulk Approve
                                </button>
                                <button onClick={() => setBulkConfirm({ type: 'Rejected' })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', color: 'white', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', background: 'rgba(239,68,68,0.5)' }}>
                                    <XCircle style={{ width: 13, height: 13 }} /> Bulk Reject
                                </button>
                            </div>
                            <button onClick={() => setSelectedRows([])} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X style={{ width: 14, height: 14 }} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Responsive Stats Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 shrink-0">
                {STAT_CARDS.map((s) => (
                    <div key={s.label} className="card-panel" style={{ padding: '14px', borderRadius: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.color + '22', marginBottom: '8px' }}>
                            <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: '13px' }}></i>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', margin: 0 }}>{s.label}</p>
                        <p style={{ color: 'white', fontSize: '16px', sm: '18px', fontWeight: 'bold', marginTop: '4px', marginBottom: 0 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Responsive Filters ── */}
            <div className="card-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div style={{ position: 'relative' }} className="sm:col-span-2 lg:col-span-1">
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b', pointerEvents: 'none' }} />
                        <input type="text" placeholder="Search..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ ...inputStyle, paddingLeft: '38px', borderRadius: '8px' }} />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...selectStyle, borderRadius: '8px' }}>
                            <option value="">Status: All</option>
                            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b', pointerEvents: 'none' }} />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <select value={brokerFilter} onChange={e => setBrokerFilter(e.target.value)} style={{ ...selectStyle, borderRadius: '8px' }}>
                            <option value="">Broker: All</option>
                            {brokers.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <ChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b', pointerEvents: 'none' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1">
                        <input type="number" placeholder="Min" value={minAmt} onChange={e => setMinAmt(e.target.value)} style={{ ...inputStyle, borderRadius: '8px' }} />
                        <input type="number" placeholder="Max" value={maxAmt} onChange={e => setMaxAmt(e.target.value)} style={{ ...inputStyle, borderRadius: '8px' }} />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-4">
                    <button onClick={resetFilters} className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                        <RotateCcw style={{ width: 14, height: 14 }} /> Reset
                    </button>
                    <button onClick={applyFilters} className="btn-primary btn-success-gradient px-6 py-2 rounded-lg text-xs font-bold shadow-lg shadow-green-500/10">
                        Apply Filter
                    </button>
                </div>
            </div>

            {/* ── Table Area ── */}
            <div className="card-panel" style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Showing <b style={{ color: 'white' }}>{filtered.length}</b> of <b style={{ color: 'white' }}>{data.length}</b> requests</span>
                </div>

                <div className="table-wrapper overflow-x-auto custom-scrollbar" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="table-standard custom-table" style={{ minWidth: '1300px' }}>
                        <thead>
                            <tr>
                                {['', 'Request ID', 'Txn ID', 'Client', 'Broker', 'Amount', 'Net Amount', 'Balance', 'Status', 'Request Date', 'Source', 'Handled By', 'Actions'].map((h, i) => (
                                    <th key={i} style={{ 
                                        textAlign: i === 12 ? 'center' : 'left',
                                        padding: '12px 16px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: '#94a3b8',
                                        width: i === 0 ? '50px' : 'auto'
                                    }}>
                                        {i === 0 ? (
                                            <input type="checkbox" checked={selectedRows.length === filtered.length && filtered.length > 0} onChange={toggleAll}
                                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#4caf50' }} />
                                        ) : h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={13} style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>No withdrawal requests found</td></tr>
                            ) : filtered.map(req => (
                                <tr key={req.id} className={`wd-row ${req.status === 'Pending' ? 'wd-row-pending' : ''}`}
                                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}>
                                    <td style={{ padding: '14px 16px' }}>
                                        <input type="checkbox" checked={selectedRows.includes(req.id)} onChange={() => toggleRow(req.id)}
                                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#4caf50' }} />
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#4caf50', fontFamily: 'monospace', fontWeight: '500' }}>{req.id}</td>
                                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>{req.txnId}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <p style={{ color: 'white', fontWeight: '500', margin: 0, fontSize: '13px' }}>{req.clientName}</p>
                                        <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>{req.clientId}</p>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#cbd5e1', fontSize: '13px' }}>{req.broker}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <p style={{ color: 'white', fontWeight: 'bold', margin: 0, fontSize: '13px', fontFamily: 'monospace' }}>{fmt(req.amount)}</p>
                                        <p style={{ color: '#64748b', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>Charges: {fmt(req.charges)}</p>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#4caf50', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>{fmt(req.netAmount)}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <p style={{ color: 'white', fontWeight: 'bold', margin: 0, fontSize: '13px', fontFamily: 'monospace' }}>{fmt(req.availableBalance)}</p>
                                        <p style={{ color: '#64748b', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>Withdrawable: {fmt(req.withdrawableBalance)}</p>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}><StatusBadge status={req.status} /></td>
                                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap' }}>{req.requestDate}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px',
                                            background: req.requestedFrom === 'App' ? 'rgba(59,130,246,0.2)' : 'rgba(100,116,139,0.2)',
                                            color: req.requestedFrom === 'App' ? '#60a5fa' : '#94a3b8'
                                        }}>{req.requestedFrom}</span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '12px' }}>{req.handledBy}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setDetailReq(req)}
                                                className="action-icon action-icon-view"
                                                title="View"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {req.status === 'Pending' && (
                                                <>
                                                    <button
                                                        onClick={() => setDetailReq(req)}
                                                        className="action-icon action-icon-edit"
                                                        title="Approve"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDetailReq(req)}
                                                        className="action-icon action-icon-delete"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>{filtered.length} records</span>
                    <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#288c6c', color: 'white', fontSize: '14px', fontWeight: 'bold', borderRadius: '4px' }}>1</div>
                </div>
            </div>

            {/* ── Detail Modal ── */}
            {detailReq && (
                <DetailModal req={detailReq} onClose={() => setDetailReq(null)} onAction={handleAction} />
            )}

            {/* ── Bulk Confirm ── */}
            <ConfirmDialog
                open={!!bulkConfirm}
                title={bulkConfirm?.type === 'Rejected' ? `Bulk Reject ${selectedRows.length} Requests?` : `Bulk Approve ${selectedRows.length} Requests?`}
                message={`This will ${bulkConfirm?.type === 'Rejected' ? 'reject' : 'approve'} all ${selectedRows.length} selected pending withdrawal requests.`}
                danger={bulkConfirm?.type === 'Rejected'}
                onConfirm={doBulkAction}
                onCancel={() => setBulkConfirm(null)}
            />

            {/* ── Toast ── */}
            <Toast toasts={toasts} remove={removeToast} />
        </div>
    );
};

export default WithdrawalRequestsPage;
