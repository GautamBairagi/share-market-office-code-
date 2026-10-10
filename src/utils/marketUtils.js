/**
 * Utility functions for market data display
 */

export const exchangeFromRow = (row) => {
    const sym = (row?.symbol || '').toUpperCase();
    if (sym.startsWith('CRYPTO:')) return 'CRYPTO';
    if (sym.startsWith('FOREX:')) return 'FOREX';
    if (sym.startsWith('COMMODITY:')) return 'COMMODITY';
    if (sym.startsWith('NSE:')) return 'NSE';
    // Use type field (set by backend buildUnifiedRow) for precise tab routing
    if (row?.type === 'FUT' && sym.startsWith('NFO:')) return 'NFO_FUT';
    if (row?.type === 'NFO_OPT') return 'NFO_OPT';
    if (row?.type === 'MCX_FUT') return 'MCX_FUT';
    if (row?.type === 'MCX_OPT') return 'MCX_OPT';
    // Fallbacks when type field is absent (e.g. search results)
    if (sym.startsWith('NFO:')) return (row?.strike != null || row?.optionType) ? 'NFO_OPT' : 'NFO_FUT';
    if (sym.startsWith('MCX:')) return (row?.strike != null || row?.optionType) ? 'MCX_OPT' : 'MCX_FUT';
    // Legacy category/type fallbacks
    if (row?.category === 'crypto' || row?.type === 'CRYPTO') return 'CRYPTO';
    if (row?.category === 'forex' || row?.type === 'FOREX') return 'FOREX';
    if (row?.category === 'commodity' || row?.type === 'COMMODITY') return 'COMMODITY';
    if (row?.type === 'NSE') return 'NSE';
    return 'OTHER';
};

export const displaySymbol = (row) => {
    const raw = typeof row === 'string' ? row : (row?.symbol || '');
    if (!raw) return '';
    
    const parts = raw.split(':');
    const exchange = parts[0] || '';
    let tradingSymbol = parts.length > 1 ? parts.slice(1).join(':') : raw;

    // Crypto/Forex/Commodity — show name if available
    if (typeof row === 'object' && row !== null && (exchange === 'CRYPTO' || exchange === 'FOREX' || exchange === 'COMMODITY') && row?.name) {
        tradingSymbol = row.name;
    }

    // Always strip common exchange prefixes (CRYPTO:, FOREX:, COMMODITY:, COMEX:, MCX:, NSE:, NFO:)
    const prefixes = ['CRYPTO:', 'FOREX:', 'COMMODITY:', 'COMEX:', 'MCX:', 'NSE:', 'NFO:'];
    for (const prefix of prefixes) {
        if (tradingSymbol.toUpperCase().startsWith(prefix)) {
            tradingSymbol = tradingSymbol.substring(prefix.length);
            break;
        }
    }

    // For futures, keep existing contract prettifier
    const futuresMatch = tradingSymbol.match(/^([A-Z]+)(\d{1,2}[A-Z]{3}\d{0,2})FUT$/);
    if (futuresMatch) return `${futuresMatch[1]} ${futuresMatch[2]}`;

    // For options, show base + strike + CE/PE when possible
    if (typeof row === 'object' && row !== null && row?.strike != null && row?.optionType) {
        return `${tradingSymbol} (${row.strike} ${row.optionType})`;
    }

    return tradingSymbol;
};

export const getScripPrice = (scrip) => {
    if (!scrip) return 0;
    return scrip.ltp || scrip.price || scrip.bid || scrip.ask || scrip.last || scrip.last_price || scrip.rate || 0;
};

export const getScripBid = (scrip) => {
    if (!scrip) return 0;
    return scrip.bid || scrip.buyPrice || getScripPrice(scrip);
};

export const getScripAsk = (scrip) => {
    if (!scrip) return 0;
    return scrip.ask || scrip.sellPrice || getScripPrice(scrip);
};
