import React from 'react';
import { Megaphone, X, ArrowRight } from 'lucide-react';

const PromoBanner = ({ title, message, type = 'info', onClose }) => {
    const styles = {
        info: { bg: 'bg-blue-600', gradient: 'from-blue-600 to-blue-800', iconBg: 'bg-blue-500' },
        success: { bg: 'bg-green-600', gradient: 'from-green-600 to-green-800', iconBg: 'bg-green-500' },
        warning: { bg: 'bg-amber-600', gradient: 'from-amber-600 to-amber-800', iconBg: 'bg-amber-500' },
        danger: { bg: 'bg-red-600', gradient: 'from-red-600 to-red-800', iconBg: 'bg-red-500' }
    };

    const style = styles[type] || styles.info;

    return (
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl animate-in slide-in-from-top-4 duration-500`}>
            <div className={`flex flex-col md:flex-row items-center justify-between p-6 md:p-8 bg-gradient-to-r ${style.gradient} border border-white/10`}>
                <div className="flex items-center gap-6 relative z-10">
                    <div className={`${style.iconBg} p-4 rounded-2xl shadow-xl border border-white/20 animate-bounce`}>
                        <Megaphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">{title}</h3>
                        <p className="text-white/80 text-sm font-medium max-w-xl">{message}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-6 md:mt-0 relative z-10">
                    <button className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 group shadow-xl">
                        Explore Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-3 bg-black/20 hover:bg-black/40 text-white rounded-xl transition-all border border-white/10"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />
            </div>
        </div>
    );
};

export default PromoBanner;
