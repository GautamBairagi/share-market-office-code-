/**
 * useVoiceSearch Hook
 *
 * Uses browser's Web Speech API to record voice, transcribe it,
 * and return the transcript for search.
 * Supports both Hindi and English.
 *
 * Fallback: on devices without SpeechRecognition (iOS Safari),
 * records audio via MediaRecorder and sends to Whisper API for transcription.
 */

import { useState, useRef, useCallback } from 'react';
import api from '../utils/api';

const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
const hasMediaRecorder = typeof MediaRecorder !== 'undefined';

export const useVoiceSearch = ({ onTranscript }) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    // Voice is supported if either SpeechRecognition or MediaRecorder is available
    const isSupported = hasSpeechRecognition || hasMediaRecorder;

    const startListening = useCallback(async () => {
        setError(null);

        // ── Path A: SpeechRecognition (Android Chrome, desktop) ──
        if (hasSpeechRecognition) {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SR();
            recognition.lang = 'hi-IN';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            recognition.continuous = false;

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (e) => {
                setIsListening(false);
                if (e.error === 'no-speech') {
                    setError('No speech detected. Please try again.');
                } else if (e.error === 'not-allowed') {
                    setError('Microphone access denied. Please allow mic permission.');
                } else {
                    setError(`Voice error: ${e.error}`);
                }
            };

            recognition.onresult = (e) => {
                const transcript = e.results[0][0].transcript;
                onTranscript(transcript);
            };

            recognitionRef.current = recognition;
            recognition.start();
            return;
        }

        // ── Path B: MediaRecorder + Whisper API (iOS Safari fallback) ──
        if (hasMediaRecorder) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                chunksRef.current = [];

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
                };

                recorder.onstop = async () => {
                    stream.getTracks().forEach(t => t.stop());
                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    chunksRef.current = [];

                    // Send to Whisper for transcription
                    try {
                        const formData = new FormData();
                        formData.append('audio', blob, 'search_audio.webm');
                        const res = await api.post('/ai/transcribe-voice', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        const transcript = (res.data.transcript || '').trim();
                        if (transcript) {
                            onTranscript(transcript);
                        } else {
                            setError('No speech detected. Please try again.');
                        }
                    } catch {
                        setError('Transcription failed. Please try typing instead.');
                    }
                    setIsListening(false);
                };

                recorder.onerror = () => {
                    stream.getTracks().forEach(t => t.stop());
                    setIsListening(false);
                    setError('Recording failed. Please try again.');
                };

                mediaRecorderRef.current = recorder;
                recorder.start();
                setIsListening(true);

                // Auto-stop after 8 seconds (search queries are short)
                setTimeout(() => {
                    if (mediaRecorderRef.current?.state === 'recording') {
                        mediaRecorderRef.current.stop();
                    }
                }, 8000);
            } catch (permErr) {
                setIsListening(false);
                setError(permErr.name === 'NotAllowedError'
                    ? 'Microphone access denied. Please allow mic permission.'
                    : 'Could not access microphone.');
            }
            return;
        }

        setError('Voice search is not supported on this device.');
    }, [onTranscript]);

    const stopListening = useCallback(() => {
        // Stop SpeechRecognition
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
            recognitionRef.current = null;
        }
        // Stop MediaRecorder (triggers onstop → Whisper transcription)
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsListening(false);
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return { isListening, error, isSupported, startListening, stopListening, clearError };
};

export default useVoiceSearch;
