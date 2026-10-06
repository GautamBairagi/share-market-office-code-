/**
 * Centralized API Service
 *
 * Uses Axios with automatic JWT token handling via interceptors
 * NO manual Authorization headers needed - token is attached automatically!
 */

import api from '../utils/api';

// ─── REQUEST DEDUPE (prevents queued/stalled browser requests) ───────────────
const inFlightGet = new Map();

function stableKey(url, config = {}) {
    const params = config?.params ? JSON.stringify(Object.keys(config.params).sort().reduce((a, k) => { a[k] = config.params[k]; return a; }, {})) : '';
    return `${url}?${params}`;
}

async function dedupedGet(url, config = {}) {
    const key = stableKey(url, config);
    if (inFlightGet.has(key)) return inFlightGet.get(key);
    const p = api.get(url, config).then((r) => r).finally(() => inFlightGet.delete(key));
    inFlightGet.set(key, p);
    return p;
}

// ─── CONFIG ──────────────────────────────────────────
const PRODUCTION_URL = 'https://api.shrishreenathjiglobaltraders.com';
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const defaultApiUrl = isLocalhost ? '/api' : `${PRODUCTION_URL}/api`;
const defaultSocketUrl = isLocalhost ? 'http://localhost:5000' : PRODUCTION_URL;

export const BASE_URL = import.meta.env.VITE_API_URL || defaultApiUrl;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl;
export const UPLOADS_BASE_URL = BASE_URL.replace(/\/api$/, '') + '/uploads';


// ─── AUTH ────────────────────────────────────────────
export const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
};

// ─── PASSWORD ────────────────────────────────────────
export const resetPassword = async (userId) => {
    const response = await api.post(`/users/${userId}/reset-password`);
    return response.data;
};

export const changePassword = async (newPassword) => {
    const response = await api.post('/auth/change-password', { newPassword });
    return response.data;
};

export const changeTransactionPassword = async (newPassword, currentPassword) => {
    const response = await api.post('/auth/change-transaction-password', {
        newPassword,
        currentPassword
    });
    return response.data;
};

export const verifyTransactionPassword = async (password) => {
    const response = await api.post('/auth/verify-transaction-password', { password });
    return response.data;
};

// ─── CLIENTS ─────────────────────────────────────────
export const getClients = async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
};

export const getClientById = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

export const getClientWeeklyBalance = async (id) => {
    const response = await api.get(`/users/${id}/weekly-balance`);
    return response.data;
};

export const createClient = async (data) => {
    const response = await api.post('/auth/create-user', data);
    return response.data;
};

// ─── BROKERS ─────────────────────────────────────────
export const getBrokerList = async () => {
    const response = await api.get('/brokers');
    return response.data;
};

export const createBroker = async (data) => {
    const response = await api.post('/brokers', data);
    return response.data;
};

// ─── POSITIONS ───────────────────────────────────────
export const getActivePositions = async (filters = {}) => {
    const response = await api.get('/trades/active', { params: filters });
    return response.data;
};

export const getClosedPositions = async (filters = {}) => {
    const response = await api.get('/trades', {
        params: { status: 'CLOSED', ...filters }
    });
    return response.data;
};

// ─── TRADES ──────────────────────────────────────────
export const getTrades = async (filters = {}) => {
    const response = await api.get('/trades', { params: filters });
    return response.data;
};

export const getTradeById = async (id) => {
    const response = await api.get(`/trades/${id}`);
    return response.data;
};

export const createTrade = async (data) => {
    console.log('[api.createTrade] Sending POST /trades with data:', data);
    const response = await api.post('/trades', data);
    return response.data;
};

export const placeOrder = async (data) => {
    const response = await api.post('/trades/place', data);
    return response.data;
};

export const closeTrade = async (id, data = {}) => {
    const response = await api.put(`/trades/${id}/close`, data);
    return response.data;
};

export const updateTrade = async (id, data) => {
    const response = await api.put(`/trades/${id}`, data);
    return response.data;
};

export const deleteTrade = async (id, data = {}) => {
    const response = await api.delete(`/trades/${id}`, { data });
    return response.data;
};

export const restoreTrade = async (id, data = {}) => {
    const response = await api.put(`/trades/${id}/restore`, data);
    return response.data;
};

export const completePendingOrder = async (id) => {
    const response = await api.put(`/trades/${id}/complete`);
    return response.data;
};

// ─── FUNDS ───────────────────────────────────────────
export const getTraderFunds = async (filters = {}) => {
    const response = await api.get('/funds', { params: filters });
    return response.data;
};

export const createFund = async (data) => {
    const response = await api.post('/funds', data);
    return response.data;
};

export const updateFund = async (id, data) => {
    const response = await api.put(`/funds/${id}`, data);
    return response.data;
};

export const deleteFund = async (id) => {
    const response = await api.delete(`/funds/${id}`);
    return response.data;
};

// ─── MARGIN ──────────────────────────────────────────
export const getNetHoldingMargin = async (clientId) => {
    const response = await api.get(`/portfolio/${clientId}/margin`);
    return response.data;
};

// ─── REQUESTS ────────────────────────────────────────
export const getRequests = async (params = {}) => {
    const response = await api.get('/requests', { params });
    return response.data;
};

export const updateRequestStatus = async (requestId, status, remark) => {
    const response = await api.put(`/requests/${requestId}`, { status, remark });
    return response.data;
};

export const getDepositRequests = async () => {
    const response = await api.get('/requests/deposits');
    return response.data;
};

export const getWithdrawalRequests = async () => {
    const response = await api.get('/requests/withdrawals');
    return response.data;
};

export const approveRequest = async (requestId, type) => {
    const response = await api.post(`/requests/${requestId}/approve`, { type });
    return response.data;
};

export const rejectRequest = async (requestId, type) => {
    const response = await api.post(`/requests/${requestId}/reject`, { type });
    return response.data;
};

// ─── IP / SECURITY ───────────────────────────────────
export const getIpLogins = async (params = {}) => {
    const response = await api.get('/security/ip-tracking', { params });
    return response.data;
};

export const deleteIpLogin = async (id) => {
    const response = await api.delete(`/security/ip-tracking/${id}`);
    return response.data;
};

export const getTradeIpTracking = async () => {
    const response = await api.get('/security/trade-audit');
    return response.data;
};

// ─── GLOBAL (SUPERADMIN ONLY) ────────────────────────
export const getGlobalSettings = async () => {
    const response = await api.get('/admin/global-settings');
    return response.data;
};

export const triggerWeeklySettlement = async (data = {}) => {
    const response = await api.post('/admin/weekly-settlement', data);
    return response.data;
};

export const getActionLedger = async (params = {}) => {
    const response = await api.get('/system/audit-log', { params });
    return response.data;
};

export const exportActionLedgerCSV = async (params = {}) => {
    const response = await api.get('/system/audit-log', { params: { ...params, export: 'csv' }, responseType: 'blob' });
    return response.data; // Blob
};

export const getScrips = async () => {
    const response = await api.get('/system/scrips');
    return response.data;
};

export const getTickers = async () => {
    const response = await api.get('/system/tickers?all=true');
    return response.data;
};

export const createTicker = async (data) => {
    const response = await api.post('/system/tickers', data);
    return response.data;
};

export const deleteTicker = async (id) => {
    const response = await api.delete(`/system/tickers/${id}`);
    return response.data;
};

// ─── BANNED LIMIT ORDERS ────────────────────────────
export const getBannedOrders = async () => {
    const response = await api.get('/system/banned-orders');
    return response.data;
};

export const createBannedOrder = async (data) => {
    const response = await api.post('/system/banned-orders', data);
    return response.data;
};

export const deleteBannedOrders = async (ids) => {
    const response = await api.post('/system/banned-orders/delete-multiple', { ids });
    return response.data;
};

// Permanent Banned Scrips
export const getBannedScrips = async () => {
    const response = await api.get('/system/banned-scrips');
    return response.data;
};

export const toggleBannedScrip = async (symbol, action) => {
    const response = await api.post('/system/banned-scrips/toggle', { symbol, action });
    return response.data;
};

export const bulkToggleBannedScrips = async (symbols, action) => {
    const response = await api.post('/system/banned-scrips/bulk-toggle', { symbols, action });
    return response.data;
};

export const updateGlobalSettings = async (data) => {
    const response = await api.put('/admin/global-settings', data);
    return response.data;
};

// ─── EXPIRY RULES ─────────────────────────────────────
export const getExpiryRules = async () => {
    const response = await api.get('/system/expiry-rules');
    return response.data;
};

export const updateExpiryRules = async (data) => {
    const response = await api.put('/system/expiry-rules', data);
    return response.data;
};

// ─── SUPPORT TICKETS ─────────────────────────────────
export const getSupportTickets = async () => {
    const response = await api.get('/support');
    return response.data;
};

export const createSupportTicket = async (data) => {
    const response = await api.post('/support', data);
    return response.data;
};

export const getTicketMessages = async (id) => {
    const response = await api.get(`/support/${id}/messages`);
    return response.data;
};

export const sendTicketMessage = async (id, message) => {
    const response = await api.post(`/support/${id}/messages`, { message });
    return response.data;
};

export const resolveTicket = async (id) => {
    const response = await api.put(`/support/${id}/resolve`);
    return response.data;
};

export const deleteTicket = async (id) => {
    const response = await api.delete(`/support/${id}`);
    return response.data;
};

// ─── USER PROFILE UPDATE ─────────────────────────────
export const updateUser = async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
};

// ─── CLIENT SETTINGS ─────────────────────────────────
export const getClientSettings = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

export const updateClientSettings = async (id, data) => {
    const response = await api.put(`/users/${id}/settings`, data);
    return response.data;
};

// ─── BROKER SHARES ───────────────────────────────────
export const getBrokerShares = async (id) => {
    const response = await api.get(`/users/${id}/broker-shares`);
    return response.data;
};

export const getBrokerClients = async (id) => {
    const response = await api.get(`/users/${id}/broker-clients`);
    return response.data;
};

export const updateBrokerShares = async (id, data) => {
    const response = await api.put(`/users/${id}/broker-shares`, data);
    return response.data;
};

// ─── DOCUMENTS ───────────────────────────────────────
export const getDocuments = async (id) => {
    const response = await api.get(`/users/${id}/documents`);
    return response.data;
};

export const updateDocuments = async (id, formData) => {
    // Handle FormData (file uploads)
    const response = await api.put(`/users/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// ─── USER SEGMENTS ───────────────────────────────────
export const getUserSegments = async (id) => {
    const response = await api.get(`/users/${id}/segments`);
    return response.data;
};

export const updateUserSegments = async (id, segments) => {
    const response = await api.put(`/users/${id}/segments`, { segments });
    return response.data;
};

// ─── PASSWORDS (update via admin) ────────────────────
export const updateUserPasswords = async (id, data) => {
    const response = await api.put(`/users/${id}/passwords`, data);
    return response.data;
};

export const updateUserStatus = async (userId, status) => {
    const response = await api.put(`/users/${userId}/status`, { status });
    return response.data;
};

export const deleteUser = async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
};

export const resetAccount = async (userId) => {
    const response = await api.post(`/users/${userId}/reset-account`);
    return response.data;
};

export const recalculateBrokerage = async (userId) => {
    const response = await api.post(`/users/${userId}/recalculate-brokerage`);
    return response.data;
};

// ─── DASHBOARD / MARKET ─────────────────────────────
export const getIndices = async () => {
    const response = await api.get('/dashboard/indices');
    return response.data;
};

export const getWatchlist = async () => {
    const response = await api.get('/dashboard/watchlist');
    return response.data;
};

export const getLiveM2M = async (userId = null, days = 7) => {
    const response = await api.get('/dashboard/live-m2m', { params: { userId, days } });
    return response.data;
};

export const getBrokerM2M = async () => {
    const response = await api.get('/dashboard/broker-m2m');
    return response.data;
};

export const getHierarchyAccounts = async (params = {}) => {
    const response = await api.get('/accounts/hierarchy', { params });
    return response.data;
};

export const getGroupTrades = async (filters = {}) => {
    const response = await api.get('/trades/group', { params: filters });
    return response.data;
};

export const getTradeAudit = async () => {
    const response = await api.get('/security/trade-audit');
    return response.data;
};

export const globalBatchUpdate = async (data) => {
    const response = await api.post('/system/global-update', data);
    return response.data;
};

export const getSegmentValues = async (segment) => {
    const response = await api.get('/system/segment-values', { params: { segment } });
    return response.data;
};

export const resetSegmentValues = async (data) => {
    const response = await api.post('/system/reset-segment', data);
    return response.data;
};

export const getAuditLog = async () => {
    const response = await api.get('/system/audit-log');
    return response.data;
};

export const getNegativeBalances = async () => {
    const response = await api.get('/accounts/negative-alerts');
    return response.data;
};

// ─── BANK DETAILS ─────────────────────────────────────
export const getBanks = async () => {
    const response = await api.get('/bank');
    return response.data;
};

export const createBank = async (data) => {
    const response = await api.post('/bank', data);
    return response.data;
};

export const updateBank = async (id, data) => {
    const response = await api.put(`/bank/${id}`, data);
    return response.data;
};

export const deleteBank = async (id) => {
    const response = await api.delete(`/bank/${id}`);
    return response.data;
};

export const toggleBankStatus = async (id) => {
    const response = await api.patch(`/bank/${id}/toggle-status`);
    return response.data;
};

// ─── NEW CLIENT BANK (Payment Details for Deposits) ──
export const getNewClientBank = async () => {
    const response = await api.get('/new-client-bank');
    return response.data;
};

export const updateNewClientBank = async (data) => {
    const response = await api.put('/new-client-bank', data);
    return response.data;
};

// ─── ADMIN PANEL: PERMISSIONS, THEME, LOGO ───────────
export const getInitData = async () => {
    const response = await api.get('/admin/init');
    return response.data;
};

export const getAdminMenuPermissions = async (userId) => {
    const response = await api.get(`/admin/menu-permissions/${userId}`);
    return response.data;
};

export const saveAdminMenuPermissions = async (userId, menuPermissions) => {
    const response = await api.post(`/admin/menu-permissions/${userId}`, {
        menuPermissions
    });
    return response.data;
};

export const getThemeSettings = async () => {
    const response = await api.get('/admin/theme');
    return response.data;
};

export const saveThemeSettings = async (theme) => {
    const response = await api.post('/admin/theme', { theme });
    return response.data;
};

export const getLogoPath = async () => {
    const response = await api.get('/admin/logo');
    return response.data;
};

export const uploadLogo = async (formData) => {
    const response = await api.post('/admin/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const saveAdminPanelSettings = async (userId, theme, logoFile, profileImageFile, bgImageFile) => {
    const fd = new FormData();
    fd.append('theme', JSON.stringify(theme));

    console.log(`[API] saveAdminPanelSettings - userId: ${userId}`);
    console.log(`[API] logoFile before append:`, logoFile ? `${logoFile.name} (${logoFile.size} bytes)` : 'null');
    console.log(`[API] bgImageFile before append:`, bgImageFile ? `${bgImageFile.name} (${bgImageFile.size} bytes)` : 'null');

    // ✅ Explicitly check and append files
    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
        fd.append('logo', logoFile, logoFile.name);
        console.log(`[API] ✅ Appended logo to FormData`);
    } else {
        console.log(`[API] ⚠️ Logo not appended - logoFile:`, logoFile);
    }

    if (profileImageFile && profileImageFile instanceof File && profileImageFile.size > 0) {
        fd.append('profileImage', profileImageFile, profileImageFile.name);
        console.log(`[API] ✅ Appended profileImage to FormData`);
    }

    if (bgImageFile && bgImageFile instanceof File && bgImageFile.size > 0) {
        fd.append('bgImage', bgImageFile, bgImageFile.name);
        console.log(`[API] ✅ Appended bgImage to FormData`);
    } else {
        console.log(`[API] ⚠️ BgImage not appended - bgImageFile:`, bgImageFile);
    }

    console.log(`[API] FormData ready, sending to /admin/panel-settings/${userId}`);

    // Send with proper multipart/form-data headers - remove default JSON header
    const response = await api.post(`/admin/panel-settings/${userId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log(`[API] Response:`, response.data);
    return response.data;
};

export const getAdminPanelSettings = async (userId) => {
    const response = await api.get(`/admin/panel-settings/${userId}`);
    return response.data;
};

// ─── NOTIFICATIONS ────────────────────────────────────
export const getNotifications = async (source) => {
    const params = source ? { source } : {};
    const response = await api.get('/notifications', { params });
    return response.data;
};

export const markNotificationRead = async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
};

export const markAllNotificationsRead = async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
};

export const createNotification = async (data) => {
    const response = await api.post('/notifications', data);
    return response.data;
};

export const deleteNotification = async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
};

export const getNotificationUsersByRole = async (role) => {
    const response = await api.get(`/notifications/users/${role}`);
    return response.data;
};

// ─── KITE API ─────────────────────────────────────────
export const getKiteLoginURL = async () => {
    const response = await api.get('/kite/login');
    return response.data;
};

export const setKiteAccessToken = async (access_token) => {
    const response = await api.post('/kite/set-token', { access_token });
    return response.data;
};

// Dashboard data — curated: NIFTY50 + MCX + MCX Mini + NFO (single call)
export const getKiteDashboard = async () => {
    const response = await dedupedGet('/kite/market/dashboard', { timeout: 30000 });
    return response.data;
};

// Unified Watchlist — ONE API for NSE + NFO FUT + NFO index OPT + MCX FUT + MCX OPT (quotes from Kite)
export const getKiteUnifiedWatchlist = async (params = {}) => {
    const response = await dedupedGet('/kite/market/watchlist', { params, timeout: 30000 });
    return response.data;
};

// Search instruments
export const searchKiteInstruments = async (q, exchange = null) => {
    const params = { q };
    if (exchange) {
        params.exchange = exchange;
    }
    const response = await api.get('/kite/instruments/search', { params });
    return response.data || [];
};

// Live quotes for specific symbols
export const getKiteQuotes = async (symbols) => {
    if (!symbols || symbols.length === 0) return {};
    const response = await api.get('/kite/market/quotes', {
        params: { symbols: symbols.join(',') },
        timeout: 15000
    });
    return response.data.data || {};
};

// Options Chain — range-based CE + PE strikes
export const getOptionsChain = async (symbol, expiry, range = 1000) => {
    const response = await api.get('/kite/market/options-chain', {
        params: { symbol, expiry, range },
        timeout: 30000
    });
    return response.data;
};

// MCX Futures — filtered live futures data
export const getMcxFutures = async (filter = 'ALL') => {
    const response = await api.get('/kite/market/mcx-futures', {
        params: { filter },
        timeout: 30000
    });
    return response.data;
};

// MCX Options Chain — CE + PE for a specific MCX commodity
export const getMcxOptions = async (symbol, expiry, range = 2000) => {
    const response = await api.get('/kite/market/mcx-options', {
        params: { symbol, expiry, range },
        timeout: 30000
    });
    return response.data;
};

// MCX Option Expiries — available dates for a MCX symbol
export const getMcxExpiries = async (symbol) => {
    const response = await api.get('/kite/market/mcx-expiries', {
        params: { symbol }
    });
    return response.data;
};

// ── Market Data (Crypto + Forex via Twelve Data) ──
export const getCryptoData = async () => {
    const response = await dedupedGet('/market-data/crypto');
    return response.data;
};

export const getForexData = async () => {
    const response = await dedupedGet('/market-data/forex');
    return response.data;
};

export const getAllMarketData = async () => {
    const response = await dedupedGet('/market-data/all');
    return response.data;
};

// Options Expiries — available expiry dates for a symbol
export const getOptionsExpiries = async (symbol) => {
    const response = await api.get('/kite/market/options-expiries', {
        params: { symbol }
    });
    return response.data;
};

export const getKiteStatus = async () => {
    const response = await api.get('/kite/status');
    return response.data;
};

export const disconnectKite = async () => {
    const response = await api.post('/kite/disconnect');
    return response.data;
};

export const getKiteProfile = async () => {
    const response = await api.get('/kite/profile');
    return response.data;
};

export const getKiteMargins = async () => {
    const response = await api.get('/kite/margins');
    return response.data;
};

export const getKiteHoldings = async () => {
    const response = await api.get('/kite/holdings');
    return response.data;
};

export const getKitePositions = async () => {
    const response = await api.get('/kite/positions');
    return response.data;
};

export const getKiteOrders = async () => {
    const response = await api.get('/kite/orders');
    return response.data;
};

export const getKiteTrades = async () => {
    const response = await api.get('/kite/trades');
    return response.data;
};

export const getKiteQuote = async (instruments) => {
    const response = await api.get('/kite/quote', {
        params: { i: instruments }
    });
    return response.data;
};

export const getKiteLTP = async (instruments) => {
    const response = await api.get('/kite/quote/ltp', {
        params: { i: instruments }
    });
    return response.data;
};

export const getKiteInstruments = async () => {
    const response = await api.get('/kite/instruments');
    return response.data;
};


export const getKiteTickerStatus = async () => {
    const response = await api.get('/kite/ticker/status');
    return response.data;
};

export const getKiteTickerPrices = async () => {
    const response = await api.get('/kite/ticker/prices');
    return response.data;
};

export const subscribeKiteTicker = async (tokens, instrumentMap) => {
    const response = await api.post('/kite/ticker/subscribe', {
        tokens,
        instrumentMap
    });
    return response.data;
};

export const reconnectKiteTicker = async () => {
    const response = await api.post('/kite/ticker/reconnect');
    return response.data;
};

// ─── AI / VOICE COMMANDS ──────────────────────────────
export const parseVoiceCommand = async (text) => {
    const response = await api.post('/ai/ai-parse', { text });
    return response.data;
};

export const executeCommand = async (commandData) => {
    const response = await api.post('/ai/execute-command', commandData);
    return response.data;
};

export const submitVoiceRecording = async (audioBlob, meta = {}) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, `recording_${Date.now()}.webm`);
    formData.append('meta', JSON.stringify(meta));

    const response = await api.post('/voice/record', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// ─── AI CHAT ───────────────────────────────────────────
export const sendAIMessage = async (message) => {
    const response = await api.post('/ai/chat', { message });
    return response.data;
};

// ─── CONTRACT MANAGEMENT ────────────────────────────────
export const getAllContracts = async () => {
    const response = await api.get('/contracts/all');
    return response.data;
};

export const getSelectedContracts = async () => {
    const response = await api.get('/contracts/selected');
    return response.data;
};

export const saveContractSelection = async (contracts) => {
    const response = await api.post('/contracts/save-selection', { contracts });
    return response.data;
};

export const searchContracts = async (query) => {
    const response = await api.get('/contracts/search', { params: { q: query } });
    return response.data;
};

// Returns ONLY Market-Watch-relevant scripts (MCX/NFO/NSE bases) with ALL their expiries
export const getMarketWatchExpiries = async () => {
    const response = await api.get('/contracts/market-watch-expiries');
    return response.data;
};

// ─── SMART ROLLOVER SUGGESTION SYSTEM ──────────────────────────────────────
export const getRolloverSuggestions = async () => {
    const response = await api.get('/contracts/rollover/suggestions');
    return response.data;
};

export const setRolloverConfig = async (enabled) => {
    const response = await api.post('/contracts/rollover/config', { enabled });
    return response.data;
};

export const enableNextContract = async (next_contract, current_contract) => {
    const response = await api.post('/contracts/rollover/enable-next', { next_contract, current_contract });
    return response.data;
};

export const completeRollover = async (next_contract, current_contract) => {
    const response = await api.post('/contracts/rollover/complete', { next_contract, current_contract });
    return response.data;
};

export const disableCurrentContract = async (current_contract) => {
    const response = await api.post('/contracts/rollover/disable-current', { current_contract });
    return response.data;
};

export const ping = async () => {
    const response = await api.get('/system/ping');
    return response.data;
};

export const syncKiteInstruments = async () => {
    const response = await api.get('/kite/sync-instruments');
    return response.data;
};

// ─── WEEKLY SETTLEMENTS ───────────────────────────────────────────────────
export const getWeeklySettlementConfig = async () => {
    const response = await api.get('/weekly-settlements/config');
    return response.data;
};

export const updateWeeklySettlementConfig = async (data) => {
    const response = await api.put('/weekly-settlements/config', data);
    return response.data;
};

export const runWeeklySettlement = async (data = {}) => {
    const response = await api.post('/weekly-settlements/run', data);
    return response.data;
};

export const getWeeklySettlementsHistory = async (params = {}) => {
    const response = await api.get('/weekly-settlements', { params });
    return response.data;
};

export const runResetID = async (data = {}) => {
    const response = await api.post('/weekly-settlements/run-reset-id', data);
    return response.data;
};

export const getResetIDConfig = async () => {
    const response = await api.get('/weekly-settlements/reset-id-config');
    return response.data;
};

// ─── CONTACT INQUIRIES ───────────────────────────────────────────────────
export const getContactInquiries = async (params = {}) => {
    const response = await api.get('/contact', { params });
    return response.data;
};

export const updateContactInquiry = async (id, data) => {
    const response = await api.put(`/contact/${id}`, data);
    return response.data;
};

export const deleteContactInquiry = async (id) => {
    const response = await api.delete(`/contact/${id}`);
    return response.data;
};


