import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { MarketDataProvider } from './context/MarketDataContext';
import LoginPage from './pages/LoginPage';
import AccountsPage from './pages/accounts/AccountsPage';
import BrokerAccountsPage from './pages/accounts/BrokerAccountsPage';
import BannedLimitOrdersPage from './pages/banned/BannedLimitOrdersPage';
import BankDetailsPage from './pages/bank/BankDetailsPage';
import TradesPage from './pages/trades/TradesPage';
import TickersPage from './pages/tickers/TickersPage';
import LiveM2MPage from './pages/dashboard/LiveM2MPage';
import KiteDashboard from './pages/dashboard/KiteDashboard';
import LiveM2MDetailPage from './pages/dashboard/LiveM2MDetailPage';
import ClientActivePositionsPage from './pages/dashboard/ClientActivePositionsPage';
import BrokerM2MPage from './pages/dashboard/BrokerM2MPage';
import ActivePositionsPage from './pages/positions/ActivePositionsPage';
import TraderFundsPage from './pages/funds/TraderFundsPage';
import FundDetailPage from './pages/funds/FundDetailPage';
import ActiveTradesPage from './pages/trades/ActiveTradesPage';
import ClosedTradesPage from './pages/trades/ClosedTradesPage';
import TradeViewPage from './pages/trades/TradeViewPage';
import TradeDetailPage from './pages/trades/TradeDetailPage';
import MarketWatchPage from './pages/market/MarketWatchPage';
import OptionsChainTest from './pages/market/OptionsChainTest';
import McxFuturesChain from './pages/market/McxFuturesChain';
import MarketDataPage from './pages/market/MarketDataPage';
import ScriptDataPage from './pages/market/ScriptDataPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import UserNotificationsPage from './pages/notifications/UserNotificationsPage';
import ClosedPositionsPage from './pages/positions/ClosedPositionsPage';
import TradingClientsPage, { clearTradingClientsCache, setTradingClientsCache } from './pages/clients/TradingClientsPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import CopyTradingClientForm from './pages/clients/CopyTradingClientForm';
import NewClientBankDetailsPage from './pages/bank/NewClientBankDetailsPage';
import ChangePasswordPage from './pages/settings/ChangePasswordPage';
import ChangeTransactionPasswordPage from './pages/settings/ChangeTransactionPasswordPage';
import GroupTradesPage from './pages/trades/GroupTradesPage';
import DeletedTradesPage from './pages/trades/DeletedTradesPage';
import DepositRequestsPage from './pages/requests/DepositRequestsPage';
import WithdrawalRequestsPage from './pages/requests/WithdrawalRequestsPage';
import NegativeBalanceTxnsPage from './pages/transactions/NegativeBalanceTxnsPage';
import PendingOrdersPage from './pages/orders/PendingOrdersPage';
import ScripDataPage from './pages/data/ScripDataPage';
import UsersPage from './pages/users/UsersPage';
import CreateFundForm from './components/CreateFundForm';
import AddBrokerForm from './components/AddBrokerForm';
import CreateTradeForm from './components/CreateTradeForm';
import SimpleAddUserForm from './components/SimpleAddUserForm';
import SimpleTraderForm from './components/SimpleTraderForm';
import CreateClientPage from './pages/clients/CreateClientPage';
import GlobalUpdationPage from './pages/settings/GlobalUpdationPage';
import ThemeSettingsPage from './pages/settings/ThemeSettingsPage';
import AccessDenied from './components/common/AccessDenied';
import LearningPage from './pages/learning/LearningPage';
import SignalAdminPage from './pages/trades/SignalAdminPage';
import SignalsPage from './pages/trades/SignalsPage';
import RaiseTicketPage from './pages/support/RaiseTicketPage';
import ContactInquiriesPage from './pages/support/ContactInquiriesPage';
import VoiceModulationPage from './pages/voice/VoiceModulationPage';
import VoiceHistoryPage from './pages/voice/VoiceHistoryPage';
import ClientDetailsForm from './components/ClientDetailsForm';
import Toast from './components/common/Toast';
import EditBrokerPage from './pages/brokers/EditBrokerPage';
import ViewBrokerPage from './pages/brokers/ViewBrokerPage';
import ViewAdminPage from './pages/users/ViewAdminPage';
import EditAdminPage from './pages/users/EditAdminPage';
import GlobalSettingsPage from './pages/settings/GlobalSettingsPage';
import ActionLedgerPage from './pages/logs/ActionLedgerPage';
import IpLoginsPage from './pages/logs/IpLoginsPage';
import TradeIpTrackingPage from './pages/logs/TradeIpTrackingPage';
import ExpiryRulesPage from './pages/settings/ExpiryRulesPage';
import KycUploadPage from './pages/clients/KycUploadPage';
import UpdateClientPage from './pages/clients/UpdateClientPage';
import ResetAccountPage from './pages/clients/ResetAccountPage';
import RecalculateBrokeragePage from './pages/clients/RecalculateBrokeragePage';
import ClientChangePasswordPage from './pages/clients/ChangePasswordPage';
import DeleteClientPage from './pages/clients/DeleteClientPage';
import ContractManagement from './pages/admin/ContractManagement';

import { useAuth, ROLES } from './context/AuthContext';
import * as api from './services/api';
import useInactivityLogout from './hooks/useInactivityLogout';

function App() {
    const { user, login: authLogin, logout: authLogout, canAccess, applyInitData } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize inactivity logout (10 minutes)
    useInactivityLogout(10 * 60 * 1000);

    // View state is now derived from URL
    const view = location.pathname.substring(1) || 'dashboard';

    const [selectedClient, setSelectedClient] = useState(() => {
        try {
            const saved = sessionStorage.getItem('selectedClient');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        if (selectedClient) {
            sessionStorage.setItem('selectedClient', JSON.stringify(selectedClient));
        } else {
            sessionStorage.removeItem('selectedClient');
        }
    }, [selectedClient]);
    const [clients, setClients] = useState([]);
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: 'success' });
    const [loginError, setLoginError] = useState('');

    const setView = (v) => {
        navigate(`/${v}`);
    };

    // Helper for back navigation
    const handleBack = (fallback) => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else if (fallback) {
            navigate(`/${fallback}`);
        } else {
            navigate(-1);
        }
    };

    const handleLogin = async (username, password) => {
        setLoginError('');
        try {
            const response = await api.login(username, password);

            if (response.user.role === ROLES.TRADER) {
                throw new Error('Please login to the VTKRM app for trading.');
            }

            // Store token for API headers
            localStorage.setItem('token', response.token);

            // For BROKER role, fetch broker permissions
            let brokerPermissions = {
                subBrokerActions: 'No',
                payinAllowed: 'No',
                payoutAllowed: 'No',
                createClientsAllowed: 'No',
                clientTasksAllowed: 'No',
                tradeActivityAllowed: 'No',
                notificationsAllowed: 'No',
                canViewBackupData: 'No'
            };
            if (response.user.role === ROLES.BROKER && response.user.id) {
                try {
                    console.log('[Login] Fetching broker permissions for userId:', response.user.id);
                    const permissionsData = await api.getBrokerShares(response.user.id);
                    if (permissionsData) {
                        if (permissionsData.permissions) {
                            brokerPermissions = { ...brokerPermissions, ...permissionsData.permissions };
                        } else if (permissionsData.subBrokerActions !== undefined) {
                            brokerPermissions = { ...brokerPermissions, ...permissionsData };
                        }

                        // Override subBrokerActions to 'Yes' if sub_brokers_limit is configured and > 0
                        const subBrokersLimit = parseInt(permissionsData.sub_brokers_limit || permissionsData.subBrokersLimit || 0);
                        if (subBrokersLimit > 0) {
                            brokerPermissions.subBrokerActions = 'Yes';
                        }
                        console.log('[Login] ✅ Processed broker permissions:', brokerPermissions);
                    }
                } catch (permErr) {
                    console.error('[Login] ❌ Failed to fetch broker permissions:', permErr);
                }
            }

            // Check if this is a sub-broker (parent is also a BROKER, not ADMIN/SUPERADMIN)
            let isSubBroker = false;
            if (response.user.role === ROLES.BROKER && response.user.parent_id) {
                console.log('[Login] Checking if sub-broker - parent_id:', response.user.parent_id);
                console.log('[Login] Parent user role:', response.user.parentRole);
                isSubBroker = response.user.parentRole === ROLES.BROKER;
                console.log('[Login] Is sub-broker:', isSubBroker);
            }

            // Determine target route and navigate FIRST to prevent any split-second route flashing
            const targetRoute = response.user.role === ROLES.TRADER ? '/market-watch' : '/dashboard';
            navigate(targetRoute, { replace: true });

            // Proceed with AuthContext login
            authLogin(response.user.username, response.user.role, {
                ...response.user,
                userId: response.user.id,
                fullName: response.user.fullName,
                permissions: brokerPermissions,
                isSubBroker: isSubBroker,
            });

            // Load menu permissions, theme, and logo for this user
            try {
                console.log('[Login] Fetching init data (menu, theme, logo)...');
                const initData = await api.getInitData();
                console.log('[Login] ✅ Init data loaded:', {
                    role: response.user.role,
                    hasMenuPermissions: !!initData.menuPermissions,
                    hasTheme: !!initData.theme,
                    logoPath: initData.logoPath || 'NONE'
                });
                applyInitData(initData);
            } catch (initErr) {
                console.error('[Login] ❌ Init data load failed:', initErr.message, initErr);
            }
        } catch (err) {
            console.error('Login error:', err);
            setLoginError(err.message || 'Login failed');
        }
    };

    const handleLogout = () => {
        authLogout();
        navigate('/');
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [clientsData, tradesData] = await Promise.all([
                api.getClients(),
                api.getTrades()
            ]);
            setClients(clientsData || []);
            setTrades(tradesData || []);
        } catch (err) {
            console.error('Initial fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleActionSuccess = async (message, redirectTo = 'trading-clients') => {
        // Prefetch fresh data BEFORE redirecting to trading-clients
        // So the page mounts with cache already ready — no loading spinner
        if (redirectTo === 'trading-clients') {
            try {
                const data = await api.getClients({ role: 'TRADER' });
                setTradingClientsCache(Array.isArray(data) ? data : []);
            } catch (err) {
                // If prefetch fails, clear cache so page fetches fresh on mount
                clearTradingClientsCache();
            }
        }
        if (redirectTo) setView(redirectTo);
        setToast({ message, type: 'success' });
    };

    const handleAddTrade = async (newTradeData) => {
        try {
            console.log('[App.handleAddTrade] Received data:', newTradeData);
            console.log('[App.handleAddTrade] Calling api.createTrade with:', JSON.stringify(newTradeData));
            await api.createTrade(newTradeData);
            fetchInitialData();
            setView('trades');
            setToast({ message: 'Trade placed successfully!', type: 'success' });
        } catch (err) {
            console.error('[App.handleAddTrade] Error:', err);
            setToast({ message: err?.response?.data?.message || err?.message || 'Failed to place trade', type: 'error' });
        }
    };

    const handleDeposit = (client) => {
        setSelectedClient(client);
        setView('trading-clients/deposit');
    };

    const handleWithdraw = (client) => {
        setSelectedClient(client);
        setView('trading-clients/withdraw');
    };

    const ProtectedRoute = ({ children, viewId }) => {
        if (viewId && !canAccess(viewId)) {
            return <AccessDenied onGoBack={() => navigate('/dashboard')} />;
        }
        return children;
    };

    if (!user) {
        return <LoginPage onLogin={handleLogin} error={loginError} onErrorClear={() => setLoginError('')} />;
    }

    return (
        <MarketDataProvider>
            <Layout
                onLogout={handleLogout}
                onNavigate={setView}
                currentView={view}
                user={user}
                userRole={user?.role || 'ADMIN'}
                userName={user?.fullName || user?.name || ''}
            >
                <Routes>
                    {/* Default Route */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* Main Views */}
                    <Route path="/dashboard" element={<LiveM2MPage user={user} onNavigate={(v, client) => {
                        if (client) setSelectedClient(client);
                        setView(v);
                    }} />} />

                    <Route path="/kite-dashboard" element={<ProtectedRoute viewId="kite-dashboard"><KiteDashboard /></ProtectedRoute>} />

                    <Route path="/dashboard-detail" element={<LiveM2MDetailPage
                        selectedClient={selectedClient}
                        onBack={() => setView('dashboard')}
                        onClientClick={(client) => {
                            setSelectedClient(client);
                            if (client.role === 'ADMIN' || client.role === 'BROKER') {
                                setView(`dashboard-detail/${client.id}`);
                            } else {
                                setView(`client-active-positions/${client.id}`);
                            }
                        }}
                    />} />
                    <Route path="/dashboard-detail/:id" element={<LiveM2MDetailPage
                        selectedClient={selectedClient}
                        onBack={() => setView('dashboard')}
                        onClientClick={(client) => {
                            setSelectedClient(client);
                            if (client.role === 'ADMIN' || client.role === 'BROKER') {
                                setView(`dashboard-detail/${client.id}`);
                            } else {
                                setView(`client-active-positions/${client.id}`);
                            }
                        }}
                    />} />

                    <Route path="/client-active-positions" element={<ClientActivePositionsPage
                        client={selectedClient}
                        onBack={() => navigate(-1)}
                        onNavigateToAccount={(client) => {
                            setSelectedClient(client);
                            setView(`trading-clients/details/${client.id || client.username}`);
                        }}
                    />} />
                    <Route path="/client-active-positions/:id" element={<ClientActivePositionsPage
                        client={selectedClient}
                        onBack={() => navigate(-1)}
                        onNavigateToAccount={(client) => {
                            setSelectedClient(client);
                            setView(`trading-clients/details/${client.id || client.username}`);
                        }}
                    />} />

                    <Route path="/accounts" element={<ProtectedRoute viewId="accounts"><AccountsPage /></ProtectedRoute>} />
                    <Route path="/banned/*" element={<ProtectedRoute viewId="banned"><BannedLimitOrdersPage /></ProtectedRoute>} />
                    <Route path="/bank" element={<ProtectedRoute viewId="bank"><BankDetailsPage /></ProtectedRoute>} />
                    <Route path="/trades" element={<ProtectedRoute viewId="trades"><TradesPage trades={trades} onCreateClick={() => setView('trades/create')} onNavigate={setView} /></ProtectedRoute>} />
                    <Route path="/trades/create" element={<CreateTradeForm onSave={handleAddTrade} onBack={() => handleBack('trades')} onLogout={handleLogout} onNavigate={setView} />} />
                    <Route path="/trades/edit/:tradeId" element={<CreateTradeForm isEdit={true} onSave={handleAddTrade} onBack={() => handleBack('trades')} onLogout={handleLogout} onNavigate={setView} />} />

                    <Route path="/tickers/*" element={<ProtectedRoute viewId="tickers"><TickersPage /></ProtectedRoute>} />
                    <Route path="/broker-m2m" element={<ProtectedRoute viewId="broker-m2m"><BrokerM2MPage /></ProtectedRoute>} />
                    <Route path="/active-positions" element={<ProtectedRoute viewId="active-positions"><ActivePositionsPage onNavigate={setView} /></ProtectedRoute>} />
                    <Route path="/funds" element={<TraderFundsPage onNavigate={setView} onEditFund={(fund) => { setSelectedClient({ id: fund.user_id, username: fund.username, full_name: fund.name, _fundId: fund.id, _fundAmount: fund.amount, _fundNotes: fund.notes, _fundType: fund.txnType }); navigate('/funds/create'); }} onCreateFund={() => { setSelectedClient(null); navigate('/funds/create'); }} />} />
                    <Route path="/funds/create" element={<CreateFundForm onBack={() => setView('funds')} onSave={(data) => handleActionSuccess('Fund entry created successfully', 'funds')} initialUser={selectedClient} />} />
                    <Route path="/funds/view/:id" element={<FundDetailPage />} />

                    <Route path="/active-trades" element={<ProtectedRoute viewId="active-trades"><ActiveTradesPage /></ProtectedRoute>} />
                    <Route path="/closed-trades" element={<ProtectedRoute viewId="closed-trades"><ClosedTradesPage /></ProtectedRoute>} />
                    <Route path="/closed-trades/view/:tradeId" element={<ProtectedRoute viewId="closed-trades"><TradeViewPage /></ProtectedRoute>} />
                    <Route path="/closed-trades/edit/:tradeId" element={<CreateTradeForm isEdit={true} onSave={handleAddTrade} onBack={() => handleBack('closed-trades')} onLogout={handleLogout} onNavigate={setView} />} />
                    <Route path="/market-watch" element={<ProtectedRoute viewId="market-watch"><MarketWatchPage /></ProtectedRoute>} />
                    <Route path="/options-chain" element={<OptionsChainTest />} />
                    <Route path="/mcx-futures" element={<McxFuturesChain />} />
                    <Route path="/market-data" element={<MarketDataPage />} />
                    <Route path="/script-data" element={<ProtectedRoute viewId="script-data"><ScriptDataPage /></ProtectedRoute>} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/user-notifications" element={<UserNotificationsPage />} />
                    <Route path="/closed-positions" element={<ProtectedRoute viewId="closed-positions"><ClosedPositionsPage /></ProtectedRoute>} />

                    <Route path="/trading-clients" element={<ProtectedRoute viewId="trading-clients"><TradingClientsPage
                        onLogout={handleLogout}
                        onNavigate={(v, client) => {
                            if (client) setSelectedClient(client);
                            setView(v);
                        }}
                        onDepositClick={handleDeposit}
                        onWithdrawClick={handleWithdraw}
                    /></ProtectedRoute>} />

                    <Route path="/trading-clients/create" element={<CreateClientPage onClose={() => handleBack('trading-clients')} onSave={() => handleActionSuccess('Client created successfully', 'trading-clients')} onLogout={handleLogout} onNavigate={setView} />} />
                    <Route path="/trading-clients/details" element={<ClientDetailPage
                        client={selectedClient}
                        onClose={() => handleBack('trading-clients')}
                        onNavigate={setView}
                        onLogout={handleLogout}
                        onUpdate={(c) => { setSelectedClient(c); navigate('/trading-clients/edit'); }}
                        onReset={(c) => { setSelectedClient(c); navigate('/trading-clients/reset'); }}
                        onRecalculate={(c) => { setSelectedClient(c); navigate('/trading-clients/recalculate'); }}
                        onDuplicate={(c) => { setSelectedClient(c); navigate('/trading-clients/copy'); }}
                        onChangePassword={(c) => { setSelectedClient(c); navigate('/trading-clients/change-password'); }}
                        onDelete={(c) => { setSelectedClient(c); navigate('/trading-clients/delete'); }}
                    />} />
                    <Route path="/trading-clients/details/:id" element={<ClientDetailPage
                        client={selectedClient}
                        onClose={() => handleBack('trading-clients')}
                        onNavigate={setView}
                        onLogout={handleLogout}
                        onUpdate={(c) => { setSelectedClient(c); navigate('/trading-clients/edit'); }}
                        onReset={(c) => { setSelectedClient(c); navigate('/trading-clients/reset'); }}
                        onRecalculate={(c) => { setSelectedClient(c); navigate('/trading-clients/recalculate'); }}
                        onDuplicate={(c) => { setSelectedClient(c); navigate('/trading-clients/copy'); }}
                        onChangePassword={(c) => { setSelectedClient(c); navigate('/trading-clients/change-password'); }}
                        onDelete={(c) => { setSelectedClient(c); navigate('/trading-clients/delete'); }}
                    />} />
                    <Route path="/trades/details/:tradeId" element={<TradeDetailPage />} />
                    <Route path="/trading-clients/edit" element={<UpdateClientPage
                        client={selectedClient}
                        onClose={() => handleBack('trading-clients')}
                        onSave={() => handleActionSuccess('Client updated successfully', 'trading-clients')}
                        onLogout={handleLogout}
                        onNavigate={setView}
                    />} />
                    <Route path="/trading-clients/edit/:id" element={<UpdateClientPage
                        client={selectedClient}
                        onClose={() => handleBack('trading-clients')}
                        onSave={() => handleActionSuccess('Client updated successfully', 'trading-clients')}
                        onLogout={handleLogout}
                        onNavigate={setView}
                    />} />
                    <Route path="/trading-clients/deposit" element={<CreateFundForm onBack={() => handleBack('trading-clients')} onSave={(data) => handleActionSuccess('Deposit successful', 'trading-clients')} mode="deposit" initialUser={selectedClient} />} />
                    <Route path="/trading-clients/withdraw" element={<CreateFundForm onBack={() => handleBack('trading-clients')} onSave={(data) => handleActionSuccess('Withdrawal successful', 'trading-clients')} mode="withdraw" initialUser={selectedClient} />} />
                    <Route path="/trading-clients/copy" element={<CopyTradingClientForm client={selectedClient} onClose={() => handleBack('trading-clients')} onSave={() => handleActionSuccess('Client copied successfully', 'trading-clients')} onLogout={handleLogout} onNavigate={setView} />} />
                    <Route path="/trading-clients/kyc/:id" element={<KycUploadPage />} />
                    <Route path="/trading-clients/reset" element={<ResetAccountPage client={selectedClient} onClose={() => handleBack('trading-clients/details')} onResetConfirm={() => handleActionSuccess('Account reset successfully', 'trading-clients/details')} />} />
                    <Route path="/trading-clients/recalculate" element={<RecalculateBrokeragePage client={selectedClient} onClose={() => handleBack('trading-clients/details')} onRecalculate={() => handleActionSuccess('Brokerage recalculated', 'trading-clients/details')} />} />
                    <Route path="/trading-clients/change-password" element={<ClientChangePasswordPage client={selectedClient} onClose={() => handleBack('trading-clients/details')} onChangePasswordConfirm={() => handleActionSuccess('Password changed successfully', 'trading-clients/details')} />} />
                    <Route path="/trading-clients/delete" element={<DeleteClientPage client={selectedClient} onClose={() => handleBack('trading-clients/details')} onDeleteConfirm={() => handleActionSuccess('Client deleted successfully', 'trading-clients')} />} />

                    <Route path="/admins" element={<ProtectedRoute viewId="admins"><UsersPage onNavigate={(v, row) => { if (row) setSelectedClient(row); setView(v); }} roleFilter="ADMIN" /></ProtectedRoute>} />
                    <Route path="/admins/create" element={<SimpleAddUserForm role="Admin" onBack={() => handleBack('admins')} onSave={() => handleActionSuccess('Admin created successfully', 'admins')} />} />
                    <Route path="/admins/view/:id" element={<ViewAdminPage />} />
                    <Route path="/admins/edit/:id" element={<EditAdminPage />} />

                    <Route path="/brokers" element={<ProtectedRoute viewId="brokers"><UsersPage onNavigate={(v, row) => { if (row) setSelectedClient(row); setView(v); }} roleFilter="BROKER" /></ProtectedRoute>} />
                    <Route path="/brokers/create" element={<AddBrokerForm onBack={() => handleBack('brokers')} onSave={() => handleActionSuccess('Broker created successfully', 'brokers')} />} />
                    <Route path="/brokers/edit/:id" element={<EditBrokerPage onSave={() => handleActionSuccess('Broker updated successfully', 'brokers')} onBack={() => handleBack('brokers')} />} />
                    <Route path="/brokers/view/:id" element={<ViewBrokerPage onBack={() => handleBack('brokers')} />} />

                    <Route path="/broker-accounts" element={<ProtectedRoute viewId="broker-accounts"><BrokerAccountsPage /></ProtectedRoute>} />

                    {/* Redirect old /users to /trading-clients */}
                    <Route path="/users" element={<Navigate to="/trading-clients" replace />} />
                    <Route path="/new-client-bank" element={<ProtectedRoute viewId="new-client-bank"><NewClientBankDetailsPage /></ProtectedRoute>} />
                    <Route path="/change-password" element={<ChangePasswordPage />} />
                    <Route path="/change-transaction-password" element={<ChangeTransactionPasswordPage />} />

                    <Route path="/deleted-trades" element={<ProtectedRoute viewId="deleted-trades"><DeletedTradesPage /></ProtectedRoute>} />
                    <Route path="/withdrawal-requests" element={<ProtectedRoute viewId="withdrawal-requests"><WithdrawalRequestsPage /></ProtectedRoute>} />
                    <Route path="/deposit-requests" element={<ProtectedRoute viewId="deposit-requests"><DepositRequestsPage /></ProtectedRoute>} />
                    <Route path="/negative-balance" element={<ProtectedRoute viewId="negative-balance"><NegativeBalanceTxnsPage /></ProtectedRoute>} />

                    <Route path="/pending-orders/*" element={<ProtectedRoute viewId="pending-orders"><PendingOrdersPage /></ProtectedRoute>} />
                    <Route path="/scrip-data" element={<ProtectedRoute viewId="scrip-data"><ScripDataPage /></ProtectedRoute>} />
                    <Route path="/group-trades" element={<ProtectedRoute viewId="group-trades"><GroupTradesPage /></ProtectedRoute>} />
                    <Route path="/global-updation" element={<ProtectedRoute viewId="global-updation"><GlobalUpdationPage /></ProtectedRoute>} />
                    <Route path="/theme-settings" element={<ProtectedRoute viewId="theme-settings"><ThemeSettingsPage /></ProtectedRoute>} />
                    <Route path="/global-settings" element={<ProtectedRoute viewId="global-settings"><GlobalSettingsPage onBack={() => setView('dashboard')} /></ProtectedRoute>} />

                    <Route path="/action-ledger" element={<ProtectedRoute viewId="action-ledger"><ActionLedgerPage /></ProtectedRoute>} />
                    <Route path="/ip-logins" element={<ProtectedRoute viewId="ip-logins"><IpLoginsPage /></ProtectedRoute>} />
                    <Route path="/trade-ip-tracking" element={<ProtectedRoute viewId="trade-ip-tracking"><TradeIpTrackingPage /></ProtectedRoute>} />

                    <Route path="/learning" element={<LearningPage segment={user?.segment} />} />
                    <Route path="/support" element={<RaiseTicketPage user={user} />} />
                    <Route path="/contact-inquiries" element={<ProtectedRoute viewId="contact-inquiries"><ContactInquiriesPage /></ProtectedRoute>} />
                    <Route path="/voice-modulation" element={<VoiceModulationPage />} />
                    <Route path="/voice-history" element={<VoiceHistoryPage />} />
                    <Route path="/signal-admin" element={<SignalAdminPage />} />
                    <Route path="/signals" element={<SignalsPage />} />
                    <Route path="/expiry-rules" element={<ProtectedRoute viewId="expiry-rules"><ExpiryRulesPage /></ProtectedRoute>} />
                    <Route path="/contract-management" element={<ProtectedRoute viewId="contract-management"><ContractManagement /></ProtectedRoute>} />
                    <Route path="/kyc-verification/:id" element={<KycUploadPage />} />


                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: '', type: 'success' })}
                />
            </Layout>
        </MarketDataProvider>
    );
}

export default App;
