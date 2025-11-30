import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Search, Phone, Video, ArrowLeft, Check, CheckCheck, BrainCircuit, FileText } from 'lucide-react';
import { WahaChat, Message, Lead } from '../../types';

interface ChatWindowProps {
    activeChat: WahaChat & { lead?: Lead };
    messages: Message[];
    onToggleContactInfo: () => void;
    onBack?: () => void;
    profilePic?: string;
    presence?: 'online' | 'offline' | 'unknown';
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    activeChat,
    messages,
    onToggleContactInfo,
    onBack,
    profilePic,
    presence
}) => {
    const { t } = useTranslation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatMessageTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-[#0B0B0B] relative">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-white/5 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                    )}

                    <div
                        className="relative cursor-pointer"
                        onClick={onToggleContactInfo}
                    >
                        {profilePic ? (
                            <img
                                src={profilePic}
                                alt={activeChat.push_name}
                                className="w-10 h-10 rounded-full object-cover border border-white/10"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-semibold text-sm border border-white/10 shadow-lg shadow-emerald-900/20">
                                {(activeChat.push_name || '?').substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        {presence === 'online' && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0B0B0B] rounded-full"></div>
                        )}
                    </div>

                    <div
                        className="flex flex-col cursor-pointer"
                        onClick={onToggleContactInfo}
                    >
                        <h3 className="text-zinc-100 font-semibold text-sm truncate max-w-[200px]">
                            {activeChat.lead?.name || activeChat.push_name || activeChat.chatID}
                        </h3>
                        <span className="text-xs text-zinc-500">
                            {presence === 'online' ? (
                                <span className="text-green-400 font-medium">Online</span>
                            ) : presence === 'offline' ? (
                                'Offline'
                            ) : (
                                activeChat.lead?.business || 'Click for info'
                            )}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
                        <Video size={20} />
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
                        <Phone size={20} />
                    </button>
                    <div className="w-px h-6 bg-zinc-800 mx-1"></div>
                    <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
                        <Search size={20} />
                    </button>
                    <button
                        onClick={onToggleContactInfo}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-fixed bg-opacity-5">
                <div className="absolute inset-0 bg-[#0B0B0B]/95 pointer-events-none"></div>

                <div className="relative z-10 space-y-2">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} group`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative ${msg.fromMe
                                    ? 'bg-emerald-600/20 text-emerald-50 border border-emerald-500/20 rounded-tr-none'
                                    : 'bg-zinc-800/80 text-zinc-200 border border-white/5 rounded-tl-none'
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
                                <div className="break-words whitespace-pre-wrap text-sm leading-relaxed">
                                    {msg.mediaUrl && (
                                        <div className="mb-3">
                                            {msg.mediaType === 'image' && (
                                                <img src={msg.mediaUrl} alt="Shared image" className="rounded-lg border border-white/10 max-w-full max-h-[300px] object-cover" />
                                            )}
                                            {msg.mediaType === 'video' && (
                                                <video src={msg.mediaUrl} controls className="rounded-lg border border-white/10 max-w-full max-h-[300px]" />
                                            )}
                                            {msg.mediaType === 'audio' && (
                                                <audio src={msg.mediaUrl} controls className="w-full min-w-[240px]" />
                                            )}
                                            {msg.mediaType === 'file' && (
                                                <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5 hover:bg-black/30 transition-colors">
                                                    <FileText size={16} className="text-zinc-400" />
                                                    <span className="text-xs font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-2">Download File</span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {msg.text}
                                </div>

                                <div className={`flex items-center justify-end gap-1 mt-1 ${msg.fromMe ? 'text-emerald-200/50' : 'text-zinc-500'}`}>
                                    <span className="text-[10px] font-medium">
                                        {formatMessageTime(msg.timestamp)}
                                    </span>
                                    {msg.fromMe && (
                                        <span>
                                            {msg.ack && msg.ack >= 2 ? (
                                                <CheckCheck size={12} className={msg.ack >= 3 ? 'text-blue-400' : ''} />
                                            ) : (
                                                <Check size={12} />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
};
