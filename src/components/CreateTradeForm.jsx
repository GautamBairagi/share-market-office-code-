import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../services/api';
import { useMarketData } from '../context/MarketDataContext';
import { exchangeFromRow, displaySymbol } from '../utils/marketUtils';
import { getMcxLotSize, MCX_LOT_SIZES, fetchMcxLotSizesFromApi } from '../utils/mcxLotSizes';
import { calculateSegmentMargin } from '../utils/segmentMargin';

const InputField = ({ label, type = "text", placeholder, name, value, onChange, autoComplete = 'off', disabled }) => (
  <div className="flex flex-col gap-1 w-full group">
    <label className="text-[13px] uppercase tracking-tight mb-1" style={{ color: '#bcc0cf' }}>{label}</label>
    <div className={`border-b transition-colors pb-1 ${disabled ? 'border-white/5' : 'border-white/10 group-focus-within:border-[#4caf50]'}`}>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-transparent text-white py-1 outline-none text-[15px] placeholder:text-slate-600 font-normal
          autofill:bg-transparent
          autofill:shadow-[0_0_0_1000px_#202940_inset]
          autofill:[-webkit-text-fill-color:white]
          ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        style={{
          backgroundColor: 'transparent',
          WebkitBoxShadow: '0 0 0 1000px #202940 inset',
          WebkitTextFillColor: 'white'
        }}
      />
    </div>
  </div>
);

const SearchableSelect = ({ label, name, options, value, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => {
    const val = opt.value !== undefined ? opt.value : opt;
    return String(val) === String(value);
  });
  const displayLabel = selectedOption ? (selectedOption.label || selectedOption) : placeholder;

  const filteredOptions = options.filter(opt => {
    const labelText = (opt.label || opt).toLowerCase();
    return labelText.includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1 w-full" ref={dropdownRef}>
      <label className="text-[13px] uppercase tracking-tight mb-2" style={{ color: disabled ? '#666' : '#bcc0cf' }}>{label}</label>
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full bg-white border border-slate-200 py-2.5 px-4 text-black font-extrabold outline-none rounded shadow-sm flex items-center justify-between transition-all text-sm uppercase tracking-wider ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:border-[#4caf50]'} ${isOpen ? 'ring-2 ring-[#4caf50]/20' : ''}`}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-xl z-[100] max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="p-2 border-b border-slate-100 bg-slate-50">
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 py-2 px-3 text-sm text-black outline-none focus:border-[#4caf50] rounded font-medium"
              />
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value || opt}
                    onClick={() => {
                      onChange({ target: { name, value: opt.value || opt } });
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-[#4caf50]/10 hover:text-[#2e7d32] border-b border-slate-50 last:border-0 transition-colors uppercase ${String(opt.value !== undefined ? opt.value : opt) === String(value) ? 'bg-[#4caf50]/20 text-[#2e7d32]' : 'text-black'}`}
                  >
                    {opt.label || opt}
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 text-center text-slate-400 text-xs italic uppercase tracking-wider">No results found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WhiteSelectField = ({ label, name, options, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[13px] uppercase tracking-tight mb-2" style={{ color: '#bcc0cf' }}>{label}</label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-white border border-slate-200 py-2.5 px-4 text-black font-extrabold outline-none rounded shadow-sm appearance-none focus:ring-2 focus:ring-[#4caf50]/20 transition-all text-sm uppercase tracking-wider cursor-pointer font-bold"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt} className="bg-white text-black font-bold">{opt.label || opt}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  </div>
);

const SelectField = ({ label, name, options, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1 w-full group">
    <label className="text-[13px] uppercase tracking-tight mb-1" style={{ color: '#bcc0cf' }}>{label}</label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-transparent border-b border-white/10 py-2 transition-all outline-none text-white text-[15px] font-normal cursor-pointer appearance-none focus:border-[#4caf50]"
      >
        {placeholder && <option value="" className="bg-[#202940] text-slate-600">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt} className="bg-[#202940] text-white">{opt.label || opt}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none text-slate-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  </div>
);

const CreateTradeForm = ({ onSave, onBack, onLogout, onNavigate }) => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [selectedScripData, setSelectedScripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allowedContracts, setAllowedContracts] = useState(null);

  // ═════════════════════════════════════════════════════════════
  // Equity Units vs Lots Settings & Trade Mode
  // ═════════════════════════════════════════════════════════════
  const [clientConfig, setClientConfig] = useState({});
  const [tradeEquityUnits, setTradeEquityUnits] = useState(0);
  const [holdingLeverage, setHoldingLeverage] = useState(5);
  const [intradayLeverage, setIntradayLeverage] = useState(10);
  const [instrumentLotSize, setInstrumentLotSize] = useState(1);
  const [tradeMode, setTradeMode] = useState('LOTS'); // 'LOTS' or 'UNITS'

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

  // Get data from global context
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

        // Extract commodity name (e.g., CRUDEOIL from MCX:CRUDEOIL26APRFUT)
        const commodityMatch = tradingSymbol.match(/^([A-Z]+)\d{1,2}[A-Z]{3}\d{0,2}FUT$/);
        const commodityName = commodityMatch ? commodityMatch[1] : null;

        // Check if this commodity has ANY selection
        const commodityHasSelection = Array.from(allowedContracts).some(contract => {
          const contractParts = contract.split(':');
          const contractSymbol = contractParts[1] || contract;
          const contractMatch = contractSymbol.match(/^([A-Z]+)\d{1,2}[A-Z]{3}\d{0,2}FUT$/);
          const contractCommodity = contractMatch ? contractMatch[1] : null;
          return contractCommodity === commodityName;
        });

        // If this commodity has selection, show ONLY selected ones
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
    }).map(s => {
      const displayName = displaySymbol(s);
      return {
        ...s,
        displayName,
        exchange: exchangeFromRow(s)
      };
    }).filter(s => s.exchange !== 'NSE' && s.exchange !== 'OTHER');
  }, [watchlistRows, cryptoData, forexData, commodityData, allowedContracts]);

  const isDisconnected = kiteStatus?.connected === false;
  const isConnected = kiteStatus?.connected === true;
  const hasScrips = scrips.length > 0;

  // Form State
  const [formData, setFormData] = useState({
    scrip: '',
    userId: '',
    lotType: 'MEGA',
    buyRate: '',
    sellRate: '',
    lots: '',
    type: 'BUY',
    transactionPassword: ''
  });

  const { tradeId } = useParams();
  const isEdit = !!tradeId;

  // ═════════════════════════════════════════════════════════════
  // Fetch Client Settings (Equity Units Mode, Leverage, etc.)
  // ═════════════════════════════════════════════════════════════
  useEffect(() => {
    const fetchClientSettings = async () => {
      try {
        const settings = await api.getClientSettings(formData.userId || undefined);
        const config = settings?.config_json || {};
        setClientConfig(config);

        const unitsModeSetting = config.trade_equity_units || 0;
        setTradeEquityUnits(unitsModeSetting);
        setTradeMode(unitsModeSetting === 1 ? 'UNITS' : 'LOTS');
        setHoldingLeverage(config.holding_leverage || 5);
        setIntradayLeverage(config.intraday_leverage || 10);

        console.log('[CreateTradeForm] Client Settings Loaded:', {
          userId: formData.userId,
          trade_equity_units: config.trade_equity_units,
          holding_leverage: config.holding_leverage,
          intraday_leverage: config.intraday_leverage,
          mcxExposureType: config.mcxExposureType || config.mcx_exposure_type,
          optionsExposureType: config.optionsExposureType || config.options_exposure_type
        });
      } catch (err) {
        console.error('[CreateTradeForm] Failed to fetch client settings:', err);
        setTradeEquityUnits(0);
        setTradeMode('LOTS');
        setHoldingLeverage(5);
        setIntradayLeverage(10);
      }
    };
    fetchClientSettings();
  }, [formData.userId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userData, contractsRes] = await Promise.all([
          api.getClients({ role: 'TRADER' }),
          api.getSelectedContracts()
        ]);
        setUsers(userData || []);

        if (contractsRes && Array.isArray(contractsRes)) {
          setAllowedContracts(new Set(contractsRes));
        }

        if (isEdit) {
          const trade = await api.getTradeById(tradeId);
          setFormData({
            scrip: trade.symbol,
            userId: String(trade.user_id),
            lotType: trade.market_type === 'MCX' ? 'MEGA' : 'MEGA',
            buyRate: trade.type === 'BUY' ? trade.entry_price : (trade.exit_price || ''),
            sellRate: trade.type === 'SELL' ? trade.entry_price : (trade.exit_price || ''),
            lots: trade.qty,
            type: trade.type,
            transactionPassword: ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch form data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tradeId, isEdit]);

  // Handle scrip selection specifically to auto-fill data only once
  const handleScripChange = (symbol) => {
    const scrip = scrips.find(s => s.symbol === symbol || s.displayName === symbol);
    if (scrip) {
      setSelectedScripData(scrip);
      const meta = getScripMeta(scrip, symbol);
      setInstrumentLotSize(meta.lotSize);

      // Default mode per scrip type
      if (meta.supportsUnitToggle) {
        setTradeMode(tradeEquityUnits === 1 ? 'UNITS' : 'LOTS');
      } else {
        setTradeMode('LOTS');
      }

      const sym = (scrip.symbol || '').split(':')[1] || '';
      const isMini = meta.isMcx && (
        sym.startsWith('GOLDM') ||
        sym.startsWith('SILVERM') ||
        sym.startsWith('CRUDEOILM') ||
        sym.startsWith('NATGASMINI') ||
        sym.startsWith('SILVERMIC') ||
        sym.startsWith('ZINCMINI') ||
        sym.startsWith('LEADMINI') ||
        sym.startsWith('ALUMINI')
      );

      console.log('[CreateTradeForm] Scrip Selected:', {
        symbol,
        meta,
        lot_size: meta.lotSize,
        tradeMode: meta.supportsUnitToggle ? (tradeEquityUnits === 1 ? 'UNITS' : 'LOTS') : 'LOTS'
      });

      setFormData(prev => ({
        ...prev,
        scrip: symbol,
        lotType: meta.isMcx ? (isMini ? 'MINI' : 'MEGA') : prev.lotType
      }));
    } else {
      setSelectedScripData(null);
      setFormData(prev => ({ ...prev, scrip: symbol }));
      setInstrumentLotSize(1);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'scrip') {
      handleScripChange(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // ═════════════════════════════════════════════════════════════
  // Get dynamic quantity label based on instrument type and selected mode
  // ═════════════════════════════════════════════════════════════
  const getQuantityLabel = () => {
    if (!selectedScripData) return 'Qty';
    const meta = getScripMeta(selectedScripData, formData.scrip);

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

    if (meta.isCommodity || meta.isForex || meta.isCrypto) {
      return instrumentLotSize > 1 ? `Lots (1 Lot = ${instrumentLotSize} Units)` : 'Lots / Qty';
    }

    return 'Qty';
  };

  // ═════════════════════════════════════════════════════════════
  // Calculate trade values based on instrument type and trade mode
  // ═════════════════════════════════════════════════════════════
  const calculateTradeValues = () => {
    const entryPrice = parseFloat(formData.type === 'BUY' ? formData.buyRate : formData.sellRate) || 0;
    const qtyInput = parseInt(formData.lots) || 0;

    if (!entryPrice || !qtyInput || !selectedScripData) {
      return {
        qtyInput: 0,
        actualQty: 0,
        lotSizeAtEntry: 1,
        tradeMode: 'LOTS',
        equityUnitsMode: 0,
        turnover: 0,
        leverage: 5,
        marginRequired: 0,
        helperText: ''
      };
    }

    const meta = getScripMeta(selectedScripData, formData.scrip);
    let actualQty = qtyInput;
    let effectiveTradeMode = 'LOTS';
    let equityUnitsMode = 0;
    let leverage = holdingLeverage;
    let helperText = '';
    let lotSizeAtEntry = instrumentLotSize || meta.lotSize || 1;

    if (meta.supportsUnitToggle) {
      if (tradeMode === 'UNITS') {
        actualQty = qtyInput;
        effectiveTradeMode = 'UNITS';
        equityUnitsMode = 1;
        lotSizeAtEntry = 1;
        helperText = `${qtyInput} Unit(s) / Share(s) (Direct quantity, 1x multiplier)`;
      } else {
        actualQty = qtyInput * lotSizeAtEntry;
        effectiveTradeMode = 'LOTS';
        equityUnitsMode = 0;
        helperText = `${qtyInput} Lot(s) × ${lotSizeAtEntry} = ${actualQty} Total Units`;
      }
    } else {
      // MCX / COMEX / FOREX / CRYPTO
      actualQty = qtyInput * lotSizeAtEntry;
      effectiveTradeMode = 'LOTS';
      equityUnitsMode = 0;
      helperText = `${qtyInput} Lot(s) × ${lotSizeAtEntry} = ${actualQty} Total Units`;
    }

    const turnover = (entryPrice * actualQty).toFixed(2);

    // Call standardized calculateSegmentMargin helper!
    const calculatedMargin = calculateSegmentMargin({
      marketType: meta.marketType,
      symbol: formData.scrip,
      price: entryPrice,
      qty: (meta.supportsUnitToggle && effectiveTradeMode === 'UNITS') ? actualQty : qtyInput,
      lotSize: lotSizeAtEntry,
      isHolding: false,
      clientConfig: clientConfig,
      isUnitMode: effectiveTradeMode === 'UNITS',
      fallbackUsdInr: 86.68
    });

    const marginRequired = parseFloat(calculatedMargin || 0).toFixed(2);
    const effLeverage = (parseFloat(marginRequired) > 0 && parseFloat(turnover) > 0)
      ? (parseFloat(turnover) / parseFloat(marginRequired)).toFixed(1)
      : null;

    return {
      qtyInput,
      actualQty,
      lotSizeAtEntry,
      tradeMode: effectiveTradeMode,
      equityUnitsMode,
      turnover: parseFloat(turnover),
      leverage: effLeverage,
      marginRequired: parseFloat(marginRequired),
      helperText
    };
  };

  // Derived display values for the summary
  const currentRate = formData.type === 'BUY' ? formData.buyRate : formData.sellRate;
  const tradeValues = calculateTradeValues();
  const quantityLabel = getQuantityLabel();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.scrip) return alert('Please select a scrip');
    if (!formData.userId) return alert('Please select a user');
    if (!formData.lots || parseInt(formData.lots) <= 0) return alert('Please enter valid lots/units');
    const finalRate = formData.type === 'BUY' ? formData.buyRate : formData.sellRate;
    if (!finalRate || parseFloat(finalRate) <= 0) return alert('Please enter a valid rate for ' + formData.type);
    if (!formData.transactionPassword) return alert('Please enter your transaction password');

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.updateTrade(tradeId, {
          symbol: formData.scrip,
          entry_price: formData.type === 'BUY' ? parseFloat(formData.buyRate) : parseFloat(formData.sellRate),
          exit_price: formData.type === 'BUY' ? parseFloat(formData.sellRate) : parseFloat(formData.buyRate),
          qty: parseInt(formData.lots),
          type: formData.type,
          transactionPassword: formData.transactionPassword
        });
        alert('Trade updated successfully!');
        navigate(-1);
      } else {
        const meta = getScripMeta(selectedScripData, formData.scrip);

        const payload = {
          symbol: formData.scrip,
          type: formData.type,
          qty: formData.lots,
          qty_input: tradeValues.qtyInput,
          actual_qty: tradeValues.actualQty,
          lot_size_at_entry: tradeValues.lotSizeAtEntry,
          trade_mode: tradeValues.tradeMode,
          turnover: tradeValues.turnover,
          leverage_used: tradeValues.leverage,
          equity_units_mode: tradeValues.equityUnitsMode,
          price: formData.type === 'BUY' ? formData.buyRate : formData.sellRate,
          entry_price: formData.type === 'BUY' ? formData.buyRate : formData.sellRate,
          exit_price: null,
          userId: formData.userId,
          exchange: meta.segmentName,
          segment: meta.segmentName,
          market_type: meta.marketType,
          market: meta.marketType,
          instrument_type: meta.instrumentType,
          transactionPassword: formData.transactionPassword
        };
        console.log('[CreateTradeForm] Sending payload to onSave:', payload);
        onSave?.(payload);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to submit trade');
    } finally {
      setSubmitting(false);
    }
  };

  const rateLabel = formData.type === 'BUY' ? 'Buy Rate (Entry Price)' : 'Sell Rate (Entry Price)';

  return (
    <div className="space-y-4 p-3 sm:p-4 w-full max-w-full min-w-0 bg-[#1a2035] text-slate-300">
      {/* Back Button */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => isEdit ? navigate(-1) : onBack()}
          className="flex items-center gap-2 text-white hover:text-green-400 transition-colors font-bold text-xs sm:text-sm"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>BACK</span>
        </button>
      </div>

      {/* Form Content */}
      <div className="overflow-y-auto custom-scrollbar px-2 py-4 bg-[#1a2035]">
        <div className="max-w-5xl mx-auto mt-4 mb-6">
          <div className="bg-[#202940] rounded shadow-2xl relative border border-white/5 mt-6">
            {/* Floating Header */}
            <div className="absolute -top-6 left-5 px-6 py-4 rounded shadow-xl z-10"
              style={{ background: 'linear-gradient(60deg, rgb(40, 140, 108), rgb(78, 167, 82))' }}>
              <h4 className="text-white text-[16px] font-normal leading-none tracking-tight">{isEdit ? `Edit Trade #${tradeId}` : 'Create Trade'}</h4>
            </div>

            <form onSubmit={handleSubmit} className="px-4 py-8 sm:px-8 md:px-12 sm:py-10 pt-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 sm:gap-y-10 px-1 lg:px-4">

                {/* Scrip */}
                <SearchableSelect
                  label="Scrip"
                  name="scrip"
                  placeholder={isDisconnected ? "market not connect" : (hasScrips ? `Select Scrip (${scrips.length})...` : "Fetching symbols...")}
                  value={formData.scrip}
                  onChange={handleChange}
                  options={scrips.map(s => ({
                    value: s.symbol,
                    label: `${s.exchange ? s.exchange + ' : ' : ''}${s.displayName}`
                  }))}
                  disabled={loading || !hasScrips || isDisconnected}
                />
                {isDisconnected && (
                  <div className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tighter animate-pulse">
                    Market Not Connected — Please check your connection
                  </div>
                )}


                {/* Username */}
                <SearchableSelect
                  label="Username"
                  name="userId"
                  placeholder="Search Username..."
                  value={formData.userId}
                  onChange={handleChange}
                  options={users.map(u => ({ value: u.id, label: `${u.username}${u.full_name ? ' — ' + u.full_name : ''}` }))}
                />

                {/* Scrip Meta Info & Mode Selector (Only for Equity/NFO) */}
                {selectedScripData && getScripMeta(selectedScripData, formData.scrip).supportsUnitToggle && (
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

                {/* Buy Rate / Sell Rate conditional rendering based on Order Type */}
                {isEdit ? (
                  <>
                    {/* Buy Rate */}
                    <InputField
                      label="Buy Rate"
                      name="buyRate"
                      type="number"
                      value={formData.buyRate}
                      onChange={handleChange}
                      autoComplete="off"
                    />

                    {/* Sell Rate */}
                    <InputField
                      label="Sell Rate"
                      name="sellRate"
                      type="number"
                      value={formData.sellRate}
                      onChange={handleChange}
                      autoComplete="off"
                    />
                  </>
                ) : (
                  <>
                    {formData.type === 'BUY' ? (
                      <InputField
                        label="Buy Rate (Entry Price)"
                        name="buyRate"
                        type="number"
                        value={formData.buyRate}
                        onChange={handleChange}
                        autoComplete="off"
                      />
                    ) : (
                      <InputField
                        label="Sell Rate (Entry Price)"
                        name="sellRate"
                        type="number"
                        value={formData.sellRate}
                        onChange={handleChange}
                        autoComplete="off"
                      />
                    )}
                  </>
                )}

                {/* Quantity / Lots / Units - Dynamic Label */}
                <InputField
                  label={quantityLabel}
                  name="lots"
                  type="number"
                  value={formData.lots}
                  onChange={handleChange}
                  autoComplete="off"
                />

                {/* Type */}
                {!isEdit && (
                  <WhiteSelectField
                    label="Order Type (Buy / Sell)"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    options={[{ value: 'BUY', label: 'BUY' }, { value: 'SELL', label: 'SELL' }]}
                  />
                )}

                {/* Transaction Password */}
                <InputField
                  label="Transaction Password (Required)"
                  name="transactionPassword"
                  type="password"
                  value={formData.transactionPassword}
                  onChange={handleChange}
                />
              </div>


              {/* Submit & Cancel */}
              <div className="mt-10 flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="bg-[#4caf50] hover:bg-[#43a047] text-white px-10 py-2.5 rounded shadow-[0_4px_10px_0_rgba(76,175,80,0.3)] font-bold text-[14px] uppercase transition-all disabled:opacity-60 active:scale-95"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? 'UPDATE ORDER' : 'PLACE ORDER')}
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="bg-[#607d8b] hover:bg-[#546e7a] text-white font-bold py-2.5 px-10 rounded shadow-lg uppercase tracking-wider text-[11px] transition-all active:scale-95"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTradeForm;
