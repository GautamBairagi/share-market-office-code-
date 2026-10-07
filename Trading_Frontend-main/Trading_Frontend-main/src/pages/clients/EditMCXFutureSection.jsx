import React from 'react';
import { Check, ChevronDown, Info } from 'lucide-react';

const InputField = ({ label, name, value, onChange, type = "text", placeholder, hint, className = "" }) => (
    <div className={`mb-6 group px-2 ${className}`}>
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
        {hint && <p className="text-[14px] mt-2 font-normal leading-normal" style={{ color: '#BCC0CF', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>{hint}</p>}
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

const ScripField = ({ label, value, onChange, className = "" }) => {
    return (
        <div className={`mb-8 px-2 ${className}`}>
            <label className="text-[12px] uppercase font-normal tracking-tight block mb-2 text-[#bcc0cf]" style={{ letterSpacing: '0.2px' }}>{label}</label>
            <input
                type="text"
                value={value}
                onChange={onChange}
                className="w-full bg-transparent py-1.5 text-white focus:outline-none transition-colors text-[16px] font-normal border-b border-white/10 focus:border-white/30"
                style={{ letterSpacing: '0.3px' }}
            />
        </div>
    );
};

const EditMCXFutureSection = ({ formData, handleChange, handleNestedChange, globalBanAll, brokerMcxMargins }) => {
    // Exposure Scrips list as per images 1-4
    const exposureScrips = [
        'BULLDEX', 'GOLD', 'SILVER', 'CRUDEOIL', 'CRUDEOIL MINI', 'COPPER', 'NICKEL', 'ZINC',
        'ZINCMINI', 'LEAD', 'LEADMINI', 'ALUMINIUM', 'ALUMINI', 'NATURALGAS', 'NATURALGAS MINI',
        'MENTHAOIL', 'COTTON', 'GOLDM', 'SILVERM', 'SILVER MIC',
        'MGOLD', 'MCRUDEOIL', 'MSILVER', 'MNATURALGAS', 'MCOPPER', 'MLEAD', 'MZINC', 'MALUMINIUM'
    ];

    // Brokerage Scrips list as per images 4-5
    const brokerageScrips = [
        ['GOLDM', 'SILVERM'],
        ['BULLDEX', 'GOLD'],
        ['SILVER', 'CRUDEOIL'],
        ['COPPER', 'NICKEL'],
        ['ZINC', 'LEAD'],
        ['NATURALGAS', 'NATURALGAS MINI'],
        ['ALUMINIUM', 'MENTHAOIL'],
        ['COTTON', 'SILVERMIC'],
        ['ZINCMINI', 'ALUMINI'],
        ['LEADMINI', 'CRUDEOIL MINI'],
        ['MGOLD', 'MCRUDEOIL'],
        ['MSILVER', 'MNATURALGAS'],
        ['MCOPPER', 'MLEAD'],
        ['MZINC', 'MALUMINIUM']
    ];

    // Mapping from client scrip keys -> broker mcxMargins keys
    const SCRIP_TO_BROKER_KEY = {
        'GOLDM': 'GOLDM',
        'SILVERM': 'SILVERM',
        'BULLDEX': 'MCXBULLDEX',
        'GOLD': 'GOLD',
        'SILVER': 'SILVER',
        'CRUDEOIL': 'CRUDEOIL',
        'CRUDEOIL MINI': 'CRUDEOILM',
        'COPPER': 'COPPER',
        'NICKEL': 'NICKEL',
        'ZINC': 'ZINC',
        'LEAD': 'LEAD',
        'NATURALGAS': 'NATURALGAS',
        'NATURALGAS MINI': 'NATGASMINI',
        'ALUMINIUM': 'ALUMINIUM',
        'COTTON': 'COTTON',
        'SILVER MIC': 'SILVERMIC',
        'SILVERMIC': 'SILVERMIC',
        'ZINCMINI': 'ZINCMINI',
        'ALUMINI': 'ALUMINI',
        'LEADMINI': 'LEADMINI',
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

    // Away Points Scrips list as per image 5-6
    const awayPointsScrips = [
        ['GOLDM', 'SILVERM'],
        ['BULLDEX', 'GOLD'],
        ['SILVER', 'CRUDEOIL'],
        ['COPPER', 'NICKEL'],
        ['ZINC', 'LEAD'],
        ['NATURALGAS', 'NATURALGAS MINI'],
        ['ALUMINIUM', 'MENTHAOIL'],
        ['COTTON', 'SILVERMIC'],
        ['ZINCMINI', 'ALUMINI'],
        ['LEADMINI', 'CRUDEOIL MINI'],
        ['MGOLD', 'MCRUDEOIL'],
        ['MSILVER', 'MNATURALGAS'],
        ['MCOPPER', 'MLEAD'],
        ['MZINC', 'MALUMINIUM']
    ];

    return (
        <fieldset className="border-none p-0 m-0">


            {/* Web View Layout - Unchanged */}
            <div className="hidden md:grid md:grid-cols-2 gap-x-12 px-2">
                <div className="space-y-4">
                    <InputField label="Maximum lot size allowed per single trade of MCX" name="mcxMaxLot" value={formData.mcxMaxLot} onChange={handleChange} />
                    <InputField label="Max Size All Commodity" name="mcxMaxSizeAll" value={formData.mcxMaxSizeAll} onChange={handleChange} />
                    <InputField label="MCX brokerage" name="mcxBrokerage" value={formData.mcxBrokerage} onChange={handleChange} />
                    {formData.mcxExposureType !== 'per_lot' && (
                        <InputField label="Intraday Exposure/Margin MCX" name="mcxIntradayMargin" value={formData.mcxIntradayMargin} onChange={handleChange} hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade devided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                    )}

                    <div className="hidden md:block">
                        <InputField
                            label="Min. Time to book profit (No. of Seconds)"
                            name="mcxMinTimeToBookProfit"
                            value={formData.mcxMinTimeToBookProfit}
                            onChange={handleChange}
                            placeholder="120"
                            hint="Example: 120, will hold active trades for 120 seconds. No trade can be closed before this duration, regardless of P&L status."
                        />
                        <SelectField
                            label="Scalping Stop Loss"
                            name="mcxScalpingStopLoss"
                            value={formData.mcxScalpingStopLoss}
                            onChange={handleChange}
                            options={[
                                { value: 'Disabled', label: 'Disabled' },
                                { value: 'Enabled', label: 'Enabled' }
                            ]}
                            hint="If Disabled, multiple orders or re-entries on the same symbol are blocked during the active hold duration."
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <InputField label="Minimum lot size required per single trade of MCX" name="mcxMinLot" value={formData.mcxMinLot} onChange={handleChange} />
                    <InputField label="Maximum lot size allowed per script of MCX to be actively open at a time" name="mcxMaxLotScrip" value={formData.mcxMaxLotScrip} onChange={handleChange} />

                    <SelectField label="Mcx Brokerage Type" name="mcxBrokerageType" value={formData.mcxBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />

                    <SelectField label="Exposure Mcx Type" name="mcxExposureType" value={formData.mcxExposureType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_turnover', label: 'Per Turnover Basis' }]} />

                    {formData.mcxExposureType !== 'per_lot' && (
                        <InputField label="Holding Exposure/Margin MCX" name="mcxHoldingMargin" value={formData.mcxHoldingMargin} onChange={handleChange} hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade devided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                    )}
                </div>
            </div>

            {/* App View Layout - Separate layout with specific field ordering */}
            <div className="md:hidden space-y-4 px-2">
                <InputField label="Minimum lot size required per single trade of MCX" name="mcxMinLot" value={formData.mcxMinLot} onChange={handleChange} />
                <InputField label="Maximum lot size allowed per single trade of MCX" name="mcxMaxLot" value={formData.mcxMaxLot} onChange={handleChange} />
                <InputField label="Maximum lot size allowed per script of MCX to be actively open at a time" name="mcxMaxLotScrip" value={formData.mcxMaxLotScrip} onChange={handleChange} />
                <InputField label="Max Size All Commodity" name="mcxMaxSizeAll" value={formData.mcxMaxSizeAll} onChange={handleChange} />
                
                <SelectField label="Mcx Brokerage Type" name="mcxBrokerageType" value={formData.mcxBrokerageType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_crore', label: 'Per Crore Basis' }]} />
                <InputField label="MCX brokerage" name="mcxBrokerage" value={formData.mcxBrokerage} onChange={handleChange} />
                
                <SelectField label="Exposure Mcx Type" name="mcxExposureType" value={formData.mcxExposureType} onChange={handleChange} options={[{ value: 'per_lot', label: 'Per Lot Basis' }, { value: 'per_turnover', label: 'Per Turnover Basis' }]} />
                
                {formData.mcxExposureType !== 'per_lot' && (
                    <>
                        <InputField label="Intraday Exposure/Margin MCX" name="mcxIntradayMargin" value={formData.mcxIntradayMargin} onChange={handleChange} hint="Exposure auto calculates the margin money required for any new trade entry. Calculation : turnover of a trade devided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and exposure is 200, (45000 X 100) / 200 = 22500 is required to initiate the trade." />
                        <InputField label="Holding Exposure/Margin MCX" name="mcxHoldingMargin" value={formData.mcxHoldingMargin} onChange={handleChange} hint="Holding Exposure auto calculates the margin money required to hold a position overnight for the next market working day. Calculation : turnover of a trade devided by Exposure is required margin. eg. if gold having lotsize of 100 is trading @ 45000 and holding exposure is 800, (45000 X 100) / 80 = 56250 is required to hold position overnight. System automatically checks at a given time around market closure to check and close all trades if margin(M2M) insufficient." />
                    </>
                )}

                <InputField
                    label="Min. Time to book profit (No. of Seconds)"
                    name="mcxMinTimeToBookProfit"
                    value={formData.mcxMinTimeToBookProfit}
                    onChange={handleChange}
                    placeholder="120"
                    hint="Example: 120, will hold active trades for 120 seconds. No trade can be closed before this duration, regardless of P&L status."
                />
                <SelectField
                    label="Scalping Stop Loss"
                    name="mcxScalpingStopLoss"
                    value={formData.mcxScalpingStopLoss}
                    onChange={handleChange}
                    options={[
                        { value: 'Disabled', label: 'Disabled' },
                        { value: 'Enabled', label: 'Enabled' }
                    ]}
                    hint="If Disabled, multiple orders or re-entries on the same symbol are blocked during the active hold duration."
                />
            </div>

            {formData.mcxExposureType === 'per_lot' && (
                <div className="mt-8">
                    <h4 className="text-[17px] font-normal mb-10 px-4 border-l-2 border-[#4caf50] text-[#bcc0cf]" style={{ letterSpacing: '0.2px' }}>MCX Exposure Lot wise:</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 px-2">
                        {exposureScrips.map(scrip => {
                            return (
                                <React.Fragment key={scrip}>
                                    <ScripField 
                                        label={`${scrip} INTRADAY`} 
                                        value={formData.mcxLotMargins[scrip]?.INTRADAY ?? '0'} 
                                        onChange={(e) => handleNestedChange('mcxLotMargins', scrip, e.target.value, 'INTRADAY')} 
                                    />
                                    <ScripField 
                                        label={`${scrip} HOLDING`} 
                                        value={formData.mcxLotMargins[scrip]?.HOLDING ?? '0'} 
                                        onChange={(e) => handleNestedChange('mcxLotMargins', scrip, e.target.value, 'HOLDING')} 
                                    />
                                    <ScripField 
                                        label={`${scrip} MAX LOTS (Position Limit)`} 
                                        value={formData.mcxLotMargins[scrip]?.LOT ?? '1'} 
                                        onChange={(e) => handleNestedChange('mcxLotMargins', scrip, e.target.value, 'LOT')} 
                                    />
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}

            {formData.mcxBrokerageType === 'per_lot' && (
                <div className="mt-12 px-2">
                    <h4 className="text-[17px] font-normal mb-10 border-l-2 border-[#4caf50] pl-4 text-[#bcc0cf]" style={{ letterSpacing: '0.2px' }}>MCX Lot Wise Brokerage:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 px-2">
                        {brokerageScrips.flat().map(scrip => {
                            const scripKey = scrip === 'SILVERMIC' ? 'SILVER MIC' : scrip;
                            const displayLabel = scrip === 'SILVERMIC' ? 'SILVER MIC' : scrip;
                            return (
                                <ScripField
                                    key={scrip}
                                    label={`${displayLabel}:`}
                                    value={formData.mcxLotBrokerage[scripKey] ?? '0.00'}
                                    onChange={(e) => handleNestedChange('mcxLotBrokerage', scripKey, e.target.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mt-12 px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                    <div className="px-1 md:col-span-2">
                        <h4 className="text-[17px] font-normal mb-8 border-l-2 border-[#4caf50] pl-4 text-[#bcc0cf]" style={{ letterSpacing: '0.2px' }}>Orders to be away by points in each scrip MCX:</h4>
                    </div>
                    {awayPointsScrips.flat().map(scrip => {
                        const scripKey = scrip === 'SILVERMIC' ? 'SILVER MIC' : (scrip === 'NATURALGAS MINI' ? 'NATURALGAS MINI' : (scrip === 'CRUDEOIL MINI' ? 'CRUDEOIL MINI' : scrip));
                        const displayLabel = scrip === 'SILVERMIC' ? 'SILVER MIC' : scrip;
                        return (
                            <ScripField
                                key={scrip}
                                label={`${displayLabel}:`}
                                value={formData.bidGaps[scripKey] ?? '0.00'}
                                onChange={(e) => handleNestedChange('bidGaps', scripKey, e.target.value)}
                            />
                        );
                    })}
                </div>
            </div>
        </fieldset>
    );
};

export default EditMCXFutureSection;
