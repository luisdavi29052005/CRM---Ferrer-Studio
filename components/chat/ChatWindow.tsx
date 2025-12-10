// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Search, Video, ArrowLeft, Check, CheckCheck, FileText, Lock, Bot, AlertTriangle, ImagePlus } from 'lucide-react';
import { WahaChat, WahaMessage } from '../../types/waha';
import { Lead } from '../../types';
import { motion } from 'framer-motion';
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
    onSendMedia: (file: File, type: 'image' | 'video' | 'audio' | 'file') => void;
    isSending?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    activeChat,
    messages,
    onToggleContactInfo,
    onBack,
    profilePic,
    presence,
    onSendMessage,
    onSendMedia,
    isSending = false
}) => {
    const { t } = useTranslation();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

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
        <div className="flex flex-col h-full w-full flex-1 bg-[#09090b] relative">
            {/* Header - Matching System Style */}
            <div className="flex items-center justify-between px-6 h-[70px] border-b border-white/5 bg-[#09090b] z-10 shrink-0">
                <div className="flex items-center gap-4 overflow-hidden">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    )}

                    <div
                        className="relative cursor-pointer group shrink-0"
                        onClick={onToggleContactInfo}
                    >
                        <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 font-bold text-sm border border-white/5 overflow-hidden">
                            {profilePic ? (
                                <img
                                    src={profilePic}
                                    alt={activeChat.push_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span>{(activeChat.push_name || '?').substring(0, 1).toUpperCase()}</span>
                            )}
                        </div>
                    </div>

                    <div
                        className="flex flex-col justify-center cursor-pointer overflow-hidden"
                        onClick={onToggleContactInfo}
                    >
                        <h3 className="text-zinc-100 font-bold text-sm tracking-wide truncate">
                            {activeChat.lead?.name || activeChat.push_name || activeChat.id}
                        </h3>
                        <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider truncate mt-0.5">
                            {presence === 'online' ? 'Online' : activeChat.lead?.business || 'Offline'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors">
                        <Video size={18} />
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors">
                        <Search size={18} />
                    </button>
                    <button
                        onClick={onToggleContactInfo}
                        className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            {/* NEEDS_EDIT Banner */}
            {activeChat.lead?.status === 'NEEDS_EDIT' && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500 animate-pulse">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="text-amber-500 font-bold text-sm">Atenção Necessária</h4>
                            <p className="text-amber-500/80 text-xs">A IA pausou este chat aguardando edição de imagem.</p>
                        </div>
                    </div>
                    <div>
                        <input
                            type="file"
                            id="handoff-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    onSendMedia(file, 'image');
                                    // Optional: We might want to clear the input value so same file can be selected again
                                    e.target.value = '';
                                }
                            }}
                        />
                        <button
                            onClick={() => document.getElementById('handoff-upload')?.click()}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
                        >
                            <ImagePlus size={14} /> Upload Edição
                        </button>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-4 bg-[#09090b]"
                onScroll={handleScroll}
            >
                {/* Encryption Notice */}
                <div className="flex justify-center mb-8">
                    <div className="bg-zinc-900/50 border border-white/5 text-zinc-500 text-[10px] px-4 py-2 rounded-lg flex items-center gap-2 select-none">
                        <Lock size={10} />
                        <span className="font-medium uppercase tracking-wide">Mensagens protegidas com criptografia de ponta a ponta</span>
                    </div>
                </div>

                {/* Date Separator */}
                <div className="flex items-center justify-center my-6">
                    <div className="h-px bg-white/5 w-full max-w-[100px]"></div>
                    <span className="mx-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Hoje</span>
                    <div className="h-px bg-white/5 w-full max-w-[100px]"></div>
                </div>

                {messages.map((msg, index) => {
                    const me = isMe(msg);

                    return (
                        <ContextMenu.Root key={msg.id || index}>
                            <ContextMenu.Trigger>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex w-full ${me ? 'justify-end' : 'justify-start'} group relative mb-2`}
                                >
                                    {/* Message Bubble */}
                                    <div
                                        className={`relative max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${me
                                            ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20 rounded-tr-sm'
                                            : 'bg-zinc-900 text-zinc-300 border border-white/5 rounded-tl-sm'
                                            }`}
                                    >
                                        {/* AI Badge */}
                                        {msg.isAiGenerated && (
                                            <div className="absolute -top-3 left-4 bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-md shadow-sm">
                                                <Bot size={10} /> {msg.agentName || 'AI'}
                                            </div>
                                        )}
                                        {/* Content */}
                                        <div className="whitespace-pre-wrap break-words">
                                            {msg.mediaUrl && (
                                                <div className="mb-2 rounded-lg overflow-hidden border border-white/5">
                                                    {msg.mediaType === 'image' && (
                                                        <img src={msg.mediaUrl} alt="Media" className="max-w-full max-h-[300px] object-cover" />
                                                    )}
                                                    {msg.mediaType === 'video' && (
                                                        <video src={msg.mediaUrl} controls className="max-w-full max-h-[300px]" />
                                                    )}
                                                    {msg.mediaType === 'audio' && (
                                                        <audio src={msg.mediaUrl} controls className="w-full min-w-[240px]" />
                                                    )}
                                                    {msg.mediaType === 'file' && (
                                                        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/20 hover:bg-black/30 transition-colors">
                                                            <FileText size={16} className="text-zinc-400" />
                                                            <span className="text-xs font-medium underline">Baixar Arquivo</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {msg.body}
                                        </div>

                                        {/* Metadata */}
                                        <div className={`flex items-center justify-end gap-1 mt-1 select-none ${me ? 'text-emerald-500/60' : 'text-zinc-600'}`}>
                                            <span className="text-[10px] font-medium">
                                                {formatMessageTime(msg.timestamp)}
                                            </span>
                                            {me && (
                                                <span className="ml-0.5">
                                                    {msg.ack >= 3 ? (
                                                        <CheckCheck size={12} className="text-emerald-500" />
                                                    ) : msg.ack >= 2 ? (
                                                        <CheckCheck size={12} />
                                                    ) : (
                                                        <Check size={12} />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </ContextMenu.Trigger>
                        </ContextMenu.Root>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <ChatInput onSendMessage={onSendMessage} onSendMedia={onSendMedia} isSending={isSending} />
        </div>
    );
};
