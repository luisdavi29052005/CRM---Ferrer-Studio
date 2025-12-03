// @ts-nocheck
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MoreVertical, Search, MessageSquare, Users, Filter, LogOut, RefreshCw, QrCode, Smartphone, MessageSquareText, CircleDashed, MessageCircle, Sparkles, Settings, X, Camera, Edit2, User, Bot } from 'lucide-react';
import { Lead } from '../../types';
import { WahaChat, WahaMe } from '../../types/waha';

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
    onUpdateProfile?: (data: { name?: string; status?: string; picture?: File }) => Promise<void>;
    onNavigate?: (view: string) => void;
    isLoading?: boolean;
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
    onRestart,
    onUpdateProfile,
    onNavigate,
    isLoading = false
}) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'unread'>('all');
    const [activeSidebarView, setActiveSidebarView] = useState<'chats' | 'ai-config'>('chats');


    // Profile Editing State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Initialize edit state when profile opens or changes
    React.useEffect(() => {
        if (wahaProfile) {
            setEditName(wahaProfile.pushName || '');
            setEditStatus(wahaProfile.status || '');
        }
    }, [wahaProfile]);

    const handleSaveProfile = async () => {
        if (!onUpdateProfile) return;
        setIsSavingProfile(true);
        try {
            await onUpdateProfile({
                name: editName !== wahaProfile?.pushName ? editName : undefined,
                status: editStatus !== wahaProfile?.status ? editStatus : undefined
            });
            setIsProfileOpen(false);
        } catch (error) {
            console.error('Failed to update profile', error);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onUpdateProfile) {
            const file = e.target.files[0];
            setIsSavingProfile(true);
            try {
                await onUpdateProfile({ picture: file });
            } catch (error) {
                console.error('Failed to update profile picture', error);
            } finally {
                setIsSavingProfile(false);
            }
        }
    };

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
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    return (
        <div className="flex h-full bg-[#09090b]">
            {/* Navigation Rail */}
            <div className="w-[60px] flex flex-col items-center justify-between py-4 bg-[#09090b] shrink-0 z-20">
                {/* Top Icons */}
                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={() => setActiveSidebarView('chats')}
                        className={`relative group transition-colors ${activeSidebarView === 'chats' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <div className={`p-2.5 rounded-lg ${activeSidebarView === 'chats' ? 'bg-zinc-900' : ''}`}>
                            <MessageSquareText size={20} strokeWidth={2} />
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveSidebarView('ai-config')}
                        className={`relative group transition-colors ${activeSidebarView === 'ai-config' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <div className={`p-2 rounded-lg ${activeSidebarView === 'ai-config' ? 'bg-zinc-900' : ''}`}>
                            <Bot size={20} strokeWidth={2} />
                        </div>
                    </button>
                </div>

                {/* Bottom Icons */}
                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={() => onNavigate?.('settings')}
                        className="relative group text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <div className="p-2">
                            <Settings size={20} strokeWidth={2} />
                        </div>
                    </button>

                    {/* Profile / Connection Status */}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button className="relative group outline-none">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 transition-colors">
                                    {wahaProfile?.picture ? (
                                        <img src={wahaProfile.picture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-zinc-500">{wahaProfile?.pushName?.charAt(0) || 'M'}</span>
                                    )}
                                </div>
                                {/* Status Indicator */}
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#09090b] flex items-center justify-center ${connectionStatus === 'WORKING' ? 'bg-emerald-500' :
                                    connectionStatus === 'SCAN_QR_CODE' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                                    }`}>
                                </div>
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="min-w-[220px] bg-[#09090b] rounded-xl border border-zinc-800 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 ml-2" sideOffset={5} align="end" side="right">
                                <div className="px-2 py-1.5 mb-1">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Connection Status</p>
                                </div>

                                {connectionStatus === 'SCAN_QR_CODE' ? (
                                    <DropdownMenu.Item className="outline-none">
                                        <div className="bg-white p-2 rounded-lg mb-2 flex justify-center">
                                            <QrCode className="text-black w-32 h-32" />
                                        </div>
                                        <p className="text-center text-xs text-zinc-500 mb-2">Scan to connect</p>
                                    </DropdownMenu.Item>
                                ) : (
                                    <div className="px-2 py-2 mb-2 bg-zinc-900 rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-zinc-400">Signal Strength</span>
                                            <span className="text-xs text-emerald-500 font-bold">Good</span>
                                        </div>
                                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="w-[85%] h-full bg-emerald-500 rounded-full" />
                                        </div>
                                    </div>
                                )}

                                <DropdownMenu.Separator className="h-px bg-zinc-800 my-1" />

                                <DropdownMenu.Item
                                    className="flex items-center gap-2 px-2 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer outline-none transition-colors"
                                    onSelect={() => setIsProfileOpen(true)}
                                >
                                    <User size={14} />
                                    Profile
                                </DropdownMenu.Item>

                                <DropdownMenu.Item
                                    className="flex items-center gap-2 px-2 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer outline-none transition-colors"
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
                </div>
            </div>

            {/* Chat List Column */}
            <div className="flex-1 flex flex-col h-full bg-[#09090b] min-w-0">
                {activeSidebarView === 'chats' ? (
                    <>
                        {/* Header - Simplified */}
                        <div className="p-4 pb-2">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-xl font-bold text-zinc-100">Chats</h1>

                                {/* Actions */}
                                <div className="flex gap-1">
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger asChild>
                                            <button className="p-2 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all">
                                                <Plus size={20} />
                                            </button>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Portal>
                                            <DropdownMenu.Content className="min-w-[160px] bg-[#09090b] rounded-xl border border-zinc-800 p-1 shadow-xl z-50" align="end">
                                                <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900 rounded-lg cursor-pointer outline-none">
                                                    <MessageSquare size={14} /> New Chat
                                                </DropdownMenu.Item>
                                                <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900 rounded-lg cursor-pointer outline-none">
                                                    <Users size={14} /> New Group
                                                </DropdownMenu.Item>
                                            </DropdownMenu.Content>
                                        </DropdownMenu.Portal>
                                    </DropdownMenu.Root>

                                    <button className="p-2 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative group mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-zinc-900 border-none text-zinc-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all text-sm placeholder:text-zinc-600"
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
                                            ? 'bg-zinc-800 text-zinc-200'
                                            : 'bg-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {
                                isLoading ? (
                                    <div className="flex flex-col items-center justify-center h-32">
                                        <RefreshCw className="animate-spin text-zinc-600" size={24} />
                                    </div>
                                ) : filteredChats.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                                            <MessageSquare size={24} className="text-zinc-600" />
                                        </div>
                                        <p className="text-zinc-500 text-sm mb-2">{t('chat.no_conversations')}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {filteredChats.map((chat) => (
                                            <div
                                                key={chat.id}
                                                onClick={() => onSelectChat(chat.id)}
                                                className={`group flex items-center gap-4 p-3 px-4 cursor-pointer transition-colors hover:bg-zinc-900/50 ${selectedChatId === chat.id ? 'bg-zinc-900' : ''}`}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500 shrink-0 overflow-hidden">
                                                    {profilePics[chat.id] ? (
                                                        <img src={profilePics[chat.id]} alt={chat.push_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{chat.push_name?.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 pb-3 border-b border-zinc-900 group-last:border-none transition-colors">
                                                    <div className="flex justify-between items-baseline mb-1 pt-1">
                                                        <h3 className={`text-sm font-semibold truncate ${selectedChatId === chat.id ? 'text-zinc-100' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
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
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                                                        {chat.unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="p-4 pb-2">
                            <h1 className="text-xl font-bold text-zinc-100 mb-1">AI Configuration</h1>
                            <p className="text-xs text-zinc-500">Manage your AI assistant settings</p>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                            {/* Model Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Model Selection</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro'].map((model) => (
                                        <button key={model} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-all group text-left">
                                            <span className="text-sm text-zinc-300 group-hover:text-white">{model}</span>
                                            <div className={`w-4 h-4 rounded-full border border-zinc-600 ${model === 'GPT-4o' ? 'bg-emerald-500 border-emerald-500' : ''}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Personality */}
                            <div className="space-y-3">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Personality</label>
                                <textarea
                                    className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 resize-none"
                                    placeholder="Describe how the AI should behave..."
                                    defaultValue="You are a helpful assistant for Ferrer Studio CRM. Be professional, concise, and friendly."
                                />
                            </div>

                            {/* Settings */}
                            <div className="space-y-3">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Settings</label>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                                        <span className="text-sm text-zinc-300">Auto-reply</span>
                                        <div className="w-10 h-5 bg-emerald-500/20 rounded-full relative cursor-pointer">
                                            <div className="absolute right-1 top-1 w-3 h-3 bg-emerald-500 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                                        <span className="text-sm text-zinc-300">Context Awareness</span>
                                        <div className="w-10 h-5 bg-emerald-500/20 rounded-full relative cursor-pointer">
                                            <div className="absolute right-1 top-1 w-3 h-3 bg-emerald-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Edit Modal */}
            {isProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#09090b] rounded-xl border border-zinc-800 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#09090b]">
                            <h2 className="text-lg font-semibold text-zinc-100">Edit Profile</h2>
                            <button
                                onClick={() => setIsProfileOpen(false)}
                                className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Profile Picture */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
                                        {wahaProfile?.picture ? (
                                            <img src={wahaProfile.picture} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-zinc-500">{wahaProfile?.pushName?.charAt(0) || 'M'}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                            <Camera size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        disabled={isSavingProfile}
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">Click to change profile picture</p>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        placeholder="Your name"
                                    />
                                    <Edit2 size={16} className="absolute right-3 top-3 text-zinc-500" />
                                </div>
                            </div>

                            {/* Status Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">About (Status)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        placeholder="Hey there! I am using WhatsApp."
                                    />
                                    <Edit2 size={16} className="absolute right-3 top-3 text-zinc-500" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-zinc-800 bg-[#09090b] flex justify-end gap-2">
                            <button
                                onClick={() => setIsProfileOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSavingProfile ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
