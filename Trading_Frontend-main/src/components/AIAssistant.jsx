/**
 * AIAssistant Component
 *
 * Voice + Text AI Assistant
 * - Voice-to-text using Web Speech API
 * - Real-time transcription display
 * - Chat history with messages
 * - Manual text input support
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, MessageCircle, Loader2, AlertCircle, X } from 'lucide-react';
import useAIChat from '../hooks/useAIChat';
import useVoiceSearch from '../hooks/useVoiceSearch';
  
const AIAssistant = () => {
    const { messages, isLoading, error, sendMessage, clearError } = useAIChat();
    const [input, setInput] = useState('');
    const [transcript, setTranscript] = useState('');
    const messagesEndRef = useRef(null);

    const { isListening, error: voiceError, startListening, stopListening, clearError: clearVoiceError } = useVoiceSearch({
        onTranscript: (t) => {
            setTranscript(t);
            setInput(t);
        }
    });

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            await sendMessage(input.trim());
            setInput('');
            setTranscript('');
        }
    };

    const toggleVoiceInput = () => {
        if (isListening) {
            stopListening();
        } else {
            clearVoiceError();
            startListening();
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#1f283e]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-[#1a1f2e]/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <div>
                        <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
                        <p className="text-xs text-slate-400">Voice & text powered by AI</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                        <div>
                            <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">Start a conversation with the AI assistant</p>
                            <p className="text-slate-500 text-xs mt-2">Use voice or type your question</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${msg.role === 'user'
                                        ? 'bg-green-500/20 border border-green-500/30 text-green-50'
                                        : 'bg-white/5 border border-white/10 text-slate-100'
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                    <p className="text-xs opacity-50 mt-1">
                                        {msg.timestamp.toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                                    <span className="text-sm text-slate-300">AI is thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Error Messages */}
            {(error || voiceError) && (
                <div className="mx-6 mb-4 flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-red-300">{error || voiceError}</p>
                    </div>
                    <button
                        onClick={() => {
                            clearError();
                            clearVoiceError();
                        }}
                        className="text-red-400 hover:text-red-300 flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Live Transcript Display */}
            {transcript && (
                <div className="mx-6 mb-4 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-300 font-medium mb-1">Listening...</p>
                    <p className="text-sm text-green-100">{transcript}</p>
                </div>
            )}

            {/* Input Area */}
            <div className="px-6 py-4 border-t border-white/10 bg-[#1a1f2e]/50 backdrop-blur-sm">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                    {/* Voice Button */}
                    <button
                        type="button"
                        onClick={toggleVoiceInput}
                        disabled={isLoading}
                        title={isListening ? 'Stop listening' : 'Start listening'}
                        className={`flex-shrink-0 p-3 rounded-lg border transition-all duration-200 ${isListening
                            ? 'bg-red-500/20 border-red-500/40 text-red-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/25'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isListening ? (
                            <MicOff className="w-5 h-5" />
                        ) : (
                            <Mic className="w-5 h-5" />
                        )}
                    </button>

                    {/* Text Input */}
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type or speak your question..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        title="Send message"
                        className="flex-shrink-0 p-3 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>

                {/* Info Text */}
                <p className="text-xs text-slate-500 mt-2 px-1">
                    💡 Tip: Click the microphone icon to speak, or type your question directly
                </p>
            </div>
        </div>
    );
};

export default AIAssistant;
