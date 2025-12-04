// @ts-nocheck
import React, { useState, useRef } from 'react';
import { Plus, Send, Smile, Mic, Image, Video, File, User, BarChart2 } from 'lucide-react';
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
        <footer className="w-full p-4 bg-[#09090b] border-t border-white/5 z-20">
            <div className="w-full mx-auto bg-zinc-900/50 border border-white/5 rounded-xl flex items-end p-2 gap-2 transition-colors focus-within:border-bronze-500/50 focus-within:bg-zinc-900">
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
                            <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-white/5">
                                <Plus size={20} strokeWidth={2} />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content className="bg-[#09090b] rounded-xl border border-white/10 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 mb-4 ml-4" sideOffset={5} align="start">
                                <div className="grid grid-cols-1 gap-1 w-40">
                                    {[
                                        { icon: Image, label: 'Fotos e Vídeos', color: 'text-purple-400', bg: 'hover:bg-white/5', accept: 'image/*,video/*' },
                                        { icon: File, label: 'Documento', color: 'text-blue-400', bg: 'hover:bg-white/5', accept: '*' },
                                        { icon: User, label: 'Contato', color: 'text-emerald-400', bg: 'hover:bg-white/5' },
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
                                            <item.icon className={`w-4 h-4 ${item.color}`} />
                                            <span className="text-xs font-medium text-zinc-300">{item.label}</span>
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
                        <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-0.5 shrink-0 rounded-lg hover:bg-white/5">
                            <Smile size={20} strokeWidth={2} />
                        </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content className="z-50 mb-4" sideOffset={10} align="start">
                            <EmojiPicker
                                theme={Theme.DARK}
                                onEmojiClick={onEmojiClick}
                                lazyLoadEmojis={true}
                                width={300}
                                height={400}
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
                    placeholder="Digite uma mensagem..."
                    className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-zinc-200 placeholder:text-zinc-600 resize-none py-2.5 px-2 text-sm custom-scrollbar leading-relaxed"
                    rows={1}
                    style={{
                        minHeight: '44px',
                        maxHeight: '150px',
                    }}
                />

                {/* Send / Mic Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={text.trim() ? handleSend : undefined}
                    disabled={isSending}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${text.trim()
                        ? 'text-bronze-500 hover:bg-bronze-500/10'
                        : 'text-zinc-500 hover:bg-white/5'
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
                                <Send size={20} className={isSending ? 'opacity-50' : ''} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="mic"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                                <Mic size={20} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </footer>
    );
};
