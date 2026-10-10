import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle, AlertCircle, Loader2, Trash2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TickersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const view = location.pathname.includes('/add') ? 'add' : 'list';
    const [tickers, setTickers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, type: '', text: '' });
    const [deleteModal, setDeleteModal] = useState({ show: false, tickerId: null });

    const [formData, setFormData] = useState({
        startDate: new Date().toISOString().split('T')[0],
        startHour: '00',
        startMin: '00',
        endDate: new Date().toISOString().split('T')[0],
        endHour: '23',
        endMin: '59',
        message: '',
        transactionPassword: ''
    });

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    useEffect(() => {
        if (user?.id) {
            fetchTickers();
        }
    }, [user?.id]);

    const fetchTickers = async () => {
        setLoading(true);
        try {
            const data = await api.getTickers();
            setTickers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (text, type = 'success') => {
        setToast({ show: true, text, type });
        setTimeout(() => setToast({ show: false, text: '', type: '' }), 3000);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.message) {
            showToast('Message is required', 'error');
            return;
        }

        if (!formData.transactionPassword) {
            showToast('Transaction password is required', 'error');
            return;
        }

        const startTime = `${formData.startDate} ${formData.startHour}:${formData.startMin}:00`;
        const endTime = `${formData.endDate} ${formData.endHour}:${formData.endMin}:00`;

        setSubmitting(true);
        try {
            await api.verifyTransactionPassword(formData.transactionPassword);
            await api.createTicker({
                text: formData.message,
                start_time: startTime,
                end_time: endTime
            });
            showToast('Ticker added successfully!', 'success');
            navigate('/tickers');
            setFormData({
                startDate: new Date().toISOString().split('T')[0],
                startHour: '00',
                startMin: '00',
                endDate: new Date().toISOString().split('T')[0],
                endHour: '23',
                endMin: '59',
                message: '',
                transactionPassword: ''
            });
            fetchTickers();
        } catch (err) {
            showToast(err.message || 'Failed to add ticker', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, tickerId: id });
    };

    const confirmDelete = async () => {
        setSubmitting(true);
        try {
            await api.deleteTicker(deleteModal.tickerId);
            showToast('Ticker deleted successfully', 'success');
            setDeleteModal({ show: false, tickerId: null });
            fetchTickers();
        } catch (err) {
            showToast(err.message || 'Failed to delete ticker', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (view === 'add') {
        return (
            <div className="main-content custom-scrollbar" style={{ overflowY: 'auto', height: '100%' }}>
                {/* Toast Notification */}
                {toast.show && (
                    <div className={`fixed top-6 right-6 z-[110] flex items-center gap-3 px-6 py-4 rounded shadow-2xl transition-all border ${
                        toast.type === 'success' ? 'bg-[#1b2a21] border-green-500/30 text-green-400' : 'bg-[#2a1b1b] border-red-500/30 text-red-400'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="text-[14px] font-medium tracking-wide">{toast.text}</p>
                    </div>
                )}

                {/* Back Button */}
                <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={() => navigate('/tickers')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wide transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Tickers
                    </button>
                </div>

                <div className="max-w-6xl w-full mx-auto mt-4">
                    <div className="card-panel relative" style={{ marginTop: '32px' }}>
                        {/* Floating Header Ribbon */}
                        <div className="card-header-success absolute -top-6 left-5 px-6 py-4 z-10">
                            <h2 className="text-white text-[16px] font-normal uppercase leading-none tracking-tight">Add Ticker</h2>
                        </div>

                        <form onSubmit={handleSave} className="card-panel-body" style={{ paddingTop: '48px' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 px-2 lg:px-4">
                                {/* Start Date & Time */}
                                <div className="form-group">
                                    <label className="block text-[#bcc0cf] text-[12px] font-bold uppercase tracking-tight">Start Date</label>
                                    <div className="flex gap-1 items-end">
                                        <div className="flex-1 border-b border-white/10 focus-within:border-[#4caf50] transition-colors">
                                            <input
                                                type="date"
                                                className="w-full bg-transparent text-white py-2 focus:outline-none font-normal text-[15px] scheme-dark"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative border-b border-white/10 focus-within:border-[#4caf50] transition-colors w-24">
                                            <select
                                                className="w-full bg-transparent text-white py-2 focus:outline-none appearance-none font-normal text-[15px]"
                                                value={formData.startHour}
                                                onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
                                            >
                                                {hours.map(h => <option key={h} value={h} className="bg-[#202940]">{h}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-0 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                        <div className="relative border-b border-white/10 focus-within:border-[#4caf50] transition-colors w-24">
                                            <select
                                                className="w-full bg-transparent text-white py-2 focus:outline-none appearance-none font-normal text-[15px]"
                                                value={formData.startMin}
                                                onChange={(e) => setFormData({ ...formData, startMin: e.target.value })}
                                            >
                                                {minutes.map(m => <option key={m} value={m} className="bg-[#202940]">{m}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-0 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* End Date & Time */}
                                <div className="form-group">
                                    <label className="block text-[#bcc0cf] text-[12px] font-bold uppercase tracking-tight">End Date</label>
                                    <div className="flex gap-1 items-end">
                                        <div className="flex-1 border-b border-white/10 focus-within:border-[#4caf50] transition-colors">
                                            <input
                                                type="date"
                                                className="w-full bg-transparent text-white py-2 focus:outline-none font-normal text-[15px] scheme-dark"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative border-b border-white/10 focus-within:border-[#4caf50] transition-colors w-24">
                                            <select
                                                className="w-full bg-transparent text-white py-2 focus:outline-none appearance-none font-normal text-[15px]"
                                                value={formData.endHour}
                                                onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
                                            >
                                                {hours.map(h => <option key={h} value={h} className="bg-[#202940]">{h}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-0 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                        <div className="relative border-b border-white/10 focus-within:border-[#4caf50] transition-colors w-24">
                                            <select
                                                className="w-full bg-transparent text-white py-2 focus:outline-none appearance-none font-normal text-[15px]"
                                                value={formData.endMin}
                                                onChange={(e) => setFormData({ ...formData, endMin: e.target.value })}
                                            >
                                                {minutes.map(m => <option key={m} value={m} className="bg-[#202940]">{m}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-0 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="form-group">
                                    <label className="block text-[#bcc0cf] text-[12px] font-bold uppercase tracking-tight">Message</label>
                                    <div className="border-b border-white/10 focus-within:border-[#4caf50] transition-colors">
                                        <textarea
                                            className="w-full bg-transparent text-white py-2 focus:outline-none font-normal text-[15px] min-h-[40px] appearance-none"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Enter message"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                {/* Transaction Password */}
                                <div className="form-group">
                                    <label className="block text-[#bcc0cf] text-[12px] font-bold uppercase tracking-tight">Transaction Password</label>
                                    <div className="border-b border-white/10 focus-within:border-[#4caf50] transition-colors">
                                        <input
                                            type="password"
                                            className="w-full bg-transparent text-white py-2 focus:outline-none font-normal text-[15px]"
                                            value={formData.transactionPassword}
                                            onChange={(e) => setFormData({ ...formData, transactionPassword: e.target.value })}
                                            placeholder="******"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="action-row" style={{ paddingTop: '40px', paddingLeft: '8px' }}>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary btn-success-gradient"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/tickers')}
                                    className="btn-secondary"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content custom-scrollbar" style={{ overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-[110] flex items-center gap-3 px-6 py-4 rounded shadow-2xl transition-all border ${
                    toast.type === 'success' ? 'bg-[#1b2a21] border-green-500/30 text-green-400' : 'bg-[#2a1b1b] border-red-500/30 text-red-400'
                }`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-[14px] font-medium tracking-wide">{toast.text}</p>
                </div>
            )}

            <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>Showing <span className="text-white font-bold">{tickers.length}</span> of items.</span>
            </div>

            <div className="action-row">
                <button
                    onClick={() => navigate('/tickers/add')}
                    className="btn-primary"
                    style={{ background: '#c026d3' }}
                >
                    ADD TICKER
                </button>
            </div>

            {/* Tickers Table */}
            <div className="card-panel" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div className="loading-overlay">
                        <Loader2 className="w-8 h-8 animate-spin text-[#c026d3]" />
                    </div>
                ) : tickers.length > 0 ? (
                    <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                        <table className="table-standard custom-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>ID</th>
                                    <th>Message</th>
                                    <th style={{ width: '192px' }}>Start Time</th>
                                    <th style={{ width: '192px' }}>End Time</th>
                                    <th style={{ width: '96px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickers.map(ticker => (
                                    <tr key={ticker.id}>
                                        <td style={{ fontWeight: 500 }}>{ticker.id}</td>
                                        <td>{ticker.text}</td>
                                        <td>{ticker.start_time ? new Date(ticker.start_time).toLocaleString() : 'N/A'}</td>
                                        <td>{ticker.end_time ? new Date(ticker.end_time).toLocaleString() : 'N/A'}</td>
                                        <td>
                                            <button
                                                onClick={() => handleDeleteClick(ticker.id)}
                                                className="action-icon action-icon-delete"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                        No tickers found. Click "ADD TICKER" to create one.
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="modal-responsive bg-[#1e253a] border border-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100">
                        <div className="flex justify-between items-center p-4 border-b border-white/5">
                            <h3 className="text-white font-bold text-lg">Remove Ticker</h3>
                            <button
                                onClick={() => setDeleteModal({ show: false, tickerId: null })}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 text-center">
                            <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-slate-300 text-base mb-2">Are you sure you want to delete this ticker?</p>
                        </div>
                        <div className="flex p-4 gap-3 bg-black/20">
                            <button
                                onClick={() => setDeleteModal({ show: false, tickerId: null })}
                                className="btn-secondary flex-1"
                                style={{ borderRadius: '8px' }}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={submitting}
                                className="btn-danger flex-1"
                                style={{ borderRadius: '8px' }}
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'DELETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TickersPage;
