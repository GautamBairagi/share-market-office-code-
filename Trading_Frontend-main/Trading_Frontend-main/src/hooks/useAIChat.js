/**
 * useAIChat Hook
 *
 * Manages AI conversation state and handles message sending
 */

import { useState, useCallback } from 'react';
import { sendAIMessage } from '../services/api';

export const useAIChat = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const sendMessage = useCallback(async (message) => {
        if (!message || typeof message !== 'string' || !message.trim()) {
            setError('Please enter a message');
            return null;
        }

        // Add user message to conversation
        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: message,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setError(null);
        setIsLoading(true);

        try {
            const response = await sendAIMessage(message.trim());

            // Add AI response
            const aiMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.reply || response.message || 'No response received',
                timestamp: new Date(),
                metadata: response.metadata || {},
            };

            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
            return aiMessage;
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to send message';
            setError(errorMsg);
            setIsLoading(false);
            return null;
        }
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
        clearError,
    };
};

export default useAIChat;
