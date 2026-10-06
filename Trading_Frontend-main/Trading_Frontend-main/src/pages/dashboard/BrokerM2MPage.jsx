// import React from 'react';

// const BrokerM2MPage = () => {
//   const brokerMetrics = [
//     { id: '3274 : Sweta namdev', ledger: '30134.83', m2m: '30234.53', pl: '99.65', trades: '24', margin: '32.77', holding: '97.76' },
//     { id: '3343 : Ar0', ledger: '14000', m2m: '6925', pl: '-7075', trades: '1', margin: '500', holding: '2500' },
//     { id: '3725 : Namdevji', ledger: '2398.8', m2m: '2481.04', pl: '82.24', trades: '17', margin: '18.72', holding: '55.85' },
//     { id: '4249 : Sajjan', ledger: '13216.93', m2m: '12616.93', pl: '-600', trades: '2', margin: '1447.95', holding: '4322.24' },
//     { id: '4334 : Subhash bhavar', ledger: '131679.63', m2m: '124899.63', pl: '-6780', trades: '1', margin: '2000', holding: '8000' },
//     { id: '4372 : Pardeep kumar', ledger: '58118.96', m2m: '54538.96', pl: '-3580', trades: '1', margin: '1000', holding: '5000' },
//     { id: '4378 : Arjun jain', ledger: '282153.54', m2m: '276628.54', pl: '-5525', trades: '2', margin: '3000', holding: '15000' },
//     { id: '4395 : Jitu0', ledger: '132489.06', m2m: '133189.06', pl: '700', trades: '2', margin: '40000', holding: '50000' },
//   ];

//   const InfoCard = ({ title, data }) => (
//     <div className="bg-[#151c2c] rounded-lg border border-[#2d3748] shadow-xl overflow-hidden flex flex-col h-full">
//       <div className="bg-[#4CAF50] px-4 py-2 border-b border-[#2d3748]">
//         <h3 className="text-white text-sm font-bold tracking-wide">{title}</h3>
//       </div>
//       <div className="p-4 flex-1 flex flex-col justify-center space-y-3">
//         {data.map((item, index) => (
//           <div key={index} className="flex justify-between items-center text-xs">
//             <span className="text-slate-400 font-medium uppercase tracking-wider">{item.label}</span>
//             <span className="text-white font-bold tracking-wide">{item.value}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   return (
//     <div className="flex flex-col h-full bg-[#1a2035] ">

//       {/* 1. Live M2M Table (Top) */}
//       <div className="bg-[#151c2c] rounded-lg border border-[#2d3748] shadow-xl overflow-hidden">
//         <div className="bg-[#4CAF50] px-6 py-3 border-b border-[#2d3748]">
//             <h2 className="text-white text-sm font-bold tracking-wide">
//             Live M2M under: <span className="font-extrabold uppercase">rk002</span>
//             </h2>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse whitespace-nowrap">
//             <thead>
//               <tr className="text-slate-400 text-[10px] font-bold border-b border-white/10 bg-[#1a2035] uppercase tracking-wider">
//                 <th className="px-6 py-3">User ID</th>
//                 <th className="px-6 py-3">Active Profit/Loss</th>
//                 <th className="px-6 py-3">Active Trades</th>
//                 <th className="px-6 py-3">Margin Used</th>
//               </tr>
//             </thead>
//             <tbody className="text-[11px] text-slate-300">
//                 {brokerMetrics.map((row, idx) => (
//                 <tr key={row.id} className="border-b border-white/5 hover:bg-[#1a2035]/50 transition-colors">
//                     <td className="px-6 py-3">
//                     <span className="text-[#01B4EA] font-bold cursor-pointer hover:underline">
//                         {row.id}
//                     </span>
//                     </td>
//                     <td className={`px-6 py-3 font-bold ${parseFloat(row.pl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
//                     {row.pl}
//                     </td>
//                     <td className="px-6 py-3 text-slate-300">
//                     {row.trades}
//                     </td>
//                     <td className="px-6 py-3 text-slate-300">
//                     {row.margin}
//                     </td>
//                 </tr>
//                 ))}
//                <tr className="border-b border-white/10 bg-[#1a2035] font-bold text-white">
//                   <td className="px-6 py-3 text-slate-400">Total</td>
//                   <td className="px-6 py-3">0</td>
//                   <td className="px-6 py-3">0</td>
//                   <td className="px-6 py-3">0</td>
//                 </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* 2. Turnover Row */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <InfoCard 
//             title="Buy Turnover" 
//             data={[
//                 { label: "Mix:", value: "0 Lakhs" },
//                 { label: "NSE Fut:", value: "0 Lakhs" },
//                 { label: "NSE Opt:", value: "0 Lakhs" },
//                 { label: "Options:", value: "0 Lakhs" },
//                 { label: "COMX:", value: "0 Lakhs" },
//             ]} 
//         />
//         <InfoCard 
//             title="Sell Turnover" 
//             data={[
//                 { label: "Mix:", value: "0 Lakhs" },
//                 { label: "NSE Fut:", value: "0 Lakhs" },
//                 { label: "NSE Opt:", value: "0 Lakhs" },
//                 { label: "Options:", value: "0 Lakhs" },
//                 { label: "COMX:", value: "0 Lakhs" },
//             ]} 
//         />
//         <InfoCard 
//             title="Total Turnover" 
//             data={[
//                 { label: "Mix:", value: "0 Lakhs" },
//                 { label: "NSE Fut:", value: "0 Lakhs" },
//                 { label: "NSE Opt:", value: "0 Lakhs" },
//                 { label: "Options:", value: "0 Lakhs" },
//                 { label: "COMX:", value: "0 Lakhs" },
//             ]} 
//         />
//       </div>

//       {/* 3. Stats Row: Active Users, P/L, Brokerage */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <InfoCard 
//             title="Active Users" 
//             data={[
//                 { label: "Mix:", value: "1" },
//                 { label: "NSE Fut:", value: "1" },
//                 { label: "NSE Opt:", value: "1" },
//                 { label: "Options:", value: "1" },
//                 { label: "COMX:", value: "0" },
//             ]} 
//         />
//         <InfoCard 
//             title="Profit / Loss" 
//             data={[
//                 { label: "Mix:", value: "0" },
//                 { label: "NSE Fut:", value: "0" },
//                 { label: "NSE Opt:", value: "0" },
//                 { label: "Options:", value: "0" },
//                 { label: "COMX:", value: "0" },
//             ]} 
//         />
//         <InfoCard 
//             title="Brokerage" 
//             data={[
//                 { label: "Mix:", value: "0" },
//                 { label: "NSE Fut:", value: "0" },
//                 { label: "NSE Opt:", value: "0" },
//                 { label: "Options:", value: "0" },
//                 { label: "COMX:", value: "0" },
//             ]} 
//         />
//       </div>

//       {/* 4. Active Orders Row */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <InfoCard 
//             title="Active Buy" 
//             data={[
//                 { label: "Mix:", value: "0" },
//                 { label: "NSE Fut:", value: "0" },
//                 { label: "NSE Opt:", value: "0" },
//             ]} 
//         />
//         <InfoCard 
//             title="Active Sell" 
//             data={[
//                 { label: "Mix:", value: "0" },
//                 { label: "NSE Fut:", value: "0" },
//                 { label: "NSE Opt:", value: "0" },
//             ]} 
//         />
//       </div>

//     </div>
//   );
// };

// export default BrokerM2MPage;




import React, { useState, useEffect } from 'react';
import { getBrokerM2M } from '../../services/api';

const BrokerM2MPage = () => {
  const [brokerMetrics, setBrokerMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBrokerM2M();
        setBrokerMetrics(data || []);
      } catch (err) {
        console.error('Failed to fetch broker M2M:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const InfoCard = ({ title, data }) => (
    <div className="bg-[#1f283e] rounded-lg border border-white/5 shadow-xl overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-white/5 font-bold text-white uppercase tracking-wider"
        style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}>
        <h3 className="text-white text-lg font-bold tracking-wide">{title}</h3>
      </div>
      <div className="px-6 py-4 flex-1 flex flex-col justify-evenly">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center py-4">
              <span className="text-slate-400 text-sm font-bold uppercase tracking-wide">{item.label.replace(':', '')}</span>
              <h3 className="text-white text-xl font-bold tracking-tight">
                {item.value}
              </h3>
            </div>
            {index < data.length - 1 && <div className="h-px bg-white/5 mx-0 my-0"></div>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#1a2035] px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-4 md:space-y-8">

      {/* 1. Live M2M Table (Top) */}
      <div className="bg-[#1f283e] rounded-lg border border-white/5 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5"
          style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}>
          <h2 className="text-white text-sm font-bold tracking-wide">
            Live M2M under: <span className="font-extrabold uppercase">rk002</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 text-[10px] font-bold border-b border-white/10 bg-[#1a2035] uppercase tracking-wider">
                <th className="px-6 py-3">User ID</th>
                <th className="px-6 py-3">Active Profit/Loss</th>
                <th className="px-6 py-3">Active Trades</th>
                <th className="px-6 py-3">Holding Margin Required</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-slate-300">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-6 text-center text-slate-500">Loading...</td></tr>
              ) : brokerMetrics.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-6 text-center text-slate-500">No data available</td></tr>
              ) : brokerMetrics.map((row, idx) => (
                <tr key={row.user_id || idx} className="border-b border-white/5 hover:bg-[#1a2035]/50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="text-[#01B4EA] font-bold cursor-pointer hover:underline">
                      {row.username}
                    </span>
                  </td>
                  <td className={`px-6 py-3 font-bold ${parseFloat(row.live_pnl || row.activePL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(row.live_pnl || row.activePL || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-slate-300">{row.active_trades || row.activeTrades || 0}</td>
                  <td className="px-6 py-3 text-slate-300">
                    {parseFloat(row.marginShortfall) > 0 
                        ? parseFloat(row.marginShortfall).toFixed(2) 
                        : parseFloat(row.margin_used || row.margin || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              {brokerMetrics.length > 0 && (
                <tr className="border-b border-white/10 bg-[#1a2035] font-bold text-white">
                  <td className="px-6 py-3 text-slate-400">Total</td>
                  <td className={`px-6 py-3 font-bold ${brokerMetrics.reduce((s, r) => s + parseFloat(r.live_pnl || r.activePL || 0), 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {brokerMetrics.reduce((s, r) => s + parseFloat(r.live_pnl || r.activePL || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-3">{brokerMetrics.reduce((s, r) => s + (r.active_trades || r.activeTrades || 0), 0)}</td>
                  <td className="px-6 py-3">
                    {brokerMetrics.reduce((s, r) => s + (parseFloat(r.marginShortfall) > 0 ? parseFloat(r.marginShortfall) : parseFloat(r.margin_used || r.margin || 0)), 0).toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Turnover Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          title="Buy Turnover"
          data={[
            { label: "Mix:", value: "0 Lakhs" },
            { label: "NSE Fut:", value: "0 Lakhs" },
            { label: "NSE Opt:", value: "0 Lakhs" },
            { label: "Options:", value: "0 Lakhs" },
            { label: "COMX:", value: "0 Lakhs" },
          ]}
        />
        <InfoCard
          title="Sell Turnover"
          data={[
            { label: "Mix:", value: "0 Lakhs" },
            { label: "NSE Fut:", value: "0 Lakhs" },
            { label: "NSE Opt:", value: "0 Lakhs" },
            { label: "Options:", value: "0 Lakhs" },
            { label: "COMX:", value: "0 Lakhs" },
          ]}
        />
        <InfoCard
          title="Total Turnover"
          data={[
            { label: "Mix:", value: "0 Lakhs" },
            { label: "NSE Fut:", value: "0 Lakhs" },
            { label: "NSE Opt:", value: "0 Lakhs" },
            { label: "Options:", value: "0 Lakhs" },
            { label: "COMX:", value: "0 Lakhs" },
          ]}
        />
      </div>

      {/* 3. Stats Row: Active Users, P/L, Brokerage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          title="Active Users"
          data={[
            { label: "Mix:", value: "1" },
            { label: "NSE Fut:", value: "1" },
            { label: "NSE Opt:", value: "1" },
            { label: "Options:", value: "1" },
            { label: "COMX:", value: "0" },
          ]}
        />
        <InfoCard
          title="Profit / Loss"
          data={[
            { label: "Mix:", value: "0" },
            { label: "NSE Fut:", value: "0" },
            { label: "NSE Opt:", value: "0" },
            { label: "Options:", value: "0" },
            { label: "COMX:", value: "0" },
          ]}
        />
        <InfoCard
          title="Brokerage"
          data={[
            { label: "Mix:", value: "0" },
            { label: "NSE Fut:", value: "0" },
            { label: "NSE Opt:", value: "0" },
            { label: "Options:", value: "0" },
            { label: "COMX:", value: "0" },
          ]}
        />
      </div>

      {/* 4. Active Orders Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard
          title="Active Buy"
          data={[
            { label: "Mix:", value: "0" },
            { label: "NSE Fut:", value: "0" },
            { label: "NSE Opt:", value: "0" },
          ]}
        />
        <InfoCard
          title="Active Sell"
          data={[
            { label: "Mix:", value: "0" },
            { label: "NSE Fut:", value: "0" },
            { label: "NSE Opt:", value: "0" },
          ]}
        />
      </div>

    </div>
  );
};

export default BrokerM2MPage;