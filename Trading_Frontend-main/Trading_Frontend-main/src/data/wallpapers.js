import mountainPeak from '../assets/wallpapers/mountain-peak.jpg';

export const WALLPAPERS = [
    {
        id: 'mountain-peak',
        name: 'Mountain Peak',
        url: mountainPeak,
        fallback: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    },
    {
        id: 'trading-floor',
        name: 'Trading Floor',
        url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&q=80',
        fallback: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
    },
];

export const DEFAULT_WALLPAPER_ID = 'mountain-peak';
