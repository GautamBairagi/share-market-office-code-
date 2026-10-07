/**
 * VoiceModulationPage
 *
 * Full frontend voice recording + history page.
 * ─ MediaRecorder API via useVoiceRecorder hook
 * ─ Web Speech API (webkitSpeechRecognition) for transcript capture
 * ─ /ai-parse → confirmation dialog → /execute-command flow
 * ─ SpeechSynthesis API for success voice feedback
 * ─ States: idle | recording | processing | completed | error
 * ─ History cards: always-visible transcript + AI response (inline, no expand needed)
 * ─ Processing disables play button + shows spinner
 * ─ Only one audio plays at a time; all others pause
 * ─ Proper cleanup on unmount (URLs revoked, tracks stopped)
 * ─ Theme matches existing dark platform: #1f283e, green accent, same typography
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mic, Square,
    Bot, CheckCircle2, AlertCircle, Loader2,
    Radio, X, ExternalLink,
    Navigation, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import { useVoiceHistory } from '../../hooks/useVoiceHistory';
import { parseMultiCommand, executeCommands } from '../../hooks/useVoiceNavigation';
import { parseVoiceCommand as aiParseCommand, executeCommand } from '../../services/voiceService';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

// ─── Device detection ────────────────────────────────────────────────────────

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSupported = !!SpeechRecognitionAPI;

// ─── Success sound ───────────────────────────────────────────────────────────

let _audioUnlocked = false;

const unlockAudio = () => {
    if (_audioUnlocked) return;
    // Mobile browsers need a silent play from a user gesture to unlock audio
    try {
        const a = new Audio('/sounds/success.wav');
        a.volume = 0;
        a.play().then(() => { a.pause(); _audioUnlocked = true; }).catch(() => { });
    } catch (_) { }
};

const playSuccessSound = () => {
    try {
        const a = new Audio('/sounds/success.wav');
        a.volume = 0.7;
        a.play().catch(() => { });
    } catch (_) { /* ignore */ }
};

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 4500);
        return () => clearTimeout(t);
    }, [onClose]);

    const styles = {
        error: 'border-red-500/40 bg-red-500/10 text-red-300',
        success: 'border-green-500/40 bg-green-500/10 text-green-300',
        info: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-sm shadow-2xl max-w-sm ${styles[type] || styles.info}`}
            style={{ animation: 'toastSlideIn 0.28s cubic-bezier(0.16,1,0.3,1) both' }}
        >
            {type === 'error'
                ? <AlertCircle className="w-4 h-4 shrink-0" />
                : <CheckCircle2 className="w-4 h-4 shrink-0" />
            }
            <span className="text-[12px] font-bold tracking-wide flex-1">{message}</span>
            <button
                onClick={onClose}
                className="ml-1 text-current opacity-50 hover:opacity-100 transition-opacity shrink-0"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

// ─── Authenticated Audio Player ──────────────────────────────────────────────
// Fetches audio with JWT token (audio route requires auth), converts to blob URL

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

const ConfirmationDialog = ({ data, onConfirm, onCancel, loading }) => {
    if (!data) return null;

    const getConfirmText = () => {
        const action = (data.action || '').replace(/_/g, ' ');
        const target = data.username ? `@${data.username}` : data.userId ? `User #${data.userId}` : 'user';
        if (data.action === 'ADD_FUND') {
            return `Are you sure you want to ADD ₹${data.amount} to ${target}'s account?`;
        }
        if (data.action === 'WITHDRAW_FUND') {
            return `Are you sure you want to WITHDRAW ₹${data.amount} from ${target}'s account?`;
        }
        if (data.amount && (data.userId || data.username)) {
            return `Are you sure you want to ${action} ₹${data.amount} for ${target}?`;
        }
        return `Are you sure you want to execute: ${action}?`;
    };

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div
                className="bg-[#1f283e] border border-white/15 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
                style={{ animation: 'toastSlideIn 0.28s cubic-bezier(0.16,1,0.3,1) both' }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/20">
                        <Bot className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-white font-black uppercase tracking-widest text-sm">
                        Confirm Command
                    </h3>
                </div>

                {/* Command details */}
                <div className="bg-white/5 rounded-xl border border-white/8 p-4 mb-6">
                    <p className="text-slate-300 text-sm font-medium leading-relaxed">
                        {getConfirmText()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {data.action && (
                            <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-green-400">
                                {data.action.replace(/_/g, ' ')}
                            </span>
                        )}
                        {(data.username || data.userId) && (
                            <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-blue-400">
                                {data.username ? `@${data.username}` : `User #${data.userId}`}
                            </span>
                        )}
                        {data.amount && (
                            <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-purple-400">
                                ₹{data.amount}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing…</>
                        ) : (
                            <><CheckCircle2 className="w-3.5 h-3.5" /> Confirm</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const VoiceModulationPage = () => {
    const recorder = useVoiceRecorder();
    const navigate = useNavigate();
    const blobRef = useRef(null); // Capture blob for auto-save
    const { user: currentUser } = useAuth();
    // Hook for saving operations (recordings stored to DB for /voice-history page)
    const { saveRecording } = useVoiceHistory();

    const [toast, setToast] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [parsedCmds, setParsedCmds] = useState([]);  // preview in recorder panel

    // ── Recent executed command (session-only, not persisted) ─────────────────
    const [recentCommand, setRecentCommand] = useState(null);

    // ── Voice navigation command ref panel toggle ─────────────────────────────
    const [showNavRef, setShowNavRef] = useState(false);

    // ── Voice command states ───────────────────────────────────────────────────
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [confirmData, setConfirmData] = useState(null);   // { action, userId, username, amount, itemId }
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [detectedLang, setDetectedLang] = useState(null); // auto-detected: 'Hindi' | 'English'

    // ── Refs ──────────────────────────────────────────────────────────────────
    const recognitionRef = useRef(null);      // hi-IN instance
    const recognitionEnRef = useRef(null);    // en-IN instance
    const finalTranscriptRef = useRef('');

    // ── Toast helpers ─────────────────────────────────────────────────────────

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type, key: Date.now() });
    }, []);

    const dismissToast = useCallback(() => setToast(null), []);

    // ── SpeechSynthesis helper ────────────────────────────────────────────────

    const speakMessage = useCallback((text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        // Mobile fix: voices may not be loaded yet, wait for them
        const speak = () => window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.getVoices().length > 0) {
            speak();
        } else {
            window.speechSynthesis.onvoiceschanged = () => { speak(); window.speechSynthesis.onvoiceschanged = null; };
            // Fallback timeout in case onvoiceschanged never fires
            setTimeout(speak, 200);
        }
    }, []);

    // ── Detect language from transcript text ──────────────────────────────────

    const detectLang = (text) => {
        if (!text) return null;
        const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
        const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
        if (devanagariCount === 0 && latinCount === 0) return null;
        return devanagariCount > latinCount * 0.4 ? 'Hindi' : 'English';
    };

    // ── Speech Recognition — Dual language (hi-IN + en-IN simultaneously) ────

    const startSpeechRecognition = useCallback(() => {
        if (!SpeechRecognitionAPI) {
            showToast(
                isIOS
                    ? 'Voice recognition is not supported on this iOS browser. Please type your command below.'
                    : 'Speech recognition not supported in this browser.',
                'error',
            );
            return;
        }

        // Skip getUserMedia here — the recorder already requested mic permission.
        // Requesting it again on mobile steals the mic stream from MediaRecorder.

        finalTranscriptRef.current = '';
        setTranscript('');
        setDetectedLang(null);

        // ── Mobile: single recognition instance (dual causes conflicts) ──
        if (isMobile) {
            const r = new SpeechRecognitionAPI();
            r.lang = 'hi-IN';           // hi-IN handles Hindi + Hinglish + English on Indian devices
            r.continuous = false;        // mobile browsers don't support continuous reliably
            r.interimResults = false;

            r.onresult = (event) => {
                let text = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) text += event.results[i][0].transcript + ' ';
                }
                text = text.trim();
                if (!text) return;
                finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + text).trim();
                setTranscript(finalTranscriptRef.current);
                setDetectedLang(/[\u0900-\u097F]/.test(text) ? 'Hindi' : 'Hinglish');
            };

            r.onerror = (e) => {
                if (e.error === 'not-allowed') {
                    showToast('Microphone permission denied.', 'error');
                    setIsListening(false);
                    recognitionRef.current = null;
                    return;
                }
                if (e.error === 'no-speech' || e.error === 'aborted') return;
                if (e.error === 'network') {
                    showToast('Network error — check your connection.', 'error');
                }
                console.warn('[speech-mobile] error:', e.error);
            };

            // Auto-restart on mobile when recognition ends (it stops after each utterance)
            r.onend = () => {
                if (recognitionRef.current === r) {
                    try { r.start(); } catch { /* already running or stopped */ }
                }
            };

            // Small delay on mobile — let MediaRecorder grab the mic first
            setTimeout(() => {
                try {
                    r.start();
                    recognitionRef.current = r;
                } catch (e) {
                    console.warn('[speech-mobile] start failed:', e.message);
                }
            }, 300);

            setIsListening(true);
            return;
        }

        // ── Desktop: dual recognition (hi-IN + en-IN) for best coverage ──

        let hiLastFireAt = 0;

        const makeRecognition = (lang, onResult) => {
            const r = new SpeechRecognitionAPI();
            r.continuous = true;
            r.interimResults = false;
            r.lang = lang;
            r.onresult = onResult;
            r.onerror = (e) => {
                if (e.error === 'not-allowed') {
                    showToast('Microphone permission denied.', 'error');
                    setIsListening(false);
                    return;
                }
                if (e.error !== 'no-speech' && e.error !== 'aborted') {
                    console.warn(`[speech-${lang}] error:`, e.error);
                }
            };
            r.onend = () => { /* handled by stop */ };
            return r;
        };

        const hiRecognition = makeRecognition('hi-IN', (event) => {
            let text = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) text += event.results[i][0].transcript + ' ';
            }
            text = text.trim();
            if (!text) return;
            hiLastFireAt = Date.now();
            finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + text).trim();
            setTranscript(finalTranscriptRef.current);
            setDetectedLang(/[\u0900-\u097F]/.test(text) ? 'Hindi' : 'Hinglish');
        });

        const enRecognition = makeRecognition('en-IN', (event) => {
            let text = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) text += event.results[i][0].transcript + ' ';
            }
            text = text.trim();
            if (!text) return;
            if (Date.now() - hiLastFireAt < 600) return;
            const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
            const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
            if (latinCount > devanagariCount) {
                finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + text).trim();
                setTranscript(finalTranscriptRef.current);
                setDetectedLang('English');
            }
        });

        try {
            hiRecognition.start();
            recognitionRef.current = hiRecognition;
        } catch (e) {
            console.warn('[speech-hi-IN] start failed:', e.message);
        }

        setTimeout(() => {
            try {
                enRecognition.start();
                recognitionEnRef.current = enRecognition;
            } catch (e) {
                console.warn('[speech-en-IN] start failed:', e.message);
            }
        }, 150);

        setIsListening(true);
    }, [showToast]);

    const stopSpeechRecognition = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { /* already stopped */ }
            recognitionRef.current = null;
        }
        if (recognitionEnRef.current) {
            try { recognitionEnRef.current.stop(); } catch { /* already stopped */ }
            recognitionEnRef.current = null;
        }
        setIsListening(false);
    }, []);

    // ── Cleanup speech recognition on unmount ─────────────────────────────────

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch { }
                recognitionRef.current = null;
            }
            if (recognitionEnRef.current) {
                try { recognitionEnRef.current.stop(); } catch { }
                recognitionEnRef.current = null;
            }
            window.speechSynthesis?.cancel();
        };
    }, []);

    // ── Execute command (after confirmation) ──────────────────────────────────

    const handleConfirm = useCallback(async () => {
        if (!confirmData) return;

        const commandData = confirmData;
        setConfirmLoading(true);

        try {
            const execResult = await executeCommand(commandData);

            // Save to DB (for /voice-history page)
            const resolvedUserId = execResult?.userId || commandData?.userId || commandData?.filters?.userId || null;
            saveRecording({
                audioBlob: blobRef.current,
                transcript: finalTranscriptRef.current.trim(),
                parsedCommand: commandData,
                actionTaken: commandData?.action,
                actionResult: execResult || { success: true },
                status: 'executed',
                userId: resolvedUserId,
                adminId: currentUser?.id || null,
                language: detectedLang === 'Hindi' ? 'hi-IN' : 'en-IN',
            });

            // Show recent command on this page
            setRecentCommand({
                transcript: finalTranscriptRef.current.trim(),
                action: commandData?.action,
                username: commandData?.username || execResult?.username,
                amount: commandData?.amount,
                status: 'executed',
                time: new Date(),
            });

            playSuccessSound();
            showToast('Command executed successfully!', 'success');
            setTimeout(() => speakMessage('Command executed successfully'), 350);
        } catch (err) {
            // Save failed command to DB
            saveRecording({
                audioBlob: blobRef.current,
                transcript: finalTranscriptRef.current.trim(),
                parsedCommand: commandData,
                actionTaken: commandData?.action,
                actionResult: { success: false, error: err?.message },
                status: 'failed',
                userId: commandData?.userId || commandData?.filters?.userId || null,
                adminId: currentUser?.id || null,
                language: detectedLang === 'Hindi' ? 'hi-IN' : 'en-IN',
            });

            setRecentCommand({
                transcript: finalTranscriptRef.current.trim(),
                action: commandData?.action,
                username: commandData?.username,
                amount: commandData?.amount,
                status: 'failed',
                error: err?.message,
                time: new Date(),
            });

            showToast(err?.message || 'Command execution failed.', 'error');
        } finally {
            setConfirmLoading(false);
            setConfirmData(null);
            // Auto-reset for next command
            finalTranscriptRef.current = '';
            setTranscript('');
            setDetectedLang(null);
        }
    }, [confirmData, showToast, speakMessage, saveRecording, currentUser, detectedLang]);

    const handleCancel = useCallback(() => {
        setConfirmData(null);
    }, []);

    // ── Submit recording → ai-parse → confirmation ────────────────────────────

    const submitRecording = useCallback(async (blob) => {
        blobRef.current = blob; // Capture for auto-save
        if (!blob) return;

        let capturedTranscript = finalTranscriptRef.current.trim();

        // ── Mobile fallback: no SpeechRecognition transcript → use Whisper API ──
        if (!capturedTranscript && blob) {
            try {
                showToast('Transcribing audio…', 'info');
                const formData = new FormData();
                formData.append('audio', blob, 'recording.webm');
                const res = await api.post('/ai/transcribe-voice', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                capturedTranscript = (res.data.transcript || '').trim();
                if (capturedTranscript) {
                    finalTranscriptRef.current = capturedTranscript;
                    setTranscript(capturedTranscript);
                }
            } catch (err) {
                console.warn('[submitRecording] Whisper transcription failed:', err.message);
            }
        }

        if (!capturedTranscript) {
            showToast('No speech detected. Please speak clearly and try again.', 'error');
            return;
        }

        // ── Multi-command intercept — check BEFORE AI parse ──────────────────
        // Splits on "and / then / aur / phir", detects NAVIGATE + CREATE intents,
        // extracts entity + name, executes all commands immediately.
        const commands = parseMultiCommand(capturedTranscript);
        const navCmds = commands.filter(c => c.route);

        if (navCmds.length > 0) {
            setParsedCmds(commands);
            executeCommands(navCmds, navigate);

            const msgs = navCmds.map(c =>
                c.intent === 'NAVIGATE'
                    ? `Navigating to ${c.target}`
                    : `Opening ${c.entity} form${c.data?.name ? ` for ${c.data.name}` : ''}`
            );
            playSuccessSound();
            showToast(msgs.join(' · '), 'success');
            setTimeout(() => speakMessage(msgs.join(', ')), 350);

            // Auto-reset for next command
            finalTranscriptRef.current = '';
            setTranscript('');
            setDetectedLang(null);
            setTimeout(() => setParsedCmds([]), 5000);
            return;
        }
        // ─────────────────────────────────────────────────────────────────────

        setIsSubmitting(true);

        try {
            const parsed = await aiParseCommand(capturedTranscript);
            setConfirmData(parsed);
        } catch (err) {
            showToast(err?.message || 'AI parsing failed. Please try again.', 'error');
            // Reset on failure too
            finalTranscriptRef.current = '';
            setTranscript('');
            setDetectedLang(null);
        } finally {
            setIsSubmitting(false);
        }
    }, [showToast, speakMessage]);

    // ── Watch recorder completion → submit ────────────────────────────────────

    useEffect(() => {
        if (recorder.isCompleted && recorder.audioBlob && recorder.audioURL) {
            stopSpeechRecognition();
            submitRecording(recorder.audioBlob, recorder.audioURL);
            recorder.reset();
        }
    }, [recorder.isCompleted]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Watch for recorder error → toast ──────────────────────────────────────

    useEffect(() => {
        if (recorder.isError && recorder.errorMessage) {
            showToast(recorder.errorMessage, 'error');
            stopSpeechRecognition();
        }
    }, [recorder.isError, recorder.errorMessage, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Mic button handler ────────────────────────────────────────────────────

    const handleMicClick = async () => {
        // Unlock audio on user tap (mobile browsers require user gesture to play sounds)
        unlockAudio();

        if (recorder.isRecording) {
            recorder.stopRecording();
            if (!isMobile) stopSpeechRecognition();
        } else if (!isSubmitting && !recorder.isProcessing) {
            // Clear previous transcript before starting new recording
            finalTranscriptRef.current = '';
            setTranscript('');
            setDetectedLang(null);

            await recorder.startRecording();
            if (!isMobile) {
                startSpeechRecognition();
            }
        }
    };

    // ── Text input fallback (for iOS / unsupported browsers) ───────────────
    const [manualText, setManualText] = useState('');

    const handleManualSubmit = useCallback(() => {
        const text = manualText.trim();
        if (!text) return;
        setManualText('');

        // Try multi-command nav first
        const commands = parseMultiCommand(text);
        const navCmds = commands.filter(c => c.route);
        if (navCmds.length > 0) {
            setParsedCmds(commands);
            executeCommands(navCmds, navigate);
            const msgs = navCmds.map(c =>
                c.intent === 'NAVIGATE'
                    ? `Navigating to ${c.target}`
                    : `Opening ${c.entity} form${c.data?.name ? ` for ${c.data.name}` : ''}`
            );
            playSuccessSound();
            showToast(msgs.join(' · '), 'success');
            setTimeout(() => setParsedCmds([]), 5000);
            return;
        }

        // Fall back to AI parse
        (async () => {
            setIsSubmitting(true);
            try {
                const parsed = await aiParseCommand(text);
                setConfirmData(parsed);
            } catch (err) {
                showToast(err?.message || 'AI parsing failed. Please try again.', 'error');
            } finally {
                setIsSubmitting(false);
            }
        })();
    }, [manualText, showToast, navigate]);

    const isMicDisabled = recorder.isProcessing || isSubmitting;

    const getMicLabel = () => {
        if (recorder.isRecording) return 'Stop Recording';
        if (isMicDisabled) return 'Processing…';
        return 'Start Recording';
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-700">

            {/* ── Page Header ── */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/20 shadow-lg">
                            <Radio className="w-5 h-5 text-green-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                            Voice Modulation
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
                        Record voice commands and messages. Up to{' '}
                        <span className="text-green-400 font-bold">60 seconds</span> per recording.
                        All recordings are encrypted end-to-end.
                    </p>
                </div>
                {/* Voice Recordings audit button */}
                <a
                    href="/voice-history"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all text-[11px] font-black uppercase tracking-widest self-start lg:self-auto"
                >
                    <Mic className="w-4 h-4" />
                    Voice Recordings
                    <ExternalLink className="w-3 h-3" />
                </a>

                {/* Live recording indicator */}
                {recorder.isRecording && (
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-red-300 text-[11px] font-black uppercase tracking-widest">
                            Live · {recorder.timerLabel}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Voice Command Reference Panel ── */}
            <div className="bg-[#1f283e]/50 backdrop-blur-xl rounded-2xl border border-white/8 overflow-hidden">
                <button
                    onClick={() => setShowNavRef(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white">
                            Voice Command Reference
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            say these to navigate or open forms
                        </span>
                    </div>
                    {showNavRef
                        ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    }
                </button>

                {showNavRef && (
                    <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                        {/* English Navigation */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2.5 flex items-center gap-1.5">
                                <Navigation className="w-3 h-3" /> English Navigation
                            </p>
                            <div className="space-y-1.5">
                                {[
                                    ['Dashboard', '"open dashboard"'],
                                    ['Trading Clients', '"go to trading clients"'],
                                    ['Market Watch', '"open market watch"'],
                                    ['Brokers', '"open brokers"'],
                                    ['Pending Orders', '"open pending orders"'],
                                    ['Withdrawal Requests', '"go to withdrawals"'],
                                    ['Notifications', '"show notifications"'],
                                    ['Trader Funds', '"show funds"'],
                                    ['Voice History', '"open voice history"'],
                                    ['Admins', '"open admins"'],
                                ].map(([label, cmd]) => (
                                    <div key={label} className="flex items-baseline justify-between gap-2">
                                        <span className="text-[10px] text-slate-400 font-medium truncate">{label}</span>
                                        <span className="text-[9px] text-blue-400/60 font-mono whitespace-nowrap">{cmd}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hindi Navigation */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-400 mb-2.5 flex items-center gap-1.5">
                                <Navigation className="w-3 h-3" /> हिंदी नेविगेशन
                            </p>
                            <div className="space-y-1.5">
                                {[
                                    ['Dashboard', '"डैशबोर्ड खोलो"'],
                                    ['Trading Clients', '"trading clients dikhao"'],
                                    ['Market Watch', '"मार्केट वॉच खोलो"'],
                                    ['Brokers', '"brokers kholo"'],
                                    ['Pending Orders', '"पेंडिंग ऑर्डर खोलो"'],
                                    ['Withdrawal', '"विदड्रॉल dikhao"'],
                                    ['Notifications', '"नोटिफिकेशन खोलो"'],
                                    ['Funds', '"फंड्स dikhao"'],
                                    ['Admins', '"एडमिन kholo"'],
                                    ['Support', '"टिकट खोलो"'],
                                ].map(([label, cmd]) => (
                                    <div key={label} className="flex items-baseline justify-between gap-2">
                                        <span className="text-[10px] text-slate-400 font-medium truncate">{label}</span>
                                        <span className="text-[9px] text-orange-400/60 font-mono whitespace-nowrap">{cmd}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form Actions — English + Hindi */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-400 mb-2.5 flex items-center gap-1.5">
                                <Zap className="w-3 h-3" /> Forms — English / हिंदी
                            </p>
                            <div className="space-y-1.5">
                                {[
                                    ['New Trading Client', '"add trading client"'],
                                    ['New Trading Client', '"trading client banao"'],
                                    ['New Trading Client', '"ट्रेडिंग क्लाइंट बनाओ"'],
                                    ['New Broker', '"create broker"'],
                                    ['New Broker', '"broker banao"'],
                                    ['New Broker', '"ब्रोकर बनाओ"'],
                                    ['New Admin', '"add admin"'],
                                    ['New Admin', '"नया एडमिन"'],
                                    ['New Trade', '"create trade"'],
                                    ['New Fund Entry', '"add fund"'],
                                ].map(([label, cmd], i) => (
                                    <div key={i} className="flex items-baseline justify-between gap-2">
                                        <span className="text-[10px] text-slate-400 font-medium truncate">{label}</span>
                                        <span className="text-[9px] text-green-400/60 font-mono whitespace-nowrap">{cmd}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fund Commands + Tips */}
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400 mb-2.5 flex items-center gap-1.5">
                                    <Bot className="w-3 h-3" /> Fund Commands (AI)
                                </p>
                                <div className="space-y-1.5">
                                    {[
                                        ['Add funds (English)', '"add 5000 to username"'],
                                        ['Add funds (Hindi)', '"ID 16 me 5000 add karo"'],
                                        ['Add funds (Hindi)', '"username ke account me 5000 daalo"'],
                                        ['Withdraw (English)', '"withdraw 2000 from username"'],
                                        ['Withdraw (Hindi)', '"username se 2000 nikalo"'],
                                        ['Block user', '"user 10 block karo"'],
                                        ['Unblock user', '"ID 12 ko unblock karo"'],
                                    ].map(([label, cmd], i) => (
                                        <div key={i} className="flex items-baseline justify-between gap-2">
                                            <span className="text-[10px] text-slate-400 font-medium truncate">{label}</span>
                                            <span className="text-[9px] text-amber-400/60 font-mono whitespace-nowrap">{cmd}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400 mb-2">Tips</p>
                                <div className="space-y-1.5">
                                    {[
                                        'English: "open [page]" or "go to [page]"',
                                        'Hindi: "[page] kholo" or "[page] dikhao"',
                                        'Forms: "add/create [item]" or "[item] banao"',
                                        'Navigation = instant, no confirmation',
                                        'Fund commands = AI parses + confirms',
                                        'Hindi + English auto-detected by script',
                                    ].map((tip, i) => (
                                        <div key={i} className="flex items-start gap-1.5">
                                            <span className="text-purple-400 text-[9px] font-black shrink-0 mt-0.5">·</span>
                                            <span className="text-[10px] text-slate-500 leading-relaxed">{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Two-column grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">

                {/* ──────────── LEFT: Voice Recorder Panel ──────────── */}
                <div className="xl:col-span-1">
                    <div className="bg-[#1f283e]/50 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">

                        {/* Panel header */}
                        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                                        Voice Recorder
                                    </h3>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">
                                        {recorder.isRecording ? 'Recording in progress…' : 'Press mic to begin'}
                                    </p>
                                </div>
                                {/* Auto-detected language badge */}
                                {detectedLang ? (
                                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${detectedLang === 'Hindi' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                        detectedLang === 'Hinglish' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                        }`}>
                                        {detectedLang === 'Hindi' ? '🇮🇳 हिंदी' :
                                            detectedLang === 'Hinglish' ? '🇮🇳 Hinglish' :
                                                '🇮🇳 English'}
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-1 rounded-lg border border-white/8 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                        Auto Detect
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center gap-4 sm:gap-6">

                            {/* Mic button */}
                            <div className="relative">
                                {recorder.isRecording && (
                                    <>
                                        <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                                        <span className="absolute -inset-3 rounded-full bg-red-500/10 animate-pulse" />
                                    </>
                                )}
                                <button
                                    id="voice-mic-btn"
                                    onClick={handleMicClick}
                                    disabled={isMicDisabled}
                                    title={getMicLabel()}
                                    className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xl ${recorder.isRecording
                                        ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30 scale-110'
                                        : isMicDisabled
                                            ? 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed opacity-60'
                                            : 'bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20 hover:border-green-400 hover:scale-105 active:scale-95'
                                        }`}
                                >
                                    {isMicDisabled ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                                    ) : recorder.isRecording ? (
                                        <Square className="w-7 h-7 fill-current" />
                                    ) : (
                                        <Mic className="w-8 h-8" />
                                    )}
                                </button>
                            </div>

                            {/* State label + timer */}
                            <div className="text-center">
                                <p className={`text-[11px] font-black uppercase tracking-widest ${recorder.isRecording ? 'text-red-400'
                                    : isMicDisabled ? 'text-amber-400'
                                        : 'text-slate-500'
                                    }`}>
                                    {getMicLabel()}
                                </p>
                                {recorder.isRecording && (
                                    <p className="text-2xl font-black text-white mt-1 tabular-nums font-mono">
                                        {recorder.timerLabel}
                                    </p>
                                )}
                            </div>

                            {/* Device / Speech support indicator */}
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                <span className="px-2 py-0.5 rounded border border-white/8 text-[8px] font-black uppercase tracking-widest text-slate-600">
                                    {isMobile ? (isIOS ? 'iOS' : 'Android') : 'Desktop'}
                                </span>
                                <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${speechSupported
                                    ? 'border-green-500/20 text-green-500'
                                    : 'border-red-500/20 text-red-400'
                                    }`}>
                                    Speech: {speechSupported ? 'Supported' : 'Not Supported'}
                                </span>
                            </div>

                            {/* Text input fallback — shown when speech is NOT supported (iOS Safari etc.) */}
                            {!speechSupported && !recorder.isRecording && (
                                <div className="w-full space-y-2">
                                    <p className="text-[10px] text-amber-400 font-bold text-center">
                                        Voice recognition not available on this device. Type your command below.
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={manualText}
                                            onChange={(e) => setManualText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                                            placeholder="Type command… e.g. open dashboard"
                                            className="flex-1 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-[12px] placeholder-slate-600 focus:outline-none focus:border-green-500/40"
                                        />
                                        <button
                                            onClick={handleManualSubmit}
                                            disabled={!manualText.trim() || isSubmitting}
                                            className="px-4 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-[11px] font-black uppercase tracking-widest hover:bg-green-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            {isSubmitting ? 'Processing…' : 'Send'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Live transcript preview while recording */}
                            {recorder.isRecording && transcript && (
                                <div className="w-full bg-white/5 rounded-xl border border-white/8 px-4 py-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                                                Live Transcript
                                            </span>
                                        </div>
                                        {detectedLang && (
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${detectedLang === 'Hindi' ? 'text-orange-400' : 'text-blue-400'}`}>
                                                {detectedLang}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed italic">
                                        "{transcript}"
                                    </p>
                                </div>
                            )}

                            {/* ── Parsed commands preview ── */}
                            {parsedCmds.length > 0 && (
                                <div className="w-full bg-white/5 rounded-xl border border-white/8 px-4 py-3 space-y-2">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                                            Executing command{parsedCmds.length > 1 ? 's' : ''}…
                                        </span>
                                    </div>
                                    {parsedCmds.map((cmd, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest shrink-0 ${!cmd.route ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                cmd.intent === 'NAVIGATE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                    'bg-green-500/10 border-green-500/20 text-green-400'
                                                }`}>
                                                {!cmd.route ? 'Unknown' : cmd.intent}
                                            </span>
                                            <span className="text-[10px] text-slate-300 truncate">
                                                {cmd.intent === 'NAVIGATE'
                                                    ? cmd.target
                                                    : cmd.route
                                                        ? `${cmd.entity}${cmd.data?.name ? ` · ${cmd.data.name}` : ''}`
                                                        : cmd.raw}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Progress bar */}
                            {recorder.isRecording && (
                                <div className="w-full">
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${recorder.progressPercent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">0:00</span>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">1:00</span>
                                    </div>
                                </div>
                            )}

                            {/* Error reset button */}
                            {recorder.isError && (
                                <button
                                    onClick={recorder.reset}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-all"
                                >
                                    <RefreshCcw className="w-3.5 h-3.5" /> Try Again
                                </button>
                            )}

                            {/* Tips (idle only) */}
                            {recorder.isIdle && (
                                <div className="w-full space-y-2 pt-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 text-center mb-2">
                                        Voice Command Examples
                                    </p>
                                    {[
                                        { label: 'ADD (Hindi)', cmd: 'username ke account me 5000 daalo' },
                                        { label: 'WITHDRAW (Hindi)', cmd: 'username ke account se 3000 nikalo' },
                                        { label: 'ADD (English)', cmd: 'add 5000 to username account' },
                                        { label: 'WITHDRAW (EN)', cmd: 'withdraw 2000 from username' },
                                    ].map((tip, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider shrink-0 ${i < 2 ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                                {tip.label}
                                            </span>
                                            <p className="text-[10px] text-slate-400 leading-relaxed italic">"{tip.cmd}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ──────────── RIGHT: Recent Command Panel ──────────── */}
                <div className="xl:col-span-2">
                    <div className="bg-[#1f283e]/50 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">

                        {/* Panel header */}
                        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                                    Recent Command
                                </h3>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">
                                    Last executed voice command
                                </p>
                            </div>
                            <a
                                href="/voice-history"
                                className="flex items-center gap-1.5 text-[10px] font-black text-green-400 hover:text-green-300 uppercase tracking-widest transition-colors"
                            >
                                All Recordings <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {recentCommand ? (() => {
                                const isOk = recentCommand.status === 'executed';
                                const actionColors = {
                                    ADD_FUND: 'bg-green-500/15 border-green-500/25 text-green-300',
                                    WITHDRAW_FUND: 'bg-orange-500/15 border-orange-500/25 text-orange-300',
                                    BLOCK_USER: 'bg-red-500/15 border-red-500/25 text-red-300',
                                    UNBLOCK_USER: 'bg-sky-500/15 border-sky-500/25 text-sky-300',
                                    TRANSFER_FUND: 'bg-violet-500/15 border-violet-500/25 text-violet-300',
                                    CREATE_ADMIN: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-300',
                                };
                                const timeLabel = recentCommand.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

                                return (
                                    <div className={`rounded-xl border p-5 ${isOk ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-red-500/5 border-red-500/25'}`}>
                                        {/* Status + action + time */}
                                        <div className="flex items-center gap-2 flex-wrap mb-3">
                                            <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${isOk ? 'text-emerald-400' : 'text-red-400'}`}>
                                                <span className={`w-2 h-2 rounded-full ${isOk ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                                {isOk ? 'Executed' : 'Failed'}
                                            </span>

                                            {recentCommand.action && (
                                                <span className={`px-2.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${actionColors[recentCommand.action] || 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                                                    {recentCommand.action.replace(/_/g, ' ')}
                                                </span>
                                            )}

                                            {recentCommand.amount && (
                                                <span className="px-2.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-300">
                                                    ₹{recentCommand.amount}
                                                </span>
                                            )}

                                            {recentCommand.username && (
                                                <span className="px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-300">
                                                    @{recentCommand.username}
                                                </span>
                                            )}

                                            <span className="ml-auto text-[10px] text-slate-500 font-bold">{timeLabel}</span>
                                        </div>

                                        {/* Transcript */}
                                        <p className="text-[12px] text-slate-300 italic leading-relaxed">
                                            "{recentCommand.transcript}"
                                        </p>

                                        {/* Error message if failed */}
                                        {recentCommand.error && (
                                            <p className="text-[11px] text-red-400 mt-2 font-medium">
                                                {recentCommand.error}
                                            </p>
                                        )}
                                    </div>
                                );
                            })() : (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                        <Mic className="w-7 h-7 text-slate-700" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-black uppercase tracking-widest text-sm">No Commands Yet</p>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tight mt-1.5">
                                            Execute a voice command to see results here
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Confirmation Dialog ── */}
            <ConfirmationDialog
                data={confirmData}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                loading={confirmLoading}
            />

            {/* ── Toast ── */}
            {toast && (
                <Toast
                    key={toast.key}
                    message={toast.message}
                    type={toast.type}
                    onClose={dismissToast}
                />
            )}

            {/* ── Keyframes ── */}
            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateY(10px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0)   scale(1);    }
                }
                @keyframes voiceWave {
                    from { transform: scaleY(0.25); }
                    to   { transform: scaleY(1);    }
                }
            `}</style>
        </div>
    );
};

export default VoiceModulationPage;
