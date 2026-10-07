import React, { useState, useEffect, useRef } from 'react';
import { Ticket, Send, History, CheckCircle, AlertCircle, MessageSquare, Headphones, ShieldCheck, Loader2, ChevronDown, ChevronUp, Clock, Trash2 } from 'lucide-react';
import { getSupportTickets, createSupportTicket, getTicketMessages, sendTicketMessage, resolveTicket, deleteTicket, SOCKET_URL } from '../../services/api';
import { io } from 'socket.io-client';

const CATEGORIES = [
    'Order Not Executed',
    'Wrong P&L',
    'Margin / Balance',
    'Withdrawal Issue',
    'Position Not Closed',
    'Login / Access',
];

const PRIORITY_MAP = {
    'Order Not Executed': 'HIGH',
    'Wrong P&L': 'HIGH',
    'Margin / Balance': 'HIGH',
    'Withdrawal Issue': 'HIGH',
    'Position Not Closed': 'HIGH',
    'Login / Access': 'NORMAL',
};

const statusConfig = {
    PENDING: { label: 'Pending', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400' },
    RESOLVED: { label: 'Resolved', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
};

// ── Chat bubble for a single message ──────────────────
const ChatBubble = ({ msg, isMine }) => (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} gap-0.5`}>
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider px-1">
            {isMine ? 'You' : `${msg.username} (${msg.sender_role})`}
        </span>
        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
            ${isMine
                ? 'bg-green-600 text-white rounded-tr-sm'
                : 'bg-white/10 text-slate-200 rounded-tl-sm border border-white/10'}`}>
            {msg.message}
        </div>
        <span className="text-[9px] text-slate-600 px-1">
            {new Date(msg.created_at).toLocaleString()}
        </span>
    </div>
);

// ── Expanded ticket chat panel ─────────────────────────
const TicketChat = ({ ticket, currentUserId, isAdmin, onResolve }) => {
    const [messages, setMessages] = useState([]);
    const [loadingMsgs, setLoadingMsgs] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [resolving, setResolving] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingMsgs(true);
            try {
                const data = await getTicketMessages(ticket.id);
                if (!cancelled) setMessages(data || []);
            } catch (_) { }
            finally { if (!cancelled) setLoadingMsgs(false); }
        };
        load();

        const handleNewMessage = (payload) => {
            if (payload.ticketId === ticket.id) {
                setMessages(prev => {
                    if (prev.some(m => m.id === payload.message.id)) return prev;
                    return [...prev, payload.message];
                });
                getTicketMessages(ticket.id).catch(() => {});
            }
        };

        globalThis.onSupportMessageReceivedWeb = handleNewMessage;

        return () => { 
            cancelled = true; 
            if (globalThis.onSupportMessageReceivedWeb === handleNewMessage) {
                globalThis.onSupportMessageReceivedWeb = null;
            }
        };
    }, [ticket.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        try {
            await sendTicketMessage(ticket.id, text.trim());
            setText('');
            const data = await getTicketMessages(ticket.id);
            setMessages(data || []);
        } catch (_) { }
        finally { setSending(false); }
    };

    const handleResolve = async () => {
        setResolving(true);
        try {
            await resolveTicket(ticket.id);
            onResolve(ticket.id);
        } catch (_) { }
        finally { setResolving(false); }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
        <div className="border-t border-white/5 pt-4 space-y-3">
            {/* Messages */}
            <div className="h-64 overflow-y-auto space-y-3 px-1 pr-2 scrollbar-thin">
                {loadingMsgs ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-5 h-5 animate-spin text-green-400" />
                    </div>
                ) : messages.length === 0 ? (
                    <p className="text-center text-slate-600 text-xs py-8">No messages yet</p>
                ) : (
                    messages.map(msg => (
                        <ChatBubble
                            key={msg.id}
                            msg={msg}
                            isMine={msg.sender_id === currentUserId}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input — disabled if resolved */}
            {ticket.status === 'RESOLVED' ? (
                <div className="flex items-center gap-2 py-2 px-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400 font-black uppercase tracking-widest">Ticket Resolved</span>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                        placeholder="Type your message… (Enter to send)"
                        className="flex-1 bg-black/30 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none transition-all"
                    />
                    <div className="flex sm:flex-col gap-2">
                        <button
                            onClick={handleSend}
                            disabled={sending || !text.trim()}
                            className="p-3 sm:p-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-xl transition-all flex items-center justify-center flex-1 sm:flex-none"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                        </button>
                        {isAdmin && (
                            <button
                                onClick={handleResolve}
                                disabled={resolving}
                                title="Mark as Resolved"
                                className="p-3 sm:p-2.5 bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-40 rounded-xl transition-all flex items-center justify-center flex-1 sm:flex-none"
                            >
                                {resolving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <CheckCircle className="w-4 h-4 text-white" />}
                            </button>
                        )}
                    </div>
                </div>
            )}
            {isAdmin && ticket.status !== 'RESOLVED' && (
                <p className="text-[9px] text-slate-600 text-right">Green tick = Mark as Resolved</p>
            )}
        </div>
    );
};

// ── Ticket card ────────────────────────────────────────
const TicketCard = ({ ticket, currentUserId, isAdmin, onResolve, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const st = statusConfig[ticket.status] || statusConfig.PENDING;

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteTicket(ticket.id);
            onDelete(ticket.id);
        } catch (_) { }
        finally { setDeleting(false); setConfirmDel(false); }
    };

    return (
        <>
            {/* Confirm Modal */}
            {confirmDel && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDel(false)}>
                    <div className="bg-[#1f283e] border border-red-500/30 rounded-2xl p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Delete Ticket</h4>
                                <p className="text-[10px] text-slate-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                            Are you sure you want to delete ticket <span className="text-white font-bold">#{ticket.id}</span>? All messages in this ticket will also be deleted permanently.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setConfirmDel(false)}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-[#1f283e] rounded-2xl border border-white/10 overflow-hidden shadow-lg">
                <div
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpanded(v => !v)}
                >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center border border-white/5 shrink-0">
                            <Ticket className="w-5 h-5 text-green-500/50" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                                    #{ticket.id}
                                </span>
                                {ticket.unread_count > 0 && (
                                    <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                                        {ticket.unread_count} New
                                    </span>
                                )}
                                {isAdmin && (
                                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px] sm:max-w-none">
                                        {ticket.username} ({ticket.user_role})
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-bold text-white mt-0.5 truncate">{ticket.subject}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{new Date(ticket.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t border-white/5 sm:border-none pt-3 sm:pt-0">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 ${st.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                            {/* Delete button */}
                            <button
                                onClick={e => { e.stopPropagation(); setConfirmDel(true); }}
                                disabled={deleting}
                                title="Delete ticket"
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-white" />
                            </button>
                            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </div>
                    </div>
                </div>

                {expanded && (
                    <div className="px-5 pb-5">
                        <TicketChat
                            ticket={ticket}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            onResolve={onResolve}
                        />
                    </div>
                )}
            </div>
        </>
    );
};

// ── Main Page ──────────────────────────────────────────
const RaiseTicketPage = ({ user }) => {
    const [view, setView] = useState('new');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | PENDING | RESOLVED
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, text: '', type: '' });

    const role = user?.role || '';
    const isAdmin = role === 'SUPERADMIN' || role === 'ADMIN';

    const [formData, setFormData] = useState({ issueType: 'Technical', subject: '', description: '' });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchTickets();

        // Setup Socket.IO connection for real-time support tickets and messaging
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            socket.emit('join', { userId: user?.id, role: user?.role });
        });

        socket.on('support_message_received', (data) => {
            // Trigger chat panel message update if open
            if (globalThis.onSupportMessageReceivedWeb) {
                globalThis.onSupportMessageReceivedWeb(data);
            }
            // Silent refresh of ticket list to update unread badge counts
            fetchTicketsSilently();
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.id, user?.role]);

    const fetchTicketsSilently = async () => {
        try {
            const data = await getSupportTickets();
            setTickets(data || []);
        } catch (_) {}
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await getSupportTickets();
            setTickets(data || []);
        } catch (_) { showToast('Failed to load tickets', 'error'); }
        finally { setLoading(false); }
    };

    const showToast = (text, type = 'success') => {
        setToast({ show: true, text, type });
        setTimeout(() => setToast({ show: false, text: '', type: '' }), 3000);
    };

    const validate = () => {
        const errs = {};
        if (!formData.subject.trim()) errs.subject = 'Subject is required';
        if (!formData.description.trim()) errs.description = 'Description is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            await createSupportTicket({
                subject: formData.subject,
                message: formData.description,
                priority: PRIORITY_MAP[formData.issueType] || 'NORMAL',
            });
            showToast('Ticket submitted successfully!', 'success');
            setFormData({ issueType: 'Technical', subject: '', description: '' });
            setErrors({});
            await fetchTickets();
            setView('history');
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to submit ticket', 'error');
        } finally { setSubmitting(false); }
    };

    const handleTicketResolved = (ticketId) => {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'RESOLVED' } : t));
        showToast('Ticket marked as resolved!', 'success');
    };

    const handleTicketDeleted = (ticketId) => {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
        showToast('Ticket deleted', 'success');
    };

    const pendingCount = tickets.filter(t => t.status === 'PENDING').length;
    const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

    const visibleTickets = tickets.filter(t =>
        statusFilter === 'ALL' ? true : t.status === statusFilter
    );

    return (
        <div className="main-content custom-scrollbar" style={{ overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>

            {/* Toast */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-lg shadow-2xl border text-sm font-bold
                    ${toast.type === 'success' ? 'bg-[#1b2a21] border-green-500/30 text-green-400' : 'bg-[#2a1b1b] border-red-500/30 text-red-400'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.text}
                </div>
            )}

            {/* Header */}
            <div className="page-header-responsive">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/20">
                        <Headphones className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Support Center</h1>
                        <p className="text-slate-500 text-xs">
                            {isAdmin ? `${tickets.length} total — ${pendingCount} pending` : 'Raise a ticket or view your history'}
                        </p>
                    </div>
                </div>

                {/* View tabs */}
                <div className="bg-[#1a2235] p-1.5 rounded-xl border border-white/5 flex gap-1 w-full sm:w-auto overflow-x-auto [scrollbar-width:none]">
                    {!isAdmin && (
                        <button onClick={() => setView('new')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap
                                ${view === 'new' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                            <Ticket size={13} /> New Ticket
                        </button>
                    )}
                    <button onClick={() => setView('history')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap
                            ${view === 'history' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                        <History size={13} />
                        {isAdmin ? 'All Tickets' : 'My Tickets'}
                        {pendingCount > 0 && (
                            <span className="ml-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-black">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

                {/* ── Main ── */}
                <div className="xl:col-span-2 space-y-4">

                    {/* NEW TICKET FORM */}
                    {view === 'new' && !isAdmin && (
                        <div className="card-panel" style={{ overflow: 'hidden' }}>
                            <div className="card-panel-header">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Raise New Ticket</h3>
                            </div>
                            <form onSubmit={handleSubmit} className="card-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Category */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue Category</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {CATEGORIES.map(cat => (
                                            <button key={cat} type="button"
                                                onClick={() => setFormData({ ...formData, issueType: cat })}
                                                className={`px-4 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-tight transition-all
                                                    ${formData.issueType === cat
                                                        ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                                        : 'bg-black/20 border-white/10 text-slate-400 hover:border-white/20'}`}>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Subject */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</label>
                                    <input type="text" value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Brief title of your issue"
                                        className={`w-full bg-black/30 border ${errors.subject ? 'border-red-500/50' : 'border-white/10 focus:border-green-500/50'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all`} />
                                    {errors.subject && <p className="text-[10px] text-red-400 font-bold">{errors.subject}</p>}
                                </div>
                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                                    <textarea value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={5} placeholder="Explain your issue in detail..."
                                        className={`w-full bg-black/30 border ${errors.description ? 'border-red-500/50' : 'border-white/10 focus:border-green-500/50'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all resize-none`} />
                                    {errors.description && <p className="text-[10px] text-red-400 font-bold">{errors.description}</p>}
                                </div>
                                <div className="action-row" style={{ justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button type="button"
                                        onClick={() => setFormData({ issueType: 'Technical', subject: '', description: '' })}
                                        className="btn-secondary btn-sm">
                                        Reset
                                    </button>
                                    <button type="submit" disabled={submitting}
                                        className="btn-primary btn-sm btn-success-gradient">
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {submitting ? 'Submitting...' : 'Submit Ticket'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TICKET LIST */}
                    {(view === 'history' || isAdmin) && (
                        <>
                            {/* Status filter tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                                {[
                                    { key: 'ALL', label: 'All', count: tickets.length },
                                    { key: 'PENDING', label: 'Pending', count: pendingCount },
                                    { key: 'RESOLVED', label: 'Resolved', count: resolvedCount },
                                ].map(tab => (
                                    <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap
                                            ${statusFilter === tab.key
                                                ? tab.key === 'PENDING' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                                    : tab.key === 'RESOLVED' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                        : 'bg-white/10 border-white/20 text-white'
                                                : 'bg-transparent border-white/10 text-slate-500 hover:text-white hover:border-white/20'}`}>
                                        {tab.key === 'PENDING' && <Clock size={11} />}
                                        {tab.key === 'RESOLVED' && <CheckCircle size={11} />}
                                        {tab.label}
                                        <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px]">{tab.count}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Cards */}
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                                    </div>
                                ) : visibleTickets.length === 0 ? (
                                    <div className="bg-[#1f283e] rounded-2xl border border-white/10 py-16 flex flex-col items-center justify-center text-center">
                                        <MessageSquare size={32} className="text-slate-700 mb-4" />
                                        <h4 className="text-white font-black uppercase tracking-widest text-sm">No Tickets</h4>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold mt-1">
                                            {statusFilter === 'ALL' ? 'No support tickets yet.' : `No ${statusFilter.toLowerCase()} tickets.`}
                                        </p>
                                    </div>
                                ) : (
                                    visibleTickets.map(ticket => (
                                        <TicketCard
                                            key={ticket.id}
                                            ticket={ticket}
                                            currentUserId={user?.id}
                                            isAdmin={isAdmin}
                                            onResolve={handleTicketResolved}
                                            onDelete={handleTicketDeleted}
                                        />
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Sidebar ── */}
                <div className="space-y-4">
                    {/* Stats */}
                    <div className="card-panel" style={{ overflow: 'hidden' }}>
                        <div className="card-panel-header">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Stats</h4>
                        </div>
                        <div className="card-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-xs text-slate-400">Total</span>
                                <span className="text-white font-black text-sm">{tickets.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-xs text-slate-400">Pending</span>
                                <span className="text-amber-400 font-black text-sm">{pendingCount}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-xs text-slate-400">Resolved</span>
                                <span className="text-emerald-400 font-black text-sm">{resolvedCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Privacy */}
                    <div className="card-panel" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        <div>
                            <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Data Privacy</h5>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                All tickets are encrypted and only accessible to authorized support staff.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RaiseTicketPage;
