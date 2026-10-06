import React from 'react';

const PendingOrdersTable = ({ title }) => {
  const headers = [
    "ID", "Trade", "Lots", "Commodity", "Condition", "Rate", "Date", "Ip Address"
  ];

  return (
    <div className="bg-[#151c2c] rounded-lg border border-[#2d3748] overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-[#2d3748]">
        <h2 className="text-xl font-semibold text-slate-100 italic">{title}</h2>
        <p className="text-xs text-slate-400 mt-1">Showing 0 of items.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="text-slate-100 text-xs font-semibold border-b border-[#2d3748]">
              {headers.map((h) => (
                <th key={h} className="px-6 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-xs text-slate-300">
            <tr>
              <td colSpan={headers.length} className="px-6 py-8 text-center text-slate-500">
                No records found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingOrdersTable;
