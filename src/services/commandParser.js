/**
 * Intelligent Command Parser
 *
 * Converts natural language commands (English/Hindi/Hinglish) to structured JSON
 * Uses AI logic to understand user intent dynamically
 *
 * Input: "ID 16 me 5000 add karo"
 * Output: { module: "funds", operation: "add", data: { userId: 16, amount: 5000 } }
 */

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND PATTERNS & MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════

const OPERATION_KEYWORDS = {
    add: ['add', 'karo', 'kr de', 'kr dena', 'dalo', 'lagao', 'banao', 'create', 'banao'],
    withdraw: ['hatao', 'nikalo', 'withdraw', 'nikal le', 'nikal de', 'remove'],
    delete: ['delete', 'hata de', 'mitao', 'remove', 'uda do'],
    update: ['update', 'badlo', 'change', 'modify', 'sudharo'],
    block: ['block', 'band karo', 'disable', 'band kr de', 'lock'],
    unblock: ['unblock', 'enable', 'activate', 'open', 'khol de'],
    assign: ['assign', 'dedo', 'allocate', 'dena', 'socho'],
    create: ['create', 'banao', 'naya', 'new', 'banadena'],
};

const MODULE_KEYWORDS = {
    funds: ['fund', 'paise', 'money', 'amount', 'balance', 'wallet'],
    user: ['user', 'client', 'trader', 'person', 'member'],
    admin: ['admin', 'administrator'],
    broker: ['broker', 'dalalal'],
    trade: ['trade', 'deal', 'business'],
    request: ['request', 'request', 'application'],
    notification: ['notification', 'message', 'alert'],
    settings: ['settings', 'configuration', 'config'],
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract numbers from text
 * Handles: "5000", "5,000", "5 lakh", etc.
 */
const extractNumbers = (text) => {
    const numbers = [];

    // Direct numbers: 5000, 5,000, 50000
    const directMatches = text.match(/\b\d+(?:,\d{3})*\b/g);
    if (directMatches) {
        directMatches.forEach(num => {
            numbers.push(parseInt(num.replace(/,/g, '')));
        });
    }

    // Words: "ek lakh" = 100000, "paanch hazaar" = 5000
    const wordNumbers = {
        'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5,
        'cha': 6, 'sat': 7, 'aath': 8, 'nau': 9, 'das': 10,
        'bees': 20, 'tees': 30, 'chalees': 40, 'pachas': 50,
        'hazaar': 1000, 'lakh': 100000, 'crore': 10000000,
    };

    const words = text.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
        const current = words[i];
        const next = words[i + 1];

        if (wordNumbers[current] && wordNumbers[next]) {
            const multiplier = wordNumbers[next];
            const value = wordNumbers[current] * multiplier;
            numbers.push(value);
        }
    }

    return numbers;
};

/**
 * Extract user ID from text
 * Handles: "ID 16", "user 16", "ID#16", "16 ko", etc.
 */
const extractUserId = (text) => {
    // Match patterns like "ID 16", "user 16", "ID#16", "16 ko"
    const patterns = [
        /ID\s*#?(\d+)/i,
        /user\s+(\d+)/i,
        /id\s+(\d+)/i,
        /(\d+)\s+(?:ko|ke|me)/i,
        /userid\s*[:=]?\s*(\d+)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return parseInt(match[1]);
    }

    return null;
};

/**
 * Extract name from text
 * Handles: "admin Rahul", "Rahul ko", "name Rahul", etc.
 */
const extractName = (text) => {
    // Remove common keywords and get the remaining word (likely the name)
    const cleaned = text
        .replace(/\b(new|naya|admin|user|broker|trader|banao|create)\b/gi, '')
        .replace(/\b(ko|ke|me|se|ne|ka|ki)\b/gi, '')
        .trim();

    const words = cleaned.split(/\s+/).filter(w => w.length > 0);
    return words.length > 0 ? words[0] : null;
};

/**
 * Identify operation from command
 */
const identifyOperation = (text) => {
    const lowerText = text.toLowerCase();

    for (const [operation, keywords] of Object.entries(OPERATION_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                return operation;
            }
        }
    }

    return null;
};

/**
 * Identify module from command
 */
const identifyModule = (text) => {
    const lowerText = text.toLowerCase();

    for (const [module, keywords] of Object.entries(MODULE_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                return module;
            }
        }
    }

    return null;
};

/**
 * Intelligently infer module based on operation and context
 */
const inferModule = (operation, text) => {
    const lowerText = text.toLowerCase();

    // If we can explicitly identify module, use it
    const explicit = identifyModule(text);
    if (explicit) return explicit;

    // Otherwise, infer from operation context
    const fundOperations = ['add', 'withdraw', 'deposit'];
    const userOperations = ['block', 'unblock', 'create', 'delete'];
    const adminOperations = ['create', 'delete', 'update'];
    const brokerOperations = ['assign', 'create', 'delete'];

    if (fundOperations.includes(operation)) return 'funds';
    if (userOperations.includes(operation) && !lowerText.includes('admin')) return 'user';
    if (userOperations.includes(operation) && lowerText.includes('admin')) return 'admin';
    if (brokerOperations.includes(operation) && lowerText.includes('broker')) return 'broker';

    return null;
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PARSER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse natural language command into structured JSON
 *
 * @param {string} command - User's natural language command
 * @returns {object} - Structured JSON { module, operation, data } or { error }
 *
 * Examples:
 * - "ID 16 me 5000 add karo" → { module: "funds", operation: "add", data: { userId: 16, amount: 5000 } }
 * - "user 20 ko block karo" → { module: "user", operation: "block", data: { userId: 20 } }
 * - "new admin banao Rahul" → { module: "admin", operation: "create", data: { name: "Rahul" } }
 */
export const parseCommand = (command) => {
    if (!command || typeof command !== 'string') {
        return { error: 'Command must be a non-empty string' };
    }

    const text = command.trim();
    console.log('[CommandParser] Parsing:', text);

    // Step 1: Identify operation
    const operation = identifyOperation(text);
    if (!operation) {
        console.warn('[CommandParser] Could not identify operation');
        return { error: 'Unable to understand command. Could not identify operation.' };
    }
    console.log('[CommandParser] Operation identified:', operation);

    // Step 2: Identify or infer module
    let module = identifyModule(text);
    if (!module) {
        module = inferModule(operation, text);
    }
    if (!module) {
        console.warn('[CommandParser] Could not identify module');
        return { error: 'Unable to understand command. Could not identify what to operate on.' };
    }
    console.log('[CommandParser] Module identified:', module);

    // Step 3: Extract data based on module and operation
    const data = {};

    // Common extractions
    const userId = extractUserId(text);
    const numbers = extractNumbers(text);
    const name = extractName(text);

    // Populate data based on module
    switch (module) {
        case 'funds':
            if (userId !== null) data.userId = userId;
            if (numbers.length > 0) data.amount = numbers[0];
            break;

        case 'user':
        case 'admin':
        case 'broker':
            if (userId !== null) data.userId = userId;
            if (name) data.name = name;
            if (operation === 'create' && name) data.name = name;
            break;

        case 'trade':
            if (userId !== null) data.userId = userId;
            if (numbers.length > 0) data.tradeId = numbers[0];
            break;

        default:
            if (userId !== null) data.userId = userId;
            if (name) data.name = name;
            if (numbers.length > 0) data.amount = numbers[0];
    }

    // Validation: Ensure required data exists
    if (operation === 'add' || operation === 'withdraw') {
        if (data.userId === undefined || data.amount === undefined) {
            return {
                error: 'Missing required data. Please provide both User ID and amount.',
                partial: { module, operation, data }
            };
        }
    }

    if (operation === 'block' || operation === 'unblock' || operation === 'delete') {
        if (data.userId === undefined) {
            return {
                error: 'Missing required data. Please provide User ID.',
                partial: { module, operation, data }
            };
        }
    }

    if (operation === 'create') {
        if (data.name === undefined) {
            return {
                error: 'Missing required data. Please provide a name.',
                partial: { module, operation, data }
            };
        }
    }

    console.log('[CommandParser] Successfully parsed:', { module, operation, data });

    return { module, operation, data };
};

/**
 * Validate parsed command
 */
export const validateCommand = (parsed) => {
    if (parsed.error) {
        return { valid: false, error: parsed.error };
    }

    const { module, operation, data } = parsed;

    if (!module || !operation) {
        return { valid: false, error: 'Missing module or operation' };
    }

    return { valid: true };
};

/**
 * For debugging: Show all recognized keywords
 */
export const getKeywordMap = () => ({
    operations: OPERATION_KEYWORDS,
    modules: MODULE_KEYWORDS,
});
