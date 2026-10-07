/**
 * useVoiceNavigation
 *
 * Parses voice transcripts in English, Hinglish, and Hindi (Devanagari).
 *
 * Supported patterns:
 *   English prefix  →  "open dashboard"            trigger + destination
 *   Hindi suffix    →  "dashboard kholo"            destination + trigger
 *   Hindi suffix    →  "डैशबोर्ड खोलो"              destination + trigger (Devanagari)
 *   Direct keyword  →  "dashboard" / "डैशबोर्ड"     just the keyword
 *   Action prefix   →  "add trading client"         English action + target
 *   Action suffix   →  "trading client banao"       target + Hindi action trigger
 *   Action prefix   →  "naya trading client"        Hindi prefix + target
 *   Action suffix   →  "ट्रेडिंग क्लाइंट बनाओ"      target + Devanagari action trigger
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    VOICE_COMMANDS,
    NAV_TRIGGERS,
    ACTION_TRIGGERS,
    HINDI_NAV_TRIGGERS,
    HINDI_ACTION_TRIGGERS,
    FILLER_WORDS,
} from '../config/voiceCommandConfig';

// ─────────────────────────────────────────────────────────────────────────────
// Sound feedback
// ─────────────────────────────────────────────────────────────────────────────

let _lastSoundTime = 0;

const playSuccessSound = () => {
    const now = Date.now();
    if (now - _lastSoundTime < 300) return;   // debounce for multi-command bursts
    _lastSoundTime = now;
    try {
        const audio = new Audio('/sounds/success.wav');
        audio.volume = 0.7;
        audio.play().catch(() => {});
    } catch (_) { /* ignore */ }
};

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Lowercase, strip fillers, collapse spaces */
const normalise = (text) => {
    let t = text.toLowerCase().trim();
    // Sort fillers longest-first so "i want to" is removed before "i"
    const sorted = [...FILLER_WORDS].sort((a, b) => b.length - a.length);
    sorted.forEach(w => {
        t = t.replace(new RegExp(`(^|\\s)${w}(\\s|$)`, 'gi'), ' ');
    });
    return t.replace(/\s+/g, ' ').trim();
};

/**
 * Check if text STARTS WITH any trigger (English-style, prefix pattern).
 * Returns { trigger, remainder } or null.
 */
const extractPrefixIntent = (text, triggers) => {
    const sorted = [...triggers].sort((a, b) => b.length - a.length);
    for (const trigger of sorted) {
        if (text.startsWith(trigger + ' ')) {
            return { trigger, remainder: text.slice(trigger.length + 1).trim() };
        }
        // Exact match (only the trigger word, e.g. "jao" alone)
        if (text === trigger) {
            return { trigger, remainder: '' };
        }
    }
    return null;
};

/**
 * Check if text ENDS WITH any trigger (Hindi-style, suffix pattern).
 * Returns { trigger, remainder } or null.
 * Example: "trading clients kholo" → { trigger: 'kholo', remainder: 'trading clients' }
 */
const extractSuffixIntent = (text, triggers) => {
    const sorted = [...triggers].sort((a, b) => b.length - a.length);
    for (const trigger of sorted) {
        if (text.endsWith(' ' + trigger)) {
            return { trigger, remainder: text.slice(0, text.length - trigger.length - 1).trim() };
        }
        if (text === trigger) {
            return { trigger, remainder: '' };
        }
    }
    return null;
};

/**
 * Find the best matching navigation route for a remainder string.
 * Tries exact match first, then partial (starts-with / keyword-contains-remainder).
 */
const matchNavigation = (remainder) => {
    if (!remainder) return null;
    const routes = VOICE_COMMANDS.navigation;

    // 1. Exact match
    if (routes[remainder]) {
        return { route: routes[remainder], label: remainder };
    }

    // 2. Best partial match (longest keyword that covers the remainder)
    let best = null;
    let bestLen = 0;
    for (const [keyword, route] of Object.entries(routes)) {
        // remainder contains keyword  OR  keyword contains remainder
        const covers = remainder.startsWith(keyword) || keyword.startsWith(remainder) || remainder.includes(keyword);
        if (covers && keyword.length > bestLen) {
            best = { route, label: keyword };
            bestLen = keyword.length;
        }
    }
    return best;
};

/**
 * Find the best matching action config for a remainder string.
 */
const matchAction = (remainder) => {
    if (!remainder) return null;
    const actions = VOICE_COMMANDS.actions;

    // 1. Exact match
    if (actions[remainder]) return { ...actions[remainder], keyword: remainder };

    // 2. Partial — remainder contains keyword OR keyword contained in remainder
    let best = null;
    let bestLen = 0;
    for (const [keyword, cfg] of Object.entries(actions)) {
        if ((remainder.includes(keyword) || keyword.includes(remainder)) && keyword.length > bestLen) {
            best = { ...cfg, keyword };
            bestLen = keyword.length;
        }
    }
    return best;
};

// ─────────────────────────────────────────────────────────────────────────────
// Multi-command parser (exported pure functions)
// ─────────────────────────────────────────────────────────────────────────────

/** Tokens that separate multiple commands in one utterance */
const SPLIT_TOKENS = ['and then', 'aur phir', 'and', 'then', 'aur', 'phir'];

/** Keywords that signal a CREATE intent */
const CREATE_KW = [
    'create karo', 'add karo', 'bana do', 'banao', 'create', 'register', 'make', 'add', 'new', 'naya', 'nayi',
];

/** Keywords that signal a NAVIGATE intent */
const NAV_KW = [
    'take me to', 'take me', 'navigate to', 'chalu karo', 'le chalo', 'navigate', 'display', 'dikhao', 'kholo', 'open', 'show', 'go to', 'go',
];

/** Synonyms → canonical entity key */
const ENTITY_SYNONYMS = {
    'trading clients': 'client',
    'trading client':  'client',
    'clients':         'client',
    'client':          'client',
    'brokers':         'broker',
    'broker':          'broker',
    'admins':          'admin',
    'admin':           'admin',
    'administrator':   'admin',
    'trades':          'trade',
    'trade':           'trade',
    'funds':           'fund',
    'fund':            'fund',
};

/** Entity → action + route */
const ENTITY_ACTION_MAP = {
    client: { action: 'OPEN_CLIENT_FORM', route: '/trading-clients/create' },
    broker: { action: 'OPEN_BROKER_FORM', route: '/brokers/create'         },
    admin:  { action: 'OPEN_ADMIN_FORM',  route: '/admins/create'          },
    trade:  { action: 'OPEN_TRADE_FORM',  route: '/trades/create'          },
    fund:   { action: 'OPEN_FUND_FORM',   route: '/trader-funds/add'       },
};

/** Split one transcript into individual command segments */
const splitMultiCommand = (text) => {
    const sorted = [...SPLIT_TOKENS].sort((a, b) => b.length - a.length);
    let t = text;
    for (const token of sorted) {
        t = t.replace(new RegExp(`\\s+${token.replace(/\s+/g, '\\s+')}\\s+`, 'gi'), ' ||| ');
    }
    return t.split('|||').map(p => p.trim()).filter(Boolean);
};

/** Extract a person name — "named Rahul", "naam Rahul", "name is Rahul" */
const extractName = (text) =>
    (text.match(/(?:named?|naam|name\s+is)\s+([a-zA-Z\u0900-\u097F]+)/i) || [])[1] || null;

/** Normalize entity words to canonical key (longest-first for greedy match) */
const normalizeEntity = (text) => {
    const keys = Object.keys(ENTITY_SYNONYMS).sort((a, b) => b.length - a.length);
    for (const key of keys) {
        if (text.includes(key)) return ENTITY_SYNONYMS[key];
    }
    return null;
};

/** Remove trigger keywords from a segment to expose the subject */
const stripTriggers = (text, keywords) => {
    const sorted = [...keywords].sort((a, b) => b.length - a.length);
    let t = text;
    for (const kw of sorted) {
        t = t.replace(new RegExp(`(^|\\s)${kw.replace(/\s+/g, '\\s+')}(\\s|$)`, 'gi'), ' ');
    }
    return t.trim();
};

/** Detect CREATE or NAVIGATE from prefix/suffix trigger keywords */
const detectIntent = (text) => {
    const sortedC = [...CREATE_KW].sort((a, b) => b.length - a.length);
    for (const kw of sortedC) {
        if (text.startsWith(kw + ' ') || text.endsWith(' ' + kw) || text === kw) return 'CREATE';
    }
    const sortedN = [...NAV_KW].sort((a, b) => b.length - a.length);
    for (const kw of sortedN) {
        if (text.startsWith(kw + ' ') || text.endsWith(' ' + kw) || text === kw) return 'NAVIGATE';
    }
    return null;
};

/**
 * Parse a transcript into an array of structured command objects.
 * Handles multi-command utterances split by "and / then / aur / phir".
 *
 * Each command is one of:
 *   { intent:'NAVIGATE', target, route }
 *   { intent:'CREATE',   entity, action, route, data:{name?} }
 *   { intent:'CREATE'|'NAVIGATE', matched:false, raw }  ← no route found
 */
export const parseMultiCommand = (rawTranscript) => {
    const text = normalise(rawTranscript);
    if (!text) return [];

    const segments = splitMultiCommand(text);
    const commands = [];

    for (const seg of segments) {
        const intent = detectIntent(seg);

        // ── Try CREATE ──────────────────────────────────────────────────────
        if (intent === 'CREATE' || intent === null) {
            const cleaned = stripTriggers(seg, CREATE_KW);
            const entity  = normalizeEntity(cleaned) || normalizeEntity(seg);
            const name    = extractName(seg);

            if (entity && ENTITY_ACTION_MAP[entity]) {
                commands.push({
                    intent: 'CREATE',
                    entity,
                    action: ENTITY_ACTION_MAP[entity].action,
                    route:  ENTITY_ACTION_MAP[entity].route,
                    data:   name ? { name } : {},
                });
                continue;
            }

            // Fallback: existing matchAction handles Hindi Devanagari aliases
            const act = matchAction(cleaned) || matchAction(seg);
            if (act) {
                commands.push({
                    intent: 'CREATE',
                    entity: act.keyword,
                    action: act.action,
                    route:  act.route,
                    data:   name ? { name } : {},
                });
                continue;
            }
        }

        // ── Try NAVIGATE ────────────────────────────────────────────────────
        if (intent === 'NAVIGATE' || intent === null) {
            const cleaned = stripTriggers(seg, NAV_KW);
            const nav = matchNavigation(cleaned) || matchNavigation(seg);
            if (nav) {
                commands.push({ intent: 'NAVIGATE', target: nav.label, route: nav.route });
                continue;
            }
        }

        // ── Unrecognized segment ────────────────────────────────────────────
        if (intent !== null) {
            commands.push({ intent, matched: false, raw: seg });
        }
    }

    return commands;
};

/**
 * Execute an array of parsed commands.
 *
 * @param {Array}     commands   — from parseMultiCommand()
 * @param {Function}  navigate   — React Router navigate()
 * @param {Function}  [openModal]— openModal(action, data) for CREATE; if omitted, navigates to route
 */
export const executeCommands = (commands, navigate, openModal = null) => {
    let executed = false;
    for (const cmd of commands) {
        if (!cmd.route) continue;
        if (cmd.intent === 'NAVIGATE') {
            navigate(cmd.route);
            executed = true;
        } else if (cmd.intent === 'CREATE') {
            if (openModal) openModal(cmd.action, cmd.data ?? {});
            else navigate(cmd.route);
            executed = true;
        }
    }
    if (executed) playSuccessSound();
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

const useVoiceNavigation = () => {
    const navigate = useNavigate();

    /**
     * Parse a raw transcript — supports English, Hinglish, Devanagari.
     *
     * Priority order:
     *  1. English action prefix     "add trading client"
     *  2. Hindi action suffix       "trading client banao"
     *  3. Hindi action prefix       "naya trading client" / "नया क्लाइंट"
     *  4. English nav prefix        "open dashboard"
     *  5. Hindi nav suffix          "dashboard kholo" / "डैशबोर्ड खोलो"
     *  6. Hindi nav prefix          "kholo dashboard"
     *  7. Direct keyword match      "dashboard" / "डैशबोर्ड"
     */
    const parseNavigationCommand = useCallback((rawTranscript) => {
        const text = normalise(rawTranscript);
        if (!text) return { matched: false, type: null, route: null, label: null, action: null };

        const NO_MATCH = { matched: false, type: null, route: null, label: null, action: null };

        // ── 1. English action prefix: "add broker" ────────────────────────────
        {
            const intent = extractPrefixIntent(text, ACTION_TRIGGERS);
            if (intent) {
                const match = matchAction(intent.remainder);
                if (match) return { matched: true, type: 'action', route: match.route, label: match.label, action: match.action };
            }
        }

        // ── 2. Hindi action SUFFIX: "broker banao" / "ब्रोकर बनाओ" ───────────
        {
            const intent = extractSuffixIntent(text, HINDI_ACTION_TRIGGERS);
            if (intent && intent.remainder) {
                const match = matchAction(intent.remainder);
                if (match) return { matched: true, type: 'action', route: match.route, label: match.label, action: match.action };
            }
        }

        // ── 3. Hindi action PREFIX: "naya broker" / "नया ब्रोकर" ─────────────
        {
            const intent = extractPrefixIntent(text, HINDI_ACTION_TRIGGERS);
            if (intent && intent.remainder) {
                const match = matchAction(intent.remainder);
                if (match) return { matched: true, type: 'action', route: match.route, label: match.label, action: match.action };
            }
        }

        // ── 4. English nav prefix: "open dashboard" ───────────────────────────
        {
            const intent = extractPrefixIntent(text, NAV_TRIGGERS);
            if (intent && intent.remainder) {
                const match = matchNavigation(intent.remainder);
                if (match) return { matched: true, type: 'navigation', route: match.route, label: match.label, action: null };
            }
        }

        // ── 5. Hindi nav SUFFIX: "dashboard kholo" / "डैशबोर्ड खोलो" ─────────
        {
            const intent = extractSuffixIntent(text, HINDI_NAV_TRIGGERS);
            if (intent && intent.remainder) {
                const match = matchNavigation(intent.remainder);
                if (match) return { matched: true, type: 'navigation', route: match.route, label: match.label, action: null };
            }
        }

        // ── 6. Hindi nav PREFIX: "kholo dashboard" ────────────────────────────
        {
            const intent = extractPrefixIntent(text, HINDI_NAV_TRIGGERS);
            if (intent && intent.remainder) {
                const match = matchNavigation(intent.remainder);
                if (match) return { matched: true, type: 'navigation', route: match.route, label: match.label, action: null };
            }
        }

        // ── 7. Direct keyword: "dashboard" / "डैशबोर्ड" ──────────────────────
        {
            const match = matchNavigation(text);
            if (match) return { matched: true, type: 'navigation', route: match.route, label: match.label, action: null };
        }

        return NO_MATCH;
    }, []);

    /**
     * Parse + immediately execute (navigate or open form).
     * Returns the parse result so the caller can show feedback.
     */
    const executeNavigationCommand = useCallback((rawTranscript, { onAction } = {}) => {
        const result = parseNavigationCommand(rawTranscript);
        if (!result.matched) return result;

        if (result.type === 'navigation') {
            navigate(result.route);
            playSuccessSound();
        } else if (result.type === 'action') {
            // Always navigate to the create route
            navigate(result.route);
            playSuccessSound();
            // Also fire the optional callback for toast/speech feedback
            if (onAction) onAction(result.action, result.route, result.label);
        }
        return result;
    }, [navigate, parseNavigationCommand]);

    return { parseNavigationCommand, executeNavigationCommand };
};

export default useVoiceNavigation;
