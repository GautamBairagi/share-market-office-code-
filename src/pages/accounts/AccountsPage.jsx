import React, { useState, useEffect } from 'react';
import { getHierarchyAccounts } from '../../services/api';

const numColor = (val) => {
  const n = parseFloat(val);
  if (n < 0) return '#f87171';
  if (n > 0) return '#4ade80';
  return '#e2e8f0';
};

const TH = ({ children }) => (
  <th style={{
    fontSize: '13px', fontWeight: 700,
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '10px 14px', background: '#1a2035',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    color: '#94a3b8', whiteSpace: 'nowrap'
  }}>{children}</th>
);

const TD = ({ children, style = {} }) => (
  <td style={{
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '9px 14px', fontSize: '13px',
    fontWeight: 500, color: '#e2e8f0',
    ...style
  }}>{children}</td>
);

const AccountsPage = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [accountsData, setAccountsData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async (params = {}) => {
    setLoading(true);
    try {
      const data = await getHierarchyAccounts(params);
      setAccountsData(data || []);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Total row
  const total = accountsData.reduce((acc, row) => ({
    clientPL:         (parseFloat(acc.clientPL || 0)         + parseFloat(row.clientPL || 0)).toFixed(2),
    clientBrokerage:  (parseFloat(acc.clientBrokerage || 0)  + parseFloat(row.clientBrokerage || 0)).toFixed(2),
    clientNet:        (parseFloat(acc.clientNet || 0)        + parseFloat(row.clientNet || 0)).toFixed(2),
    plShare:          (parseFloat(acc.plShare || 0)          + parseFloat(row.plShare || 0)).toFixed(2),
    brokerageShare:   (parseFloat(acc.brokerageShare || 0)   + parseFloat(row.brokerageShare || 0)).toFixed(2),
    netShare:         (parseFloat(acc.netShare || 0)         + parseFloat(row.netShare || 0)).toFixed(2),
  }), { clientPL: '0', clientBrokerage: '0', clientNet: '0', plShare: '0', brokerageShare: '0', netShare: '0' });

  // Build descriptive Receivable/Payable message using brokerageShare as amount (matches reference image)
  const getRecPayMsg = (row) => {
    const brok = parseFloat(row.brokerageShare || 0);
    const name = row.fullName || row.broker || '';
    if (brok > 0) return { msg: `Rs. ${brok} is payable to ${name}`, payable: true };
    if (brok < 0) return { msg: `Rs. ${Math.abs(brok)} is to receive from ${name}`, payable: false };
    return { msg: `Rs. 0 is to receive from ${name}`, payable: false };
  };

  const handleCalculate = () => fetchAccounts({ fromDate, toDate });

  const handleResetFilter = () => {
    setFromDate('');
    setToDate('');
    fetchAccounts({});
  };

  return (
    <div className="main-content custom-scrollbar" style={{ overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Date Filter Bar */}
      <div className="custom-filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="group">
            <label className="block text-[10px] text-slate-500 mb-1.5 font-black uppercase tracking-widest">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="px-4 py-2 focus:outline-none bg-transparent text-slate-200 font-medium text-sm border border-slate-600 focus:border-green-400 rounded w-full transition-colors [color-scheme:dark]"
            />
          </div>
          <div className="group">
            <label className="block text-[10px] text-slate-500 mb-1.5 font-black uppercase tracking-widest">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="px-4 py-2 focus:outline-none bg-transparent text-slate-200 font-medium text-sm border border-slate-600 focus:border-green-400 rounded w-full transition-colors [color-scheme:dark]"
            />
          </div>
        </div>
        <button onClick={handleCalculate} className="btn-primary btn-success-gradient w-full sm:w-auto h-[38px] flex items-center justify-center">
          CALCULATE FOR CUSTOM DATES
        </button>
        <button onClick={handleResetFilter} className="btn-primary w-full sm:w-auto h-[38px] flex items-center justify-center" style={{ backgroundColor: '#64748b', color: '#fff' }}>
          RESET FILTER
        </button>
      </div>

      {/* Table Section */}
      <div className="card-panel" style={{ flex: 1, overflow: 'auto' }}>
        <table className="table-standard custom-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1100px' }}>
          <thead>
            <tr>
              <TH>Receivable / Payable</TH>
              <TH>Account Name</TH>
              <TH>SUM of Client PL</TH>
              <TH>SUM of Client Brokerage</TH>
              <TH>SUM of Client Net</TH>
              <TH>PL Share</TH>
              <TH>Brokerage Share</TH>
              <TH>Net Share</TH>
            </tr>
          </thead>
          <tbody>
            {/* Total Row */}
            {accountsData.length > 0 && (
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                <TD style={{ color: '#94a3b8' }}></TD>
                <TD style={{ fontWeight: 700, color: '#ffffff' }}>Total</TD>
                <TD style={{ textAlign: 'center', fontWeight: 700, color: numColor(total.clientPL) }}>{total.clientPL}</TD>
                <TD style={{ textAlign: 'center', fontWeight: 700, color: numColor(total.clientBrokerage) }}>{total.clientBrokerage}</TD>
                <TD style={{ textAlign: 'center', fontWeight: 700, color: numColor(total.clientNet) }}>{total.clientNet}</TD>
                <TD style={{ textAlign: 'center', fontWeight: 700, color: numColor(total.plShare) }}>{total.plShare}</TD>
                <TD style={{ textAlign: 'center', fontWeight: 700, color: numColor(total.brokerageShare) }}>{total.brokerageShare}</TD>
                <TD style={{ textAlign: 'center', fontWeight: 700, color: numColor(total.netShare) }}>{total.netShare}</TD>
              </tr>
            )}

            {/* Loading / Empty */}
            {loading ? (
              <tr><td colSpan="8" className="loading-overlay">Loading...</td></tr>
            ) : accountsData.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>No data. Select date range and click Calculate.</td></tr>
            ) : null}

            {/* Data Rows */}
            {accountsData.map((row, idx) => {
              const { msg, payable } = getRecPayMsg(row);
              return (
                <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  {/* Receivable/Payable message */}
                  <TD style={{ color: payable ? '#38bdf8' : '#e2e8f0', whiteSpace: 'nowrap' }}>
                    {msg}
                  </TD>
                  {/* Account Name: id: username */}
                  <TD style={{ color: '#38bdf8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {row.brokerId}: {row.broker}
                  </TD>
                  <TD style={{ textAlign: 'center', color: numColor(row.clientPL) }}>{row.clientPL}</TD>
                  <TD style={{ textAlign: 'center', color: numColor(row.clientBrokerage) }}>{row.clientBrokerage}</TD>
                  <TD style={{ textAlign: 'center', color: numColor(row.clientNet) }}>{row.clientNet}</TD>
                  <TD style={{ textAlign: 'center', color: numColor(row.plShare) }}>{row.plShare}</TD>
                  <TD style={{ textAlign: 'center', color: numColor(row.brokerageShare) }}>{row.brokerageShare}</TD>
                  <TD style={{ textAlign: 'center', color: numColor(row.netShare) }}>{row.netShare}</TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountsPage;
