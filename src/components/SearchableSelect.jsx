import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, labelField = 'name', valueField = 'id' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                // Also check if click is inside the portal dropdown
                const portal = document.getElementById('searchable-select-portal');
                if (portal && portal.contains(event.target)) return;
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Position dropdown below the trigger using portal
    useEffect(() => {
        if (isOpen && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            });
        }
    }, [isOpen]);

    const selectedOption = options.find(o => String(o[valueField]) === String(value));
    const filteredOptions = options.filter(o => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        const label = String(o[labelField] || '').toLowerCase();
        const val = String(o[valueField] || '').toLowerCase();
        // Also search base name for futures (e.g. "gold" matches "MCX : GOLD 26APR FUT")
        return label.includes(q) || val.includes(q);
    });

    const dropdown = isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-xl z-[100] max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Search Input */}
            <div className="p-2 border-b border-slate-100 bg-slate-50">
                <input
                    autoFocus
                    type="text"
                    className="w-full bg-white border border-slate-200 py-2 px-3 text-sm text-black outline-none focus:border-[#4caf50] rounded font-medium"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Options List */}
            <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }} className="custom-scrollbar">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map(option => {
                        const labelText = String(option[labelField] || '');
                        const isSelected = String(option[valueField]) === String(value);

                        return (
                            <div
                                key={option[valueField]}
                                onClick={() => {
                                    onChange(option[valueField]);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                                className={`px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-[#4caf50]/10 hover:text-[#2e7d32] border-b border-slate-50 last:border-0 transition-colors uppercase ${
                                    isSelected ? 'bg-[#4caf50]/20 text-[#2e7d32]' : 'text-black'
                                }`}
                            >
                                {labelText}
                            </div>
                        );
                    })
                ) : (
                    <div className="px-4 py-4 text-center text-slate-400 text-xs italic uppercase tracking-wider">No results found</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white border border-slate-200 py-2.5 px-4 text-black font-extrabold outline-none rounded shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm uppercase tracking-wider ${
                    isOpen ? 'ring-2 ring-[#4caf50]/20 border-[#4caf50]' : 'hover:border-[#4caf50]'
                }`}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption[labelField] : <span className="text-slate-400 font-normal">{placeholder}</span>}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {dropdown}
        </div>
    );
};

export default SearchableSelect;
