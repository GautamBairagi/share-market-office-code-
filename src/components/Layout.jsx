import { useState, useMemo } from 'react';
import { Menu, X, Search } from 'lucide-react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import NotificationPopup from './common/NotificationPopup';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../hooks/useSearch';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import SearchResultsModal from './SearchResultsModal';
import * as api from '../services/api';
import logo from '../assets/finallogo.png';
import LatencyMonitor from './LatencyMonitor';


const Layout = ({ children, onLogout, onNavigate, currentView }) => {
    const { user, logoPath, theme, isSuperAdmin } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [mobileSearchQuery, setMobileSearchQuery] = useState('');
    const [showSearchModal, setShowSearchModal] = useState(false);

    const { search, results, isLoading, error, message, query } = useSearch();

    const { isListening, startListening, stopListening, isSupported: voiceSupported } = useVoiceSearch({
        onTranscript: (transcript) => {
            setMobileSearchQuery(transcript);
            handleSearch(transcript);
        }
    });

    const handleSearch = async (queryText) => {
        const q = queryText || mobileSearchQuery;
        if (!q.trim()) return;
        setShowSearchModal(true);
        await search(q);
    };

    const handleMobileSearch = (e) => {
        e.preventDefault();
        handleSearch();
    };

    // Admins see their uploaded logo; SuperAdmin always sees the bundled default logo
    const resolvedLogo = (user?.role === 'ADMIN' && logoPath)
        ? (logoPath.startsWith('http') ? logoPath : `${api.UPLOADS_BASE_URL}${logoPath}`)
        : logo;

    // Navbar gradient uses theme CSS variables
    const navbarStyle = useMemo(() => ({
        background: `linear-gradient(60deg, ${theme?.navbarColor || '#288c6c'}, ${theme?.primaryColor || '#4ea752'})`,
    }), [theme?.navbarColor, theme?.primaryColor]);

    return (
        <div className="flex flex-col h-screen overflow-hidden w-full fixed inset-0" style={{ backgroundColor: 'var(--bg-color, #1a2035)', color: 'var(--text-color, #ffffff)' }}>
            {/* Popup Notification - Disabled for SUPERADMIN */}
            {user && !isSuperAdmin() && <NotificationPopup user={user} />}

            {/* TopBar Area */}
            <header className="w-full z-40 flex-shrink-0 shadow-lg relative">
                {/* Desktop TopBar — hidden on mobile and tablet */}
                <div className="hidden lg:block">
                    <TopBar
                        currentViewLabel={currentView}
                        onLogout={onLogout}
                        onNavigate={onNavigate}
                    />
                </div>

                {/* Mobile Header - WebView Optimized */}
                <div
                    className="flex items-center justify-between lg:hidden text-white relative z-50"
                    style={{
                        ...navbarStyle,
                        minHeight: '64px',
                        paddingLeft: '16px',
                        paddingRight: '12px',
                        paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
                        paddingBottom: '12px'
                    }}
                >
                    {/* Left Section: Menu + Logo */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            minWidth: 0,
                            flexGrow: 1,
                            gap: '8px'
                        }}
                    >
                        {/* Menu Button */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                minWidth: '40px',
                                minHeight: '40px',
                                padding: '8px',
                                marginLeft: '-8px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                flex: '0 0 auto'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            onTouchStart={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onTouchEnd={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            aria-label="Menu"
                        >
                            {isSidebarOpen ? (
                                <X style={{ width: '24px', height: '24px', color: 'white' }} />
                            ) : (
                                <Menu style={{ width: '24px', height: '24px', color: 'white' }} />
                            )}
                        </button>

                        {/* Logo */}
                        <div
                            onClick={() => onNavigate('dashboard')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '40px',
                                cursor: 'pointer',
                                flex: '0 0 auto',
                                minWidth: 0,
                                maxWidth: 'calc(100vw - 200px)'
                            }}
                        >
                            <img
                                src={resolvedLogo}
                                alt="Logo"
                                style={{
                                    height: '36px',
                                    maxWidth: '120px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    transition: 'transform 0.2s ease',
                                    display: 'block'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right Section: Icons (Fixed Width Container) */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            flex: '0 0 auto',
                            marginLeft: '8px',
                            gap: '4px'
                        }}
                    >
                        <div style={{ marginRight: '8px' }}>
                            <LatencyMonitor />
                        </div>
                        {/* Search Button */}
                        <button
                            onClick={() => setShowMobileSearch(v => !v)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                minWidth: '40px',
                                minHeight: '40px',
                                padding: '8px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                flex: '0 0 auto'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            onTouchStart={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onTouchEnd={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            aria-label="Search"
                        >
                            <Search style={{ width: '20px', height: '20px', color: 'white', flexShrink: 0 }} />
                        </button>

                        {/* Settings Button */}
                        <button
                            onClick={() => onNavigate?.('global-settings')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                minWidth: '40px',
                                minHeight: '40px',
                                padding: '8px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                flex: '0 0 auto'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            onTouchStart={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onTouchEnd={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            aria-label="Settings"
                        >
                            <svg
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    color: 'white',
                                    fill: 'none',
                                    stroke: 'currentColor',
                                    flexShrink: 0
                                }}
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>

                        {/* Notifications Button */}
                        <button
                            onClick={() => onNavigate?.('notifications')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                minWidth: '40px',
                                minHeight: '40px',
                                padding: '8px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                flex: '0 0 auto'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            onTouchStart={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onTouchEnd={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            aria-label="Notifications"
                        >
                            <svg
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    color: 'white',
                                    fill: 'none',
                                    stroke: 'currentColor',
                                    flexShrink: 0
                                }}
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar - AI Styled */}
                {showMobileSearch && (
                    <div className="lg:hidden relative z-50 animate-in slide-in-from-top duration-300 shadow-2xl overflow-hidden" style={navbarStyle}>
                        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                        {/* AI Glow Background */}
                        <div className="absolute -inset-4 opacity-30 pointer-events-none"
                            style={{
                                background: isListening ? 'radial-gradient(circle, #ef4444 0%, transparent 70%)' : 'radial-gradient(circle, #4ade80 0%, transparent 70%)',
                                filter: 'blur(20px)',
                                animation: 'aiGlowPulse 2s infinite'
                            }}
                        />

                        <form onSubmit={handleMobileSearch} className="relative flex items-center gap-3 px-4 py-4 w-full">
                            <div className="flex-1 relative">
                                {/* Sparkles inside bar */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="absolute w-1 h-1 bg-white/40 rounded-full animate-pulse"
                                            style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${i * 0.5}s` }} />
                                    ))}
                                </div>

                                <input
                                    autoFocus
                                    type="text"
                                    value={mobileSearchQuery}
                                    onChange={e => setMobileSearchQuery(e.target.value)}
                                    placeholder={isListening ? "Listening..." : "Ask AI searching..."}
                                    className="w-full bg-white/10 border border-white/20 rounded-full pl-5 pr-12 py-3 text-white text-sm placeholder-white/50 focus:outline-none focus:bg-white/20 transition-all backdrop-blur-md"
                                />

                                {voiceSupported && (
                                    <button
                                        type="button"
                                        onClick={isListening ? stopListening : startListening}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-white/60 hover:text-white'}`}
                                    >
                                        <div className="relative">
                                            {isListening && <div className="absolute -inset-2 bg-red-500/30 rounded-full animate-ping" />}
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
                                            </svg>
                                        </div>
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => { setShowMobileSearch(false); stopListening(); }}
                                className="p-2 text-white/70 hover:text-white flex-shrink-0"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </form>
                    </div>
                )}
            </header>

            {/* AI Search Results Modal Component */}
            {showSearchModal && (
                <SearchResultsModal
                    results={results}
                    query={query}
                    message={message}
                    isLoading={isLoading}
                    error={error}
                    onClose={() => { setShowSearchModal(false); setMobileSearchQuery(''); }}
                    onNavigate={onNavigate}
                />
            )}

            <div className="flex flex-1 overflow-hidden relative w-full">
                {/* PERSISTENT SIDEBAR */}
                <Sidebar
                    onLogout={onLogout}
                    onNavigate={onNavigate}
                    currentView={currentView}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                {/* Backdrop for mobile */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* DYNAMIC CONTENT AREA */}
                <main
                    id="content-area"
                    className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto flex flex-col p-2 sm:p-4 lg:p-6 safe-bottom relative scroll-smooth"
                    style={{ backgroundColor: 'var(--bg-color, #1a2035)' }}
                >
                    <div className={`w-full flex flex-col flex-1 min-h-0 animate-in fade-in duration-500 fill-mode-both ${(currentView === 'market-watch' || currentView === 'market-data' || currentView === 'kite-dashboard') ? 'max-w-none' : 'max-w-[1600px] mx-auto'
                        }`}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
