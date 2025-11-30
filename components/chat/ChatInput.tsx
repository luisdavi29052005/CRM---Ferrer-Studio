// @ts-nocheck
import React, { useState, useRef } from 'react';
import { Paperclip, Send, Smile, Mic, Image, Video, File, User, MapPin, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    onSendMedia: (file: File, type: 'image' | 'video' | 'audio' | 'file') => void;
    onTyping?: (isTyping: boolean) => void;
    isSending: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onSendMedia, onTyping, isSending }) => {
    const [text, setText] = useState('');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);

        if (onTyping) {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            } else {
                onTyping(true);
            }

            typingTimeoutRef.current = setTimeout(() => {
                onTyping(false);
                typingTimeoutRef.current = null;
            }, 2000);
        }
    };

    const handleSend = () => {
        if (text.trim()) {
            onSendMessage(text);
            setText('');
            if (onTyping) onTyping(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const type = file.type.startsWith('image/') ? 'image' :
                file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'audio' : 'file';
            onSendMedia(file, type);
            setShowAttachMenu(false);
        }
    };

    return (
        <div className="p-4 bg-zinc-900/50 border-t border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-end gap-2 max-w-4xl mx-auto relative">
                {/* Attachment Menu */}
                <AnimatePresence>
                    {showAttachMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-14 left-0 bg-zinc-800 rounded-xl shadow-xl border border-zinc-700/50 p-2 grid grid-cols-3 gap-2 mb-2 z-20"
                        >
                            {[
                                { icon: Image, label: 'Image', color: 'text-purple-400', bg: 'bg-purple-400/10', accept: 'image/*' },
                                { icon: File, label: 'Document', color: 'text-blue-400', bg: 'bg-blue-400/10', accept: '*' },
                                { icon: User, label: 'Contact', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                                { icon: MapPin, label: 'Location', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                                { icon: BarChart2, label: 'Poll', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
                            ].map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (item.accept && fileInputRef.current) {
                                            fileInputRef.current.accept = item.accept;
                                            fileInputRef.current.click();
                                        }
                                    }}
                                    className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-zinc-700/50 transition-colors gap-1 group"
                                >
                                    <div className={`p-2 rounded-full ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-medium">{item.label}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />

                <button
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className={`p-3 rounded-full transition-all duration-200 ${showAttachMenu ? 'bg-zinc-700 text-white rotate-45' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                >
                    <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 focus-within:border-emerald-500/50 focus-within:bg-zinc-800 transition-all duration-200 flex items-end">
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 px-4 py-3 min-h-[44px] max-h-[120px] resize-none focus:outline-none custom-scrollbar"
                        rows={1}
                    />
                    <button className="p-3 text-zinc-400 hover:text-yellow-400 transition-colors">
                        <Smile className="w-5 h-5" />
                    </button>
                </div>

                {text.trim() ? (
                    <button
                        onClick={handleSend}
                        disabled={isSending}
                        className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                ) : (
                    <button className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all duration-200">
                        <Mic className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};
