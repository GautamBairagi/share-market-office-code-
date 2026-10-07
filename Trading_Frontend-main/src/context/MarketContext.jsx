import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../services/api';
import { useAuth } from './AuthContext';

const MarketContext = createContext();

export const useMarket = () => useContext(MarketContext);

export const MarketProvider = ({ children }) => {
    const [prices, setPrices] = useState({});
    const [fullPrices, setFullPrices] = useState({});
    const [connected, setConnected] = useState(false);
    const [indices, setIndices] = useState([]);
    const [watchlist, setWatchlist] = useState([]);
    const { user } = useAuth();

    const fetchMarkers = async () => {
        try {
            const { getIndices, getWatchlist } = await import('../services/api');
            const idx = await getIndices();
            const wl = await getWatchlist();
            setIndices(idx);
            setWatchlist(wl);
        } catch (err) {
            console.error('Marker fetch error:', err);
        }
    };

    useEffect(() => {
        if (!user) return;
        
        const socket = io(SOCKET_URL);

        fetchMarkers();

        socket.on('connect', () => {
            setConnected(true);
            console.log('Connected to Market Socket');
        });

        socket.on('price_update', (newPrices) => {
            setPrices(newPrices);
        });

        socket.on('price_full_update', (newFullPrices) => {
            setFullPrices(newFullPrices);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        return () => socket.disconnect();
    }, [user]);

    return (
        <MarketContext.Provider value={{ prices, fullPrices, connected, indices, watchlist }}>
            {children}
        </MarketContext.Provider>
    );
};
