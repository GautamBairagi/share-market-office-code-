/**
 * Trading Window Utility
 * Each segment can have different windows.
 * Example: 9:15 AM - 3:15 PM
 */

const WINDOWS = {
    'NIFTY50': { start: '09:15', end: '15:15' },
    'NIFTY_INDEX': { start: '09:15', end: '15:15' },
    'BANKNIFTY_INDEX': { start: '09:15', end: '15:15' },
    'DEFAULT': { start: '09:00', end: '23:30' } // for MCX etc.
};

export const isTradingWindowOpen = (segment = 'NIFTY50') => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const window = WINDOWS[segment] || WINDOWS['DEFAULT'];
    const [startH, startM] = window.start.split(':').map(Number);
    const [endH, endM] = window.end.split(':').map(Number);

    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    // Check if weekend
    const day = now.getDay();
    if (day === 0 || day === 6) return false;

    return currentTime >= startTime && currentTime <= endTime;
};

export const getTradingWindowText = (segment = 'NIFTY50') => {
    const window = WINDOWS[segment] || WINDOWS['DEFAULT'];
    return `${window.start} AM – ${window.end} PM`;
};
