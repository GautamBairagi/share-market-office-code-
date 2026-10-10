const displaySymbol = (row) => {
    const raw = typeof row === 'string' ? row : (row?.symbol || '');
    if (!raw) return '';
    
    const parts = raw.split(':');
    // If it has a prefix (e.g. MCX:CRUDEOIL26JUNFUT), split it.
    // However, some crypto or forex might have : inside them? Usually they are CRYPTO:BTCUSD etc.
    const exchange = parts[0] || '';
    const tradingSymbol = parts.length > 1 ? parts.slice(1).join(':') : raw;

    // Crypto/Forex/Commodity — show name if available
    if (typeof row === 'object' && row !== null && (exchange === 'CRYPTO' || exchange === 'FOREX' || exchange === 'COMMODITY') && row?.name) {
        return row.name;
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

console.log("Result for object:", displaySymbol({ symbol: 'CRYPTO:DOGE/USD' }));
console.log("Result for string:", displaySymbol('CRYPTO:DOGE/USD'));
