import React, { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, AlertCircle } from 'lucide-react';

const NotificationPopup = ({ user }) => {
    const [show, setShow] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        // Mock API call to fetch popup notification
        const fetchPopup = () => {
            const mockNotifications = [
                {
                    id: 'popup-1',
                    userId: user.userId,
                    segment: user.segment,
                    title: 'Market Update',
                    message: `Welcome ${user.name}! Trading is now active in ${user.segment}. Please review updated margin requirements.`,
                    priority: 'info',
                    startTime: '2026-01-01',
                    endTime: '2026-12-31'
                },
                {
                    id: 'popup-2',
                    segment: 'ALL',
                    title: 'System Maintenance',
                    message: 'Planned system maintenance this Saturday from 10 PM to 2 AM.',
                    priority: 'warning',
                    startTime: '2026-02-20',
                    endTime: '2026-03-01'
                }
            ];

            // Filter logic as per Master Prompt
            const relevant = mockNotifications.find(n =>
                (n.userId === user.userId || n.segment === user.segment || n.segment === 'ALL') &&
                new Date() >= new Date(n.startTime) &&
                new Date() <= new Date(n.endTime)
            );

            if (relevant) {
                const dismissed = sessionStorage.getItem(`dismissed_${relevant.id}`);
                if (!dismissed) {
                    setNotification(relevant);
                    setTimeout(() => setShow(true), 1500); // Delay for effect
                }
            }
        };

        if (user) fetchPopup();
    }, [user]);

    const handleDismiss = () => {
        if (notification) {
            sessionStorage.setItem(`dismissed_${notification.id}`, 'true');
        }
        setShow(false);
    };

    if (!show || !notification) return null;

    const colors = {
        info: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', icon: <Info className="text-blue-400" />, text: 'text-blue-400' },
        warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/50', icon: <AlertTriangle className="text-amber-400" />, text: 'text-amber-400' },
        danger: { bg: 'bg-red-500/10', border: 'border-red-500/50', icon: <AlertCircle className="text-red-400" />, text: 'text-red-400' }
    };

    const style = colors[notification.priority] || colors.info;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`w-full max-w-md ${style.bg} border-t-4 ${style.border} rounded-lg shadow-2xl p-6 relative animate-in fade-in zoom-in duration-300`}>
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 rounded-full bg-black/20">
                        {style.icon}
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${style.text} mb-1 uppercase tracking-tight`}>
                            {notification.title}
                        </h3>
                        <p className="text-slate-200 text-sm leading-relaxed">
                            {notification.message}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={handleDismiss}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-green-900/40"
                    >
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationPopup;
