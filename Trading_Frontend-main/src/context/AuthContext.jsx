import { createContext, useContext, useState, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/encryption';

const AuthContext = createContext(null);

// Role definitions
export const ROLES = {
    SUPERADMIN: 'SUPERADMIN',
    ADMIN: 'ADMIN',
    BROKER: 'BROKER',
    TRADER: 'TRADER',
};

// Static fallback menu access per role (ADMIN is overridden by DB permissions)
export const ROLE_MENU_ACCESS = {
    SUPERADMIN: [
        'dashboard', 'kite-dashboard', 'market-watch', 'notifications', 'action-ledger',
        'active-positions', 'closed-positions', 'trading-clients', 'trades',
        'group-trades', 'closed-trades', 'deleted-trades', 'pending-orders',
        'options-chain', 'mcx-futures', 'market-data',
        'funds', 'brokers', 'tickers', 'banned', 'bank',
        'new-client-bank', 'accounts', 'broker-accounts', 'ip-logins',
        'trade-ip-tracking', 'global-updation', 'change-password',
        'change-transaction-password', 'withdrawal-requests',
        'deposit-requests', 'negative-balance', 'admins',
        'learning', 'support', 'contact-inquiries', 'voice-modulation', 'voice-history', 'signal-admin', 'signals',
        'global-settings', 'expiry-rules', 'contract-management', 'script-data',
        'user-notifications',

    ],
    ADMIN: [
        'dashboard', 'market-watch', 'notifications', 'user-notifications',
        'active-positions', 'closed-positions', 'trading-clients', 'brokers', 'trades',
        'group-trades', 'closed-trades', 'deleted-trades', 'pending-orders',
        'funds', 'tickers', 'banned', 'bank', 'new-client-bank',
        'accounts', 'broker-accounts', 'ip-logins', 'trade-ip-tracking',
        'global-updation', 'change-password', 'change-transaction-password',
        'withdrawal-requests', 'deposit-requests', 'negative-balance',
        'learning', 'support', 'contact-inquiries', 'voice-modulation', 'voice-history', 'signal-admin', 'signals',
        'expiry-rules',
    ],
    BROKER: [
        'dashboard',
        'market-watch',
        'active-positions',
        'closed-positions',
        'closed-trades',
        'deleted-trades',
        'accounts',
        'action-ledger',
        'change-password', 'change-transaction-password',
        'support',
        // 'brokers' removed - shown only if subBrokerActions permission
    ],
    TRADER: [
        'dashboard', 'market-watch', 'notifications',
        'funds', 'change-password', 'change-transaction-password',
        'learning', 'support', 'voice-modulation', 'signals',
    ],
};

// Default theme (used before DB theme loads)
const DEFAULT_THEME = {
    sidebarColor: '#1a2035',
    navbarColor: '#288c6c',
    primaryColor: '#4ea752',
    buttonColor: '#4CAF50',
    backgroundColor: '#1a2035',
    textColor: '#ffffff',
};

const applyThemeToCss = (theme) => {
    const root = document.documentElement;
    root.style.setProperty('--sidebar-color', theme.sidebarColor || '#1a2035');
    root.style.setProperty('--navbar-color', theme.navbarColor || '#288c6c');
    root.style.setProperty('--primary-color', theme.primaryColor || '#4ea752');
    root.style.setProperty('--button-color', theme.buttonColor || '#4CAF50');
    root.style.setProperty('--bg-color', theme.backgroundColor || '#1a2035');
    root.style.setProperty('--text-color', theme.textColor || '#ffffff');
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = sessionStorage.getItem('traders_user');
            const valid = sessionStorage.getItem('traders_session_valid');
            if (saved && valid === 'true') {
                const decryptedUser = decryptData(saved);
                return decryptedUser || null;
            }
        } catch (_) { }
        return null;
    });

    const [currentSegment, setCurrentSegment] = useState(() => {
        const saved = localStorage.getItem('traders_segment');
        return saved || 'NIFTY50';
    });

    // Dynamic admin menu permissions (null = use static ROLE_MENU_ACCESS)
    const [menuPermissions, setMenuPermissions] = useState(() => {
        try {
            const saved = sessionStorage.getItem('traders_menu_permissions');
            return saved ? JSON.parse(saved) : null;
        } catch (_) { return null; }
    });

    // Theme
    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem('traders_theme');
            return saved ? JSON.parse(saved) : DEFAULT_THEME;
        } catch (_) { return DEFAULT_THEME; }
    });

    // Logo
    const [logoPath, setLogoPath] = useState(() => {
        return localStorage.getItem('traders_logo') || null;
    });

    // Profile image
    const [profileImagePath, setProfileImagePath] = useState(() => {
        return localStorage.getItem('traders_profile_image') || null;
    });

    // Apply theme CSS variables whenever theme changes
    useEffect(() => {
        applyThemeToCss(theme);
    }, [theme]);

    useEffect(() => {
        if (user) {
            sessionStorage.setItem('traders_user', encryptData(user));
            sessionStorage.setItem('traders_session_valid', 'true');
            if (!localStorage.getItem('traders_segment')) {
                setCurrentSegment(user.segment || 'NIFTY50');
            }
        } else {
            sessionStorage.removeItem('traders_user');
            sessionStorage.removeItem('traders_session_valid');
            sessionStorage.removeItem('traders_menu_permissions');
            localStorage.removeItem('traders_segment');
        }
    }, [user]);

    useEffect(() => {
        if (currentSegment) {
            localStorage.setItem('traders_segment', currentSegment);
        }
    }, [currentSegment]);

    const login = (username, role = ROLES.ADMIN, extraData = {}) => {
        const segment = extraData.segment || 'NIFTY50';
        const userData = {
            name: username,
            role,
            segment,
            email: extraData.email || '',
            mobile: extraData.mobile || '',
            userId: extraData.userId || Math.floor(Math.random() * 1000000).toString(),
            ...extraData,
        };
        setUser(userData);
        setCurrentSegment(segment);
    };

    const logout = () => {
        setUser(null);
        setCurrentSegment('NIFTY50');
        setMenuPermissions(null);
        setTheme(DEFAULT_THEME);
        setLogoPath(null);
        sessionStorage.removeItem('traders_user');
        sessionStorage.removeItem('traders_session_valid');
        sessionStorage.removeItem('traders_menu_permissions');
        localStorage.removeItem('traders_user');
        localStorage.removeItem('traders_view');
        localStorage.removeItem('traders_session_valid');
        localStorage.removeItem('traders_segment');
        localStorage.removeItem('token');
        localStorage.removeItem('traders_menu_permissions');
        localStorage.removeItem('traders_theme');
        localStorage.removeItem('traders_logo');
        localStorage.removeItem('traders_profile_image');
    };

    const switchSegment = (newSegment) => {
        setCurrentSegment(newSegment);
    };

    // Called after login with data from /api/admin/init
    const applyInitData = (initData) => {
        if (initData.menuPermissions !== undefined) {
            setMenuPermissions(initData.menuPermissions);
            if (initData.menuPermissions) {
                localStorage.setItem('traders_menu_permissions', JSON.stringify(initData.menuPermissions));
            }
        }

        // Always reset theme — if server returns empty (SUPERADMIN), go back to defaults
        if (initData.theme && Object.keys(initData.theme).length > 0) {
            const merged = { ...DEFAULT_THEME, ...initData.theme };
            setTheme(merged);
            localStorage.setItem('traders_theme', JSON.stringify(merged));
        } else {
            setTheme(DEFAULT_THEME);
            localStorage.removeItem('traders_theme');
        }

        // Always reset logo — if server returns null (SUPERADMIN), clear it
        if (initData.logoPath) {
            setLogoPath(initData.logoPath);
            localStorage.setItem('traders_logo', initData.logoPath);
        } else {
            setLogoPath(null);
            localStorage.removeItem('traders_logo');
        }

        // Always reset profile image
        if (initData.profileImagePath) {
            setProfileImagePath(initData.profileImagePath);
            localStorage.setItem('traders_profile_image', initData.profileImagePath);
        } else {
            setProfileImagePath(null);
            localStorage.removeItem('traders_profile_image');
        }
    };

    // Update theme from ThemeSettingsPage after save
    const updateTheme = (newTheme) => {
        const merged = { ...DEFAULT_THEME, ...newTheme };
        setTheme(merged);
        localStorage.setItem('traders_theme', JSON.stringify(merged));
    };

    const updateLogoPath = (path) => {
        setLogoPath(path);
        if (path) localStorage.setItem('traders_logo', path);
        else localStorage.removeItem('traders_logo');
    };

    const canViewBackup = () => {
        if (!user) return false;
        if ([ROLES.SUPERADMIN, ROLES.ADMIN].includes(user.role)) return true;
        if (user.role === ROLES.BROKER) {
            // Check nested permissions if available, or direct field
            const perms = user.permissions || {};
            return perms.canViewBackupData === true || user.canViewBackupData === true;
        }
        return false;
    };

    const canAccess = (menuId) => {
        if (!user) return false;
        // SUPERADMIN always uses static list
        if (user.role === ROLES.SUPERADMIN) {
            return ROLE_MENU_ACCESS[ROLES.SUPERADMIN].includes(menuId);
        }
        // ADMIN: use DB permissions if available, else static fallback
        if (user.role === ROLES.ADMIN) {
            if (menuPermissions && menuPermissions.length > 0) {
                // Always allow password change
                if (['change-password', 'change-transaction-password'].includes(menuId)) return true;
                return menuPermissions.includes(menuId);
            }
            return (ROLE_MENU_ACCESS[ROLES.ADMIN] || []).includes(menuId);
        }
        // BROKER / TRADER
        let accessibleItems = [...(ROLE_MENU_ACCESS[user.role] || [])];

        // For BROKER: add menu items based on broker permissions stored in user object
        if (user.role === ROLES.BROKER) {
            const perms = user.permissions || {};

            // Trading Clients - ALWAYS accessible
            accessibleItems.push('trading-clients');

            // Add permission-based menu items
            if (perms.subBrokerActions === 'Yes' || perms.subBrokerActions === true) {
                accessibleItems.push('brokers');
            }
            if (perms.payinAllowed === 'Yes' || perms.payoutAllowed === 'Yes' ||
                perms.payinAllowed === true || perms.payoutAllowed === true) {
                accessibleItems.push('funds');
            }
            if (perms.notificationsAllowed === 'Yes' || perms.notificationsAllowed === true) {
                accessibleItems.push('notifications');
            }
            if (perms.tradeActivityAllowed === 'Yes' || perms.tradeActivityAllowed === true) {
                accessibleItems.push('trades', 'pending-orders');
            }
            // canViewBackupData = view historical/backup data in client details page
            // (controlled separately in ClientDetailPage, not a menu item)
        }

        return accessibleItems.includes(menuId);
    };

    const isSuperAdmin = () => user?.role?.toUpperCase() === ROLES.SUPERADMIN;
    const isAdmin = () => [ROLES.SUPERADMIN, ROLES.ADMIN].includes(user?.role);
    const isBroker = () => user?.role === ROLES.BROKER;
    const isClient = () => user?.role === ROLES.TRADER;

    return (
        <AuthContext.Provider value={{
            user, currentSegment,
            login, logout, switchSegment,
            canAccess, isSuperAdmin, isAdmin, isBroker, isClient, canViewBackup,
            menuPermissions, theme, logoPath, profileImagePath,
            applyInitData, updateTheme, updateLogoPath,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};

export default AuthContext;
