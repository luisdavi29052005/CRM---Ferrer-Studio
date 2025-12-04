// @ts-nocheck
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, MessageSquare, Users, MoreVertical, Plus } from 'lucide-react';
import { Lead } from '../../types';
import { WahaChat, WahaMe } from '../../types/waha';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { HighlightText } from '../HighlightText';

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
    onUpdateProfile?: (data: { name?: string; status?: string; picture?: File }) => Promise<void>;
    onNavigate?: (view: string) => void;
    isLoading?: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    chats,
    selectedChatId,
    onSelectChat,
    profilePics,
    isLoading = false
}) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'unread'>('all');

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

    const formatTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-[#09090b]">
            {/* Header Panel */}
            <div className="p-5 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Chats ({filteredChats.length})</h2>

                    {/* Optional Actions */}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button className="p-1.5 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all">
                                <MoreVertical size={16} />
                            </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="min-w-[160px] bg-[#09090b] rounded-xl border border-zinc-800 p-1 shadow-xl z-50" align="end">
                                <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900 rounded-lg cursor-pointer outline-none">
                                    <Users size={14} /> Novo Grupo
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </div>

                {/* Search Input - Matching ApifyImports Style */}
                <div className="relative group mb-4">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar conversa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-b border-zinc-800 text-zinc-200 pl-6 pr-4 py-2 focus:outline-none focus:border-bronze-500 transition-colors text-sm placeholder:text-zinc-600"
                    />
                </div>

                {/* Tabs - Pill Style */}
                <div className="flex items-center gap-2">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'unread', label: 'Unread' },
                        { id: 'groups', label: 'Groups' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab.id
                                ? 'bg-white/10 text-zinc-100 border border-white/10'
                                : 'bg-transparent text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-32">
                        <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <div className="w-12 h-12 rounded-full bg-zinc-900/50 flex items-center justify-center mb-3 border border-white/5">
                            <MessageSquare size={20} className="text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Nenhuma conversa encontrada</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filteredChats.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => {
                                    if (selectedChatId !== chat.id) {
                                        onSelectChat(chat.id);
                                    }
                                }}
                                className={`group flex items-center gap-4 p-4 cursor-pointer transition-all hover:bg-white/[0.02] ${selectedChatId === chat.id ? 'bg-white/[0.04] border-l-2 border-bronze-500' : 'border-l-2 border-transparent'}`}
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0 overflow-hidden border border-white/5 group-hover:border-bronze-500/30 transition-colors">
                                    {profilePics[chat.id] ? (
                                        <img src={profilePics[chat.id]} alt={chat.push_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{chat.push_name?.charAt(0)}</span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className={`text-sm font-semibold truncate ${selectedChatId === chat.id ? 'text-zinc-100' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                                            <HighlightText text={chat.lead?.name || chat.push_name || chat.id} highlight={searchTerm} />
                                        </h3>
                                        {chat.timestamp && (
                                            <span className="text-[10px] text-zinc-600 font-medium group-hover:text-zinc-500">
                                                {formatTime(chat.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors truncate max-w-[180px]">
                                            {chat.lastMessage?.content || chat.last_text || 'Sem mensagens'}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-bronze-500 text-black text-[9px] font-bold min-w-[18px] text-center">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
