/**
 * Universal Query Parser
 *
 * Converts user search queries (English/Hindi/Hinglish) to structured JSON
 * Used for data retrieval, filtering, and navigation
 *
 * Input: "ID 16 ke active trades dikhao"
 * Output: { module: "trades", operation: "get", filters: { userId: 16, status: "active" }, route: "/trades" }
 */

// ═══════════════════════════════════════════════════════════════════════════
// QUERY PATTERNS & MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════

const MODULE_MAPPING = {
    trades: {
        keywords: ['trade', 'deals', 'order', 'position', 'transaction'],
        route: '/trades',
        endpoints: {
            active: '/trades/active',
            closed: '/trades/closed',
            all: '/trades'
        }
    },
    users: {
        keywords: ['user', 'client', 'trader', 'member', 'person', 'account'],
        route: '/trading-clients',
        endpoints: {
            all: '/users',
            active: '/users?status=ACTIVE',
            blocked: '/users?status=BLOCKED'
        }
    },
    funds: {
        keywords: ['fund', 'paise', 'money', 'balance', 'wallet', 'deposit', 'withdrawal'],
        route: '/funds',
        endpoints: {
            all: '/funds',
            deposits: '/requests/deposits',
            withdrawals: '/requests/withdrawals'
        }
    },
    brokers: {
        keywords: ['broker', 'dalalal', 'brokerage', 'broker-account'],
        route: '/broker-accounts',
        endpoints: {
            all: '/brokers',
            active: '/brokers?active=true'
        }
    },
    admins: {
        keywords: ['admin', 'administrator', 'superadmin', 'manager'],
        route: '/admins',
        endpoints: {
            all: '/admin/menu-permissions'
        }
    },
    orders: {
        keywords: ['order', 'pending', 'request', 'application'],
        route: '/pending-orders',
        endpoints: {
            pending: '/orders?status=PENDING',
            approved: '/orders?status=APPROVED',
            rejected: '/orders?status=REJECTED',
            all: '/orders'
        }
    }
};

const OPERATION_KEYWORDS = {
    get: ['dikhao', 'show', 'batao', 'dekho', 'find', 'search', 'list', 'get', 'fetch'],
    create: ['add karo', 'create', 'banao', 'add', 'naya'],
    update: ['update karo', 'update', 'badlo', 'change', 'modify'],
    delete: ['hatao', 'delete', 'remove', 'uda do', 'mitao']
};

const STATUS_KEYWORDS = {
    active: ['active', 'chalti', 'chalte', 'running', 'open'],
    closed: ['closed', 'band', 'closed', 'complete', 'done', 'over'],
    pending: ['pending', 'wait', 'waiting', 'ruko', 'intezaar'],
    blocked: ['block', 'band', 'lock', 'disable'],
    approved: ['approve', 'approved', 'pass', 'ok'],
    rejected: ['reject', 'rejected', 'reject', 'refuse']
};

const FILTER_KEYWORDS = {
    limit: ['last', 'recent', 'latest', 'first', 'top', 'recent'],
    sortBy: ['sort', 'ordered', 'arranged'],
    dateRange: ['today', 'week', 'month', 'year', 'date']
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract User ID from query
 */
const extractUserId = (text) => {
    const patterns = [
        /ID\s*#?(\d+)/i,
        /user\s+(\d+)/i,
        /id\s+(\d+)/i,
        /(\d+)\s+(?:ke|ka|ki|ko|se)/i,
        /userid\s*[:=]?\s*(\d+)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return parseInt(match[1]);
    }

    return null;
};

/**
 * Extract amount from query
 */
const extractAmount = (text) => {
    const patterns = [
        /(\d+(?:,\d{3})*)\s*(?:rupee|rs|rs\.|₹)?/i,
        /amount\s*(\d+)/i,
        /₹\s*(\d+)/
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return parseInt(match[1].replace(/,/g, ''));
    }

    return null;
};

/**
 * Extract limit (number of records)
 */
const extractLimit = (text) => {
    const match = text.match(/(?:last|recent|top)\s+(\d+)/i);
    if (match) return parseInt(match[1]);

    // Check for common limits
    if (text.match(/top\s+few|last\s+few/i)) return 5;
    if (text.match(/top\s+ten|last\s+ten/i)) return 10;
    if (text.match(/all|sab/i)) return 100;

    return null;
};

/**
 * Identify module from query
 */
const identifyModule = (text) => {
    const lowerText = text.toLowerCase();

    for (const [module, config] of Object.entries(MODULE_MAPPING)) {
        for (const keyword of config.keywords) {
            if (lowerText.includes(keyword)) {
                return module;
            }
        }
    }

    return null;
};

/**
 * Identify operation from query
 */
const identifyOperation = (text) => {
    const lowerText = text.toLowerCase();

    // Default to "get" for queries
    for (const [operation, keywords] of Object.entries(OPERATION_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                return operation;
            }
        }
    }

    // If no operation found but has status/filters, it's a query (get)
    if (text.match(/dikhao|show|list|find|search/i)) {
        return 'get';
    }

    return 'get'; // Default to get for queries
};

/**
 * Identify filters from query
 */
const identifyFilters = (text) => {
    const filters = {};
    const lowerText = text.toLowerCase();

    // Check for status
    for (const [status, keywords] of Object.entries(STATUS_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                filters.status = status.toUpperCase();
                break;
            }
        }
    }

    // Extract User ID
    const userId = extractUserId(text);
    if (userId) filters.userId = userId;

    // Extract Amount
    const amount = extractAmount(text);
    if (amount) filters.amount = amount;

    // Extract Limit
    const limit = extractLimit(text);
    if (limit) filters.limit = limit;

    // Check for date range
    if (lowerText.includes('today')) filters.dateRange = 'TODAY';
    if (lowerText.includes('week')) filters.dateRange = 'WEEK';
    if (lowerText.includes('month')) filters.dateRange = 'MONTH';
    if (lowerText.includes('year')) filters.dateRange = 'YEAR';

    return filters;
};

/**
 * Build route based on module and filters
 */
const buildRoute = (module, filters) => {
    const config = MODULE_MAPPING[module];
    if (!config) return null;

    // If specific status endpoint exists, use it
    const status = filters.status?.toLowerCase();
    if (status && config.endpoints[status]) {
        return config.endpoints[status];
    }

    // Otherwise use main route
    return config.route;
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PARSER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse user search query into structured JSON
 *
 * @param {string} query - User's search query
 * @returns {object} - Structured JSON { module, operation, filters, route, message } or { error }
 *
 * Examples:
 * - "ID 16 ke active trades dikhao"
 *   → { module: "trades", operation: "get", filters: { userId: 16, status: "ACTIVE" }, route: "/trades" }
 *
 * - "all users dikhao"
 *   → { module: "users", operation: "get", filters: {}, route: "/trading-clients" }
 *
 * - "pending orders top 10"
 *   → { module: "orders", operation: "get", filters: { status: "PENDING", limit: 10 }, route: "/pending-orders" }
 */
export const parseQuery = (query) => {
    if (!query || typeof query !== 'string') {
        return { error: 'Query must be a non-empty string' };
    }

    const text = query.trim();
    console.log('[QueryParser] Parsing:', text);

    // Step 1: Identify module
    const module = identifyModule(text);
    if (!module) {
        console.warn('[QueryParser] Could not identify module');
        return { error: 'Unable to understand query. Could not identify what to search for.' };
    }
    console.log('[QueryParser] Module identified:', module);

    // Step 2: Identify operation (usually "get" for queries)
    const operation = identifyOperation(text);
    console.log('[QueryParser] Operation identified:', operation);

    // Step 3: Extract filters
    const filters = identifyFilters(text);
    console.log('[QueryParser] Filters identified:', filters);

    // Step 4: Build route
    const route = buildRoute(module, filters);
    console.log('[QueryParser] Route:', route);

    // Step 5: Create message for UI
    const message = generateMessage(module, filters);

    console.log('[QueryParser] Successfully parsed query');

    return {
        module,
        operation,
        filters,
        route,
        message,
        apiEndpoint: buildApiEndpoint(module, filters)
    };
};

/**
 * Build API endpoint from module and filters
 */
export const buildApiEndpoint = (module, filters) => {
    const config = MODULE_MAPPING[module];
    if (!config) return null;

    let endpoint = config.endpoints.all || `/api/${module}`;

    // Add query parameters
    const params = new URLSearchParams();

    if (filters.userId) params.append('userId', filters.userId);
    if (filters.status) params.append('status', filters.status);
    if (filters.amount) params.append('amount', filters.amount);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.dateRange) params.append('dateRange', filters.dateRange);

    const queryString = params.toString();
    if (queryString) {
        endpoint += `?${queryString}`;
    }

    return endpoint;
};

/**
 * Generate user-friendly message
 */
const generateMessage = (module, filters) => {
    let msg = `Searching ${module}`;

    if (filters.userId) msg += ` for user ${filters.userId}`;
    if (filters.status) msg += ` with status: ${filters.status}`;
    if (filters.limit) msg += ` (top ${filters.limit})`;

    return msg;
};

/**
 * Validate parsed query
 */
export const validateQuery = (parsed) => {
    if (parsed.error) {
        return { valid: false, error: parsed.error };
    }

    const { module, operation } = parsed;

    if (!module || !operation) {
        return { valid: false, error: 'Missing module or operation' };
    }

    return { valid: true };
};

/**
 * Get all supported modules
 */
export const getSupportedModules = () => {
    return Object.keys(MODULE_MAPPING).map(module => ({
        module,
        keywords: MODULE_MAPPING[module].keywords,
        route: MODULE_MAPPING[module].route,
        endpoints: Object.keys(MODULE_MAPPING[module].endpoints)
    }));
};
