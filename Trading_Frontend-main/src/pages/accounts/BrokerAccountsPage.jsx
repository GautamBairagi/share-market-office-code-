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
        padding: '9px 14px', fontSize: '14px',
        fontWeight: 500, color: '#e2e8f0',
        ...style
    }}>{children}</td>
);

const BrokerAccountsPage = () => {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData({ roleFilter: 'BROKER' });
    }, []);

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const data = await getHierarchyAccounts(params);
            setTableData(data || []);
        } catch (err) {
            console.error('Failed to fetch broker accounts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = (e) => {
        e.preventDefault();
        fetchData({ fromDate, toDate, roleFilter: 'BROKER' });
    };

    const handleResetFilter = () => {
        setFromDate('');
        setToDate('');
        fetchData({ roleFilter: 'BROKER' });
    };

    return (
        <div className="main-content custom-scrollbar" style={{ overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Filter Section */}
            <div className="custom-filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
                    <div className="group">
                        <label className="block text-[10px] text-slate-500 mb-1.5 font-black uppercase tracking-widest">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            className="px-4 py-2 bg-transparent text-slate-200 text-sm focus:outline-none border border-slate-600 focus:border-green-400 rounded w-full transition-colors [color-scheme:dark]"
                        />
                    </div>
                    <div className="group">
                        <label className="block text-[10px] text-slate-500 mb-1.5 font-black uppercase tracking-widest">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            className="px-4 py-2 bg-transparent text-slate-200 text-sm focus:outline-none border border-slate-600 focus:border-green-400 rounded w-full transition-colors [color-scheme:dark]"
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
            <div className="card-panel" style={{ overflow: 'auto' }}>
                <table className="table-standard custom-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1000px' }}>
                    <thead>
                        <tr>
                            <TH>Broker:</TH>
                            <TH>SUM of Client PL</TH>
                            <TH>SUM of Client Brokerage</TH>
                            <TH>SUM of Client Swap</TH>
                            <TH>SUM of Client Net</TH>
                            <TH>PL Share</TH>
                            <TH>Brokerage Share</TH>
                            <TH>Swap Share</TH>
                            <TH>Net Share</TH>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="9" className="loading-overlay">Loading...</td></tr>
                        ) : tableData.length === 0 ? (
                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>No data. Select date range and calculate.</td></tr>
                        ) : null}
                        {tableData.map((row, index) => (
                            <tr key={index} style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                <TD style={{ color: '#38bdf8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {row.brokerId}: {row.broker}
                                </TD>
                                <TD style={{ textAlign: 'center', color: numColor(row.clientPL) }}>{row.clientPL || '0.00'}</TD>
                                <TD style={{ textAlign: 'center', color: numColor(row.clientBrokerage) }}>{row.clientBrokerage || '0.00'}</TD>
                                <TD style={{ textAlign: 'center' }}>0.00</TD>
                                <TD style={{ textAlign: 'center', color: numColor(row.clientNet) }}>{row.clientNet || '0.00'}</TD>
                                <TD style={{ textAlign: 'center', color: numColor(row.plShare) }}>{row.plShare || '0.00'}</TD>
                                <TD style={{ textAlign: 'center', color: numColor(row.brokerageShare) }}>{row.brokerageShare || '0.00'}</TD>
                                <TD style={{ textAlign: 'center' }}>0.00</TD>
                                <TD style={{ textAlign: 'center', color: numColor(row.netShare) }}>{row.netShare || '0.00'}</TD>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BrokerAccountsPage;
