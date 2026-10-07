import React from 'react';

const ClientDetailsCard = ({ client }) => {
    // Parse client ID and name if they are combined in the string "ID : Name"
    // e.g., "3274 : Sweta namdev"
    let id = '4395';
    let name = 'Jitu0';
    
    if (client && client.id) {
        if (client.id.includes(':')) {
            const parts = client.id.split(':');
            id = parts[0].trim();
            name = parts[1].trim();
        } else {
            id = client.id;
            name = client.name || 'Unknown';
        }
    }

  const details = [
    { label: 'ID', value: id },
    { label: 'Name', value: name },
    { label: 'Mobile', value: ' ' }, // Empty in screenshot
    { label: 'Username', value: 'SHRE072' }, // Hardcoded as per screenshot/request or could be dynamic
    { label: 'City', value: ' ' }, // Empty
    { label: 'Account Status', value: 'Active' },
    { label: 'Allow Orders between High - Low?', value: 'Yes' },
    { label: 'Allow Fresh Entry Order above high & below low?', value: 'Yes' },
    { label: 'demo account?', value: 'No' },
    { label: 'Auto-close trades if losses cross beyond the configured limit', value: 'Yes' },
  ];

  return (
    <div className="bg-[#151c2c] border border-[#2d3748] rounded overflow-hidden shadow-xl mb-6">
      {/* Table-like structure for details */}
      <div className="divide-y divide-[#2d3748]">
        {details.map((item, index) => (
          <div key={item.label} className="flex text-sm hover:bg-slate-800/30 transition-colors">
            <div className="w-1/2 p-4 text-slate-100 font-bold border-r border-[#2d3748]">
              {item.label}
            </div>
            <div className={`w-1/2 p-4 font-medium ${item.value === 'Active' ? 'text-green-400' : 'text-slate-300'}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientDetailsCard;
