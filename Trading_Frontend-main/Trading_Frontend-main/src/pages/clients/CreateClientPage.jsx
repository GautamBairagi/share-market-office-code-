import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Save, ArrowLeft, Info, Check, Lock, Key, Settings, User, ChevronDown, FileUp, ShieldCheck, FileText, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import ComexForm from './ComexForm';
import ForexForm from './ForexForm';
import CryptoForm from './CryptoForm';

const ScripField = ({ label, value, onChange, hint, name }) => {
    return (
        <div className="mb-6">
            <label htmlFor={name} className="text-sm uppercase font-normal tracking-wider" style={{ color: '#bcc0cf' }}>{label}</label>
            <input
                id={name}
                type="text"
                value={value}
                onChange={onChange}
                className="w-full bg-transparent py-1 text-white focus:outline-none transition-colors text-sm border-b border-slate-700 focus:border-[#4caf50]"
                placeholder="0"
                style={{ color: 'white' }}
            />
            {hint && <p className="text-[12px] mt-1" style={{ color: '#bcc0cf' }}>{hint}</p>}
        </div>
    );
};

const FieldLegend = ({ title, rightControl }) => (
    <div className="inline-flex items-center gap-4 text-lg font-bold mb-4 bg-[#1a2035]/50 px-4 py-2 rounded tracking-wider" style={{ color: '#bcc0cf' }}>
        <span>{title}:</span>
        {rightControl && <div>{rightControl}</div>}
    </div>
);

const InputField = ({ label, name, value, onChange, type = "text", placeholder, hint }) => (
    <div className="mb-6 group px-2">
        <label
            htmlFor={name}
            className="block text-[14px] font-normal mb-[3.2px]"
            style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}
        >
            {label}
        </label>
        <input
            id={name}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-transparent border-b border-white/20 py-1 text-white focus:outline-none focus:border-[#4caf50] transition-colors text-[16px]"
        />
        {hint && <p id={`${name}-hint`} className="text-[14px] mt-2 font-normal leading-normal" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>{hint}</p>}
    </div>
);

const CheckboxField = ({ label, name, checked, onChange, disabled, tooltip, className = '' }) => (
    <label htmlFor={name} className={`flex items-center gap-3 cursor-pointer group mb-3 px-2 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="relative flex items-center justify-center">
            <input
                id={name}
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="appearance-none w-5 h-5 border border-slate-600 rounded-sm checked:bg-[#4caf50] checked:border-[#4caf50] transition-all cursor-pointer disabled:cursor-not-allowed"
            />
            {checked && <Check className="w-3.5 h-3.5 text-white absolute pointer-events-none" />}
        </div>
        <div className="flex items-center gap-2">
            <span
                className="text-[14px] group-hover:text-white transition-colors"
                style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}
            >
                {label}
            </span>
            {tooltip && (
                <div title={tooltip} className="cursor-help">
                    <Info className="w-4 h-4 text-slate-500 hover:text-cyan-400 transition-colors" />
                </div>
            )}
        </div>
    </label>
);

const SelectField = ({ label, name, options, value, onChange, hint }) => (
    <div className="mb-6 group px-2">
        <label
            htmlFor={name}
            className="block text-[14px] mb-[3.2px] font-normal"
            style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}
        >
            {label}
        </label>
        <div className="relative">
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-white border border-slate-200 py-2.5 px-4 text-black font-extrabold outline-none rounded shadow-sm appearance-none focus:ring-2 focus:ring-[#4caf50]/20 transition-all text-sm uppercase tracking-wider cursor-pointer"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-white text-black font-bold">{opt.label}</option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-[#4caf50] transition-colors">
                <ChevronDown className="w-4 h-4" />
            </div>
        </div>
        {hint && <p className="text-[12px] mt-2 font-light leading-snug" style={{ color: '#8b8f9a' }}>{hint}</p>}
    </div>
);

const CreateClientPage = ({ client, onClose, onSave, onLogout, onNavigate, isCopy: propIsCopy = false }) => {
    const { isSuperAdmin } = useAuth();
    const location = useLocation();
    const isCopy = propIsCopy || location.state?.isCopy || location.pathname?.includes('/copy');
    const copySourceClient = client || location.state?.client || location.state?.selectedClient;
    const [sourceUsername, setSourceUsername] = useState(copySourceClient?.username || '');
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [formData, setFormData] = useState({
        // 1. Personal Details
        fullName: client?.fullName || client?.full_name || '',
        mobile: client?.mobile || '',
        username: isCopy ? '' : (client?.username || ''),
        password: '',
        initialFunds: String(client?.ledger_balance || client?.creditLimit || '0'),
        city: client?.city || '',

        // 2. Config
        isDemoAccount: client?.demoAccount === 'Yes' || false,
        allowFreshEntry: false,
        allowOrdersBetweenHL: true,
        tradeEquityUnits: false,
        accountStatus: true,
        autoCloseTrades: false,
        autoClosePercentage: '90',
        notifyPercentage: '70',
        banAllSegmentLimitOrder: false,

        // 3. MCX Futures
        mcxTrading: true,
        banMcxLimitOrder: false,
        mcxMinTimeToBookProfit: '0',
        mcxScalpingStopLoss: 'Disabled',
        mcxMinLot: '1',
        mcxMaxLot: '100',
        mcxMaxLotScrip: '1000',
        mcxMaxSizeAll: '5000',
        mcxBrokerageType: 'per_crore',
        mcxBrokerage: '800',
        mcxExposureType: 'per_turnover',
        mcxIntradayMargin: '500',
        mcxHoldingMargin: '100',
        mcxLotMargins: {
            BULLDEX: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            GOLD: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            SILVER: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            CRUDEOIL: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            'CRUDEOIL MINI': { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            COPPER: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            NICKEL: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            ZINC: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            ZINCMINI: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            LEAD: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            LEADMINI: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            ALUMINIUM: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            ALUMINI: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            NATURALGAS: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            'NATURALGAS MINI': { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            MENTHAOIL: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            COTTON: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            GOLDM: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            SILVERM: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            'SILVER MIC': { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            MGOLD: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            MCRUDEOIL: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            MSILVER: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            MNATURALGAS: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            MCOPPER: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            MLEAD: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            MZINC: { INTRADAY: '0', HOLDING: '0', LOT: '0' },
            MALUMINIUM: { INTRADAY: '0', HOLDING: '0', LOT: '0' }
        },
        mcxLotBrokerage: {
            GOLDM: '0', SILVERM: '0', BULLDEX: '0', GOLD: '0', SILVER: '0', CRUDEOIL: '0',
            COPPER: '0', NICKEL: '0', ZINC: '0', LEAD: '0', NATURALGAS: '0', 'NATURALGAS MINI': '0',
            ALUMINIUM: '0', MENTHAOIL: '0', COTTON: '0', 'SILVER MIC': '0', ZINCMINI: '0',
            ALUMINI: '0', LEADMINI: '0', 'CRUDEOIL MINI': '0',
            MGOLD: '0', MCRUDEOIL: '0', MSILVER: '0', MNATURALGAS: '0', MCOPPER: '0',
            MLEAD: '0', MZINC: '0', MALUMINIUM: '0'
        },
        bidGaps: {
            GOLDM: '1', SILVERM: '1', BULLDEX: '1', GOLD: '1', SILVER: '1',
            CRUDEOIL: '1', COPPER: '1', NICKEL: '1', ZINC: '1', LEAD: '1',
            NATURALGAS: '1', 'NATURALGAS MINI': '1', ALUMINIUM: '1', MENTHAOIL: '1',
            COTTON: '1', 'SILVER MIC': '1', ZINCMINI: '1', ALUMINI: '1',
            LEADMINI: '1', 'CRUDEOIL MINI': '1',
            MGOLD: '1', MCRUDEOIL: '1', MSILVER: '1', MNATURALGAS: '1', MCOPPER: '1',
            MLEAD: '1', MZINC: '1', MALUMINIUM: '1'
        },

        // 4. Equity Futures
        equityTrading: true,
        banEquityLimitOrder: false,
        equityMinTimeToBookProfit: '0',
        equityScalpingStopLoss: 'Disabled',
        equityBrokerage: '800',
        equityMinLot: '1',
        equityMaxLot: '100',
        equityMinIndexLot: '1',
        equityMaxIndexLot: '100',
        equityMaxScrip: '500',
        equityMaxIndexScrip: '500',
        equityMaxSizeAll: '2000',
        equityMaxSizeAllIndex: '2000',
        equityIntradayMargin: '500',
        equityHoldingMargin: '100',
        equityOrdersAway: '5',


        // 5. Options Config
        indexOptionsTrading: true,
        equityOptionsTrading: true,
        mcxOptionsTrading: false,
        banOptionsLimitOrder: false,
        optionsMinTimeToBookProfit: '0',
        optionsScalpingStopLoss: 'Disabled',
        optionsIndexBrokerageType: 'per_lot',
        optionsIndexBrokerage: '20',
        optionsEquityBrokerageType: 'per_lot',
        optionsEquityBrokerage: '20',
        optionsMcxBrokerageType: 'per_lot',
        optionsMcxBrokerage: '20',
        optionsMinBidPrice: '1',
        optionsIndexShortSelling: 'No',
        optionsEquityShortSelling: 'No',
        optionsMcxShortSelling: 'No',
        optionsEquityMinLot: '0',
        optionsEquityMaxLot: '50',
        optionsIndexMinLot: '0',
        optionsIndexMaxLot: '20',
        optionsMcxMinLot: '0',
        optionsMcxMaxLot: '50',
        optionsEquityMaxScrip: '200',
        optionsIndexMaxScrip: '200',
        optionsMcxMaxScrip: '200',
        optionsMaxEquitySizeAll: '200',
        optionsMaxIndexSizeAll: '200',
        optionsMaxMcxSizeAll: '200',
        optionsIndexIntraday: '5',
        optionsIndexHolding: '2',
        optionsEquityIntraday: '5',
        optionsEquityHolding: '2',
        optionsMcxIntraday: '5',
        optionsMcxHolding: '2',
        optionsOrdersAway: '10',

        // Options Short Selling Config
        optionsIndexShortSellingBrokerageType: 'per_crore',
        optionsIndexShortSellingBrokerage: '20',
        optionsEquityShortSellingBrokerageType: 'per_lot',
        optionsEquityShortSellingBrokerage: '20',
        optionsMcxShortSellingBrokerageType: 'per_lot',
        optionsMcxShortSellingBrokerage: '20',
        optionsEquityShortSellingMinLot: '0',
        optionsEquityShortSellingMaxLot: '50',
        optionsMcxShortSellingMinLot: '0',
        optionsMcxShortSellingMaxLot: '50',
        optionsIndexShortSellingMinLot: '0',
        optionsIndexShortSellingMaxLot: '20',
        optionsEquityShortSellingMaxScrip: '200',
        optionsIndexShortSellingMaxScrip: '200',
        optionsMcxShortSellingMaxScrip: '200',
        optionsEquityShortSellingMaxSizeAll: '200',
        optionsIndexShortSellingMaxSizeAll: '200',
        optionsMcxShortSellingMaxSizeAll: '200',
        optionsIndexShortSellingIntraday: '5',
        optionsIndexShortSellingHolding: '2',
        optionsEquityShortSellingIntraday: '5',
        optionsEquityShortSellingHolding: '2',
        optionsMcxShortSellingIntraday: '5',
        optionsMcxShortSellingHolding: '2',

        // 6. Expiry Rules
        autoSquareOff: 'No',

        expirySquareOffTime: '11:30',
        allowExpiringScrip: 'No',
        daysBeforeExpiry: '0',
        mcxOptionsAwayPoints: {
            MCXBULLDEX: '0', GOLD: '0', SILVER: '0', CRUDEOIL: '0', COPPER: '0',
            NICKEL: '0', ZINC: '0', LEAD: '0', NATURALGAS: '0', MENTHAOIL: '0',
            COTTON: '0', GOLDM: '0', SILVERM: '0', 'SILVER MIC': '0',
            MGOLD: '0', MCRUDEOIL: '0', MSILVER: '0', MNATURALGAS: '0', MCOPPER: '0',
            MLEAD: '0', MZINC: '0', MALUMINIUM: '0'
        },

        // 7. International Segments
        comexTrading: false,
        comexConfig: {
            brokerage: '0',
            brokerageType: 'per_crore',
            exposureType: 'per_crore',
            minLot: '0',
            maxLot: '0',
            maxLotScrip: '0',
            maxSizeAll: '0',
            intradayMargin: '0',
            holdingMargin: '0',
            ordersAway: '0',
            banLimitOrder: false,
            minTimeToBookProfit: '120',
            scalpingStopLoss: 'Disabled',
            lotMargins: {
                'XAU/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'XAG/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'USOIL': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'NGAS': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'COPPER': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'XAUUSDM': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'XAGUSDM': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'USOILM': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'NGASM': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'COPPERM': { INTRADAY: '0', HOLDING: '0', LOT: '1' }
            }
        },
        forexTrading: false,
        forexConfig: {
            brokerage: '0',
            brokerageType: 'per_crore',
            exposureType: 'per_crore',
            minLot: '0',
            maxLot: '0',
            maxLotScrip: '0',
            maxSizeAll: '0',
            intradayMargin: '0',
            holdingMargin: '0',
            ordersAway: '0',
            banLimitOrder: false,
            minTimeToBookProfit: '120',
            scalpingStopLoss: 'Disabled',
            lotMargins: {
                'USD/INR': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'GBP/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'USD/JPY': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'USD/CHF': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'AUD/CAD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'EUR/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' }
            }
        },
        cryptoTrading: false,
        cryptoConfig: {
            brokerage: '0',
            brokerageType: 'per_crore',
            exposureType: 'per_crore',
            minLot: '0',
            maxLot: '0',
            maxLotScrip: '0',
            maxSizeAll: '0',
            intradayMargin: '0',
            holdingMargin: '0',
            ordersAway: '0',
            banLimitOrder: false,
            minTimeToBookProfit: '120',
            scalpingStopLoss: 'Disabled',
            lotMargins: {
                'BTC/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'ETH/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'BNB/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'SOL/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'XRP/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'ADA/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'DOGE/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'DOT/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'AVAX/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' }
            }
        },

        // 8. Other
        notes: '',
        broker: client?.broker || '',
        transactionPassword: '',

        // 9. Kyc / Documents
        documents: {
            panCard: null,
            aadhaarFront: null,
            aadhaarBack: null,
            bankStatement: null,
            additionalDoc: null
        },
        kycStatus: 'Pending'
    });

    const [loading, setLoading] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [brokers, setBrokers] = useState([]);
    const [brokerMcxMargins, setBrokerMcxMargins] = useState(null); // Broker's MCX lot wise margins
    const [brokerMcxBrokerage, setBrokerMcxBrokerage] = useState(null); // Broker's MCX lot wise brokerage
    const [segments, setSegments] = useState({
        comex: false,
        forex: false,
        crypto: false
    });
    const profileRef = useRef(null);

    // Mapping from client scrip keys -> broker mcxMargins keys
    const SCRIP_TO_BROKER_KEY = {
        'GOLDM': 'GOLDM',
        'SILVERM': 'SILVERM',
        'BULLDEX': 'MCXBULLDEX',
        'GOLD': 'GOLD',
        'SILVER': 'SILVER',
        'CRUDEOIL': 'CRUDEOIL',
        'COPPER': 'COPPER',
        'NICKEL': 'NICKEL',
        'ZINC': 'ZINC',
        'LEAD': 'LEAD',
        'NATURALGAS': 'NATURALGAS',
        'NATURALGAS MINI': 'NATGASMINI',
        'ALUMINIUM': 'ALUMINIUM',
        'COTTON': 'COTTON',
        'SILVER MIC': 'SILVERMIC',
        'ZINCMINI': 'ZINCMINI',
        'ALUMINI': 'ALUMINI',
        'LEADMINI': 'LEADMINI',
        'CRUDEOIL MINI': 'CRUDEOILM',
        'MENTHAOIL': null,
        'MGOLD': 'MGOLD',
        'MCRUDEOIL': 'MCRUDEOIL',
        'MSILVER': 'MSILVER',
        'MNATURALGAS': 'MNATURALGAS',
        'MCOPPER': 'MCOPPER',
        'MLEAD': 'MLEAD',
        'MZINC': 'MZINC',
        'MALUMINIUM': 'MALUMINIUM'
    };

    // Fetch brokers for dropdown
    useEffect(() => {
        const fetchBrokers = async () => {
            try {
                const data = await api.getClients({ role: 'BROKER' });
                setBrokers(data || []);
            } catch (err) {
                console.error('Failed to fetch brokers:', err);
            }
        };
        fetchBrokers();
    }, []);

    // Fetch broker's MCX margins when broker selection changes
    useEffect(() => {
        const fetchBrokerMargins = async () => {
            if (!formData.broker || formData.broker.trim() === '') {
                setBrokerMcxMargins(null);
                return;
            }
            try {
                const brokerId = parseInt(formData.broker.split(':')[0].trim());
                if (!brokerId || isNaN(brokerId)) return;
                const brokerData = await api.getBrokerShares(brokerId);
                const margins = brokerData?.segments?.mcxMargins || null;
                const brokerage = brokerData?.segments?.mcxBrokerage || null;
                setBrokerMcxMargins(margins);
                setBrokerMcxBrokerage(brokerage);
            } catch (err) {
                console.error('Failed to fetch broker MCX data:', err);
                setBrokerMcxMargins(null);
                setBrokerMcxBrokerage(null);
            }
        };
        fetchBrokerMargins();
    }, [formData.broker]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load full client profile and settings when copying or pre-filling from a client
    useEffect(() => {
        const sourceId = copySourceClient?.id;
        if (sourceId) {
            const loadFullProfile = async () => {
                setLoadingProfile(true);
                try {
                    console.log('[CreateClientPage] Loading full profile for source client ID:', sourceId);
                    const data = await api.getClientById(sourceId);
                    const profile = data?.profile || {};
                    const settings = data?.settings || {};
                    const config = settings.config || (typeof settings.config_json === 'string' ? JSON.parse(settings.config_json) : (settings.config_json || {}));

                    setSourceUsername(profile.username || copySourceClient.username || '');

                    // Enable international segment toggles based on config
                    const hasComex = !!(config.comexTrading || (config.comexConfig && Object.keys(config.comexConfig).length > 0));
                    const hasForex = !!(config.forexTrading || (config.forexConfig && Object.keys(config.forexConfig).length > 0));
                    const hasCrypto = !!(config.cryptoTrading || (config.cryptoConfig && Object.keys(config.cryptoConfig).length > 0));
                    setSegments({
                        comex: hasComex,
                        forex: hasForex,
                        crypto: hasCrypto
                    });

                    // Target broker ID
                    const targetBrokerId = settings.broker_id || profile.broker_id || copySourceClient.broker_id || copySourceClient.parentId || copySourceClient.parent_id;

                    setFormData(prev => {
                        let brokerStr = prev.broker;
                        if (targetBrokerId && brokers.length > 0) {
                            const b = brokers.find(item => String(item.id) === String(targetBrokerId));
                            if (b) {
                                brokerStr = `${b.id} : ${b.username}`;
                            }
                        }

                        return {
                            ...prev,
                            fullName: profile.full_name || prev.fullName,
                            mobile: profile.mobile || prev.mobile,
                            username: isCopy ? '' : (profile.username || prev.username),
                            password: '',
                            initialFunds: String(profile.ledger_balance || profile.credit_limit || prev.initialFunds || '0'),
                            city: profile.city || prev.city,
                            isDemoAccount: profile.is_demo === 1 || prev.isDemoAccount,
                            accountStatus: profile.status !== 'Inactive',

                            // Settings fields
                            allowFreshEntry: !!settings.allow_fresh_entry,
                            allowOrdersBetweenHL: settings.allow_orders_between_hl !== undefined ? !!settings.allow_orders_between_hl : prev.allowOrdersBetweenHL,
                            tradeEquityUnits: !!settings.trade_equity_units,
                            notifyPercentage: String(settings.notify_at_m2m_pct || prev.notifyPercentage || '70'),
                            banAllSegmentLimitOrder: !!settings.ban_all_segment_limit_order,
                            autoClosePercentage: String(settings.auto_close_pct || prev.autoClosePercentage || '90'),

                            // Config fields
                            ...(Object.keys(config).length > 0 ? {
                                mcxTrading: config.mcxTrading ?? prev.mcxTrading,
                                mcxMinLot: config.mcxMinLot ?? prev.mcxMinLot,
                                banMcxLimitOrder: config.banMcxLimitOrder ?? prev.banMcxLimitOrder,
                                mcxMinTimeToBookProfit: config.mcxMinTimeToBookProfit ?? prev.mcxMinTimeToBookProfit,
                                mcxScalpingStopLoss: config.mcxScalpingStopLoss ?? prev.mcxScalpingStopLoss,
                                mcxMaxLot: config.mcxMaxLot ?? prev.mcxMaxLot,
                                mcxMaxLotScrip: config.mcxMaxLotScrip ?? prev.mcxMaxLotScrip,
                                mcxMaxSizeAll: config.mcxMaxSizeAll ?? prev.mcxMaxSizeAll,
                                mcxBrokerageType: config.mcxBrokerageType ?? prev.mcxBrokerageType,
                                mcxBrokerage: config.mcxBrokerage ?? prev.mcxBrokerage,
                                mcxExposureType: config.mcxExposureType ?? prev.mcxExposureType,
                                mcxIntradayMargin: config.mcxIntradayMargin ?? prev.mcxIntradayMargin,
                                mcxHoldingMargin: config.mcxHoldingMargin ?? prev.mcxHoldingMargin,
                                mcxLotMargins: config.mcxLotMargins ? { ...prev.mcxLotMargins, ...config.mcxLotMargins } : prev.mcxLotMargins,
                                mcxLotBrokerage: config.mcxLotBrokerage ? { ...prev.mcxLotBrokerage, ...config.mcxLotBrokerage } : prev.mcxLotBrokerage,
                                bidGaps: config.bidGaps ? { ...prev.bidGaps, ...config.bidGaps } : prev.bidGaps,

                                equityTrading: config.equityTrading ?? prev.equityTrading,
                                equityBrokerage: config.equityBrokerage ?? prev.equityBrokerage,
                                equityMinLot: config.equityMinLot ?? config.equityMinQty ?? prev.equityMinLot,
                                banEquityLimitOrder: config.banEquityLimitOrder ?? prev.banEquityLimitOrder,
                                equityMinTimeToBookProfit: config.equityMinTimeToBookProfit ?? prev.equityMinTimeToBookProfit,
                                equityScalpingStopLoss: config.equityScalpingStopLoss ?? prev.equityScalpingStopLoss,
                                equityMaxLot: config.equityMaxLot ?? config.equityMaxQty ?? prev.equityMaxLot,
                                equityMinIndexLot: config.equityMinIndexLot ?? config.equityMinIndexQty ?? prev.equityMinIndexLot,
                                equityMaxIndexLot: config.equityMaxIndexLot ?? config.equityMaxIndexQty ?? prev.equityMaxIndexLot,
                                equityMaxScrip: config.equityMaxScrip ?? prev.equityMaxScrip,
                                equityMaxIndexScrip: config.equityMaxIndexScrip ?? prev.equityMaxIndexScrip,
                                equityMaxSizeAll: config.equityMaxSizeAll ?? prev.equityMaxSizeAll,
                                equityMaxSizeAllIndex: config.equityMaxSizeAllIndex ?? prev.equityMaxSizeAllIndex,
                                equityIntradayMargin: config.equityIntradayMargin ?? prev.equityIntradayMargin,
                                equityHoldingMargin: config.equityHoldingMargin ?? prev.equityHoldingMargin,
                                equityOrdersAway: config.equityOrdersAway ?? prev.equityOrdersAway,

                                indexOptionsTrading: config.indexOptionsTrading ?? prev.indexOptionsTrading,
                                equityOptionsTrading: config.equityOptionsTrading ?? prev.equityOptionsTrading,
                                mcxOptionsTrading: config.mcxOptionsTrading ?? prev.mcxOptionsTrading,
                                optionsIndexBrokerageType: config.optionsIndexBrokerageType ?? prev.optionsIndexBrokerageType,
                                optionsIndexBrokerage: config.optionsIndexBrokerage ?? prev.optionsIndexBrokerage,
                                optionsEquityBrokerageType: config.optionsEquityBrokerageType ?? prev.optionsEquityBrokerageType,
                                optionsEquityBrokerage: config.optionsEquityBrokerage ?? prev.optionsEquityBrokerage,
                                optionsMcxBrokerageType: config.optionsMcxBrokerageType ?? prev.optionsMcxBrokerageType,
                                optionsMcxBrokerage: config.optionsMcxBrokerage ?? prev.optionsMcxBrokerage,
                                banOptionsLimitOrder: config.banOptionsLimitOrder ?? prev.banOptionsLimitOrder,
                                optionsMinTimeToBookProfit: config.optionsMinTimeToBookProfit ?? prev.optionsMinTimeToBookProfit,
                                optionsScalpingStopLoss: config.optionsScalpingStopLoss ?? prev.optionsScalpingStopLoss,
                                optionsMinBidPrice: config.optionsMinBidPrice ?? prev.optionsMinBidPrice,
                                optionsIndexShortSelling: config.optionsIndexShortSelling ?? prev.optionsIndexShortSelling,
                                optionsEquityShortSelling: config.optionsEquityShortSelling ?? prev.optionsEquityShortSelling,
                                optionsMcxShortSelling: config.optionsMcxShortSelling ?? prev.optionsMcxShortSelling,
                                optionsEquityMinLot: config.optionsEquityMinLot ?? prev.optionsEquityMinLot,
                                optionsEquityMaxLot: config.optionsEquityMaxLot ?? prev.optionsEquityMaxLot,
                                optionsIndexMinLot: config.optionsIndexMinLot ?? prev.optionsIndexMinLot,
                                optionsIndexMaxLot: config.optionsIndexMaxLot ?? prev.optionsIndexMaxLot,
                                optionsMcxMinLot: config.optionsMcxMinLot ?? prev.optionsMcxMinLot,
                                optionsMcxMaxLot: config.optionsMcxMaxLot ?? prev.optionsMcxMaxLot,
                                optionsEquityMaxScrip: config.optionsEquityMaxScrip ?? prev.optionsEquityMaxScrip,
                                optionsIndexMaxScrip: config.optionsIndexMaxScrip ?? prev.optionsIndexMaxScrip,
                                optionsMcxMaxScrip: config.optionsMcxMaxScrip ?? prev.optionsMcxMaxScrip,
                                optionsMaxEquitySizeAll: config.optionsMaxEquitySizeAll ?? prev.optionsMaxEquitySizeAll,
                                optionsMaxIndexSizeAll: config.optionsMaxIndexSizeAll ?? prev.optionsMaxIndexSizeAll,
                                optionsMaxMcxSizeAll: config.optionsMaxMcxSizeAll ?? prev.optionsMaxMcxSizeAll,
                                optionsIndexIntraday: config.optionsIndexIntraday ?? prev.optionsIndexIntraday,
                                optionsIndexHolding: config.optionsIndexHolding ?? prev.optionsIndexHolding,
                                optionsEquityIntraday: config.optionsEquityIntraday ?? prev.optionsEquityIntraday,
                                optionsEquityHolding: config.optionsEquityHolding ?? prev.optionsEquityHolding,
                                optionsMcxIntraday: config.optionsMcxIntraday ?? prev.optionsMcxIntraday,
                                optionsMcxHolding: config.optionsMcxHolding ?? prev.optionsMcxHolding,
                                optionsOrdersAway: config.optionsOrdersAway ?? prev.optionsOrdersAway,

                                optionsIndexShortSellingBrokerageType: config.optionsIndexShortSellingBrokerageType ?? prev.optionsIndexShortSellingBrokerageType,
                                optionsIndexShortSellingBrokerage: config.optionsIndexShortSellingBrokerage ?? prev.optionsIndexShortSellingBrokerage,
                                optionsEquityShortSellingBrokerageType: config.optionsEquityShortSellingBrokerageType ?? prev.optionsEquityShortSellingBrokerageType,
                                optionsEquityShortSellingBrokerage: config.optionsEquityShortSellingBrokerage ?? prev.optionsEquityShortSellingBrokerage,
                                optionsMcxShortSellingBrokerageType: config.optionsMcxShortSellingBrokerageType ?? prev.optionsMcxShortSellingBrokerageType,
                                optionsMcxShortSellingBrokerage: config.optionsMcxShortSellingBrokerage ?? prev.optionsMcxShortSellingBrokerage,
                                optionsEquityShortSellingMinLot: config.optionsEquityShortSellingMinLot ?? prev.optionsEquityShortSellingMinLot,
                                optionsEquityShortSellingMaxLot: config.optionsEquityShortSellingMaxLot ?? prev.optionsEquityShortSellingMaxLot,
                                optionsMcxShortSellingMinLot: config.optionsMcxShortSellingMinLot ?? prev.optionsMcxShortSellingMinLot,
                                optionsMcxShortSellingMaxLot: config.optionsMcxShortSellingMaxLot ?? prev.optionsMcxShortSellingMaxLot,
                                optionsIndexShortSellingMinLot: config.optionsIndexShortSellingMinLot ?? prev.optionsIndexShortSellingMinLot,
                                optionsIndexShortSellingMaxLot: config.optionsIndexShortSellingMaxLot ?? prev.optionsIndexShortSellingMaxLot,
                                optionsEquityShortSellingMaxScrip: config.optionsEquityShortSellingMaxScrip ?? prev.optionsEquityShortSellingMaxScrip,
                                optionsIndexShortSellingMaxScrip: config.optionsIndexShortSellingMaxScrip ?? prev.optionsIndexShortSellingMaxScrip,
                                optionsMcxShortSellingMaxScrip: config.optionsMcxShortSellingMaxScrip ?? prev.optionsMcxShortSellingMaxScrip,
                                optionsEquityShortSellingMaxSizeAll: config.optionsEquityShortSellingMaxSizeAll ?? prev.optionsEquityShortSellingMaxSizeAll,
                                optionsIndexShortSellingMaxSizeAll: config.optionsIndexShortSellingMaxSizeAll ?? prev.optionsIndexShortSellingMaxSizeAll,
                                optionsMcxShortSellingMaxSizeAll: config.optionsMcxShortSellingMaxSizeAll ?? prev.optionsMcxShortSellingMaxSizeAll,
                                optionsIndexShortSellingIntraday: config.optionsIndexShortSellingIntraday ?? prev.optionsIndexShortSellingIntraday,
                                optionsIndexShortSellingHolding: config.optionsIndexShortSellingHolding ?? prev.optionsIndexShortSellingHolding,
                                optionsEquityShortSellingIntraday: config.optionsEquityShortSellingIntraday ?? prev.optionsEquityShortSellingIntraday,
                                optionsEquityShortSellingHolding: config.optionsEquityShortSellingHolding ?? prev.optionsEquityShortSellingHolding,
                                optionsMcxShortSellingIntraday: config.optionsMcxShortSellingIntraday ?? prev.optionsMcxShortSellingIntraday,
                                optionsMcxShortSellingHolding: config.optionsMcxShortSellingHolding ?? prev.optionsMcxShortSellingHolding,

                                autoClosePct: config.autoClosePct ?? prev.autoClosePct,
                                autoClosePercentage: config.autoClosePercentage ?? prev.autoClosePercentage,
                                notifyPercentage: config.notifyPercentage ?? prev.notifyPercentage,
                                autoSquareOff: config.autoSquareOff ?? prev.autoSquareOff,
                                expirySquareOffTime: config.expirySquareOffTime ?? prev.expirySquareOffTime,
                                allowExpiringScrip: config.allowExpiringScrip ?? prev.allowExpiringScrip,
                                daysBeforeExpiry: config.daysBeforeExpiry ?? prev.daysBeforeExpiry,
                                mcxOptionsAwayPoints: config.mcxOptionsAwayPoints ? { ...prev.mcxOptionsAwayPoints, ...config.mcxOptionsAwayPoints } : prev.mcxOptionsAwayPoints,

                                comexTrading: hasComex,
                                forexTrading: hasForex,
                                cryptoTrading: hasCrypto,
                                comexConfig: config.comexConfig ? { ...prev.comexConfig, ...config.comexConfig, lotMargins: { ...prev.comexConfig.lotMargins, ...config.comexConfig?.lotMargins } } : prev.comexConfig,
                                forexConfig: config.forexConfig ? { ...prev.forexConfig, ...config.forexConfig, lotMargins: { ...prev.forexConfig.lotMargins, ...config.forexConfig?.lotMargins } } : prev.forexConfig,
                                cryptoConfig: config.cryptoConfig ? { ...prev.cryptoConfig, ...config.cryptoConfig, lotMargins: { ...prev.cryptoConfig.lotMargins, ...config.cryptoConfig?.lotMargins } } : prev.cryptoConfig,
                                notes: config.notes ?? prev.notes,
                            } : {}),

                            ...(brokerStr ? { broker: brokerStr } : {}),
                            transactionPassword: ''
                        };
                    });
                } catch (err) {
                    console.error('Failed to load full profile for copy:', err);
                } finally {
                    setLoadingProfile(false);
                }
            };
            loadFullProfile();
        }
    }, [copySourceClient?.id, brokers.length]);

    // Ensure broker dropdown is updated when brokers finish loading
    useEffect(() => {
        if (brokers.length > 0 && copySourceClient && (!formData.broker || formData.broker === '')) {
            const targetBrokerId = copySourceClient.broker_id || copySourceClient.parentId || copySourceClient.parent_id;
            if (targetBrokerId) {
                const b = brokers.find(item => String(item.id) === String(targetBrokerId));
                if (b) {
                    setFormData(prev => ({
                        ...prev,
                        broker: `${b.id} : ${b.username}`
                    }));
                }
            }
        }
    }, [brokers, copySourceClient]);

    // Pre-fill broker from URL state (when coming from ViewBrokerPage)
    useEffect(() => {
        if (location.state?.preselectedBrokerId && brokers.length > 0) {
            const selectedBroker = brokers.find(b => b.id === parseInt(location.state.preselectedBrokerId));
            if (selectedBroker) {
                setFormData(prev => ({
                    ...prev,
                    broker: `${selectedBroker.id} : ${selectedBroker.username}`
                }));
            }
        }
    }, [location.state?.preselectedBrokerId, brokers]);

    // Pre-fill broker from URL state (when coming from ViewBrokerPage)

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSegmentConfigChange = (segment, field, value) => {
        setFormData(prev => ({
            ...prev,
            [`${segment}Config`]: {
                ...prev[`${segment}Config`],
                [field]: value
            }
        }));
    };

    const handleSegmentToggle = (segment, isEnabled) => {
        setSegments(prev => ({ ...prev, [segment]: isEnabled }));
        setFormData(prev => ({ ...prev, [`${segment}Trading`]: isEnabled }));
    };

    const handleNestedChange = (parent, field, value, subField = null) => {
        setFormData(prev => {
            const newParent = { ...prev[parent] };
            if (subField) {
                newParent[field] = { ...newParent[field], [subField]: value };
            } else {
                newParent[field] = value;
            }
            return { ...prev, [parent]: newParent };
        });
    };

    const isKycValid = () => {
        return (
            formData.documents.panCard &&
            formData.documents.aadhaarFront &&
            formData.documents.aadhaarBack &&
            formData.documents.bankStatement
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaveError('');
        try {
            // ─── VALIDATION ───────────────────────
            // Check Broker is selected (MANDATORY)
            if (!formData.broker || formData.broker.trim() === '') {
                setSaveError('❌ Broker is required! Please select a broker.');
                setLoading(false);
                return;
            }

            if (!formData.fullName || formData.fullName.trim() === '') {
                setSaveError('❌ Full Name is required!');
                setLoading(false);
                return;
            }
            if (!formData.username || formData.username.trim() === '') {
                setSaveError('❌ Username is required!');
                setLoading(false);
                return;
            }
            if (!formData.password || formData.password.trim() === '') {
                setSaveError('❌ Password is required!');
                setLoading(false);
                return;
            }

            // ─── VALIDATE against broker's MCX minimum margins & brokerage ───
            if (brokerMcxMargins || brokerMcxBrokerage) {
                // 1. Validate Exposure Lot wise (Intraday & Holding) vs Broker's Margins
                if (formData.mcxExposureType === 'per_lot' && brokerMcxMargins) {
                    for (const [clientKey, brokerKey] of Object.entries(SCRIP_TO_BROKER_KEY)) {
                        if (!brokerKey) continue;

                        const brokerMinIntraday = parseFloat(brokerMcxMargins[brokerKey]?.intraday || 0);
                        const brokerMinHolding = parseFloat(brokerMcxMargins[brokerKey]?.holding || 0);

                        const clientIntraday = parseFloat(formData.mcxLotMargins[clientKey]?.INTRADAY || 0);
                        const clientHolding = parseFloat(formData.mcxLotMargins[clientKey]?.HOLDING || 0);

                        if (brokerMinIntraday > 0 && clientIntraday < brokerMinIntraday) {
                            setSaveError(`❌ Your broker set minimum ${clientKey} INTRADAY margin as ${brokerMinIntraday}. Please enter ${brokerMinIntraday} or above.`);
                            setLoading(false);
                            return;
                        }
                        if (brokerMinHolding > 0 && clientHolding < brokerMinHolding) {
                            setSaveError(`❌ Your broker set minimum ${clientKey} HOLDING margin as ${brokerMinHolding}. Please enter ${brokerMinHolding} or above.`);
                            setLoading(false);
                            return;
                        }
                    }
                }


                // 3. Validate Brokerage Lot wise (mcxLotBrokerage) vs Broker's Brokerage
                if (formData.mcxBrokerageType === 'per_lot' && brokerMcxBrokerage) {
                    for (const [clientKey, brokerKey] of Object.entries(SCRIP_TO_BROKER_KEY)) {
                        if (!brokerKey) continue;
                        const brokerMinBrokerage = parseFloat(brokerMcxBrokerage[brokerKey] || 0);
                        const clientVal = parseFloat(formData.mcxLotBrokerage[clientKey] || 0);
                        if (brokerMinBrokerage > 0 && clientVal < brokerMinBrokerage) {
                            setSaveError(`❌ Your broker set minimum ${clientKey} (Lot Wise Brokerage) as ${brokerMinBrokerage}. Please enter ${brokerMinBrokerage} or above.`);
                            setLoading(false);
                            return;
                        }
                    }
                }
            }

            // Check Transaction Password is provided
            if (!formData.transactionPassword || formData.transactionPassword.trim() === '') {
                setSaveError('❌ Transaction Password is required! Please set a transaction password.');
                setLoading(false);
                return;
            }

            // ─── VERIFY TRANSACTION PASSWORD ───
            // Verify that the entered transaction password is correct
            try {
                await api.verifyTransactionPassword(formData.transactionPassword);
            } catch (verifyErr) {
                setSaveError('❌ Invalid transaction password! Please enter the correct password.');
                setLoading(false);
                return;
            }

            // ─── CREATE CLIENT ────────────────────
            // Step 1: Create user with basic fields
            const result = await api.createClient({
                fullName: formData.fullName,
                username: formData.username,
                password: formData.password,
                mobile: formData.mobile,
                city: formData.city,
                creditLimit: formData.initialFunds || 0,
                role: 'TRADER'
            });
            const userId = result.id;

            // Step 2: Update user profile with extra fields
            const updateData = {
                isDemo: formData.isDemoAccount,
                status: formData.accountStatus ? 'Active' : 'Inactive',
                city: formData.city || null,
                exposureMultiplier: 1
            };
            // NOTE: parent_id stays with creator (SUPERADMIN/ADMIN)
            // Broker assignment is tracked separately in client_settings.broker_id
            await api.updateUser(userId, updateData);

            // Step 3: Save client settings + broker assignment + ALL config as JSON
            const configToSave = { ...formData };
            // Remove files from config (they go to documents endpoint)
            delete configToSave.documents;
            delete configToSave.password;

            // Remove disabled international segments from configToSave
            if (!configToSave.comexTrading) delete configToSave.comexConfig;
            if (!configToSave.forexTrading) delete configToSave.forexConfig;
            if (!configToSave.cryptoTrading) delete configToSave.cryptoConfig;

            // Extract broker ID if selected
            let brokerId = null;
            if (formData.broker && formData.broker.trim() !== '') {
                brokerId = parseInt(formData.broker.split(':')[0].trim());
            }

            const payload = {
                allowFreshEntry: formData.allowFreshEntry ? 1 : 0,
                allowOrdersBetweenHL: formData.allowOrdersBetweenHL ? 1 : 0,
                tradeEquityUnits: formData.tradeEquityUnits ? 1 : 0,
                autoClosePct: formData.autoClosePercentage,
                notifyPct: formData.notifyPercentage,
                banAllSegmentLimitOrder: formData.banAllSegmentLimitOrder ? 1 : 0,
                brokerId: brokerId,  // Store broker assignment separately
                config: configToSave
            };
            console.log('[DEBUG] Create Payload:', payload);

            await api.updateClientSettings(userId, payload);

            // Step 4: Set transaction password if provided
            if (formData.transactionPassword) {
                await api.updateUserPasswords(userId, {
                    transactionPassword: formData.transactionPassword
                });
            }

            // Step 5: Upload KYC documents if any files selected
            const docs = formData.documents;
            if (docs.panCard || docs.aadhaarFront || docs.aadhaarBack || docs.bankStatement) {
                const docFormData = new FormData();
                if (docs.panCard) docFormData.append('panScreenshot', docs.panCard);
                if (docs.aadhaarFront) docFormData.append('aadharFront', docs.aadhaarFront);
                if (docs.aadhaarBack) docFormData.append('aadharBack', docs.aadhaarBack);
                if (docs.bankStatement) docFormData.append('bankProof', docs.bankStatement);
                docFormData.append('kycStatus', 'PENDING');
                await api.updateDocuments(userId, docFormData);
            }

            // Step 6: Assign initial funds to ledger if provided
            if (parseFloat(formData.initialFunds) > 0) {
                await api.createFund({
                    userId: userId,
                    amount: parseFloat(formData.initialFunds),
                    mode: 'deposit',
                    notes: `Initial Opening Balance - ₹${parseFloat(formData.initialFunds).toFixed(2)}`
                });
            }

            onSave(formData);
        } catch (err) {
            setSaveError(err.message || 'Failed to create client');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 w-full max-w-full min-w-0 bg-[#1a2035] text-slate-300 pb-24 sm:pb-12">
            {/* Back Button & Header */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 border-b border-white/10 pb-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-2 text-white hover:text-green-400 transition-colors font-bold text-xs sm:text-sm"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>BACK</span>
                </button>
            </div>

            <div className="max-w-6xl mx-auto mt-4 mb-6">
                {/* Floating Card Header (3D Ribbon Style) */}
                <div className="relative z-20 -mb-8 ml-2 sm:ml-4 flex flex-col items-start">
                    <div
                        className="px-4 sm:px-6 py-3 sm:py-4 rounded-md shadow-xl relative z-10"
                        style={{ background: 'linear-gradient(60deg, rgb(40, 140, 108), rgb(78, 167, 82))' }}
                    >
                        <h2 className="text-white text-base font-normal leading-none tracking-tight">
                            {isCopy ? `Create Trading Client (Copy of ${sourceUsername || 'Client'}):` : 'Create Trading Client:'}
                        </h2>
                    </div>
                    {/* The 3D fold decorator */}
                    <div className="w-4 h-4 bg-[#388e3c] -mt-2 ml-2 rounded-sm rotate-45 relative z-0"></div>
                </div>

                {/* Main Card */}
                <div className="bg-[#202940] rounded shadow-2xl p-4 sm:p-6 md:p-8 pt-14 sm:pt-16 border border-white/5">
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-12">

                            {/* PERSONAL DETAILS */}
                            <fieldset className="border-none p-0 m-0">
                                <div className="flex items-center justify-between mb-8 px-2">
                                    <FieldLegend title="Personal Details" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <InputField
                                        label="Name"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder=""
                                        hint="Insert Real name of the trader. Will be visible in trading App"
                                    />
                                    <InputField
                                        label="Mobile"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        placeholder=""
                                        hint="Optional"
                                    />
                                    <InputField
                                        label="Username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder=""
                                        hint="username for loggin-in with, is not case sensitive. must be unique for every trader. should not contain symbols."
                                    />
                                    <InputField
                                        label="Password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder=""
                                        hint="password for loggin-in with, is case sensitive. Leave Blank if you want password remain unchanged."
                                    />
                                    <InputField
                                        label="Initial Funds"
                                        name="initialFunds"
                                        value={formData.initialFunds}
                                        onChange={handleChange}
                                        placeholder="0"
                                    />
                                    <InputField
                                        label="City"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder=""
                                        hint="Optional"
                                    />
                                </div>
                            </fieldset>

                            <hr className="border-white/5" />

                            {/* CONFIG */}
                            <fieldset className="border-none p-0 m-0">
                                <div className="flex items-center justify-between mb-8">
                                    <FieldLegend title="Config" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 px-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                    {/* Column 1 on mobile, left-to-right flow on desktop */}
                                    <div className="mb-4"><CheckboxField label="demo account?" name="isDemoAccount" checked={formData.isDemoAccount} onChange={handleChange} /></div>
                                    <div className="mb-4"><CheckboxField label="Allow Fresh Entry Order above high & below low?" name="allowFreshEntry" checked={formData.allowFreshEntry} onChange={handleChange} /></div>

                                    <div className="mb-4"><CheckboxField label="Allow Orders between High - Low?" name="allowOrdersBetweenHL" checked={formData.allowOrdersBetweenHL} onChange={handleChange} /></div>
                                    <div className="mb-4"><CheckboxField label="Trade equity as units instead of lots." name="tradeEquityUnits" checked={formData.tradeEquityUnits} onChange={handleChange} /></div>

                                    <div className="mb-4"><CheckboxField label="Account Status" name="accountStatus" checked={formData.accountStatus} onChange={handleChange} /></div>
                                    <div className="mb-4"><CheckboxField label="Ban All Segment Limit Order" name="banAllSegmentLimitOrder" checked={formData.banAllSegmentLimitOrder} onChange={handleChange} /></div>

                                    <div className="mb-4"><CheckboxField label="Auto Close Trades if condition met" name="autoCloseTrades" checked={formData.autoCloseTrades} onChange={handleChange} /></div>
                                    <div className="hidden md:block"></div> {/* Spacer for grid alignment */}

                                    <InputField
                                        label="auto-Close all active trades when the losses reach % of Ledger-balance"
                                        name="autoClosePercentage"
                                        value={formData.autoClosePercentage}
                                        onChange={handleChange}
                                        placeholder="90"
                                        hint="Example: 95, will close when losses reach 95% of ledger balance"
                                    />
                                    <InputField
                                        label="Notify client when the losses reach % of Ledger-balance"
                                        name="notifyPercentage"
                                        value={formData.notifyPercentage}
                                        onChange={handleChange}
                                        placeholder="70"
                                        hint="Example: 70, will send notification to customer every 5-minutes until losses cross 70% of ledger balance"
                                    />
                                </div>
                            </fieldset>

                            <hr className="border-white/5" />

                            {/* MCX FUTURES */}
                            <fieldset className="border-none p-0 m-0">
                                <FieldLegend title="MCX Future" />

                                {/* Checkboxes Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 px-2 mb-6">
                                    <div className="mb-2">
                                        <CheckboxField
                                            label="MCX Trading"
                                            name="mcxTrading"
                                            checked={formData.mcxTrading}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <CheckboxField
                                            label="Ban MCX Limit Order"
                                            name="banMcxLimitOrder"
                                            checked={formData.banMcxLimitOrder}
                                            onChange={handleChange}
                                            disabled={formData.banAllSegmentLimitOrder}
                                        />
                                    </div>
                                </div>

                                {/* Web View Layout - Unchanged */}
                                <div className="hidden md:grid md:grid-cols-2 gap-x-12 gap-y-4 px-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                    {/* Column 1 */}
                                    <div className="space-y-4">
                                        <InputField label="Maximum lot size allowed per single trade of MCX" name="mcxMaxLot" value={formData.mcxMaxLot} onChange={handleChange} placeholder="20" />
                                        <InputField label="Max Size All Commodity" name="mcxMaxSizeAll" value={formData.mcxMaxSizeAll} onChange={handleChange} placeholder="100" />

                                        <InputField label="MCX brokerage" name="mcxBrokerage" value={formData.mcxBrokerage} onChange={handleChange} placeholder="800" />

                                        {formData.mcxExposureType !== 'per_lot' && (
                                            <InputField label="Intraday Exposure/Margin MCX" name="mcxIntradayMargin" value={formData.mcxIntradayMargin} onChange={handleChange} placeholder="500" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade devided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                        )}
                                        {/* Desktop only — Min Time + Scalping in left column */}
                                        <div className="hidden md:block">
                                            <InputField label="Min. Time to book profit (No. of Seconds)" name="mcxMinTimeToBookProfit" value={formData.mcxMinTimeToBookProfit} onChange={handleChange} placeholder="120" hint="Example: 120, will hold the trade for 2 minutes before closing a trade in profit" />
                                            <SelectField
                                                label="Scalping Stop Loss"
                                                name="mcxScalpingStopLoss"
                                                value={formData.mcxScalpingStopLoss}
                                                onChange={handleChange}
                                                options={[
                                                    { value: 'Disabled', label: 'Disabled' },
                                                    { value: 'Enabled', label: 'Enabled' }
                                                ]}
                                                hint="If Disabled, Stop Loss or Booking Loss can be done after Min. time of profit booking."
                                            />
                                        </div>
                                    </div>

                                    {/* Column 2 */}
                                    <div className="space-y-4">
                                        <InputField label="Minimum lot size required per single trade of MCX" name="mcxMinLot" value={formData.mcxMinLot} onChange={handleChange} placeholder="0" />
                                        <InputField label="Maximum lot size allowed per script of MCX to be actively open at a time" name="mcxMaxLotScrip" value={formData.mcxMaxLotScrip} onChange={handleChange} placeholder="50" />
                                        <SelectField
                                            label="Mcx Brokerage Type"
                                            name="mcxBrokerageType"
                                            value={formData.mcxBrokerageType}
                                            onChange={handleChange}
                                            options={[
                                                { value: 'per_crore', label: 'Per Crore Basis' },
                                                { value: 'per_lot', label: 'Per Lot Basis' }
                                            ]}
                                        />
                                        <SelectField
                                            label="Exposure Mcx Type"
                                            name="mcxExposureType"
                                            value={formData.mcxExposureType}
                                            onChange={handleChange}
                                            options={[
                                                { value: 'per_turnover', label: 'Per Turnover Basis' },
                                                { value: 'per_lot', label: 'Per Lot Basis' }
                                            ]}
                                        />
                                        {formData.mcxExposureType !== 'per_lot' && (
                                            <InputField label="Holding Exposure/Margin MCX" name="mcxHoldingMargin" value={formData.mcxHoldingMargin} onChange={handleChange} placeholder="100" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade devided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                        )}
                                    </div>
                                </div>

                                {/* App View Layout - Separate layout with specific field ordering */}
                                <div className="md:hidden px-2 space-y-4">
                                    <InputField label="Minimum lot size required per single trade of MCX" name="mcxMinLot" value={formData.mcxMinLot} onChange={handleChange} placeholder="0" />
                                    <InputField label="Maximum lot size allowed per single trade of MCX" name="mcxMaxLot" value={formData.mcxMaxLot} onChange={handleChange} placeholder="20" />
                                    <InputField label="Maximum lot size allowed per script of MCX to be actively open at a time" name="mcxMaxLotScrip" value={formData.mcxMaxLotScrip} onChange={handleChange} placeholder="50" />
                                    <InputField label="Max Size All Commodity" name="mcxMaxSizeAll" value={formData.mcxMaxSizeAll} onChange={handleChange} placeholder="100" />

                                    <SelectField
                                        label="Mcx Brokerage Type"
                                        name="mcxBrokerageType"
                                        value={formData.mcxBrokerageType}
                                        onChange={handleChange}
                                        options={[
                                            { value: 'per_crore', label: 'Per Crore Basis' },
                                            { value: 'per_lot', label: 'Per Lot Basis' }
                                        ]}
                                    />
                                    <InputField label="MCX brokerage" name="mcxBrokerage" value={formData.mcxBrokerage} onChange={handleChange} placeholder="800" />

                                    <SelectField
                                        label="Exposure Mcx Type"
                                        name="mcxExposureType"
                                        value={formData.mcxExposureType}
                                        onChange={handleChange}
                                        options={[
                                            { value: 'per_turnover', label: 'Per Turnover Basis' },
                                            { value: 'per_lot', label: 'Per Lot Basis' }
                                        ]}
                                    />

                                    {formData.mcxExposureType !== 'per_lot' && (
                                        <>
                                            <InputField label="Intraday Exposure/Margin MCX" name="mcxIntradayMargin" value={formData.mcxIntradayMargin} onChange={handleChange} placeholder="500" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade devided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                            <InputField label="Holding Exposure/Margin MCX" name="mcxHoldingMargin" value={formData.mcxHoldingMargin} onChange={handleChange} placeholder="100" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade devided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                        </>
                                    )}

                                    <InputField label="Min. Time to book profit (No. of Seconds)" name="mcxMinTimeToBookProfit" value={formData.mcxMinTimeToBookProfit} onChange={handleChange} placeholder="120" hint="Example: 120, will hold the trade for 2 minutes before closing a trade in profit" />
                                    <SelectField
                                        label="Scalping Stop Loss"
                                        name="mcxScalpingStopLoss"
                                        value={formData.mcxScalpingStopLoss}
                                        onChange={handleChange}
                                        options={[
                                            { value: 'Disabled', label: 'Disabled' },
                                            { value: 'Enabled', label: 'Enabled' }
                                        ]}
                                        hint="If Disabled, Stop Loss or Booking Loss can be done after Min. time of profit booking."
                                    />
                                </div>

                                {/* MCX Lot Wise Exposure */}
                                {formData.mcxExposureType === 'per_lot' && (
                                    <div className="mt-8">
                                        <h4 className="text-sm font-normal mb-8 px-2 border-l-2 border-[#4caf50]" style={{ color: '#bcc0cf' }}>MCX Exposure Lot wise:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 px-2">
                                            {Object.keys(formData.mcxLotMargins).map((scrip) => (
                                                <React.Fragment key={scrip}>
                                                    <ScripField
                                                        label={`${scrip} INTRADAY`}
                                                        name={`mcx-intraday-${scrip}`}
                                                        value={formData.mcxLotMargins[scrip]?.INTRADAY ?? '0'}
                                                        onChange={(e) => handleNestedChange('mcxLotMargins', scrip, e.target.value, 'INTRADAY')}
                                                    />
                                                    <ScripField
                                                        label={`${scrip} HOLDING`}
                                                        name={`mcx-holding-${scrip}`}
                                                        value={formData.mcxLotMargins[scrip]?.HOLDING ?? '0'}
                                                        onChange={(e) => handleNestedChange('mcxLotMargins', scrip, e.target.value, 'HOLDING')}
                                                    />
                                                    <ScripField
                                                        label={`${scrip} MAX LOTS (Position Limit)`}
                                                        name={`mcx-lot-${scrip}`}
                                                        value={formData.mcxLotMargins[scrip]?.LOT ?? '1'}
                                                        onChange={(e) => handleNestedChange('mcxLotMargins', scrip, e.target.value, 'LOT')}
                                                    />
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* MCX Lot Wise Brokerage */}
                                {formData.mcxBrokerageType === 'per_lot' && (
                                    <div className="mt-8">
                                        <h4 className="text-slate-300 text-sm font-normal mb-8 px-2 border-l-2 border-[#4caf50]">MCX Lot Wise Brokerage:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 px-2">
                                            {Object.keys(formData.mcxLotBrokerage).map((scrip) => (
                                                <ScripField
                                                    key={scrip}
                                                    label={`${scrip}:`}
                                                    name={`mcx-brokerage-${scrip}`}
                                                    value={formData.mcxLotBrokerage[scrip] ?? '0'}
                                                    onChange={(e) => handleNestedChange('mcxLotBrokerage', scrip, e.target.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Bid Gaps */}
                                <div className="mt-8">
                                    <h4 className="text-sm font-normal mb-8 px-2 border-l-2 border-[#4caf50]" style={{ color: '#bcc0cf' }}>Orders to be away by points in each scrip MCX:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 px-2">
                                        {Object.keys(formData.bidGaps).map((commodity) => {
                                            return (
                                                <ScripField
                                                    key={commodity}
                                                    label={`${commodity.replace('MCX', '')}:`}
                                                    name={`bidgap-${commodity}`}
                                                    value={formData.bidGaps[commodity] ?? '0.00'}
                                                    onChange={(e) => handleNestedChange('bidGaps', commodity, e.target.value)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </fieldset>

                            <hr className="border-white/5" />

                            {/* EQUITY FUTURES */}
                            <fieldset className="border-none p-0 m-0">
                                <FieldLegend title="Equity Futures" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 px-2 mb-6">
                                    <div className="mb-2">
                                        <CheckboxField
                                            label="Equity Trading"
                                            name="equityTrading"
                                            checked={formData.equityTrading}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <CheckboxField
                                            label="Ban Equity Limit Order"
                                            name="banEquityLimitOrder"
                                            checked={formData.banEquityLimitOrder}
                                            onChange={handleChange}
                                            disabled={formData.banAllSegmentLimitOrder}
                                        />
                                    </div>
                                </div>

                                {/* Web View Layout - Reverted to Absolute Original */}
                                <div className="hidden md:grid md:grid-cols-2 gap-x-12 gap-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    {/* Column 1 — Left */}
                                    <div className="space-y-4">
                                        <InputField label="Equity Brokerage Per Crore" name="equityBrokerage" value={formData.equityBrokerage} onChange={handleChange} placeholder="800" />
                                        <InputField label="Minimum lot size required per single trade of Equity" name="equityMinLot" value={formData.equityMinLot} onChange={handleChange} placeholder="1" />
                                        <InputField label="Maximum lot size allowed per single trade of Equity" name="equityMaxLot" value={formData.equityMaxLot} onChange={handleChange} placeholder="100" />
                                        <InputField label="Minimum lot size required per single trade of Equity INDEX" name="equityMinIndexLot" value={formData.equityMinIndexLot} onChange={handleChange} placeholder="1" />
                                        <InputField label="Maximum lot size allowed per single trade of Equity INDEX" name="equityMaxIndexLot" value={formData.equityMaxIndexLot} onChange={handleChange} placeholder="100" />
                                        <InputField label="Max Size All Equity" name="equityMaxSizeAll" value={formData.equityMaxSizeAll} onChange={handleChange} placeholder="2000" />
                                        <InputField label="Intraday Exposure/Margin Equity" name="equityIntradayMargin" value={formData.equityIntradayMargin} onChange={handleChange} placeholder="500" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                    </div>
                                    {/* Column 2 — Right */}
                                    <div className="space-y-4">

                                        <InputField label="Maximum lot size allowed per script of Equity to be actively open at a time" name="equityMaxScrip" value={formData.equityMaxScrip} onChange={handleChange} placeholder="500" />
                                        <InputField label="Maximum lot size allowed per script of Equity INDEX to be actively open at a time" name="equityMaxIndexScrip" value={formData.equityMaxIndexScrip} onChange={handleChange} placeholder="500" />
                                        <InputField label="Max Size All Index" name="equityMaxSizeAllIndex" value={formData.equityMaxSizeAllIndex} onChange={handleChange} placeholder="2000" />
                                        <InputField label="Holding Exposure/Margin Equity" name="equityHoldingMargin" value={formData.equityHoldingMargin} onChange={handleChange} placeholder="100" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                        <InputField label="Orders to be away by % from current price Equity" name="equityOrdersAway" value={formData.equityOrdersAway} onChange={handleChange} placeholder="5" />
                                    </div>
                                </div>

                                {/* App View Layout - Separate layout with specific ordering */}
                                <div className="md:hidden space-y-4 px-2">
                                    <InputField label="Equity Brokerage Per Crore" name="equityBrokerage" value={formData.equityBrokerage} onChange={handleChange} placeholder="800" />
                                    <InputField label="Minimum lot size required per single trade of Equity" name="equityMinLot" value={formData.equityMinLot} onChange={handleChange} placeholder="1" />
                                    <InputField label="Maximum lot size allowed per single trade of Equity" name="equityMaxLot" value={formData.equityMaxLot} onChange={handleChange} placeholder="100" />
                                    <InputField label="Minimum lot size required per single trade of Equity INDEX" name="equityMinIndexLot" value={formData.equityMinIndexLot} onChange={handleChange} placeholder="1" />
                                    <InputField label="Maximum lot size allowed per single trade of Equity INDEX" name="equityMaxIndexLot" value={formData.equityMaxIndexLot} onChange={handleChange} placeholder="100" />



                                    <InputField label="Maximum lot size allowed per script of Equity to be actively open at a time" name="equityMaxScrip" value={formData.equityMaxScrip} onChange={handleChange} placeholder="500" />
                                    <InputField label="Maximum lot size allowed per script of Equity INDEX to be actively open at a time" name="equityMaxIndexScrip" value={formData.equityMaxIndexScrip} onChange={handleChange} placeholder="500" />

                                    <InputField label="Max Size All Equity" name="equityMaxSizeAll" value={formData.equityMaxSizeAll} onChange={handleChange} placeholder="2000" />
                                    <InputField label="Max Size All Index" name="equityMaxSizeAllIndex" value={formData.equityMaxSizeAllIndex} onChange={handleChange} placeholder="2000" />

                                    <InputField label="Intraday Exposure/Margin Equity" name="equityIntradayMargin" value={formData.equityIntradayMargin} onChange={handleChange} placeholder="500" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                    <InputField label="Holding Exposure/Margin Equity" name="equityHoldingMargin" value={formData.equityHoldingMargin} onChange={handleChange} placeholder="100" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />

                                    <InputField label="Orders to be away by % from current price Equity" name="equityOrdersAway" value={formData.equityOrdersAway} onChange={handleChange} placeholder="5" />

                                    <InputField label="Min. Time to book profit (No. of Seconds)" name="equityMinTimeToBookProfit" value={formData.equityMinTimeToBookProfit} onChange={handleChange} placeholder="120" hint="Example: 120, will hold the trade for 2 minutes before closing a trade in profit" />
                                    <SelectField
                                        label="Scalping Stop Loss"
                                        name="equityScalpingStopLoss"
                                        value={formData.equityScalpingStopLoss}
                                        onChange={handleChange}
                                        options={[
                                            { value: 'Disabled', label: 'Disabled' },
                                            { value: 'Enabled', label: 'Enabled' }
                                        ]}
                                        hint="If Disabled, Stop Loss or Booking Loss can be done after Min. time of profit booking."
                                    />
                                </div>

                                {/* Desktop Only Min Time + Scalping — mobile: stacked (Min Time upar), desktop: side by side */}
                                <div className="hidden md:grid md:grid-cols-2 gap-x-12 gap-y-4 px-2 mt-4">
                                    <InputField label="Min. Time to book profit (No. of Seconds)" name="equityMinTimeToBookProfit" value={formData.equityMinTimeToBookProfit} onChange={handleChange} placeholder="120" hint="Example: 120, will hold the trade for 2 minutes before closing a trade in profit" />
                                    <SelectField
                                        label="Scalping Stop Loss"
                                        name="equityScalpingStopLoss"
                                        value={formData.equityScalpingStopLoss}
                                        onChange={handleChange}
                                        options={[
                                            { value: 'Disabled', label: 'Disabled' },
                                            { value: 'Enabled', label: 'Enabled' }
                                        ]}
                                        hint="If Disabled, Stop Loss or Booking Loss can be done after Min. time of profit booking."
                                    />
                                </div>
                            </fieldset>

                            <hr className="border-white/5" />

                            {/* OPTIONS CONFIG */}
                            <fieldset className="border-none p-0 m-0">
                                <FieldLegend title="Option Config" />

                                {/* Checkboxes Row — 2x2 grid, always visible together on mobile */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 px-2 mb-6">
                                    <div className="mb-2">
                                        <CheckboxField
                                            label="Index Options Trading"
                                            name="indexOptionsTrading"
                                            checked={formData.indexOptionsTrading}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <CheckboxField
                                            label="Equity Options Trading"
                                            name="equityOptionsTrading"
                                            checked={formData.equityOptionsTrading}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <CheckboxField
                                            label="MCX Options Trading"
                                            name="mcxOptionsTrading"
                                            checked={formData.mcxOptionsTrading}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <CheckboxField
                                            label="Ban Option Limit Order"
                                            name="banOptionsLimitOrder"
                                            checked={formData.banOptionsLimitOrder}
                                            onChange={handleChange}
                                            disabled={formData.banAllSegmentLimitOrder}
                                        />
                                    </div>
                                </div>

                                {/* Web View Layout - Reverted to Absolute Original */}
                                <div className="hidden md:grid md:grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 px-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                    {/* Column 1 */}
                                    <div className="space-y-4">
                                        <InputField label="Options Index brokerage" name="optionsIndexBrokerage" value={formData.optionsIndexBrokerage} onChange={handleChange} placeholder="20" />
                                        <InputField label="Options Equity brokerage" name="optionsEquityBrokerage" value={formData.optionsEquityBrokerage} onChange={handleChange} placeholder="20" />
                                        <InputField label="Options MCX brokerage" name="optionsMcxBrokerage" value={formData.optionsMcxBrokerage} onChange={handleChange} placeholder="20" />
                                        <SelectField label="Options Index Short Selling Allowed (Sell First and Ban later)" name="optionsIndexShortSelling" value={formData.optionsIndexShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />
                                        <SelectField label="MCX Options Short Selling Allowed (Sell First and Ban later)" name="optionsMcxShortSelling" value={formData.optionsMcxShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />
                                        <InputField label="Maximum lot size allowed per single trade of Equity Options" name="optionsEquityMaxLot" value={formData.optionsEquityMaxLot} onChange={handleChange} placeholder="50" />
                                        <InputField label="Maximum lot size allowed per single trade of Equity INDEX Options" name="optionsIndexMaxLot" value={formData.optionsIndexMaxLot} onChange={handleChange} placeholder="20" />
                                        <InputField label="Maximum lot size allowed per single trade of MCX Options" name="optionsMcxMaxLot" value={formData.optionsMcxMaxLot} onChange={handleChange} placeholder="50" />
                                        <InputField label="Maximum lot size allowed per scrip of Equity INDEX Options to be actively open at a time" name="optionsIndexMaxScrip" value={formData.optionsIndexMaxScrip} onChange={handleChange} placeholder="200" />
                                        <InputField label="Max Size All Equity Options" name="optionsMaxEquitySizeAll" value={formData.optionsMaxEquitySizeAll} onChange={handleChange} placeholder="200" />
                                        <InputField label="Max Size All MCX Options" name="optionsMaxMcxSizeAll" value={formData.optionsMaxMcxSizeAll} onChange={handleChange} placeholder="200" />
                                        <InputField label="Holding Exposure/Margin Options Index" name="optionsIndexHolding" value={formData.optionsIndexHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                        <InputField label="Holding Exposure/Margin Options Equity" name="optionsEquityHolding" value={formData.optionsEquityHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                        <InputField label="Holding Exposure/Margin Options MCX" name="optionsMcxHolding" value={formData.optionsMcxHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                        {/* Desktop only */}
                                        <div className="hidden md:block">
                                            <InputField label="Min. Time to book profit (No. of Seconds)" name="optionsMinTimeToBookProfit" value={formData.optionsMinTimeToBookProfit} onChange={handleChange} placeholder="120" hint="Example: 120, will hold the trade for 2 minutes before closing a trade in profit" />
                                        </div>
                                    </div>

                                    {/* Column 2 */}
                                    <div className="space-y-4">
                                        <SelectField label="Options Index Brokerage Type" name="optionsIndexBrokerageType" value={formData.optionsIndexBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                                        <SelectField label="Options Equity Brokerage Type" name="optionsEquityBrokerageType" value={formData.optionsEquityBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                                        <SelectField label="Options MCX Brokerage Type" name="optionsMcxBrokerageType" value={formData.optionsMcxBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                                        <SelectField label="Options Equity Short Selling Allowed (Sell First and Ban later)" name="optionsEquityShortSelling" value={formData.optionsEquityShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />
                                        <InputField label="Options Min. Bid Price" name="optionsMinBidPrice" value={formData.optionsMinBidPrice} onChange={handleChange} placeholder="1" />
                                        <InputField label="Minimum lot size required per single trade of Equity Options" name="optionsEquityMinLot" value={formData.optionsEquityMinLot} onChange={handleChange} placeholder="0" />
                                        <InputField label="Minimum lot size required per single trade of Equity INDEX Options" name="optionsIndexMinLot" value={formData.optionsIndexMinLot} onChange={handleChange} placeholder="0" />
                                        <InputField label="Minimum lot size required per single trade of MCX Options" name="optionsMcxMinLot" value={formData.optionsMcxMinLot} onChange={handleChange} placeholder="0" />
                                        <InputField label="Maximum lot size allowed per scrip of Equity Options to be actively open at a time" name="optionsEquityMaxScrip" value={formData.optionsEquityMaxScrip} onChange={handleChange} placeholder="200" />
                                        <InputField label="Maximum lot size allowed per scrip of MCX Options to be actively open at a time" name="optionsMcxMaxScrip" value={formData.optionsMcxMaxScrip} onChange={handleChange} placeholder="200" />
                                        <InputField label="Max Size All Index Options" name="optionsMaxIndexSizeAll" value={formData.optionsMaxIndexSizeAll} onChange={handleChange} placeholder="200" />
                                        <InputField label="Intraday Exposure/Margin Options Index" name="optionsIndexIntraday" value={formData.optionsIndexIntraday} onChange={handleChange} placeholder="5" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                        <InputField label="Intraday Exposure/Margin Options Equity" name="optionsEquityIntraday" value={formData.optionsEquityIntraday} onChange={handleChange} placeholder="5" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                        <InputField label="Intraday Exposure/Margin Options MCX" name="optionsMcxIntraday" value={formData.optionsMcxIntraday} onChange={handleChange} placeholder="5" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                        <InputField label="Orders to be away by % from current price in Options" name="optionsOrdersAway" value={formData.optionsOrdersAway} onChange={handleChange} placeholder="0.00" />
                                        {/* Mobile only — Min Time after Orders to be away */}
                                        <div className="md:hidden">
                                            <InputField label="Min. Time to book profit (No. of Seconds)" name="optionsMinTimeToBookProfit" value={formData.optionsMinTimeToBookProfit} onChange={handleChange} placeholder="120" hint="Example: 120, will hold the trade for 2 minutes before closing a trade in profit" />
                                        </div>
                                        <SelectField
                                            label="Scalping Stop Loss"
                                            name="optionsScalpingStopLoss"
                                            value={formData.optionsScalpingStopLoss}
                                            onChange={handleChange}
                                            options={[
                                                { value: 'Disabled', label: 'Disabled' },
                                                { value: 'Enabled', label: 'Enabled' }
                                            ]}
                                            hint="If Disabled, Stop Loss or Booking Loss can be done after Min. time of profit booking."
                                        />
                                    </div>
                                </div>

                                {/* App View Layout - Separate layout with specific ordering */}
                                <div className="md:hidden space-y-4 px-2">
                                    <SelectField label="Options Index Brokerage Type" name="optionsIndexBrokerageType" value={formData.optionsIndexBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                                    <InputField label="Options Index brokerage" name="optionsIndexBrokerage" value={formData.optionsIndexBrokerage} onChange={handleChange} placeholder="20" />

                                    <SelectField label="Options Equity Brokerage Type" name="optionsEquityBrokerageType" value={formData.optionsEquityBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                                    <InputField label="Options Equity brokerage" name="optionsEquityBrokerage" value={formData.optionsEquityBrokerage} onChange={handleChange} placeholder="20" />

                                    <SelectField label="Options MCX Brokerage Type" name="optionsMcxBrokerageType" value={formData.optionsMcxBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                                    <InputField label="Options MCX brokerage" name="optionsMcxBrokerage" value={formData.optionsMcxBrokerage} onChange={handleChange} placeholder="20" />

                                    <InputField label="Options Min. Bid Price" name="optionsMinBidPrice" value={formData.optionsMinBidPrice} onChange={handleChange} placeholder="1" />

                                    <SelectField label="Options Index Short Selling Allowed (Sell First and Ban later)" name="optionsIndexShortSelling" value={formData.optionsIndexShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />
                                    <SelectField label="Options Equity Short Selling Allowed (Sell First and Ban later)" name="optionsEquityShortSelling" value={formData.optionsEquityShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />
                                    <SelectField label="MCX Options Short Selling Allowed (Sell First and Ban later)" name="optionsMcxShortSelling" value={formData.optionsMcxShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />

                                    <InputField label="Minimum lot size required per single trade of Equity Options" name="optionsEquityMinLot" value={formData.optionsEquityMinLot} onChange={handleChange} placeholder="0" />
                                    <InputField label="Maximum lot size allowed per single trade of Equity Options" name="optionsEquityMaxLot" value={formData.optionsEquityMaxLot} onChange={handleChange} placeholder="50" />

                                    <InputField label="Minimum lot size required per single trade of Equity INDEX Options" name="optionsIndexMinLot" value={formData.optionsIndexMinLot} onChange={handleChange} placeholder="0" />
                                    <InputField label="Maximum lot size allowed per single trade of Equity INDEX Options" name="optionsIndexMaxLot" value={formData.optionsIndexMaxLot} onChange={handleChange} placeholder="20" />

                                    <InputField label="Minimum lot size required per single trade of MCX Options" name="optionsMcxMinLot" value={formData.optionsMcxMinLot} onChange={handleChange} placeholder="0" />
                                    <InputField label="Maximum lot size allowed per single trade of MCX Options" name="optionsMcxMaxLot" value={formData.optionsMcxMaxLot} onChange={handleChange} placeholder="50" />

                                    <InputField label="Maximum lot size allowed per scrip of Equity Options to be actively open at a time" name="optionsEquityMaxScrip" value={formData.optionsEquityMaxScrip} onChange={handleChange} placeholder="200" />
                                    <InputField label="Maximum lot size allowed per scrip of Equity INDEX Options to be actively open at a time" name="optionsIndexMaxScrip" value={formData.optionsIndexMaxScrip} onChange={handleChange} placeholder="200" />
                                    <InputField label="Maximum lot size allowed per scrip of MCX Options to be actively open at a time" name="optionsMcxMaxScrip" value={formData.optionsMcxMaxScrip} onChange={handleChange} placeholder="200" />

                                    <InputField label="Max Size All Equity Options" name="optionsMaxEquitySizeAll" value={formData.optionsMaxEquitySizeAll} onChange={handleChange} placeholder="200" />
                                    <InputField label="Max Size All Index Options" name="optionsMaxIndexSizeAll" value={formData.optionsMaxIndexSizeAll} onChange={handleChange} placeholder="200" />
                                    <InputField label="Max Size All MCX Options" name="optionsMaxMcxSizeAll" value={formData.optionsMaxMcxSizeAll} onChange={handleChange} placeholder="200" />

                                    <InputField label="Intraday Exposure/Margin Options Index" name="optionsIndexIntraday" value={formData.optionsIndexIntraday} onChange={handleChange} placeholder="5" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                    <InputField label="Holding Exposure/Margin Options Index" name="optionsIndexHolding" value={formData.optionsIndexHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />

                                    <InputField label="Intraday Exposure/Margin Options Equity" name="optionsEquityIntraday" value={formData.optionsEquityIntraday} onChange={handleChange} placeholder="5" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                    <InputField label="Holding Exposure/Margin Options Equity" name="optionsEquityHolding" value={formData.optionsEquityHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />

                                    <InputField label="Intraday Exposure/Margin Options MCX" name="optionsMcxIntraday" value={formData.optionsMcxIntraday} onChange={handleChange} placeholder="5" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                    <InputField label="Holding Exposure/Margin Options MCX" name="optionsMcxHolding" value={formData.optionsMcxHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />

                                    <InputField label="Orders to be away by % from current price in Options" name="optionsOrdersAway" value={formData.optionsOrdersAway} onChange={handleChange} placeholder="0.00" />

                                    <InputField label="Min. Time to book profit (No. of Seconds)" name="optionsMinTimeToBookProfit" value={formData.optionsMinTimeToBookProfit} onChange={handleChange} placeholder="120" hint="Example: 120, will hold the trade for 2 minutes before closing a trade in profit" />
                                    <SelectField
                                        label="Scalping Stop Loss"
                                        name="optionsScalpingStopLoss"
                                        value={formData.optionsScalpingStopLoss}
                                        onChange={handleChange}
                                        options={[
                                            { value: 'Disabled', label: 'Disabled' },
                                            { value: 'Enabled', label: 'Enabled' }
                                        ]}
                                        hint="If Disabled, Stop Loss or Booking Loss can be done after Min. time of profit booking."
                                    />
                                </div>
                            </fieldset>




                            <hr className="border-white/5" />

                            {/* OPTIONS SHORT SELLING CONFIG */}
                            {(formData.optionsIndexShortSelling === 'Yes' || formData.optionsEquityShortSelling === 'Yes' || formData.optionsMcxShortSelling === 'Yes') && (
                                <fieldset className="border-none p-0 m-0 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center gap-3 mb-8 px-2">
                                        <h3 className="text-[13px] sm:text-[20px] font-black text-white uppercase tracking-tight leading-snug">Options Shortselling Config:</h3>
                                    </div>

                                    {/* INDEX SHORT SELLING CONFIG */}
                                    {formData.optionsIndexShortSelling === 'Yes' && (
                                        <div className="bg-[#1a2035]/50 rounded-xl p-3 sm:p-6 border border-white/5 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <h4 className="text-[12px] sm:text-[16px] font-bold text-white uppercase tracking-wider mb-6">Index Options Shortselling:</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 px-2">
                                                <SelectField label="Options Index Shortselling Brokerage Type" name="optionsIndexShortSellingBrokerageType" value={formData.optionsIndexShortSellingBrokerageType} onChange={handleChange} options={[{ value: 'per_crore', label: 'Per Crore Basis' }, { value: 'per_lot', label: 'Per Lot Basis' }]} />
                                                <InputField label="Options Index Shortselling brokerage" name="optionsIndexShortSellingBrokerage" value={formData.optionsIndexShortSellingBrokerage} onChange={handleChange} placeholder="20" />
                                                <InputField label="Minimum lot size required per single trade of Equity INDEX Options Shortselling" name="optionsIndexShortSellingMinLot" value={formData.optionsIndexShortSellingMinLot} onChange={handleChange} placeholder="0" />
                                                <InputField label="Maximum lot size allowed per single trade of Equity INDEX Options Shortselling" name="optionsIndexShortSellingMaxLot" value={formData.optionsIndexShortSellingMaxLot} onChange={handleChange} placeholder="20" />
                                                <InputField label="Maximum lot size allowed per scrip of Equity INDEX Options Shortselling to be actively open at a time" name="optionsIndexShortSellingMaxScrip" value={formData.optionsIndexShortSellingMaxScrip} onChange={handleChange} placeholder="200" />
                                                <InputField label="Max Size All Index Options Shortselling" name="optionsIndexShortSellingMaxSizeAll" value={formData.optionsIndexShortSellingMaxSizeAll} onChange={handleChange} placeholder="200" />
                                                <InputField label="Intraday Exposure/Margin Options Index Shortselling" name="optionsIndexShortSellingIntraday" value={formData.optionsIndexShortSellingIntraday} onChange={handleChange} placeholder="5" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                                <InputField label="Holding Exposure/Margin Options Index Shortselling" name="optionsIndexShortSellingHolding" value={formData.optionsIndexShortSellingHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                            </div>
                                        </div>
                                    )}

                                    {/* EQUITY SHORT SELLING CONFIG */}
                                    {formData.optionsEquityShortSelling === 'Yes' && (
                                        <div className="bg-[#1a2035]/50 rounded-xl p-3 sm:p-6 border border-white/5 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <h4 className="text-[12px] sm:text-[16px] font-bold text-white uppercase tracking-wider mb-6">Equity Options Shortselling:</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 px-2">
                                                <SelectField label="Options Equity Shortselling Brokerage Type" name="optionsEquityShortSellingBrokerageType" value={formData.optionsEquityShortSellingBrokerageType} onChange={handleChange} options={[{ value: 'per_crore', label: 'Per Crore Basis' }, { value: 'per_lot', label: 'Per Lot Basis' }]} />
                                                <InputField label="Options Equity Shortselling brokerage" name="optionsEquityShortSellingBrokerage" value={formData.optionsEquityShortSellingBrokerage} onChange={handleChange} placeholder="20" />
                                                <InputField label="Minimum lot size required per single trade of Equity Options Shortselling" name="optionsEquityShortSellingMinLot" value={formData.optionsEquityShortSellingMinLot} onChange={handleChange} placeholder="0" />
                                                <InputField label="Maximum lot size allowed per single trade of Equity Options Shortselling" name="optionsEquityShortSellingMaxLot" value={formData.optionsEquityShortSellingMaxLot} onChange={handleChange} placeholder="50" />
                                                <InputField label="Maximum lot size allowed per scrip of Equity Options Shortselling to be actively open at a time" name="optionsEquityShortSellingMaxScrip" value={formData.optionsEquityShortSellingMaxScrip} onChange={handleChange} placeholder="200" />
                                                <InputField label="Max Size All Equity Options Shortselling" name="optionsEquityShortSellingMaxSizeAll" value={formData.optionsEquityShortSellingMaxSizeAll} onChange={handleChange} placeholder="200" />
                                                <InputField label="Intraday Exposure/Margin Options Equity Shortselling" name="optionsEquityShortSellingIntraday" value={formData.optionsEquityShortSellingIntraday} onChange={handleChange} placeholder="5" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                                <InputField label="Holding Exposure/Margin Options Equity Shortselling" name="optionsEquityShortSellingHolding" value={formData.optionsEquityShortSellingHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                            </div>
                                        </div>
                                    )}

                                    {/* MCX SHORT SELLING CONFIG */}
                                    {formData.optionsMcxShortSelling === 'Yes' && (
                                        <div className="bg-[#1a2035]/50 rounded-xl p-3 sm:p-6 border border-white/5 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <h4 className="text-[12px] sm:text-[16px] font-bold text-white uppercase tracking-wider mb-6">MCX Options Shortselling:</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 px-2">
                                                <SelectField label="Options MCX Shortselling Brokerage Type" name="optionsMcxShortSellingBrokerageType" value={formData.optionsMcxShortSellingBrokerageType} onChange={handleChange} options={[{ value: 'per_crore', label: 'Per Crore Basis' }, { value: 'per_lot', label: 'Per Lot Basis' }]} />
                                                <InputField label="Options MCX Shortselling brokerage" name="optionsMcxShortSellingBrokerage" value={formData.optionsMcxShortSellingBrokerage} onChange={handleChange} placeholder="20" />
                                                <InputField label="Minimum lot size required per single trade of MCX Options Shortselling" name="optionsMcxShortSellingMinLot" value={formData.optionsMcxShortSellingMinLot} onChange={handleChange} placeholder="0" />
                                                <InputField label="Maximum lot size allowed per single trade of MCX Options Shortselling" name="optionsMcxShortSellingMaxLot" value={formData.optionsMcxShortSellingMaxLot} onChange={handleChange} placeholder="50" />
                                                <InputField label="Maximum lot size allowed per scrip of MCX Options Shortselling to be actively open at a time" name="optionsMcxShortSellingMaxScrip" value={formData.optionsMcxShortSellingMaxScrip} onChange={handleChange} placeholder="200" />
                                                <InputField label="Max Size All MCX Options Shortselling" name="optionsMcxShortSellingMaxSizeAll" value={formData.optionsMcxShortSellingMaxSizeAll} onChange={handleChange} placeholder="200" />
                                                <InputField label="Intraday Exposure/Margin Options MCX Shortselling" name="optionsMcxShortSellingIntraday" value={formData.optionsMcxShortSellingIntraday} onChange={handleChange} placeholder="5" hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                                                <InputField label="Holding Exposure/Margin Options MCX Shortselling" name="optionsMcxShortSellingHolding" value={formData.optionsMcxShortSellingHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. e.g. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                            </div>
                                        </div>
                                    )}
                                </fieldset>
                            )}

                            {/* INTERNATIONAL SEGMENTS */}
                            <fieldset className="border-none p-0 m-0">
                                <div className="flex items-center gap-3 mb-8 px-2">
                                    <h3 className="text-[13px] sm:text-[20px] font-black text-white uppercase tracking-tight leading-snug">International Segments (Comex, Forex, Crypto):</h3>
                                </div>

                                <div className="space-y-4 px-1 sm:px-2">
                                    {/* COMEX */}
                                    <div className="bg-[#1a2035]/50 rounded-xl p-3 sm:p-6 border border-white/5 overflow-hidden transition-all duration-500">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                                            <div className="min-w-0">
                                                <h4 className="text-[13px] sm:text-[16px] font-black text-cyan-400 uppercase tracking-wider border-l-2 border-cyan-400 pl-2 sm:pl-3 leading-tight">Comex Commodities</h4>
                                                <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 pl-2 sm:pl-3">Global Commodity Exchange Settings</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-[#202940] px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/5 w-fit shrink-0">
                                                <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase">Status</span>
                                                <input
                                                    type="checkbox"
                                                    name="comexTrading"
                                                    checked={segments.comex}
                                                    onChange={(e) => handleSegmentToggle('comex', e.target.checked)}
                                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded accent-[#4caf50] cursor-pointer"
                                                />
                                                <span className={`text-[10px] sm:text-[11px] font-black uppercase ${segments.comex ? 'text-green-400' : 'text-slate-500'}`}>{segments.comex ? 'ENABLED' : 'DISABLED'}</span>
                                            </div>
                                        </div>

                                        {segments.comex && (
                                            <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <ComexForm
                                                    config={formData.comexConfig}
                                                    onChange={(field, val) => handleSegmentConfigChange('comex', field, val)}
                                                    globalBanAll={formData.banAllSegmentLimitOrder}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* FOREX */}
                                    <div className="bg-[#1a2035]/50 rounded-xl p-3 sm:p-6 border border-white/5 overflow-hidden transition-all duration-500">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                                            <div className="min-w-0">
                                                <h4 className="text-[13px] sm:text-[16px] font-black text-green-400 uppercase tracking-wider border-l-2 border-green-400 pl-2 sm:pl-3 leading-tight">Forex / Currency</h4>
                                                <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 pl-2 sm:pl-3">Universal Currency Trading Parameters</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-[#202940] px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/5 w-fit shrink-0">
                                                <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase">Status</span>
                                                <input
                                                    type="checkbox"
                                                    name="forexTrading"
                                                    checked={segments.forex}
                                                    onChange={(e) => handleSegmentToggle('forex', e.target.checked)}
                                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded accent-[#4caf50] cursor-pointer"
                                                />
                                                <span className={`text-[10px] sm:text-[11px] font-black uppercase ${segments.forex ? 'text-green-400' : 'text-slate-500'}`}>{segments.forex ? 'ENABLED' : 'DISABLED'}</span>
                                            </div>
                                        </div>

                                        {segments.forex && (
                                            <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <ForexForm
                                                    config={formData.forexConfig}
                                                    onChange={(field, val) => handleSegmentConfigChange('forex', field, val)}
                                                    globalBanAll={formData.banAllSegmentLimitOrder}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* CRYPTO */}
                                    <div className="bg-[#1a2035]/50 rounded-xl p-3 sm:p-6 border border-white/5 overflow-hidden transition-all duration-500">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                                            <div className="min-w-0">
                                                <h4 className="text-[13px] sm:text-[16px] font-black text-orange-400 uppercase tracking-wider border-l-2 border-orange-400 pl-2 sm:pl-3 leading-tight">Crypto (Bitcoin/ETH)</h4>
                                                <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 pl-2 sm:pl-3">Cryptocurrency Asset Execution Hub</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-[#202940] px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/5 w-fit shrink-0">
                                                <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase">Status</span>
                                                <input
                                                    type="checkbox"
                                                    name="cryptoTrading"
                                                    checked={segments.crypto}
                                                    onChange={(e) => handleSegmentToggle('crypto', e.target.checked)}
                                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded accent-[#4caf50] cursor-pointer"
                                                />
                                                <span className={`text-[10px] sm:text-[11px] font-black uppercase ${segments.crypto ? 'text-green-400' : 'text-slate-500'}`}>{segments.crypto ? 'ENABLED' : 'DISABLED'}</span>
                                            </div>
                                        </div>

                                        {segments.crypto && (
                                            <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <CryptoForm
                                                    config={formData.cryptoConfig}
                                                    onChange={(field, val) => handleSegmentConfigChange('crypto', field, val)}
                                                    globalBanAll={formData.banAllSegmentLimitOrder}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </fieldset>

                            <hr className="border-white/5" />

                            {/* KYC / DOCUMENT VERIFICATION */}
                            <fieldset className="border-none p-0 m-0 w-full">
                                <div className="flex items-start sm:items-center gap-3 mb-8 px-2">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div className="flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <div>
                                            <h3 className="text-base sm:text-[20px] font-black text-white uppercase tracking-tight">Kyc / Document Verification <span className="text-red-500 text-xs sm:text-sm ml-2">* Mandatory</span></h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Official Identity & Compliance Documents</p>
                                        </div>
                                        <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-1 rounded-full w-fit">
                                            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">STATUS: {formData.kycStatus}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2 w-full">
                                    {[
                                        { key: 'panCard', label: 'PAN Card', id: 'doc-pan' },
                                        { key: 'aadhaarFront', label: 'Aadhaar Front', id: 'doc-aadhaar-f' },
                                        { key: 'aadhaarBack', label: 'Aadhaar Back', id: 'doc-aadhaar-b' },
                                        { key: 'bankStatement', label: 'Bank Proof / Cheque', id: 'doc-bank' }
                                    ].map(doc => {
                                        const file = formData.documents[doc.key];
                                        const hasFile = file instanceof File;
                                        const isPdf = hasFile && file.type === 'application/pdf';
                                        return (
                                            <div key={doc.key} className="space-y-3 w-full">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{doc.label}</label>
                                                <div className="relative group cursor-pointer w-full">
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        id={doc.id}
                                                        accept="image/*,.pdf"
                                                        onChange={(e) => handleNestedChange('documents', doc.key, e.target.files[0])}
                                                    />
                                                    <label htmlFor={doc.id} className="w-full flex flex-col items-center justify-center h-48 rounded-2xl bg-black/40 border-2 border-dashed border-white/10 hover:border-green-500/50 hover:bg-black/60 transition-all group overflow-hidden cursor-pointer">
                                                        {hasFile ? (
                                                            <div className="w-full h-full relative flex flex-col items-center justify-center gap-2">
                                                                {isPdf ? (
                                                                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-red-900/20 rounded-2xl">
                                                                        <FileText className="w-16 h-16 text-red-400 opacity-50" />
                                                                    </div>
                                                                ) : file.type?.startsWith('image/') ? (
                                                                    <img src={URL.createObjectURL(file)} alt={doc.label} className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-70" />
                                                                ) : null}
                                                                <div className="relative z-10 flex flex-col items-center gap-2">
                                                                    <div className="w-10 h-10 rounded-full bg-green-500/30 backdrop-blur flex items-center justify-center">
                                                                        <Check className="w-5 h-5 text-green-400" />
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-green-300 bg-black/60 px-2 py-1 rounded max-w-[120px] truncate">{file.name}</span>
                                                                    <span className="text-[8px] text-slate-400">Click to change</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <FileUp className="w-10 h-10 text-slate-600 group-hover:text-green-500 transition-colors mb-4" />
                                                                <span className="text-[11px] font-black text-slate-500 group-hover:text-green-500 uppercase tracking-[0.2em]">Select Document</span>
                                                            </>
                                                        )}
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-12 space-y-8 bg-black/20 p-8 rounded-2xl border border-white/5">
                                    {/* Row 1: Notes & Broker */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                        <div className="group">
                                            <label className="block text-sm mb-1 font-light" style={{ color: '#bcc0cf' }}>Notes</label>
                                            <input
                                                type="text"
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleChange}
                                                className="w-full bg-transparent border-b border-white/10 py-1 text-white focus:outline-none focus:border-[#4caf50] transition-colors text-sm"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-sm mb-1 font-light" style={{ color: '#bcc0cf' }}>
                                                Assign to Broker <span style={{ color: '#ff6b6b' }}>*</span>
                                            </label>
                                            <select
                                                name="broker"
                                                value={formData.broker}
                                                onChange={handleChange}
                                                className="w-full bg-white border border-slate-200 py-2.5 px-3 text-black font-bold outline-none rounded-sm text-sm"
                                            >
                                                <option value="">-- Select Broker --</option>
                                                {brokers.map(b => (
                                                    <option key={b.id} value={`${b.id} : ${b.username}`}>
                                                        {b.id} : {b.username} ({b.full_name || b.fullName || ''})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Row 2: Transaction Password */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 items-end">
                                        <div className="group">
                                            <label className="block text-sm mb-1 font-light" style={{ color: '#bcc0cf' }}>
                                                Transaction Password <span style={{ color: '#ff6b6b' }}>*</span>
                                            </label>
                                            <input
                                                type="password"
                                                name="transactionPassword"
                                                value={formData.transactionPassword}
                                                onChange={handleChange}
                                                placeholder="Enter password (will be verified)"
                                                className="w-full bg-transparent border-b border-white/10 py-1 text-white focus:outline-none focus:border-[#4caf50] transition-colors text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <div className="pt-4 flex items-center gap-4 flex-wrap">
                                        {saveError && (
                                            <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 rounded px-4 py-2 text-sm mb-2">
                                                {saveError}
                                            </div>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`px-10 py-2.5 text-white rounded font-bold text-sm uppercase transition-all shadow-md active:scale-95 ${loading ? 'bg-slate-600 cursor-not-allowed opacity-60' : 'bg-[#5cb85c] hover:bg-[#43a047]'}`}
                                        >
                                            {loading ? 'SAVING...' : 'SAVE CLIENT'}
                                        </button>
                                        {!isKycValid() && (
                                            <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-wider bg-red-500/5 px-4 py-2 rounded border border-red-500/10">
                                                <Info className="w-3.5 h-3.5" />
                                                PAN, Aadhaar & Bank Proof Required
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
};

export default CreateClientPage;
