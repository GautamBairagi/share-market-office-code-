/**
 * Voice Command Controller
 *
 * Orchestrates the flow:
 * User Command → Parser → JSON → Execute API → Result
 *
 * Handles all business logic for executing parsed commands
 */

import { parseCommand, validateCommand } from './commandParser';
import * as api from './api';

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND EXECUTORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute funds operations (add, withdraw)
 */
const executeFundsCommand = async (operation, data) => {
    const { userId, amount } = data;

    if (operation === 'add') {
        console.log(`[VoiceController] Adding ₹${amount} to user ${userId}`);
        return await api.createFund({ userId, amount, type: 'ADD' });
    }

    if (operation === 'withdraw') {
        console.log(`[VoiceController] Withdrawing ₹${amount} from user ${userId}`);
        return await api.createFund({ userId, amount, type: 'WITHDRAW' });
    }

    throw new Error(`Unknown funds operation: ${operation}`);
};

/**
 * Execute user operations (block, unblock, delete, create)
 */
const executeUserCommand = async (operation, data) => {
    const { userId, name } = data;

    if (operation === 'block') {
        console.log(`[VoiceController] Blocking user ${userId}`);
        return await api.updateUserStatus(userId, 'BLOCKED');
    }

    if (operation === 'unblock') {
        console.log(`[VoiceController] Unblocking user ${userId}`);
        return await api.updateUserStatus(userId, 'ACTIVE');
    }

    if (operation === 'delete') {
        console.log(`[VoiceController] Deleting user ${userId}`);
        return await api.deleteUser(userId);
    }

    if (operation === 'create') {
        console.log(`[VoiceController] Creating new user: ${name}`);
        return await api.createClient({ username: name, email: `${name.toLowerCase()}@traders.com` });
    }

    throw new Error(`Unknown user operation: ${operation}`);
};

/**
 * Execute admin operations (create, delete, update)
 */
const executeAdminCommand = async (operation, data) => {
    const { userId, name } = data;

    if (operation === 'create') {
        console.log(`[VoiceController] Creating new admin: ${name}`);
        return await api.createClient({
            username: name,
            email: `${name.toLowerCase()}@admin.com`,
            role: 'ADMIN'
        });
    }

    if (operation === 'delete') {
        console.log(`[VoiceController] Deleting admin ${userId}`);
        return await api.deleteUser(userId);
    }

    if (operation === 'update') {
        console.log(`[VoiceController] Updating admin ${userId}`);
        return await api.updateUser(userId, { ...data });
    }

    throw new Error(`Unknown admin operation: ${operation}`);
};

/**
 * Execute broker operations (assign, create, delete)
 */
const executeBrokerCommand = async (operation, data) => {
    const { userId, name } = data;

    if (operation === 'assign') {
        console.log(`[VoiceController] Assigning broker to user ${userId}`);
        return await api.updateUser(userId, { brokerAssigned: true });
    }

    if (operation === 'create') {
        console.log(`[VoiceController] Creating new broker: ${name}`);
        return await api.createBroker({ name, email: `${name.toLowerCase()}@broker.com` });
    }

    if (operation === 'delete') {
        console.log(`[VoiceController] Deleting broker ${userId}`);
        return await api.deleteUser(userId);
    }

    throw new Error(`Unknown broker operation: ${operation}`);
};

/**
 * Execute trade operations (create, close, delete)
 */
const executeTradeCommand = async (operation, data) => {
    const { userId, tradeId, amount } = data;

    if (operation === 'create') {
        console.log(`[VoiceController] Creating new trade for user ${userId}`);
        return await api.createTrade({ userId, amount });
    }

    if (operation === 'close') {
        console.log(`[VoiceController] Closing trade ${tradeId}`);
        return await api.closeTrade(tradeId);
    }

    if (operation === 'delete') {
        console.log(`[VoiceController] Deleting trade ${tradeId}`);
        return await api.deleteTrade(tradeId);
    }

    throw new Error(`Unknown trade operation: ${operation}`);
};

/**
 * Execute request operations (approve, reject)
 */
const executeRequestCommand = async (operation, data) => {
    const { userId } = data;

    if (operation === 'approve') {
        console.log(`[VoiceController] Approving request ${userId}`);
        return await api.approveRequest(userId, 'DEPOSIT');
    }

    if (operation === 'reject') {
        console.log(`[VoiceController] Rejecting request ${userId}`);
        return await api.rejectRequest(userId, 'DEPOSIT');
    }

    throw new Error(`Unknown request operation: ${operation}`);
};

/**
 * Execute settings operations (update, reset)
 */
const executeSettingsCommand = async (operation, data) => {
    const { userId } = data;

    if (operation === 'update') {
        console.log(`[VoiceController] Updating settings for user ${userId}`);
        return await api.updateClientSettings(userId, data);
    }

    if (operation === 'reset') {
        console.log(`[VoiceController] Resetting settings for user ${userId}`);
        return await api.updateClientSettings(userId, {});
    }

    throw new Error(`Unknown settings operation: ${operation}`);
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute parsed command by calling appropriate API
 */
const executeCommand = async (module, operation, data) => {
    console.log(`[VoiceController] Executing: ${module}.${operation}`, data);

    try {
        switch (module) {
            case 'funds':
                return await executeFundsCommand(operation, data);

            case 'user':
                return await executeUserCommand(operation, data);

            case 'admin':
                return await executeAdminCommand(operation, data);

            case 'broker':
                return await executeBrokerCommand(operation, data);

            case 'trade':
                return await executeTradeCommand(operation, data);

            case 'request':
                return await executeRequestCommand(operation, data);

            case 'settings':
                return await executeSettingsCommand(operation, data);

            default:
                throw new Error(`Unknown module: ${module}`);
        }
    } catch (error) {
        console.error('[VoiceController] Execution error:', error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main function: Process a voice/text command end-to-end
 *
 * @param {string} command - User's natural language command
 * @returns {Promise<object>} - Result { success: true, data: ... } or { success: false, error: ... }
 *
 * Example:
 * const result = await processVoiceCommand("ID 16 me 5000 add karo");
 * console.log(result); // { success: true, data: { ... }, command: { ... } }
 */
export const processVoiceCommand = async (command) => {
    console.log('[VoiceController] Processing command:', command);

    // Step 1: Parse command
    const parsed = parseCommand(command);
    console.log('[VoiceController] Parsed:', parsed);

    if (parsed.error) {
        return {
            success: false,
            error: parsed.error,
            message: 'Could not understand command. Please try again.',
            partial: parsed.partial
        };
    }

    // Step 2: Validate parsed command
    const validation = validateCommand(parsed);
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error,
            message: 'Command validation failed.'
        };
    }

    // Step 3: Execute command
    try {
        const { module, operation, data } = parsed;
        const result = await executeCommand(module, operation, data);

        console.log('[VoiceController] Command executed successfully:', result);

        return {
            success: true,
            message: `${operation} operation completed successfully!`,
            data: result,
            command: { module, operation, data }
        };
    } catch (error) {
        console.error('[VoiceController] Command execution failed:', error);

        return {
            success: false,
            error: error.message || 'Execution failed',
            message: `Could not execute command: ${error.message}`,
            command: parsed
        };
    }
};

/**
 * Get supported commands info
 */
export const getCommandInfo = () => ({
    description: 'Voice Command System - Convert natural language to operations',
    examples: [
        {
            input: 'ID 16 me 5000 add karo',
            output: { module: 'funds', operation: 'add', data: { userId: 16, amount: 5000 } }
        },
        {
            input: 'user 20 ko block karo',
            output: { module: 'user', operation: 'block', data: { userId: 20 } }
        },
        {
            input: 'new admin banao Rahul',
            output: { module: 'admin', operation: 'create', data: { name: 'Rahul' } }
        },
        {
            input: 'ID 16 se 2000 withdraw karo',
            output: { module: 'funds', operation: 'withdraw', data: { userId: 16, amount: 2000 } }
        }
    ],
    supportedModules: ['funds', 'user', 'admin', 'broker', 'trade', 'request', 'settings'],
    supportedOperations: ['add', 'withdraw', 'create', 'delete', 'update', 'block', 'unblock', 'assign', 'approve', 'reject']
});
