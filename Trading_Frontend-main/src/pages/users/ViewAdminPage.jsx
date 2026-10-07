import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, User, Shield } from 'lucide-react';
import * as api from '../../services/api';

const MENU_GROUPS = [
    {
        group: 'Dashboard',
        items: [
            { id: 'dashboard', label: 'Dashboard (Live M2M)' },
            { id: 'kite-dashboard', label: 'Kite Dashboard' },
            { id: 'voice-modulation', label: 'Voice Modulation' },
            { id: 'market-watch', label: 'Market Watch' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'user-notifications', label: 'Sent Message' },
        ],
    },
    {
        group: 'Positions & Trades',
        items: [
            { id: 'active-positions', label: 'Active Positions' },
            { id: 'closed-positions', label: 'Closed Positions' },
            { id: 'trades', label: 'Trades' },
            { id: 'closed-trades', label: 'Closed Trades' },
            { id: 'deleted-trades', label: 'Deleted Trades' },
            { id: 'group-trades', label: 'Group Trades' },
            { id: 'pending-orders', label: 'Pending Orders' },
        ],
    },
    {
        group: 'User Management',
        items: [
            { id: 'trading-clients', label: 'Trading Clients' },
            { id: 'brokers', label: 'Brokers' },
        ],
    },
    {
        group: 'Wallet & Finance',
        items: [
            { id: 'funds', label: 'Trader Funds' },
            { id: 'withdrawal-requests', label: 'Withdrawal Requests' },
            { id: 'deposit-requests', label: 'Deposit Requests' },
            { id: 'negative-balance', label: 'Negative Balance Txns' },
        ],
    },
    {
        group: 'Accounts',
        items: [
            { id: 'accounts', label: 'Accounts' },
            { id: 'broker-accounts', label: 'Broker Accounts' },
        ],
    },
    {
        group: 'Reports & Logs',
        items: [
            { id: 'action-ledger', label: 'Action Ledger' },
            { id: 'ip-logins', label: 'IP Logins' },
            { id: 'trade-ip-tracking', label: 'Trade IP Tracking' },
        ],
    },
    {
        group: 'Settings',
        items: [
            { id: 'tickers', label: 'Tickers' },
            { id: 'banned', label: 'Banned Limit Orders' },
            { id: 'bank', label: 'Bank Details' },
            { id: 'new-client-bank', label: 'Bank Details For New Clients' },
            { id: 'global-updation', label: 'Global Updation' },
            { id: 'change-password', label: 'Change Login Password' },
            { id: 'change-transaction-password', label: 'Change Transaction Password' },
            { id: 'expiry-rules', label: 'Expiry Rules' },
        ],
    },
    {
        group: 'Other',
        items: [
            { id: 'support', label: 'Support Tickets' },
        ],
    },
];

const ViewAdminPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [adminData, setAdminData] = useState(null);
    const [menuPerms, setMenuPerms] = useState([]);
    const [logoPath, setLogoPath] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [users, permsRes, panelRes] = await Promise.all([
                    api.getClients({ role: 'ADMIN' }),
                    api.getAdminMenuPermissions(id),
                    api.getAdminPanelSettings(id),
                ]);

                const admin = (users || []).find(u => String(u.id) === String(id));
                if (!admin) throw new Error('Admin not found');
                setAdminData(admin);

                setMenuPerms(permsRes?.menuPermissions || []);

                if (panelRes?.logoPath) {
                    setLogoPath(panelRes.logoPath);
                }
            } catch (err) {
                setError(err.message || 'Failed to load admin data');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                Loading admin details...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                    onClick={() => navigate('/admins')}
                    className="text-xs px-4 py-2 rounded text-white"
                    style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                >
                    Back to Admins
                </button>
            </div>
        );
    }

    return (
        <div className="w-full pb-10 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 pt-6">
                <button
                    onClick={() => navigate('/admins')}
                    className="flex items-center gap-2 text-white hover:text-green-400 transition-colors font-bold text-sm"
                >
                    <ArrowLeft className="w-5 h-5" /> BACK
                </button>
                <h1 className="text-2xl font-bold text-white uppercase tracking-wider">{adminData?.full_name || adminData?.username}</h1>
            </div>

            {/* Admin Details Card */}
            <div className="max-w-3xl mx-auto bg-[#202940] rounded shadow-2xl border border-white/5 overflow-hidden">
                <div className="px-8 py-6 space-y-6 bg-[#1f283e]">
                    {/* Logo if exists */}
                    {logoPath && (
                        <div className="flex justify-center mb-6">
                            <div className="w-28 h-16 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                                <img
                                    src={logoPath.startsWith('http') ? logoPath : `${api.BASE_URL.replace('/api', '')}${logoPath}`}
                                    alt="logo"
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>
                        </div>
                    )}

                    {/* Admin Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-slate-400 text-[11px] font-bold uppercase tracking-[1px]">Full Name</label>
                            <div className="flex items-center gap-3 bg-white/5 rounded px-4 py-3">
                                <User className="w-4 h-4 text-slate-400" />
                                <span className="text-white font-medium">{adminData?.full_name || '-'}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-400 text-[11px] font-bold uppercase tracking-[1px]">Username</label>
                            <div className="flex items-center gap-3 bg-white/5 rounded px-4 py-3">
                                <Shield className="w-4 h-4 text-slate-400" />
                                <span className="text-white font-medium">{adminData?.username || '-'}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-400 text-[11px] font-bold uppercase tracking-[1px]">Email</label>
                            <div className="flex items-center gap-3 bg-white/5 rounded px-4 py-3">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-white font-medium">{adminData?.email || '-'}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-400 text-[11px] font-bold uppercase tracking-[1px]">Mobile</label>
                            <div className="flex items-center gap-3 bg-white/5 rounded px-4 py-3">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-white font-medium">{adminData?.mobile || '-'}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-400 text-[11px] font-bold uppercase tracking-[1px]">Status</label>
                            <div className="bg-white/5 rounded px-4 py-3">
                                <span className={`badge ${adminData?.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                                    {adminData?.status || '-'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-400 text-[11px] font-bold uppercase tracking-[1px]">Created At</label>
                            <div className="bg-white/5 rounded px-4 py-3">
                                <span className="text-white font-medium">
                                    {adminData?.created_at ? new Date(adminData.created_at).toLocaleString() : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Menu Permissions */}
                    <div className="space-y-4 border-t border-white/10 pt-6">
                        <div className="border-b border-white/10 pb-3">
                            <h3 className="text-white font-bold uppercase tracking-[2px] text-sm">Menu Permissions</h3>
                            <p className="text-slate-500 text-xs mt-1">Menus this admin can access</p>
                        </div>

                        {menuPerms.length === 0 ? (
                            <div className="text-slate-400 text-sm bg-white/5 rounded px-4 py-3">
                                No menu permissions assigned
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {MENU_GROUPS.map(({ group, items }) => {
                                    const visibleItems = items.filter(item => menuPerms.includes(item.id));
                                    if (visibleItems.length === 0) return null;

                                    return (
                                        <div key={group}>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{group}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {visibleItems.map(({ id, label }) => (
                                                    <div key={id} className="flex items-center gap-3 bg-[#1e283e] rounded px-4 py-2.5">
                                                        <div className="w-4 h-4 rounded bg-[#4caf50] flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-slate-300 text-[12px]">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Button */}
                <div className="px-8 py-4 bg-[#1a2035] border-t border-white/5 flex gap-3">
                    <button
                        onClick={() => navigate(`/admins/edit/${id}`)}
                        className="flex-1 text-white py-3 rounded font-bold uppercase tracking-[2px] transition-all"
                        style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                    >
                        EDIT ADMIN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewAdminPage;
