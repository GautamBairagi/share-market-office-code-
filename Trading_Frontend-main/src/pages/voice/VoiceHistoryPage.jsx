/**
 * VoiceHistoryPage — Admin audit trail of all voice commands
 *
 * - Full table of every voice recording with user, command, action, result, timestamp
 * - Authenticated audio playback (JWT via axios → blob URL)
 * - Filter by user, status, date range, transcript search
 * - Expandable rows with full parsed command JSON + action result
 * - Delete recording
 * - Pagination
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Mic, Play, Pause, Trash2, ChevronDown, ChevronUp,
    Search, Filter, RefreshCcw, Loader2,
    Clock, User
} from 'lucide-react';
import api from '../../utils/api';
import useVoiceHistory from '../../hooks/useVoiceHistory';

// ── Authenticated Audio Player (JWT-aware) ────────────────────────────────────
const AuthAudio = ({ filename }) => {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(false);

    useEffect(() => {
        if (!filename) return;
        let url = null;
        setLoading(true);
        setErr(false);
        api.get(`/ai/voice/audio/${filename}`, { responseType: 'blob' })
            .then(res => { url = URL.createObjectURL(res.data); setBlobUrl(url); })
            .catch(() => setErr(true))
            .finally(() => setLoading(false));
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [filename]);

    if (!filename) return <span className="text-[11px] text-slate-600 italic">No audio</span>;
    if (loading) return (
        <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="text-[11px] text-amber-400/70">Loading audio…</span>
        </div>
    );
    if (err) return <span className="text-[11px] text-red-500/60 italic">Audio unavailable</span>;
    return <audio controls src={blobUrl} className="w-full h-7 rounded" style={{ maxWidth: 260 }} />;
};

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const cfg = {
        executed: { cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400', label: 'Executed' },
        failed:   { cls: 'bg-red-500/10 border-red-500/20 text-red-400',             dot: 'bg-red-400',     label: 'Failed'   },
        saved:    { cls: 'bg-amber-500/10 border-amber-500/20 text-amber-400',        dot: 'bg-amber-400',   label: 'Saved'    },
    }[status] || { cls: 'bg-slate-500/10 border-slate-500/20 text-slate-400', dot: 'bg-slate-400', label: status };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${cfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

export default function VoiceHistoryPage() {
    const { recordings, loading, total, pages, fetchRecordings, deleteRecording } = useVoiceHistory();
    const [filters, setFilters] = useState({ page: 1, limit: 20 });
    const [users, setUsers] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [playingId, setPlayingId] = useState(null);
    const audioRef = useRef(null);
    const [searchInput, setSearchInput] = useState('');
    const searchTimerRef = useRef(null);

    // Load only the logged-in user's trading clients for filter dropdown
    useEffect(() => {
        api.get('/users', { params: { role: 'TRADER', limit: 500 } })
            .then(res => {
                const data = res.data;
                // API may return plain array OR { users: [...] } OR { data: [...] }
                const list = Array.isArray(data) ? data : (data.users || data.data || []);
                setUsers(list);
            })
            .catch(() => setUsers([]));
    }, []);

    // Fetch recordings when filters change
    useEffect(() => {
        fetchRecordings(filters);
    }, [filters, fetchRecordings]);

    const updateFilter = useCallback((key, val) => {
        setFilters(prev => ({ ...prev, [key]: val, page: 1 }));
    }, []);

    // Debounced search handler
    const handleSearchChange = useCallback((val) => {
        setSearchInput(val);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: val, page: 1 }));
        }, 500);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ page: 1, limit: 20 });
        setSearchInput('');
    }, []);

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('Delete this voice recording permanently?')) return;
        setDeleting(id);
        await deleteRecording(id);
        setDeleting(null);
    }, [deleteRecording]);

    const toggleExpand = useCallback((id) => {
        setExpanded(prev => prev === id ? null : id);
    }, []);

    const handlePlay = useCallback(async (rec) => {
        // If already playing this one, pause it
        if (playingId === rec.id && audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setPlayingId(null);
            return;
        }
        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (!rec.audio_filename) return;
        try {
            setPlayingId(rec.id);
            const res = await api.get(`/ai/voice/audio/${rec.audio_filename}`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => { setPlayingId(null); audioRef.current = null; URL.revokeObjectURL(url); };
            audio.onerror = () => { setPlayingId(null); audioRef.current = null; URL.revokeObjectURL(url); };
            await audio.play();
        } catch {
            setPlayingId(null);
            audioRef.current = null;
        }
    }, [playingId]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6 pb-20 animate-in fade-in duration-500">

            {/* ── Page Header ── */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/20">
                            <Mic className="w-5 h-5 text-purple-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                            Voice Recordings
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
                        Complete audit trail of all voice commands executed by users
                    </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/5 border border-white/8 rounded-xl text-center">
                        <p className="text-2xl font-black text-white tabular-nums">{total}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total</p>
                    </div>
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                        <p className="text-2xl font-black text-emerald-400 tabular-nums">
                            {recordings.filter(r => r.status === 'executed').length}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Executed</p>
                    </div>
                    <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <p className="text-2xl font-black text-red-400 tabular-nums">
                            {recordings.filter(r => r.status === 'failed').length}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-600">Failed</p>
                    </div>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="custom-filter">
                <div className="custom-filter-title">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filters</span>
                </div>
                <div className="custom-filter-grid">

                    {/* User filter */}
                    <div className="custom-filter-group">
                        <label className="custom-filter-label">Username</label>
                        <select
                            value={filters.user_id || ''}
                            onChange={e => updateFilter('user_id', e.target.value)}
                            className="custom-filter-input"
                        >
                            <option value="">All Users</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.username}{u.full_name ? ` (${u.full_name})` : ''} — {u.role}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status filter */}
                    <div className="custom-filter-group">
                        <label className="custom-filter-label">Status</label>
                        <select
                            value={filters.status || ''}
                            onChange={e => updateFilter('status', e.target.value)}
                            className="custom-filter-input"
                        >
                            <option value="">All Status</option>
                            <option value="executed">Executed</option>
                            <option value="failed">Failed</option>
                            <option value="saved">Saved</option>
                        </select>
                    </div>

                    {/* Date from */}
                    <div className="custom-filter-group">
                        <label className="custom-filter-label">From Date</label>
                        <input
                            type="date"
                            value={filters.from_date || ''}
                            onChange={e => updateFilter('from_date', e.target.value)}
                            className="custom-filter-input"
                        />
                    </div>

                    {/* Date to */}
                    <div className="custom-filter-group">
                        <label className="custom-filter-label">To Date</label>
                        <input
                            type="date"
                            value={filters.to_date || ''}
                            onChange={e => updateFilter('to_date', e.target.value)}
                            className="custom-filter-input"
                        />
                    </div>

                    {/* Search */}
                    <div className="custom-filter-group" style={{ gridColumn: 'span 2' }}>
                        <label className="custom-filter-label">Search Transcript</label>
                        <div className="custom-filter-search-wrap">
                            <Search className="w-3.5 h-3.5" />
                            <input
                                type="text"
                                placeholder="Search by transcript…"
                                value={searchInput}
                                onChange={e => handleSearchChange(e.target.value)}
                                className="custom-filter-input"
                            />
                        </div>
                    </div>

                    {/* Clear + Refresh */}
                    <div className="custom-filter-group justify-end">
                        <label className="custom-filter-label" style={{ visibility: 'hidden' }}>·</label>
                        <div className="custom-filter-actions">
                            <button onClick={clearFilters} className="custom-filter-btn">
                                Clear
                            </button>
                            <button onClick={() => fetchRecordings(filters)} className="custom-filter-btn-icon">
                                <RefreshCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="table-wrapper">
                <table className="custom-table" style={{ minWidth: 1000 }}>
                    <thead>
                        <tr>
                            <th style={{ width: 120 }}>Status</th>
                            <th>Transcript / Command</th>
                            <th style={{ width: 160 }}>Username</th>
                            <th style={{ width: 160 }}>Date & Time</th>
                            <th style={{ width: 120 }}>Action</th>
                            <th style={{ width: 36 }}></th>
                            <th style={{ width: 40 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="flex items-center justify-center py-20 gap-3">
                                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                                        <span className="text-slate-500 text-sm font-medium">Loading recordings…</span>
                                    </div>
                                </td>
                            </tr>
                        ) : recordings.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                            <Mic className="w-7 h-7 text-slate-700" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white font-black uppercase tracking-widest text-sm">No Recordings Found</p>
                                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tight mt-1.5">
                                                {Object.keys(filters).some(k => k !== 'page' && k !== 'limit' && filters[k])
                                                    ? 'Try clearing your filters'
                                                    : 'No voice recordings yet'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <>
                                {recordings.map(rec => {
                                    const isExpanded = expanded === rec.id;
                                    const parsedCmd = (() => {
                                        try { return typeof rec.parsed_command === 'string' ? JSON.parse(rec.parsed_command) : rec.parsed_command; }
                                        catch { return null; }
                                    })();

                                    return (
                                        <React.Fragment key={rec.id}>
                                            <tr className="cursor-pointer" onClick={() => toggleExpand(rec.id)} style={isExpanded ? { background: 'rgba(255,255,255,0.02)' } : undefined}>
                                                {/* Status */}
                                                <td>
                                                    <StatusBadge status={rec.status} />
                                                </td>

                                                {/* Transcript + command tags */}
                                                <td>
                                                    <div className="flex flex-col gap-1.5 min-w-0">
                                                        <p className="text-[12px] text-slate-300 truncate font-medium">
                                                            {rec.transcript || <span className="text-slate-600 italic">No transcript</span>}
                                                        </p>
                                                        {parsedCmd?.action && (
                                                            <div className="flex flex-wrap gap-1">
                                                                <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/15 rounded text-[9px] font-black text-green-400 uppercase tracking-wider">
                                                                    {parsedCmd.action.replace(/_/g, ' ')}
                                                                </span>
                                                                {(parsedCmd.username || parsedCmd.userId) && (
                                                                    <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/15 rounded text-[9px] font-black text-blue-400">
                                                                        {parsedCmd.username ? `@${parsedCmd.username}` : `#${parsedCmd.userId}`}
                                                                    </span>
                                                                )}
                                                                {parsedCmd.amount && (
                                                                    <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/15 rounded text-[9px] font-black text-purple-400">
                                                                        ₹{parsedCmd.amount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Target user */}
                                                <td>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                                            <User className="w-3 h-3 text-purple-400" />
                                                        </div>
                                                        <span className="text-[11px] text-white font-bold truncate">
                                                            {rec.target_username || '—'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Date & Time */}
                                                <td>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3 text-slate-600 flex-shrink-0" />
                                                        <span className="text-[11px] text-slate-500 font-medium">
                                                            {new Date(rec.created_at).toLocaleString('en-IN', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit', hour12: true
                                                            })}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Action taken */}
                                                <td>
                                                    <span className="text-[10px] text-slate-500 font-medium truncate">
                                                        {rec.action_taken || '—'}
                                                    </span>
                                                </td>

                                                {/* Play button */}
                                                <td>
                                                    <div className="flex items-center justify-center">
                                                        {rec.audio_filename ? (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handlePlay(rec); }}
                                                                className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                                                                    playingId === rec.id
                                                                        ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                                                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                                                                }`}
                                                                title={playingId === rec.id ? 'Pause' : 'Play'}
                                                            >
                                                                {playingId === rec.id
                                                                    ? <Pause className="w-3 h-3" />
                                                                    : <Play className="w-3 h-3 ml-0.5" />
                                                                }
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-700">—</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Expand toggle */}
                                                <td>
                                                    <div className="flex items-center justify-center text-slate-600">
                                                        {isExpanded
                                                            ? <ChevronUp className="w-4 h-4" />
                                                            : <ChevronDown className="w-4 h-4" />
                                                        }
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded detail panel */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={7} style={{ padding: 0 }}>
                                                        <div className="px-5 pb-4 border-t border-white/5 bg-black/10">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                                                {/* Full transcript */}
                                                                <div>
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">Full Transcript</p>
                                                                    <div className="bg-[#1a2235] rounded-lg border border-white/8 p-3">
                                                                        <p className="text-[11px] text-slate-300 leading-relaxed italic">
                                                                            "{rec.transcript || 'No transcript available'}"
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* User info */}
                                                                <div>
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">User Details</p>
                                                                    <div className="bg-[#1a2235] rounded-lg border border-white/8 p-3 space-y-1.5">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-[10px] text-slate-600 uppercase font-bold">Executed By</span>
                                                                            <span className="text-[11px] text-white font-bold">{rec.target_username || '—'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-[10px] text-slate-600 uppercase font-bold">Target User</span>
                                                                            <span className="text-[11px] text-white font-bold">{rec.target_user_name || '—'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Audio + Delete */}
                                                                <div className="flex flex-col justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">Audio Playback</p>
                                                                        <AuthAudio filename={rec.audio_filename} />
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleDelete(rec.id)}
                                                                        disabled={deleting === rec.id}
                                                                        className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 self-end"
                                                                    >
                                                                        {deleting === rec.id
                                                                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Deleting…</>
                                                                            : <><Trash2 className="w-3 h-3" /> Delete</>
                                                                        }
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Pagination ── */}
            {pages > 1 && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={filters.page <= 1}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-400 hover:text-white disabled:opacity-30 text-[11px] font-black uppercase tracking-widest transition-all"
                    >
                        ← Prev
                    </button>
                    {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setFilters(prev => ({ ...prev, page: p }))}
                            className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${
                                filters.page === p
                                    ? 'bg-purple-500/30 border border-purple-500/40 text-purple-300'
                                    : 'bg-white/5 border border-white/8 text-slate-500 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pages, prev.page + 1) }))}
                        disabled={filters.page >= pages}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-400 hover:text-white disabled:opacity-30 text-[11px] font-black uppercase tracking-widest transition-all"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
