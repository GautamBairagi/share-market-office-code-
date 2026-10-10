import React, { useState, useMemo } from 'react';
import { Eye, SquarePen, Copy, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';

/**
 * DataTable - Reusable table component with:
 * - Standardized action icons (View/Edit/Copy/Delete)
 * - Pagination (bottom-right aligned)
 * - Search bar
 * - Sticky header
 * - Full width layout
 * - Mobile card view on small screens
 */
const DataTable = ({
    columns = [],
    data = [],
    actions = {},
    pageSize = 15,
    searchable = true,
    searchPlaceholder = 'Search...',
    emptyMessage = 'No records found.',
    showActions = true,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter data by search term
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(row =>
            columns.some(col => {
                const val = row[col.key];
                return val && String(val).toLowerCase().includes(term);
            })
        );
    }, [data, searchTerm, columns]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const paginatedData = filteredData.slice(startIdx, startIdx + pageSize);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const hasActions = showActions && (actions.onView || actions.onEdit || actions.onCopy || actions.onDelete);

    return (
        <div className="w-full">
            {/* Search Bar */}
            {searchable && (
                <div className="mb-3 md:mb-4 flex justify-end">
                    <div className="relative w-full search-bar-responsive">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            placeholder={searchPlaceholder}
                            className="w-full bg-[#1a2035] border border-white/10 rounded-md pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#4caf50] transition-colors"
                        />
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            <div className="block table-wrapper">
                <table className="table-standard custom-table">
                    <thead>
                        <tr>
                            {hasActions && <th style={{ width: '130px' }}>Actions</th>}
                            {columns.map((col, i) => (
                                <th key={i} style={col.width ? { width: col.width } : {}}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="text-center py-8 text-slate-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIdx) => (
                                <tr key={row.id || rowIdx}>
                                    {hasActions && (
                                        <td>
                                            <div className="action-icons">
                                                {actions.onView && (
                                                    <button className="action-icon action-icon-view" onClick={() => actions.onView(row)} title="View">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {actions.onEdit && (
                                                    <button className="action-icon action-icon-edit" onClick={() => actions.onEdit(row)} title="Edit">
                                                        <SquarePen className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {actions.onCopy && (
                                                    <button className="action-icon action-icon-copy" onClick={() => actions.onCopy(row)} title="Copy">
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {actions.onDelete && (
                                                    <button className="action-icon action-icon-delete" onClick={() => actions.onDelete(row)} title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx}>
                                            {col.render ? col.render(row[col.key], row) : (
                                                <span className={col.className || ''}>
                                                    {row[col.key] ?? '—'}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>


            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1 flex-wrap gap-2 pagination-row">
                    <span className="text-slate-500 text-xs sm:text-sm">
                        {startIdx + 1}–{Math.min(startIdx + pageSize, filteredData.length)} of {filteredData.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="action-icon disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => goToPage(pageNum)}
                                    className={`w-8 h-8 rounded-md text-sm font-medium transition-all ${currentPage === pageNum
                                        ? 'bg-[#288c6c] text-white'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="action-icon disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
