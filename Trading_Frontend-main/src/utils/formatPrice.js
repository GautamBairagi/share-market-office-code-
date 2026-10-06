/**
 * formatPrice — Smart decimal formatter for Bid / Ask / LTP
 *
 * Rules (per user requirement):
 *  • Show API value as-is.
 *  • If decimals > 4 → cap to 4 decimal places.
 *  • If decimals ≤ 4 → show exactly what API sent (no padding, no trimming).
 *  • Never show trailing zeros beyond what API provided.
 *  • 0 → '0'   null/undefined/NaN/Infinity → '-'
 */
export function formatPrice(n) {
    if (n == null || n === '' || !isFinite(Number(n))) return '-';
    const num = Number(n);
    if (num === 0) return '0';

    // Convert to string to check actual decimal places from source
    const str = num.toString();
    const dotIdx = str.indexOf('.');
    if (dotIdx === -1) return str; // No decimals — show as integer

    const decimalsInValue = str.length - dotIdx - 1;

    if (decimalsInValue <= 4) {
        // API has 4 or fewer decimals — show exactly as-is (no rounding, no padding)
        return str;
    }

    // API has more than 4 decimals — cap at 4, remove trailing zeros
    return parseFloat(num.toFixed(4)).toString();
}

/**
 * formatPriceFallback — Same as formatPrice but shows last known value when current is 0.
 * Used for bid/ask/ltp when market is closed.
 */
export function formatPriceFallback(current, lastValue) {
    const num = Number(current);
    if (num === 0 && lastValue && Number(lastValue) !== 0) {
        return formatPrice(lastValue);
    }
    return formatPrice(num);
}
