import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, FileUp, X, CheckCircle, ChevronLeft, Eye } from 'lucide-react';
import * as api from '../../services/api';

const KycUploadPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [documents, setDocuments] = useState({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(null); // Key being uploaded

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getClientById(id);
                setClient(data.profile || data);
                setDocuments(data.documents || {});
            } catch (err) {
                console.error('Failed to load client:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleFileUpload = async (key, file) => {
        if (!file) return;
        setUploading(key);
        
        // Map frontend snake_case keys to backend camelCase keys
        const keyMap = {
            'pan_screenshot': 'panScreenshot',
            'aadhar_front': 'aadharFront',
            'aadhar_back': 'aadharBack',
            'bank_proof': 'bankProof'
        };
        const backendKey = keyMap[key] || key;

        const fd = new FormData();
        fd.append(backendKey, file);
        try {
            await api.updateDocuments(id, fd);
            // Reload docs
            const data = await api.getClientById(id);
            setDocuments(data.documents || {});
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(null);
        }
    };

    const [kycUpdating, setKycUpdating] = useState(false);

    const handleKycAction = async (status) => {
        setKycUpdating(true);
        try {
            const fd = new FormData();
            fd.append('kycStatus', status);
            await api.updateDocuments(id, fd);
            const data = await api.getClientById(id);
            setDocuments(data.documents || {});
            // Auto-navigate back after successful approval/rejection
            setTimeout(() => {
                navigate(-1);
            }, 500);
        } catch (err) {
            alert('Failed to update KYC: ' + (err.response?.data?.message || err.message));
        } finally {
            setKycUpdating(false);
        }
    };

    const statusMap = {
        'VERIFIED': 'APPROVED',
        'REJECTED': 'REJECTED',
        'PENDING': 'PENDING'
    };
    const kycStatus = statusMap[documents.kyc_status] || 'PENDING';

    const docSlots = [
        { key: 'pan_screenshot', label: 'PAN CARD' },
        { key: 'aadhar_front', label: 'AADHAAR FRONT' },
        { key: 'aadhar_back', label: 'AADHAAR BACK' },
        { key: 'bank_proof', label: 'BANK PROOF / CHEQUE' },
    ];

    if (loading) return (
        <div className="min-h-screen bg-[#1a2035] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#1a2035] text-white p-4 sm:p-8 md:p-12 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto">
                
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-10">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                    >
                        <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        <span className="text-[13px] font-bold uppercase tracking-widest">Back to Details</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Client:</span>
                        <span className="text-[13px] font-black text-[#01B4EA]">{client?.full_name || client?.fullName || 'N/A'}</span>
                    </div>
                </div>

                {/* Main Heading Section matching screenshot */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white/[0.02] p-6 rounded-2xl border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
                            <ShieldCheck className="w-8 h-8 text-orange-500" />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-black uppercase tracking-tight flex items-center gap-3">
                                KYC / DOCUMENT VERIFICATION 
                                <span className="text-red-500 text-[11px] font-bold tracking-[0.2em]">* MANDATORY</span>
                            </h1>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.3em] mt-1 opacity-70">
                                OFFICIAL IDENTITY & COMPLIANCE DOCUMENTS
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-6 py-2 rounded-full border text-[11px] font-black uppercase tracking-[0.15em] shadow-lg ${
                            kycStatus === 'APPROVED' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                            kycStatus === 'REJECTED' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                            'bg-orange-500/10 border-orange-500/30 text-orange-400'
                        }`}>
                            STATUS: {kycStatus}
                        </div>
                        {kycStatus !== 'APPROVED' && (
                            <button
                                onClick={() => handleKycAction('VERIFIED')}
                                disabled={kycUpdating}
                                className="px-5 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                {kycUpdating ? '...' : 'APPROVE'}
                            </button>
                        )}
                        {kycStatus !== 'REJECTED' && (
                            <button
                                onClick={() => handleKycAction('REJECTED')}
                                disabled={kycUpdating}
                                className="px-5 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                {kycUpdating ? '...' : 'REJECT'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Documents Grid matching screenshot layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {docSlots.map((slot) => {
                        const fileUrl = documents[slot.key];
                        const isUploaded = !!fileUrl;
                        const isCurrentUploading = uploading === slot.key;

                        return (
                            <div key={slot.key} className="flex flex-col gap-3">
                                <span className="text-[11px] font-black text-slate-400 tracking-[0.1em] px-1 uppercase text-center">
                                    {slot.label}
                                </span>
                                
                                <div className={`
                                    relative aspect-square rounded-[32px] border-2 border-dashed transition-all duration-300 overflow-hidden flex flex-col items-center justify-center group
                                    ${isUploaded ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/[0.02] hover:border-purple-500/40 hover:bg-white/[0.04]'}
                                `}>
                                    
                                    {/* Content based on state */}
                                    {isUploaded ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 relative">
                                            {/* Clickable preview/header to view the file in a new tab */}
                                            <div
                                                className="z-10 w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer"
                                                onClick={() => window.open(fileUrl, '_blank')}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => { if (e.key === 'Enter') window.open(fileUrl, '_blank'); }}
                                            >
                                                {/* Preview if image */}
                                                {!(fileUrl.toLowerCase().endsWith('.pdf')) ? (
                                                    <img 
                                                        src={fileUrl} 
                                                        alt={slot.label} 
                                                        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-10 transition-opacity" 
                                                        crossOrigin="anonymous"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                                        <ShieldCheck className="w-32 h-32" />
                                                    </div>
                                                )}

                                                <div className="bg-green-500/20 p-4 rounded-full border border-green-500/30 shadow-lg">
                                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-green-400 tracking-widest uppercase">UPLOADED</span>
                                            </div>

                                            {/* Overlay showing View action (opens file) */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a2035]/80 backdrop-blur-md">
                                                <button
                                                    className="w-[140px] bg-white/10 hover:bg-white/20 text-white py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-2"
                                                    onClick={(e) => { e.stopPropagation(); window.open(fileUrl, '_blank'); }}
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> VIEW FILE
                                                </button>
                                                
                                                <label className="w-[140px] bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-purple-500/30 flex items-center justify-center gap-2 cursor-pointer">
                                                    {isCurrentUploading ? (
                                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-purple-500"></div>
                                                    ) : (
                                                        <>
                                                            <FileUp className="w-3.5 h-3.5" /> REPLACE
                                                        </>
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        onChange={(e) => handleFileUpload(slot.key, e.target.files[0])}
                                                        disabled={isCurrentUploading}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center gap-5 cursor-pointer">
                                            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-inner transition-transform duration-300 group-hover:scale-110">
                                                {isCurrentUploading ? (
                                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                                                ) : (
                                                    <FileUp className="w-10 h-10 text-slate-500 group-hover:text-purple-400 transition-colors" />
                                                )}
                                            </div>
                                            <span className="text-[11px] font-black text-slate-400 group-hover:text-white transition-colors tracking-[0.2em] uppercase">
                                                {isCurrentUploading ? 'UPLOADING...' : 'SELECT DOCUMENT'}
                                            </span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                onChange={(e) => handleFileUpload(slot.key, e.target.files[0])}
                                                disabled={isCurrentUploading}
                                            />
                                        </label>
                                    )}

                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Optional help text */}
                <div className="mt-16 flex items-center justify-center gap-3 text-slate-600">
                    <div className="w-12 h-[1px] bg-white/5"></div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em]">All documents must be clear and legible</p>
                    <div className="w-12 h-[1px] bg-white/5"></div>
                </div>
            </div>
        </div>
    );
};

export default KycUploadPage;
