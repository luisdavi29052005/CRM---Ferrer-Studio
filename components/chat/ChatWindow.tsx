// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Search, Phone, Video, ArrowLeft, Check, CheckCheck, BrainCircuit, FileText, Reply, Smile, Trash2, Copy } from 'lucide-react';
import { WahaChat, WahaMessage } from '../../types/waha';
import { Lead } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { ChatInput } from './ChatInput';

interface ChatWindowProps {
    activeChat: WahaChat & { lead?: Lead };
    messages: WahaMessage[];
    onToggleContactInfo: () => void;
    onBack?: () => void;
    profilePic?: string;
    presence?: 'online' | 'offline' | 'unknown';
    currentUserId?: string;
    onSendMessage: (text: string, file?: File) => Promise<void>;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    activeChat,
    messages,
    onToggleContactInfo,
    onBack,
    profilePic,
    presence,
    currentUserId,
    onSendMessage
}) => {
    const { t } = useTranslation();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    // Handle scroll events to determine if we should auto-scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShouldScrollToBottom(isNearBottom);
    };

    useEffect(() => {
        if (shouldScrollToBottom) {
            scrollToBottom();
        }
    }, [messages, shouldScrollToBottom]);

    const formatMessageTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isMe = (message: WahaMessage) => {
        return message.fromMe;
    };

    return (
        <div className="flex flex-col h-full bg-[#0b141a] relative">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#202c33] border-b border-white/5 z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    )}

                    <div
                        className="relative cursor-pointer group"
                        onClick={onToggleContactInfo}
                    >
                        {profilePic ? (
                            <img
                                src={profilePic}
                                alt={activeChat.push_name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-sm">
                                {(activeChat.push_name || '?').substring(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div
                        className="flex flex-col cursor-pointer"
                        onClick={onToggleContactInfo}
                    >
                        <h3 className="text-zinc-100 font-normal text-base truncate max-w-[200px]">
                            {activeChat.lead?.name || activeChat.push_name || activeChat.id}
                        </h3>
                        <span className="text-xs text-zinc-400">
                            {presence === 'online' ? (
                                'online'
                            ) : presence === 'offline' ? (
                                ''
                            ) : (
                                activeChat.lead?.business || 'click here for contact info'
                            )}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full">
                        <Video size={20} strokeWidth={1.5} />
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full">
                        <Search size={20} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={onToggleContactInfo}
                        className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full"
                    >
                        <MoreVertical size={20} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1 bg-[url('https://waha.devserver.cn/assets/bg-chat-tile-dark.png')] bg-repeat bg-[length:400px_400px] bg-fixed"
                onScroll={handleScroll}
            >
                <div className="flex justify-center my-4">
                    <span className="bg-[#182229] text-zinc-300 text-xs px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-wide">
                        Today
                    </span>
                </div>

                {messages.map((msg, index) => {
                    const me = isMe(msg);

                    return (
                        <ContextMenu.Root key={msg.id || index}>
                            <ContextMenu.Trigger>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex w-full ${me ? 'justify-end' : 'justify-start'} group relative mb-1`}
                                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                                    onMouseLeave={() => setHoveredMessageId(null)}
                                >
                                    {/* Message Bubble */}
                                    <div
                                        className={`relative max-w-[75%] md:max-w-[60%] px-2 py-1.5 rounded-lg shadow-sm text-sm leading-relaxed ${me
                                            ? 'bg-[#005c4b] text-white rounded-tr-none'
                                            : 'bg-[#202c33] text-zinc-200 rounded-tl-none'
                                            }`}
                                    >
                                        {/* Reply Context (Mock) */}
                                        {msg.replyTo && (
                                            <div className={`mb-1 p-1 rounded-md text-xs border-l-4 ${me ? 'bg-[#025144] border-[#00a884]' : 'bg-[#1d282f] border-[#00a884]'}`}>
                                                <p className="font-bold opacity-80 mb-0.5 text-[#00a884]">Replying to...</p>
                                                <p className="truncate opacity-70">Original message content...</p>
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="whitespace-pre-wrap break-words px-1">
                                            {msg.mediaUrl && (
                                                <div className="mb-1">
                                                    {msg.mediaType === 'image' && (
                                                        <img src={msg.mediaUrl} alt="Shared image" className="rounded-lg max-w-full max-h-[300px] object-cover" />
                                                    )}
                                                    {msg.mediaType === 'video' && (
                                                        <video src={msg.mediaUrl} controls className="rounded-lg max-w-full max-h-[300px]" />
                                                    )}
                                                    {msg.mediaType === 'audio' && (
                                                        <audio src={msg.mediaUrl} controls className="w-full min-w-[240px]" />
                                                    )}
                                                    {msg.mediaType === 'file' && (
                                                        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                                                            <FileText size={16} className="text-zinc-400" />
                                                            <span className="text-xs font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-2">Download File</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {msg.body}
                                        </div>

                                        {/* Metadata */}
                                        <div className={`flex items-center justify-end gap-1 select-none ${me ? 'text-emerald-100/70' : 'text-zinc-500'} -mb-1 mr-1`}>
                                            <span className="text-[11px] min-w-fit">
                                                {formatMessageTime(msg.timestamp)}
                                            </span>
                                            {me && (
                                                <span className="ml-0.5">
                                                    {msg.ack >= 3 ? (
                                                        <CheckCheck size={16} className="text-[#53bdeb]" />
                                                    ) : msg.ack >= 2 ? (
                                                        <CheckCheck size={16} />
                                                    ) : (
                                                        <Check size={16} />
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        {/* Quick Actions Overlay */}
                                        {hoveredMessageId === msg.id && (
                                            <div className={`absolute top-0 ${me ? '-left-20' : '-right-20'} h-full flex items-center gap-1 px-2 animate-in fade-in duration-200`}>
                                                <button className="text-zinc-400 hover:text-white transition-colors">
                                                    <Smile size={16} strokeWidth={1.5} />
                                                </button>
                                                <button className="text-zinc-400 hover:text-white transition-colors">
                                                    <Reply size={16} strokeWidth={1.5} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </ContextMenu.Trigger>

                            {/* Context Menu */}
                            <ContextMenu.Portal>
                                <ContextMenu.Content className="min-w-[180px] bg-[#1a1a1a] rounded-xl border border-white/10 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <ContextMenu.Item className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-200 hover:bg-white/5 rounded-lg cursor-pointer outline-none">
                                        <Reply size={14} /> Reply
                                    </ContextMenu.Item>
                                    <ContextMenu.Item className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-200 hover:bg-white/5 rounded-lg cursor-pointer outline-none">
                                        <Copy size={14} /> Copy
                                    </ContextMenu.Item>
                                    <ContextMenu.Item className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-200 hover:bg-white/5 rounded-lg cursor-pointer outline-none">
                                        <BrainCircuit size={14} /> AI Reply
                                    </ContextMenu.Item>
                                    <ContextMenu.Separator className="h-px bg-white/10 my-1" />
                                    <ContextMenu.Item className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer outline-none">
                                        <Trash2 size={14} /> Delete
                                    </ContextMenu.Item>
                                </ContextMenu.Content>
                            </ContextMenu.Portal>
                        </ContextMenu.Root>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <ChatInput onSendMessage={onSendMessage} />
        </div>
    );
};
