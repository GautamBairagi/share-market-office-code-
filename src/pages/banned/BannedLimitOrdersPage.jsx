import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as api from '../../services/api';
import SearchableSelect from '../../components/SearchableSelect';
import { useMarketData } from '../../context/MarketDataContext';
import { exchangeFromRow, displaySymbol } from '../../utils/marketUtils';

const MobileBannedItemCard = ({ item, isSelected, onToggle }) => (
  <div
    onClick={onToggle}
    className={`p-4 rounded-lg border shadow-xl mb-3 cursor-pointer transition-all ${isSelected
      ? 'bg-green-500/10 border-green-500 border-2'
      : 'bg-[#1f283e] border-white/5 shadow-md'
      }`}
  >
    <div className="flex justify-between items-start mb-3">
      <span className="text-[#01B4EA] font-bold text-sm">#{item.id}</span>
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected
        ? 'bg-[#01B4EA] border-[#01B4EA]'
        : 'bg-transparent border-white/20'
        }`}>
        {isSelected && (
          <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        )}
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Scrip ID</span>
        <span className="text-white font-bold text-sm">{item.scrip_id}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Start Time</span>
        <span className="text-slate-300 text-xs">{new Date(item.start_time).toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">End Time</span>
        <span className="text-slate-300 text-xs">{new Date(item.end_time).toLocaleString()}</span>
      </div>
    </div>
  </div>
);

const BannedLimitOrdersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const view = location.pathname.includes('/add') ? 'add' : 'list';
  const [selectedItems, setSelectedItems] = useState([]);
  const [bannedItems, setBannedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, text: '', type: '' });
  const [formError, setFormError] = useState('');
  const [allowedContracts, setAllowedContracts] = useState(null);
  const pollRef = useRef(null);

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

  const [formData, setFormData] = useState({
    scripId: '',
    startDate: '',
    startHour: '00',
    startMin: '00',
    endDate: '',
    endHour: '00',
    endMin: '00',
    transPassword: ''
  });


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Banned Orders
      try {
        const banData = await api.getBannedOrders();
        const items = Array.isArray(banData)
          ? banData
          : (Array.isArray(banData?.data) ? banData.data : []);
        setBannedItems(items);
      } catch (banErr) {
        console.error('Failed to fetch banned orders:', banErr);
        showToast(banErr.message || 'Failed to fetch banned orders', 'error');
      }

      // 2. Fetch Selected Contracts independently (doesn't block banned table if kite is offline)
      try {
        const contractsRes = await api.getSelectedContracts();
        const contractList = Array.isArray(contractsRes)
          ? contractsRes
          : (Array.isArray(contractsRes?.data) ? contractsRes.data : []);
        if (contractList.length > 0) {
          setAllowedContracts(new Set(contractList));
        }
      } catch (contractsErr) {
        console.warn('Contracts fetch note (kite disconnected or error):', contractsErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast({ show: false, text: '', type: '' }), 3000);
  };

  const toggleView = () => {
    if (view === 'add') {
      setFormData({
        scripId: '',
        startDate: '',
        startHour: '00',
        startMin: '00',
        endDate: '',
        endHour: '00',
        endMin: '00',
        transPassword: ''
      });
    }
    navigate(view === 'list' ? '/banned/add' : '/banned');
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleRemoveFromBan = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Are you sure you want to remove ${selectedItems.length} items from ban?`)) return;
    setSubmitting(true);
    try {
      await api.deleteBannedOrders(selectedItems);
      showToast('Items removed from ban successfully', 'success');
      setSelectedItems([]);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to remove items', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBan = async () => {
    if (!formData.scripId || !formData.startDate || !formData.endDate) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    if (!formData.transPassword) {
      showToast('Transaction password is required', 'error');
      return;
    }
    const startTime = `${formData.startDate} ${formData.startHour}:${formData.startMin}:00`;
    const endTime = `${formData.endDate} ${formData.endHour}:${formData.endMin}:00`;
    setFormError('');
    setSubmitting(true);
    try {
      await api.createBannedOrder({
        scripId: formData.scripId,
        startTime,
        endTime,
        exchange: scrips.find(s => s.displayName === formData.scripId)?.exchange || 'NSE',
        transactionPassword: formData.transPassword
      });
      showToast('Scrip added to ban list', 'success');
      navigate('/banned');
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to add ban';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="main-content custom-scrollbar" style={{ overflowY: 'auto', height: '100%', position: 'relative' }}>
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded shadow-2xl transition-all border ${
          toast.type === 'success' ? 'bg-[#1b2a21] border-green-500/30 text-green-400' : 'bg-[#2a1b1b] border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-[14px] font-medium tracking-wide">{toast.text}</p>
        </div>
      )}

      {view === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="card-panel" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
              Showing <span style={{ color: '#01B4EA', fontWeight: 700 }}>{bannedItems.length}</span> of <span style={{ color: '#01B4EA', fontWeight: 700 }}>{bannedItems.length}</span> items.
              {selectedItems.length > 0 && (
                <span className="ml-2 text-green-600 font-semibold">({selectedItems.length} selected)</span>
              )}
            </p>
            <div className="action-row">
              <button
                onClick={toggleView}
                className="btn-secondary"
                style={{ borderColor: '#4CAF50', color: '#4CAF50' }}
              >
                ADD TO BAN
              </button>
              <button
                onClick={handleRemoveFromBan}
                disabled={selectedItems.length === 0 || submitting}
                className="btn-primary btn-success-gradient"
                style={selectedItems.length === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>REMOVE FROM BAN {selectedItems.length > 0 && `(${selectedItems.length})`}</>}
              </button>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block card-panel" style={{ overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table-standard custom-table">
                <thead>
                  <tr>
                    <th style={{ width: '64px' }}></th>
                    <th>ID</th>
                    <th>SCRIP ID</th>
                    <th style={{ color: '#01B4EA' }}>START TIME</th>
                    <th>END TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="loading-overlay">
                        <Loader2 className="w-8 h-8 animate-spin text-[#01B4EA]" />
                        <span className="text-slate-500 tracking-widest uppercase text-xs">Loading banned orders...</span>
                      </td>
                    </tr>
                  ) : bannedItems.length > 0 ? (
                    bannedItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => toggleItemSelection(item.id)}
                        style={{ cursor: 'pointer', background: selectedItems.includes(item.id) ? 'rgba(34,197,94,0.1)' : undefined }}
                      >
                        <td style={{ paddingLeft: '24px' }}>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedItems.includes(item.id)
                            ? 'bg-[#01B4EA] border-[#01B4EA]'
                            : 'bg-transparent border-white/20 shadow-sm'
                            }`}>
                            {selectedItems.includes(item.id) && (
                              <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'white', fontWeight: 500 }}>{item.id}</td>
                        <td style={{ color: '#00BCD4', fontWeight: 700, textTransform: 'uppercase' }}>{item.scrip_id}</td>
                        <td>{new Date(item.start_time).toLocaleString()}</td>
                        <td>{new Date(item.end_time).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>
                        No banned limit orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {bannedItems.length > 0 && (
              <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(26,32,53,0.5)' }}>
                <span style={{ color: '#01B4EA', fontSize: '13px', fontWeight: 700 }}>1</span>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {loading ? (
              <div className="loading-overlay">
                <Loader2 className="w-8 h-8 animate-spin text-[#01B4EA]" />
                <span className="text-slate-500 tracking-widest uppercase text-xs">Loading...</span>
              </div>
            ) : bannedItems.length > 0 ? (
              bannedItems.map((item) => (
                <MobileBannedItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onToggle={() => toggleItemSelection(item.id)}
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '32px 0', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px' }}>No banned limit orders found.</div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Back Button */}
          <div className="flex items-center gap-2 mb-4 max-w-4xl mx-auto">
            <button
              onClick={() => navigate('/banned')}
              className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wide transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Bans
            </button>
          </div>

          <div className="card-panel max-w-4xl mx-auto w-full">
            <div className="card-panel-header" style={{ background: 'rgba(26,32,53,0.5)' }}>
              <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                Add New Ban
              </h3>
              <button onClick={() => navigate('/banned')} className="text-slate-400 hover:text-white text-xs uppercase font-bold transition-colors">Cancel</button>
            </div>

            <div className="card-panel-body">
              <div className="filter-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="form-group">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Start Time</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="bg-transparent border-b border-white/20 focus:border-[#4caf50] text-white p-2 w-full text-sm focus:outline-none transition-colors"
                    />
                    <div className="flex items-center gap-1">
                      <select
                        name="startHour"
                        value={formData.startHour}
                        onChange={handleInputChange}
                        className="bg-[#1a2035] border border-white/10 text-white p-2 rounded text-sm focus:outline-none focus:border-[#4caf50]"
                      >
                        {hours.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span className="text-white font-bold">:</span>
                      <select
                        name="startMin"
                        value={formData.startMin}
                        onChange={handleInputChange}
                        className="bg-[#1a2035] border border-white/10 text-white p-2 rounded text-sm focus:outline-none focus:border-[#4caf50]"
                      >
                        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">End Time</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="bg-transparent border-b border-white/20 focus:border-[#4caf50] text-white p-2 w-full text-sm focus:outline-none transition-colors"
                    />
                    <div className="flex items-center gap-1">
                      <select
                        name="endHour"
                        value={formData.endHour}
                        onChange={handleInputChange}
                        className="bg-[#1a2035] border border-white/10 text-white p-2 rounded text-sm focus:outline-none focus:border-[#4caf50]"
                      >
                        {hours.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span className="text-white font-bold">:</span>
                      <select
                        name="endMin"
                        value={formData.endMin}
                        onChange={handleInputChange}
                        className="bg-[#1a2035] border border-white/10 text-white p-2 rounded text-sm focus:outline-none focus:border-[#4caf50]"
                      >
                        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Scrip</label>
                  <SearchableSelect
                    options={scrips}
                    value={formData.scripId}
                    onChange={(val) => setFormData({ ...formData, scripId: val })}
                    placeholder={isDisconnected ? "market not connect" : (hasScrips ? `Select Scrip (${scrips.length})...` : "Fetching symbols...")}
                    labelField="fullDisplayName"
                    valueField="symbol"
                  />
                  {isDisconnected && (
                    <div className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tighter animate-pulse">
                      Market Not Connected — Please check your connection
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Transaction Password</label>
                  <div className={`border-b relative ${formError ? 'border-red-500' : 'border-white/20'}`}>
                    <input
                      type="password"
                      name="transPassword"
                      value={formData.transPassword}
                      onChange={(e) => { setFormError(''); handleInputChange(e); }}
                      placeholder="Enter Transaction Password"
                      className="bg-transparent text-white p-2 w-full text-sm focus:outline-none transition-colors placeholder:text-slate-600"
                    />
                  </div>
                  {formError && (
                    <span className="text-red-400 text-xs font-medium mt-1">{formError}</span>
                  )}
                </div>

                <div className="md:col-span-2 pt-4">
                  <button
                    onClick={handleAddBan}
                    disabled={submitting}
                    className="btn-primary btn-success-gradient w-full"
                    style={{ padding: '12px 48px' }}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Ban'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BannedLimitOrdersPage;
