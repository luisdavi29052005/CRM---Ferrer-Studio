// @ts-nocheck
import React, { useState, useRef } from 'react';
import { Plus, Send, Smile, Mic, Image, Video, File, User, MapPin, BarChart2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    onSendMedia: (file: File, type: 'image' | 'video' | 'audio' | 'file') => void;
    onTyping?: (isTyping: boolean) => void;
    isSending: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onSendMedia, onTyping, isSending }) => {
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);

        // Auto-resize
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }

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
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
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

    const onEmojiClick = (emojiData: any) => {
        setText((prev) => prev + emojiData.emoji);
        if (onTyping) onTyping(true);
    };

    return (
        <footer className="w-full p-3 bg-[#09090b] z-20">
            <div className="w-full mx-auto bg-zinc-900 rounded-lg flex items-end p-1.5 gap-1">
                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {/* Attach Button */}
                <div className="mb-0.5 shrink-0">
                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <button className="p-2 text-zinc-400 hover:text-zinc-300 transition-colors rounded-full hover:bg-zinc-800">
                                <Plus size={24} strokeWidth={1.5} />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content className="bg-zinc-900 rounded-xl border border-zinc-800 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 mb-4 ml-4" sideOffset={5} align="start">
                                <div className="grid grid-cols-1 gap-1 w-40">
                                    {[
                                        { icon: Image, label: 'Photos & Videos', color: 'text-purple-400', bg: 'hover:bg-zinc-800', accept: 'image/*,video/*' },
                                        { icon: File, label: 'Document', color: 'text-blue-400', bg: 'hover:bg-zinc-800', accept: '*' },
                                        { icon: User, label: 'Contact', color: 'text-emerald-400', bg: 'hover:bg-zinc-800' },
                                        { icon: BarChart2, label: 'Poll', color: 'text-yellow-400', bg: 'hover:bg-zinc-800' },
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
                </div>

                {/* Emoji Button */}
                <Popover.Root open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <Popover.Trigger asChild>
                        <button className="p-2 text-zinc-400 hover:text-zinc-300 transition-colors mb-0.5 shrink-0 rounded-full hover:bg-zinc-800">
                            <Smile size={24} strokeWidth={1.5} />
                        </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content className="z-50 mb-4" sideOffset={10} align="start">
                            <EmojiPicker
                                theme={Theme.DARK}
                                onEmojiClick={onEmojiClick}
                                lazyLoadEmojis={true}
                            />
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>

                {/* Text Area */}
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-zinc-200 placeholder:text-zinc-500 resize-none py-2 px-2 text-[15px] custom-scrollbar leading-relaxed"
                    rows={1}
                    style={{
                        minHeight: '1.47em',
                        maxHeight: '11.76em',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}
                />

                {/* Send / Mic Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={text.trim() ? handleSend : undefined}
                    disabled={isSending}
                    className={`p-2 rounded-full flex items-center justify-center transition-all ${text.trim()
                        ? 'text-emerald-500 hover:bg-zinc-800'
                        : 'text-zinc-400 hover:bg-zinc-800'
                        } mb-0.5 shrink-0`}
                >
                    <AnimatePresence mode='wait'>
                        {text.trim() ? (
                            <motion.div
                                key="send"
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 45 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                                <Send size={24} className={isSending ? 'opacity-50' : ''} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="mic"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                                <Mic size={24} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </footer>
    );
};
