// @ts-nocheck
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MoreVertical, Search, MessageSquare, Users, Filter, LogOut, RefreshCw, QrCode, Smartphone } from 'lucide-react';
import { Lead } from '../../types';
import { WahaChat, WahaMe } from '../../types/waha';
import { AnimatePresence, motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface ChatSidebarProps {
    chats: (WahaChat & { lead?: Lead })[];
    leads: Lead[];
    apifyLeads?: any[];
    selectedChatId: string | null;
    onSelectChat: (chatId: string) => void;
    wahaProfile: WahaMe | null;
    profilePics: Record<string, string>;
    connectionStatus?: 'WORKING' | 'SCAN_QR_CODE' | 'STARTING' | 'STOPPED' | 'FAILED';
    onLogout?: () => void;
    onRestart?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    chats,
    leads,
    apifyLeads = [],
    selectedChatId,
    onSelectChat,
    wahaProfile,
    profilePics,
    connectionStatus = 'WORKING',
    onLogout,
    onRestart
}) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'unread'>('all');
    const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);

    // Filter Chats
    const filteredChats = chats.filter(chat => {
        const matchesSearch =
            chat.push_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chat.lead?.name.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === 'groups') return chat.isGroup;
        if (activeTab === 'unread') return chat.unreadCount > 0;
        return true;
    });

    const suggestedLeads = leads.filter(lead =>
        !chats.some(chat => chat.id === lead.chat_id) &&
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
            <div className="p-6 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-6">
                    {/* Profile / Connection Status */}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button className="flex items-center gap-3 group outline-none">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 group-hover:border-white/20 transition-colors">
                                        {wahaProfile?.picture ? (
                                            <img src={wahaProfile.picture} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-zinc-500">{wahaProfile?.pushName?.charAt(0) || 'M'}</span>
                                        )}
                                    </div>
                                    {/* Status Indicator */}
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0F0F0F] flex items-center justify-center ${connectionStatus === 'WORKING' ? 'bg-emerald-500' :
                                        connectionStatus === 'SCAN_QR_CODE' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                                        }`}>
                                        {connectionStatus !== 'WORKING' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-bold text-zinc-200 leading-tight group-hover:text-white transition-colors">
                                        {wahaProfile?.pushName || 'My Number'}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">
                                        {connectionStatus === 'WORKING' ? 'Online' : connectionStatus.replace('_', ' ')}
                                    </span>
                                </div>
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="min-w-[220px] bg-[#1a1a1a] rounded-xl border border-white/10 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200" sideOffset={5} align="start">
                                <div className="px-2 py-1.5 mb-1">
                                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Connection Status</p>
                                </div>

                                {connectionStatus === 'SCAN_QR_CODE' ? (
                                    <DropdownMenu.Item className="outline-none">
                                        <div className="bg-white p-2 rounded-lg mb-2 flex justify-center">
                                            <QrCode className="text-black w-32 h-32" />
                                            {/* In real app, pass QR URL here */}
                                        </div>
                                        <p className="text-center text-xs text-zinc-400 mb-2">Scan to connect</p>
                                    </DropdownMenu.Item>
                                ) : (
                                    <div className="px-2 py-2 mb-2 bg-white/5 rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-zinc-400">Signal Strength</span>
                                            <span className="text-xs text-emerald-500 font-bold">Good</span>
                                        </div>
                                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="w-[85%] h-full bg-emerald-500 rounded-full" />
                                        </div>
                                    </div>
                                )}

                                <DropdownMenu.Separator className="h-px bg-white/10 my-1" />

                                <DropdownMenu.Item
                                    className="flex items-center gap-2 px-2 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer outline-none transition-colors"
                                    onSelect={onRestart}
                                >
                                    <RefreshCw size={14} />
                                    Restart Session
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    className="flex items-center gap-2 px-2 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer outline-none transition-colors"
                                    onSelect={onLogout}
                                >
                                    <LogOut size={14} />
                                    Logout
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>

                    {/* Actions */}
                    <div className="flex gap-1">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button className="p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all">
                                    <Plus size={18} />
                                </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.Content className="min-w-[160px] bg-[#1a1a1a] rounded-xl border border-white/10 p-1 shadow-xl z-50" align="end">
                                    <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 rounded-lg cursor-pointer outline-none">
                                        <MessageSquare size={14} /> New Chat
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 rounded-lg cursor-pointer outline-none">
                                        <Users size={14} /> New Group
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>

                        <button className="p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all">
                            <MoreVertical size={18} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative group mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all text-sm placeholder:text-zinc-600"
                    />
                </div>

                {/* Filters / Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'unread', label: 'Unread' },
                        { id: 'groups', label: 'Groups' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-zinc-100 text-black'
                                : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stories Row (Placeholder) */}
            <div className="px-6 py-4 border-b border-white/5 flex gap-3 overflow-x-auto no-scrollbar">
                <div className="flex flex-col items-center gap-1 cursor-pointer group">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:border-zinc-500 transition-colors bg-zinc-900">
                        <Plus size={16} />
                    </div>
                    <span className="text-[10px] text-zinc-500">My Status</span>
                </div>
                {/* Mock Stories */}
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex flex-col items-center gap-1 cursor-pointer">
                        <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 to-pink-500">
                            <div className="w-full h-full rounded-full bg-zinc-800 border-2 border-[#0F0F0F]" />
                        </div>
                        <span className="text-[10px] text-zinc-500">User {i}</span>
                    </div>
                ))}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredChats.length === 0 && recommendationSource.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-white/5">
                            <MessageSquare size={24} className="text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-sm mb-2">{t('chat.no_conversations')}</p>
                    </div>
                ) : filteredChats.length === 0 && recommendationSource.length > 0 ? (
                    <div className="flex flex-col h-full">
                        {/* Recommended Leads Carousel */}
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-8">
                                Suggested Contacts
                            </p>

                            <div className="w-full relative h-[180px] flex items-center justify-center">
                                <AnimatePresence initial={false} mode="popLayout">
                                    {[-1, 0, 1].map((offset) => {
                                        const index = (currentRecommendationIndex + offset + recommendationSource.length) % recommendationSource.length;
                                        const item = recommendationSource[index];
                                        if (!item) return null;

                                        const isCenter = offset === 0;
                                        const isLeft = offset === -1;
                                        const isRight = offset === 1;

                                        return (
                                            <motion.div
                                                key={`${(item as any).id || index}`}
                                                layout
                                                initial={{ opacity: 0, x: isRight ? 120 : isLeft ? -120 : 0, scale: 0.8, zIndex: 0 }}
                                                animate={{
                                                    opacity: isCenter ? 1 : 0.3,
                                                    x: isCenter ? 0 : isLeft ? '-110%' : '110%',
                                                    scale: isCenter ? 1.2 : 0.7,
                                                    zIndex: isCenter ? 10 : 1,
                                                    filter: isCenter ? 'blur(0px)' : 'blur(2px)'
                                                }}
                                                exit={{ opacity: 0, x: isLeft ? -200 : 200, scale: 0.5, zIndex: 0 }}
                                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                                className={`absolute flex flex-col items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors w-[120px]`}
                                                style={{ left: '50%', marginLeft: '-60px' }}
                                            >
                                                <div className="w-full h-full flex flex-col items-center gap-3" onClick={() => onSelectChat((item as any).chat_id || (item as any).phone || item.id)}>
                                                    <div className={`rounded-full flex items-center justify-center text-lg font-bold transition-all shrink-0 overflow-hidden relative ${isCenter ? 'w-20 h-20 shadow-2xl shadow-black/50 ring-2 ring-bronze-500/50' : 'w-12 h-12 opacity-50 grayscale'}`}>
                                                        {(item as any).avatar_url ? (
                                                            <img src={(item as any).avatar_url} alt={(item as any).name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                                                                <span>{((item as any).title || (item as any).name || '?').charAt(0)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-center w-full">
                                                        <h3 className={`font-bold transition-all truncate w-full text-center ${isCenter ? 'text-sm text-zinc-100 mt-2' : 'text-[10px] text-zinc-600'}`}>
                                                            {(item as any).title || (item as any).name}
                                                        </h3>
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
                                onClick={() => onSelectChat(chat.id)}
                                className={`group flex items-center gap-4 p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/[0.02] ${selectedChatId === chat.id ? 'bg-white/[0.04]' : ''}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-sm font-bold text-zinc-500 border border-white/5 group-hover:border-bronze-500/30 group-hover:text-bronze-500 transition-colors shrink-0 overflow-hidden">
                                    {profilePics[chat.id] ? (
                                        <img src={profilePics[chat.id]} alt={chat.push_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{chat.push_name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm font-semibold truncate ${selectedChatId === chat.id ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                                            {chat.lead?.name || chat.push_name || chat.id}
                                        </h3>
                                        {chat.timestamp && (
                                            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">
                                                {formatTime(chat.timestamp * 1000)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors truncate">
                                        {chat.lastMessage?.content || chat.last_text || 'No messages yet'}
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
