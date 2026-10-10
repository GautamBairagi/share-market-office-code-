import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import * as api from '../../services/api';

const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const pad = (num) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

const FundDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [fund, setFund] = useState(location.state?.fund || null);
    const [loading, setLoading] = useState(!fund);

    useEffect(() => {
        if (!fund && id) {
            const fetchFund = async () => {
                try {
                    const data = await api.getTraderFunds();
                    const matched = data.find(f => String(f.id) === String(id));
                    if (matched) {
                        setFund({
                            id: matched.id,
                            user_id: matched.user_id,
                            username: matched.username,
                            name: matched.full_name || '—',
                            amount: matched.amount,
                            txnType: matched.type,
                            notes: matched.remarks || '—',
                            pgTxnId: matched.pg_txn_id || matched.pgTxnId || '—',
                            createdAt: matched.created_at
                        });
                    }
                } catch (err) {
                    console.error('Failed to load fund details:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchFund();
        }
    }, [id, fund]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-slate-400">
                Loading details...
            </div>
        );
    }

    if (!fund) {
        return (
            <div className="space-y-4 p-4">
                <button onClick={() => navigate('/funds')} className="flex items-center gap-2 text-white hover:text-green-400 font-bold text-sm">
                    <ArrowLeft className="w-5 h-5" /> BACK
                </button>
                <div className="bg-[#1f283e] p-6 rounded-lg border border-white/10 text-center text-slate-400">
                    Transaction detail not found.
                </div>
            </div>
        );
    }

    const isDeposit = (fund.txnType || '').toUpperCase() === 'DEPOSIT';

    return (
        <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 w-full">
            {/* Back Button */}
            <div className="flex items-center gap-2 sm:gap-4">
                <button
                    onClick={() => navigate('/funds')}
                    className="flex items-center gap-2 text-white hover:text-green-400 transition-colors font-bold text-xs sm:text-sm"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> BACK
                </button>
            </div>

            {/* Transaction Detail Table View */}
            <div className="bg-[#1a2035] border-t-4 border-[#4CAF50] rounded-lg shadow-2xl max-w-4xl w-full overflow-hidden">
                <table className="w-full border-collapse border border-white/10 text-left text-sm text-slate-300">
                    <tbody>
                        <tr className="border-b border-white/10">
                            <td className="w-1/3 px-4 py-3 font-bold bg-[#1f283e] border-r border-white/10">ID</td>
                            <td className="px-4 py-3 text-white">{fund.id}</td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="w-1/3 px-4 py-3 font-bold bg-[#1f283e] border-r border-white/10">User ID</td>
                            <td className="px-4 py-3 text-white">{fund.user_id}</td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="w-1/3 px-4 py-3 font-bold bg-[#1f283e] border-r border-white/10">username</td>
                            <td className="px-4 py-3 text-white">{fund.username}</td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="w-1/3 px-4 py-3 font-bold bg-[#1f283e] border-r border-white/10">Amount</td>
                            <td className="px-4 py-3 text-white font-mono">{fund.amount}</td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="w-1/3 px-4 py-3 font-bold bg-[#1f283e] border-r border-white/10">Notes</td>
                            <td className="px-4 py-3 text-white min-h-[20px]">{fund.notes || ''}</td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="w-1/3 px-4 py-3 font-bold bg-[#1f283e] border-r border-white/10">Transaction for</td>
                            <td className="px-4 py-3 text-white">{isDeposit ? 'Deposit' : 'Withdraw'}</td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="w-1/3 px-4 py-3 font-bold bg-[#1f283e] border-r border-white/10">Transaction Type</td>
                            <td className="px-4 py-3 text-white">{isDeposit ? 'Added' : 'Deducted'}</td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="w-1/3 px-4 py-3 font-bold bg-[#1f283e] border-r border-white/10">Created At</td>
                            <td className="px-4 py-3 text-white">{formatDate(fund.createdAt)}</td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="w-1/3 px-4 py-3 font-bold bg-[#1f283e] border-r border-white/10">Modified At</td>
                            <td className="px-4 py-3 text-white">{formatDate(fund.createdAt)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FundDetailPage;
