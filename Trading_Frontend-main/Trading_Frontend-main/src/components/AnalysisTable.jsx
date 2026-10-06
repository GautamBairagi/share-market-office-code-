import React from 'react';

const AnalysisRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 px-6 border-b border-[#2d3748] hover:bg-slate-800/10 transition-colors">
    <span className="text-slate-400 text-sm font-medium">{label}</span>
    <span className="text-slate-200 text-sm font-semibold">{value}</span>
  </div>
);

const AnalysisTable = () => {
  const data = [
    { label: "Account Status", value: "Active" },
    { label: "Allow Orders between High - Low?", value: "Yes" },
    { label: "Allow Fresh Entry Order above high & below low?", value: "Yes" },
    { label: "demo account?", value: "No" },
    { label: "Auto-close trades if losses cross beyond the configured limit", value: "Yes" },
    { label: "Auto-close trades if insufficient fund to hold overnight", value: "Yes" },
    { label: "Minimum lot size required per single trade of MCX", value: "1" },
    { label: "Maximum lot size allowed per single trade of MCX", value: "5" },
    { label: "Minimum lot size required per single trade of Equity", value: "0" },
    { label: "Maximum lot size allowed per single trade of Equity", value: "1" },
    { label: "Minimum lot size required per single trade of Equity INDEX", value: "0" },
    { label: "Maximum lot size allowed per single trade of Equity INDEX", value: "1" },
    { label: "Maximum lot size allowed per scrip of MCX to be actively open at a time", value: "5" },
    { label: "Maximum lot size allowed per scrip of Equity to be actively open at a time", value: "10" },
    { label: "MCX Trading", value: "Active" },
    { label: "MCX brokerage per_crore", value: "1000.0000" },
    { label: "Equity Trading", value: "Active" },
    { label: "Equity brokerage", value: "1000.0000" },
    { label: "Ledger Balance", value: "132489.0620" },
    { label: "Total Profit / Loss", value: "185739" },
    { label: "Net Profit / Loss", value: "180353.87" },
  ];

  return (
    <div className="bg-[#151c2c] rounded-lg border border-[#2d3748] overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-[#2d3748]">
        <h2 className="text-xl font-semibold text-slate-100 italic">Account Status</h2>
      </div>
      <div className="overflow-y-auto max-h-[500px] custom-scrollbar">
        {data.map((item, index) => (
          <AnalysisRow key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
};


export default AnalysisTable;
