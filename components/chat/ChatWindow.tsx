import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Search, Phone, Video, ArrowLeft, Check, CheckCheck, BrainCircuit, FileText, Clock, Paperclip, Mic, Smile } from 'lucide-react';
import { WahaChat, Message, Lead } from '../../types';

interface ChatWindowProps {
    activeChat: WahaChat & { lead?: Lead };
    messages: Message[];
    onToggleContactInfo: () => void;
    onBack?: () => void;
    onBack?: () => void;
    profilePic?: string;
    presence?: 'online' | 'offline' | 'unknown';
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ activeChat, messages, onToggleContactInfo, onBack, profilePic, presence }) => {
    const { t } = useTranslation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatMessageTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Group messages by date
    const groupedMessages = messages.reduce((acc, message) => {
        const date = new Date(message.timestamp).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(message);
        return acc;
    }, {} as Record<string, Message[]>);

    return (
        <div className="flex flex-col h-full bg-[#0B0B0B] relative">
            {/* Header - System Style */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0F0F0F] z-10">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                    )}

                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 border border-white/5 overflow-hidden">
                        {profilePic || activeChat.lead?.avatar_url ? (
                            <img src={profilePic || activeChat.lead?.avatar_url} alt={activeChat.push_name} className="w-full h-full object-cover" />
                        ) : (
                            <span>{activeChat.push_name?.charAt(0)}</span>
                        )}
                    </div>

                    <div className="cursor-pointer" onClick={onToggleContactInfo}>
                        <h3 className="text-base font-bold text-zinc-100 leading-tight hover:text-bronze-500 transition-colors">
                            {activeChat.lead?.name || activeChat.push_name || activeChat.chatID}
                        </h3>
                        <p className="text-xs text-zinc-500 font-medium flex items-center gap-2">
                            {presence === 'online' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                            {presence === 'online' ? 'Online' : presence === 'offline' ? 'Offline' : activeChat.lead?.business || 'Click for info'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors">
                        <Search size={18} />
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Area - WhatsApp Style */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-5">
                <div className="absolute inset-0 bg-[#0B0B0B]/95 pointer-events-none"></div>

                <div className="relative z-10 space-y-6">
                    {/* Encryption Notice */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-zinc-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/5 shadow-sm">
                            <p className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-bronze-500/50"></span>
                                Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
                            </p>
                        </div>
                    </div>

                    {Object.keys(groupedMessages).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-60">
                            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-white/5">
                                <Clock size={20} className="text-zinc-600" />
                            </div>
                            <p className="text-sm font-medium">No messages here yet</p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([date, msgs]) => (
                            <React.Fragment key={date}>
                                <div className="flex justify-center mb-8">
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 py-1 rounded-full border border-white/5 bg-zinc-900/50">
                                        {date}
                                    </span>
                                </div>
                                {msgs.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} group`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative ${msg.fromMe
                                                ? 'bg-bronze-600 text-white rounded-tr-none'
                                                : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
                                                }`}
                                        >
                                            {/* AI Indicator */}
                                            {msg.isAiGenerated && (
                                                <div className="flex items-center gap-1 mb-2 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                                                    <BrainCircuit size={10} />
                                                    <span>AI Generated</span>
                                                </div>
                                            )}

                                            {/* Message Content */}
                                            <div className="break-words whitespace-pre-wrap">
                                                {msg.mediaUrl && (
                                                    <div className="mb-3">
                                                        {msg.mediaType === 'image' && (
                                                            <img src={msg.mediaUrl} alt="Shared image" className="rounded border border-white/10 max-w-full max-h-[300px] object-cover" />
                                                        )}
                                                        {msg.mediaType === 'video' && (
                                                            <video src={msg.mediaUrl} controls className="rounded border border-white/10 max-w-full max-h-[300px]" />
                                                        )}
                                                        {msg.mediaType === 'audio' && (
                                                            <audio src={msg.mediaUrl} controls className="w-full min-w-[240px]" />
                                                        )}
                                                        {msg.mediaType === 'file' && (
                                                            <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/20 rounded border border-white/5 hover:bg-black/30 transition-colors">
                                                                <FileText size={16} className="text-zinc-400" />
                                                                <span className="text-xs font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-2">Download File</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                {msg.text || msg.body}
                                            </div>

                                            <div className={`flex items-center justify-end gap-1 mt-1 ${msg.fromMe ? 'text-white/60' : 'text-zinc-500'}`}>
                                                <span className="text-[10px] font-medium">
                                                    {formatMessageTime(msg.timestamp)}
                                                </span>
                                                {msg.fromMe && (
                                                    <span>
                                                        {msg.ack >= 2 ? (
                                                            <CheckCheck size={12} className={msg.ack >= 3 ? 'text-blue-300' : ''} />
                                                        ) : (
                                                            <Check size={12} />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </React.Fragment>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
};
