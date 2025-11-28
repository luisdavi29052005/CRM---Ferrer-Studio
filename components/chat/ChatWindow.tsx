import React, { useRef, useEffect } from 'react';
import { MoreVertical, Search, Phone, Video, ArrowLeft, Check, CheckCheck, BrainCircuit, FileText, Clock } from 'lucide-react';
import { WahaChat, Message } from '../../types';

interface ChatWindowProps {
    activeChat: WahaChat & { lead?: any };
    messages: Message[];
    onToggleContactInfo: () => void;
    onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ activeChat, messages, onToggleContactInfo, onBack }) => {
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

    // Group messages by date
    const groupedMessages = messages.reduce((acc, message) => {
        const date = new Date(message.timestamp).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(message);
        return acc;
    }, {} as Record<string, Message[]>);

    return (
        <div className="flex flex-col h-full w-full bg-[#0F0F0F] relative">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Header - System Style (ApifyImports Pattern) */}
            <div className="p-8 pb-6 border-b border-white/5 flex items-end justify-between shrink-0 relative z-10 bg-[#0F0F0F]/90 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden text-zinc-400 hover:text-zinc-200 mr-2">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="cursor-pointer" onClick={onToggleContactInfo}>
                        <h2 className="text-3xl font-bold text-zinc-100 tracking-tight leading-none">{activeChat.push_name}</h2>
                        <p className="text-zinc-500 text-sm mt-2 font-medium flex items-center gap-2">
                            {activeChat.lead?.business || 'Contact Details'}
                            {activeChat.lead?.phone && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                    <span>{activeChat.lead.phone}</span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all" title="Search"><Search size={16} /></button>
                    <button className="p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all" title="More"><MoreVertical size={16} /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10">
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
                                    className={`flex mb-4 ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`relative max-w-[80%] px-4 py-3 rounded-lg text-sm leading-relaxed border ${msg.fromMe
                                            ? 'bg-zinc-800 text-zinc-200 border-white/10'
                                            : 'bg-zinc-900 text-zinc-300 border-white/5'
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
                                            {msg.text}
                                        </div>

                                        {/* Metadata */}
                                        <div className={`flex items-center gap-1.5 mt-2 ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                                            <span className="text-[10px] text-zinc-600 font-medium">
                                                {formatTime(msg.timestamp)}
                                            </span>
                                            {msg.fromMe && (
                                                <span className={msg.ack === 3 ? 'text-emerald-500' : 'text-zinc-600'}>
                                                    {msg.ack >= 2 ? <CheckCheck size={12} /> : <Check size={12} />}
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
    );
};
