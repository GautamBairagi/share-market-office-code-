import React, { useState, useEffect } from 'react';
import { getTraderFunds } from '../services/api';

const FundWithdrawalTable = ({ clientId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const filters = clientId ? { user_id: clientId } : {};
        const response = await getTraderFunds(filters);
        setData(response || []);
      } catch (err) {
        console.error('FundWithdrawalTable fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFunds();
  }, [clientId]);

  const MobileFundCard = ({ item }) => (
    <div className="bg-[#151c2c] p-4 rounded-lg border border-[#2d3748] shadow-md mb-3 active:scale-[0.98] transition-transform">
      <div className="flex justify-between items-start mb-2">
         <span className={`text-sm font-bold ${parseFloat(item.amount) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
           {parseFloat(item.amount).toFixed(2)}
         </span>
         <span className="text-xs text-slate-500 font-mono">
            {new Date(item.created_at || item.createdAt).toLocaleString('en-IN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            })}
         </span>
      </div>
      {item.notes && (
          <div className="mt-2 pt-2 border-t border-[#2d3748]">
            <p className="text-xs text-slate-400 italic">{item.notes}</p>
          </div>
      )}
    </div>
  );

  return (
    <div className="mb-6">
      <div className="bg-[#151c2c] rounded-t-lg border-t border-x border-[#2d3748] px-6 py-4 flex justify-between items-center bg-[#151c2c] shadow-sm">
        <h2 className="text-lg md:text-xl font-normal text-slate-300 tracking-wide">Fund - Withdrawal & Deposits</h2>
        <p className="text-xs text-slate-500">
            {loading ? 'Loading...' : `Showing ${data.length} item(s)`}
        </p>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block bg-[#151c2c] rounded-b-lg border border-[#2d3748] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-100 text-sm font-semibold border-b border-[#2d3748]">
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Created At</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">No transactions found</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} className="border-b border-[#2d3748] hover:bg-slate-800/20 transition-colors">
                  <td className={`px-6 py-4 font-bold ${parseFloat(item.amount) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(item.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {new Date(item.created_at || item.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-slate-300">{item.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 mt-2">
          {loading ? (
            <p className="text-slate-500 text-center py-6">Loading...</p>
          ) : data.length === 0 ? (
            <p className="text-slate-500 text-center py-6">No transactions found</p>
          ) : data.map((item) => (
            <MobileFundCard key={item.id} item={item} />
          ))}
      </div>
    </div>
  );
};

export default FundWithdrawalTable;
