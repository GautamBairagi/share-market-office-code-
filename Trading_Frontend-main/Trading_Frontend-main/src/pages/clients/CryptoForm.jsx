import React from 'react';
import { ChevronDown } from 'lucide-react';

const InputField = ({ label, name, value, onChange, type = "text", placeholder, hint, className = "" }) => (
    <div className={`mb-6 group px-2 ${className}`}>
        <label htmlFor={name} className="block text-sm mb-1 font-light text-[#bcc0cf]">
            {label}
        </label>
        <input
            id={name}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-transparent border-b border-slate-700 py-1 text-white focus:outline-none focus:border-[#4caf50] transition-colors text-sm font-bold"
        />
        {hint && <p className="text-[11px] mt-2 font-light leading-relaxed text-[#8b8f9a]">
            {hint}
        </p>}
    </div>
);

const SelectField = ({ label, name, options, value, onChange, hint, className = "" }) => (
    <div className={`mb-6 group px-2 ${className}`}>
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

const ScripField = ({ label, value, onChange, hint, name }) => (
    <div className="mb-6 px-2">
        <label htmlFor={name} className="text-xs uppercase font-normal tracking-wider text-[#bcc0cf]">
            {label}
        </label>
        <input
            id={name}
            type="text"
            value={value}
            onChange={onChange}
            className="w-full bg-transparent py-1 text-white focus:outline-none transition-colors text-sm border-b border-slate-700 focus:border-[#4caf50] font-bold"
            placeholder="0"
        />
        {hint && <p className="text-[10px] mt-1 text-[#bcc0cf]">{hint}</p>}
    </div>
);

const CRYPTO_SYMBOLS = ['BTC/USD', 'ETH/USD', 'BNB/USD', 'SOL/USD', 'XRP/USD', 'ADA/USD', 'DOGE/USD', 'DOT/USD', 'AVAX/USD'];

const CryptoForm = ({ config, onChange, globalBanAll }) => {
    const exposureType = config.exposureType || 'per_crore';

    const handleLotMarginChange = (symbol, field, val) => {
        const currentLotMargins = config.lotMargins || {};
        const updatedSymbolMargins = {
            ...(currentLotMargins[symbol] || { INTRADAY: '0', HOLDING: '0', LOT: '1' }),
            [field]: val
        };
        const newLotMargins = {
            ...currentLotMargins,
            [symbol]: updatedSymbolMargins
        };
        onChange('lotMargins', newLotMargins);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            <div className="contents md:block">
                <InputField
                    label="Crypto brokerage"
                    name="brokerage"
                    value={config.brokerage}
                    onChange={(e) => onChange(e.target.name, e.target.value)}
                    className="order-2"
                />
                <InputField
                    label="Maximum lots allowed per single trade of crypto"
                    name="maxLot"
                    value={config.maxLot}
                    onChange={(e) => onChange(e.target.name, e.target.value)}
                    className="order-4"
                />
                <InputField
                    label="Max Size All crypto"
                    name="maxSizeAll"
                    value={config.maxSizeAll}
                    onChange={(e) => onChange(e.target.name, e.target.value)}
                    className="order-6"
                />
                 {exposureType !== 'per_lot' && (
                    <InputField
                        label="Holding Exposure/Margin crypto"
                        name="holdingMargin"
                        value={config.holdingMargin}
                        onChange={(e) => onChange(e.target.name, e.target.value)}
                        className="order-9"
                        hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lot size of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient."
                    />
                )}
                <InputField
                    label="Min. Time to book profit (No. of Seconds)"
                    name="minTimeToBookProfit"
                    value={config.minTimeToBookProfit ?? '120'}
                    onChange={(e) => onChange(e.target.name, e.target.value)}
                    placeholder="120"
                    className="order-11"
                    hint="Example: 120, will hold the trade for 2 minutes before closing a trade in profit"
                />
            </div>
            <div className="contents md:block">
                <SelectField
                    label="Crypto brokerage type"
                    name="brokerageType"
                    value={config.brokerageType}
                    onChange={(e) => onChange(e.target.name, e.target.value)}
                    options={[
                        { value: 'per_crore', label: 'Per Crore' },
                        { value: 'per_lot', label: 'Per Lot' }
                    ]}
                    className="order-1"
                />
                <InputField
                    label="Minimum lots required per single trade of crypto"
                    name="minLot"
                    value={config.minLot}
                    onChange={(e) => onChange(e.target.name, e.target.value)}
                    className="order-3"
                />
                <InputField
                    label="Maximum lots allowed per scrip of crypto to be actively open at a time"
                    name="maxLotScrip"
                    value={config.maxLotScrip}
                    onChange={(e) => onChange(e.target.name, e.target.value)}
                    className="order-5"
                />
                <SelectField
                    label="Exposure Crypto Type"
                    name="exposureType"
                    value={exposureType}
                    onChange={(e) => onChange('exposureType', e.target.value)}
                    options={[
                        { value: 'per_crore', label: 'PER TURNOVER BASIS' },
                        { value: 'per_lot', label: 'PER LOT BASIS' }
                    ]}
                    className="order-7"
                />
                {exposureType !== 'per_lot' && (
                    <InputField
                        label="Intraday Exposure/Margin crypto"
                        name="intradayMargin"
                        value={config.intradayMargin}
                        onChange={(e) => onChange(e.target.name, e.target.value)}
                        className="order-8"
                        hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade divided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade."
                    />
                )}
                <InputField
                    label="Orders to be away by % from current price crypto"
                    name="ordersAway"
                    value={config.ordersAway}
                    onChange={(e) => onChange(e.target.name, e.target.value)}
                    className="order-10"
                />
                <SelectField
                    label="Scalping Stop Loss"
                    name="scalpingStopLoss"
                    value={config.scalpingStopLoss || 'Disabled'}
                    onChange={(e) => onChange(e.target.name, e.target.value)}
                    options={[
                        { value: 'Disabled', label: 'Disabled' },
                        { value: 'Enabled', label: 'Enabled' }
                    ]}
                    className="order-12"
                    hint="If Disabled, Stop Loss or Booking Loss can be done after Min. time of profit booking."
                />
            </div>

            {exposureType === 'per_lot' && (
                <div className="col-span-full mt-8 border-t border-white/5 pt-6 animate-in fade-in slide-in-from-top-4 duration-500 order-8 md:order-none">
                    <h4 className="text-sm font-normal mb-8 px-2 border-l-2 border-[#4caf50]" style={{ color: '#bcc0cf' }}>Crypto Exposure Lot wise:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 px-2">
                        {CRYPTO_SYMBOLS.map((scrip) => {
                            const symbolMargins = (config.lotMargins && config.lotMargins[scrip]) || { INTRADAY: '0', HOLDING: '0', LOT: '1' };
                            return (
                                <React.Fragment key={scrip}>
                                    <ScripField
                                        label={`${scrip} INTRADAY`}
                                        name={`crypto-intraday-${scrip}`}
                                        value={symbolMargins.INTRADAY ?? '0'}
                                        onChange={(e) => handleLotMarginChange(scrip, 'INTRADAY', e.target.value)}
                                    />
                                    <ScripField
                                        label={`${scrip} HOLDING`}
                                        name={`crypto-holding-${scrip}`}
                                        value={symbolMargins.HOLDING ?? '0'}
                                        onChange={(e) => handleLotMarginChange(scrip, 'HOLDING', e.target.value)}
                                    />
                                    <ScripField
                                        label={`${scrip} LOT SIZE`}
                                        name={`crypto-lot-${scrip}`}
                                        value={symbolMargins.LOT ?? '1'}
                                        onChange={(e) => handleLotMarginChange(scrip, 'LOT', e.target.value)}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CryptoForm;
