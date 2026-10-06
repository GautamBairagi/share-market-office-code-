/**
 * Voice Service – Intelligent Voice Command Processing
 *
 * Combines:
 * 1. Audio recording submission
 * 2. AI command parsing (text → JSON)
 * 3. Command execution
 *
 * Token is attached automatically via interceptors - no manual headers needed!
 */

import * as apiService from './api';
import { processVoiceCommand } from './voiceCommandController';

const TIMEOUT_MS = 30_000;

/**
 * Upload an audio Blob to the backend voice endpoint.
 * Token is attached automatically by Axios interceptor
 * @returns { transcript, aiResponse, id } on success
 */
export const submitVoiceRecording = async (audioBlob, meta = {}) => {
    try {
        const result = await Promise.race([
            apiService.submitVoiceRecording(audioBlob, meta),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
            )
        ]);
        return result;
    } catch (err) {
        if (err.message === 'Request timed out') {
            throw new Error('Voice submission timed out. Please check your connection and try again.');
        }
        throw err;
    }
};

/**
 * Intelligent Voice Command Processing
 *
 * Converts natural language text to structured command and executes it
 * Token is attached automatically by Axios interceptor
 *
 * @param {string} text – Natural language command (English/Hindi/Hinglish)
 * @returns {Promise<object>} – Execution result
 *
 * Examples:
 * - "ID 16 me 5000 add karo"
 * - "user 20 ko block karo"
 * - "new admin banao Rahul"
 */
export const processIntelligentCommand = async (text) => {
    try {
        const result = await Promise.race([
            processVoiceCommand(text),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
            )
        ]);
        return result;
    } catch (err) {
        if (err.message === 'Request timed out') {
            throw new Error('Command processing timed out.');
        }
        throw err;
    }
};

/**
 * Legacy: Send speech text to /ai-parse and return the parsed command JSON.
 * Token is attached automatically by Axios interceptor
 * @param {string} text – Captured speech transcript
 * @returns {Promise<{ action: string, userId: number, amount: number }>}
 */
export const parseVoiceCommand = async (text) => {
    try {
        const result = await Promise.race([
            apiService.parseVoiceCommand(text),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
            )
        ]);
        return result;
    } catch (err) {
        if (err.message === 'Request timed out') {
            throw new Error('AI parse request timed out.');
        }
        throw err;
    }
};

/**
 * Legacy: Send the parsed command to /execute-command.
 * Token is attached automatically by Axios interceptor
 * @param {object} commandData – JSON from /ai-parse
 */
export const executeCommand = async (commandData) => {
    try {
        const result = await Promise.race([
            apiService.executeCommand(commandData),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
            )
        ]);
        return result;
    } catch (err) {
        if (err.message === 'Request timed out') {
            throw new Error('Execute command request timed out.');
        }
        throw err;
    }
};
