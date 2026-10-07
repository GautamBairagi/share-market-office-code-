import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Download, Settings, RefreshCw, Trash2, Send, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import api from '../../utils/api';
import { BASE_URL as API_BASE_URL } from '../../services/api';

const ScriptDataPage = () => {
    // Today's date in YYYY-MM-DD format
    const getTodayString = () => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const getCurrentHour = () => String(new Date().getHours()).padStart(2, '0');
    const getCurrentMinute = () => String(new Date().getMinutes()).padStart(2, '0');

    // Filter states - Default Hour to 'ALL' or current hour
    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [selectedHour, setSelectedHour] = useState(getCurrentHour());
    const [selectedMinute, setSelectedMinute] = useState(getCurrentMinute());
    const [selectedScrip, setSelectedScrip] = useState('Select Scrip');

    // Data & UI states
    const [scripsList, setScripsList] = useState([]);
    const [items, setItems] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalDbCount, setTotalDbCount] = useState(0);
    const [countLoading, setCountLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Settings Modal State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [exportSettings, setExportSettings] = useState({
        export_email: '',
        export_destination: 'EMAIL',
        google_drive_folder_id: '',
        auto_clean_days: 7
    });

    // 1. Fetch available scrips dropdown list
    const fetchScrips = useCallback(async () => {
        try {
            const res = await api.get('/scrip-ticks/scrips');
            if (res.data?.data) {
                setScripsList(res.data.data);
            }
        } catch (err) {
            console.error('[ScriptDataPage] Error fetching scrip list:', err);
        }
    }, []);

    // 2. Fetch Export Settings
    const fetchSettings = useCallback(async () => {
        try {
            const res = await api.get('/scrip-ticks/settings');
            if (res.data?.settings) {
                setExportSettings(res.data.settings);
            }
        } catch (err) {
            console.error('[ScriptDataPage] Error fetching settings:', err);
        }
    }, []);

    // 3. Fetch Total DB Tick Records Count
    const fetchTotalDbCount = useCallback(async () => {
        setCountLoading(true);
        try {
            const res = await api.get('/scrip-ticks/total-count');
            if (res.data?.count !== undefined) {
                setTotalDbCount(res.data.count);
            }
        } catch (err) {
            console.error('[ScriptDataPage] Error fetching total DB count:', err);
        } finally {
            setCountLoading(false);
        }
    }, []);

    // 4. Fetch tick data history
    const handleShowData = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        try {
            const params = {
                date: selectedDate,
                hour: selectedHour,
                minute: selectedMinute,
                scripId: selectedScrip === 'Select Scrip' ? 'ALL' : selectedScrip,
                limit: 500
            };

            const res = await api.get('/scrip-ticks/history', { params });

            if (res.data?.items) {
                setItems(res.data.items);
                setTotalCount(res.data.total !== undefined ? res.data.total : res.data.items.length);
            } else {
                setItems([]);
                setTotalCount(0);
            }
        } catch (err) {
            console.error('[ScriptDataPage] Error fetching tick history:', err);
            const errMsg = err.response?.data?.message || err.message;
            if (errMsg !== 'Canceled' && !errMsg.includes('canceled')) {
                setMessage({ type: 'error', text: errMsg || 'Failed to fetch scrip data' });
            }
        } finally {
            setLoading(false);
        }
    }, [selectedDate, selectedHour, selectedMinute, selectedScrip]);

    useEffect(() => {
        fetchScrips();
        fetchSettings();
        fetchTotalDbCount();
        handleShowData();
    }, [fetchScrips, fetchSettings, fetchTotalDbCount, handleShowData]);

    // 5. Save Settings Modal Handler
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post('/scrip-ticks/settings', exportSettings);
            setMessage({ type: 'success', text: 'Export settings updated successfully!' });
            setShowSettingsModal(false);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
        } finally {
            setActionLoading(false);
        }
    };

    // 6. Instant Export & Clear DB Handler with Active Progress Polling
    const handleInstantExportAndClear = async () => {
        if (!window.confirm('Are you sure you want to export tick data to Amazon S3 (.zip archive via email) and clear the database now?')) {
            return;
        }

        setActionLoading(true);
        setIsExporting(true);
        setMessage({
            type: 'info',
            text: '⚡ Export & Clear initiated! Archiving records, uploading to Amazon S3, and clearing database...'
        });

        try {
            const res = await api.post('/scrip-ticks/cleanup', { forceAll: true }, { timeout: 120000 });
            
            // Poll DB count every 2 seconds for up to 14 seconds to wait for worker truncate to complete
            let attempts = 0;
            const pollInterval = setInterval(async () => {
                attempts++;
                await fetchTotalDbCount();
                await handleShowData();

                if (attempts >= 7) {
                    clearInterval(pollInterval);
                    setIsExporting(false);
                    setActionLoading(false);
                    setMessage({
                        type: 'success',
                        text: res.data?.message || '✅ Database cleared and exported successfully!'
                    });
                }
            }, 2000);

        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to execute export & clear' });
            setActionLoading(false);
            setIsExporting(false);
        }
    };

    // 7. Direct PDF Download Handler
    const handleDownloadPdf = async () => {
        setActionLoading(true);
        try {
            const scrip = selectedScrip === 'Select Scrip' ? 'ALL' : selectedScrip;
            const response = await api.get('/scrip-ticks/export-pdf', {
                params: { date: selectedDate, scripId: scrip },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ScriptData_${scrip}_${selectedDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setMessage({ type: 'success', text: 'PDF Report downloaded successfully!' });
        } catch (err) {
            console.error('[ScriptDataPage] PDF Download error:', err);
            setMessage({ type: 'error', text: 'Failed to download PDF report' });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#111827] text-slate-100 p-4 sm:p-6 space-y-6">
            {/* Header & Action Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#1e293b] p-4 rounded-xl border border-slate-800 shadow-xl">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                        <Clock className="w-6 h-6 text-cyan-400" />
                        Script Data Monitor (Superadmin)
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Real-time rate fluctuation tracking across all market segments</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Database Total Count Badge with Manual Refresh Button */}
                    <div className="px-3.5 py-2 bg-slate-900/90 border border-cyan-500/40 rounded-lg flex items-center gap-2 shadow-inner">
                        <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-xs text-slate-300 font-medium">
                            Total DB Records: <strong className="text-white font-mono text-sm tracking-wide ml-1">{totalDbCount.toLocaleString('en-IN')}</strong>
                        </span>
                        <button
                            onClick={fetchTotalDbCount}
                            disabled={countLoading}
                            title="Refresh Total DB Count"
                            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition disabled:opacity-50 ml-1"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${countLoading ? 'animate-spin text-cyan-400' : ''}`} />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition shadow-md border border-slate-600"
                    >
                        <Settings className="w-4 h-4 text-cyan-400" />
                        Settings
                    </button>

                    <button
                        onClick={handleDownloadPdf}
                        className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition shadow-md border border-slate-600"
                    >
                        <Download className="w-4 h-4 text-emerald-400" />
                        Download PDF
                    </button>

                    <button
                        onClick={handleInstantExportAndClear}
                        disabled={actionLoading || isExporting}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800/80 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition shadow-md disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                        {(actionLoading || isExporting) ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                                <span>Exporting & Clearing DB...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Export & Clear DB Now</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Notification Alert Message / S3 Export Active Banner */}
            {message && (
                <div className={`p-3.5 rounded-lg text-sm flex items-center gap-2 border ${
                    message.type === 'error' 
                        ? 'bg-red-900/40 border-red-500/50 text-red-200' 
                        : message.type === 'info'
                        ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-200 animate-pulse'
                        : 'bg-emerald-900/40 border-emerald-500/50 text-emerald-200'
                }`}>
                    {message.type === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    ) : message.type === 'info' ? (
                        <RefreshCw className="w-5 h-5 text-cyan-400 shrink-0 animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Filter Section - Matching attached UI design */}
            <div className="bg-[#1e293b] p-4 sm:p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Picker */}
                    <div className="relative">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-white text-slate-900 text-sm font-semibold rounded px-3 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                        />
                    </div>

                    {/* Hour Select */}
                    <select
                        value={selectedHour}
                        onChange={(e) => setSelectedHour(e.target.value)}
                        className="bg-white text-slate-900 text-sm font-semibold rounded px-3 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer min-w-[90px]"
                    >
                        <option value="ALL">ALL (Hrs)</option>
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>

                    {/* Minute Select */}
                    <select
                        value={selectedMinute}
                        onChange={(e) => setSelectedMinute(e.target.value)}
                        className="bg-white text-slate-900 text-sm font-semibold rounded px-3 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer min-w-[90px]"
                    >
                        <option value="ALL">ALL (Min)</option>
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    {/* Scrip Select Dropdown */}
                    <select
                        value={selectedScrip}
                        onChange={(e) => setSelectedScrip(e.target.value)}
                        className="bg-white text-slate-900 text-sm font-semibold rounded px-3 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer min-w-[200px] max-w-[300px]"
                    >
                        <option value="Select Scrip">Select Scrip</option>
                        <option value="ALL">-- ALL SCRIPS --</option>
                        {scripsList.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    {/* SHOW DATA Button (Cyan Theme) */}
                    <button
                        onClick={handleShowData}
                        disabled={loading}
                        className="bg-[#00acc1] hover:bg-[#00838f] text-white font-bold text-sm tracking-wider uppercase px-6 py-2 rounded transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                        SHOW DATA
                    </button>
                </div>

                {/* Subtext note matching image */}
                <p className="text-xs text-slate-400 font-medium">
                    Note: Time is in 24 hours format. For example, For 8 PM, Select 20 in hours.
                </p>
            </div>

            {/* Main Data Table Section */}
            <div className="bg-[#1e293b] p-4 sm:p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
                <div className="flex justify-between items-center text-sm font-medium text-slate-300 border-b border-slate-800 pb-3">
                    <span>Showing <strong className="text-white font-bold">{totalCount}</strong> of items.</span>
                    {loading && <span className="text-cyan-400 text-xs flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching live tick logs...</span>}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="text-slate-300 font-bold uppercase border-b border-slate-700/80 bg-slate-800/40">
                                <th className="py-3 px-3">ID</th>
                                <th className="py-3 px-3">Scrip ID <span className="text-slate-400">⇑</span></th>
                                <th className="py-3 px-3">Exchange Time</th>
                                <th className="py-3 px-3">System Time</th>
                                <th className="py-3 px-3 text-right">Bid</th>
                                <th className="py-3 px-3 text-right">Ask</th>
                                <th className="py-3 px-3 text-right">High</th>
                                <th className="py-3 px-3 text-right">Low</th>
                                <th className="py-3 px-3 text-right">LTP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-slate-500 italic">
                                        {loading ? 'Loading tick history...' : 'No tick records found for selected filter criteria.'}
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-800/60 transition-colors">
                                        <td className="py-2.5 px-3 font-mono text-slate-400">{item.id}</td>
                                        <td className="py-2.5 px-3 font-bold text-cyan-300">{item.scripId}</td>
                                        <td className="py-2.5 px-3 text-slate-300">{item.exchangeTime}</td>
                                        <td className="py-2.5 px-3 text-slate-300">{item.systemTime}</td>
                                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">{Number(item.bid || 0).toFixed(2)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono text-red-400">{Number(item.ask || 0).toFixed(2)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{Number(item.high || 0).toFixed(2)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{Number(item.low || 0).toFixed(2)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{Number(item.ltp || 0).toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Export Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-cyan-400" />
                                Export & Cleanup Settings
                            </h3>
                            <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Export Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={exportSettings.export_email || ''}
                                    onChange={(e) => setExportSettings({ ...exportSettings, export_email: e.target.value })}
                                    placeholder="e.g. superadmin@example.com"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                <span className="text-[11px] text-slate-400">PDF report will be automatically attached and emailed to this address before database cleanup.</span>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Export Destination</label>
                                <select
                                    value={exportSettings.export_destination || 'EMAIL'}
                                    onChange={(e) => setExportSettings({ ...exportSettings, export_destination: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="EMAIL">Email Only</option>
                                    <option value="DRIVE">Google Drive Only</option>
                                    <option value="BOTH">Both Email & Google Drive</option>
                                </select>
                            </div>

                            {exportSettings.export_destination !== 'EMAIL' && (
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Google Drive Folder ID / Target</label>
                                    <input
                                        type="text"
                                        value={exportSettings.google_drive_folder_id || ''}
                                        onChange={(e) => setExportSettings({ ...exportSettings, google_drive_folder_id: e.target.value })}
                                        placeholder="Enter Google Drive Folder ID"
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                            )}

                            <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-3.5 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Auto Cleanup Schedule
                                    </label>
                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
                                        Every Sunday @ 12:00 AM (Midnight)
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    All weekly tick data will be automatically archived into a partitioned <span className="text-slate-200 font-semibold">.ZIP archive</span>, uploaded to <span className="text-cyan-300 font-semibold">Amazon S3</span>, and sent to your email with a direct download link before clearing the database table.
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setShowSettingsModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold flex items-center gap-2"
                                >
                                    {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScriptDataPage;
