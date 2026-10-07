import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import * as api from '../services/api';
import SearchableSelect from './SearchableSelect';

const CreateFundForm = ({ onSave, onBack, mode = 'deposit', initialUser }) => {
  const location = useLocation();
  // Support both initialUser prop (from App.jsx) and location.state.selectedClient (from ViewBrokerPage)
  const effectiveUser = initialUser || location.state?.selectedClient;
  const isWithdraw = mode === 'withdraw';

  const isEdit = !!effectiveUser?._fundId;

  const [formData, setFormData] = useState({
    userId: effectiveUser?.id ? String(effectiveUser.id) : '',
    notes: (effectiveUser?._fundNotes && effectiveUser._fundNotes !== '—') ? effectiveUser._fundNotes : '',
    amount: effectiveUser?._fundAmount || '',
    transactionPassword: '',
    transactionType: effectiveUser?._fundType ? effectiveUser._fundType.toLowerCase() : (mode || 'deposit')
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', text: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset form when effectiveUser changes (e.g., from edit to create mode or from navigation)
  useEffect(() => {
    console.log('[CreateFundForm] effectiveUser received:', effectiveUser);
    setFormData({
      userId: effectiveUser?.id ? String(effectiveUser.id) : '',
      notes: (effectiveUser?._fundNotes && effectiveUser._fundNotes !== '—') ? effectiveUser._fundNotes : '',
      amount: effectiveUser?._fundAmount || '',
      transactionPassword: '',
      transactionType: effectiveUser?._fundType ? effectiveUser._fundType.toLowerCase() : (mode || 'deposit')
    });
  }, [effectiveUser, mode]);

  // Ensure effectiveUser is in the users list if provided
  useEffect(() => {
    if (effectiveUser?.id && users.length > 0) {
      const userExists = users.find(u => u.id === effectiveUser.id);
      if (!userExists && effectiveUser.username) {
        console.log('[CreateFundForm] Adding effectiveUser to options:', effectiveUser);
        setUsers(prev => [...prev, effectiveUser]);
      }
    }
  }, [effectiveUser, users]);


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getClients();
      setUsers(Array.isArray(data) ? data.filter(u => u.role === 'TRADER') : []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast({ show: false, text: '', type: '' }), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      // Remove any non-numeric and non-decimal characters (strictly block -, +, e, etc.)
      let clean = value.replace(/[^0-9.]/g, '');
      const parts = clean.split('.');
      if (parts.length > 2) {
        clean = parts[0] + '.' + parts.slice(1).join('');
      }
      setFormData(prev => ({ ...prev, amount: clean }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.userId) { setFormError('Please select a user'); return; }
    
    const parsedAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0');
      return;
    }
    if (!formData.transactionPassword) { setFormError('Please enter transaction password'); return; }

    setSubmitting(true);
    try {
      await api.verifyTransactionPassword(formData.transactionPassword);

      const cleanAmount = String(parsedAmount);

      if (isEdit) {
        await api.updateFund(effectiveUser._fundId, {
          amount: cleanAmount,
          notes: formData.notes,
          mode: formData.transactionType
        });
      } else {
        await api.createFund({
          ...formData,
          amount: cleanAmount,
          mode: formData.transactionType
        });
      }
      setFormError('');
      showToast(isEdit ? 'Fund updated successfully!' : 'Fund processed successfully!', 'success');
      setTimeout(() => onSave?.(formData), 300);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to process fund';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#1a2035] font-sans relative pb-24 sm:pb-12">
      {/* Toast Notification */}
      {toast.show && (
          <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded shadow-2xl transition-all border ${
              toast.type === 'success' ? 'bg-[#1b2a21] border-green-500/30 text-green-400' : 'bg-[#2a1b1b] border-red-500/30 text-red-400'
          }`}>
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-[14px] font-medium tracking-wide">{toast.text}</p>
          </div>
      )}

      <div className="max-w-6xl mx-auto pt-0">

        {/* Floating Card Header (3D Ribbon Style) */}
        <div className="relative z-20 -mb-8 ml-4 flex flex-col items-start translate-y-2">
          <div
            className="px-8 py-4 rounded-md shadow-[0_4px_20px_0_rgba(0,0,0,0.3)] relative z-10"
            style={{ background: 'linear-gradient(60deg, #66bb6a, #43a047)' }}
          >
            <h4 className="text-white text-[18px] font-bold m-0 tracking-wide">
              {isEdit ? 'Edit Fund' : 'Create Fund'}
            </h4>
          </div>
          {/* The 3D fold decorator */}
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#2e7d32] -z-10 rounded-sm transform rotate-45"></div>
        </div>

        {/* Card Container */}
        <div className="bg-[#202940] rounded shadow-2xl relative border border-white/5 pt-16 pb-12 px-4 sm:px-8 md:px-12">
          <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-12">

            {/* Row 1: User ID and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-10">
              {/* User ID */}
              <div>
                <label className="block text-[#bcc0cf] text-[15px] font-normal mb-3">
                  Username {loading && <Loader2 className="inline w-3 h-3 animate-spin ml-2" />}
                </label>
                <SearchableSelect
                  options={users}
                  value={formData.userId}
                  onChange={(val) => setFormData({ ...formData, userId: val })}
                  placeholder="Select User"
                  labelField="username"
                  valueField="id"
                />
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-[#bcc0cf] text-[15px] font-normal mb-1">
                  Transaction Type
                </label>
                <div className="relative pt-3">
                  <select
                    name="transactionType"
                    value={formData.transactionType}
                    onChange={handleChange}
                    className="w-full bg-white text-black font-bold px-4 py-2 text-[15px] border border-gray-300 rounded-sm appearance-none cursor-pointer outline-none shadow-sm"
                    disabled={submitting}
                  >
                    <option value="deposit" className="font-bold">DEPOSIT (AD)</option>
                    <option value="withdraw" className="font-bold">WITHDRAW (WD)</option>
                  </select>
                  <div className="absolute right-3 top-[34px] pointer-events-none text-black">
                     <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-1">
                <label className="block text-[#bcc0cf] text-[15px] font-normal mb-1 ml-1">
                  Notes
                </label>
                <div className="pt-3">
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={submitting}
                    className="w-full bg-white text-black font-bold px-4 py-2 text-[15px] border border-gray-300 rounded shadow-sm outline-none focus:border-green-500 transition-all"
                    placeholder="Enter transaction details..."
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Funds and Transaction Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-10">
              {/* Funds */}
              <div>
                <label className="block text-[#bcc0cf] text-[15px] font-normal mb-1">
                  Funds
                </label>
                <div className="pt-3">
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    min="0.01"
                    step="any"
                    disabled={submitting}
                    className="w-full bg-white text-black font-bold px-4 py-2 text-[15px] border border-gray-300 rounded shadow-sm outline-none focus:border-green-500 transition-all font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Transaction Password */}
              <div>
                <label className="block text-[#bcc0cf] text-[15px] font-normal mb-1">
                  Transaction Password
                </label>
                <div className="pt-3">
                  <input
                    type="password"
                    name="transactionPassword"
                    value={formData.transactionPassword}
                    onChange={handleChange}
                    disabled={submitting}
                    autoComplete="new-password"
                    className="w-full bg-white text-black font-bold px-4 py-2 text-[15px] border border-gray-300 rounded shadow-sm outline-none focus:border-green-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="flex items-center gap-3 px-5 py-4 rounded bg-red-500/10 border border-red-500/30 mt-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-400 text-[14px] font-semibold">{formError}</p>
                <button onClick={() => setFormError('')} className="ml-auto text-red-400/60 hover:text-red-400">
                  <span className="text-lg">&times;</span>
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-8 flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#4caf50] hover:bg-[#43a047] text-white px-10 py-2.5 rounded shadow-[0_4px_10px_0_rgba(76,175,80,0.3)] font-bold text-[14px] uppercase transition-all disabled:opacity-60 active:scale-95"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? 'UPDATE' : 'SAVE')}
              </button>
              <button
                type="button"
                onClick={onBack}
                disabled={submitting}
                className="bg-[#607d8b] hover:bg-[#546e7a] text-white font-bold py-2.5 px-10 rounded shadow-lg uppercase tracking-wider text-[11px] transition-all disabled:opacity-50 active:scale-95"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateFundForm;
