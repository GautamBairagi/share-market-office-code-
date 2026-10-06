import React, { useState, useEffect } from 'react';
import SegmentDashboard from '../../components/dashboard/SegmentDashboard';
import * as api from '../../services/api';

const LiveM2MPage = ({ onNavigate, user }) => {
  const isClient = user?.role === 'TRADER';
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevPL, setPrevPL] = useState({});
  const [flashes, setFlashes] = useState({});

  useEffect(() => {
    fetchM2M();
    const interval = setInterval(fetchM2M, 10000); // Update every 10s to reduce load
    return () => clearInterval(interval);
  }, [isClient]);

  const fetchM2M = async () => {
    try {
      const data = await api.getLiveM2M();
      const newClients = data.clients || [];
      const newStats = data.stats || null;

      // 1. Track Client Table P/L changes for flash effect
      newClients.forEach(client => {
        const key = client.id || client.username;
        if (prevPL[key] !== undefined && prevPL[key] !== client.activePL) {
          const direction = parseFloat(client.activePL) > parseFloat(prevPL[key]) ? 'up' : 'down';
          setFlashes(prev => ({ ...prev, [key]: direction }));
          setTimeout(() => setFlashes(prev => { const next = { ...prev }; delete next[key]; return next; }), 500);
        }
        prevPL[key] = client.activePL;
      });

      // 2. Track Summary Stats for flash effect (P/L and Brokerage cards)
      if (newStats) {
        const segments = ['mcx', 'nse', 'options', 'comex', 'forex', 'crypto'];
        segments.forEach(s => {
          // Track P/L flash
          const plKey = `stat-Profit / Loss-${s.toUpperCase()} P/L`;
          const prevPlValue = prevPL[plKey];
          const newPlValue = newStats.profitLoss?.[s];
          if (prevPlValue !== undefined && prevPlValue !== newPlValue) {
            const dir = parseFloat(newPlValue) > parseFloat(prevPlValue) ? 'up' : 'down';
            setFlashes(prev => ({ ...prev, [plKey]: dir }));
            setTimeout(() => setFlashes(prev => { const next = { ...prev }; delete next[plKey]; return next; }), 500);
          }
          prevPL[plKey] = newPlValue;

          // Track Brokerage flash
          const brKey = `stat-Brokerage Summary-${s.toUpperCase()} Brokerage`;
          const prevBrValue = prevPL[brKey];
          const newBrValue = newStats.brokerage?.[s];
          if (prevBrValue !== undefined && prevBrValue !== newBrValue) {
            setFlashes(prev => ({ ...prev, [brKey]: 'up' }));
            setTimeout(() => setFlashes(prev => { const next = { ...prev }; delete next[brKey]; return next; }), 500);
          }
          prevPL[brKey] = newBrValue;
        });
      }

      setClients(newClients);
      setStats(newStats);
      setPrevPL({ ...prevPL });
    } catch (err) {
      console.error('Failed to fetch live M2M:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isClient) {
    const segmentLower = (user?.segment || 'MCX').toLowerCase();
    const clientBrokerage = stats?.brokerage?.[segmentLower] || "0.00";
    const clientPL = stats?.profitLoss?.[segmentLower] || "0.00";

    return (
      <div className="flex flex-col h-full bg-[#1a2035] px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 gap-y-14 md:gap-y-12 overflow-y-auto custom-scrollbar pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Live Market Dashboard</h1>
            <p className="text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-widest mt-1">Hello, {user?.username} – Segment: {user?.segment}</p>
          </div>
        </div>

        {/* Client Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-14 md:gap-8">
          <StatCard
            title="Brokerage Summary"
            data={[
              { label: `${user?.segment} Brokerage`, value: clientBrokerage },
              { label: "Total Brokerage", value: Object.values(stats?.brokerage || {}).reduce((acc, val) => acc + parseFloat(val.replace(/[^\d.-]/g, '') || 0), 0).toFixed(2) }
            ]}
          />
          <StatCard
            title="Active Profit / Loss"
            data={[
              { label: `${user?.segment} Active P/L`, value: parseFloat(clients[0]?.activePL || 0).toFixed(2) },
              { label: "Net Active P/L (Total)", value: parseFloat(clients[0]?.activePL || 0).toFixed(2) }
            ]}
          />
          <StatCard
            title="Margin Summary"
            data={[
              { label: "Used Margin", value: parseFloat(clients[0]?.marginUsed || 0).toFixed(2) },
              { label: "Holding Margin", value: parseFloat(clients[0]?.margin || 0).toFixed(2) },
              { label: "Available Margin (M2M)", value: (parseFloat(user?.balance || 0) - parseFloat(clients[0]?.marginUsed || 0) + parseFloat(clients[0]?.activePL || 0)).toFixed(2) }
            ]}
          />
        </div>

        <SegmentDashboard segment={user?.segment} userName={user?.username} />
      </div>
    );
  }

  const StatCard = ({ title, data }) => (
    <div className="bg-[#1f283e] rounded-md shadow-2xl relative mt-0 md:mt-6 mb-0 flex flex-col h-full border border-white/5">
      {/* Offset Header */}
      <div
        className="absolute -top-6 left-4 right-4 rounded-md shadow-[0_4px_20px_0_rgba(0,0,0,0.14),0_7px_10px_-5px_rgba(76,175,80,0.4)] px-6 py-4 z-10"
        style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
      >
        <h3 className="text-white text-base font-bold uppercase tracking-tight">{title}</h3>
      </div>

      {/* Card Body */}
      <div className="pt-12 px-6 pb-4 flex-1 flex flex-col justify-evenly">
        {data.map((item, index) => {
          const flashKey = `stat-${title}-${item.label}`;
          const flash = flashes[flashKey];

          return (
            <div key={index}>
              <div className="flex justify-between items-center py-4">
                <span className="text-slate-400 text-sm font-bold uppercase tracking-wide">{item.label}</span>
                <h3 className={`text-white text-xl font-bold tracking-tight transition-all duration-300 ${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}`}>
                  {item.value?.split(' ')[0] || "0.00"}{' '}
                  {item.value?.includes('Lakhs') && (
                    <span className="text-xs font-normal text-slate-300 ml-1">Lakhs</span>
                  )}
                </h3>
              </div>
              {index < data.length - 1 && (
                <hr className="border-white/5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const isAdminOrSuper = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';

  return (
    <div className="flex flex-col h-full bg-[#1a2035] px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 gap-y-14 md:gap-y-12 overflow-y-auto custom-scrollbar pb-10">

      {/* 1. Live M2M Table Section */}
      <div className="relative mt-6">
        <div className="bg-[#1f283e] rounded-md shadow-2xl relative pt-12">
          {/* Table Offset Header */}
          <div
            className="absolute -top-6 left-4 rounded-md shadow-[0_4px_20px_0_rgba(0,0,0,0.14),0_7px_10px_-5px_rgba(76,175,80,0.4)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 z-10 w-[calc(100%-32px)]"
            style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
          >
            <h2 className="text-white text-base font-bold uppercase tracking-tight">
              {isAdminOrSuper ? 'Live M2M under: SHRI SHRI NATHJI TRADERS' : `Live M2M under: ${(user?.fullName || user?.username || '').toUpperCase().replace('VIKRAM', 'SHRI SHRI NATHJI')}`}
            </h2>
          </div>

          <div className="px-6 py-4 overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="border-b border-white/5">
                <tr className="text-white text-[12px] font-normal uppercase tracking-widest">
                  <th className="px-4 py-4">User ID</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Active Profit/Loss</th>
                  <th className="px-4 py-4">Active Trades</th>
                  <th className="px-4 py-4 text-right">Margin Used</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-300">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{isAdminOrSuper ? 'No active brokers' : 'No active traders'}</td></tr>
                ) : clients.map((client, index) => {
                  const key = client.id || client.username;
                  const flash = flashes[key];

                  return (
                    <tr key={client.id || index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onNavigate(`dashboard-detail/${client.id}`, client)}
                          className="inline-block px-4 py-1 rounded-full text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(76,175,80,0.4)] hover:shadow-[0_4px_20px_rgba(76,175,80,0.6)] transition-all cursor-pointer border border-white/10"
                          style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                        >
                          {client.id} : {client.username}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${client.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                          {client.role || 'BROKER'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-3 py-1 rounded font-black tabular-nums text-xs sm:text-sm border transition-all duration-300 ${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''} ${parseFloat(client.activePL) >= 0 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                          {parseFloat(client.activePL || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4">{client.activeTrades || 0}</td>
                      <td className="px-4 py-4 text-right font-bold">
                        {parseFloat(client.marginUsed || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
                {!loading && clients.length > 0 && (
                  <tr className="bg-black/10 font-bold text-white uppercase text-[11px] tracking-widest">
                    <td className="px-4 py-4">Total</td>
                    <td className="px-4 py-4"></td>
                    <td className={`px-4 py-4 ${clients.reduce((s, c) => s + parseFloat(c.activePL || 0), 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {clients.reduce((s, c) => s + parseFloat(c.activePL || 0), 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-4">{clients.reduce((s, c) => s + parseInt(c.activeTrades || 0), 0)}</td>
                    <td className="px-4 py-4 text-right font-bold">
                      {clients.reduce((s, c) => s + parseFloat(c.marginUsed || 0), 0).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Turnover Rows - Full Width Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-14 md:gap-8">
        <StatCard
          title="Buy Turnover"
          data={[
            { label: "Mcx", value: stats?.buyTurnover?.mcx || "0.00 Lakhs" },
            { label: "NSE Futures", value: stats?.buyTurnover?.nse || "0.00 Lakhs" },
            { label: "Options", value: stats?.buyTurnover?.options || "0.00 Lakhs" },
            { label: "COMEX", value: stats?.buyTurnover?.comex || "0.00 Lakhs" },
            { label: "FOREX", value: stats?.buyTurnover?.forex || "0.00 Lakhs" },
            { label: "CRYPTO", value: stats?.buyTurnover?.crypto || "0.00 Lakhs" },
          ]}
        />
        <StatCard
          title="Sell Turnover"
          data={[
            { label: "Mcx", value: stats?.sellTurnover?.mcx || "0.00 Lakhs" },
            { label: "NSE Future", value: stats?.sellTurnover?.nse || "0.00 Lakhs" },
            { label: "Options", value: stats?.sellTurnover?.options || "0.00 Lakhs" },
            { label: "COMEX", value: stats?.sellTurnover?.comex || "0.00 Lakhs" },
            { label: "FOREX", value: stats?.sellTurnover?.forex || "0.00 Lakhs" },
            { label: "CRYPTO", value: stats?.sellTurnover?.crypto || "0.00 Lakhs" },
          ]}
        />
        <StatCard
          title="Total Turnover"
          data={[
            { label: "Mcx", value: stats?.totalTurnover?.mcx || "0.00 Lakhs" },
            { label: "NSE Future", value: stats?.totalTurnover?.nse || "0.00 Lakhs" },
            { label: "Options", value: stats?.totalTurnover?.options || "0.00 Lakhs" },
            { label: "COMEX", value: stats?.totalTurnover?.comex || "0.00 Lakhs" },
            { label: "FOREX", value: stats?.totalTurnover?.forex || "0.00 Lakhs" },
            { label: "CRYPTO", value: stats?.totalTurnover?.crypto || "0.00 Lakhs" },
          ]}
        />
      </div>

      {/* 3. Status Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-14 md:gap-8">
        <StatCard
          title="Active Users"
          data={[
            { label: "Mcx", value: stats?.activeUsers?.mcx || "0" },
            { label: "NSE Future", value: stats?.activeUsers?.nse || "0" },
            { label: "Options", value: stats?.activeUsers?.options || "0" },
            { label: "COMEX", value: stats?.activeUsers?.comex || "0" },
            { label: "FOREX", value: stats?.activeUsers?.forex || "0" },
            { label: "CRYPTO", value: stats?.activeUsers?.crypto || "0" },
          ]}
        />
        <StatCard
          title="Profit / Loss"
          data={[
            { label: "Mcx", value: stats?.profitLoss?.mcx || "0.00" },
            { label: "NSE Future", value: stats?.profitLoss?.nse || "0.00" },
            { label: "Options", value: stats?.profitLoss?.options || "0.00" },
            { label: "COMEX", value: stats?.profitLoss?.comex || "0.00" },
            { label: "FOREX", value: stats?.profitLoss?.forex || "0.00" },
            { label: "CRYPTO", value: stats?.profitLoss?.crypto || "0.00" },
          ]}
        />
        <StatCard
          title="Brokerage"
          data={[
            { label: "Mcx", value: stats?.brokerage?.mcx || "0.00" },
            { label: "NSE Future", value: stats?.brokerage?.nse || "0.00" },
            { label: "Options", value: stats?.brokerage?.options || "0.00" },
            { label: "COMEX", value: stats?.brokerage?.comex || "0.00" },
            { label: "FOREX", value: stats?.brokerage?.forex || "0.00" },
            { label: "CRYPTO", value: stats?.brokerage?.crypto || "0.00" },
          ]}
        />
      </div>

      {/* 4. Active Positions Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14 md:gap-8">
        <StatCard
          title="Active Buy"
          data={[
            { label: "Mcx", value: stats?.activeBuy?.mcx?.toString() || "0" },
            { label: "NSE Future", value: stats?.activeBuy?.nse?.toString() || "0" },
            { label: "Options", value: stats?.activeBuy?.options?.toString() || "0" },
            { label: "COMEX", value: stats?.activeBuy?.comex?.toString() || "0" },
            { label: "FOREX", value: stats?.activeBuy?.forex?.toString() || "0" },
            { label: "CRYPTO", value: stats?.activeBuy?.crypto?.toString() || "0" },
          ]}
        />
        <StatCard
          title="Active Sell"
          data={[
            { label: "Mcx", value: stats?.activeSell?.mcx?.toString() || "0" },
            { label: "NSE Future", value: stats?.activeSell?.nse?.toString() || "0" },
            { label: "Options", value: stats?.activeSell?.options?.toString() || "0" },
            { label: "COMEX", value: stats?.activeSell?.comex?.toString() || "0" },
            { label: "FOREX", value: stats?.activeSell?.forex?.toString() || "0" },
            { label: "CRYPTO", value: stats?.activeSell?.crypto?.toString() || "0" },
          ]}
        />
      </div>

      <style>{`
        @keyframes flash-green {
          0% { background-color: rgba(76, 175, 80, 0.4); }
          100% { background-color: transparent; }
        }
        @keyframes flash-red {
          0% { background-color: rgba(244, 67, 54, 0.4); }
          100% { background-color: transparent; }
        }
        .flash-up { animation: flash-green 0.5s ease-out; }
        .flash-down { animation: flash-red 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default LiveM2MPage;
