import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { X, User, ChevronDown, Settings, Lock, Key, Eye, FileText, Loader2, ArrowLeft } from 'lucide-react';
import DashboardFilters from '../../components/DashboardFilters';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { useBrokerPermissions } from '../../hooks/useBrokerPermissions';
import * as api from '../../services/api';
import { useMarketData } from '../../context/MarketDataContext';
import { displaySymbol, exchangeFromRow, getScripPrice, getScripBid, getScripAsk } from '../../utils/marketUtils';
import { calculateEquityPnL, calculateMcxPnL } from '../../utils/equityPnL';
import { calculateUsdPnL, calculateCryptoPnL, calculateForexPnL, calculateComexPnL } from '../../utils/usdPnL';
import { calculateSegmentMargin } from '../../utils/segmentMargin';
import { MCX_LOT_SIZES, getMcxLotSize } from '../../utils/mcxLotSizes';

const isMcxSymbol = (symbol) => {
    if (!symbol) return false;
    const sym = symbol.toUpperCase();
    const base = sym.split(':').pop().replace(/\d+.*/, '').trim();
    return sym.startsWith('MCX:') ||
        ['GOLD', 'SILVER', 'CRUDEOIL', 'NATURALGAS', 'COPPER', 'ZINC', 'NICKEL', 'LEAD',
            'ALUMINIUM', 'MENTHAOIL', 'COTTON', 'BULLDEX'].some(k => base.startsWith(k));
};

// Keep alias for P&L calculation (used elsewhere)
const getHardcodedMultiplier = (symbol) => getMcxLotSize(symbol) || 1;

// ─── calcTurnover ─────────────────────────────────────────────────────────────
// MCX   → hardcoded MCX_LOT_SIZES
// NFO / COMEX / FOREX / CRYPTO → trade.lot_size_at_entry or trade.lot_size (from DB via API)
const calcTurnover = (price, qty, trade) => {
    const p = parseFloat(price || 0);
    if (!p) return '-';

    if (trade?.turnover && parseFloat(trade.turnover) > 0 && price == trade?.entry_price) {
        return parseFloat(trade.turnover).toFixed(2);
    }

    const isUnitMode = trade?.trade_mode === 'UNITS' || trade?.equity_units_mode === 1 || trade?.equity_units_mode === true || trade?.equity_units_mode === '1';
    let totalShares = 0;

    if (trade?.actual_qty != null && !isNaN(parseFloat(trade.actual_qty)) && parseFloat(trade.actual_qty) > 0) {
        totalShares = parseFloat(trade.actual_qty);
    } else if (trade?.qty_input != null && !isNaN(parseFloat(trade.qty_input))) {
        const qIn = parseFloat(trade.qty_input);
        const lotSize = isMcxSymbol(trade?.symbol)
            ? (getMcxLotSize(trade.symbol) || 1)
            : parseFloat(trade?.lot_size || trade?.lot_size_at_entry || 1);
        totalShares = isUnitMode ? qIn : (qIn * lotSize);
    } else {
        const q = parseFloat(qty || trade?.qty || 0);
        totalShares = q;
    }

    return (p * totalShares).toFixed(2);
};

const ClientDetailPage = ({ client, onClose, onUpdate, onReset, onRecalculate, onDuplicate, onChangePassword, onDelete, onLogout, onNavigate }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin, canViewBackup, user } = useAuth();
    const { permissions } = useBrokerPermissions(user?.userId, user?.role);

    // Support client prop, location.state, or URL id (for refresh)
    const effectiveClient = client || location.state?.client || (id ? { id } : null);

    const [showDetails, setShowDetails] = useState(false);
    const [showActionsDropdown, setShowActionsDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const profileRef = useRef(null);
    const [kycStatus, setKycStatus] = useState(effectiveClient?.kycStatus || 'Pending');
    const [documents, setDocuments] = useState({});
    const [docsLoaded, setDocsLoaded] = useState(false);
    const [viewDoc, setViewDoc] = useState(null); // { url, label, isPdf }

    // Real data states
    const [profileData, setProfileData] = useState(null);
    const [weeklyBalance, setWeeklyBalance] = useState(null);
    const [fundsData, setFundsData] = useState([]);
    const [activeTrades, setActiveTrades] = useState([]);
    const [closedTrades, setClosedTrades] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const { watchlistRows, cryptoData, forexData, commodityData, kiteStatus, dashboardSections } = useMarketData();
    const kiteConnected = kiteStatus?.connected !== false;
    const kiteError = !kiteConnected ? 'Kite is not connected. Please connect with a valid Zerodha token.' : null;
    const [pendingTab, setPendingTab] = useState('MCX');
    const [completedTab, setCompletedTab] = useState('MCX');
    const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
    const [tradeToClose, setTradeToClose] = useState(null);
    const [closeSellRate, setCloseSellRate] = useState('');
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState('success'); // 'success', 'error'
    const [popupOpen, setPopupOpen] = useState(false);
    const kitePollingRef = useRef(null);

    // Fetch all effectiveClient data on mount in parallel
    useEffect(() => {
        if (!effectiveClient?.id) return;

        const loadAll = async () => {
            setLoading(true);
            try {
                if (effectiveClient.username) {
                    // All data can be fetched in parallel immediately
                    const [
                        clientData,
                        weekly,
                        funds,
                        active,
                        closed,
                        pending,
                        completed
                    ] = await Promise.all([
                        api.getClientById(effectiveClient.id).catch(e => { console.error('Profile load error:', e); return null; }),
                        api.getClientWeeklyBalance(effectiveClient.id).catch(e => { console.error('Weekly balance load error:', e); return null; }),
                        api.getTraderFunds({ userId: effectiveClient.username, current_week_only: true }).catch(e => { console.error('Funds load error:', e); return []; }),
                        api.getTrades({ user_id: effectiveClient.id, status: 'OPEN', is_pending: 0 }).catch(e => { console.error('Active trades error:', e); return []; }),
                        api.getClosedPositions({ user_id: effectiveClient.id, current_week_only: true }).catch(e => { console.error('Closed positions error:', e); return []; }),
                        api.getTrades({ user_id: effectiveClient.id, is_pending: 1, current_week_only: true }).catch(e => { console.error('Pending trades error:', e); return []; }),
                        api.getTrades({ user_id: effectiveClient.id, status: 'CLOSED', current_week_only: true }).catch(e => { console.error('Completed trades error:', e); return []; })
                    ]);

                    if (clientData) {
                        setProfileData(clientData);
                        setDocuments(clientData.documents || {});
                        if (clientData.documents?.kyc_status) {
                            setKycStatus(clientData.documents.kyc_status === 'VERIFIED' ? 'Approved' : clientData.documents.kyc_status === 'REJECTED' ? 'Rejected' : 'Pending');
                        }
                    }
                    setDocsLoaded(true);

                    if (weekly) {
                        setWeeklyBalance(weekly);
                    }

                    const rawActive = Array.isArray(active) ? active : active?.data || [];
                    setFundsData(Array.isArray(funds) ? funds : funds?.data || []);
                    setActiveTrades(rawActive.filter(t => !t.is_pending && t.is_pending !== 1));
                    setClosedTrades(Array.isArray(closed) ? closed : closed?.data || []);
                    setPendingOrders(Array.isArray(pending) ? pending : pending?.data || []);
                    setCompletedOrders(Array.isArray(completed) ? completed : completed?.data || []);
                } else {
                    // Username not present initially (e.g. on direct refresh).
                    // Fetch profile first, then remaining endpoints in parallel.
                    const clientData = await api.getClientById(effectiveClient.id).catch(e => { console.error('Profile load error:', e); return null; });
                    if (clientData) {
                        setProfileData(clientData);
                        setDocuments(clientData.documents || {});
                        if (clientData.documents?.kyc_status) {
                            setKycStatus(clientData.documents.kyc_status === 'VERIFIED' ? 'Approved' : clientData.documents.kyc_status === 'REJECTED' ? 'Rejected' : 'Pending');
                        }
                    }
                    setDocsLoaded(true);

                    const username = clientData?.profile?.username || '';
                    const [
                        weekly,
                        funds,
                        active,
                        closed,
                        pending,
                        completed
                    ] = await Promise.all([
                        api.getClientWeeklyBalance(effectiveClient.id).catch(e => { console.error('Weekly balance load error:', e); return null; }),
                        api.getTraderFunds({ userId: username, current_week_only: true }).catch(e => { console.error('Funds load error:', e); return []; }),
                        api.getTrades({ user_id: effectiveClient.id, status: 'OPEN', is_pending: 0 }).catch(e => { console.error('Active trades error:', e); return []; }),
                        api.getClosedPositions({ user_id: effectiveClient.id, current_week_only: true }).catch(e => { console.error('Closed positions error:', e); return []; }),
                        api.getTrades({ user_id: effectiveClient.id, is_pending: 1, current_week_only: true }).catch(e => { console.error('Pending trades error:', e); return []; }),
                        api.getTrades({ user_id: effectiveClient.id, status: 'CLOSED', current_week_only: true }).catch(e => { console.error('Completed trades error:', e); return []; })
                    ]);

                    if (weekly) {
                        setWeeklyBalance(weekly);
                    }

                    const rawActive = Array.isArray(active) ? active : active?.data || [];
                    setFundsData(Array.isArray(funds) ? funds : funds?.data || []);
                    setActiveTrades(rawActive.filter(t => !t.is_pending && t.is_pending !== 1));
                    setClosedTrades(Array.isArray(closed) ? closed : closed?.data || []);
                    setPendingOrders(Array.isArray(pending) ? pending : pending?.data || []);
                    setCompletedOrders(Array.isArray(completed) ? completed : completed?.data || []);
                }
            } catch (err) {
                console.error('Error loading client details:', err);
            } finally {
                setLoading(false);
            }
        };

        loadAll();
    }, [effectiveClient?.id]);


    const fetchActiveTrades = async () => {
        try {
            const res = await api.getTrades({ user_id: effectiveClient.id, status: 'OPEN', is_pending: 0 });
            const rawActive = Array.isArray(res) ? res : res?.data || [];
            setActiveTrades(rawActive.filter(t => !t.is_pending && t.is_pending !== 1));
        } catch (err) {
            console.error('Failed to refresh active trades:', err);
        }
    };

    const fetchClosedTrades = async () => {
        try {
            const closed = await api.getClosedPositions({ user_id: effectiveClient.id, current_week_only: true });
            setClosedTrades(Array.isArray(closed) ? closed : closed?.data || []);
        } catch (e) { console.error('Closed trades refresh error:', e); }
    };

    const refreshAllTrades = async () => {
        setLoading(true);
        await Promise.all([
            fetchActiveTrades(),
            fetchClosedTrades(),
            // Optionally also clear pending/completed
            (async () => {
                try {
                    const pending = await api.getTrades({ user_id: effectiveClient.id, is_pending: 1, current_week_only: true });
                    setPendingOrders(Array.isArray(pending) ? pending : pending?.data || []);
                } catch (e) { console.error('Pending refresh error:', e); }
            })(),
            (async () => {
                try {
                    const completed = await api.getTrades({ user_id: effectiveClient.id, status: 'CLOSED', current_week_only: true });
                    setCompletedOrders(Array.isArray(completed) ? completed : completed?.data || []);
                } catch (e) { console.error('Completed refresh error:', e); }
            })(),
        ]);
        setLoading(false);
    };

    const handleApproveKYC = async () => {
        try {
            const fd = new FormData();
            fd.append('kycStatus', 'VERIFIED');
            await api.updateDocuments(effectiveClient.id, fd);
            setKycStatus('Approved');
            if (onUpdate) onUpdate({ ...effectiveClient, kycStatus: 'VERIFIED' });
        } catch (e) {
            setPopupMessage('Failed to approve KYC: ' + (e.response?.data?.message || e.message));
            setPopupType('error');
            setPopupOpen(true);
        }
    };

    const handleRejectKYC = async () => {
        try {
            const fd = new FormData();
            fd.append('kycStatus', 'REJECTED');
            await api.updateDocuments(effectiveClient.id, fd);
            setKycStatus('Rejected');
            if (onUpdate) onUpdate({ ...effectiveClient, kycStatus: 'REJECTED' });
        } catch (e) {
            setPopupMessage('Failed to reject KYC: ' + (e.response?.data?.message || e.message));
            setPopupType('error');
            setPopupOpen(true);
        }
    };

    const handleResetAccount = async () => {
        setResetLoading(true);
        setResetError('');
        try {
            await api.resetAccount(effectiveClient.id);
            setResetConfirmOpen(false);
            setResetPassword('');
            setPopupMessage('Account reset successfully');
            setPopupType('success');
            setPopupOpen(true);
            setTimeout(() => {
                if (onClose) onClose();
            }, 1500);
        } catch (err) {
            setResetError(err?.response?.data?.message || err?.message || 'Failed to reset account');
        } finally {
            setResetLoading(false);
        }
    };

    // Build effectiveClientData from real profile or fallback to props
    const profile = profileData?.profile || {};
    const settings = profileData?.settings || {};
    const config = settings.config || {};

    const effectiveClientData = {
        ...config,
        id: profile.id || effectiveClient?.id || '',
        name: profile.full_name || effectiveClient?.fullName || effectiveClient?.full_name || '',
        mobile: profile.mobile || effectiveClient?.mobile || '',
        username: profile.username || effectiveClient?.username || '',
        city: profile.city || effectiveClient?.city || '',
        accountStatus: profile.status || effectiveClient?.status || 'Active',
        allowOrdersHighLow: settings.allow_orders_between_hl !== undefined ? (settings.allow_orders_between_hl ? 'Yes' : 'No') : (effectiveClient?.allow_orders_between_hl ? 'Yes' : 'No'),
        allowFreshEntry: settings.allow_fresh_entry !== undefined ? (settings.allow_fresh_entry ? 'Yes' : 'No') : (effectiveClient?.allow_fresh_entry ? 'Yes' : 'No'),
        demoAccount: profile.is_demo !== undefined ? (profile.is_demo ? 'Yes' : 'No') : (effectiveClient?.is_demo ? 'Yes' : 'No'),
        autoCloseLossPercent: settings.auto_close_at_m2m_pct || config.autoClosePercentage || '90',
        notifyLossPercent: settings.notify_at_m2m_pct || config.notifyPercentage || '70',
        // MCX fields
        mcxTrading: (config.mcxTrading === true || config.mcxTrading === 'Active' || config.mcxTrading === 'true') ? 'Active' : 'Disabled',
        banMcxLimitOrder: config.banMcxLimitOrder ? 'Yes' : 'No',
        mcxBrokerageType: config.mcxBrokerageType === 'per_crore' ? 'Per Crore Basis' : config.mcxBrokerageType === 'per_lot' ? 'Per Lot Basis' : (config.mcxBrokerageType || 'Per Crore Basis'),
        mcxBrokerage: config.mcxBrokerage || '0',
        mcxExposureType: config.mcxExposureType === 'per_turnover' ? 'Per Turnover Basis' : (config.mcxExposureType || 'Per Turnover Basis'),
        minLotMCX: config.mcxMinLot || '1',
        maxLotMCX: config.mcxMaxLot || '100',
        maxScripMCX: config.mcxMaxLotScrip || config.maxScripMCX || config.mcxMaxScrip || config.maxLotScripMCX || '1000',
        maxLotScripMCX: config.mcxMaxLotScrip || config.maxScripMCX || config.mcxMaxScrip || config.maxLotScripMCX || '1000',
        maxSizeAllMCX: config.mcxMaxSizeAll || '5000',
        intradayMarginMCX: config.mcxIntradayMargin || '500',
        holdingMarginMCX: config.mcxHoldingMargin || '100',
        mcxMinTimeToBookProfit: config.mcxMinTimeToBookProfit || '120',
        mcxScalpingStopLoss: config.mcxScalpingStopLoss || 'Disabled',
        // Equity fields
        equityTrading: (config.equityTrading === true || config.equityTrading === 'Active' || config.equityTrading === 'true') ? 'Active' : 'Disabled',
        banEquityLimitOrder: config.banEquityLimitOrder ? 'Yes' : 'No',
        equityBrokerage: config.equityBrokerage || '0',
        minLotEquity: config.equityMinLot || '1',
        maxLotEquity: config.equityMaxLot || '100',
        minLotEquityIndex: config.equityMinIndexLot || config.minLotEquityIndex || '1',
        maxLotEquityIndex: config.equityMaxIndexLot || config.maxLotEquityIndex || '100',
        maxScripEquity: config.equityMaxScrip || config.maxScripEquity || '500',
        maxScripEquityIndex: config.equityMaxIndexScrip || config.maxScripEquityIndex || '500',
        maxSizeAllEquity: config.equityMaxSizeAll || '2000',
        maxSizeAllEquityIndex: config.equityMaxSizeAllIndex || '2000',
        intradayMarginEquity: config.equityIntradayMargin || '500',
        holdingMarginEquity: config.equityHoldingMargin || '100',
        equityOrdersAway: config.equityOrdersAway || '5',
        equityMinTimeToBookProfit: config.equityMinTimeToBookProfit || '120',
        equityScalpingStopLoss: config.equityScalpingStopLoss || 'Disabled',
        // Options fields
        optionsTrading: (config.optionsTrading === 'Active' || config.optionsTrading === true || config.indexOptionsTrading || config.equityOptionsTrading || config.mcxOptionsTrading) ? 'Active' : 'Disabled',
        indexOptionsTrading: config.indexOptionsTrading ? 'Active' : 'Disabled',
        equityOptionsTrading: config.equityOptionsTrading ? 'Active' : 'Disabled',
        mcxOptionsTrading: config.mcxOptionsTrading ? 'Active' : 'Disabled',
        banOptionsLimitOrder: config.banOptionsLimitOrder ? 'Yes' : 'No',
        optionsBrokerage: config.optionsBrokerage || config.optionsIndexBrokerage || config.optionsEquityBrokerage || '20',
        optionsIndexBrokerageType: config.optionsIndexBrokerageType === 'per_lot' ? 'Per Lot Basis' : 'Per Crore Basis',
        optionsIndexBrokerage: config.optionsIndexBrokerage || '20',
        optionsEquityBrokerageType: config.optionsEquityBrokerageType === 'per_lot' ? 'Per Lot Basis' : 'Per Crore Basis',
        optionsEquityBrokerage: config.optionsEquityBrokerage || '20',
        optionsMcxBrokerageType: config.optionsMcxBrokerageType === 'per_lot' ? 'Per Lot Basis' : 'Per Crore Basis',
        optionsMcxBrokerage: config.optionsMcxBrokerage || '20',
        optionsMinBidPrice: config.optionsMinBidPrice || '1',
        optionsIndexShortSelling: config.optionsIndexShortSelling || 'No',
        optionsEquityShortSelling: config.optionsEquityShortSelling || 'No',
        optionsMcxShortSelling: config.optionsMcxShortSelling || 'No',
        minLotEquityOptions: config.optionsEquityMinLot || config.minLotEquityOptions || config.equityOptionsMinLot || '0',
        maxLotEquityOptions: config.optionsEquityMaxLot || config.maxLotEquityOptions || config.equityOptionsMaxLot || '50',
        minLotEquityIndexOptions: config.optionsIndexMinLot || config.minLotEquityIndexOptions || config.indexOptionsMinLot || '0',
        maxLotEquityIndexOptions: config.optionsIndexMaxLot || config.maxLotEquityIndexOptions || config.indexOptionsMaxLot || '20',
        optionsEquityMinLot: config.optionsEquityMinLot || '0',
        optionsEquityMaxLot: config.optionsEquityMaxLot || '50',
        optionsIndexMinLot: config.optionsIndexMinLot || '0',
        optionsIndexMaxLot: config.optionsIndexMaxLot || '20',
        optionsMcxMinLot: config.optionsMcxMinLot || '0',
        optionsMcxMaxLot: config.optionsMcxMaxLot || '50',
        maxScripEquityOptions: config.optionsEquityMaxScrip || config.maxScripEquityOptions || config.equityOptionsMaxScrip || '200',
        maxScripEquityIndexOptions: config.optionsIndexMaxScrip || config.maxScripEquityIndexOptions || config.indexOptionsMaxScrip || '200',
        optionsEquityMaxScrip: config.optionsEquityMaxScrip || '200',
        optionsIndexMaxScrip: config.optionsIndexMaxScrip || '200',
        optionsMcxMaxScrip: config.optionsMcxMaxScrip || '200',
        optionsMaxEquitySizeAll: config.optionsMaxEquitySizeAll || '200',
        optionsMaxIndexSizeAll: config.optionsMaxIndexSizeAll || '200',
        optionsMaxMcxSizeAll: config.optionsMaxMcxSizeAll || '200',
        intradayMarginOptions: config.intradayMarginOptions || config.optionsIndexIntraday || config.optionsEquityIntraday || '5',
        holdingMarginOptions: config.holdingMarginOptions || config.optionsIndexHolding || config.optionsEquityHolding || '2',
        optionsIndexIntraday: config.optionsIndexIntraday || '5',
        optionsIndexHolding: config.optionsIndexHolding || '2',
        optionsEquityIntraday: config.optionsEquityIntraday || '5',
        optionsEquityHolding: config.optionsEquityHolding || '2',
        optionsMcxIntraday: config.optionsMcxIntraday || '5',
        optionsMcxHolding: config.optionsMcxHolding || '2',
        optionsOrdersAway: config.optionsOrdersAway || '10',
        optionsMinTimeToBookProfit: config.optionsMinTimeToBookProfit || '120',
        optionsScalpingStopLoss: config.optionsScalpingStopLoss || 'Disabled',
        // COMEX fields
        comexTrading: config.comexTrading ? 'Active' : 'Disabled',
        comexBrokerage: config.comexBrokerage || '0',
        minLotComex: config.comexMinLot || '1',
        maxLotComex: config.comexMaxLot || '100',
        // FOREX fields
        forexTrading: config.forexTrading ? 'Active' : 'Disabled',
        forexBrokerage: config.forexBrokerage || '0',
        minLotForex: config.forexMinLot || '1',
        maxLotForex: config.forexMaxLot || '100',
        // CRYPTO fields
        cryptoTrading: config.cryptoTrading ? 'Active' : 'Disabled',
        cryptoBrokerage: config.cryptoBrokerage || '0',
        minLotCrypto: config.cryptoMinLot || '1',
        maxLotCrypto: config.cryptoMaxLot || '100',
        // General
        banAllSegmentLimitOrder: config.banAllSegmentLimitOrder ? 'Yes' : 'No',
        tradeEquityUnits: settings.trade_equity_units ? 'Yes' : 'No',
        ledgerBalance: profile.balance !== undefined ? profile.balance : (effectiveClient?.ledger_balance !== undefined ? effectiveClient.ledger_balance : (effectiveClient?.balance !== undefined ? effectiveClient.balance : '0')),
        creditLimit: profile.credit_limit !== undefined ? profile.credit_limit : (effectiveClient?.credit_limit !== undefined ? effectiveClient.credit_limit : '0'),
        broker: profile.assigned_broker_username
            ? `${profile.assigned_broker_username}${profile.assigned_broker_name ? ` (${profile.assigned_broker_name})` : ''}`
            : (config.broker || config.masterBroker || (profile.parent_role === 'BROKER' && profile.parent_username ? `${profile.parent_username}${profile.parent_name ? ` (${profile.parent_name})` : ''}` : (effectiveClient?.broker || 'Self / Direct'))),
        createdAt: profile.created_at || effectiveClient?.created_at || effectiveClient?.createdAt ? new Date(profile.created_at || effectiveClient?.created_at || effectiveClient?.createdAt).toLocaleString('en-IN') : '-',
        notes: profile.notes || settings.notes || config.notes || effectiveClient?.notes || '-',
        kycStatus: kycStatus,
        // Expiry rules
        autoSquareOff: config.autoSquareOff || 'No',
        expirySquareOffTime: config.expirySquareOffTime || '11:30',
        allowExpiringScrip: config.allowExpiringScrip || 'No',
        daysBeforeExpiry: config.daysBeforeExpiry || '0',
        // Bid gaps
        bidGaps: config.bidGaps || {},
        mcxLotMargins: config.mcxLotMargins || {},
        mcxLotBrokerage: config.mcxLotBrokerage || {},
    };

    const showIp = (ip) => ip && ip !== '::1' && ip !== '127.0.0.1' ? ip : '-';
    const fmtTime = (t) => { if (!t) return '-'; try { return new Date(t).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }); } catch { return t; } };





    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showActionsDropdown && !event.target.closest('.actions-dropdown-container')) {
                setShowActionsDropdown(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showActionsDropdown, showProfileDropdown]);

    // Check if doc counts uploaded
    const docCount = [documents.pan_screenshot, documents.aadhar_front, documents.aadhar_back, documents.bank_proof].filter(Boolean).length;

    return (
        <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 w-full max-w-full min-w-0 bg-[#1a2035] text-slate-300">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1a2035; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #4CAF50; border-radius: 4px; }
            `}</style>

            {/* Back Button & Header */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-white hover:text-green-400 transition-colors font-bold text-xs sm:text-sm"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>BACK</span>
                </button>
                <div className="flex items-center gap-2 text-white">
                    <span className="text-xs opacity-90">{new Date().toLocaleDateString('en-GB')}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-4 mb-6">

                <div className="space-y-6">
                    {/* Date Filters Grid as per Screenshot */}
                    <DashboardFilters client={effectiveClient || client} />

                    {/* Actions Button - NOT for sub-brokers */}
                    {!user?.isSubBroker && (canViewBackup() || (user?.role === 'BROKER' && (permissions.clientTasksAllowed === 'Yes' || permissions.createClientsAllowed === 'Yes'))) && (
                        <div className="relative actions-dropdown-container">
                            <button
                                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                                className="bg-[#9c27b0] hover:bg-[#8e24aa] text-white font-bold py-2.5 px-8 rounded transition-all text-[11px] uppercase tracking-widest shadow-lg flex items-center gap-3"
                            >
                                ACTIONS <span className="text-[10px] opacity-70">▼</span>
                            </button>

                            {showActionsDropdown && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded shadow-2xl border border-slate-200 w-[160px] z-50 overflow-hidden">
                                    {[
                                        { label: 'Update', action: () => onUpdate && onUpdate(effectiveClient), hidden: user?.role === 'BROKER' && permissions.createClientsAllowed !== 'Yes' },
                                        { label: 'KYC Document', action: () => navigate(`/trading-clients/kyc/${effectiveClientData.id || effectiveClient?.id}`), hidden: user?.role === 'BROKER' },
                                        { label: 'Reset Account', action: () => setResetConfirmOpen(true), hidden: user?.role === 'BROKER' && permissions.clientTasksAllowed !== 'Yes' },
                                        { label: 'Refresh Brokerage', action: () => onRecalculate && onRecalculate(effectiveClient), hidden: user?.role === 'BROKER' && permissions.clientTasksAllowed !== 'Yes' },
                                        { label: 'Duplicate', action: () => onDuplicate && onDuplicate(effectiveClient), hidden: user?.role === 'BROKER' },
                                        { label: 'Change Password', action: () => onChangePassword && onChangePassword(effectiveClient), hidden: user?.role === 'BROKER' && permissions.createClientsAllowed !== 'Yes' },
                                        { label: 'Delete Account', action: () => onDelete && onDelete(effectiveClient), hidden: user?.role === 'BROKER' },
                                    ].filter(item => !item.hidden).map((item, idx) => (
                                        <button
                                            key={item.label}
                                            onClick={() => { setShowActionsDropdown(false); item.action(); }}
                                            className={`w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors text-sm ${idx < 5 ? 'border-b border-slate-200' : ''}`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* View Details Button in a dark card-like container */}
                    <div className="bg-[#1f283e] p-4 rounded-md border border-white/5 shadow-inner">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full bg-[#5cb85c] hover:bg-[#4ea752] text-white font-bold py-4 px-6 rounded transition-all text-[14px] uppercase tracking-[0.2em] shadow-lg"
                        >
                            {showDetails ? 'HIDE DETAILS' : 'VIEW DETAILS'}
                        </button>
                    </div>

                    {/* Details UI Grid */}
                    {showDetails && (
                        <div className="animate-in slide-in-from-top-4 duration-300">
                            <div className="bg-[#1a2235] rounded shadow-xl overflow-hidden">
                                <table className="table-standard custom-table">
                                    <tbody className="text-[13px]">
                                        {[
                                            { label: 'ID', value: effectiveClientData.id },
                                            { label: 'Name', value: effectiveClientData.name },
                                            { label: 'Mobile', value: effectiveClientData.mobile },
                                            { label: 'Username', value: effectiveClientData.username },
                                            { label: 'City', value: effectiveClientData.city },
                                            { label: 'Account Status', value: effectiveClientData.accountStatus },
                                            { label: 'Allow Orders between High - Low?', value: effectiveClientData.allowOrdersHighLow },
                                            { label: 'Allow Fresh Entry Order above high & below low?', value: effectiveClientData.allowFreshEntry },
                                            { label: 'Demo account?', value: effectiveClientData.demoAccount },
                                            { label: 'Minimum lot size required per single trade of MCX', value: effectiveClientData.minLotMCX },
                                            { label: 'Maximum lot size allowed per single trade of MCX', value: effectiveClientData.maxLotMCX },
                                            { label: 'Minimum lot size required per single trade of Equity', value: effectiveClientData.minLotEquity },
                                            { label: 'Maximum lot size allowed per single trade of Equity', value: effectiveClientData.maxLotEquity },
                                            { label: 'Minimum lot size required per single trade of Equity INDEX', value: effectiveClientData.minLotEquityIndex },
                                            { label: 'Maximum lot size allowed per single trade of Equity INDEX', value: effectiveClientData.maxLotEquityIndex },
                                            { label: 'Maximum lot per scrip of MCX actively open', value: effectiveClientData.maxScripMCX },
                                            { label: 'Maximum lot per scrip of Equity actively open', value: effectiveClientData.maxScripEquity },
                                            { label: 'Maximum lot per scrip of Equity INDEX actively open', value: effectiveClientData.maxScripEquityIndex },
                                            { label: 'Minimum lot required per single trade of Equity Options', value: effectiveClientData.minLotEquityOptions },
                                            { label: 'Maximum lot allowed per single trade of Equity Options', value: effectiveClientData.maxLotEquityOptions },
                                            { label: 'Minimum lot required per single trade of Equity INDEX Options', value: effectiveClientData.minLotEquityIndexOptions },
                                            { label: 'Maximum lot allowed per single trade of Equity INDEX Options', value: effectiveClientData.maxLotEquityIndexOptions },
                                            { label: 'Maximum lot per scrip of Equity Options actively open', value: effectiveClientData.maxScripEquityOptions },
                                            { label: 'Maximum lot per scrip of Equity INDEX Options actively open', value: effectiveClientData.maxScripEquityIndexOptions },
                                            { label: 'Auto-Close active trades when losses reach % of Ledger balance', value: effectiveClientData.autoCloseLossPercent },
                                            { label: 'Notify client when losses reach % of Ledger balance', value: effectiveClientData.notifyLossPercent },
                                            { label: 'MCX Trading', value: effectiveClientData.mcxTrading },
                                            { label: 'Mcx Brokerage Type', value: effectiveClientData.mcxBrokerageType },
                                            { label: 'MCX brokerage', value: effectiveClientData.mcxBrokerage },
                                            { label: 'Exposure Mcx Type', value: effectiveClientData.mcxExposureType },
                                            { label: 'Intraday Exposure/Margin MCX', value: effectiveClientData.intradayMarginMCX },
                                            { label: 'Holding Exposure/Margin MCX', value: effectiveClientData.holdingMarginMCX },
                                            { label: 'Equity Trading', value: effectiveClientData.equityTrading },
                                            { label: 'Equity brokerage', value: effectiveClientData.equityBrokerage },
                                            { label: 'Intraday Exposure/Margin Equity', value: effectiveClientData.intradayMarginEquity },
                                            { label: 'Holding Exposure/Margin Equity', value: effectiveClientData.holdingMarginEquity },
                                            { label: 'Options Trading', value: effectiveClientData.optionsTrading },
                                            { label: 'Options brokerage', value: effectiveClientData.optionsBrokerage },
                                            { label: 'Intraday Exposure/Margin Options', value: effectiveClientData.intradayMarginOptions },
                                            { label: 'Holding Exposure/Margin Options', value: effectiveClientData.holdingMarginOptions },
                                            { label: 'Opening Balance (Current Week)', value: weeklyBalance ? parseFloat(weeklyBalance.opening_balance).toFixed(2) : parseFloat(effectiveClientData.ledgerBalance || 0).toFixed(2) },
                                            { label: 'Ledger Balance', value: parseFloat(effectiveClientData.ledgerBalance || 0).toFixed(2) },
                                            { label: 'Broker', value: effectiveClientData.broker },
                                            { label: 'Account Created At', value: effectiveClientData.createdAt },
                                            { label: 'NOTES', value: effectiveClientData.notes },
                                            { label: 'KYC Status', value: effectiveClientData.kycStatus }
                                        ].map((row, idx) => (
                                            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4 text-slate-400 w-1/2">{row.label}</td>
                                                <td className="px-6 py-4 font-medium text-slate-200">{row.value || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Fund - Withdrawal & Deposits Section */}
                    <div className="w-full lg:w-1/2 mb-10">
                        <div className="bg-[#1a2235] rounded shadow-xl overflow-hidden">
                            <div className="p-4">
                                <h3 className="text-white text-[19px] font-medium mb-1 tracking-tight">Fund - Withdrawal & Deposits</h3>
                                <p className="text-slate-400 text-[13px] mb-2 opacity-70">
                                    {loading ? 'Loading...' : `Showing ${fundsData.length} of ${fundsData.length} items.`}
                                </p>
                                <div className="w-full h-[1px] bg-white/5 mb-4"></div>

                                <div className="overflow-x-auto">
                                    <table className="table-standard custom-table">
                                        <thead>
                                            <tr className="text-white text-[14px] font-bold">
                                                <th className="pb-4 pr-4">Type</th>
                                                <th className="pb-4 px-4">Amount</th>
                                                <th className="pb-4 px-4 text-center">Created At</th>
                                                <th className="pb-4 pl-4 text-right">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[13px] text-white/90 border-t border-white/5">
                                            {fundsData.length === 0 ? (
                                                <tr><td colSpan="4" className="py-8 text-center text-[#a0aec0]">{loading ? 'Loading...' : 'No records found'}</td></tr>
                                            ) : fundsData.filter(fund => {
                                                // Hide zero-amount settlement entries (+0.00 noise)
                                                const t = (fund.type || '').toUpperCase();
                                                const isSettlementType = t === 'WEEKLY_SETTLEMENT' || (fund.remarks || fund.notes || '').toUpperCase().includes('WEEKLY SETTLEMENT');
                                                if (isSettlementType && parseFloat(fund.amount || 0) === 0) return false;
                                                return true;
                                            }).map((fund, idx) => {
                                                const typeUpper = (fund.type || '').toUpperCase();
                                                const remarksUpper = (fund.remarks || fund.notes || '').toUpperCase();
                                                const isOpening = typeUpper === 'OPENING_BALANCE' || typeUpper === 'OPENING';
                                                const isSettlement = typeUpper === 'WEEKLY_SETTLEMENT' || remarksUpper.includes('WEEKLY SETTLEMENT');
                                                const isDeposit = typeUpper === 'DEPOSIT';
                                                const rawAmount = parseFloat(fund.amount || 0);
                                                const isPos = rawAmount >= 0;

                                                return (
                                                    <tr key={fund.id || idx} className={`border-t border-white/5 transition-colors hover:bg-white/[0.02] ${isOpening ? 'bg-blue-500/[0.04]' : (isSettlement ? 'bg-purple-500/[0.04]' : '')}`}>
                                                        <td className="py-4 pr-4">
                                                            {isOpening ? (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                                    OPENING
                                                                </span>
                                                            ) : isSettlement ? (
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isPos ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                                                    SETTLEMENT
                                                                </span>
                                                            ) : (
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isDeposit ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                    {isDeposit ? 'DEPOSIT' : 'WITHDRAW'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className={`py-4 px-4 font-medium font-mono ${isOpening ? 'text-cyan-400 font-bold' : (isPos ? 'text-green-400' : 'text-red-400')}`}>
                                                            {isOpening ? '' : (isPos ? '+' : '-')}{Math.abs(rawAmount).toFixed(2)}
                                                        </td>
                                                        <td className="py-4 px-4 text-center text-slate-300">
                                                            {fmtTime(fund.created_at || fund.createdAt)}
                                                        </td>
                                                        <td className="py-4 pl-4 text-right text-slate-300 font-medium">
                                                            {fund.remarks || fund.notes || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Trades Section */}
                    {isAdmin() && (
                        <div className="bg-[#1a2035] rounded shadow-xl overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-white text-[19px] font-medium mb-1">Active Trades</h3>
                                <p className="text-slate-400 text-[13px] mb-2 font-light italic opacity-70">
                                    {loading ? 'Loading...' : `Showing ${activeTrades.length} items.`}
                                </p>
                                {/* Kite disconnected / error banner */}
                                {!kiteConnected && kiteError && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                                        <p className="text-red-400 text-sm font-medium">{kiteError}</p>
                                    </div>
                                )}
                                <div className="overflow-x-auto custom-scrollbar rounded">
                                    <table className="table-standard custom-table" style={{ minWidth: '1500px' }}>
                                        <thead className="bg-[#202940]/30 border-b border-white/10 text-white text-[13px] font-medium tracking-tight">
                                            <tr>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider w-8">X</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">ID <span className="text-[10px]">↑↓</span></th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider">Type</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider">Scrip</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Status</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Buy Rate</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Sell Rate</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Lots / Units</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Buy Turnover</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Sell Turnover</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider">CMP</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Active P/L</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Margin Used</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Bought at</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Sold at</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Buy Ip</th>
                                                <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Sell Ip</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[13px] text-slate-300">
                                            {activeTrades.length === 0 ? (
                                                <tr><td colSpan="17" className="px-4 py-8 text-slate-500 font-light text-center">{loading ? 'Loading...' : 'No records found'}</td></tr>
                                            ) : activeTrades.map((trade) => {
                                                const allScrips = [
                                                    ...(watchlistRows || []),
                                                    ...(cryptoData || []),
                                                    ...(forexData || []),
                                                    ...(commodityData || []),
                                                    ...Object.values(dashboardSections?.nse || {}),
                                                    ...Object.values(dashboardSections?.mcx || {}),
                                                    ...Object.values(dashboardSections?.nfo || {})
                                                ];
                                                const tradeSymUpper = (trade.symbol || '').toUpperCase().replace(/\s+/g, '');
                                                const tradeSymClean = tradeSymUpper.split(':').pop();

                                                const scrip = allScrips.find(s => {
                                                    const rs = (s.symbol || '').toUpperCase().replace(/\s+/g, '');
                                                    const ts = rs.split(':').pop();
                                                    return rs === tradeSymUpper || ts === tradeSymUpper || rs === tradeSymClean || ts === tradeSymClean;
                                                });

                                                const liveLtp = getScripPrice(scrip);
                                                const bid = getScripBid(scrip) || liveLtp;
                                                const ask = getScripAsk(scrip) || liveLtp;
                                                const exitPrice = trade.type === 'BUY' ? bid : ask;

                                                const exchange = scrip ? exchangeFromRow(scrip) : '';
                                                const isMarketDisconnected = (exchange === 'NSE' || exchange === 'NFO' || exchange === 'MCX') && !kiteConnected;

                                                // Fallback logic to prevent "disappearing" prices or missing CMP
                                                const currentLtp = exitPrice > 0 ? exitPrice : parseFloat(trade.current_price || trade.entry_price || 0);

                                                const isCryptoForex = (trade.symbol || '').toUpperCase().startsWith('CRYPTO:') || (trade.symbol || '').toUpperCase().startsWith('FOREX:');
                                                const decimals = isCryptoForex ? 4 : 2;

                                                // Calculate Live P/L (matching Live M2M and Mobile App logic)
                                                // Compute live P&L dynamically on every WebSocket tick whenever live price is available
                                                let activePnl = 0;
                                                const hasLivePrice = currentLtp > 0;

                                                if (hasLivePrice) {
                                                    const isCarried = trade.is_carried_forward === 1 || trade.status === 'HOLD';
                                                    const refPrice = isCarried && trade.last_settlement_price !== null && trade.last_settlement_price !== undefined
                                                        ? parseFloat(trade.last_settlement_price)
                                                        : parseFloat(trade.entry_price || 0);
                                                    const qty = parseFloat(trade.qty || 0);

                                                    const symUpper = (trade.symbol || '').toUpperCase();
                                                    const mType = (trade.market_type || '').toUpperCase();
                                                    const isUsdSegment = mType === 'COMMODITY' || mType === 'COMEX' || mType === 'FOREX' || mType === 'CRYPTO' ||
                                                        symUpper.startsWith('COMMODITY:') || symUpper.startsWith('COMEX:') || symUpper.startsWith('FOREX:') || symUpper.startsWith('CRYPTO:');

                                                    if (isUsdSegment) {
                                                        const lotMult = parseFloat(trade.lot_size || trade.lot_size_at_entry || 1);
                                                        const usdScrip = (forexData || []).find(f => {
                                                            const sym = (f.symbol || '').toUpperCase();
                                                            return sym === 'FOREX:USD/INR' || sym === 'FOREX:USDINR' || sym.endsWith('USD/INR') || sym.endsWith('USDINR');
                                                        });
                                                        const liveUsdBid = usdScrip ? getScripBid(usdScrip) : null;
                                                        const liveUsdAsk = usdScrip ? getScripAsk(usdScrip) : null;
                                                        const fallbackUsdInr = parseFloat(trade.usdinr_value || (usdScrip ? getScripPrice(usdScrip) : 95.10) || 95.10);

                                                        let calcRes;
                                                        if (mType === 'CRYPTO') {
                                                            calcRes = calculateCryptoPnL({ symbol: trade.symbol, type: trade.type, entryPrice: refPrice, exitPrice: currentLtp, qty, lotSize: lotMult, fallbackUsdInr, liveBid: liveUsdBid, liveAsk: liveUsdAsk });
                                                        } else if (mType === 'FOREX') {
                                                            calcRes = calculateForexPnL({ symbol: trade.symbol, type: trade.type, entryPrice: refPrice, exitPrice: currentLtp, qty, lotSize: lotMult, fallbackUsdInr, liveBid: liveUsdBid, liveAsk: liveUsdAsk });
                                                        } else {
                                                            calcRes = calculateComexPnL({ symbol: trade.symbol, type: trade.type, entryPrice: refPrice, exitPrice: currentLtp, qty, lotSize: lotMult, fallbackUsdInr, liveBid: liveUsdBid, liveAsk: liveUsdAsk });
                                                        }

                                                        activePnl = calcRes.pnlInr;
                                                    } else if (isMcxSymbol(trade.symbol)) {
                                                        const lotMult = getMcxLotSize(trade.symbol) || 1;
                                                        activePnl = trade.type === 'BUY'
                                                            ? (currentLtp - refPrice) * qty * lotMult
                                                            : (refPrice - currentLtp) * qty * lotMult;
                                                    } else {
                                                        activePnl = calculateEquityPnL({
                                                            type: trade.type,
                                                            entryPrice: refPrice,
                                                            exitPrice: currentLtp,
                                                            qty: trade.qty,
                                                            qtyInput: trade.qty_input,
                                                            actualQty: trade.actual_qty,
                                                            lotSize: trade.lot_size || trade.lot_size_at_entry || 1,
                                                            tradeMode: trade.trade_mode,
                                                            equityUnitsMode: trade.equity_units_mode
                                                        });
                                                    }
                                                } else {
                                                    activePnl = parseFloat(trade.live_pnl || trade.pnl || 0);
                                                }

                                                return (
                                                    <tr key={trade.id} className="hover:bg-white/[0.03] transition-colors border-b border-white/5">
                                                        <td className="px-3 py-3 font-bold text-white text-center">
                                                            <span
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setTradeToClose(trade);
                                                                    setCloseSellRate('');
                                                                    setCloseConfirmOpen(true);
                                                                }}
                                                                className="text-white hover:text-white/80 cursor-pointer font-bold px-1"
                                                                title="Close Trade"
                                                            >
                                                                X
                                                            </span>
                                                        </td>
                                                        <td
                                                            className="px-3 py-3 font-bold text-white hover:underline cursor-pointer"
                                                            onClick={() => navigate(`/trades/details/${trade.id}`)}
                                                        >
                                                            {trade.id}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {trade.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 font-bold text-white">
                                                            {scrip ? displaySymbol(scrip) : displaySymbol(trade.symbol)}
                                                        </td>
                                                        <td className="px-3 py-3 whitespace-nowrap">
                                                            {(trade.status === 'HOLD' || trade.is_carried_forward === 1) ? (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                                    HOLD
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                                    OPEN
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 font-mono">{trade.type === 'BUY' ? parseFloat(trade.entry_price || 0).toFixed(decimals) : (trade.exit_price ? parseFloat(trade.exit_price).toFixed(decimals) : '-')}</td>
                                                        <td className="px-3 py-3 font-mono">{trade.type === 'SELL' ? parseFloat(trade.entry_price || 0).toFixed(decimals) : (trade.exit_price ? parseFloat(trade.exit_price).toFixed(decimals) : '-')}</td>
                                                        <td className="px-3 py-3">{parseFloat(trade.qty || 0).toFixed(2)}</td>
                                                        {/* Buy Turnover = Buy Exec Price × Qty × LotSize */}
                                                        <td className="px-3 py-3 font-mono">{trade.type === 'BUY' ? calcTurnover(trade.entry_price, trade.qty, trade) : (trade.exit_price ? calcTurnover(trade.exit_price, trade.qty, trade) : '-')}</td>
                                                        {/* Sell Turnover = Sell Exec Price × Qty × LotSize */}
                                                        <td className="px-3 py-3 font-mono">{trade.type === 'SELL' ? calcTurnover(trade.entry_price, trade.qty, trade) : (trade.exit_price ? calcTurnover(trade.exit_price, trade.qty, trade) : '-')}</td>
                                                        <td className={`px-3 py-3 font-mono ${kiteConnected ? 'text-[#26c6da]' : 'text-slate-500'}`}>
                                                            {isMarketDisconnected && currentLtp <= 0 ? (
                                                                <span className="text-slate-500" title="Kite disconnected">-</span>
                                                            ) : (
                                                                currentLtp > 0 ? currentLtp.toFixed(decimals) : '-'
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 font-mono">
                                                            <span className={`inline-block px-2.5 py-1 rounded font-bold border transition-all duration-300 ${parseFloat(activePnl) >= 0
                                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                }`}>
                                                                {parseFloat(activePnl) >= 0 ? '+' : ''}{parseFloat(activePnl).toFixed(decimals)}
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-3 font-mono text-slate-400">
                                                            {(() => {
                                                                const isHoldingStatus = trade.status === 'HOLDING' || trade.trade_type === 'HOLDING' || trade.product_type === 'DELIVERY';
                                                                const isUnitMode = effectiveClientData.tradeEquityUnits === 1 || effectiveClientData.tradeEquityUnits === 'Yes';
                                                                const calcMargin = calculateSegmentMargin({
                                                                    marketType: trade.market_type || trade.marketType || trade.market || 'MCX',
                                                                    symbol: trade.symbol || trade.name,
                                                                    price: trade.entry_price || trade.price || 0,
                                                                    qty: Math.abs(trade.qty || 1),
                                                                    lotSize: trade.lot_size || trade.lot_size_at_entry || 1,
                                                                    isHolding: isHoldingStatus,
                                                                    clientConfig: effectiveClientData,
                                                                    isUnitMode: isUnitMode
                                                                });
                                                                const finalMargin = calcMargin > 0 ? calcMargin : parseFloat(trade.margin_used !== undefined ? trade.margin_used : (trade.holding_margin || 0));
                                                                return finalMargin.toFixed(2);
                                                            })()}
                                                        </td>
                                                        <td className="px-3 py-3 text-[11px] whitespace-nowrap">{trade.type === 'BUY' ? fmtTime(trade.entry_time) : fmtTime(trade.exit_time)}</td>
                                                        <td className="px-3 py-3 text-[11px] whitespace-nowrap">{trade.type === 'SELL' ? fmtTime(trade.entry_time) : fmtTime(trade.exit_time)}</td>
                                                        <td className="px-3 py-3 text-[11px] font-mono text-slate-500 italic">{trade.type === 'BUY' ? showIp(trade.trade_ip) : showIp(trade.exit_ip)}</td>
                                                        <td className="px-3 py-3 text-[11px] font-mono text-slate-500 italic">{trade.type === 'SELL' ? showIp(trade.trade_ip) : showIp(trade.exit_ip)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Close Trade Modal */}
                    {closeConfirmOpen && tradeToClose && (() => {
                        // Find scrip in live data
                        const allScrips = [...(watchlistRows || []), ...(cryptoData || []), ...(forexData || []), ...(commodityData || [])];
                        const tradeSymUpper = (tradeToClose.symbol || '').toUpperCase();
                        const tradeSymClean = tradeSymUpper.split(':').pop();
                        const scrip = allScrips.find(s => {
                            const rs = (s.symbol || '').toUpperCase();
                            const ts = rs.split(':').pop();
                            return rs === tradeSymUpper || ts === tradeSymUpper || rs === tradeSymClean || ts === tradeSymClean;
                        });
                        let liveRate = 0;
                        const exchange = scrip ? exchangeFromRow(scrip) : '';
                        if (scrip) {
                            // Only block if it's a Kite exchange and Kite is disconnected
                            const isMarketDisconnected = (exchange === 'NSE' || exchange === 'NFO' || exchange === 'MCX') && !kiteConnected;

                            if (!isMarketDisconnected) {
                                if (tradeToClose.type === 'BUY') {
                                    liveRate = getScripBid(scrip);
                                } else {
                                    liveRate = getScripAsk(scrip);
                                }
                                // Final fallback to any price if bid/ask are 0
                                if (!liveRate || liveRate === 0) {
                                    liveRate = getScripPrice(scrip);
                                }
                            }
                        }

                        const displayRate = closeSellRate || (liveRate > 0 ? liveRate : '');
                        const totalValue = (parseFloat(displayRate || 0) * parseFloat(tradeToClose.qty || 0)).toFixed(2);

                        return (
                            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50">
                                <div className="bg-[#202940] rounded-lg p-6 max-w-md w-full border border-red-500/30">
                                    <h3 className="text-white text-lg font-bold mb-4">Close Trade #{tradeToClose.id}</h3>

                                    {/* Kite disconnected warning in modal */}
                                    {!kiteConnected && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
                                            <p className="text-red-400 text-sm font-medium">Kite is not connected. Live BID data is unavailable.</p>
                                        </div>
                                    )}

                                    <div className="space-y-4 mb-6">
                                        {/* Trade Info */}
                                        <div className="bg-white/5 p-3 rounded">
                                            <p className="text-slate-400 text-xs uppercase mb-1">Symbol</p>
                                            <p className="text-white font-bold text-lg">{tradeToClose.symbol}</p>
                                        </div>

                                        <div className="bg-white/5 p-3 rounded">
                                            <p className="text-slate-400 text-xs uppercase mb-1">Quantity (Lots)</p>
                                            <p className="text-white font-bold text-lg">{parseFloat(tradeToClose.qty || 0).toFixed(2)}</p>
                                        </div>

                                        {/* Sell/Buy Rate Input */}
                                        <div>
                                            <label className="text-slate-400 text-xs uppercase mb-2 block">
                                                {tradeToClose.type === 'BUY' ? 'Sell Rate (Live BID)' : 'Buy Rate (Live ASK)'}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.0001"
                                                    value={closeSellRate || (liveRate > 0 ? parseFloat(liveRate).toFixed(exchange === 'CRYPTO' || exchange === 'FOREX' ? 4 : 2) : '')}
                                                    onChange={(e) => setCloseSellRate(e.target.value)}
                                                    placeholder="Loading live rate..."
                                                    className="w-full bg-cyan-500/10 border border-cyan-500/30 text-white px-4 py-3 rounded focus:border-cyan-400 focus:outline-none font-bold text-lg focus:bg-cyan-500/20"
                                                />
                                                {!liveRate && (
                                                    <div className="absolute right-3 top-3.5">
                                                        <Loader2 className="w-5 h-5 animate-spin text-cyan-400/50" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Total Value */}
                                        <div className="bg-green-500/10 border border-green-500/20 p-3 rounded">
                                            <p className="text-slate-400 text-xs uppercase mb-1">Total Value</p>
                                            <p className="text-green-400 font-bold text-lg">₹{parseFloat(totalValue).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setCloseConfirmOpen(false);
                                                setTradeToClose(null);
                                                setCloseSellRate('');
                                            }}
                                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!tradeToClose) return;
                                                try {
                                                    const finalSellRate = parseFloat(closeSellRate || liveRate || tradeToClose.current_price || 0);
                                                    console.log('Closing trade with exitPrice:', finalSellRate);
                                                    await api.closeTrade(tradeToClose.id, { exitPrice: finalSellRate });

                                                    const res = await api.getTrades({ user_id: effectiveClient.id, status: 'OPEN', is_pending: 0 });
                                                    const rawActive = Array.isArray(res) ? res : res?.data || [];
                                                    setActiveTrades(rawActive.filter(t => !t.is_pending && t.is_pending !== 1));

                                                    const res2 = await api.getClosedPositions({ user_id: effectiveClient.id, current_week_only: true });
                                                    setClosedTrades(Array.isArray(res2) ? res2 : res2?.data || []);

                                                    setCloseConfirmOpen(false);
                                                    setTradeToClose(null);
                                                    setCloseSellRate('');
                                                    setPopupMessage('Trade closed successfully!');
                                                    setPopupType('success');
                                                    setPopupOpen(true);
                                                } catch (err) {
                                                    const errorMsg = err.response?.data?.message || err.message;
                                                    // Format message to be cleaner
                                                    let cleanMessage = errorMsg;
                                                    if (errorMsg.includes('Minimum profit')) {
                                                        cleanMessage = errorMsg.replace('Minimum profit booking time is', '⏱️ Minimum time:')
                                                            .replace('You can close in', '✓ You can close in');
                                                    }
                                                    setPopupMessage(cleanMessage);
                                                    setPopupType('error');
                                                    setPopupOpen(true);
                                                }
                                            }}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition-colors"
                                        >
                                            Close Trade
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Closed Trades Section */}
                    <div className="bg-[#1a2035] rounded shadow-xl overflow-hidden mt-6">
                        <div className="p-6">
                            <h3 className="text-white text-[19px] font-medium mb-1">Closed Trades</h3>
                            <p className="text-slate-400 text-[13px] mb-2 font-light italic opacity-70">
                                {loading ? 'Loading...' : `Showing ${closedTrades.length} items.`}
                            </p>
                            <div className="overflow-x-auto custom-scrollbar rounded">
                                <table className="table-standard custom-table" style={{ minWidth: '1500px' }}>
                                    <thead className="bg-[#202940]/30 border-b border-white/10 text-white text-[13px] font-medium tracking-tight">
                                        <tr>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider">ID <span className="text-[10px]">↑↓</span></th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider">Type</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider">Scrip</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Status</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Buy Rate</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Sell Rate</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Lots / Units</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Buy Turnover</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Sell Turnover</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Profit / Loss</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider">Brokerage</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Bought at</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Sold at</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Buy Ip</th>
                                            <th className="px-3 py-4 text-left uppercase tracking-wider whitespace-nowrap">Sell Ip</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[13px] text-slate-300">
                                        {closedTrades.length === 0 ? (
                                            <tr><td colSpan="15" className="px-4 py-8 text-slate-500 font-light text-center">{loading ? 'Loading...' : 'No records found'}</td></tr>
                                        ) : closedTrades.map((trade) => (
                                            <tr key={trade.id} className="hover:bg-white/[0.03] transition-colors border-b border-white/5">
                                                <td
                                                    className="px-3 py-3 font-bold text-white hover:underline cursor-pointer"
                                                    onClick={() => navigate(`/trades/details/${trade.id}`)}
                                                >
                                                    {trade.id}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {trade.type}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 font-bold text-white">
                                                    {(() => {
                                                        const allScrips = [...(watchlistRows || []), ...(cryptoData || []), ...(forexData || []), ...(commodityData || [])];
                                                        const tradeSymUpper = (trade.symbol || '').toUpperCase().replace(/\s+/g, '');
                                                        const tradeSymClean = tradeSymUpper.split(':').pop();
                                                        const scrip = allScrips.find(s => {
                                                            const rs = (s.symbol || '').toUpperCase().replace(/\s+/g, '');
                                                            const ts = rs.split(':').pop();
                                                            return rs === tradeSymUpper || ts === tradeSymUpper || rs === tradeSymClean || ts === tradeSymClean;
                                                        });
                                                        return scrip ? displaySymbol(scrip) : displaySymbol(trade.symbol);
                                                    })()}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {(trade.is_weekly_settlement || trade.status === 'WEEKLY SETTLED' || trade.status === 'SETTLED' || String(trade.id).startsWith('WS-')) ? (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                            WEEKLY SETTLED
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                            {trade.status || 'CLOSED'}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 font-mono">{parseFloat(trade.entry_price || 0).toFixed(2)}</td>
                                                <td className="px-3 py-3 font-mono text-cyan-400 font-bold">{parseFloat(trade.exit_price || 0).toFixed(2)}</td>
                                                <td className="px-3 py-3">{parseFloat(trade.qty || 0).toFixed(2)}</td>
                                                {/* Buy Turnover = entry_price × qty × lot_size (from DB) */}
                                                <td className="px-3 py-3 font-mono">{calcTurnover(trade.entry_price, trade.qty, trade)}</td>
                                                {/* Sell Turnover = exit_price × qty × lot_size (from DB) */}
                                                <td className="px-3 py-3 font-mono">{calcTurnover(trade.exit_price, trade.qty, trade)}</td>
                                                <td style={{
                                                    padding: '12px',
                                                    fontFamily: 'monospace',
                                                    fontWeight: 'bold',
                                                    fontSize: '18px'
                                                }}>
                                                    <span style={{
                                                        color: parseFloat(trade.pnl || 0) > 0 ? '#22c55e' : parseFloat(trade.pnl || 0) < 0 ? '#ef4444' : '#cbd5e1',
                                                        fontWeight: 'bold',
                                                        display: 'inline-block'
                                                    }}>
                                                        {parseFloat(trade.pnl || 0).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 font-mono text-slate-400">{parseFloat(trade.brokerage || 0).toFixed(2)}</td>
                                                <td className="px-3 py-3 text-[11px] whitespace-nowrap">{trade.type === 'BUY' ? fmtTime(trade.entry_time) : fmtTime(trade.exit_time)}</td>
                                                <td className="px-3 py-3 text-[11px] whitespace-nowrap">{trade.type === 'SELL' ? fmtTime(trade.entry_time) : fmtTime(trade.exit_time)}</td>
                                                <td className="px-3 py-3 text-[11px] font-mono text-slate-500 italic">{trade.type === 'BUY' ? showIp(trade.trade_ip) : showIp(trade.exit_ip)}</td>
                                                <td className="px-3 py-3 text-[11px] font-mono text-slate-500 italic">{trade.type === 'SELL' ? showIp(trade.trade_ip) : showIp(trade.exit_ip)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Pending Orders Section */}
                    {isAdmin() && (
                        <div className="bg-[#1a2035] rounded shadow-xl overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-white text-[19px] font-medium mb-6">Pending Orders</h3>
                                <div className="flex border-b border-white/10 mb-6">
                                    {['MCX', 'EQUITY', 'COMEX', 'FOREX', 'CRYPTO'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setPendingTab(t)}
                                            className={`px-6 py-2 text-[12px] font-bold transition-all uppercase tracking-widest ${pendingTab === t ? 'text-[#4caf50] border-b-2 border-[#4caf50]' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                {(() => {
                                    const mcxSymbols = ['GOLD', 'GOLDM', 'SILVER', 'SILVERM', 'CRUDEOIL', 'COPPER', 'NICKEL', 'ZINC', 'LEAD', 'ALUMINIUM', 'ALUMINI', 'NATURALGAS', 'MENTHAOIL', 'COTTON', 'BULLDEX', 'ZINCMINI', 'LEADMINI'];
                                    const detectMarket = (o) => {
                                        const sym = (o.symbol || '').toUpperCase();
                                        // Priority 1: Direct symbol prefix
                                        if (sym.startsWith('CRYPTO:')) return 'CRYPTO';
                                        if (sym.startsWith('FOREX:')) return 'FOREX';
                                        if (sym.startsWith('MCX:')) return 'MCX';

                                        // Priority 2: Database field
                                        const mType = (o.market_type || '').toUpperCase();
                                        if (mType && ['MCX', 'EQUITY', 'COMEX', 'FOREX', 'CRYPTO'].includes(mType)) return mType;

                                        // Priority 3: Pattern matching
                                        if (['BTC', 'ETH', 'SOL', 'USDT'].some(c => sym.includes(c))) return 'CRYPTO';
                                        if (sym.includes('/') || ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'].some(f => sym.includes(f))) return 'FOREX';
                                        if (mcxSymbols.some(s => sym.includes(s))) return 'MCX';
                                        if (['GC', 'SI', 'HG', 'CL'].some(c => sym.startsWith(c))) return 'COMEX';
                                        return 'EQUITY';
                                    };
                                    const filtered = pendingOrders.filter(o => detectMarket(o) === pendingTab);

                                    return (
                                        <>
                                            <p className="text-slate-400 text-[12px] mb-4 font-light italic opacity-60">
                                                Showing {filtered.length} items.
                                            </p>
                                            <div className="overflow-x-auto custom-scrollbar">
                                                <table className="table-standard custom-table">
                                                    <thead>
                                                        <tr className="text-slate-400 text-[12px] font-bold border-b border-white/10">
                                                            <th className="px-3 py-4 text-left">ID</th>
                                                            <th className="px-3 py-4 text-left">Type</th>
                                                            <th className="px-3 py-4 text-left">Lots</th>
                                                            <th className="px-3 py-4 text-left">Commodity</th>
                                                            <th className="px-3 py-4 text-left">Condition</th>
                                                            <th className="px-3 py-4 text-left">Rate</th>
                                                            <th className="px-3 py-4 text-left">Buy Time</th>
                                                            <th className="px-3 py-4 text-left">Buy IP</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-[13px] text-slate-300">
                                                        {filtered.length === 0 ? (
                                                            <tr><td colSpan="8" className="px-4 py-12 text-slate-500 font-light text-center">No records found</td></tr>
                                                        ) : filtered.map((order) => (
                                                            <tr key={order.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                                                                <td
                                                                    className="px-3 py-4 font-bold text-white hover:underline cursor-pointer"
                                                                    onClick={() => navigate(`/trades/details/${order.id}`)}
                                                                >
                                                                    {order.id}
                                                                </td>
                                                                <td className="px-3 py-4">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                        {order.type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-4 font-mono">{parseFloat(order.qty || 0).toFixed(2)}</td>
                                                                <td className="px-3 py-4 font-bold text-white">
                                                                    {(() => {
                                                                        const allScrips = [...(watchlistRows || []), ...(cryptoData || []), ...(forexData || []), ...(commodityData || [])];
                                                                        const tradeSymUpper = (order.symbol || '').toUpperCase();
                                                                        const scrip = allScrips.find(s => {
                                                                            const ds = displaySymbol(s).toUpperCase();
                                                                            const rs = (s.symbol || '').toUpperCase();
                                                                            const ts = rs.split(':').pop();
                                                                            return ds === tradeSymUpper || rs === tradeSymUpper || ts === tradeSymUpper;
                                                                        });
                                                                        return scrip ? displaySymbol(scrip) : order.symbol;
                                                                    })()}
                                                                </td>

                                                                <td className="px-3 py-4 font-medium opacity-70">{order.order_type || 'LIMIT'}</td>
                                                                <td className="px-3 py-4 font-mono text-[#26c6da]">{parseFloat(order.entry_price || 0).toFixed(2)}</td>
                                                                <td className="px-3 py-4 text-[11px] whitespace-nowrap opacity-70">{new Date(order.entry_time || order.created_at).toLocaleString()}</td>
                                                                <td className="px-3 py-4 text-[11px] font-mono text-slate-500 italic">{showIp(order.trade_ip)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Completed Orders Section */}
                    {isAdmin() && (
                        <div className="bg-[#1a2035] rounded shadow-xl overflow-hidden mt-6">
                            <div className="p-6">
                                <h3 className="text-white text-[19px] font-medium mb-6">Completed Orders</h3>
                                <div className="flex border-b border-white/10 mb-6">
                                    {['MCX', 'EQUITY', 'COMEX', 'FOREX', 'CRYPTO'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setCompletedTab(t)}
                                            className={`px-6 py-2 text-[12px] font-bold transition-all uppercase tracking-widest ${completedTab === t ? 'text-[#2196f3] border-b-2 border-[#2196f3]' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                {(() => {
                                    const mcxSymbols = ['GOLD', 'GOLDM', 'SILVER', 'SILVERM', 'CRUDEOIL', 'COPPER', 'NICKEL', 'ZINC', 'LEAD', 'ALUMINIUM', 'ALUMINI', 'NATURALGAS', 'MENTHAOIL', 'COTTON', 'BULLDEX', 'ZINCMINI', 'LEADMINI'];
                                    const detectMarket = (o) => {
                                        const sym = (o.symbol || '').toUpperCase();
                                        // Priority 1: Direct symbol prefix
                                        if (sym.startsWith('CRYPTO:')) return 'CRYPTO';
                                        if (sym.startsWith('FOREX:')) return 'FOREX';
                                        if (sym.startsWith('MCX:')) return 'MCX';

                                        // Priority 2: Database field
                                        const mType = (o.market_type || '').toUpperCase();
                                        if (mType && ['MCX', 'EQUITY', 'COMEX', 'FOREX', 'CRYPTO'].includes(mType)) return mType;

                                        // Priority 3: Pattern matching
                                        if (['BTC', 'ETH', 'SOL', 'USDT'].some(c => sym.includes(c))) return 'CRYPTO';
                                        if (sym.includes('/') || ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'].some(f => sym.includes(f))) return 'FOREX';
                                        if (mcxSymbols.some(s => sym.includes(s))) return 'MCX';
                                        if (['GC', 'SI', 'HG', 'CL'].some(c => sym.startsWith(c))) return 'COMEX';
                                        return 'EQUITY';
                                    };
                                    const filtered = completedOrders.filter(o => detectMarket(o) === completedTab);

                                    return (
                                        <>
                                            <p className="text-slate-400 text-[12px] mb-4 font-light italic opacity-60">
                                                Showing {filtered.length} items.
                                            </p>
                                            <div className="overflow-x-auto custom-scrollbar">
                                                <table className="table-standard custom-table">
                                                    <thead>
                                                        <tr className="text-slate-400 text-[12px] font-bold border-b border-white/10 uppercase tracking-wider">
                                                            <th className="px-3 py-4 text-left">ID</th>
                                                            <th className="px-3 py-4 text-left">Scrip</th>
                                                            <th className="px-3 py-4 text-left">Type</th>
                                                            <th className="px-3 py-4 text-left whitespace-nowrap">Buy Rate</th>
                                                            <th className="px-3 py-4 text-left whitespace-nowrap">Sell Rate</th>
                                                            <th className="px-3 py-4 text-left whitespace-nowrap">Qty / Lots</th>
                                                            <th className="px-3 py-4 text-left whitespace-nowrap">Profit / Loss</th>
                                                            <th className="px-3 py-4 text-left">Brokerage</th>
                                                            <th className="px-3 py-4 text-left">Buy Time</th>
                                                            <th className="px-3 py-4 text-left">Sell Time</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-[13px] text-slate-300">
                                                        {filtered.length === 0 ? (
                                                            <tr><td colSpan="10" className="px-4 py-12 text-slate-500 font-light text-center">No records found</td></tr>
                                                        ) : filtered.map((trade) => (
                                                            <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                                                                <td
                                                                    className="px-3 py-4 font-bold text-white hover:underline cursor-pointer"
                                                                    onClick={() => navigate(`/trades/details/${trade.id}`)}
                                                                >
                                                                    {trade.id}
                                                                </td>
                                                                <td className="px-3 py-4 font-bold text-white">
                                                                    {(() => {
                                                                        const allScrips = [...(watchlistRows || []), ...(cryptoData || []), ...(forexData || []), ...(commodityData || [])];
                                                                        const tradeSymUpper = (trade.symbol || '').toUpperCase();
                                                                        const scrip = allScrips.find(s => {
                                                                            const ds = displaySymbol(s).toUpperCase();
                                                                            const rs = (s.symbol || '').toUpperCase();
                                                                            const ts = rs.split(':').pop();
                                                                            return ds === tradeSymUpper || rs === tradeSymUpper || ts === tradeSymUpper;
                                                                        });
                                                                        return scrip ? displaySymbol(scrip) : displaySymbol(trade.symbol);
                                                                    })()}
                                                                </td>

                                                                <td className="px-3 py-4 text-center">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                        {trade.type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-4 font-mono">{trade.type === 'BUY' ? trade.entry_price : (trade.exit_price || '-')}</td>
                                                                <td className="px-3 py-4 font-mono">{trade.type === 'SELL' ? trade.entry_price : (trade.exit_price || '-')}</td>
                                                                <td className="px-3 py-4 font-mono">{trade.qty}</td>
                                                                <td className={`px-3 py-4 font-mono font-bold ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                    {trade.pnl || '0'}
                                                                </td>
                                                                <td className="px-3 py-4 font-mono text-slate-400">{trade.brokerage || '-'}</td>
                                                                <td className="px-3 py-4 text-[11px] whitespace-nowrap opacity-70">{new Date(trade.entry_time).toLocaleString()}</td>
                                                                <td className="px-3 py-4 text-[11px] whitespace-nowrap opacity-70">{new Date(trade.exit_time).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DOCUMENT VIEW MODAL */}
            {viewDoc && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setViewDoc(null)}></div>
                    <div className="relative w-full max-w-5xl h-[85vh] flex flex-col items-center justify-center animate-in zoom-in duration-300">
                        <button onClick={() => setViewDoc(null)} className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors flex items-center gap-2 text-[12px] font-bold uppercase">
                            Close <X className="w-6 h-6" />
                        </button>
                        <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                            {viewDoc.isPdf ? (
                                <iframe src={viewDoc.url} className="w-full h-full" title={viewDoc.label}></iframe>
                            ) : (
                                <img src={viewDoc.url} alt={viewDoc.label} className="w-full h-full object-contain bg-black/40" crossOrigin="anonymous" />
                            )}
                        </div>
                        <div className="mt-4 px-6 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 text-white text-[12px] font-bold uppercase tracking-widest">
                            {viewDoc.label}
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Account Confirmation Modal */}
            {resetConfirmOpen && (
                <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a2035] border border-white/10 rounded-lg p-6 max-w-md mx-4">
                        <h3 className="text-lg font-bold text-white mb-4">Reset Account?</h3>
                        <p className="text-slate-300 text-sm mb-6">
                            Are you sure you want to reset {effectiveClientData.username}'s account?
                        </p>

                        {resetError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                                {resetError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setResetConfirmOpen(false);
                                    setResetError('');
                                }}
                                disabled={resetLoading}
                                className="flex-1 bg-[#808080] hover:bg-[#707070] text-white px-4 py-2.5 rounded font-bold text-xs uppercase transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResetAccount}
                                disabled={resetLoading}
                                className="flex-1 bg-[#ff6b6b] hover:bg-[#ff5252] text-white px-4 py-2.5 rounded font-bold text-xs uppercase transition-all disabled:opacity-50"
                            >
                                {resetLoading ? 'RESETTING...' : 'RESET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup Modal */}
            {popupOpen && (
                <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className={`bg-[#1a2035] border rounded-lg p-6 max-w-md mx-4 shadow-2xl ${popupType === 'error' ? 'border-red-500/30' : 'border-green-500/30'}`}>
                        <div className="flex items-start gap-4">
                            <div className={`text-2xl ${popupType === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                                {popupType === 'error' ? '❌' : '✅'}
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold mb-2 ${popupType === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                                    {popupType === 'error' ? 'Error' : 'Success'}
                                </h3>
                                <p className="text-slate-300 text-sm">{popupMessage}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setPopupOpen(false)}
                            className={`w-full mt-4 py-2.5 rounded font-bold text-sm uppercase transition-all ${popupType === 'error' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'}`}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetailPage;
