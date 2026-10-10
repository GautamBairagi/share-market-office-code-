/**
 * useVoiceRecorder – MediaRecorder hook
 *
 * States: idle | recording | processing | completed | error
 * Handles permission, recording, auto-stop, blob creation, URL management,
 * and full cleanup on unmount. No backend calls are made here.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_DURATION_SECONDS = 60;

export const RECORDER_STATES = {
    IDLE: 'idle',
    RECORDING: 'recording',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    ERROR: 'error',
};

const useVoiceRecorder = () => {
    const [state, setState] = useState(RECORDER_STATES.IDLE);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioURL, setAudioURL] = useState('');

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const autoStopRef = useRef(null);
    const silenceRef = useRef(null);       // silence detection interval
    const audioCtxRef = useRef(null);
    const blobURLRef = useRef('');

    // ── Helpers ──────────────────────────────────────────────────────────────

    const _stopTracks = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const _clearTimers = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
        if (silenceRef.current) { clearInterval(silenceRef.current); silenceRef.current = null; }
        if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    };

    const _revokeURL = () => {
        if (blobURLRef.current) {
            URL.revokeObjectURL(blobURLRef.current);
            blobURLRef.current = '';
        }
    };

    const _setError = (msg) => {
        _clearTimers();
        _stopTracks();
        setElapsedSeconds(0);
        setErrorMessage(msg);
        setState(RECORDER_STATES.ERROR);
    };

    // ── Start Recording ───────────────────────────────────────────────────────

    const startRecording = useCallback(async () => {
        if (state !== RECORDER_STATES.IDLE && state !== RECORDER_STATES.ERROR && state !== RECORDER_STATES.COMPLETED) return;

        _revokeURL();
        setAudioBlob(null);
        setAudioURL('');
        setElapsedSeconds(0);
        setErrorMessage('');
        chunksRef.current = [];

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            _setError('Microphone permission denied. Please allow access and try again.');
            return;
        }

        streamRef.current = stream;

        let recorder;
        try {
            recorder = new MediaRecorder(stream);
        } catch {
            _stopTracks();
            _setError('Recording is not supported on this device or browser.');
            return;
        }

        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onerror = () => {
            _setError('Recording failed unexpectedly. Please try again.');
        };

        recorder.onstop = () => {
            _clearTimers();
            _stopTracks();
            setState(RECORDER_STATES.PROCESSING);

            try {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                blobURLRef.current = url;
                setAudioBlob(blob);
                setAudioURL(url);
                setState(RECORDER_STATES.COMPLETED);
            } catch {
                _setError('Failed to process the recording. Please try again.');
            }
        };

        recorder.start(250); // collect data every 250ms
        setState(RECORDER_STATES.RECORDING);

        // Elapsed timer
        timerRef.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);

        // Auto-stop at MAX_DURATION_SECONDS
        autoStopRef.current = setTimeout(() => {
            stopRecording();
        }, MAX_DURATION_SECONDS * 1000);

        // ── Silence detection: auto-stop after 3s of silence once speech was detected ──
        try {
            const actx = new (window.AudioContext || window.webkitAudioContext)();
            audioCtxRef.current = actx;
            const source = actx.createMediaStreamSource(stream);
            const analyser = actx.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            const dataArr = new Uint8Array(analyser.frequencyBinCount);

            let speechDetected = false;
            let silentSince = 0;
            const SILENCE_THRESHOLD = 15;   // volume level below which is "silence"
            const SILENCE_DURATION = 3000;  // 3 seconds of silence to auto-stop

            silenceRef.current = setInterval(() => {
                analyser.getByteFrequencyData(dataArr);
                const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;

                if (avg > SILENCE_THRESHOLD) {
                    speechDetected = true;
                    silentSince = 0;
                } else if (speechDetected) {
                    silentSince += 200;
                    if (silentSince >= SILENCE_DURATION) {
                        stopRecording();
                    }
                }
            }, 200);
        } catch {
            // AudioContext not supported — silence detection disabled, manual stop still works
        }

    }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Stop Recording ────────────────────────────────────────────────────────

    const stopRecording = useCallback(() => {
        _clearTimers();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try { mediaRecorderRef.current.stop(); } catch { /* already stopped */ }
        } else {
            _stopTracks();
        }
    }, []);

    // ── Reset ─────────────────────────────────────────────────────────────────

    const reset = useCallback(() => {
        _clearTimers();
        _stopTracks();
        _revokeURL();
        chunksRef.current = [];
        setAudioBlob(null);
        setAudioURL('');
        setElapsedSeconds(0);
        setErrorMessage('');
        setState(RECORDER_STATES.IDLE);
    }, []);

    // ── Cleanup on unmount ────────────────────────────────────────────────────

    useEffect(() => {
        return () => {
            _clearTimers();
            _stopTracks();
            _revokeURL();
        };
    }, []);

    // ── Timer formatter ───────────────────────────────────────────────────────

    const formatTimer = (secs) => {
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    return {
        state,
        elapsedSeconds,
        timerLabel: formatTimer(elapsedSeconds),
        maxSeconds: MAX_DURATION_SECONDS,
        progressPercent: Math.min((elapsedSeconds / MAX_DURATION_SECONDS) * 100, 100),
        errorMessage,
        audioBlob,
        audioURL,
        startRecording,
        stopRecording,
        reset,
        isIdle: state === RECORDER_STATES.IDLE,
        isRecording: state === RECORDER_STATES.RECORDING,
        isProcessing: state === RECORDER_STATES.PROCESSING,
        isCompleted: state === RECORDER_STATES.COMPLETED,
        isError: state === RECORDER_STATES.ERROR,
    };
};

export default useVoiceRecorder;
