import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as api from '../../services/api';

const NewClientBankDetailsPage = () => {
  const [formData, setFormData] = useState({
    accountHolder: '',
    accountNumber: '',
    bankName: '',
    ifsc: '',
    phonePe: '',
    googlePay: '',
    paytm: '',
    upiId: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', text: '' });

  const showToast = (text, type = 'success') => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type: '', text: '' }), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await api.getNewClientBank();
        setFormData({
          accountHolder: data.account_holder || '',
          accountNumber: data.account_number || '',
          bankName: data.bank_name || '',
          ifsc: data.ifsc || '',
          phonePe: data.phone_pe || '',
          googlePay: data.google_pay || '',
          paytm: data.paytm || '',
          upiId: data.upi_id || ''
        });
      } catch (err) {
        showToast(err.message || 'Failed to load details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.updateNewClientBank(formData);
      showToast('Bank details updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { name: 'accountHolder', label: 'Account Holder' },
    { name: 'accountNumber', label: 'Account Number' },
    { name: 'bankName', label: 'Bank Name' },
    { name: 'ifsc', label: 'IFSC' },
    { name: 'phonePe', label: 'PhonePe' },
    { name: 'googlePay', label: 'Google Pay' },
    { name: 'paytm', label: 'Paytm' },
    { name: 'upiId', label: 'UPI ID' },
  ];

  return (
    <div className="main-content custom-scrollbar" style={{ overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded shadow-2xl text-white text-[14px] font-medium ${toast.type === 'success' ? 'bg-[#16a34a]' : 'bg-[#dc2626]'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="card-header-success" style={{ display: 'inline-block' }}>
          <h2 className="text-base font-semibold text-white">Bank Account Details</h2>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay">
          <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50]" />
        </div>
      ) : (
        <div className="card-panel">
          <div className="card-panel-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {fields.map(field => (
                <div key={field.name} className="form-group">
                  <label className="block text-slate-400 text-sm">{field.label}</label>
                  <input
                    type="text"
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-slate-700 text-white py-1 focus:outline-none focus:border-[#4CAF50] transition-colors"
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: '40px' }}>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="btn-primary btn-success-gradient"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'UPDATE DETAILS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewClientBankDetailsPage;
