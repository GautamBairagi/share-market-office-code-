import React, { useState } from 'react';
import DashboardFilters from './DashboardFilters';
import ClientDetailsCard from './ClientDetailsCard';
import FundWithdrawalTable from './FundWithdrawalTable';
import ActiveTradesTable from './ActiveTradesTable';
import ActivePositionsTable from './ActivePositionsTable';
import { ChevronDown, ArrowLeft } from 'lucide-react';

const ClientDashboard = ({ onBack, client }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showActions, setShowActions] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#0b111e] p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
        >
            <ArrowLeft className="w-4 h-4" /> Back to List
        </button>
      </div>

      {/* Filters Section */}
      <DashboardFilters />

      {/* Actions & View Details Bar */}
      <div className="space-y-4">
         <div className="flex relative">
            <button 
                onClick={() => setShowActions(!showActions)}
                className="bg-[#8e24aa] hover:bg-[#7b1fa2] text-white text-[11px] font-bold py-2.5 px-6 rounded shadow-lg uppercase tracking-wider flex items-center justify-between min-w-[140px] transition-colors"
            >
                ACTIONS
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showActions ? 'rotate-180' : ''}`} />
            </button>
            
            {showActions && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#151c2c] border border-[#2d3748] rounded shadow-xl z-10 py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-[#2d3748] hover:text-white transition-colors">
                        Edit Client
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-[#2d3748] hover:text-white transition-colors">
                        Ban Client
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-[#2d3748] hover:text-white transition-colors">
                        Add Funds
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-[#2d3748] hover:text-white transition-colors text-red-400">
                        Delete Client
                    </button>
                </div>
            )}
        </div>

        <button 
            onClick={() => setShowDetails(!showDetails)}
            className="w-full bg-[#4CAF50] hover:bg-[#43a047] text-white text-[13px] font-bold py-3 px-4 rounded shadow-lg uppercase tracking-wider transition-colors"
        >
            {showDetails ? 'HIDE DETAILS' : 'VIEW DETAILS'}
        </button>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {showDetails && <ClientDetailsCard client={client} />}
        
        <FundWithdrawalTable clientId={client?.id} />
        
        <ActiveTradesTable clientId={client?.id} />

        <ActivePositionsTable clientId={client?.id} username={client?.name} />
      </div>
    </div>
  );
};

export default ClientDashboard;
