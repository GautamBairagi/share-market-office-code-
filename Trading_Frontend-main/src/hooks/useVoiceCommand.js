/**
 * useVoiceCommand Hook
 *
 * Easy integration of voice command system in React components
 * Handles parsing and execution of natural language commands
 */

import { useState, useCallback } from 'react';
import { processVoiceCommand } from '../services/voiceCommandController';

/**
 * Hook for processing voice/text commands
 *
 * @returns {object} Hook state and methods
 *   - isProcessing: boolean - whether command is being processed
 *   - result: object - last command result
 *   - error: string - error message if any
 *   - executeCommand: function - execute a command
 *   - clearResult: function - clear the result
 */
export const useVoiceCommand = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const executeCommand = useCallback(async (command) => {
        if (!command || typeof command !== 'string') {
            setError('Command must be a non-empty string');
            return null;
        }

        setIsProcessing(true);
        setError(null);
        setResult(null);

        try {
            console.log('[useVoiceCommand] Executing:', command);
            const response = await processVoiceCommand(command);

            if (response.success) {
                console.log('[useVoiceCommand] Success:', response);
                setResult(response);
                return response;
            } else {
                console.error('[useVoiceCommand] Failed:', response);
                setError(response.error || response.message);
                setResult(response);
                return response;
            }
        } catch (err) {
            const errorMsg = err.message || 'Unknown error occurred';
            console.error('[useVoiceCommand] Error:', errorMsg);
            setError(errorMsg);
            setResult(null);
            return { success: false, error: errorMsg };
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const clearResult = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return {
        isProcessing,
        result,
        error,
        executeCommand,
        clearResult,
        success: result?.success || false
    };
};

export default useVoiceCommand;
