import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';
import * as api from '../services/api';

const CollapsibleSection = ({ title, children, isOpen, onToggle, icon: Icon }) => (
  <div className="mb-6 bg-[#1a2236] rounded-lg border border-[#2d3748] overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
    <button
      onClick={onToggle}
      className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${isOpen ? 'bg-[#2d3748]/30 border-b border-[#2d3748]' : 'hover:bg-[#2d3748]/20'}`}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-[#4CAF50]" />}
        <span className="text-sm font-bold text-slate-100 uppercase tracking-wider">{title}</span>
      </div>
      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
    </button>
    {isOpen && (
      <div className="p-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
          {children}
        </div>
      </div>
    )}
  </div>
);

const ToggleSwitch = ({ label, checked, onChange, name }) => (
  <div className="flex items-center justify-between py-2 group">
    <label className="text-xs text-slate-300 font-medium cursor-pointer group-hover:text-white transition-colors">{label}</label>
    <div
      onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
      className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${checked ? 'bg-[#4CAF50]' : 'bg-[#2d3748]'}`}
    >
      <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  </div>
);

const InputField = ({ label, type = "text", subtext, placeholder, name, value, onChange, disabled, errors }) => (
  <div className={`flex flex-col gap-1.5 ${disabled ? 'opacity-30' : ''}`}>
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-400 font-semibold uppercase tracking-tight">{label}</label>
      {subtext && (
        <div className="group relative">
          <Info className="w-3 h-3 text-slate-500 cursor-help" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-800 text-[10px] text-slate-200 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700">
            {subtext}
          </div>
        </div>
      )}
    </div>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-[#0b111e]/50 border-b border-[#2d3748] text-slate-100 py-1.5 transition-all focus:border-[#4CAF50] focus:outline-none text-sm placeholder:text-slate-600 disabled:cursor-not-allowed"
      />
      {type === 'time' && <Clock className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />}
    </div>
    {errors?.[name] && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{errors[name]}</p>}
  </div>
);

const SelectField = ({ label, name, options, value, onChange, disabled }) => (
  <div className={`flex flex-col gap-1.5 ${disabled ? 'opacity-30' : ''}`}>
    <label className="text-xs text-slate-400 font-semibold uppercase tracking-tight">{label}</label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-white border border-slate-200 py-1.5 px-3 text-black font-extrabold outline-none rounded shadow-sm appearance-none focus:ring-2 focus:ring-[#4caf50]/20 transition-all text-xs uppercase tracking-wider cursor-pointer disabled:cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt} className="bg-white text-black font-bold">
            {opt.label || opt}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
        <ChevronDown className="w-3 h-3" />
      </div>
    </div>
  </div>
);

const FileField = ({ label, onChange, fileName, progress, error }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs text-slate-400 font-semibold uppercase tracking-tight">{label}</label>
    <div className="relative group">
      <input
        type="file"
        className="hidden"
        id={`file-${label}`}
        onChange={(e) => onChange(e.target.files[0])}
      />
      <label
        htmlFor={`file-${label}`}
        className={`w-full h-12 flex items-center justify-between border border-dashed rounded-lg px-4 cursor-pointer transition-all ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-[#0b111e]/30 hover:bg-[#0b111e]/50 hover:border-[#4CAF50]/50'}`}
      >
        <span className="text-[11px] font-bold text-slate-400 truncate max-w-[200px]">
          {fileName || 'Click to Upload Document'}
        </span>
        <div className="flex items-center gap-2">
          {progress > 0 && progress < 100 && (
            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#4CAF50]" style={{ width: `${progress}%` }} />
            </div>
          )}
          {progress === 100 && <div className="p-1 rounded-full bg-green-500/20"><Info className="w-3 h-3 text-green-500" /></div>}
        </div>
      </label>
    </div>
    {error && <p className="text-[9px] text-red-400 font-bold uppercase tracking-tight">{error}</p>}
  </div>
);

const SegmentFields = ({ segmentKey, label, formData, onChange, handleSegmentChange, toggleSection, openSections, errors }) => {
  const config = formData.segments[segmentKey];
  return (
    <CollapsibleSection
      title={label}
      isOpen={openSections[segmentKey]}
      onToggle={() => toggleSection(segmentKey)}
    >
      <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-4 mb-4 border-b border-[#2d3748]/50">
        <ToggleSwitch
          label={`Enable ${label} Segment`}
          name={`${segmentKey}_enabled`}
          checked={config.enabled}
          onChange={(e) => handleSegmentChange(segmentKey, 'enabled', e.target.checked)}
        />
      </div>

      <SelectField
        label="Brokerage Type"
        options={["Per Lot Basis", "Per Crore Basis"]}
        value={config.brokerageType}
        disabled={!config.enabled}
        onChange={(e) => handleSegmentChange(segmentKey, 'brokerageType', e.target.value)}
      />
      <InputField
        label="Brokerage Value"
        value={config.brokerageValue}
        disabled={!config.enabled}
        onChange={(e) => handleSegmentChange(segmentKey, 'brokerageValue', e.target.value)}
        errors={errors}
      />
      <InputField
        label="Leverage (Multiplier)"
        value={config.leverage}
        disabled={!config.enabled}
        onChange={(e) => handleSegmentChange(segmentKey, 'leverage', e.target.value)}
        errors={errors}
      />
      <InputField
        label="Max Lot Per Scrip"
        value={config.maxLot}
        disabled={!config.enabled}
        onChange={(e) => handleSegmentChange(segmentKey, 'maxLot', e.target.value)}
        errors={errors}
      />
      <SelectField
        label="Margin Type"
        options={["Per Lot Basis", "Percentage", "Fixed"]}
        value={config.marginType}
        disabled={!config.enabled}
        onChange={(e) => handleSegmentChange(segmentKey, 'marginType', e.target.value)}
      />
      <InputField
        label="Exposure Multiplier"
        value={config.exposureMultiplier}
        disabled={!config.enabled}
        onChange={(e) => handleSegmentChange(segmentKey, 'exposureMultiplier', e.target.value)}
        errors={errors}
      />

      <div className="col-span-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 items-end border-t border-[#2d3748]/30 pt-6 mt-2">
          <ToggleSwitch
            label="Auto Square Off"
            checked={config.autoSquareOff}
            disabled={!config.enabled}
            onChange={(e) => handleSegmentChange(segmentKey, 'autoSquareOff', e.target.checked)}
          />
          {config.autoSquareOff && (
            <InputField
              label="Square Off Time"
              type="time"
              value={config.squareOffTime}
              disabled={!config.enabled}
              onChange={(e) => handleSegmentChange(segmentKey, 'squareOffTime', e.target.value)}
              errors={errors}
            />
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
};

const ClientDetailsForm = ({ onBack, onSave, mode = 'edit', initialData = null }) => {
  const roleLabel = initialData?.role === 'ADMIN' ? 'Admin' : initialData?.role === 'BROKER' ? 'Broker' : 'Trading Client';
  const [openSections, setOpenSections] = useState({
    personal: true,
    config: true,
    documents: true,
    alerts: true,
    mcx: true,
    equity: true,
    options: true,
    comex: true,
    forex: true,
    crypto: true
  });

  const [uploadProgress, setUploadProgress] = useState({});

  const [formData, setFormData] = useState({
    // Basic Details
    name: initialData?.full_name || '',
    username: initialData?.username || '',
    email: initialData?.email || '',
    mobile: initialData?.mobile || '',
    password: '',
    city: initialData?.city || '',
    accountStatus: true,
    clientGroup: 'Default',
    dealerMapping: 'Admin',
    creditLimit: initialData?.credit_limit ?? '0',
    demoAccount: initialData?.is_demo ? true : false,
    segment: 'NIFTY50', // Primary segment
    // Config settings
    allowFreshEntry: true,
    allowOrdersBetweenHL: true,
    tradeEquityUnits: false,
    autoCloseEnabled: true,
    autoClosePct: '90',
    notifyPct: '70',
    minProfitTime: '120',
    scalpingSlEnabled: 'Enabled',
    alerts: {
      risk: true,
      tradeCut: true,
      margin: true,
      ticket: true
    },

    // Documents
    docs: {
      pan: null,
      aadhaar: null,
      agreement: null,
      photo: null
    },

    // Segment Configs
    segments: {
      mcx: { enabled: true, brokerageType: 'Per Lot Basis', brokerageValue: '0', leverage: '1', maxLot: '0', autoSquareOff: false, squareOffTime: '23:30', marginType: 'Per Lot Basis', exposureMultiplier: '1' },
      equity: { enabled: true, brokerageType: 'Per Crore Basis', brokerageValue: '0', leverage: '1', maxLot: '0', autoSquareOff: false, squareOffTime: '15:30', marginType: 'Percentage', exposureMultiplier: '1' },
      options: { enabled: true, brokerageType: 'Per Lot Basis', brokerageValue: '0', leverage: '1', maxLot: '0', autoSquareOff: false, squareOffTime: '15:30', marginType: 'Fixed', exposureMultiplier: '1' },
      comex: { enabled: true, brokerageType: 'Per Crore Basis', brokerageValue: '0', leverage: '1', maxLot: '0', autoSquareOff: false, squareOffTime: '00:00', marginType: 'Fixed', exposureMultiplier: '1' },
      forex: { enabled: true, brokerageType: 'Per Crore Basis', brokerageValue: '0', leverage: '1', maxLot: '0', autoSquareOff: false, squareOffTime: '00:00', marginType: 'Fixed', exposureMultiplier: '1' },
      crypto: { enabled: true, brokerageType: 'Per Crore Basis', brokerageValue: '0', leverage: '1', maxLot: '0', autoSquareOff: false, squareOffTime: '00:00', marginType: 'Fixed', exposureMultiplier: '1' }
    }
  });


  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    const userId = initialData?.id;
    if (!userId) { onSave(formData); return; }

    setSaving(true);
    setSaveError('');
    try {
      // Step 1: Update user profile fields
      await api.updateUser(userId, {
        fullName: formData.name || undefined,
        email: formData.email || undefined,
        mobile: formData.mobile || undefined,
        city: formData.city || undefined,
        creditLimit: formData.creditLimit,
        isDemo: formData.demoAccount,
        status: formData.accountStatus ? 'Active' : 'Suspended',
      });

      // Step 2: Update client settings + full config as JSON
      await api.updateClientSettings(userId, {
        allowFreshEntry: formData.allowFreshEntry,
        allowOrdersBetweenHL: formData.allowOrdersBetweenHL,
        tradeEquityUnits: formData.tradeEquityUnits,
        autoCloseEnabled: formData.autoCloseEnabled,
        autoClosePct: formData.autoClosePct,
        notifyPct: formData.notifyPct,
        minProfitTime: formData.minProfitTime,
        scalpingSlEnabled: formData.scalpingSlEnabled,
        config: { alerts: formData.alerts, segments: formData.segments },
      });

      // Step 3: Password change if provided
      if (formData.password) {
        await api.updateUserPasswords(userId, { newPassword: formData.password });
      }

      // Step 4: Upload documents if any files selected
      const docs = formData.docs || {};
      const hasFiles = Object.values(docs).some(v => v instanceof File);
      if (hasFiles) {
        const docFd = new FormData();
        if (docs.pan instanceof File)       docFd.append('panScreenshot', docs.pan);
        if (docs.aadhaar instanceof File)   docFd.append('aadharFront', docs.aadhaar);
        if (docs.agreement instanceof File) docFd.append('bankProof', docs.agreement);
        if (docs.photo instanceof File)     docFd.append('photo', docs.photo);
        await api.updateDocuments(userId, docFd);
      }

      onSave(formData);
    } catch (err) {
      setSaveError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (field, file) => {
    if (!file) return;

    // File Validation
    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
      alert('File size exceeds 2MB limit.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      docs: { ...prev.docs, [field]: file }
    }));

    // Mock progress bar
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      setUploadProgress(prev => ({ ...prev, [field]: prog }));
      if (prog >= 100) clearInterval(interval);
    }, 200);
  };

  const handleAlertChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      alerts: { ...prev.alerts, [field]: value }
    }));
  };

  const handleSegmentChange = (segment, field, value) => {
    setFormData(prev => ({
      ...prev,
      segments: {
        ...prev.segments,
        [segment]: { ...prev.segments[segment], [field]: value }
      }
    }));
  };

  return (
    <div className="bg-[#151c2c] rounded-lg border border-[#2d3748] flex flex-col h-full overflow-hidden shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="px-8 py-6 bg-[#202940] border-b border-[#2d3748] flex justify-between items-center sticky top-0 z-50 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-2 h-8 bg-[#4CAF50] rounded-full" />
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            {mode === 'create' ? `Create ${roleLabel}` : `Update ${roleLabel}`}
          </h2>
        </div>
        <button onClick={onBack} className="bg-[#2d3748] hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-md text-xs font-bold uppercase transition-all border border-slate-600">Close</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-2">

          {/* Basic Details */}
          <CollapsibleSection title="Personal & Basic Details" isOpen={openSections.personal} onToggle={() => toggleSection('personal')}>
            <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} subtext="Insert real name as per documents" errors={errors} />
            <InputField label="Username" name="username" value={formData.username} onChange={handleChange} subtext="Login ID (case insensitive, no symbols)" errors={errors} />
            <InputField label="Email Address" name="email" value={formData.email} onChange={handleChange} errors={errors} />
            <InputField label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} errors={errors} />
            <SelectField label="Primary Segment" name="segment" options={["NIFTY50", "NIFTY_INDEX", "BANKNIFTY_INDEX"]} value={formData.segment} onChange={handleChange} />
            <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} errors={errors} />
            <InputField label="City" name="city" value={formData.city} onChange={handleChange} errors={errors} />
            <SelectField label="Account Status" options={["Active", "Suspended", "Blocked"]} value={formData.accountStatus ? "Active" : "Suspended"} onChange={(e) => handleChange({ target: { name: 'accountStatus', type: 'checkbox', checked: e.target.value === 'Active' } })} />
            <SelectField label="Client Group" options={["Default", "Premium", "VIP"]} value={formData.clientGroup} onChange={handleChange} name="clientGroup" />
          </CollapsibleSection>

          {/* Documents Section */}
          <CollapsibleSection title="KYC & Document Uploads" isOpen={openSections.documents} onToggle={() => toggleSection('documents')}>
            <FileField
              label="PAN Card"
              onChange={(file) => handleFileChange('pan', file)}
              fileName={formData.docs.pan?.name}
              progress={uploadProgress.pan}
            />
            <FileField
              label="Aadhaar Card"
              onChange={(file) => handleFileChange('aadhaar', file)}
              fileName={formData.docs.aadhaar?.name}
              progress={uploadProgress.aadhaar}
            />
            <FileField
              label="Client Agreement"
              onChange={(file) => handleFileChange('agreement', file)}
              fileName={formData.docs.agreement?.name}
              progress={uploadProgress.agreement}
            />
            <FileField
              label="Passport Photo"
              onChange={(file) => handleFileChange('photo', file)}
              fileName={formData.docs.photo?.name}
              progress={uploadProgress.photo}
            />
          </CollapsibleSection>

          {/* Alert Settings */}
          <CollapsibleSection title="WhatsApp & Email Alerts" isOpen={openSections.alerts} onToggle={() => toggleSection('alerts')}>
            <div className="col-span-full bg-green-500/5 p-4 rounded-lg flex items-center gap-4 mb-4 border border-green-500/10">
              <Info className="w-5 h-5 text-green-500" />
              <p className="text-[11px] text-slate-300">
                Alerts will be sent to <b>{formData.mobile || 'Registered Mobile'}</b> and <b>{formData.email || 'Registered Email'}</b> via WhatsApp and Email.
              </p>
            </div>
            <ToggleSwitch
              label="Risk Alerts (M2M)"
              checked={formData.alerts.risk}
              onChange={(e) => handleAlertChange('risk', e.target.checked)}
            />
            <ToggleSwitch
              label="Trade Auto Cut Alert"
              checked={formData.alerts.tradeCut}
              onChange={(e) => handleAlertChange('tradeCut', e.target.checked)}
            />
            <ToggleSwitch
              label="Margin Call Alert"
              checked={formData.alerts.margin}
              onChange={(e) => handleAlertChange('margin', e.target.checked)}
            />
            <ToggleSwitch
              label="Support Ticket Updates"
              checked={formData.alerts.ticket}
              onChange={(e) => handleAlertChange('ticket', e.target.checked)}
            />
          </CollapsibleSection>

          {/* Config */}
          <CollapsibleSection title="Advanced Configuration" isOpen={openSections.config} onToggle={() => toggleSection('config')}>
            <InputField label="Credit Limit / Initial Balance" name="creditLimit" value={formData.creditLimit} onChange={handleChange} errors={errors} />
            <ToggleSwitch label="Demo Account" name="demoAccount" checked={formData.demoAccount} onChange={handleChange} />
          </CollapsibleSection>

          {/* Segments */}
          <SegmentFields segmentKey="mcx" label="MCX Futures" formData={formData} onChange={handleChange} handleSegmentChange={handleSegmentChange} toggleSection={toggleSection} openSections={openSections} errors={errors} />
          <SegmentFields segmentKey="equity" label="Equity Futures" formData={formData} onChange={handleChange} handleSegmentChange={handleSegmentChange} toggleSection={toggleSection} openSections={openSections} errors={errors} />
          <SegmentFields segmentKey="options" label="Options Config" formData={formData} onChange={handleChange} handleSegmentChange={handleSegmentChange} toggleSection={toggleSection} openSections={openSections} errors={errors} />
          <SegmentFields segmentKey="comex" label="Comex" formData={formData} onChange={handleChange} handleSegmentChange={handleSegmentChange} toggleSection={toggleSection} openSections={openSections} errors={errors} />
          <SegmentFields segmentKey="forex" label="Forex" formData={formData} onChange={handleChange} handleSegmentChange={handleSegmentChange} toggleSection={toggleSection} openSections={openSections} errors={errors} />
          <SegmentFields segmentKey="crypto" label="Crypto (Bitcoin etc.)" formData={formData} onChange={handleChange} handleSegmentChange={handleSegmentChange} toggleSection={toggleSection} openSections={openSections} errors={errors} />

          {/* Action Button */}
          <div className="pt-10 pb-6 space-y-3">
            {saveError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded px-4 py-3 text-sm">
                {saveError}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full md:w-auto bg-gradient-to-r from-[#4CAF50] to-[#43a047] hover:from-[#43a047] hover:to-[#388e3c] text-white font-black py-4 px-12 rounded-lg transition-all uppercase tracking-widest text-sm shadow-[0_10px_20px_-5px_rgba(76,175,80,0.4)] active:scale-95 disabled:opacity-60"
            >
              {saving ? 'SAVING...' : (mode === 'create' ? 'Verify & Create Client' : 'Update Configuration')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsForm;
