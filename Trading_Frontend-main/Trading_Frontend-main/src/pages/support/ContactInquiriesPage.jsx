import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, Clock, CheckCircle2, AlertCircle, Trash2, Search, Filter, RefreshCw, UserCheck } from 'lucide-react';
import { getContactInquiries, updateContactInquiry, deleteContactInquiry } from '../../services/api';

const ContactInquiriesPage = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (searchQuery.trim()) params.search = searchQuery.trim();

            const res = await getContactInquiries(params);
            setInquiries(Array.isArray(res) ? res : res?.data || []);
        } catch (err) {
            console.error('Failed to fetch contact inquiries:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, [statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchInquiries();
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateContactInquiry(id, { status: newStatus });
            setInquiries(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
            if (selectedInquiry?.id === id) {
                setSelectedInquiry(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            alert('Failed to update status: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleSaveRemarks = async (id) => {
        setActionLoading(true);
        try {
            await updateContactInquiry(id, { remarks });
            setInquiries(prev => prev.map(item => item.id === id ? { ...item, remarks } : item));
            if (selectedInquiry?.id === id) {
                setSelectedInquiry(prev => ({ ...prev, remarks }));
            }
            alert('Remarks updated successfully!');
        } catch (err) {
            alert('Failed to save remarks: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
        try {
            await deleteContactInquiry(id);
            setInquiries(prev => prev.filter(item => item.id !== id));
            if (selectedInquiry?.id === id) setSelectedInquiry(null);
        } catch (err) {
            alert('Failed to delete inquiry: ' + (err.response?.data?.message || err.message));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'RESOLVED':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resolved</span>;
            case 'CONTACTED':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Contacted</span>;
            default:
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-xl border border-slate-800 backdrop-blur-sm">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <MessageSquare className="w-6 h-6 text-green-400" />
                        Contact Inquiries (Leads)
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Queries and callback requests submitted from Mobile App & Webview login screen.
                    </p>
                </div>
                <button
                    onClick={fetchInquiries}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-400' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                    <input
                        type="text"
                        placeholder="Search by name, phone, message..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </form>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    {['ALL', 'PENDING', 'CONTACTED', 'RESOLVED'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                                statusFilter === s
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table / Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List of inquiries */}
                <div className={`space-y-3 ${selectedInquiry ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-green-400 mb-2" />
                            Loading inquiries...
                        </div>
                    ) : inquiries.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                            No contact inquiries found.
                        </div>
                    ) : (
                        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
                                        <tr>
                                            <th className="py-3 px-4">Date & Time</th>
                                            <th className="py-3 px-4">Name</th>
                                            <th className="py-3 px-4">Phone Number</th>
                                            <th className="py-3 px-4">Message</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {inquiries.map((item) => (
                                            <tr
                                                key={item.id}
                                                onClick={() => {
                                                    setSelectedInquiry(item);
                                                    setRemarks(item.remarks || '');
                                                }}
                                                className={`hover:bg-slate-800/40 cursor-pointer transition ${
                                                    selectedInquiry?.id === item.id ? 'bg-slate-800/60' : ''
                                                }`}
                                            >
                                                <td className="py-3 px-4 text-slate-400 font-mono text-xs whitespace-nowrap">
                                                    {new Date(item.created_at).toLocaleString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                                                    {item.name}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-emerald-400 whitespace-nowrap">
                                                    <a
                                                        href={`tel:${item.phone}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="hover:underline flex items-center gap-1.5"
                                                    >
                                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                        {item.phone}
                                                    </a>
                                                </td>
                                                <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                                                    {item.message}
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    {getStatusBadge(item.status)}
                                                </td>
                                                <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                                                        title="Delete Inquiry"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Detail View Panel */}
                {selectedInquiry && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 h-fit sticky top-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-white text-base">Inquiry #{selectedInquiry.id}</h3>
                            <button
                                onClick={() => setSelectedInquiry(null)}
                                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs sm:text-sm">
                            <div>
                                <label className="text-slate-500 font-semibold uppercase text-[10px]">Name</label>
                                <div className="text-white font-medium text-base">{selectedInquiry.name}</div>
                            </div>

                            <div>
                                <label className="text-slate-500 font-semibold uppercase text-[10px]">Phone Number</label>
                                <div className="text-emerald-400 font-mono font-medium text-base">
                                    <a href={`tel:${selectedInquiry.phone}`} className="hover:underline flex items-center gap-2">
                                        <Phone className="w-4 h-4" /> {selectedInquiry.phone}
                                    </a>
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-500 font-semibold uppercase text-[10px]">Submitted At</label>
                                <div className="text-slate-300 font-mono">
                                    {new Date(selectedInquiry.created_at).toLocaleString('en-IN')}
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-500 font-semibold uppercase text-[10px]">Message</label>
                                <div className="p-3 bg-slate-950/80 rounded-lg text-slate-200 border border-slate-800/80 whitespace-pre-wrap leading-relaxed mt-1">
                                    {selectedInquiry.message}
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="text-slate-500 font-semibold uppercase text-[10px]">Status</label>
                                <div className="grid grid-cols-3 gap-2 mt-1.5">
                                    {['PENDING', 'CONTACTED', 'RESOLVED'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handleStatusChange(selectedInquiry.id, s)}
                                            className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                                                selectedInquiry.status === s
                                                    ? 'bg-green-600 text-white border-green-500'
                                                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="text-slate-500 font-semibold uppercase text-[10px]">Admin Remarks / Follow-up</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add notes about call, follow-up or resolution..."
                                    rows={3}
                                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-500 mt-1"
                                />
                                <button
                                    onClick={() => handleSaveRemarks(selectedInquiry.id)}
                                    disabled={actionLoading}
                                    className="mt-2 w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-lg transition"
                                >
                                    {actionLoading ? 'Saving...' : 'Save Remarks'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactInquiriesPage;
