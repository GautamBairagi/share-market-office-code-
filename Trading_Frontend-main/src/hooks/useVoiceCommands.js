/**
 * useVoiceCommands — Standalone real-time voice command hook
 *
 * Listens for navigation + create/action commands in real-time using the
 * Web Speech API. Does NOT record or store audio — only processes live
 * transcript text.
 *
 * Supported languages: English · Hinglish · Hindi (Devanagari)
 *
 * Usage:
 *   const { isListening, transcript, intent, target, status, toggle } =
 *     useVoiceCommands({ onAction: (cfg) => myHandler(cfg) });
 *
 * Returned state:
 *   isListening  — mic is active
 *   transcript   — latest recognised text
 *   intent       — 'NAVIGATE' | 'CREATE' | null
 *   target       — matched keyword (e.g. 'trading clients')
 *   status       — 'idle' | 'listening' | 'recognized' | 'unknown'
 *   lastMatch    — full result object from last successful parse
 *   start / stop / toggle / reset — control functions
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    VOICE_COMMANDS,
    NAV_TRIGGERS,
    ACTION_TRIGGERS,
    HINDI_NAV_TRIGGERS,
    HINDI_ACTION_TRIGGERS,
    FILLER_WORDS,
} from '../config/voiceCommandConfig';

const _isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// ─────────────────────────────────────────────────────────────────────────────
// Pure parser helpers  (no React deps — safe to call outside components)
// ─────────────────────────────────────────────────────────────────────────────

/** Lowercase, collapse spaces, strip filler words */
const normalise = (text) => {
    let t = text.toLowerCase().trim();
    const sorted = [...FILLER_WORDS].sort((a, b) => b.length - a.length);
    sorted.forEach(w => {
        t = t.replace(new RegExp(`(^|\\s)${w.toLowerCase()}(\\s|$)`, 'gi'), ' ');
    });
    return t.replace(/\s+/g, ' ').trim();
};

/** Check if text STARTS WITH a trigger (English-style prefix) */
const extractPrefix = (text, triggers) => {
    const sorted = [...triggers].sort((a, b) => b.length - a.length);
    for (const t of sorted) {
        if (text.startsWith(t + ' ') || text === t) {
            return { trigger: t, remainder: text.slice(t.length).trim() };
        }
    }
    return null;
};

/** Check if text ENDS WITH a trigger (Hindi-style suffix) */
const extractSuffix = (text, triggers) => {
    const sorted = [...triggers].sort((a, b) => b.length - a.length);
    for (const t of sorted) {
        if (text.endsWith(' ' + t) || text === t) {
            return { trigger: t, remainder: text.slice(0, text.length - t.length).trim() };
        }
    }
    return null;
};

/** Find best navigation route for a keyword string */
const matchNav = (keyword) => {
    if (!keyword) return null;
    const routes = VOICE_COMMANDS.navigation;
    if (routes[keyword]) return { route: routes[keyword], label: keyword };
    let best = null, bestLen = 0;
    for (const [k, route] of Object.entries(routes)) {
        if ((keyword.includes(k) || k.includes(keyword)) && k.length > bestLen) {
            best = { route, label: k };
            bestLen = k.length;
        }
    }
    return best;
};

/** Find best action config for a keyword string */
const matchAct = (keyword) => {
    if (!keyword) return null;
    const actions = VOICE_COMMANDS.actions;
    if (actions[keyword]) return { ...actions[keyword], keyword };
    let best = null, bestLen = 0;
    for (const [k, cfg] of Object.entries(actions)) {
        if ((keyword.includes(k) || k.includes(keyword)) && k.length > bestLen) {
            best = { ...cfg, keyword: k };
            bestLen = k.length;
        }
    }
    return best;
};

/**
 * Parse a raw transcript string.
 *
 * Priority order:
 *   1. English action prefix     "add trading client"
 *   2. Hindi action suffix       "trading client banao"
 *   3. Hindi action prefix       "naya broker" / "नया ब्रोकर"
 *   4. English nav prefix        "open dashboard"
 *   5. Hindi nav suffix          "dashboard kholo" / "डैशबोर्ड खोलो"
 *   6. Hindi nav prefix          "kholo dashboard"
 *   7. Direct keyword            "dashboard" / "डैशबोर्ड"
 *
 * @returns {{ matched, intent, route, label, action }}
 */
export const parseCommand = (rawTranscript) => {
    const text = normalise(rawTranscript);
    if (!text) return { matched: false };

    // 1. English action prefix
    {
        const p = extractPrefix(text, ACTION_TRIGGERS);
        if (p?.remainder) {
            const m = matchAct(p.remainder);
            if (m) return { matched: true, intent: 'CREATE', route: m.route, label: m.label, action: m.action };
        }
    }
    // 2. Hindi action suffix
    {
        const s = extractSuffix(text, HINDI_ACTION_TRIGGERS);
        if (s?.remainder) {
            const m = matchAct(s.remainder);
            if (m) return { matched: true, intent: 'CREATE', route: m.route, label: m.label, action: m.action };
        }
    }
    // 3. Hindi action prefix
    {
        const p = extractPrefix(text, HINDI_ACTION_TRIGGERS);
        if (p?.remainder) {
            const m = matchAct(p.remainder);
            if (m) return { matched: true, intent: 'CREATE', route: m.route, label: m.label, action: m.action };
        }
    }
    // 4. English nav prefix
    {
        const p = extractPrefix(text, NAV_TRIGGERS);
        if (p?.remainder) {
            const m = matchNav(p.remainder);
            if (m) return { matched: true, intent: 'NAVIGATE', route: m.route, label: m.label, action: null };
        }
    }
    // 5. Hindi nav suffix
    {
        const s = extractSuffix(text, HINDI_NAV_TRIGGERS);
        if (s?.remainder) {
            const m = matchNav(s.remainder);
            if (m) return { matched: true, intent: 'NAVIGATE', route: m.route, label: m.label, action: null };
        }
    }
    // 6. Hindi nav prefix
    {
        const p = extractPrefix(text, HINDI_NAV_TRIGGERS);
        if (p?.remainder) {
            const m = matchNav(p.remainder);
            if (m) return { matched: true, intent: 'NAVIGATE', route: m.route, label: m.label, action: null };
        }
    }
    // 7. Direct keyword
    {
        const m = matchNav(text);
        if (m) return { matched: true, intent: 'NAVIGATE', route: m.route, label: m.label, action: null };
    }

    return { matched: false };
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Object} options
 * @param {(cfg: {action, route, label}) => void} [options.onAction]
 *   Called when a CREATE command is recognised (in addition to navigating).
 * @param {(result: object) => void} [options.onNavigate]
 *   Called when a NAVIGATE command is recognised.
 * @param {(transcript: string) => void} [options.onUnknown]
 *   Called when speech is heard but no command matched.
 */
const useVoiceCommands = ({ onAction, onNavigate, onUnknown } = {}) => {
    const navigate = useNavigate();

    const [isListening, setIsListening]   = useState(false);
    const [transcript, setTranscript]     = useState('');
    const [intent, setIntent]             = useState(null);   // 'NAVIGATE' | 'CREATE' | null
    const [target, setTarget]             = useState(null);   // matched label
    const [status, setStatus]             = useState('idle'); // 'idle'|'listening'|'recognized'|'unknown'
    const [lastMatch, setLastMatch]       = useState(null);

    const recognitionRef   = useRef(null);
    const hiLastFireAtRef  = useRef(0);
    const onActionRef      = useRef(onAction);
    const onNavigateRef    = useRef(onNavigate);
    const onUnknownRef     = useRef(onUnknown);

    // Keep callbacks fresh without recreating the recognition instances
    useEffect(() => { onActionRef.current   = onAction;   }, [onAction]);
    useEffect(() => { onNavigateRef.current = onNavigate; }, [onNavigate]);
    useEffect(() => { onUnknownRef.current  = onUnknown;  }, [onUnknown]);

    /** Process a final transcript line: parse → execute → update state */
    const processTranscript = useCallback((raw) => {
        const trimmed = raw.trim();
        if (!trimmed) return;

        setTranscript(trimmed);

        const result = parseCommand(trimmed);

        if (!result.matched) {
            setIntent(null);
            setTarget(null);
            setStatus('unknown');
            setLastMatch(null);
            if (onUnknownRef.current) onUnknownRef.current(trimmed);
            // Reset status after 3 s
            setTimeout(() => setStatus(prev => prev === 'unknown' ? 'listening' : prev), 3000);
            return;
        }

        setIntent(result.intent);
        setTarget(result.label);
        setStatus('recognized');
        setLastMatch(result);

        if (result.intent === 'NAVIGATE') {
            navigate(result.route);
            if (onNavigateRef.current) onNavigateRef.current(result);
        } else if (result.intent === 'CREATE') {
            navigate(result.route);
            if (onActionRef.current) onActionRef.current(result);
        }

        // Reset display after 4 s
        setTimeout(() => {
            setIntent(null);
            setTarget(null);
            setStatus('listening');
            setTranscript('');
        }, 4000);
    }, [navigate]);

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { /* already stopped */ }
            recognitionRef.current = null;
        }
        setIsListening(false);
        setStatus('idle');
    }, []);

    const start = useCallback(async () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            console.warn('[useVoiceCommands] SpeechRecognition not supported');
            return;
        }

        // ── Request mic permission first (required on mobile) ────────────
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
        } catch {
            console.warn('[useVoiceCommands] Mic permission denied');
            return;
        }

        // Stop any existing instance
        stop();

        hiLastFireAtRef.current = 0;
        setTranscript('');
        setIntent(null);
        setTarget(null);
        setLastMatch(null);
        setStatus('listening');

        const r = new SR();
        r.lang           = 'hi-IN';
        r.continuous     = !_isMobile;          // mobile doesn't support continuous
        r.interimResults = !_isMobile;          // skip interim on mobile for reliability

        r.onresult = (event) => {
            let interim = '';
            let finalText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const chunk = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalText += chunk + ' ';
                } else {
                    interim += chunk;
                }
            }

            // Show interim transcript live (don't parse yet)
            if (interim) setTranscript(interim);

            // Parse on final result
            if (finalText.trim()) {
                hiLastFireAtRef.current = Date.now();
                processTranscript(finalText);
            }
        };

        r.onerror = (e) => {
            if (e.error === 'not-allowed') {
                setStatus('idle');
                setIsListening(false);
                return;
            }
            if (e.error === 'no-speech' || e.error === 'aborted') return;
            // Restart on recoverable errors
            if (e.error === 'network' || e.error === 'audio-capture') {
                setTimeout(() => { if (recognitionRef.current) start(); }, 1000);
            }
        };

        r.onend = () => {
            // Auto-restart for continuous listening (essential on mobile where continuous=false)
            if (recognitionRef.current === r) {
                try { r.start(); } catch { /* already started or stopped */ }
            }
        };

        try {
            r.start();
            recognitionRef.current = r;
            setIsListening(true);
        } catch (e) {
            console.warn('[useVoiceCommands] start failed:', e.message);
        }
    }, [stop, processTranscript]);

    const toggle = useCallback(() => {
        if (isListening) stop(); else start();
    }, [isListening, start, stop]);

    const reset = useCallback(() => {
        setTranscript('');
        setIntent(null);
        setTarget(null);
        setStatus(isListening ? 'listening' : 'idle');
        setLastMatch(null);
    }, [isListening]);

    // Cleanup on unmount
    useEffect(() => () => stop(), [stop]);

    return {
        isListening,
        transcript,
        intent,
        target,
        status,
        lastMatch,
        start,
        stop,
        toggle,
        reset,
    };
};

export default useVoiceCommands;
