import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';

const COLOR_FIELDS = [
    { key: 'sidebarColor', label: 'Sidebar Color', desc: 'Navigation sidebar background' },
    { key: 'navbarColor', label: 'Navbar Color', desc: 'Top bar / gradient start color' },
    { key: 'primaryColor', label: 'Primary Color', desc: 'Gradient end & active highlights' },
    { key: 'buttonColor', label: 'Button Color', desc: 'Primary action buttons' },
    { key: 'backgroundColor', label: 'Background Color', desc: 'Main content area background' },
    { key: 'textColor', label: 'Text Color', desc: 'Primary text across the dashboard' },
];

const ThemeSettingsPage = () => {
    const { theme, updateTheme, logoPath, updateLogoPath } = useAuth();

    const [colors, setColors] = useState({ ...theme });
    const [saving, setSaving] = useState(false);
    const [logoSaving, setLogoSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const logoInputRef = useRef(null);

    const handleColorChange = (key, value) => {
        setColors(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveTheme = async () => {
        setSaving(true);
        setMessage('');
        setError('');
        try {
            await api.saveThemeSettings(colors);
            updateTheme(colors);
            setMessage('Theme saved and applied successfully!');
        } catch (err) {
            setError(err.message || 'Failed to save theme');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        const defaults = {
            sidebarColor: '#1a2035',
            navbarColor: '#288c6c',
            primaryColor: '#4ea752',
            buttonColor: '#4CAF50',
            backgroundColor: '#1a2035',
            textColor: '#ffffff',
        };
        setColors(defaults);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoSaving(true);
        setMessage('');
        setError('');
        try {
            const formData = new FormData();
            formData.append('logo', file);
            const res = await api.uploadLogo(formData);
            updateLogoPath(res.logoPath);
            setMessage('Logo uploaded successfully!');
        } catch (err) {
            setError(err.message || 'Failed to upload logo');
        } finally {
            setLogoSaving(false);
            e.target.value = '';
        }
    };

    const resolvedLogo = logoPath
        ? (logoPath.startsWith('http') ? logoPath : `${api.UPLOADS_BASE_URL}${logoPath}`)
        : null;


    // Live CSS variable preview
    const previewStyle = {
        '--sidebar-color': colors.sidebarColor,
        '--navbar-color': colors.navbarColor,
        '--primary-color': colors.primaryColor,
        '--button-color': colors.buttonColor,
        '--bg-color': colors.backgroundColor,
        '--text-color': colors.textColor,
    };

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-[#1f283e] rounded-lg border border-white/10 shadow-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/10" style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}>
                    <h2 className="text-white text-lg font-bold uppercase tracking-[2px]">Theme Settings</h2>
                    <p className="text-white/70 text-xs mt-1">Customize dashboard colors and logo — applies to all admins</p>
                </div>

                {/* Feedback */}
                {message && (
                    <div className="mx-6 mt-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded px-4 py-3 text-sm">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                {/* Color Pickers */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {COLOR_FIELDS.map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center gap-4 bg-white/5 rounded-lg p-4 border border-white/5">
                            <div className="relative flex-shrink-0">
                                <div
                                    className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer shadow-lg"
                                    style={{ backgroundColor: colors[key] }}
                                    onClick={() => document.getElementById(`color-${key}`).click()}
                                />
                                <input
                                    id={`color-${key}`}
                                    type="color"
                                    value={colors[key]}
                                    onChange={(e) => handleColorChange(key, e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-12 h-12"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold">{label}</p>
                                <p className="text-slate-500 text-xs">{desc}</p>
                                <input
                                    type="text"
                                    value={colors[key]}
                                    onChange={(e) => handleColorChange(key, e.target.value)}
                                    className="mt-1 bg-transparent border-b border-slate-600 text-slate-300 text-xs w-full focus:outline-none focus:border-[#4caf50] font-mono"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={handleSaveTheme}
                        disabled={saving}
                        className="flex-1 text-white py-3 rounded font-bold uppercase tracking-[2px] text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
                        style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                    >
                        {saving ? 'SAVING...' : 'SAVE THEME'}
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 rounded font-bold uppercase tracking-[2px] text-sm border border-slate-600 text-slate-400 hover:bg-white/5 transition-all"
                    >
                        RESET
                    </button>
                </div>
            </div>

            {/* Live Preview */}
            <div className="bg-[#1f283e] rounded-lg border border-white/10 shadow-xl overflow-hidden" style={previewStyle}>
                <div className="px-6 py-4 border-b border-white/10">
                    <h3 className="text-white text-sm font-bold uppercase tracking-widest">Live Preview</h3>
                </div>
                <div className="p-6 flex gap-4">
                    {/* Mini Sidebar */}
                    <div className="w-32 rounded-lg p-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--sidebar-color)' }}>
                        <div className="h-2 rounded bg-white/20 w-full" />
                        <div className="h-6 rounded w-full" style={{ background: `linear-gradient(60deg, var(--navbar-color), var(--primary-color))` }} />
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-4 rounded bg-white/10 w-full" />
                        ))}
                    </div>
                    {/* Mini Content */}
                    <div className="flex-1 rounded-lg p-3 flex flex-col gap-3" style={{ backgroundColor: 'var(--bg-color)' }}>
                        <div className="h-8 rounded w-full" style={{ background: `linear-gradient(60deg, var(--navbar-color), var(--primary-color))` }} />
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 rounded bg-white/5 border border-white/10" />
                            ))}
                        </div>
                        <button
                            className="self-start text-xs px-4 py-2 rounded font-bold"
                            style={{ backgroundColor: 'var(--button-color)', color: 'var(--text-color)' }}
                        >
                            Button
                        </button>
                    </div>
                </div>
                <div className="px-6 pb-4 text-xs font-mono text-slate-500">
                    {Object.entries(colors).map(([k, v]) => (
                        <span key={k} className="mr-4">--{k.replace(/([A-Z])/g, '-$1').toLowerCase()}: {v}</span>
                    ))}
                </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-[#1f283e] rounded-lg border border-white/10 shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                    <h3 className="text-white text-sm font-bold uppercase tracking-widest">Logo Upload</h3>
                    <p className="text-slate-500 text-xs mt-1">This logo will appear at the top of the sidebar for all users</p>
                </div>
                <div className="p-6 flex flex-col sm:flex-row items-start gap-6">
                    {/* Current Logo */}
                    <div className="w-40 h-20 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {resolvedLogo ? (
                            <img src={resolvedLogo} alt="Current Logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                            <span className="text-slate-600 text-xs">No logo set</span>
                        )}
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="text-slate-400 text-sm">
                            {resolvedLogo ? 'Current logo is shown on the left.' : 'No logo uploaded yet.'} Upload a PNG, JPG, or SVG (max 5MB).
                        </p>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => logoInputRef.current?.click()}
                            disabled={logoSaving}
                            className="self-start text-white py-2.5 px-6 rounded font-bold uppercase tracking-[2px] text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
                            style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}
                        >
                            {logoSaving ? 'UPLOADING...' : 'UPLOAD LOGO'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeSettingsPage;
