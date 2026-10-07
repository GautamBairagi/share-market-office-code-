import React, { useState, useEffect } from 'react';
import { Plus, Search, X, SquarePen, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import * as api from '../../services/api';

const BankDetailsPage = () => {
  const [bankData, setBankData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', text: '' });

  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newBank, setNewBank] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    branch: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (text, type = 'success') => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type: '', text: '' }), 3000);
  };

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const data = await api.getBanks();
      setBankData(data);
    } catch (err) {
      showToast(err.message || 'Failed to load bank details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (!showAddModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [showAddModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBank(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (bank) => {
    setNewBank({
      bankName: bank.bank_name,
      accountHolder: bank.account_holder,
      accountNumber: bank.account_number,
      ifsc: bank.ifsc,
      branch: bank.branch
    });
    setEditingId(bank.id);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleting(true);
      await api.deleteBank(deleteConfirm);
      showToast('Bank deleted successfully', 'success');
      setDeleteConfirm(null);
      fetchBanks();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.toggleBankStatus(id);
      showToast(`Status changed to ${res.status}`, 'success');
      fetchBanks();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await api.updateBank(editingId, { ...newBank, status: bankData.find(b => b.id === editingId)?.status || 'Active' });
        showToast('Bank account updated successfully!', 'success');
      } else {
        await api.createBank(newBank);
        showToast('Bank account added successfully!', 'success');
      }
      handleCloseModal();
      fetchBanks();
    } catch (err) {
      showToast(err.message || 'Failed to save bank', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setIsEditing(false);
    setEditingId(null);
    setNewBank({ bankName: '', accountHolder: '', accountNumber: '', ifsc: '', branch: '' });
  };

  const filteredBankData = bankData.filter(bank => {
    const matchesSearch = bank.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.account_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'All Status' || bank.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="main-content custom-scrollbar" style={{ overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded shadow-2xl text-white text-[14px] font-medium ${toast.type === 'success' ? 'bg-[#16a34a]' : 'bg-[#dc2626]'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="page-header-responsive">
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary btn-success-gradient"
        >
          <Plus className="w-4 h-4" /> Add New Bank
        </button>
      </div>

      {/* Filter Bar */}
      <div className="custom-filter" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by bank or account number..."
            className="w-full bg-[#1c2638] border border-[#2d3748] text-white pl-10 pr-4 py-2 rounded text-sm focus:outline-none focus:border-[#01B4EA] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1c2638] border border-[#2d3748] text-white px-4 py-2 rounded text-sm focus:outline-none focus:border-[#01B4EA]"
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div className="loading-overlay">
            <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50]" />
          </div>
        ) : (
          <div className="table-wrapper" style={{ flex: 1, border: 'none', borderRadius: 0 }}>
            <table className="table-standard custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th style={{ fontWeight: 700 }}>Bank Name</th>
                  <th>Account Holder</th>
                  <th>Account Number</th>
                  <th>IFSC Code</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBankData.length > 0 ? (
                  filteredBankData.map((bank) => (
                    <tr key={bank.id} className="group">
                      <td style={{ color: '#64748b' }}>#{bank.id}</td>
                      <td style={{ fontWeight: 600, color: 'white' }}>{bank.bank_name}</td>
                      <td>{bank.account_holder}</td>
                      <td style={{ color: '#01B4EA', fontFamily: 'monospace' }}>{bank.account_number}</td>
                      <td style={{ fontFamily: 'monospace' }}>{bank.ifsc}</td>
                      <td>{bank.branch}</td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(bank.id)}
                          className={`badge badge-interactive ${bank.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}
                        >
                          {bank.status}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 8px', minWidth: '100px' }}>
                        <div className="action-icons" style={{ justifyContent: 'center', gap: '10px' }}>
                          <button
                            onClick={() => handleEdit(bank)}
                            className="action-icon action-icon-edit"
                            title="Edit"
                          >
                            <SquarePen size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(bank.id)}
                            className="action-icon action-icon-delete"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontStyle: 'italic', fontWeight: 500 }}>
                      No bank records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(28,38,56,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Showing {filteredBankData.length} records</p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="modal-responsive bg-[#202940] rounded-lg border border-red-500/30 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-[#2d3748]">
              <h3 className="text-white font-bold text-lg">Confirm Delete</h3>
              <button onClick={() => setDeleteConfirm(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-slate-300 text-base mb-6">Are you sure you want to delete this bank account? This action cannot be undone.</p>
            </div>
            <div className="p-4 border-t border-[#2d3748] flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1" style={{ borderRadius: '6px' }}>
                CANCEL
              </button>
              <button onClick={confirmDelete} disabled={deleting} className="btn-danger flex-1" style={{ borderRadius: '6px' }}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={handleCloseModal}
        >
          <div
            className="modal-responsive bg-[#202940] rounded-lg border border-[#2d3748] shadow-2xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-[#2d3748]">
              <h3 className="text-white font-bold text-lg">{isEditing ? 'Edit Bank Account' : 'Add New Bank Account'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
              {[
                { label: 'Bank Name', name: 'bankName', placeholder: 'e.g. HDFC Bank' },
                { label: 'Account Holder Name', name: 'accountHolder', placeholder: 'e.g. SHRI SHRINATH JI TRADERS' },
                { label: 'Account Number', name: 'accountNumber', placeholder: 'Enter Account Number' },
                { label: 'IFSC Code', name: 'ifsc', placeholder: 'Enter IFSC Code' },
                { label: 'Branch Name', name: 'branch', placeholder: 'Enter Branch Name' },
              ].map(field => (
                <div key={field.name} className="form-group">
                  <label className="block text-slate-400 text-xs uppercase font-bold mb-1">{field.label}</label>
                  <input
                    name={field.name}
                    value={newBank[field.name]}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#1c2638] border border-[#2d3748] rounded px-3 py-2 text-white focus:outline-none focus:border-[#4CAF50]"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1" style={{ borderRadius: '6px' }}>
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="btn-primary btn-success-gradient flex-1" style={{ borderRadius: '6px' }}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? 'UPDATE BANK' : 'SAVE BANK')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDetailsPage;
