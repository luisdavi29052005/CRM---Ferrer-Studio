// @ts-nocheck
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MoreVertical, Search, MessageSquare } from 'lucide-react';
import { WahaChat, Lead } from '../../types';
import { WahaMe } from '../../types/waha';
import { AnimatePresence, motion } from 'framer-motion';

interface ChatSidebarProps {
    chats: (WahaChat & { lead?: Lead })[];
    leads: Lead[];
    apifyLeads?: any[];
    selectedChatId: string | null;
    onSelectChat: (chatId: string) => void;
    wahaProfile: WahaMe | null;
    profilePics: Record<string, string>;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ chats, leads, apifyLeads = [], selectedChatId, onSelectChat, wahaProfile, profilePics }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);

    const filteredChats = chats.filter(chat =>
        chat.push_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.lead?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const suggestedLeads = leads.filter(lead =>
        !chats.some(chat => chat.chatID === lead.chat_id) &&
        (lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.business?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Use Apify leads for recommendations if available, otherwise fallback to suggested CRM leads
    const recommendationSource = apifyLeads.length > 0 ? apifyLeads : suggestedLeads;

    React.useEffect(() => {
        if (recommendationSource.length === 0) return;
        const interval = setInterval(() => {
            setCurrentRecommendationIndex((prev) => (prev + 1) % recommendationSource.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [recommendationSource.length]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full border-r border-white/5 bg-[#0F0F0F]">
            {/* Header - System Style */}
            <div className="p-8 pb-6 border-b border-white/5">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-zinc-100 tracking-tight mb-4">{t('chat.title')}</h2>

                        {/* Flat Minimalist Profile Info */}
                        {wahaProfile ? (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                    {wahaProfile.picture ? (
                                        <img src={wahaProfile.picture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold text-zinc-500">{wahaProfile.name?.charAt(0) || 'M'}</span>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-zinc-200 leading-tight">{wahaProfile.name || 'My Number'}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-zinc-500 font-medium">{wahaProfile.id.replace('@c.us', '')}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Online</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-zinc-500 text-sm font-medium">{t('chat.subtitle') || 'Manage your conversations'}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all">
                            <Plus size={16} />
                        </button>
                        <button className="p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all">
                            <MoreVertical size={16} />
                        </button>
                    </div>
                </div>

                {/* Search - System Style */}
                <div className="relative group">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder={t('leads.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-b border-zinc-800 text-zinc-200 pl-6 pr-4 py-2 focus:outline-none focus:border-bronze-500 transition-colors text-sm w-full placeholder:text-zinc-600"
                    />
                </div>
            </div>

            {/* Chat List - Table Row Style */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredChats.length === 0 && recommendationSource.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-white/5">
                            <MessageSquare size={24} className="text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-sm mb-2">{t('chat.no_conversations')}</p>
                        <p className="text-xs text-zinc-600 max-w-[200px]">Start a new conversation with one of your leads.</p>
                    </div>
                ) : filteredChats.length === 0 && recommendationSource.length > 0 ? (
                    <div className="flex flex-col h-full">
                        {/* Recommended Leads Carousel - Focused Horizontal List */}
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-8">
                                {apifyLeads.length > 0 ? 'Comece a conversar' : 'Suggested Contacts'}
                            </p>

                            {apifyLeads.length > 0 && (
                                <p className="text-xs text-zinc-500 mb-8 -mt-6">
                                    Converse com seus leads ({apifyLeads.length})
                                </p>
                            )}

                            <div className="w-full relative h-[180px] flex items-center justify-center">
                                <AnimatePresence initial={false} mode="popLayout">
                                    {[-1, 0, 1].map((offset) => {
                                        // Calculate index correctly handling negative numbers for modulo
                                        const index = (currentRecommendationIndex + offset + recommendationSource.length) % recommendationSource.length;
                                        const item = recommendationSource[index];
                                        if (!item) return null;

                                        // Determine position styles based on offset
                                        const isCenter = offset === 0;
                                        const isLeft = offset === -1;
                                        const isRight = offset === 1;

                                        return (
                                            <motion.div
                                                key={`${(item as any).id || index}`}
                                                layout
                                                initial={{
                                                    opacity: 0,
                                                    x: isRight ? 120 : isLeft ? -120 : 0,
                                                    scale: 0.8,
                                                    zIndex: 0
                                                }}
                                                animate={{
                                                    opacity: isCenter ? 1 : 0.3,
                                                    x: isCenter ? 0 : isLeft ? '-110%' : '110%', // Push further out to avoid overlap
                                                    scale: isCenter ? 1.2 : 0.7, // More contrast in size
                                                    zIndex: isCenter ? 10 : 1,
                                                    filter: isCenter ? 'blur(0px)' : 'blur(2px)'
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    x: isLeft ? -200 : 200, // Exit further out
                                                    scale: 0.5,
                                                    zIndex: 0
                                                }}
                                                transition={{
                                                    duration: 0.5,
                                                    ease: "easeInOut"
                                                }}
                                                className={`absolute flex flex-col items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors w-[120px]`}
                                                style={{
                                                    left: '50%',
                                                    marginLeft: '-60px', // Half of width (120px) to center absolute element
                                                }}
                                            >
                                                <div
                                                    className="w-full h-full flex flex-col items-center gap-3"
                                                    onClick={() => {
                                                        // Pass the ID that matches what Chat.tsx expects (chat_id, phone, or id)
                                                        onSelectChat((item as any).chat_id || (item as any).phone || item.id);
                                                    }}
                                                >
                                                    {/* Avatar - No Box, just the image/circle */}
                                                    <div className={`rounded-full flex items-center justify-center text-lg font-bold transition-all shrink-0 overflow-hidden relative ${isCenter ? 'w-20 h-20 shadow-2xl shadow-black/50 ring-2 ring-bronze-500/50' : 'w-12 h-12 opacity-50 grayscale'}`}>
                                                        {(item as any).avatar_url ? (
                                                            <img src={(item as any).avatar_url} alt={(item as any).name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                                                                <span>{((item as any).title || (item as any).name || '?').charAt(0)}</span>
                                                            </div>
                                                        )}

                                                        {/* Hover Overlay with Chat Icon - Only for Center */}
                                                        {isCenter && (
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                                <MessageSquare size={24} className="text-white drop-shadow-lg" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col items-center w-full">
                                                        <h3 className={`font-bold transition-all truncate w-full text-center ${isCenter ? 'text-sm text-zinc-100 mt-2' : 'text-[10px] text-zinc-600'}`}>
                                                            {(item as any).title || (item as any).name}
                                                        </h3>
                                                        {isCenter && (
                                                            <p className="truncate w-full text-center text-[10px] text-zinc-400">
                                                                {(item as any).business || (item as any).category || 'Lead'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {filteredChats.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => onSelectChat(chat.chatID)}
                                className={`group flex items-center gap-4 p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/[0.02] ${selectedChatId === chat.chatID ? 'bg-white/[0.04]' : ''
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-sm font-bold text-zinc-500 border border-white/5 group-hover:border-bronze-500/30 group-hover:text-bronze-500 transition-colors shrink-0 overflow-hidden">
                                    {profilePics[chat.chatID] ? (
                                        <img src={profilePics[chat.chatID]} alt={chat.push_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{chat.push_name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm font-semibold truncate ${selectedChatId === chat.chatID ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                                            {chat.lead?.name || chat.push_name || chat.chatID}
                                        </h3>
                                        {chat.last_timestamp && (
                                            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">
                                                {formatTime(chat.last_timestamp * 1000)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors truncate">
                                        {chat.last_text || 'No messages yet'}
                                    </p>
                                </div>
                                {chat.unreadCount > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-black">
                                        {chat.unreadCount}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
