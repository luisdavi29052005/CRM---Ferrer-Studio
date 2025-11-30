// @ts-nocheck
import React, { useState, useRef } from 'react';
import { Plus, Send, Smile, Mic, Image, Video, File, User, MapPin, BarChart2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    onSendMedia: (file: File, type: 'image' | 'video' | 'audio' | 'file') => void;
    onTyping?: (isTyping: boolean) => void;
    isSending: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onSendMedia, onTyping, isSending }) => {
    const [text, setText] = useState('');
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
        }
    };

    return (
        <div className="p-2 bg-[#202c33] border-t border-white/5 relative z-20">
            <div className="flex items-end gap-2 max-w-5xl mx-auto">
                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />

                <div className="flex items-center gap-1 mb-1">
                    {/* Attach Button with Popover (Plus Icon) */}
                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                                <Plus size={24} strokeWidth={1.5} />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content className="bg-[#233138] rounded-xl border border-white/5 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 mb-4 ml-4" sideOffset={5} align="start">
                                <div className="grid grid-cols-1 gap-1 w-40">
                                    {[
                                        { icon: Image, label: 'Photos & Videos', color: 'text-purple-400', bg: 'hover:bg-white/5', accept: 'image/*,video/*' },
                                        { icon: File, label: 'Document', color: 'text-blue-400', bg: 'hover:bg-white/5', accept: '*' },
                                        { icon: User, label: 'Contact', color: 'text-emerald-400', bg: 'hover:bg-white/5' },
                                        { icon: BarChart2, label: 'Poll', color: 'text-yellow-400', bg: 'hover:bg-white/5' },
                                    ].map((item, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                if (item.accept && fileInputRef.current) {
                                                    fileInputRef.current.accept = item.accept;
                                                    fileInputRef.current.click();
                                                }
                                            }}
                                            className={`flex items-center w-full p-2 rounded-lg transition-colors gap-3 ${item.bg}`}
                                        >
                                            <item.icon className={`w-5 h-5 ${item.color}`} />
                                            <span className="text-sm text-zinc-200">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>

                    {/* Emoji Button */}
                    <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <Smile size={24} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Input Area */}
                <div className="flex-1 bg-[#2a3942] rounded-lg transition-all flex items-end p-1.5 min-h-[42px] mb-0.5">
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-200 placeholder:text-zinc-400 resize-none max-h-32 py-1 px-3 text-[15px] custom-scrollbar leading-relaxed"
                        rows={1}
                        style={{ minHeight: '24px' }}
                    />
                </div>

                {/* Send / Mic Button */}
                <button
                    onClick={text.trim() ? handleSend : undefined}
                    disabled={isSending}
                    className={`p-3 rounded-full flex items-center justify-center transition-all ${text.trim()
                        ? 'text-emerald-500 hover:bg-zinc-800'
                        : 'text-zinc-400 hover:bg-zinc-800'
                        } mb-0.5`}
                >
                    {text.trim() ? (
                        <Send size={24} className={isSending ? 'opacity-50' : ''} />
                    ) : (
                        <Mic size={24} />
                    )}
                </button>
            </div>
        </div>
    );
};
