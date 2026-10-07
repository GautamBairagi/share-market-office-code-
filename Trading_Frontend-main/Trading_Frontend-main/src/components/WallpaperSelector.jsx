import React, { useState, useRef, useEffect } from 'react';
import { Image, Upload, X, Check, ChevronDown } from 'lucide-react';
import { WALLPAPERS } from '../data/wallpapers';

/**
 * WallpaperSelector — top-right dropdown button
 * Props:
 *   selectedId   : string   — currently active wallpaper id (or 'custom')
 *   onSelect     : (wallpaper) => void  — called with { id, name, url, isCustom? }
 */
const WallpaperSelector = ({ selectedId, onSelect }) => {
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);
    const triggerRef = useRef(null);

    const current = WALLPAPERS.find(w => w.id === selectedId) || WALLPAPERS[0];

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (
                panelRef.current && !panelRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)
            ) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Handle custom file upload
    const handleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        onSelect({ id: 'custom', name: file.name.replace(/\.[^.]+$/, ''), url, isCustom: true });
        setOpen(false);
    };

    return (
        <div style={{ position: 'relative', zIndex: 100 }}>
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                onClick={() => setOpen(v => !v)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    color: 'white', fontSize: '13px', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                }}
            >
                <Image style={{ width: 15, height: 15 }} />
                Wallpaper
                <ChevronDown
                    style={{
                        width: 14, height: 14,
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                    }}
                />
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div
                    ref={panelRef}
                    style={{
                        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                        width: '340px',
                        background: 'rgba(15, 20, 40, 0.92)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        padding: '14px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        animation: 'fadeSlideDown 0.18s ease'
                    }}
                >
                    <style>{`
                        @keyframes fadeSlideDown {
                            from { opacity: 0; transform: translateY(-6px); }
                            to   { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>Choose Wallpaper</span>
                        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                            <X style={{ width: 15, height: 15 }} />
                        </button>
                    </div>

                    {/* Grid of presets */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxHeight: '380px', overflowY: 'auto', marginBottom: '10px' }}>
                        {WALLPAPERS.map(wp => {
                            const isActive = selectedId === wp.id;
                            return (
                                <div
                                    key={wp.id}
                                    onClick={() => { onSelect(wp); setOpen(false); }}
                                    style={{
                                        position: 'relative', borderRadius: '8px', overflow: 'hidden',
                                        cursor: 'pointer', aspectRatio: '16/9',
                                        background: wp.fallback,
                                        border: isActive ? '2px solid #4caf50' : '2px solid transparent',
                                        boxShadow: isActive ? '0 0 0 1px #4caf50, 0 4px 16px rgba(76,175,80,0.4)' : 'none',
                                        transition: 'all 0.15s',
                                        transform: isActive ? 'scale(1.03)' : 'scale(1)',
                                    }}
                                    title={wp.name}
                                >
                                    <img
                                        src={wp.url}
                                        alt={wp.name}
                                        loading="lazy"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        onError={e => { e.target.style.display = 'none'; }}
                                    />
                                    {/* Name overlay */}
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                                        padding: '12px 6px 5px',
                                        fontSize: '9px', fontWeight: 'bold', color: 'white',
                                        textAlign: 'center', letterSpacing: '0.03em',
                                        textTransform: 'uppercase'
                                    }}>
                                        {wp.name}
                                    </div>
                                    {/* Active tick */}
                                    {isActive && (
                                        <div style={{
                                            position: 'absolute', top: '4px', right: '4px',
                                            background: '#4caf50', borderRadius: '50%',
                                            width: '18px', height: '18px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Check style={{ width: 11, height: 11, color: 'white' }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' }} />

                    {/* Upload custom */}
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        cursor: 'pointer', padding: '10px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)',
                        transition: 'background 0.15s',
                        color: '#94a3b8', fontSize: '12px', fontWeight: '600'
                    }}>
                        <Upload style={{ width: 15, height: 15, color: '#4caf50' }} />
                        Upload your own image
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            )}
        </div>
    );
};

export default WallpaperSelector;
