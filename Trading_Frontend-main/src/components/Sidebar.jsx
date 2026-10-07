import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBrokerPermissions, hasBrokerPermissionForMenu } from '../hooks/useBrokerPermissions';

const ALL_MENU_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-table-columns' },
    { id: 'kite-dashboard', label: 'Live Quotes', icon: 'fa-chart-line' },
    { id: 'voice-modulation', label: 'Voice Modulation', icon: 'fa-microphone' },
    { id: 'voice-history', label: 'Voice Recordings', icon: 'fa-compact-disc' },
    { id: 'market-watch', label: 'Market Watch', icon: 'fa-arrow-trend-up' },
    { id: 'options-chain', label: 'Options Chain', icon: 'fa-layer-group' },
    { id: 'mcx-futures', label: 'MCX Futures', icon: 'fa-coins' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    { id: 'user-notifications', label: 'Sent Message', icon: 'fa-paper-plane' },
    { id: 'action-ledger', label: 'Action Ledger', icon: 'fa-podcast' },
    { id: 'active-positions', label: 'Active Positions', icon: 'fa-certificate' },
    { id: 'closed-positions', label: 'Closed Positions', icon: 'fa-certificate' },
    { id: 'trading-clients', label: 'Trading Clients', icon: 'fa-regular fa-face-flushed' },
    { id: 'trades', label: 'Trades', icon: 'fa-tag' },
    { id: 'group-trades', label: 'Group Trades', icon: 'fa-tag' },
    { id: 'closed-trades', label: 'Closed Trades', icon: 'fa-tag' },
    { id: 'deleted-trades', label: 'Deleted Trades', icon: 'fa-tag' },
    { id: 'pending-orders', label: 'Pending Orders', icon: 'fa-swatchbook' },
    { id: 'funds', label: 'Trader Funds', icon: 'fa-circle-dollar-to-slot' },
    { id: 'brokers', label: 'Brokers', icon: 'fa-user-group' },
    { id: 'admins', label: 'Admins', icon: 'fa-user-shield' },
    { id: 'tickers', label: 'Tickers', icon: 'fa-calculator' },
    { id: 'banned', label: 'Banned Limit Orders', icon: 'fa-ban' },
    { id: 'bank', label: 'Bank Details', icon: 'fa-building-columns' },
    { id: 'new-client-bank', label: 'Bank Details For New', icon: 'fa-building-columns' },
    { id: 'accounts', label: 'Accounts', icon: 'fa-calculator' },
    { id: 'broker-accounts', label: 'Broker Accounts', icon: 'fa-calculator' },
    { id: 'ip-logins', label: 'IP Logins', icon: 'fa-shield-halved' },
    { id: 'trade-ip-tracking', label: 'Trade IP Tracking', icon: 'fa-location-dot' },
    { id: 'global-updation', label: 'Global Updation', icon: 'fa-earth-americas' },
    { id: 'withdrawal-requests', label: 'Withdrawal Requests', icon: 'fa-gear' },
    { id: 'deposit-requests', label: 'Deposit Requests', icon: 'fa-gear' },
    { id: 'negative-balance', label: 'Negative Balance Txns', icon: 'fa-bell' },
    { id: 'support', label: 'Raise Ticket', icon: 'fa-ticket' },
    { id: 'contact-inquiries', label: 'Contact Inquiries', icon: 'fa-envelope-open-text' },
    { id: 'expiry-rules', label: 'Expiry Rules', icon: 'fa-calendar-xmark' },
    { id: 'contract-management', label: 'Contract Management', icon: 'fa-list-check' },
    { id: 'script-data', label: 'Script Data', icon: 'fa-clock-rotate-left' },
    { id: 'change-password', label: 'Change Login Password', icon: 'fa-user' },
    { id: 'change-transaction-password', label: 'Change Transaction Pwd', icon: 'fa-gear' },
];

const Sidebar = ({ onLogout, currentView, isOpen, onClose }) => {
    const { user, canAccess } = useAuth();
    const userRole = user?.role || 'ADMIN';
    const { permissions } = useBrokerPermissions(user?.userId, userRole);

    console.log('[Sidebar] 🔄 Rendering...');
    console.log('[Sidebar] 👤 Logged in user:', user?.username, 'userId:', user?.userId, 'role:', userRole);
    console.log('[Sidebar] 🔐 Permissions:', JSON.stringify(permissions, null, 2));

    const menuItems = ALL_MENU_ITEMS.filter(item => {
        if (!canAccess(item.id)) return false;
        // Hide 'Sent Message' (user-notifications) for SUPERADMIN role only
        if (userRole === 'SUPERADMIN' && item.id === 'user-notifications') return false;

        // Hide 'Live Quotes' (kite-dashboard) & 'Script Data' for non-SUPERADMIN users
        if ((item.id === 'kite-dashboard' || item.id === 'script-data') && userRole !== 'SUPERADMIN') return false;

        // For BROKER role, apply broker permissions
        if (userRole === 'BROKER') {
            // Special case for 'funds' - show if payin OR payout allowed
            if (item.id === 'funds') {
                const shouldShow = permissions.payinAllowed === 'Yes' || permissions.payoutAllowed === 'Yes';
                console.log('[Sidebar] Funds menu:', shouldShow, 'payin:', permissions.payinAllowed, 'payout:', permissions.payoutAllowed);
                return shouldShow;
            }

            const hasPermission = hasBrokerPermissionForMenu(item.id, permissions);
            console.log('[Sidebar] Menu item:', item.id, 'hasPermission:', hasPermission);
            if (!hasPermission) {
                return false;
            }
        }
        return true;
    });

    const roleBadge = {
        SUPERADMIN: { label: 'SUPER ADMIN', color: '#f59e0b' },
        ADMIN: { label: 'ADMIN', color: '#4caf50' },
        BROKER: { label: 'BROKER', color: '#3b82f6' },
        TRADER: { label: 'CLIENT', color: '#8b5cf6' },
    };
    const badge = roleBadge[userRole] || roleBadge['ADMIN'];

    const activeView = (() => {
        if (!currentView) return '';
        if (currentView.startsWith('trading-clients')) return 'trading-clients';
        if (currentView.startsWith('closed-trades')) return 'closed-trades';
        if (currentView.startsWith('brokers')) return 'brokers';
        if (currentView.startsWith('admins')) return 'admins';
        if (currentView.startsWith('trades')) return 'trades';
        if (currentView.startsWith('funds')) return 'funds';
        if (currentView.startsWith('contract-management')) return 'contract-management';
        if (currentView === 'dashboard-detail' || currentView === 'client-active-positions') return 'dashboard';
        return currentView;
    })();

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 z-50 w-[260px] text-white 
                transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                flex-shrink-0 border-r border-white/5 shadow-2xl
            `}
            style={{ backgroundColor: 'var(--sidebar-color, #1a2035)' }}
        >
            <div className="flex flex-col h-full overflow-hidden">
                {/* Mobile Close Button */}
                <div className="lg:hidden flex justify-end px-3 pt-3">
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-all">
                        <i className="fa-solid fa-xmark text-white text-lg"></i>
                    </button>
                </div>
                {/* Role Badge */}
                <div className="px-4 py-4 border-b border-white/10 flex flex-col gap-2 bg-black/10">
                    <div className="flex items-center gap-2">
                        <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase border"
                            style={{ background: badge.color + '22', color: badge.color, borderColor: badge.color + '44' }}
                        >
                            {badge.label}
                        </span>
                        <span className="text-slate-500 text-[11px] font-medium">{menuItems.length} modules</span>
                    </div>
                </div>

                {/* Navigation Items - Scrollable but Hidden Scrollbar */}
                <nav className="flex-1 py-4 overflow-y-auto no-scrollbar scroll-smooth">
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}</style>
                    <div className="px-3 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = activeView === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    to={`/${item.id}`}
                                    replace={isActive}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) onClose();
                                    }}
                                    className={`
                                        w-full flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 group relative
                                        ${isActive
                                            ? 'text-white shadow-lg'
                                            : 'text-[#bcc0cf] hover:bg-white/5 hover:text-white'}
                                    `}
                                    style={isActive ? {
                                        background: 'linear-gradient(60deg, var(--navbar-color, #288c6c), var(--primary-color, #4ea752))',
                                        boxShadow: '0 4px 15px -3px rgba(0,0,0,0.3)',
                                    } : {}}
                                >
                                    <div className={`w-8 flex justify-center mr-2 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                        <i className={`fa-solid ${item.icon} text-[15px]`}></i>
                                    </div>
                                    <span className={`text-[12px] uppercase tracking-wider truncate transition-all ${isActive ? 'font-bold' : 'font-normal'}`}>
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-white/10 bg-black/5">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center px-4 py-2.5 text-[#bcc0cf] hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all duration-200 group"
                    >
                        <div className="w-8 flex justify-center mr-2 text-slate-400 group-hover:text-red-400 transition-colors">
                            <i className="fa-solid fa-sign-out-alt text-[15px]"></i>
                        </div>
                        <span className="text-[12px] font-bold uppercase tracking-wider">Log Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;





// test