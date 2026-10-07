/**
 * Currency formatting utility
 * Format numbers to Indian Rupee (₹) format
 */

export const formatCurrency = (amount, options = {}) => {
    const { showSymbol = true, decimals = 2 } = options;

    if (amount === null || amount === undefined || isNaN(amount)) return '₹ 0';

    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Indian number format: 1,00,000
    const formatted = num.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    return showSymbol ? `₹ ${formatted}` : formatted;
};

export const formatCompact = (amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹ 0';

    if (Math.abs(num) >= 10000000) return `₹ ${(num / 10000000).toFixed(2)} Cr`;
    if (Math.abs(num) >= 100000) return `₹ ${(num / 100000).toFixed(2)} L`;
    if (Math.abs(num) >= 1000) return `₹ ${(num / 1000).toFixed(1)} K`;
    return `₹ ${num.toFixed(2)}`;
};

export default formatCurrency;
