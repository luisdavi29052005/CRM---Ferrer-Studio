import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, MoreVertical, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WahaChat, Lead, ApifyLead } from '../../types';

interface ChatSidebarProps {
    chats: (WahaChat & { lead?: Lead })[];
    leads: Lead[];
    apifyLeads?: ApifyLead[];
    selectedChatId: string | null;
    onSelectChat: (chatId: string) => void;
    wahaProfile: { id: string, name: string, picture: string } | null;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ chats, leads, apifyLeads = [], selectedChatId, onSelectChat, wahaProfile }) => {
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
                                                    x: isRight ? 100 : isLeft ? -100 : 0,
                                                    scale: 0.8,
                                                    zIndex: 0
                                                }}
                                                animate={{
                                                    opacity: isCenter ? 1 : 0.4,
                                                    x: isCenter ? 0 : isLeft ? '-85%' : '85%',
                                                    scale: isCenter ? 1.1 : 0.85,
                                                    zIndex: isCenter ? 10 : 1,
                                                    filter: isCenter ? 'blur(0px)' : 'blur(1px)'
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    x: isLeft ? -150 : 150, // Exit further out
                                                    scale: 0.7,
                                                    zIndex: 0
                                                }}
                                                transition={{
                                                    duration: 0.6,
                                                    ease: [0.32, 0.72, 0, 1] // Custom ease for "stylish" feel
                                                }}
                                                onClick={() => {
                                                    onSelectChat((item as any).chat_id || (item as any).phone || item.id);
                                                }}
                                                className={`absolute flex flex-col items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors w-[140px] ${isCenter ? 'bg-white/[0.03] border border-white/10 shadow-xl shadow-black/20' : ''}`}
                                                style={{
                                                    left: '50%',
                                                    marginLeft: '-70px', // Half of width to center absolute element
                                                }}
                                            >
                                                <div className={`rounded-full flex items-center justify-center text-lg font-bold border transition-all shrink-0 overflow-hidden relative ${isCenter ? 'w-16 h-16 bg-zinc-800 text-bronze-500 border-bronze-500/30' : 'w-12 h-12 bg-zinc-900 text-zinc-600 border-white/5'}`}>
                                                    {(item as any).avatar_url ? (
                                                        <img src={(item as any).avatar_url} alt={(item as any).name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{((item as any).title || (item as any).name || '?').charAt(0)}</span>
                                                    )}

                                                    {/* Hover Overlay with Chat Icon - Only for Center */}
                                                    {isCenter && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                            <MessageSquare size={20} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col items-center w-full">
                                                    <h3 className={`font-bold transition-colors truncate w-full text-center ${isCenter ? 'text-sm text-zinc-100' : 'text-xs text-zinc-500'}`}>
                                                        {(item as any).title || (item as any).name}
                                                    </h3>
                                                    <p className={`truncate w-full text-center transition-colors ${isCenter ? 'text-[10px] text-zinc-400' : 'text-[9px] text-zinc-700'}`}>
                                                        {(item as any).business || (item as any).category || 'Lead'}
                                                    </p>
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
                                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500 border border-white/5 group-hover:border-bronze-500/30 group-hover:text-bronze-500 transition-colors shrink-0">
                                    {chat.lead?.avatar_url ? (
                                        <img src={chat.lead.avatar_url} alt={chat.push_name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <span>{chat.push_name?.charAt(0)}</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm font-semibold truncate transition-colors ${selectedChatId === chat.chatID ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                                            {chat.push_name || chat.chatID}
                                        </h3>
                                        <span className="text-[10px] text-zinc-500 font-medium">
                                            {formatTime(chat.last_timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-zinc-500 truncate max-w-[180px] flex items-center gap-1 group-hover:text-zinc-400 transition-colors">
                                            {chat.last_from_me && (
                                                <span className={chat.status === 'read' ? 'text-emerald-500' : 'text-zinc-500'}>
                                                    <CheckCheck size={12} />
                                                </span>
                                            )}
                                            {chat.last_text}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {suggestedLeads.length > 0 && (
                            <>
                                <div className="px-4 py-3 bg-[#0F0F0F] sticky top-0 z-10 border-b border-white/5">
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t('leads.title')}</span>
                                </div>
                                {suggestedLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        onClick={() => onSelectChat(lead.chat_id)}
                                        className="group flex items-center gap-4 p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/[0.02]"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500 border border-white/5 group-hover:border-bronze-500/30 group-hover:text-bronze-500 transition-colors shrink-0">
                                            <span>{lead.name.charAt(0)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">{lead.name}</p>
                                            <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors truncate">{lead.business}</p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
