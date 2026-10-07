import React from 'react';
import { ChevronDown } from 'lucide-react';

const FilterBar = () => {
  return (
    <div className="space-y-4 mb-6">
      {/* Date Filters and Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="bg-[#151c2c] p-2 rounded border border-[#2d3748]">
          <label className="block text-[10px] text-slate-400 mb-1">From Date</label>
          <input type="text" defaultValue="02/01/2026" className="bg-transparent text-slate-100 text-sm focus:outline-none w-full" />
        </div>
        <div className="bg-[#151c2c] p-2 rounded border border-[#2d3748]">
          <label className="block text-[10px] text-slate-400 mb-1">To Date</label>
          <input type="text" defaultValue="02/07/2026" className="bg-transparent text-slate-100 text-sm focus:outline-none w-full" />
        </div>
        <div className="md:col-span-2 grid grid-cols-1 gap-2">
          <button className="bg-[#01B4EA] hover:opacity-90 text-white text-[11px] font-bold py-3 px-4 rounded transition-all uppercase tracking-wider">
            Export Trades
          </button>
          <button className="bg-[#01B4EA] hover:opacity-90 text-white text-[11px] font-bold py-3 px-4 rounded transition-all uppercase tracking-wider">
            Download Trades PDF
          </button>
          <button className="bg-[#01B4EA] hover:opacity-90 text-white text-[11px] font-bold py-3 px-4 rounded transition-all uppercase tracking-wider">
            Export Funds
          </button>
        </div>
      </div>

      {/* Actions and View Details */}
      <div className="flex flex-col gap-2">
        <div className="flex">
          <button className="bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold py-2 px-6 rounded-l transition-all uppercase tracking-wider flex-1 md:flex-none">
            Actions
          </button>
          <button className="bg-purple-800 hover:bg-purple-900 text-white px-2 rounded-r border-l border-purple-900 transition-all">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <button className="bg-[#4CAF50] hover:bg-green-600 text-white text-[11px] font-bold py-3 px-4 rounded transition-all uppercase tracking-wider w-full">
          View Details
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
