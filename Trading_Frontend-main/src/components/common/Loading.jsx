import React from 'react';

/**
 * Loading - Full page or inline loading spinner
 */
const Loading = ({ text = 'Loading data...', inline = false }) => {
    if (inline) {
        return (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span>{text}</span>
            </div>
        );
    }

    return (
        <div className="loading-overlay">
            <div className="spinner" />
            <span>{text}</span>
        </div>
    );
};

export default Loading;
