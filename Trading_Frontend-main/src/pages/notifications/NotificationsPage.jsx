import React, { useState, useEffect } from 'react';
import { Bell, Send, Trash2, X, CheckCheck, AlertTriangle } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';
import { createNotification, deleteNotification, getNotificationUsersByRole } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_OPTIONS = [
    { value: 'TRADER', label: 'Trading Clients' },
    { value: 'ADMIN', label: 'Admins' },
    { value: 'BROKER', label: 'Brokers' },
];

const FILTER_TABS = [
    { value: 'ALL', label: 'All' },
    { value: 'ADMIN', label: 'Admins' },
    { value: 'BROKER', label: 'Brokers' },
    { value: 'TRADER', label: 'Clients' },
];

const PAGE_SIZE = 15;

const NotificationsPage = () => {
    const { user } = useAuth();
    const { notifications, unreadCount, markAllRead, refetch } = useNotifications();

    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({ title: '', message: '' });
    const [activeTab, setActiveTab] = useState('ALL');

    // Role checkboxes (multi-select)
    const [selectedRoles, setSelectedRoles] = useState(['TRADER']);

    // User list for targeting
    const [userList, setUserList] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null); // notification id to delete
    const [deleting, setDeleting] = useState(false);

    const isSuperAdmin = user?.role === 'SUPERADMIN';

    // Filter notifications by tab
    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'ALL') return true;
        return n.target_role === activeTab;
    });

    const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
    const paginated = filteredNotifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Reset page when tab changes
    useEffect(() => { setPage(1); }, [activeTab]);

    // Fetch users when selected roles change
    useEffect(() => {
        if (!showModal || selectedRoles.length === 0) {
            setUserList([]);
            return;
        }
        fetchUsersForRoles(selectedRoles);
    }, [selectedRoles.join(','), showModal]);

    const fetchUsersForRoles = async (roles) => {
        setLoadingUsers(true);
        setSelectedUsers([]);
        setUserSearch('');
        try {
            const results = await Promise.all(roles.map(r => getNotificationUsersByRole(r)));
            const allUsers = results.flat();
            setUserList(allUsers);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setUserList([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const toggleRole = (role) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const toggleUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const filteredUsers = userList.filter(u =>
        !userSearch ||
        (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(userSearch.toLowerCase())
    );

    const toggleSelectAll = () => {
        const allSelected = filteredUsers.every(u => selectedUsers.includes(u.id));
        if (allSelected) {
            setSelectedUsers(prev => prev.filter(id => !filteredUsers.some(u => u.id === id)));
        } else {
            setSelectedUsers(prev => [...new Set([...prev, ...filteredUsers.map(u => u.id)])]);
        }
    };

    const handleSend = async () => {
        if (!form.title.trim() || !form.message.trim()) return;
        if (selectedUsers.length === 0) return alert('Please select at least one user');
        try {
            setSending(true);
            await createNotification({
                title: form.title,
                message: form.message,
                type: 'info',
                target_role: selectedRoles.length === 3 ? 'ALL' : selectedRoles[0] || 'ALL',
                target_user_ids: selectedUsers,
            });
            setShowModal(false);
            setForm({ title: '', message: '' });
            setSelectedUsers([]);
            setSelectedRoles(['TRADER']);
            setUserList([]);
            refetch();
        } catch (err) {
            alert(err.message);
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            setDeleting(true);
            await deleteNotification(deleteConfirm);
            setDeleteConfirm(null);
            refetch();
        } catch (err) {
            alert(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUsers([]);
        setSelectedRoles(['TRADER']);
        setUserList([]);
        setForm({ title: '', message: '' });
    };

    const getSentToLabel = (n) => {
        if (n.target_user_ids) {
            const count = n.target_user_ids.split(',').length;
            return `${count} user${count > 1 ? 's' : ''}`;
        }
        return n.target_role || 'ALL';
    };

    return (
        <div className="flex flex-col h-full bg-[#1a2035] space-y-4 overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {isSuperAdmin && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-[#5cb85c] hover:bg-[#4cae4c] text-white text-[11px] font-bold py-2.5 px-5 rounded shadow uppercase tracking-wider transition-all active:scale-95"
                        >
                            <Send className="w-3.5 h-3.5" /> Send Notification
                        </button>
                    )}
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] font-bold py-2.5 px-4 rounded uppercase tracking-wider transition-all"
                        >
                            <CheckCheck className="w-3.5 h-3.5 text-green-400" /> Mark All Read
                        </button>
                    )}
                </div>
                {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {unreadCount} unread
                    </span>
                )}
            </div>

            {/* Filter Tabs */}
            {isSuperAdmin && (
                <div className="flex gap-1 bg-[#151c2c] rounded-lg p-1 w-fit">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-4 py-2 text-[12px] font-bold rounded-md transition-all uppercase tracking-wider ${
                                activeTab === tab.value
                                    ? 'bg-[#5cb85c] text-white shadow'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="bg-[#1f283e]/40 rounded-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px] custom-table">
                        <thead>
                            <tr className="text-white text-base font-bold">
                                <th className="px-6 py-4 border-b border-white/5 w-[5%]"></th>
                                <th className="px-4 py-4 border-b border-white/5 w-[18%]">Title</th>
                                <th className="px-4 py-4 border-b border-white/5">Message</th>
                                <th className="px-4 py-4 border-b border-white/5 w-[12%]">Sent To</th>
                                <th className="px-4 py-4 border-b border-white/5 w-[14%] text-right pr-8">Delivered At</th>
                                {isSuperAdmin && <th className="px-4 py-4 border-b border-white/5 w-[5%]"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan={isSuperAdmin ? 6 : 5} className="px-6 py-16 text-center text-slate-500">
                                        <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        No notifications yet
                                    </td>
                                </tr>
                            )}
                            {paginated.map((n) => {
                                const isUnread = !n.is_read;
                                return (
                                    <tr key={n.id} className={`transition-colors align-top ${isUnread ? 'bg-white/3' : 'hover:bg-white/3'}`}>
                                        <td className="px-6 py-4">
                                            {isUnread && <span className="block w-2 h-2 rounded-full bg-green-400 mt-1" />}
                                        </td>
                                        <td className="px-4 py-4 text-[13px] font-bold text-slate-200 uppercase leading-tight">
                                            {n.title}
                                        </td>
                                        <td className="px-4 py-4 text-[13px] text-slate-400 leading-relaxed">
                                            {n.message}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase bg-white/5 px-2 py-1 rounded">
                                                {getSentToLabel(n)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-[11px] text-slate-400 text-right pr-8 whitespace-nowrap">
                                            {n.created_at ? (
                                                <>
                                                    <div>{new Date(n.created_at).toLocaleDateString()}</div>
                                                    <div className="mt-0.5">{new Date(n.created_at).toLocaleTimeString()}</div>
                                                </>
                                            ) : '—'}
                                        </td>
                                        {isSuperAdmin && (
                                            <td className="px-4 py-4">
                                                <button
                                                    onClick={() => setDeleteConfirm(n.id)}
                                                    className="p-1.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center gap-2 py-4 select-none">
                    <button
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="text-[#8890a5] text-lg font-bold cursor-pointer hover:text-white disabled:opacity-30 transition-colors"
                    >&lt;&lt;</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .map((p, idx, arr) => (
                            <React.Fragment key={p}>
                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                    <span className="text-[#8890a5] font-bold px-1">...</span>
                                )}
                                <button
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all
                                        ${p === page ? 'bg-white/90 text-[#1a2035] shadow-md' : 'bg-white/10 text-[#8890a5] hover:bg-white/20 hover:text-white'}`}
                                >{p}</button>
                            </React.Fragment>
                        ))
                    }
                    <button
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                        className="text-[#8890a5] text-lg font-bold cursor-pointer hover:text-white disabled:opacity-30 transition-colors"
                    >&gt;&gt;</button>
                </div>
            )}

            {/* Send Notification Modal — SUPERADMIN only */}
            {showModal && isSuperAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1f283e] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-white/3 shrink-0">
                            <div className="flex items-center gap-2">
                                <Send className="w-4 h-4 text-green-400" />
                                <span className="text-white text-[14px] font-bold">Send Notification</span>
                            </div>
                            <button onClick={closeModal} className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Notification title..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Message</label>
                                <textarea
                                    rows={3}
                                    value={form.message}
                                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                    placeholder="Notification message..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 resize-none"
                                />
                            </div>

                            {/* Send To — Checkboxes */}
                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Send To</label>
                                <div className="flex gap-3">
                                    {ROLE_OPTIONS.map(({ value, label }) => (
                                        <label
                                            key={value}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-[12px] font-bold ${
                                                selectedRoles.includes(value)
                                                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedRoles.includes(value)}
                                                onChange={() => toggleRole(value)}
                                                className="w-3.5 h-3.5 accent-green-500"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* User List */}
                            {selectedRoles.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                            Select Users ({selectedUsers.length} selected)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={toggleSelectAll}
                                            className="text-[11px] font-bold text-green-400 hover:text-green-300 transition-colors uppercase tracking-wider"
                                        >
                                            {filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.includes(u.id))
                                                ? 'Deselect All'
                                                : 'Select All'}
                                        </button>
                                    </div>

                                    <input
                                        type="text"
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                        placeholder="Search by name or username..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 mb-2"
                                    />

                                    <div className="bg-[#151c2c] border border-white/10 rounded-lg max-h-48 overflow-y-auto">
                                        {loadingUsers ? (
                                            <div className="px-4 py-8 text-center text-slate-500 text-xs">Loading users...</div>
                                        ) : filteredUsers.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-slate-500 text-xs">No users found</div>
                                        ) : (
                                            filteredUsers.map(u => (
                                                <label
                                                    key={u.id}
                                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(u.id)}
                                                        onChange={() => toggleUser(u.id)}
                                                        className="w-4 h-4 accent-green-500"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-white text-[13px] font-medium">{u.full_name || u.username}</span>
                                                        {u.full_name && (
                                                            <span className="text-slate-500 text-[11px] ml-2">@{u.username}</span>
                                                        )}
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                        u.role === 'TRADER' ? 'bg-blue-500/20 text-blue-400' :
                                                        u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                                                        'bg-orange-500/20 text-orange-400'
                                                    }`}>{u.role}</span>
                                                    <span className="text-slate-600 text-[10px] font-mono">#{u.id}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/8 bg-white/2 shrink-0">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-[12px] font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={sending || !form.title.trim() || !form.message.trim() || selectedUsers.length === 0}
                                className="flex items-center gap-2 px-5 py-2 text-[12px] font-bold bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg transition-all active:scale-95"
                            >
                                <Send className="w-3.5 h-3.5" />
                                {sending ? 'Sending...' : `Send (${selectedUsers.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1f283e] border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                <span className="text-white text-[14px] font-bold">Delete Notification</span>
                            </div>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="px-5 py-6">
                            <p className="text-slate-300 text-[13px]">
                                Are you sure you want to delete this notification? This action cannot be undone.
                            </p>
                        </div>
                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/8">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-5 py-2.5 text-[12px] font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-5 py-2.5 text-[12px] font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-all active:scale-95"
                            >
                                {deleting ? 'Deleting...' : 'Delete Notification'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
