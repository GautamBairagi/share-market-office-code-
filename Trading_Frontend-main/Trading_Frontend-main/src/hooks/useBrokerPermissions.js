import { useState, useEffect } from 'react';
import { getBrokerShares } from '../services/api';

export const useBrokerPermissions = (userId, userRole) => {
    const [permissions, setPermissions] = useState({
        subBrokerActions: 'No',
        payinAllowed: 'No',
        payoutAllowed: 'No',
        createClientsAllowed: 'No',
        clientTasksAllowed: 'No',
        tradeActivityAllowed: 'No',
        notificationsAllowed: 'No',
        canViewBackupData: 'No'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Only fetch for BROKER role
        if (userRole !== 'BROKER' || !userId) {
            console.log('[useBrokerPermissions] ⏭️ Skipping - role:', userRole, 'userId:', userId);
            return;
        }

        const fetchPermissions = async () => {
            setLoading(true);
            try {
                console.log('[useBrokerPermissions] 📡 Fetching permissions for userId:', userId, 'role:', userRole);
                const data = await getBrokerShares(userId);
                console.log('[useBrokerPermissions] 📥 Raw API Response:', JSON.stringify(data, null, 2));

                if (data) {
                    let finalPermissions = {
                        subBrokerActions: 'No',
                        payinAllowed: 'No',
                        payoutAllowed: 'No',
                        createClientsAllowed: 'No',
                        clientTasksAllowed: 'No',
                        tradeActivityAllowed: 'No',
                        notificationsAllowed: 'No',
                        canViewBackupData: 'No'
                    };

                    if (data.permissions) {
                        finalPermissions = { ...finalPermissions, ...data.permissions };
                    } else if (data.subBrokerActions !== undefined) {
                        finalPermissions = { ...finalPermissions, ...data };
                    }

                    // Override subBrokerActions to 'Yes' if sub_brokers_limit is configured and > 0
                    const subBrokersLimit = parseInt(data.sub_brokers_limit || data.subBrokersLimit || 0);
                    if (subBrokersLimit > 0) {
                        finalPermissions.subBrokerActions = 'Yes';
                    }

                    console.log('[useBrokerPermissions] ✅ Final processed permissions:', finalPermissions);
                    setPermissions(finalPermissions);
                }
            } catch (err) {
                console.error('[useBrokerPermissions] ❌ Failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, [userId, userRole]);

    return { permissions, loading };
};

// Menu item to permission mapping
// Note: 'funds' has special handling in Sidebar.jsx (shows if payin OR payout allowed)
// Note: 'trading-clients' is ALWAYS accessible, create button is conditional
export const MENU_TO_PERMISSION_MAP = {
    'brokers': 'subBrokerActions',           // Sub Brokers Actions
    'trading-clients': null,                 // ALWAYS accessible (create button conditional)
    'funds': null,                           // Special case in Sidebar (payin OR payout)
    'withdrawal-requests': 'payoutAllowed',  // Withdrawals
    'deposit-requests': 'payinAllowed',      // Deposits
    'trades': 'tradeActivityAllowed',        // Trade Activity Allowed
    'active-trades': 'tradeActivityAllowed',
    'closed-trades': 'tradeActivityAllowed',
    'deleted-trades': 'tradeActivityAllowed',
    'pending-orders': 'tradeActivityAllowed',
    'group-trades': 'tradeActivityAllowed',
    'notifications': 'notificationsAllowed', // Notifications Allowed
    'user-notifications': 'notificationsAllowed',
    'action-ledger': 'canViewBackupData',    // Can View Backup Data
};

// Helper function to check if broker has permission for a menu item
export const hasBrokerPermissionForMenu = (menuId, permissions) => {
    const requiredPermission = MENU_TO_PERMISSION_MAP[menuId];
    if (!requiredPermission) {
        // Menu item doesn't have specific permission requirement
        return true;
    }
    return permissions[requiredPermission] === 'Yes';
};
