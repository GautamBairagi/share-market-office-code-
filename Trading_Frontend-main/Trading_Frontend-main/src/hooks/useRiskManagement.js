import { useState, useEffect } from 'react';

const useRiskManagement = (initialM2M = 0, initialMargin = 250000) => {
    const [m2m, setM2m] = useState(initialM2M);
    const [margin, setMargin] = useState(initialMargin);
    const [riskState, setRiskState] = useState('SAFE'); // SAFE, WARNING, DANGER
    const [lastAlert, setLastAlert] = useState(null);

    useEffect(() => {
        // Simulate real-time M2M fluctuation for demo
        const interval = setInterval(() => {
            setM2m(prev => {
                const change = (Math.random() * 4000 - 2000);
                return prev + change;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Master Prompt Logic: 
        // 1. Monitor M2M vs Margin
        // 2. Trigger "Danger" if loss exceeds 90% of margin (mocked logic)

        const loss = m2m < 0 ? Math.abs(m2m) : 0;
        const lossThresholdAlert = margin * 0.5; // 50% loss = Warning
        const lossThresholdCut = margin * 0.9;   // 90% loss = Danger/Auto-Cut

        if (loss >= lossThresholdCut) {
            setRiskState('DANGER');
            if (lastAlert !== 'DANGER') {
                setLastAlert('DANGER');
                // In a real app, this would trigger an API call to square off trades
                console.warn('CRITICAL: Auto Square Off Triggered for Client!');
            }
        } else if (loss >= lossThresholdAlert) {
            setRiskState('WARNING');
            setLastAlert('WARNING');
        } else {
            setRiskState('SAFE');
            setLastAlert(null);
        }
    }, [m2m, margin]);

    return {
        m2m,
        margin,
        riskState,
        setM2m,
        setMargin
    };
};

export default useRiskManagement;
