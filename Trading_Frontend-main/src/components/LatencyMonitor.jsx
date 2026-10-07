import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { Activity, Server } from 'lucide-react';

const LatencyMonitor = () => {
    const [latency, setLatency] = useState(null);
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        const checkLatency = async () => {
            const start = Date.now();
            try {
                // Call the new ping API function
                await api.ping();
                const end = Date.now();
                const diff = end - start;
                setLatency(diff);

                if (diff < 150) setStatus('excellent');
                else if (diff < 400) setStatus('good');
                else if (diff < 800) setStatus('fair');
                else setStatus('poor');
            } catch (err) {
                setStatus('error');
                setLatency(null);
            }
        };

        checkLatency();
        const interval = setInterval(checkLatency, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    const getColor = () => {
        switch (status) {
            case 'excellent': return '#10b981'; // Green
            case 'good': return '#34d399'; // Light Green
            case 'fair': return '#fbbf24'; // Yellow
            case 'poor': return '#f87171'; // Red
            case 'error': return '#ef4444'; // Bright Red
            default: return '#94a3b8'; // Slate
        }
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 group relative cursor-help" title={`Server Response Time: ${latency || 'N/A'}ms`}>
            {status === 'excellent' || status === 'good' ? (
                <Activity className="w-3.5 h-3.5" style={{ color: getColor() }} />
            ) : (
                <Server className="w-3.5 h-3.5" style={{ color: getColor() }} />
            )}

            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-tighter text-white leading-none">Net Latency</span>
                <span className="text-[12px] font-black tabular-nums leading-tight" style={{ color: getColor() === '#94a3b8' ? '#ffffff' : getColor() }}>
                    {latency !== null ? `${latency}ms` : '---'}
                </span>
            </div>

            {/* Tooltip on hover */}
            <div className="absolute top-full right-0 mt-2 p-2 bg-[#1a2240] border border-white/10 rounded shadow-2xl z-[100] w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p className="text-[10px] text-white font-bold mb-1">Network Quality: <span style={{ color: getColor() }}>{status.toUpperCase()}</span></p>
                <p className="text-[9px] text-slate-400">
                    Time taken for a round-trip to the {api.BASE_URL.includes('localhost') ? 'Local Development' : 'AWS Cloud / Production'} server.
                    {api.BASE_URL.includes('localhost')
                        ? ' On local, this should be very low (<20ms).'
                        : ' High latency (>500ms) indicates server load or region distance.'
                    }
                </p>
            </div>
        </div>
    );
};

export default LatencyMonitor;
