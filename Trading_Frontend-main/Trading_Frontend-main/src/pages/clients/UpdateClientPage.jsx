import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { X, Save, ArrowLeft, Info, Check, ChevronDown, Settings, User, Lock, Key, FileUp, ShieldCheck, Eye, FileText, Globe } from 'lucide-react';
import * as api from '../../services/api';
import EditMCXFutureSection from './EditMCXFutureSection';
import ComexForm from './ComexForm';
import ForexForm from './ForexForm';
import CryptoForm from './CryptoForm';

const InputField = ({ label, name, value, onChange, type = "text", placeholder, hint, hintColor, className = "", disabled }) => (
    <div className={`mb-6 group px-2 ${className} ${disabled ? 'opacity-50' : ''}`}>
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
            disabled={disabled}
            className={`w-full bg-transparent border-b border-white/20 py-1 text-white focus:outline-none focus:border-[#4caf50] transition-colors text-[16px] ${disabled ? 'cursor-not-allowed' : ''}`}
        />
        {hint && <p className="text-[14px] mt-2 font-semibold leading-normal" style={{ color: hintColor || '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>{hint}</p>}
    </div>
);

const SelectField = ({ label, name, options, value, onChange, hint, className = "", disabled }) => (
    <div className={`mb-6 group px-2 ${className} ${disabled ? 'opacity-50' : ''}`}>
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
                disabled={disabled}
                className={`w-full bg-white border border-slate-200 py-2.5 px-4 text-black font-extrabold outline-none rounded shadow-sm appearance-none focus:ring-2 focus:ring-[#4caf50]/20 transition-all text-sm uppercase tracking-wider cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}
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

const FieldLegend = ({ title, rightControl }) => (
    <div className="inline-flex items-center gap-4 text-lg font-bold mb-8 bg-[#1a2035]/50 px-4 py-2 rounded tracking-wider" style={{ color: '#bcc0cf' }}>
        <span>{title}:</span>
        {rightControl && <div>{rightControl}</div>}
    </div>
);

const ScripField = ({ label, value, onChange, name, className = "" }) => (
    <div className={`mb-8 ${className}`}>
        <label className="text-[12px] uppercase font-bold tracking-tight block mb-2 text-[#bcc0cf]">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            className="w-full bg-transparent border-b border-white/10 py-1.5 text-white focus:outline-none focus:border-white/30 transition-colors text-[16px] font-normal"
        />
    </div>
);

const UpdateClientPage = ({ client, onClose, onSave, onLogout, onNavigate }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [saveError, setSaveError] = useState('');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [brokers, setBrokers] = useState([]);
    const [brokerMcxMargins, setBrokerMcxMargins] = useState(null); // Broker's MCX lot wise margins
    const [brokerMcxBrokerage, setBrokerMcxBrokerage] = useState(null); // Broker's MCX lot wise brokerage
    const [existingDocs, setExistingDocs] = useState({});
    const [effectiveClient, setEffectiveClient] = useState(client);
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

    const location = useLocation();
    const { id: clientIdFromUrl } = useParams();

    // Determine which client ID to use (from prop or from URL)
    useEffect(() => {
        if (client?.id) {
            setEffectiveClient(client);
        } else if (clientIdFromUrl) {
            // Load client from ID in URL if not provided as prop
            console.log('[UpdateClientPage] No client prop, loading from URL ID:', clientIdFromUrl);
            setEffectiveClient({ id: parseInt(clientIdFromUrl) });
        }
    }, [client, clientIdFromUrl]);

    // DEBUG: Log component mount and client prop
    useEffect(() => {
        console.log('[UpdateClientPage] Component mounted, client:', client?.id ? { id: client.id, username: client.username } : 'UNDEFINED', 'URL ID:', clientIdFromUrl);
    }, []);

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

    // Pre-fill broker from URL state (when coming from ViewBrokerPage)
    useEffect(() => {
        if (location.state?.preselectedBrokerId && brokers.length > 0) {
            const selectedBroker = brokers.find(b => b.id === parseInt(location.state.preselectedBrokerId));
            if (selectedBroker) {
                setFormData(prev => ({
                    ...prev,
                    parentId: String(selectedBroker.id)
                }));
            }
        }
    }, [location.state?.preselectedBrokerId, brokers]);

    // Ensure broker_id is loaded from profile after profile data loads
    useEffect(() => {
        if (effectiveClient?.id && !loadingProfile && formData.parentId === '') {
            // Profile loaded but parentId still empty - try to fetch fresh
            const loadBrokerId = async () => {
                try {
                    const profileData = await api.getClientById(effectiveClient.id);
                    if (profileData?.settings?.broker_id) {
                        setFormData(prev => ({
                            ...prev,
                            parentId: String(profileData.settings.broker_id)
                        }));
                    }
                } catch (err) {
                    console.error('Failed to load broker_id:', err);
                }
            };
            loadBrokerId();
        }
    }, [effectiveClient?.id, loadingProfile]);

    const [formData, setFormData] = useState({
        // 1. Personal Details
        fullName: client?.full_name || client?.fullName || '',
        mobile: client?.mobile || '',
        username: client?.username || '',
        password: '',
        city: client?.city || '',

        // 2. Config
        isDemoAccount: client?.is_demo === 1 || client?.demoAccount === 'Yes' || false,
        allowFreshEntry: client?.allowFreshEntry || false,
        allowOrdersBetweenHL: client?.allowOrdersBetweenHL !== undefined ? client.allowOrdersBetweenHL : true,
        tradeEquityUnits: client?.tradeEquityUnits || false,
        accountStatus: client?.status !== 'Inactive' ? true : false,
        autoCloseTrades: client?.autoCloseTrades || false,
        autoClosePercentage: client?.autoClosePercentage || '90',
        notifyPercentage: client?.notifyPercentage || '70',
        banAllSegmentLimitOrder: client?.banAllSegmentLimitOrder || false,

        // 3. MCX Futures
        mcxTrading: client?.mcxTrading !== undefined ? client.mcxTrading : true,
        banMcxLimitOrder: client?.banMcxLimitOrder || false,
        mcxMinTimeToBookProfit: client?.mcxMinTimeToBookProfit ?? '0',
        mcxScalpingStopLoss: client?.mcxScalpingStopLoss || 'Disabled',
        mcxMinLot: client?.mcxMinLot || '1',
        mcxMaxLot: client?.mcxMaxLot || '100',
        mcxMaxLotScrip: client?.mcxMaxLotScrip || '1000',
        mcxMaxSizeAll: client?.mcxMaxSizeAll || '5000',
        mcxBrokerageType: client?.mcxBrokerageType || 'per_crore',
        mcxBrokerage: client?.mcxBrokerage || '800',
        mcxExposureType: client?.mcxExposureType || 'per_turnover',
        mcxIntradayMargin: client?.mcxIntradayMargin || '500',
        mcxHoldingMargin: client?.mcxHoldingMargin || '100',
        mcxLotMargins: client?.mcxLotMargins || {
            BULLDEX: { INTRADAY: '10000', HOLDING: '10000', LOT: '1' },
            GOLD: { INTRADAY: '10000', HOLDING: '10000', LOT: '1' },
            SILVER: { INTRADAY: '15000', HOLDING: '40000', LOT: '1' },
            CRUDEOIL: { INTRADAY: '10000', HOLDING: '10000', LOT: '1' },
            'CRUDEOIL MINI': { INTRADAY: '10000', HOLDING: '10000', LOT: '1' },
            COPPER: { INTRADAY: '10000', HOLDING: '10000', LOT: '1' },
            NICKEL: { INTRADAY: '10000', HOLDING: '10000', LOT: '1' },
            ZINC: { INTRADAY: '10000', HOLDING: '10000', LOT: '1' },
            ZINCMINI: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            LEAD: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            LEADMINI: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            ALUMINIUM: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            ALUMINI: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            NATURALGAS: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            'NATURALGAS MINI': { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            MENTHAOIL: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            COTTON: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            GOLDM: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            SILVERM: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            'SILVER MIC': { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            MGOLD: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            MCRUDEOIL: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            MSILVER: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            MNATURALGAS: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            MCOPPER: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            MLEAD: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            MZINC: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' },
            MALUMINIUM: { INTRADAY: '1000', HOLDING: '1000', LOT: '1' }
        },
        mcxLotBrokerage: client?.mcxLotBrokerage || {
            GOLDM: '100.0000', SILVERM: '100.0000', BULLDEX: '500.0000', GOLD: '200.0000', SILVER: '150.0000',
            CRUDEOIL: '100.0000', COPPER: '100.0000', NICKEL: '100.0000', ZINC: '100.0000', LEAD: '100.0000',
            NATURALGAS: '100.0000', 'NATURALGAS MINI': '100.0000', ALUMINIUM: '100.0000', MENTHAOIL: '100.0000',
            COTTON: '100.0000', 'SILVER MIC': '100.0000', ZINCMINI: '100.0000', ALUMINI: '100.0000',
            LEADMINI: '100.0000', 'CRUDEOIL MINI': '110.0000',
            MGOLD: '100.0000', MCRUDEOIL: '100.0000', MSILVER: '100.0000', MNATURALGAS: '100.0000',
            MCOPPER: '100.0000', MLEAD: '100.0000', MZINC: '100.0000', MALUMINIUM: '100.0000'
        },
        bidGaps: client?.bidGaps || {
            GOLDM: '0.0000', SILVERM: '0.0000', BULLDEX: '0.0000', GOLD: '0.0000', SILVER: '0.0000',
            CRUDEOIL: '0.0000', COPPER: '0.0000', NICKEL: '0.0000', ZINC: '0.0000', LEAD: '0.0000',
            NATURALGAS: '0.0000', 'NATURALGAS MINI': '0.0000', ALUMINIUM: '0.0000', MENTHAOIL: '0.0000',
            COTTON: '0.0000', 'SILVER MIC': '0.0000', ZINCMINI: '0.0000', ALUMINI: '0.0000',
            LEADMINI: '0.0000', 'CRUDEOIL MINI': '0.0000',
            MGOLD: '0.0000', MCRUDEOIL: '0.0000', MSILVER: '0.0000', MNATURALGAS: '0.0000',
            MCOPPER: '0.0000', MLEAD: '0.0000', MZINC: '0.0000', MALUMINIUM: '0.0000'
        },

        // 4. Equity Futures
        equityTrading: client?.equityTrading !== undefined ? client.equityTrading : true,
        banEquityLimitOrder: client?.banEquityLimitOrder || false,
        equityMinTimeToBookProfit: client?.equityMinTimeToBookProfit ?? '0',
        equityScalpingStopLoss: client?.equityScalpingStopLoss || 'Disabled',
        equityBrokerage: client?.equityBrokerage || '800',
        equityMinLot: client?.equityMinLot || '1',
        equityMaxLot: client?.equityMaxLot || '100',
        equityMinIndexLot: client?.equityMinIndexLot || '1',
        equityMaxIndexLot: client?.equityMaxIndexLot || '100',
        equityMaxScrip: client?.equityMaxScrip || '500',
        equityMaxIndexScrip: client?.equityMaxIndexScrip || '500',
        equityMaxSizeAll: client?.equityMaxSizeAll || '2000',
        equityMaxSizeAllIndex: client?.equityMaxSizeAllIndex || '2000',
        equityIntradayMargin: client?.equityIntradayMargin || '500',
        equityHoldingMargin: client?.equityHoldingMargin || '100',
        equityOrdersAway: client?.equityOrdersAway || '5',


        // 5. Options Config
        indexOptionsTrading: client?.indexOptionsTrading !== undefined ? client.indexOptionsTrading : true,
        equityOptionsTrading: client?.equityOptionsTrading !== undefined ? client.equityOptionsTrading : true,
        mcxOptionsTrading: client?.mcxOptionsTrading || false,
        banOptionsLimitOrder: client?.banOptionsLimitOrder || false,
        optionsMinTimeToBookProfit: client?.optionsMinTimeToBookProfit ?? '0',
        optionsScalpingStopLoss: client?.optionsScalpingStopLoss || 'Disabled',
        optionsIndexBrokerageType: client?.optionsIndexBrokerageType || 'per_lot',
        optionsIndexBrokerage: client?.optionsIndexBrokerage || '20.00',
        optionsEquityBrokerageType: client?.optionsEquityBrokerageType || 'per_lot',
        optionsEquityBrokerage: client?.optionsEquityBrokerage || '20.00',
        optionsMcxBrokerageType: client?.optionsMcxBrokerageType || 'per_lot',
        optionsMcxBrokerage: client?.optionsMcxBrokerage || '20.00',
        optionsMinBidPrice: client?.optionsMinBidPrice || '1.00',
        optionsIndexShortSelling: client?.optionsIndexShortSelling || 'No',
        optionsEquityShortSelling: client?.optionsEquityShortSelling || 'No',
        optionsMcxShortSelling: client?.optionsMcxShortSelling || 'No',
        optionsEquityMinLot: client?.optionsEquityMinLot || '0',
        optionsEquityMaxLot: client?.optionsEquityMaxLot || '50',
        optionsIndexMinLot: client?.optionsIndexMinLot || '0',
        optionsIndexMaxLot: client?.optionsIndexMaxLot || '20',
        optionsMcxMinLot: client?.optionsMcxMinLot || '0',
        optionsMcxMaxLot: client?.optionsMcxMaxLot || '50',
        optionsEquityMaxScrip: client?.optionsEquityMaxScrip || '200',
        optionsIndexMaxScrip: client?.optionsIndexMaxScrip || '200',
        optionsMcxMaxScrip: client?.optionsMcxMaxScrip || '200',
        optionsMaxEquitySizeAll: client?.optionsMaxEquitySizeAll || '200',
        optionsMaxIndexSizeAll: client?.optionsMaxIndexSizeAll || '200',
        optionsMaxMcxSizeAll: client?.optionsMaxMcxSizeAll || '200',
        optionsIndexIntraday: client?.optionsIndexIntraday || '5',
        optionsIndexHolding: client?.optionsIndexHolding || '2.00',
        optionsEquityIntraday: client?.optionsEquityIntraday || '5',
        optionsEquityHolding: client?.optionsEquityHolding || '2',
        optionsMcxIntraday: client?.optionsMcxIntraday || '5',
        optionsMcxHolding: client?.optionsMcxHolding || '2',
        optionsOrdersAway: client?.optionsOrdersAway || '0.00',

        // Options Short Selling Config
        optionsIndexShortSellingBrokerageType: client?.optionsIndexShortSellingBrokerageType || 'per_crore',
        optionsIndexShortSellingBrokerage: client?.optionsIndexShortSellingBrokerage || '20',
        optionsEquityShortSellingBrokerageType: client?.optionsEquityShortSellingBrokerageType || 'per_lot',
        optionsEquityShortSellingBrokerage: client?.optionsEquityShortSellingBrokerage || '20',
        optionsMcxShortSellingBrokerageType: client?.optionsMcxShortSellingBrokerageType || 'per_lot',
        optionsMcxShortSellingBrokerage: client?.optionsMcxShortSellingBrokerage || '20',
        optionsEquityShortSellingMinLot: client?.optionsEquityShortSellingMinLot || '0',
        optionsEquityShortSellingMaxLot: client?.optionsEquityShortSellingMaxLot || '50',
        optionsMcxShortSellingMinLot: client?.optionsMcxShortSellingMinLot || '0',
        optionsMcxShortSellingMaxLot: client?.optionsMcxShortSellingMaxLot || '50',
        optionsIndexShortSellingMinLot: client?.optionsIndexShortSellingMinLot || '0',
        optionsIndexShortSellingMaxLot: client?.optionsIndexShortSellingMaxLot || '20',
        optionsEquityShortSellingMaxScrip: client?.optionsEquityShortSellingMaxScrip || '200',
        optionsIndexShortSellingMaxScrip: client?.optionsIndexShortSellingMaxScrip || '200',
        optionsMcxShortSellingMaxScrip: client?.optionsMcxShortSellingMaxScrip || '200',
        optionsEquityShortSellingMaxSizeAll: client?.optionsEquityShortSellingMaxSizeAll || '200',
        optionsIndexShortSellingMaxSizeAll: client?.optionsIndexShortSellingMaxSizeAll || '200',
        optionsMcxShortSellingMaxSizeAll: client?.optionsMcxShortSellingMaxSizeAll || '200',
        optionsIndexShortSellingIntraday: client?.optionsIndexShortSellingIntraday || '5',
        optionsIndexShortSellingHolding: client?.optionsIndexShortSellingHolding || '2',
        optionsEquityShortSellingIntraday: client?.optionsEquityShortSellingIntraday || '5',
        optionsEquityShortSellingHolding: client?.optionsEquityShortSellingHolding || '2',
        optionsMcxShortSellingIntraday: client?.optionsMcxShortSellingIntraday || '5',
        optionsMcxShortSellingHolding: client?.optionsMcxShortSellingHolding || '2',

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
        comexTrading: client?.comexTrading || false,
        comexConfig: client?.comexConfig || {
            brokerage: '0', brokerageType: 'per_crore', exposureType: 'per_crore', minLot: '0', maxLot: '0',
            maxLotScrip: '0', maxSizeAll: '0', intradayMargin: '0', holdingMargin: '0',
            ordersAway: '0', banLimitOrder: false, minTimeToBookProfit: '120', scalpingStopLoss: 'Disabled',
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
        forexTrading: client?.forexTrading || false,
        forexConfig: client?.forexConfig || {
            brokerage: '0', brokerageType: 'per_crore', exposureType: 'per_crore', minLot: '0', maxLot: '0',
            maxLotScrip: '0', maxSizeAll: '0', intradayMargin: '0', holdingMargin: '0',
            ordersAway: '0', banLimitOrder: false, minTimeToBookProfit: '120', scalpingStopLoss: 'Disabled',
            lotMargins: {
                'USD/INR': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'GBP/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'USD/JPY': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'USD/CHF': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'AUD/CAD': { INTRADAY: '0', HOLDING: '0', LOT: '1' },
                'EUR/USD': { INTRADAY: '0', HOLDING: '0', LOT: '1' }
            }
        },
        cryptoTrading: client?.cryptoTrading || false,
        cryptoConfig: client?.cryptoConfig || {
            brokerage: '0', brokerageType: 'per_crore', exposureType: 'per_crore', minLot: '0', maxLot: '0',
            maxLotScrip: '0', maxSizeAll: '0', intradayMargin: '0', holdingMargin: '0',
            ordersAway: '0', banLimitOrder: false, minTimeToBookProfit: '120', scalpingStopLoss: 'Disabled',
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
        notes: client?.notes || '',
        parentId: client?.parent_id || '',
        transactionPassword: '',

        // 8. Kyc / Documents
        documents: client?.documents || {
            panCard: null,
            aadhaarFront: null,
            aadhaarBack: null,
            bankStatement: null,
            additionalDoc: null
        },
        kycStatus: 'Pending'
    });

    // Load full profile from API on mount
    useEffect(() => {
        const loadProfile = async () => {
            console.log('[PROFILE_LOAD] Starting - effectiveClient.id:', effectiveClient?.id);
            if (!effectiveClient?.id) {
                console.log('[PROFILE_LOAD] No effectiveClient.id, aborting');
                setLoadingProfile(false);
                return;
            }
            try {
                console.log('[PROFILE_LOAD] Fetching profile for client:', effectiveClient.id);
                const data = await api.getClientById(effectiveClient.id);
                console.log('[PROFILE_LOAD] ✅ Full API response received');
                console.log('[PROFILE_LOAD] Response data:', JSON.stringify(data, null, 2).substring(0, 500));
                const profile = data.profile || {};
                const settings = data.settings || {};
                const config = settings.config || {};
                const docs = data.documents || {};

                console.log('[PROFILE_LOAD] ✅ settings.broker_id:', settings.broker_id, 'typeof:', typeof settings.broker_id);

                // Store existing document URLs for display
                setExistingDocs({
                    panCard: docs.pan_screenshot || null,
                    aadhaarFront: docs.aadhar_front || null,
                    aadhaarBack: docs.aadhar_back || null,
                    bankStatement: docs.bank_proof || null
                });

                // Merge config_json data into form if available
                console.log('[PROFILE] Loaded settings.broker_id:', settings.broker_id);
                console.log('[PROFILE] About to set parentId to:', settings.broker_id ? String(settings.broker_id) : 'KEEP_PREVIOUS');

                setFormData(prev => ({
                    ...prev,
                    fullName: profile.full_name || prev.fullName,
                    mobile: profile.mobile || prev.mobile,
                    username: profile.username || prev.username,
                    city: profile.city || prev.city,
                    isDemoAccount: profile.is_demo === 1,
                    accountStatus: profile.status !== 'Inactive',
                    // Settings fields
                    allowFreshEntry: !!settings.allow_fresh_entry,
                    allowOrdersBetweenHL: !!settings.allow_orders_between_hl,
                    tradeEquityUnits: !!settings.trade_equity_units,
                    notifyPercentage: String(settings.notify_at_m2m_pct || '70'),
                    banAllSegmentLimitOrder: !!settings.ban_all_segment_limit_order,
                    // Initial load from global for legacy data, overridden by config below
                    mcxMinTimeToBookProfit: String(settings.min_time_to_book_profit || '0'),
                    mcxScalpingStopLoss: !!settings.scalping_sl_enabled ? 'Enabled' : 'Disabled',
                    equityMinTimeToBookProfit: String(settings.min_time_to_book_profit || '0'),
                    equityScalpingStopLoss: !!settings.scalping_sl_enabled ? 'Enabled' : 'Disabled',
                    optionsMinTimeToBookProfit: String(settings.min_time_to_book_profit || '0'),
                    optionsScalpingStopLoss: !!settings.scalping_sl_enabled ? 'Enabled' : 'Disabled',
                    autoCloseTrades: !!settings.scalping_sl_enabled,
                    // Merge all config_json fields (MCX, Equity, Options, etc.)
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
                        mcxLotMargins: config.mcxLotMargins ?? prev.mcxLotMargins,
                        mcxLotBrokerage: config.mcxLotBrokerage ?? prev.mcxLotBrokerage,
                        bidGaps: config.bidGaps ?? prev.bidGaps,
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
                        banOptionsLimitOrder: config.banOptionsLimitOrder ?? prev.banOptionsLimitOrder,
                        optionsMcxBrokerage: config.optionsMcxBrokerage ?? prev.optionsMcxBrokerage,
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
                        autoClosePct: config.autoClosePct ?? prev.autoClosePct,
                        autoClosePercentage: config.autoClosePercentage ?? prev.autoClosePercentage,
                        notifyPercentage: config.notifyPercentage ?? prev.notifyPercentage,
                        autoSquareOff: config.autoSquareOff ?? prev.autoSquareOff,
                        expirySquareOffTime: config.expirySquareOffTime ?? prev.expirySquareOffTime,
                        allowExpiringScrip: config.allowExpiringScrip ?? prev.allowExpiringScrip,
                        daysBeforeExpiry: config.daysBeforeExpiry ?? prev.daysBeforeExpiry,
                        mcxOptionsAwayPoints: config.mcxOptionsAwayPoints ?? prev.mcxOptionsAwayPoints,
                        comexTrading: config.comexTrading ?? prev.comexTrading,
                        forexTrading: config.forexTrading ?? prev.forexTrading,
                        cryptoTrading: config.cryptoTrading ?? prev.cryptoTrading,
                        comexConfig: config.comexConfig ? { ...prev.comexConfig, ...config.comexConfig, lotMargins: { ...prev.comexConfig.lotMargins, ...config.comexConfig.lotMargins } } : prev.comexConfig,
                        forexConfig: config.forexConfig ? { ...prev.forexConfig, ...config.forexConfig, lotMargins: { ...prev.forexConfig.lotMargins, ...config.forexConfig.lotMargins } } : prev.forexConfig,
                        cryptoConfig: config.cryptoConfig ? { ...prev.cryptoConfig, ...config.cryptoConfig, lotMargins: { ...prev.cryptoConfig.lotMargins, ...config.cryptoConfig.lotMargins } } : prev.cryptoConfig,
                        notes: config.notes ?? prev.notes,
                        parentId: settings.broker_id ? String(settings.broker_id) : prev.parentId,
                    } : {
                        parentId: settings.broker_id ? String(settings.broker_id) : prev.parentId,
                    })
                }));
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoadingProfile(false);
            }
        };
        loadProfile();
    }, [effectiveClient?.id]);

    // Fetch brokers for dropdown - PRIORITY: Load first before profile
    useEffect(() => {
        const fetchBrokers = async () => {
            try {
                console.log('[BROKERS] Fetching broker list...');
                const data = await api.getClients({ role: 'BROKER' });
                console.log('[BROKERS] ✅ Loaded', (data || []).length, 'brokers:', data?.map(b => `${b.id}:${b.username}`) || []);
                setBrokers(data || []);
            } catch (err) {
                console.error('[BROKERS] ❌ Failed to fetch:', err);
                setBrokers([]);
            }
        };
        fetchBrokers();
    }, []);

    // When brokers load AND parentId is set, ensure dropdown recognizes the value
    // Also fetch broker's MCX margins for validation
    useEffect(() => {
        if (brokers.length > 0 && formData.parentId) {
            const selectedBrokerExists = brokers.find(b => String(b.id) === String(formData.parentId));
            if (selectedBrokerExists) {
                console.log('[BROKER_MATCH] ✅ Selected broker exists:', selectedBrokerExists.id, formData.parentId);
                // Fetch that broker's MCX data
                api.getBrokerShares(selectedBrokerExists.id).then(brokerData => {
                    const margins = brokerData?.segments?.mcxMargins || null;
                    const brokerage = brokerData?.segments?.mcxBrokerage || null;
                    setBrokerMcxMargins(margins);
                    setBrokerMcxBrokerage(brokerage);
                    console.log('[BROKER_DATA] Loaded mcxMargins & mcxBrokerage:', margins, brokerage);
                }).catch(err => {
                    console.error('[BROKER_DATA] Failed to fetch:', err);
                    setBrokerMcxMargins(null);
                    setBrokerMcxBrokerage(null);
                });
            } else {
                console.log('[BROKER_MATCH] ⚠️ Selected broker NOT in list - parentId:', formData.parentId, 'Available:', brokers.map(b => b.id));
            }
        }
    }, [brokers, formData.parentId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!effectiveClient?.id) return;
        setLoading(true);
        setSaveError('');
        try {
            // ─── VALIDATION ───────────────────────
            // Check Broker is selected (MANDATORY)
            if (!formData.parentId || formData.parentId.trim() === '') {
                setSaveError('❌ Broker is required! Please select a broker.');
                setLoading(false);
                return;
            }

            // Check Transaction Password is provided
            if (!formData.transactionPassword || formData.transactionPassword.trim() === '') {
                setSaveError('❌ Transaction Password is required! Please enter the transaction password.');
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

            const userId = effectiveClient.id;

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

            // Step 1: Update user profile with all basic fields
            // Note: parentId is NOT updated on edit - it's set only during creation
            await api.updateUser(userId, {
                fullName: formData.fullName,
                mobile: formData.mobile,
                city: formData.city,
                isDemo: formData.isDemoAccount,
                status: formData.accountStatus ? 'Active' : 'Inactive'
            });

            // Step 2: Update client settings + ALL config as JSON
            const configToSave = { ...formData };
            delete configToSave.documents;
            delete configToSave.password;

            const brokerId = formData.parentId ? parseInt(formData.parentId) : null;
            console.log('[UPDATE] parentId:', formData.parentId, 'brokerId:', brokerId);

            const payload = {
                allowFreshEntry: formData.allowFreshEntry ? 1 : 0,
                allowOrdersBetweenHL: formData.allowOrdersBetweenHL ? 1 : 0,
                tradeEquityUnits: formData.tradeEquityUnits ? 1 : 0,
                autoClosePct: formData.autoClosePercentage,
                notifyPct: formData.notifyPercentage,
                minProfitTime: parseInt(formData.equityMinTimeToBookProfit || formData.mcxMinTimeToBookProfit || formData.optionsMinTimeToBookProfit || 0) || 0,
                banAllSegmentLimitOrder: formData.banAllSegmentLimitOrder ? 1 : 0,
                brokerId: brokerId,
                config: configToSave
            };
            // alert('DEBUG: Sending tradeEquityUnits=' + payload.tradeEquityUnits);
            console.log('[DEBUG] Payload:', payload);

            await api.updateClientSettings(userId, payload);

            // Step 3: Update password / transaction password if provided
            if (formData.password || formData.transactionPassword) {
                await api.updateUserPasswords(userId, {
                    ...(formData.password ? { newPassword: formData.password } : {}),
                    ...(formData.transactionPassword ? { transactionPassword: formData.transactionPassword } : {})
                });
            }

            // Step 4: Upload new documents if any files selected
            const docs = formData.documents || {};
            const hasNewFiles = Object.values(docs).some(v => v instanceof File);
            if (hasNewFiles) {
                const docFormData = new FormData();
                if (docs.panCard instanceof File) docFormData.append('panScreenshot', docs.panCard);
                if (docs.aadhaarFront instanceof File) docFormData.append('aadharFront', docs.aadhaarFront);
                if (docs.aadhaarBack instanceof File) docFormData.append('aadharBack', docs.aadhaarBack);
                if (docs.bankStatement instanceof File) docFormData.append('bankProof', docs.bankStatement);
                await api.updateDocuments(userId, docFormData);
            }

            onSave?.(formData);
        } catch (err) {
            setSaveError(err.message || 'Failed to update client');
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
                <div className="relative z-20 -mb-8 ml-4 flex flex-col items-start">
                    <div
                        className="px-6 py-4 rounded-md shadow-xl relative z-10"
                        style={{ background: 'linear-gradient(60deg, rgb(40, 140, 108), rgb(78, 167, 82))' }}
                    >
                        <h2 className="text-white text-base font-normal leading-none tracking-tight">
                            Update Trading Client:
                        </h2>
                    </div>
                    {/* The 3D fold decorator */}
                    <div className="w-4 h-4 bg-[#388e3c] -mt-2 ml-2 rounded-sm rotate-45 relative z-0"></div>
                </div>

                {/* Main Card */}
                <div className="bg-[#202940] rounded shadow-2xl p-4 sm:p-6 md:p-8 pt-14 sm:pt-16 border border-white/5">
                    {loadingProfile ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-400 text-sm">Loading profile data...</p>
                            </div>
                        </div>
                    ) : null}
                    <form onSubmit={handleSubmit} style={{ display: loadingProfile ? 'none' : 'block' }}>
                        <div className="space-y-12">
                            {/* PERSONAL DETAILS */}
                            <fieldset className="border-none p-0 m-0">
                                <FieldLegend title="Personal Details" />
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
                                        disabled={true}
                                        placeholder="admin"
                                        hint="Username is unique and cannot be changed."
                                        hintColor="#ef4444"
                                    />
                                    <InputField
                                        label="Password"
                                        name="password"
                                        type="text"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder=""
                                        hint="password for loggin-in with, is case sensitive. Leave Blank if you want password remain unchanged."
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
                                <FieldLegend title="Config" />
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
                            <fieldset className="border-none p-0 m-0" id="mcx-futures">
                                <FieldLegend title="MCX Future" />

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

                                <EditMCXFutureSection
                                    formData={formData}
                                    handleChange={handleChange}
                                    handleNestedChange={handleNestedChange}
                                    globalBanAll={formData.banAllSegmentLimitOrder}
                                    brokerMcxMargins={brokerMcxMargins}
                                />
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

                                {/* Desktop Only Min Time + Scalping — side by side */}
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
                                <div className="hidden md:grid md:grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    {/* Column 1 — Left */}
                                    <div className="space-y-4">
                                        <InputField label="Options Index brokerage" name="optionsIndexBrokerage" value={formData.optionsIndexBrokerage} onChange={handleChange} placeholder="20.00" />
                                        <InputField label="Options Equity brokerage" name="optionsEquityBrokerage" value={formData.optionsEquityBrokerage} onChange={handleChange} placeholder="20.00" />
                                        <InputField label="Options MCX brokerage" name="optionsMcxBrokerage" value={formData.optionsMcxBrokerage} onChange={handleChange} placeholder="20.00" />
                                        <SelectField label="Options Equity Short Selling Allowed (Sell First and Ban later)" name="optionsEquityShortSelling" value={formData.optionsEquityShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />
                                        <InputField label="Options Min. Bid Price" name="optionsMinBidPrice" value={formData.optionsMinBidPrice} onChange={handleChange} placeholder="1" />
                                        <InputField label="Maximum lot size allowed per single trade of Equity Options" name="optionsEquityMaxLot" value={formData.optionsEquityMaxLot} onChange={handleChange} placeholder="50" />
                                        <InputField label="Maximum lot size allowed per single trade of Equity INDEX Options" name="optionsIndexMaxLot" value={formData.optionsIndexMaxLot} onChange={handleChange} placeholder="20" />
                                        <InputField label="Maximum lot size allowed per single trade of MCX Options" name="optionsMcxMaxLot" value={formData.optionsMcxMaxLot} onChange={handleChange} placeholder="50" />
                                        <InputField label="Maximum lot size allowed per scrip of Equity INDEX Options to be actively open at a time" name="optionsIndexMaxScrip" value={formData.optionsIndexMaxScrip} onChange={handleChange} placeholder="200" />
                                        <InputField label="Max Size All Equity Options" name="optionsMaxEquitySizeAll" value={formData.optionsMaxEquitySizeAll} onChange={handleChange} placeholder="200" />
                                        <InputField label="Max Size All MCX Options" name="optionsMaxMcxSizeAll" value={formData.optionsMaxMcxSizeAll} onChange={handleChange} placeholder="200" />
                                        <InputField label="Holding Exposure/Margin Options Index" name="optionsIndexHolding" value={formData.optionsIndexHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                        <InputField label="Holding Exposure/Margin Options Equity" name="optionsEquityHolding" value={formData.optionsEquityHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                        <InputField label="Holding Exposure/Margin Options MCX" name="optionsMcxHolding" value={formData.optionsMcxHolding} onChange={handleChange} placeholder="2" hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                                        <InputField label="Min. Time to book profit (No. of Seconds)" name="optionsMinTimeToBookProfit" value={formData.optionsMinTimeToBookProfit} onChange={handleChange} placeholder="120" hint="Example: 120, will hold the trade for 2 minutes before closing a trade in profit" />
                                    </div>

                                    {/* Column 2 — Right */}
                                    <div className="space-y-4">
                                        <SelectField label="Options Index Brokerage Type" name="optionsIndexBrokerageType" value={formData.optionsIndexBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                                        <SelectField label="Options Equity Brokerage Type" name="optionsEquityBrokerageType" value={formData.optionsEquityBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                                        <SelectField label="Options MCX Brokerage Type" name="optionsMcxBrokerageType" value={formData.optionsMcxBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                                        <SelectField label="Options Index Short Selling Allowed (Sell First and Buy later)" name="optionsIndexShortSelling" value={formData.optionsIndexShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />
                                        <SelectField label="MCX Options Short Selling Allowed (Sell First and Buy later)" name="optionsMcxShortSelling" value={formData.optionsMcxShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />
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
                                    <InputField label="Options Index brokerage" name="optionsIndexBrokerage" value={formData.optionsIndexBrokerage} onChange={handleChange} placeholder="20.00" />

                                    <SelectField label="Options Equity Brokerage Type" name="optionsEquityBrokerageType" value={formData.optionsEquityBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                                    <InputField label="Options Equity brokerage" name="optionsEquityBrokerage" value={formData.optionsEquityBrokerage} onChange={handleChange} placeholder="20.00" />

                                    <SelectField label="Options MCX Brokerage Type" name="optionsMcxBrokerageType" value={formData.optionsMcxBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                                    <InputField label="Options MCX brokerage" name="optionsMcxBrokerage" value={formData.optionsMcxBrokerage} onChange={handleChange} placeholder="20.00" />

                                    <InputField label="Options Min. Bid Price" name="optionsMinBidPrice" value={formData.optionsMinBidPrice} onChange={handleChange} placeholder="1" />

                                    <SelectField label="Options Index Short Selling Allowed (Sell First and Buy later)" name="optionsIndexShortSelling" value={formData.optionsIndexShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />
                                    <SelectField label="Options Equity Short Selling Allowed (Sell First and Ban later)" name="optionsEquityShortSelling" value={formData.optionsEquityShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />
                                    <SelectField label="MCX Options Short Selling Allowed (Sell First and Buy later)" name="optionsMcxShortSelling" value={formData.optionsMcxShortSelling} onChange={handleChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />

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
                                                    checked={formData.comexTrading}
                                                    onChange={handleChange}
                                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded accent-[#4caf50] cursor-pointer"
                                                />
                                                <span className={`text-[10px] sm:text-[11px] font-black uppercase ${formData.comexTrading ? 'text-green-400' : 'text-slate-500'}`}>{formData.comexTrading ? 'ENABLED' : 'DISABLED'}</span>
                                            </div>
                                        </div>
                                        {formData.comexTrading && (
                                            <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <ComexForm
                                                    config={formData.comexConfig}
                                                    onChange={(field, val) => handleNestedChange('comexConfig', field, val)}
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
                                                    checked={formData.forexTrading}
                                                    onChange={handleChange}
                                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded accent-[#4caf50] cursor-pointer"
                                                />
                                                <span className={`text-[10px] sm:text-[11px] font-black uppercase ${formData.forexTrading ? 'text-green-400' : 'text-slate-500'}`}>{formData.forexTrading ? 'ENABLED' : 'DISABLED'}</span>
                                            </div>
                                        </div>
                                        {formData.forexTrading && (
                                            <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <ForexForm
                                                    config={formData.forexConfig}
                                                    onChange={(field, val) => handleNestedChange('forexConfig', field, val)}
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
                                                    checked={formData.cryptoTrading}
                                                    onChange={handleChange}
                                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded accent-[#4caf50] cursor-pointer"
                                                />
                                                <span className={`text-[10px] sm:text-[11px] font-black uppercase ${formData.cryptoTrading ? 'text-green-400' : 'text-slate-500'}`}>{formData.cryptoTrading ? 'ENABLED' : 'DISABLED'}</span>
                                            </div>
                                        </div>
                                        {formData.cryptoTrading && (
                                            <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <CryptoForm
                                                    config={formData.cryptoConfig}
                                                    onChange={(field, val) => handleNestedChange('cryptoConfig', field, val)}
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
                                        { key: 'panCard', label: 'PAN Card', id: 'edit-doc-pan' },
                                        { key: 'aadhaarFront', label: 'Aadhaar Front', id: 'edit-doc-aadhaar-f' },
                                        { key: 'aadhaarBack', label: 'Aadhaar Back', id: 'edit-doc-aadhaar-b' },
                                        { key: 'bankStatement', label: 'Bank Proof / Cheque', id: 'edit-doc-bank' }
                                    ].map(doc => {
                                        const file = formData.documents[doc.key];
                                        const existingUrl = existingDocs[doc.key];
                                        const hasFile = file instanceof File;
                                        const hasExisting = !!existingUrl;
                                        const isPdfFile = hasFile && file.type === 'application/pdf';
                                        const isPdfUrl = hasExisting && (existingUrl.toLowerCase().endsWith('.pdf') || existingUrl.includes('/pdf'));
                                        const viewUrl = hasFile ? URL.createObjectURL(file) : existingUrl;

                                        return (
                                            <div key={doc.key} className="space-y-3 w-full">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{doc.label}</label>
                                                <div className="relative group w-full">
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        id={doc.id}
                                                        accept="image/*,.pdf"
                                                        onChange={(e) => handleNestedChange('documents', doc.key, e.target.files[0])}
                                                    />
                                                    <label htmlFor={doc.id} className="w-full flex flex-col items-center justify-center h-48 rounded-2xl bg-black/40 border-2 border-dashed border-white/10 hover:border-green-500/50 hover:bg-black/60 transition-all overflow-hidden cursor-pointer">
                                                        {hasFile ? (
                                                            <div className="w-full h-full relative flex flex-col items-center justify-center">
                                                                {isPdfFile ? (
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
                                                        ) : hasExisting ? (
                                                            <div className="w-full h-full relative flex flex-col items-center justify-center">
                                                                {isPdfUrl ? (
                                                                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-red-900/20 rounded-2xl">
                                                                        <FileText className="w-16 h-16 text-red-400 opacity-50" />
                                                                    </div>
                                                                ) : (
                                                                    <img src={existingUrl} alt={doc.label} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-70" onError={(e) => { e.target.style.display = 'none'; }} />
                                                                )}
                                                                <div className="relative z-10 flex flex-col items-center gap-2">
                                                                    <div className="w-10 h-10 rounded-full bg-green-500/30 backdrop-blur flex items-center justify-center">
                                                                        <Check className="w-5 h-5 text-green-400" />
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-green-300 bg-black/60 px-2 py-1 rounded">UPLOADED</span>
                                                                    <span className="text-[8px] text-slate-400">Click to replace</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-all">
                                                                    <FileUp className="w-6 h-6 text-slate-600 group-hover:text-green-400" />
                                                                </div>
                                                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Upload {doc.label}</span>
                                                                <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase underline">Click to Browse</p>
                                                            </>
                                                        )}
                                                    </label>
                                                    {(hasFile || hasExisting) && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(viewUrl, '_blank'); }}
                                                            className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-blue-600/80 hover:bg-blue-500 flex items-center justify-center transition-all shadow-lg"
                                                            title="View Document"
                                                        >
                                                            <Eye className="w-4 h-4 text-white" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </fieldset>

                            <hr className="border-white/5" />

                            <div className="mt-12 space-y-8 bg-black/20 p-8 rounded-2xl border border-white/5">
                                {/* Row 1: Notes & Broker */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                    <InputField label="Notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="" />
                                    <div className="group mb-6 group px-2">
                                        <label className="block text-[14px] font-normal mb-[3.2px]" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>Broker {brokers.length === 0 ? '(Loading...)' : ''}</label>
                                        <div className="relative">
                                            <select
                                                name="parentId"
                                                value={formData.parentId}
                                                onChange={handleChange}
                                                disabled={brokers.length === 0}
                                                className={`w-full bg-white border border-slate-200 py-2.5 px-4 text-black font-extrabold outline-none rounded shadow-sm appearance-none focus:ring-2 focus:ring-[#4caf50]/20 transition-all text-sm ${brokers.length === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                            >
                                                <option value="">{brokers.length === 0 ? 'Loading Brokers...' : 'Select Broker'}</option>
                                                {brokers.map(b => (
                                                    <option key={b.id} value={String(b.id)} className="bg-white text-black font-bold">
                                                        {b.id} : {b.username} ({b.full_name || b.fullName || ''})
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Transaction Password */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 items-end">
                                    <InputField label="Transaction Password" name="transactionPassword" value={formData.transactionPassword} onChange={handleChange} type="password" />
                                </div>

                                {/* Save Button */}
                                <div className="pt-4 px-2 flex items-center gap-4 flex-wrap">
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
                                        {loading ? 'UPDATING...' : 'UPDATE CLIENT'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-10 py-2.5 text-white rounded font-bold text-sm uppercase transition-all shadow-md active:scale-95 bg-slate-600 hover:bg-slate-700"
                                    >
                                        CANCEL
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default UpdateClientPage;
