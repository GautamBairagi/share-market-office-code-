import React, { useState } from 'react';
import { Play, BookOpen, Video, Search, X } from 'lucide-react';

const LearningPage = ({ segment: initialSegment = 'NIFTY50' }) => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [activeFilter, setActiveFilter] = useState(initialSegment);
    const [searchQuery, setSearchQuery] = useState('');

    const videos = [
        { id: 1, title: 'Introduction to Nifty 50', youtubeId: 'dQw4w9WgXcQ', category: 'NIFTY50', duration: '12:45', views: '1.2k' },
        { id: 2, title: 'Option Chain Basics', youtubeId: '9bZkp7q19f0', category: 'BANKNIFTY_INDEX', duration: '18:20', views: '2.4k' },
        { id: 3, title: 'Scalping Strategies', youtubeId: 'kJQP7kiw5Fk', category: 'NIFTY_INDEX', duration: '10:15', views: '3.1k' },
        { id: 4, title: 'Risk Management 101', youtubeId: 'v8-8o7h2X8c', category: 'NIFTY50', duration: '15:30', views: '800' },
        { id: 5, title: 'Bank Nifty Expiry Guide', youtubeId: 'yPYZpwSpKmA', category: 'BANKNIFTY_INDEX', duration: '22:10', views: '1.9k' },
        { id: 6, title: 'Advanced Charting', youtubeId: '7e90gBu4pas', category: 'MCX', duration: '14:50', views: '4.2k' },
        { id: 7, title: 'MCX Crude Oil Strategy', youtubeId: 'v8-8o7h2X8c', category: 'MCX', duration: '11:20', views: '1.5k' },
    ];

    const filteredVideos = videos.filter(v =>
        (activeFilter === 'ALL' || v.category === activeFilter) &&
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = [
        { id: 'ALL', label: 'All Modules' },
        { id: 'NIFTY50', label: 'Nifty 50' },
        { id: 'BANKNIFTY_INDEX', label: 'Bank Nifty' },
        { id: 'MCX', label: 'MCX Commodities' }
    ];

    if (selectedVideo) {
        return (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center justify-between bg-[#1f283e] p-6 rounded-3xl border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                            <Video className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Playing Session</p>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">{selectedVideo.title}</h2>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedVideo(null)}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2 group"
                    >
                        Close Player <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="aspect-video w-full bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 relative group">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="z-10 relative"
                            ></iframe>
                        </div>

                        <div className="bg-[#1f283e] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                            <h3 className="text-xs font-black text-white mb-6 uppercase tracking-[0.4em] border-b border-white/5 pb-4">Key Learning Objectives</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    'Market psychology analysis for intraday moves',
                                    'Technical indicators setup & configuration',
                                    'Specific entry/exit rules for current segment',
                                    'Live trade walkthrough & post-analysis'
                                ].map((point, i) => (
                                    <div key={i} className="flex gap-4 items-start bg-black/20 p-4 rounded-2xl">
                                        <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        </div>
                                        <p className="text-xs text-slate-300 font-medium leading-relaxed">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <h4 className="text-xl font-black uppercase tracking-tight mb-2 italic">Special Note</h4>
                                <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6 opacity-80">
                                    This lesson is exclusive to premium users. Do not share these credentials or links externally.
                                </p>
                                <button className="w-full py-4 bg-white text-blue-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform">
                                    Download Resources
                                </button>
                            </div>
                            <BookOpen size={120} className="absolute -bottom-8 -right-8 text-white/10 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                        </div>

                        <div className="bg-[#1f283e] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Related Modules</h4>
                            <div className="space-y-4">
                                {videos.slice(0, 3).map(v => (
                                    <div key={v.id} onClick={() => setSelectedVideo(v)} className="flex gap-4 group cursor-pointer">
                                        <div className="w-20 h-14 rounded-lg bg-black/40 overflow-hidden flex-shrink-0 border border-white/5">
                                            <img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h5 className="text-[11px] font-black text-white uppercase group-hover:text-green-400 transition-colors line-clamp-1">{v.title}</h5>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{v.duration}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-700">
            {/* Header with Glass Gradient */}
            <div className="relative">
                <div className="bg-[#1f283e] rounded-[2.5rem] shadow-2xl relative pt-16 pb-12 px-12 overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div
                        className="absolute -top-6 left-8 rounded-2xl shadow-2xl px-12 py-6 z-10"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    >
                        <div className="flex items-center gap-4">
                            <BookOpen className="w-6 h-6 text-white" />
                            <h2 className="text-white text-lg font-black uppercase tracking-widest italic">Matrix Academy</h2>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mt-6 relative z-10">
                        <div className="max-w-xl">
                            <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-4 leading-none">
                                Master Your <span className="text-green-400">Trade Edge</span>
                            </h1>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Professional trading is 90% psychology and 10% strategy. Access our private visual vault to deconstruct high-conviction market structures.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-green-500" />
                                <input
                                    type="text"
                                    placeholder="Find your strategy..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="bg-black/40 border border-white/5 rounded-2xl pl-12 pr-8 py-4 text-xs font-bold text-white focus:outline-none focus:border-green-500/30 w-full lg:w-80 shadow-inner"
                                />
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1f283e] bg-slate-700" />
                                    ))}
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><span className="text-white">1,400+</span> Students Learning</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Category Filter */}
            <div className="flex flex-wrap items-center gap-3">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.id)}
                        className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${activeFilter === cat.id
                            ? 'bg-white text-slate-900 border-white shadow-2xl scale-105'
                            : 'bg-[#1f283e] text-slate-500 border-white/5 hover:text-white hover:border-white/20'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-20">
                {filteredVideos.map(video => (
                    <div
                        key={video.id}
                        className="group bg-[#1f283e] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-green-500/30 transition-all cursor-pointer shadow-2xl flex flex-col relative"
                        onClick={() => setSelectedVideo(video)}
                    >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-black/40 overflow-hidden">
                            <img
                                src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                                onError={(e) => { e.target.src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`; }}
                                alt={video.title}
                                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500">
                                <Play className="w-8 h-8 text-white fill-current translate-x-1" />
                            </div>

                            <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase border border-white/10 tracking-widest translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                {video.duration}
                            </div>
                        </div>

                        <div className="p-10 flex-1 flex flex-col bg-gradient-to-b from-transparent to-black/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <Video className="w-4 h-4 text-green-400" />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{video.category.replace('_', ' ')}</span>
                            </div>

                            <h3 className="text-lg font-black text-white group-hover:text-green-400 transition-colors uppercase leading-[1.3] mb-6 line-clamp-2 italic">
                                {video.title}
                            </h3>

                            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">
                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    {video.views} Active
                                </span>
                                <span className="px-4 py-1.5 bg-white/5 rounded-lg border border-white/5 group-hover:bg-green-500/10 group-hover:text-green-400 group-hover:border-green-500/20 transition-all">
                                    Watch Module
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredVideos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-40 bg-[#1f283e] rounded-[3rem] border border-white/5 border-dashed">
                    <div className="p-8 bg-white/5 rounded-full mb-8">
                        <BookOpen size={64} className="text-slate-700" />
                    </div>
                    <h4 className="text-xl font-black text-white uppercase tracking-widest mb-2">No Modules Found</h4>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Try adjusting your filters or search keywords</p>
                </div>
            )}
        </div>
    );
};

export default LearningPage;
