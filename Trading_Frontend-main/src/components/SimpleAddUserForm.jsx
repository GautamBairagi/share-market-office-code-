import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, User, Mail, Lock, Shield, Phone } from 'lucide-react';
import * as api from '../services/api';

// ── Menu permission groups ────────────────────────────────────────────────────
const MENU_GROUPS = [
    {
        group: 'Dashboard',
        items: [
            { id: 'dashboard', label: 'Dashboard (Live M2M)' },
            { id: 'kite-dashboard', label: 'Live Quotes' },
            { id: 'voice-modulation', label: 'Voice Modulation' },
            { id: 'market-watch', label: 'Market Watch' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'user-notifications', label: 'Sent Message' },
        ],
    },
    {
        group: 'Positions & Trades',
        items: [
            { id: 'active-positions', label: 'Active Positions' },
            { id: 'closed-positions', label: 'Closed Positions' },
            { id: 'trades', label: 'Trades' },
            { id: 'closed-trades', label: 'Closed Trades' },
            { id: 'deleted-trades', label: 'Deleted Trades' },
            { id: 'group-trades', label: 'Group Trades' },
            { id: 'pending-orders', label: 'Pending Orders' },
        ],
    },
    {
        group: 'User Management',
        items: [
            { id: 'trading-clients', label: 'Trading Clients' },
            { id: 'brokers', label: 'Brokers' },
        ],
    },
    {
        group: 'Wallet & Finance',
        items: [
            { id: 'funds', label: 'Trader Funds' },
            { id: 'withdrawal-requests', label: 'Withdrawal Requests' },
            { id: 'deposit-requests', label: 'Deposit Requests' },
            { id: 'negative-balance', label: 'Negative Balance Txns' },
        ],
    },
    {
        group: 'Accounts',
        items: [
            { id: 'accounts', label: 'Accounts' },
            { id: 'broker-accounts', label: 'Broker Accounts' },
        ],
    },
    {
        group: 'Reports & Logs',
        items: [
            { id: 'action-ledger', label: 'Action Ledger' },
            { id: 'ip-logins', label: 'IP Logins' },
            { id: 'trade-ip-tracking', label: 'Trade IP Tracking' },
        ],
    },
    {
        group: 'Settings',
        items: [
            { id: 'tickers', label: 'Tickers' },
            { id: 'banned', label: 'Banned Limit Orders' },
            { id: 'bank', label: 'Bank Details' },
            { id: 'new-client-bank', label: 'Bank Details For New Clients' },
            { id: 'global-updation', label: 'Global Updation' },
            { id: 'change-password', label: 'Change Login Password' },
            { id: 'change-transaction-password', label: 'Change Transaction Password' },
            { id: 'expiry-rules', label: 'Expiry Rules' },
        ],
    },
    {
        group: 'Other',
        items: [
            { id: 'support', label: 'Support Tickets' },
        ],
    },
];

const ALL_MENU_IDS = MENU_GROUPS.flatMap(g => g.items.map(i => i.id));

// ── Theme colour fields ───────────────────────────────────────────────────────
const COLOR_FIELDS = [
    { key: 'sidebarColor', label: 'Sidebar Color', default: '#1a2035' },
    { key: 'navbarColor', label: 'Navbar Color', default: '#288c6c' },
    { key: 'primaryColor', label: 'Primary Color', default: '#4ea752' },
    { key: 'buttonColor', label: 'Button Color', default: '#4CAF50' },
    { key: 'backgroundColor', label: 'Background Color', default: '#1a2035' },
    { key: 'textColor', label: 'Text Color', default: '#ffffff' },
];

const DEFAULT_COLORS = Object.fromEntries(COLOR_FIELDS.map(f => [f.key, f.default]));

// ── Component ─────────────────────────────────────────────────────────────────
// Props:
//   role            - 'Admin' | 'Broker' etc.
//   onBack          - go back callback
//   onSave          - success callback
//   editMode        - boolean, true = editing existing admin
//   initialData     - existing admin object { id, full_name, email, mobile, username }
//   initialPerms    - existing menu permissions array
//   initialColors   - existing theme colors object
//   initialLogoPath - existing logo URL string

const SimpleAddUserForm = ({ role, onBack, onSave, editMode = false, initialData = null, initialPerms = [], initialColors = null, initialLogoPath = null, initialProfileImagePath = null }) => {
    const isAdmin = role?.toUpperCase() === 'ADMIN';

    const [formData, setFormData] = useState({
        fullName: initialData?.full_name || '',
        email: initialData?.email || '',
        username: initialData?.username || '',
        password: '',
        mobile: initialData?.mobile || '',
    });
    const [menuPermissions, setMenuPermissions] = useState(initialPerms);
    const [colors, setColors] = useState(initialColors ? { ...DEFAULT_COLORS, ...initialColors } : { ...DEFAULT_COLORS });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(
        initialLogoPath
            ? (initialLogoPath.startsWith('http') ? initialLogoPath : `${api.BASE_URL.replace('/api', '')}${initialLogoPath}`)
            : null
    );
    const [bgImageFile, setBgImageFile] = useState(null);
    const [bgImagePreview, setBgImagePreview] = useState(null);
    const [bgImageUploadedUrl, setBgImageUploadedUrl] = useState(null);
    const bgImageInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const logoInputRef = useRef(null);

    // Sync initialPerms if parent loads them async
    useEffect(() => { setMenuPermissions(initialPerms); }, [initialPerms.length]);

    // Sync initialColors if parent loads them async
    useEffect(() => {
        if (initialColors && Object.keys(initialColors).length) {
            setColors(prev => ({ ...prev, ...initialColors }));
        }
    }, [JSON.stringify(initialColors)]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleMenu = (id) => setMenuPermissions(prev =>
        prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );

    const handleColorChange = (key, value) => setColors(prev => ({ ...prev, [key]: value }));

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleBgImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBgImageFile(file);
        setBgImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            let adminId = initialData?.id;

            if (editMode && adminId) {
                // ── UPDATE existing admin ──
                const payload = {
                    full_name: formData.fullName,
                    email: formData.email,
                    mobile: formData.mobile,
                };
                await api.updateUser(adminId, payload);

                // Update password separately via the passwords endpoint (updateUser doesn't handle password)
                if (formData.password) {
                    await api.updateUserPasswords(adminId, { newPassword: formData.password });
                }

                // Save menu permissions
                if (isAdmin) {
                    try { await api.saveAdminMenuPermissions(adminId, menuPermissions); } catch (_) { }
                }
            } else {
                // ── CREATE new admin ──
                const payload = { ...formData, role: role.toUpperCase() };
                if (isAdmin) payload.menuPermissions = menuPermissions;
                const res = await api.createClient(payload);
                // Capture the new admin's ID from the response
                adminId = res?.user?.id || res?.id || adminId;
                console.log(`[${role} Created] New admin ID:`, adminId);
                if (!adminId) {
                    console.warn(`[${role} Created] ⚠️ adminId not captured from response:`, res);
                }
            }

            // Save per-admin panel settings (theme + logo)
            if (isAdmin && adminId) {
                try {
                    console.log(`[Panel Settings] Admin ID: ${adminId}`);
                    console.log(`[Panel Settings] logoFile:`, logoFile ? `${logoFile.name} (${logoFile.size} bytes)` : 'null');
                    console.log(`[Panel Settings] bgImageFile:`, bgImageFile ? `${bgImageFile.name} (${bgImageFile.size} bytes)` : 'null');
                    console.log(`[Panel Settings] Saving settings for admin ID ${adminId}...`);

                    const logoResult = await api.saveAdminPanelSettings(adminId, colors, logoFile || null, null, bgImageFile || null);
                    console.log('[Logo Upload] ✅ Success:', logoResult);

                    // Update preview with uploaded URLs from ImageKit
                    if (logoResult?.logoPath) {
                        setLogoPreview(logoResult.logoPath);
                        console.log('[Logo Upload] Logo preview updated:', logoResult.logoPath);
                    }
                    if (logoResult?.bgImagePath) {
                        setBgImageUploadedUrl(logoResult.bgImagePath);
                        setBgImagePreview(logoResult.bgImagePath);
                        console.log('[Logo Upload] BG image preview updated:', logoResult.bgImagePath);
                    }

                    setSuccess('✅ Admin created successfully with images uploaded to ImageKit!');
                } catch (logoErr) {
                    console.error('[Logo Upload] ❌ Failed:', logoErr.message);
                    setSuccess('✅ Admin created! (Images upload failed, but admin account is ready)');
                }
            } else {
                setSuccess('✅ Admin created successfully!');
            }

            if (onSave) onSave();
        } catch (err) {
            setError(err.message || `Failed to ${editMode ? 'update' : 'create'} admin`);
        } finally {
            setLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const title = editMode
        ? `Edit ${role}: ${initialData?.username || ''}`
        : `Add ${role}`;

    return (
        <div className="w-full pb-10 px-2 sm:px-4">
            <div className="w-full bg-[#202940] rounded shadow-2xl border border-white/5 overflow-hidden">

                {/* Header */}
                <div className="px-6 sm:px-8 py-5 flex items-center" style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}>
                    <button onClick={onBack} className="text-white hover:bg-black/10 p-2 rounded-full transition-colors mr-3">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-white text-xl font-bold uppercase tracking-[2px]">{title}:</h2>
                </div>

                <form onSubmit={handleSubmit} className="px-5 sm:px-8 py-8 space-y-8 bg-[#1f283e]" autoComplete="off">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded px-4 py-3 text-sm">{error}</div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded px-4 py-3 text-sm">{success}</div>
                    )}

                    {/* ── Basic Fields ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-slate-300 text-[11px] font-bold uppercase tracking-[1px] px-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                                    placeholder="Enter full name"
                                    className="w-full bg-white border border-slate-200 rounded px-10 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#4caf50]/20 focus:border-[#4caf50] transition-all placeholder:font-normal placeholder:text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-300 text-[11px] font-bold uppercase tracking-[1px] px-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                                    placeholder="name@example.com"
                                    className="w-full bg-white border border-slate-200 rounded px-10 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#4caf50]/20 focus:border-[#4caf50] transition-all placeholder:font-normal placeholder:text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-300 text-[11px] font-bold uppercase tracking-[1px] px-1">
                                Username {editMode && <span className="normal-case text-slate-500 text-[10px]">(cannot be changed)</span>}
                            </label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" name="username" value={formData.username}
                                    onChange={editMode ? undefined : handleChange}
                                    readOnly={editMode}
                                    required={!editMode}
                                    placeholder="Username"
                                    className={`w-full border rounded px-10 py-3 font-bold focus:outline-none text-sm transition-all placeholder:font-normal placeholder:text-slate-400
                                        ${editMode
                                            ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                                            : 'bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-[#4caf50]/20 focus:border-[#4caf50]'}`} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-300 text-[11px] font-bold uppercase tracking-[1px] px-1">
                                Password {editMode && <span className="normal-case text-slate-500 text-[10px]">(leave blank to keep current)</span>}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" name="password" value={formData.password} onChange={handleChange}
                                    required={!editMode}
                                    autoComplete="off"
                                    placeholder={editMode ? 'Leave blank to keep current' : 'Enter password'}
                                    className="w-full bg-white border border-slate-200 rounded px-10 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#4caf50]/20 focus:border-[#4caf50] transition-all placeholder:font-normal placeholder:text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-300 text-[11px] font-bold uppercase tracking-[1px] px-1">Mobile Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required
                                    placeholder="10-digit mobile" maxLength={10}
                                    className="w-full bg-white border border-slate-200 rounded px-10 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#4caf50]/20 focus:border-[#4caf50] transition-all placeholder:font-normal placeholder:text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* ── Admin-only sections ── */}
                    {isAdmin && (
                        <>
                            {/* ── Menu Permissions ── */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <div>
                                        <h3 className="text-white font-bold uppercase tracking-[2px] text-sm">Admin Menu Permissions</h3>
                                        <p className="text-slate-500 text-xs mt-1">Select which menus this admin can access</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setMenuPermissions([...ALL_MENU_IDS])}
                                            className="text-xs px-3 py-1 rounded border border-[#4caf50]/40 text-[#4caf50] hover:bg-[#4caf50]/10 transition-all">
                                            Select All
                                        </button>
                                        <button type="button" onClick={() => setMenuPermissions([])}
                                            className="text-xs px-3 py-1 rounded border border-slate-600 text-slate-400 hover:bg-white/5 transition-all">
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {MENU_GROUPS.map(({ group, items }) => (
                                        <div key={group}>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{group}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {items.map(({ id, label }) => (
                                                    <div key={id} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleMenu(id)}>
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
                                                            ${menuPermissions.includes(id)
                                                                ? 'border-[#4caf50] bg-[#4caf50]'
                                                                : 'border-slate-600 group-hover:border-[#4caf50]/60'}`}>
                                                            {menuPermissions.includes(id) && (
                                                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span className="text-slate-300 text-[12px] group-hover:text-white transition-colors select-none">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white/5 rounded px-4 py-2 text-xs text-slate-400">
                                    <span className="text-[#4caf50] font-bold">{menuPermissions.length}</span> of {ALL_MENU_IDS.length} menus selected
                                </div>
                            </div>

                            {/* ── Upload Theme ── */}
                            <div className="space-y-4">
                                <div className="border-b border-white/10 pb-3">
                                    <h3 className="text-white font-bold uppercase tracking-[2px] text-sm">Upload Theme</h3>
                                    <p className="text-slate-500 text-xs mt-1">Upload a background image</p>
                                </div>
                                <div className="space-y-3">
                                    {/* Background Image Upload */}
                                    <div className="bg-white/5 rounded-lg p-5 border border-white/5">
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-4">Background Image · ImageKit CDN</p>
                                        <div className="w-full h-40 rounded-lg border border-white/10 bg-[#151c2c] flex items-center justify-center overflow-hidden mb-4">
                                            {bgImagePreview
                                                ? <img src={bgImagePreview} alt="bg preview" className="w-full h-full object-cover" />
                                                : <span className="text-slate-600 text-sm">No image selected</span>}
                                        </div>
                                        <input ref={bgImageInputRef} type="file" accept="image/*" onChange={handleBgImageChange} className="hidden" />
                                        <div className="flex gap-2 flex-wrap">
                                            <button type="button" onClick={() => bgImageInputRef.current?.click()}
                                                className="text-xs px-4 py-2 rounded border border-[#4caf50]/40 text-[#4caf50] hover:bg-[#4caf50]/10 transition-all font-semibold">
                                                Choose Image
                                            </button>
                                            {bgImagePreview && (
                                                <button type="button" onClick={() => { setBgImageFile(null); setBgImagePreview(null); setBgImageUploadedUrl(null); }}
                                                    className="text-xs px-4 py-2 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all font-semibold">
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        {bgImageFile && <p className="text-slate-500 text-xs mt-3">📁 {bgImageFile.name}</p>}
                                        {bgImageUploadedUrl && bgImageUploadedUrl.includes('imagekit') && <p className="text-green-400 text-xs mt-3">✅ Uploaded to ImageKit</p>}
                                    </div>
                                </div>
                            </div>

                            {/* ── Logo Upload ── */}
                            <div className="space-y-4">
                                <div className="border-b border-white/10 pb-3">
                                    <h3 className="text-white font-bold uppercase tracking-[2px] text-sm">Navbar Logo</h3>
                                    <p className="text-slate-500 text-xs mt-1">Logo shown on the left side of the navbar · Uploaded to ImageKit CDN</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start gap-5">
                                    <div className="w-28 h-16 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {logoPreview
                                            ? <img src={logoPreview} alt="preview" className="max-h-full max-w-full object-contain" />
                                            : <span className="text-slate-600 text-[10px] text-center px-2">No logo selected</span>}
                                    </div>
                                    <div className="flex flex-col gap-2 flex-1">
                                        <p className="text-slate-400 text-xs">PNG, JPG, SVG or WEBP · Max 5 MB</p>
                                        <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                        <button type="button" onClick={() => logoInputRef.current?.click()}
                                            className="self-start text-xs px-4 py-2 rounded border border-[#4caf50]/40 text-[#4caf50] hover:bg-[#4caf50]/10 transition-all font-semibold">
                                            Choose File
                                        </button>
                                        {logoFile && <p className="text-slate-400 text-xs">📁 {logoFile.name}</p>}
                                        {logoPreview && logoPreview.includes('imagekit') && <p className="text-green-400 text-xs">✅ Uploaded to ImageKit</p>}
                                    </div>
                                </div>
                            </div>

                        </>
                    )}

                    {/* ── Submit ── */}
                    <div className="pt-4">
                        <button type="submit" disabled={loading}
                            className="w-full text-white py-3.5 rounded font-bold uppercase tracking-[2px] shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
                            style={{ background: 'linear-gradient(60deg, #288c6c, #4ea752)' }}>
                            {loading
                                ? (editMode ? 'UPDATING...' : 'CREATING...')
                                : (editMode ? `UPDATE ${role.toUpperCase()}` : `CREATE ${role.toUpperCase()}`)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SimpleAddUserForm;
