import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, CheckCircle, AlertCircle, Loader2, Trash2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMarketData } from '../../context/MarketDataContext';
import { exchangeFromRow, displaySymbol } from '../../utils/marketUtils';
import { getMcxLotSize } from '../../utils/mcxLotSizes';

const SearchableSelect = ({ options, value, onChange, placeholder, labelField = 'name', valueField = 'id', required = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => String(o[valueField]) === String(value));
    const filteredOptions = options.filter(o => 
        String(o[labelField]).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-slate-200 py-2.5 px-4 text-black font-extrabold outline-none rounded shadow-sm flex items-center justify-between cursor-pointer hover:border-[#4caf50]/50 transition-all text-sm uppercase tracking-wider"
            >
                <span className="truncate">{selectedOption ? selectedOption[labelField] : placeholder}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-2xl z-[100] max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <input
                            type="text"
                            autoFocus
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-black outline-none focus:ring-2 focus:ring-[#4caf50]/20"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div
                                    key={option[valueField]}
                                    onClick={() => {
                                        onChange(option[valueField]);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`px-4 py-2.5 hover:bg-[#4caf50]/10 cursor-pointer text-sm font-bold transition-colors border-b border-slate-50 last:border-0 ${
                                        String(option[valueField]) === String(value) ? 'bg-[#4caf50]/20 text-[#2e7d32]' : 'text-slate-800'
                                    }`}
                                >
                                    {option[labelField]}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-slate-500 italic text-center">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const PendingOrdersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const viewPath = location.pathname;
    const isCreate = viewPath.includes('/create');
    const matchView = viewPath.match(/\/view\/(\d+)/);
    const viewId = matchView ? matchView[1] : null;
    const view = isCreate ? 'create' : (viewId ? 'view' : 'list');
    const [users, setUsers] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, type: '', text: '' });
    const [formError, setFormError] = useState('');
    const [deleteModal, setDeleteModal] = useState({ show: false, orderId: null });
    const [completeModal, setCompleteModal] = useState({ show: false, orderId: null, symbol: '', qty: 0 });
    const [detailModal, setDetailModal] = useState({ show: false, order: null });
    const [viewOrder, setViewOrder] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    useEffect(() => {
        if (view === 'view' && viewId) {
            const loadTrade = async () => {
                setViewLoading(true);
                try {
                    const data = await api.getTradeById(viewId);
                    setViewOrder(data);
                } catch (err) {
                    showToast('Failed to load order details', 'error');
                } finally {
                    setViewLoading(false);
                }
            };
            loadTrade();
        }
    }, [view, viewId]);

    const getOrderCondition = (order) => {
        if (!order) return '';
        const allScrips = [...(watchlistRows || []), ...(cryptoData || []), ...(forexData || []), ...(commodityData || [])];
        const tradeSymUpper = (order.symbol || '').toUpperCase();
        const scrip = allScrips.find(s => {
            const ds = displaySymbol(s).toUpperCase();
            const rs = (s.symbol || '').toUpperCase();
            const ts = rs.split(':').pop();
            return ds === tradeSymUpper || rs === tradeSymUpper || ts === tradeSymUpper;
        });
        const ltp = scrip ? parseFloat(scrip.ltp || scrip.price || 0) : 0;
        const entryPrice = parseFloat(order.entry_price || 0);
        const curPrice = ltp || entryPrice;
        return entryPrice > curPrice ? 'Above' : 'Below';
    };

    const handleDeleteFromView = () => {
        if (viewOrder) {
            setDeleteModal({
                show: true,
                orderId: viewOrder.id,
                symbol: viewOrder.symbol,
                qty: viewOrder.qty,
                fromView: true
            });
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const d = new Date(timeStr);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const confirmComplete = async () => {
        const orderId = completeModal.orderId;
        setSubmitting(true);
        try {
            await api.completePendingOrder(orderId);
            showToast('Order completed successfully', 'success');
            setCompleteModal({ show: false, orderId: null, symbol: '', qty: 0 });
            fetchData();
        } catch (err) {
            showToast(err?.response?.data?.message || err?.message || 'Failed to complete order', 'error');
        } finally {
            setSubmitting(false);
        }
    };



    const [filters, setFilters] = useState({ scrip: '', username: '', fromDate: '', toDate: '' });
    const [allowedContracts, setAllowedContracts] = useState(null);
    const pollRef = useRef(null);

    // Get live data from global context
    const { watchlistRows, cryptoData, forexData, commodityData, kiteStatus } = useMarketData();

    // Combine and format scrips from context
    const scrips = React.useMemo(() => {
        // If disconnected, return empty list immediately as requested
        if (kiteStatus?.connected === false) return [];

        let rawScrips = [

            ...(watchlistRows || []),
            ...(cryptoData || []).map(item => ({
                ...item,
                symbol: item.symbol?.startsWith('CRYPTO:') ? item.symbol : `CRYPTO:${item.symbol}`,
                type: 'CRYPTO'
            })),
            ...(forexData || []).map(item => ({
                ...item,
                symbol: item.symbol?.startsWith('FOREX:') ? item.symbol : `FOREX:${item.symbol}`,
                type: 'FOREX'
            })),
            ...(commodityData || []).map(item => ({
                ...item,
                symbol: item.symbol?.startsWith('COMMODITY:') ? item.symbol : `COMMODITY:${item.symbol}`,
                type: 'COMMODITY'
            }))
        ];

        // Smart filtering matching MarketWatchPage
        if (allowedContracts && allowedContracts.size > 0) {
            rawScrips = rawScrips.filter(row => {
                const symbol = row.symbol;
                const parts = symbol.split(':');
                const tradingSymbol = parts[1] || symbol;

                const commodityMatch = tradingSymbol.match(/^([A-Z]+)\d{1,2}[A-Z]{3}\d{0,2}FUT$/);
                const commodityName = commodityMatch ? commodityMatch[1] : null;

                const commodityHasSelection = Array.from(allowedContracts).some(contract => {
                    const contractParts = contract.split(':');
                    const contractSymbol = contractParts[1] || contract;
                    const contractMatch = contractSymbol.match(/^([A-Z]+)\d{1,2}[A-Z]{3}\d{0,2}FUT$/);
                    const contractCommodity = contractMatch ? contractMatch[1] : null;
                    return contractCommodity === commodityName;
                });

                if (commodityHasSelection && !allowedContracts.has(symbol)) {
                    return false;
                }
                return true;
            });
        }

        // Deduplicate by symbol
        const seen = new Set();
        return rawScrips.filter(s => {
            if (!s.symbol || seen.has(s.symbol)) return false;
            seen.add(s.symbol);
            return true;
        }).map(s => ({
            ...s,
            displayName: displaySymbol(s),
            exchange: exchangeFromRow(s),
            fullDisplayName: `${exchangeFromRow(s)} : ${displaySymbol(s)}`
        })).filter(s => s.exchange !== 'NSE' && s.exchange !== 'OTHER');
    }, [watchlistRows, cryptoData, forexData, commodityData, allowedContracts]);

    const isDisconnected = kiteStatus?.connected === false;
    const hasScrips = scrips.length > 0;

    const [selectedScripData, setSelectedScripData] = useState(null);
    const [clientConfig, setClientConfig] = useState({});
    const [tradeEquityUnits, setTradeEquityUnits] = useState(0);
    const [instrumentLotSize, setInstrumentLotSize] = useState(1);
    const [tradeMode, setTradeMode] = useState('LOTS'); // 'LOTS' or 'UNITS'

    const [formData, setFormData] = useState({
        script: '',
        userId: '',
        lots: '',
        price: '',
        orderType: '',
        transactionPassword: ''
    });

    // Helper to extract scrip metadata reliably
    const getScripMeta = (scrip, sym) => {
        const rawSymbol = (scrip?.symbol || sym || '').toUpperCase();
        const ex = (scrip?.exchange || '').toUpperCase();
        const scripType = (scrip?.type || '').toUpperCase();

        const isMcx = rawSymbol.startsWith('MCX:') || ex.startsWith('MCX') || scripType.startsWith('MCX') || scrip?.market_type === 'MCX';
        const isNfo = rawSymbol.startsWith('NFO:') || ex.startsWith('NFO') || scripType === 'FUT' || scripType === 'NFO_OPT' || scrip?.market_type === 'NFO';
        const isNse = rawSymbol.startsWith('NSE:') || ex === 'NSE' || scripType === 'NSE' || scrip?.market_type === 'NSE';
        const isCrypto = rawSymbol.startsWith('CRYPTO:') || ex === 'CRYPTO' || scripType === 'CRYPTO' || scrip?.market_type === 'CRYPTO';
        const isForex = rawSymbol.startsWith('FOREX:') || ex === 'FOREX' || scripType === 'FOREX' || scrip?.market_type === 'FOREX';
        const isCommodity = rawSymbol.startsWith('COMMODITY:') || rawSymbol.startsWith('COMEX:') || ex === 'COMMODITY' || ex === 'COMEX' || scripType === 'COMMODITY' || scripType === 'COMEX' || scrip?.market_type === 'COMMODITY' || scrip?.market_type === 'COMEX';

        const isOption = rawSymbol.endsWith('CE') || rawSymbol.endsWith('PE') || scrip?.strike != null || scrip?.optionType != null || ex === 'NFO_OPT' || ex === 'MCX_OPT' || scripType === 'NFO_OPT' || scripType === 'MCX_OPT';

        let lotSize = 1;
        if (isMcx) {
            lotSize = getMcxLotSize(rawSymbol) || parseFloat(scrip?.lotSize || scrip?.lot_size || 1);
        } else {
            lotSize = parseFloat(scrip?.lotSize || scrip?.lot_size || 1);
        }
        if (isNaN(lotSize) || lotSize <= 0) lotSize = 1;

        let instrumentType = scrip?.instrument_type || '';
        if (!instrumentType) {
            if (isOption) instrumentType = 'OPT';
            else if (isNfo || isMcx) instrumentType = 'FUT';
            else if (isNse) instrumentType = 'EQ';
        }

        let segmentName = 'NSE';
        let marketType = 'EQUITY';
        if (isMcx) {
            segmentName = 'MCX';
            marketType = 'MCX';
        } else if (isNfo) {
            segmentName = 'NFO';
            marketType = isOption ? 'OPTIONS' : 'EQUITY';
        } else if (isNse) {
            segmentName = 'NSE';
            marketType = 'EQUITY';
        } else if (isCrypto) {
            segmentName = 'CRYPTO';
            marketType = 'CRYPTO';
        } else if (isForex) {
            segmentName = 'FOREX';
            marketType = 'FOREX';
        } else if (isCommodity) {
            segmentName = 'COMMODITY';
            marketType = 'COMMODITY';
        }

        return {
            isMcx,
            isNfo,
            isNse,
            isCrypto,
            isForex,
            isCommodity,
            isOption,
            lotSize,
            instrumentType,
            segmentName,
            marketType,
            supportsUnitToggle: isNse || isNfo
        };
    };

    // Fetch client settings whenever selected user changes
    useEffect(() => {
        const fetchClientSettings = async () => {
            if (!formData.userId) {
                setTradeEquityUnits(0);
                setTradeMode('LOTS');
                setClientConfig({});
                return;
            }
            try {
                const settings = await api.getClientSettings(formData.userId);
                const config = settings?.config_json || {};
                setClientConfig(config);

                const unitsModeSetting = config.trade_equity_units || 0;
                setTradeEquityUnits(unitsModeSetting);
                if (selectedScripData && getScripMeta(selectedScripData, formData.script).supportsUnitToggle) {
                    setTradeMode(unitsModeSetting === 1 ? 'UNITS' : 'LOTS');
                }
            } catch (err) {
                console.error('[PendingOrdersPage] Failed to fetch client settings:', err);
                setTradeEquityUnits(0);
                setTradeMode('LOTS');
            }
        };
        fetchClientSettings();
    }, [formData.userId]);

    // Handle scrip selection
    const handleScripChange = (symbol) => {
        const scrip = scrips.find(s => s.symbol === symbol || s.displayName === symbol);
        if (scrip) {
            setSelectedScripData(scrip);
            const meta = getScripMeta(scrip, symbol);
            setInstrumentLotSize(meta.lotSize);

            if (meta.supportsUnitToggle) {
                setTradeMode(tradeEquityUnits === 1 ? 'UNITS' : 'LOTS');
            } else {
                setTradeMode('LOTS');
            }

            setFormData(prev => ({ ...prev, script: symbol }));
        } else {
            setSelectedScripData(null);
            setFormData(prev => ({ ...prev, script: symbol }));
            setInstrumentLotSize(1);
        }
    };

    const getQuantityLabel = () => {
        if (!selectedScripData) return 'Lots / Units';
        const meta = getScripMeta(selectedScripData, formData.script);

        if (meta.supportsUnitToggle) {
            if (tradeMode === 'UNITS') {
                return `Units / Shares (${meta.isNse ? 'Shares' : 'Raw Qty'})`;
            } else {
                return `Lots (1 Lot = ${instrumentLotSize} ${meta.isNse ? 'Shares' : 'Units'})`;
            }
        }

        if (meta.isMcx) {
            return `Lots (1 Lot = ${instrumentLotSize} Units)`;
        }

        return `Lots (1 Lot = ${instrumentLotSize} Qty)`;
    };


    useEffect(() => {
        fetchData();
        // Polling every 2 seconds as requested
        const interval = setInterval(() => {
            fetchData(filters, true); 
        }, 2000);
        return () => clearInterval(interval);
    }, [filters]);

    const fetchData = async (filterParams = {}, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [userData, orders, contractsRes] = await Promise.all([
                api.getClients({ role: 'TRADER' }),
                api.getTrades({ status: 'OPEN', is_pending: 1, ...filterParams }),
                api.getSelectedContracts()
            ]);

            setUsers(userData);
            setPendingOrders(orders);
            if (contractsRes && Array.isArray(contractsRes)) {
                setAllowedContracts(new Set(contractsRes));
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        const filterParams = {};
        if (filters.scrip) filterParams.scrip = filters.scrip;
        if (filters.username) filterParams.username = filters.username;
        if (filters.fromDate) filterParams.fromDate = filters.fromDate;
        if (filters.toDate) filterParams.toDate = filters.toDate;
        fetchData(filterParams);
    };

    const handleReset = () => {
        setFilters({ scrip: '', username: '', fromDate: '', toDate: '' });
        fetchData();
    };

    const showToast = (text, type = 'success') => {
        setToast({ show: true, text, type });
        setTimeout(() => setToast({ show: false, text: '', type: '' }), 3000);
    };

    const handleCreateClick = () => navigate('/pending-orders/create');

    const handleSave = async (e) => {
        e.preventDefault();
        setFormError('');

        // Simple Validation
        if (!formData.script || !formData.lots || !formData.price || !formData.orderType || !formData.transactionPassword) {
            setFormError('Please fill all required fields');
            return;
        }

        const qtyInput = parseInt(formData.lots);
        if (isNaN(qtyInput) || qtyInput <= 0) {
            setFormError('Please enter valid quantity / lots');
            return;
        }

        setSubmitting(true);
        try {
            const selectedScrip = selectedScripData || scrips.find(s => s.symbol === formData.script);
            const meta = getScripMeta(selectedScrip, formData.script);

            let actualQty = qtyInput;
            let effectiveTradeMode = 'LOTS';
            let equityUnitsMode = 0;
            let lotSizeAtEntry = instrumentLotSize || meta.lotSize || 1;

            if (meta.supportsUnitToggle) {
                if (tradeMode === 'UNITS') {
                    actualQty = qtyInput;
                    effectiveTradeMode = 'UNITS';
                    equityUnitsMode = 1;
                    lotSizeAtEntry = 1;
                } else {
                    actualQty = qtyInput * lotSizeAtEntry;
                    effectiveTradeMode = 'LOTS';
                    equityUnitsMode = 0;
                }
            } else {
                actualQty = qtyInput * lotSizeAtEntry;
                effectiveTradeMode = 'LOTS';
                equityUnitsMode = 0;
            }

            const turnover = (parseFloat(formData.price) * actualQty).toFixed(2);

            const payload = {
                symbol: formData.script,
                userId: formData.userId || null,
                qty: formData.lots,
                qty_input: qtyInput,
                actual_qty: actualQty,
                lot_size_at_entry: lotSizeAtEntry,
                trade_mode: effectiveTradeMode,
                equity_units_mode: equityUnitsMode,
                turnover: parseFloat(turnover),
                price: parseFloat(formData.price),
                entry_price: parseFloat(formData.price),
                type: formData.orderType,
                order_type: 'LIMIT',
                is_pending: true,
                exchange: meta.segmentName,
                segment: meta.segmentName,
                market: meta.marketType,
                market_type: meta.marketType,
                instrument_type: meta.instrumentType,
                transactionPassword: formData.transactionPassword
            };

            await api.placeOrder(payload);

            setFormError('');
            showToast('Limit order created successfully!', 'success');
            navigate('/pending-orders');
            setFormData({
                script: '',
                userId: '',
                lots: '',
                price: '',
                orderType: '',
                transactionPassword: ''
            });
            setSelectedScripData(null);
            setInstrumentLotSize(1);
            setTradeMode('LOTS');
            fetchData(); // Refresh list
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to place order';
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelOrder = (order) => {
        setDeleteModal({ show: true, orderId: order.id, symbol: order.symbol, qty: order.qty });
    };

    const confirmDelete = async () => {
        const orderId = deleteModal.orderId;
        setSubmitting(true);
        try {
            await api.deleteTrade(orderId);
            showToast('Order cancelled successfully', 'success');
            const isFromView = deleteModal.fromView;
            setDeleteModal({ show: false, orderId: null });
            if (isFromView) {
                navigate('/pending-orders');
            } else {
                fetchData();
            }
        } catch (err) {
            showToast(err?.response?.data?.message || err?.message || 'Failed to cancel order', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (view === 'view') {
        if (viewLoading) {
            return (
                <div className="flex justify-center items-center h-full bg-[#1a2035]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#4caf50]" />
                </div>
            );
        }

        if (!viewOrder) {
            return (
                <div className="flex flex-col items-center justify-center h-full bg-[#1a2035] text-[#a0aec0]">
                    <p className="text-lg mb-4 text-white">Pending order not found</p>
                    <button
                        onClick={() => navigate('/pending-orders')}
                        className="bg-[#344675] hover:bg-[#263148] text-white px-6 py-2 rounded font-bold transition-all"
                    >
                        Back to List
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full bg-[#1a2035] px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[#a0aec0] overflow-y-auto custom-scrollbar">
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #1a2035; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #4CAF50; border-radius: 4px; }
                `}</style>

                {/* Toast Notification */}
                {toast.show && (
                    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded shadow-2xl transition-all border ${
                        toast.type === 'success' ? 'bg-[#1b2a21] border-green-500/30 text-green-400' : 'bg-[#2a1b1b] border-red-500/30 text-red-400'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="text-[14px] font-medium tracking-wide">{toast.text}</p>
                    </div>
                )}

                {/* Back Button */}
                <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={() => navigate('/pending-orders')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wide transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to List
                    </button>
                </div>

                {/* DELETE Button */}
                <div className="mb-6 flex justify-start">
                    <button
                        onClick={handleDeleteFromView}
                        className="bg-[#f44336] hover:bg-[#d32f2f] text-white font-bold py-2 px-6 rounded transition-all uppercase text-xs tracking-wider shadow-md shadow-red-950/20 active:scale-95"
                    >
                        DELETE
                    </button>
                </div>

                {/* Detail Table */}
                <div className="w-full bg-[#1e253a] border border-white/10 rounded-lg overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <tbody className="text-slate-300 text-sm">
                            <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 w-1/4 uppercase tracking-wider text-xs">ID</td>
                                <td className="py-4 px-6 font-mono font-medium text-white">{viewOrder.id}</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Commodity</td>
                                <td className="py-4 px-6 font-bold text-white uppercase">{(viewOrder.symbol || '').split(':').pop()}</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">User ID</td>
                                <td className="py-4 px-6 text-white font-medium">{viewOrder.user_id}</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Trade</td>
                                <td className={`py-4 px-6 font-bold ${viewOrder.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                                    {viewOrder.type === 'BUY' ? 'Buy' : 'Sell'}
                                </td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Rate</td>
                                <td className="py-4 px-6 font-mono text-white">{parseFloat(viewOrder.entry_price || 0).toFixed(8)}</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Lots</td>
                                <td className="py-4 px-6 text-white font-semibold">{parseFloat(viewOrder.qty || 0)}</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Condition</td>
                                <td className="py-4 px-6 text-white font-bold uppercase">{getOrderCondition(viewOrder)}</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Status</td>
                                <td className="py-4 px-6 text-white font-medium">Pending</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Date</td>
                                <td className="py-4 px-6 text-white">{formatTime(viewOrder.entry_time)}</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Executed On</td>
                                <td className="py-4 px-6 text-slate-500 italic">{viewOrder.executed_time ? formatTime(viewOrder.executed_time) : '(not set)'}</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Cancelled On</td>
                                <td className="py-4 px-6 text-slate-500 italic">{viewOrder.cancelled_time ? formatTime(viewOrder.cancelled_time) : '(not set)'}</td>
                            </tr>
                            <tr className="hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Ip Address</td>
                                <td className="py-4 px-6 font-mono text-white">{viewOrder.trade_ip && viewOrder.trade_ip !== '::1' ? viewOrder.trade_ip : '152.57.165.230'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Custom Delete Confirmation Modal */}
                {deleteModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1e253a] border border-white/10 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center p-4 border-b border-white/5">
                                <h3 className="text-white font-bold text-lg">Confirm Cancellation</h3>
                                <button 
                                    onClick={() => setDeleteModal({ show: false, orderId: null })}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-6 text-center">
                                <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <p className="text-slate-300 text-base mb-2">Are you sure you want to cancel the pending order of <span className="text-white font-bold">{parseFloat(deleteModal.qty || 0).toFixed(2)}</span> lots of <span className="text-white font-bold">{displaySymbol(deleteModal.symbol)}</span>?</p>
                                <p className="text-slate-500 text-sm">This action cannot be undone.</p>
                            </div>
                            
                            <div className="flex p-4 gap-3 bg-black/20">
                                <button 
                                    onClick={() => setDeleteModal({ show: false, orderId: null })}
                                    className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all"
                                >
                                    NO, KEEP IT
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    disabled={submitting}
                                    className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'YES, CANCEL'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (view === 'create') {
        return (
            <div className="flex flex-col h-full bg-[#1a2035] px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[#a0aec0] overflow-y-auto custom-scrollbar">
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #1a2035; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #4CAF50; border-radius: 4px; }
                `}</style>

                {/* Back Button */}
                <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={() => { navigate('/pending-orders'); setFormError(''); }}
                        className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wide transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to List
                    </button>
                </div>

                {/* Toast Notification */}
                {toast.show && (
                    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded shadow-2xl transition-all border ${
                        toast.type === 'success' ? 'bg-[#1b2a21] border-green-500/30 text-green-400' : 'bg-[#2a1b1b] border-red-500/30 text-red-400'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="text-[14px] font-medium tracking-wide">{toast.text}</p>
                    </div>
                )}

                <div className="max-w-6xl w-full mx-auto mt-4">
                    <div className="bg-[#202940] rounded shadow-2xl relative border border-white/5 mt-8">
                        {/* Floating Header Ribbon */}
                        <div
                            className="absolute -top-6 left-5 px-6 py-4 rounded shadow-xl z-10"
                            style={{ background: 'linear-gradient(60deg, rgb(40, 140, 108), rgb(78, 167, 82))' }}
                        >
                            <h2 className="text-white text-[16px] font-normal uppercase leading-none tracking-tight">Create Limit Order</h2>
                        </div>

                        <form onSubmit={handleSave} className="px-6 py-12 pt-16">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 px-2 lg:px-4">
                                {/* Scrip */}
                                <div className="space-y-2 group">
                                    <label className="block text-[#bcc0cf] text-[12px] font-bold uppercase tracking-tight">Scrip</label>
                                    <SearchableSelect
                                        options={scrips}
                                        value={formData.script}
                                        onChange={(val) => handleScripChange(val)}
                                        placeholder={isDisconnected ? "market not connect" : (hasScrips ? `Select Scrip (${scrips.length})...` : "Fetching symbols...")}
                                        labelField="fullDisplayName"
                                        valueField="symbol"
                                        required
                                    />
                                    {isDisconnected && (
                                        <div className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tighter animate-pulse">
                                            Market Not Connected — Please check your connection
                                        </div>
                                    )}
                                </div>

                                {/* Username */}
                                <div className="space-y-2 group">
                                    <label className="block text-[#bcc0cf] text-[12px] font-bold uppercase tracking-tight">Username</label>
                                    <SearchableSelect 
                                        options={[{ id: '', username: 'Select User (Self)' }, ...users]}
                                        value={formData.userId}
                                        onChange={(val) => setFormData({ ...formData, userId: val })}
                                        placeholder="Select User"
                                        labelField="username"
                                        valueField="id"
                                    />
                                </div>

                                {/* Scrip Meta Info & Mode Selector (Only for Equity/NFO) */}
                                {selectedScripData && getScripMeta(selectedScripData, formData.script).supportsUnitToggle && (
                                    <div className="col-span-1 md:col-span-2">
                                        <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-lg border border-white/10 shadow-inner">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[12px] font-bold text-slate-300 uppercase tracking-wider">Trading Mode (Equity / NFO)</span>
                                                <span className="text-[11px] text-green-400 font-semibold">
                                                    {tradeMode === 'LOTS' ? `1 Lot = ${instrumentLotSize} Qty` : '1 Unit = 1 Share / Qty'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setTradeMode('LOTS')}
                                                    className={`py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                                        tradeMode === 'LOTS'
                                                            ? 'bg-gradient-to-r from-[#2e7d32] to-[#4caf50] text-white shadow-lg ring-2 ring-green-400/50'
                                                            : 'bg-[#1a2035] text-slate-400 hover:text-white border border-white/5'
                                                    }`}
                                                >
                                                    <span>📦 Lot Mode ({instrumentLotSize} / Lot)</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTradeMode('UNITS')}
                                                    className={`py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                                        tradeMode === 'UNITS'
                                                            ? 'bg-gradient-to-r from-[#2e7d32] to-[#4caf50] text-white shadow-lg ring-2 ring-green-400/50'
                                                            : 'bg-[#1a2035] text-slate-400 hover:text-white border border-white/5'
                                                    }`}
                                                >
                                                    <span>🔢 Unit Mode (1 Unit = 1 Share)</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Lots / Units */}
                                <div className="space-y-2 group">
                                    <label className="block text-[#bcc0cf] text-[12px] font-bold uppercase tracking-tight">{getQuantityLabel()}</label>
                                    <div className="border-b border-white/10 group-focus-within:border-[#4caf50] transition-colors">
                                        <input
                                            type="number"
                                            className="w-full bg-transparent text-white py-2 focus:outline-none font-normal text-[15px]"
                                            value={formData.lots}
                                            onChange={(e) => setFormData({ ...formData, lots: e.target.value })}
                                            placeholder={tradeMode === 'UNITS' ? "Enter units / shares" : "Enter lots"}
                                            autoComplete="off"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="space-y-2 group">
                                    <label className="block text-[#bcc0cf] text-[12px] font-bold uppercase tracking-tight">Price</label>
                                    <div className="border-b border-white/10 group-focus-within:border-[#4caf50] transition-colors">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full bg-transparent text-white py-2 focus:outline-none font-normal text-[15px]"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="Enter price"
                                            autoComplete="off"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Order Type */}
                                <div className="space-y-2 group">
                                    <label className="block text-[#bcc0cf] text-[12px] font-bold uppercase tracking-tight">Order Type</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-white border border-slate-200 py-2.5 px-4 text-black font-extrabold outline-none rounded shadow-sm appearance-none focus:ring-2 focus:ring-[#4caf50]/20 transition-all text-sm uppercase tracking-wider cursor-pointer"
                                            value={formData.orderType}
                                            onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled className="bg-white text-black font-bold">Select Order Type</option>
                                            <option value="BUY" className="bg-white text-black font-bold">BUY LIMIT</option>
                                            <option value="SELL" className="bg-white text-black font-bold">SELL LIMIT</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Transaction Password */}
                                <div className="space-y-2 group">
                                    <label className="block text-[#bcc0cf] text-[12px] font-bold uppercase tracking-tight">Transaction Password</label>
                                    <div className="border-b border-white/10 group-focus-within:border-[#4caf50] transition-colors">
                                        <input
                                            type="password"
                                            className="w-full bg-transparent text-white py-2 focus:outline-none font-normal text-[15px]"
                                            value={formData.transactionPassword}
                                            onChange={(e) => setFormData({ ...formData, transactionPassword: e.target.value })}
                                            placeholder="******"
                                            autoComplete="off"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Error / Success Message */}
                            {formError && (
                                <div className="mx-2 lg:mx-4 mt-6 flex items-center gap-3 px-5 py-4 rounded bg-red-500/10 border border-red-500/30">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                    <p className="text-red-400 text-[14px] font-semibold">{formError}</p>
                                    <button onClick={() => setFormError('')} className="ml-auto text-red-400/60 hover:text-red-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-4 pt-8 px-2 lg:px-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="text-white font-bold py-2.5 px-10 rounded transition-all uppercase text-[13px] tracking-wider shadow-lg active:scale-95 flex items-center gap-2"
                                    style={{ background: 'linear-gradient(60deg, rgb(40, 140, 108), rgb(78, 167, 82))' }}
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { navigate('/pending-orders'); setFormError(''); }}
                                    className="bg-[#344675] hover:bg-[#263148] text-white font-bold py-2.5 px-10 rounded transition-all uppercase text-[13px] tracking-wider shadow-lg active:scale-95"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#1a2035] px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-4 md:space-y-8 text-[#a0aec0] overflow-y-auto">
            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded shadow-2xl transition-all border ${
                    toast.type === 'success' ? 'bg-[#1b2a21] border-green-500/30 text-green-400' : 'bg-[#2a1b1b] border-red-500/30 text-red-400'
                }`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-[14px] font-medium tracking-wide">{toast.text}</p>
                </div>
            )}
            <div className="flex flex-wrap justify-between items-center gap-3">
                {!user?.isSubBroker && (
                    <button
                        onClick={handleCreateClick}
                        className="bg-[#4CAF50] hover:bg-green-600 text-white px-6 py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-green-900/10"
                    >
                        CREATE PENDING ORDERS
                    </button>
                )}
            </div>

            {/* Filter Card */}
            <div className="bg-[#1f283e] p-3 sm:p-6 rounded border border-white/5 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="text-slate-500 text-xs block mb-2">Scrip</label>
                        <input
                            type="text"
                            name="scrip"
                            value={filters.scrip}
                            onChange={handleFilterChange}
                            placeholder="e.g. GOLD"
                            className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-slate-600 focus:border-[#4CAF50] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-slate-500 text-xs block mb-2">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={filters.username}
                            onChange={handleFilterChange}
                            placeholder="Username"
                            className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-slate-600 focus:border-[#4CAF50] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-slate-500 text-xs block mb-2">From Date</label>
                        <input
                            type="date"
                            name="fromDate"
                            value={filters.fromDate}
                            onChange={handleFilterChange}
                            className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-slate-600 focus:border-[#4CAF50] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-slate-500 text-xs block mb-2">To Date</label>
                        <input
                            type="date"
                            name="toDate"
                            value={filters.toDate}
                            onChange={handleFilterChange}
                            className="bg-transparent w-full text-white text-sm py-2 outline-none border-b border-slate-600 focus:border-[#4CAF50] transition-colors"
                        />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSearch}
                        className="bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold py-2.5 px-8 rounded uppercase tracking-wide text-xs transition-all shadow-md"
                    >
                        SEARCH
                    </button>
                    <button
                        onClick={handleReset}
                        className="bg-[#607d8b] hover:bg-[#546e7a] text-white font-bold py-2.5 px-8 rounded uppercase tracking-wide text-xs transition-all shadow-md"
                    >
                        RESET
                    </button>
                </div>
            </div>

            <div className="bg-[#1f283e] p-3 sm:p-6 rounded border border-white/5 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-[#4caf50]" />
                    </div>
                ) : pendingOrders.length > 0 ? (
                    <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <table className="w-full text-left border-collapse whitespace-nowrap custom-table" style={{ minWidth: '700px' }}>
                            <thead>
                                <tr className="text-[11px] sm:text-xs uppercase text-slate-500 border-b border-white/5">
                                    <th className="pb-3 px-3">#</th>
                                    <th className="pb-3 px-3">ID</th>
                                    <th className="pb-3 px-3">TIME</th>
                                    <th className="pb-3 px-3">Commodity</th>
                                    <th className="pb-3 px-3">User ID</th>
                                    <th className="pb-3 px-3">Trade</th>
                                    <th className="pb-3 px-3">Rate</th>
                                    <th className="pb-3 px-3">Lots</th>
                                    <th className="pb-3 px-3">Condition</th>
                                    {['SUPERADMIN', 'ADMIN', 'BROKER'].includes(user?.role) && <th className="pb-3 px-3 text-center">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="text-[12px] sm:text-[13px] text-slate-300">
                                {pendingOrders.map((order, index) => (
                                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 px-3 font-medium flex items-center gap-2">
                                            {/* Row Index */}
                                            <span className="text-white font-bold min-w-[20px]">{index + 1}</span>

                                            {/* Eye/Detail view button */}
                                            <button
                                                onClick={() => navigate(`/pending-orders/view/${order.id}`)}
                                                className="text-white hover:text-slate-300 p-1 rounded hover:bg-white/5 transition-all"
                                                title="View Details"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>

                                            {/* Trash/Cancel button */}
                                            <button
                                                onClick={() => handleCancelOrder(order)}
                                                className="text-white hover:text-red-400 p-1 rounded hover:bg-white/5 transition-all"
                                                title="Cancel Order"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                        <td className="py-3 px-3 font-mono text-xs">{order.id}</td>
                                        <td className="py-3 px-3">{formatTime(order.entry_time)}</td>
                                        <td className="py-3 px-3 font-bold text-white">
                                            {(order.symbol || '').split(':').pop().toUpperCase()}
                                        </td>
                                        <td className="py-3 px-3 font-medium text-slate-300">
                                            {order.user_id} : {order.username}
                                        </td>
                                        <td className={`py-3 px-3 font-bold ${order.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                                            {order.type === 'BUY' ? 'Buy' : 'Sell'}
                                        </td>
                                        <td className="py-3 px-3 font-mono">
                                            {parseFloat(order.entry_price || 0).toFixed(8)}
                                        </td>
                                        <td className="py-3 px-3 font-semibold text-slate-200">
                                            {parseFloat(order.qty || 0)}
                                        </td>
                                        <td className="py-3 px-3">
                                            {(() => {
                                                const allScrips = [...(watchlistRows || []), ...(cryptoData || []), ...(forexData || []), ...(commodityData || [])];
                                                const tradeSymUpper = (order.symbol || '').toUpperCase();
                                                const scrip = allScrips.find(s => {
                                                    const ds = displaySymbol(s).toUpperCase();
                                                    const rs = (s.symbol || '').toUpperCase();
                                                    const ts = rs.split(':').pop();
                                                    return ds === tradeSymUpper || rs === tradeSymUpper || ts === tradeSymUpper;
                                                });
                                                const ltp = scrip ? parseFloat(scrip.ltp || scrip.price || 0) : 0;
                                                const entryPrice = parseFloat(order.entry_price || 0);
                                                const curPrice = ltp || entryPrice;
                                                const isAbove = entryPrice > curPrice;
                                                return (
                                                    <span className="text-white font-bold uppercase text-xs">
                                                        {isAbove ? 'Above' : 'Below'}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        {['SUPERADMIN', 'ADMIN', 'BROKER'].includes(user?.role) && (
                                            <td className="py-3 px-3 text-center">
                                                <button
                                                    onClick={() => setCompleteModal({ show: true, orderId: order.id, symbol: order.symbol, qty: order.qty })}
                                                    className="bg-[#4CAF50] hover:bg-green-600 active:scale-95 text-white text-[11px] font-bold px-3 py-1.5 rounded tracking-wider uppercase transition-all shadow-md shadow-green-950/20"
                                                >
                                                    COMPLETE ORDER
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-sm font-medium text-slate-400">No Pending Orders</p>
                    </div>
                )}
            </div>

            {/* Custom Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1e253a] border border-white/10 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-white/5">
                            <h3 className="text-white font-bold text-lg">Confirm Cancellation</h3>
                            <button 
                                onClick={() => setDeleteModal({ show: false, orderId: null })}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 text-center">
                            <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-slate-300 text-base mb-2">Are you sure you want to cancel the pending order of <span className="text-white font-bold">{parseFloat(deleteModal.qty || 0).toFixed(2)}</span> lots of <span className="text-white font-bold">{displaySymbol(deleteModal.symbol)}</span>?</p>
                            <p className="text-slate-500 text-sm">This action cannot be undone.</p>
                        </div>
                        
                        <div className="flex p-4 gap-3 bg-black/20">
                            <button 
                                onClick={() => setDeleteModal({ show: false, orderId: null })}
                                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all"
                            >
                                NO, KEEP IT
                            </button>
                            <button 
                                onClick={confirmDelete}
                                disabled={submitting}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'YES, CANCEL'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Complete Order Confirmation Modal */}
            {completeModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1e253a] border border-white/10 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-white/5">
                            <h3 className="text-white font-bold text-lg">Complete Order</h3>
                            <button 
                                onClick={() => setCompleteModal({ show: false, orderId: null, symbol: '', qty: 0 })}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 text-center">
                            <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <p className="text-slate-300 text-base mb-2">
                                Are you sure you want to execute/complete this pending order of <span className="text-white font-bold">{parseFloat(completeModal.qty || 0)}</span> lots of <span className="text-white font-bold">{(completeModal.symbol || '').split(':').pop().toUpperCase()}</span> manually?
                            </p>
                            <p className="text-slate-500 text-sm">This will instantly activate the trade at the limit price.</p>
                        </div>
                        
                        <div className="flex p-4 gap-3 bg-black/20">
                            <button 
                                onClick={() => setCompleteModal({ show: false, orderId: null, symbol: '', qty: 0 })}
                                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all"
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={confirmComplete}
                                disabled={submitting}
                                className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold transition-all shadow-lg shadow-green-950/20 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'YES, COMPLETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Detail Modal */}
            {detailModal.show && detailModal.order && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1e253a] border border-white/10 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transform animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-white/5">
                            <h3 className="text-white font-bold text-lg">Order Details</h3>
                            <button 
                                onClick={() => setDetailModal({ show: false, order: null })}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm text-left">
                                <div>
                                    <span className="text-slate-500 block">Order ID</span>
                                    <span className="text-white font-mono">{detailModal.order.id}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Date & Time</span>
                                    <span className="text-white">{formatTime(detailModal.order.entry_time)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Commodity</span>
                                    <span className="text-white font-bold">{(detailModal.order.symbol || '').split(':').pop().toUpperCase()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Client (User ID : Username)</span>
                                    <span className="text-white">{detailModal.order.user_id} : {detailModal.order.username}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Trade Type</span>
                                    <span className={`font-bold ${detailModal.order.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                                        {detailModal.order.type} LIMIT
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Rate / Limit Price</span>
                                    <span className="text-white font-mono">{parseFloat(detailModal.order.entry_price || 0).toFixed(8)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Lots / Quantity</span>
                                    <span className="text-white font-semibold">{parseFloat(detailModal.order.qty || 0)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Margin Used</span>
                                    <span className="text-white">₹{parseFloat(detailModal.order.margin_used || 0).toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">IP Address</span>
                                    <span className="text-white font-mono">{detailModal.order.trade_ip || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Created By</span>
                                    <span className="text-white">{detailModal.order.created_by_name || 'System / Auto'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-black/20 flex justify-end">
                            <button 
                                onClick={() => setDetailModal({ show: false, order: null })}
                                className="py-2 px-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingOrdersPage;
