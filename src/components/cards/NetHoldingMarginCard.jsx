import React from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * NetHoldingMarginCard - Segment-wise margin breakdown
 * Shows: NSE Equity, MCX, Options, COMEX + Total
 * marginData comes from GET /portfolio/balance → margin_by_segment
 */
const NetHoldingMarginCard = ({ marginData = null }) => {
    const data = {
        equity: parseFloat(marginData?.EQUITY || 0),
        mcx:    parseFloat(marginData?.MCX    || 0),
        options: parseFloat(marginData?.OPTIONS || 0),
        comex:  parseFloat(marginData?.COMEX   || 0),
    };

    const total = data.equity + data.mcx + data.options + data.comex;

    const formatAmount = (amount) =>
        '₹ ' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const segments = [
        { label: 'NSE / BSE Margin', value: data.equity,  color: '#3b82f6' },
        { label: 'MCX Margin',       value: data.mcx,     color: '#ef4444' },
        { label: 'Options Margin',   value: data.options, color: '#8b5cf6' },
        { label: 'COMEX Margin',     value: data.comex,   color: '#f59e0b' },
    ];

    return (
        <div className="margin-card">
            <div className="margin-card-header flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Holding Margin Required</span>
            </div>

            <div>
                {segments.map((seg, i) => (
                    <div key={i} className="margin-card-row">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ background: seg.color }}
                            />
                            <span className="text-slate-300">{seg.label}</span>
                        </div>
                        <span className="text-white font-semibold tabular-nums">
                            {formatAmount(seg.value)}
                        </span>
                    </div>
                ))}
            </div>

            <div className="margin-card-total">
                <span className="text-white">TOTAL HOLDING MARGIN</span>
                <span className="text-[#4ade80] text-lg tabular-nums">{formatAmount(total)}</span>
            </div>
        </div>
    );
};

export default NetHoldingMarginCard;
