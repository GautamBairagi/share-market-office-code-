import React from 'react';

const ScrollingTicker = ({ messages = [] }) => {
    if (!messages.length) return null;

    return (
        <div className="w-full bg-[#0b1426] border-b border-[#288c6c] h-9 flex items-center overflow-hidden relative z-[45]">
            <div className="flex whitespace-nowrap animate-ticker hover:pause">
                {/* Repetition for seamless loop */}
                {[...messages, ...messages].map((msg, idx) => (
                    <div key={idx} className="flex items-center">
                        <div className="flex items-center gap-2.5 px-6">
                            <div className={`w-1.5 h-1.5 rounded-full ${msg.type === 'danger'
                                ? 'bg-[#ef4444]'
                                : 'bg-[#22c55e]'
                                }`} />
                            <span className="text-[10px] font-black text-slate-200 uppercase tracking-[0.05em]">
                                {msg.text}
                            </span>
                        </div>
                        <span className="text-[#1e293b] font-light">|</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScrollingTicker;
