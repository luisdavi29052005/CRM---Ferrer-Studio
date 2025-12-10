import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Layers, Trash2, Clock, MessageSquareHeart, RefreshCw, Search, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { SocialProofConfig, SocialProofItem } from '../types';
import { fetchSocialProofItems, createSocialProofItem, deleteSocialProofItem } from '../services/supabaseService';
import { socialProofAiService } from '../services/socialProofAiService';
import PhoneScreen from './social-proof/PhoneScreen';
import { ChatConfig, Message } from './social-proof/types';
import { DEFAULT_CHAT_CONFIG } from './social-proof/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialProofAlbumViewProps {
    album: SocialProofConfig;
    onBack: () => void;
}

export const SocialProofAlbumView: React.FC<SocialProofAlbumViewProps> = ({ album, onBack }) => {
    const [items, setItems] = useState<SocialProofItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SocialProofItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Phone preview config
    const [chatConfig, setChatConfig] = useState<ChatConfig>({
        ...DEFAULT_CHAT_CONFIG,
        contactName: 'Cliente',
        messages: []
    });

    const loadItems = async () => {
        setLoading(true);
        const data = await fetchSocialProofItems(album.id);
        setItems(data);
        setLoading(false);
    };

    useEffect(() => {
        loadItems();
    }, [album.id]);

    const convertToPhoneMessages = (item: SocialProofItem): Message[] => {
        return (item.messages || []).map(m => ({
            id: m.id,
            type: m.type || 'text',
            content: m.text,
            isMe: m.fromMe,
            time: m.time,
            status: m.status || 'read'
        }));
    };

    useEffect(() => {
        if (selectedItem) {
            setChatConfig(prev => ({
                ...prev,
                contactName: selectedItem.contact_name,
                contactAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedItem.contact_name.replace(/\s/g, '')}&backgroundColor=b6e3f4`,
                messages: convertToPhoneMessages(selectedItem)
            }));
        } else {
            setChatConfig(prev => ({
                ...prev,
                contactName: 'Cliente',
                contactAvatar: DEFAULT_CHAT_CONFIG.contactAvatar,
                messages: []
            }));
        }
    }, [selectedItem]);

    const handleGenerate = async () => {
        if (!album.category) return;

        setGenerating(true);
        try {
            const result = await socialProofAiService.generateFeedback(
                album.category,
                album.model || 'gemini-2.0-flash-exp',
                album.ai_prompt,
                album.temperature
            );

            if (result) {
                const phoneMessages: Message[] = result.messages.map(m => ({
                    id: m.id,
                    type: (m.type as 'text' | 'audio') || 'text',
                    content: m.text,
                    isMe: m.fromMe,
                    time: m.time,
                    status: m.status || 'read'
                }));

                setChatConfig(prev => ({
                    ...prev,
                    contactName: result.contact_name,
                    contactAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.contact_name.replace(/\s/g, '')}&backgroundColor=b6e3f4`,
                    messages: phoneMessages
                }));

                const newItem = await createSocialProofItem({
                    album_id: album.id,
                    contact_name: result.contact_name,
                    messages: result.messages
                });

                if (newItem) {
                    setItems(prev => [newItem, ...prev]);
                    setSelectedItem(newItem);
                }
            } else {
                alert('Erro ao gerar. Tente outro modelo ou aguarde alguns segundos.');
            }
        } catch (error: any) {
            console.error('Error generating feedback:', error);
            if (error?.message?.includes('429') || error?.message?.includes('quota')) {
                alert('Limite de requisições atingido. Aguarde alguns segundos ou troque para outro modelo AI.');
            } else {
                alert('Erro ao gerar feedback. Verifique sua chave API.');
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateBatch = async () => {
        setGenerating(true);
        try {
            const results = await socialProofAiService.generateBatchFeedback(
                album.category,
                album.model || 'gemini-2.0-flash-exp',
                3,
                album.ai_prompt,
                album.temperature
            );

            for (const result of results) {
                const newItem = await createSocialProofItem({
                    album_id: album.id,
                    contact_name: result.contact_name,
                    messages: result.messages
                });
                if (newItem) {
                    setItems(prev => [newItem, ...prev]);
                }
            }

            if (results.length > 0) {
                loadItems();
            }
        } catch (error: any) {
            console.error('Error generating batch:', error);
            if (error?.message?.includes('429') || error?.message?.includes('quota')) {
                alert('Limite de requisições atingido. Aguarde alguns segundos.');
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Excluir esta prova social?')) {
            await deleteSocialProofItem(id);
            if (selectedItem?.id === id) {
                setSelectedItem(null);
            }
            setItems(prev => prev.filter(i => i.id !== id));
        }
    };

    const handleDownload = async () => {
        const node = document.getElementById('phone-preview-capture');
        if (!node) return;

        try {
            const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `prova-social-${chatConfig.contactName || 'cliente'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Error downloading image:', err);
            alert('Erro ao baixar a imagem.');
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const filteredItems = items.filter(i =>
        i.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col pt-8">
            {/* Header - Same pattern as Agents */}
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/20 flex items-center justify-center">
                        <MessageSquareHeart size={18} className="text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-100">{album.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-medium text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                {album.category}
                            </span>
                            <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                <Sparkles size={10} />
                                {album.model?.split('-').slice(0, 2).join(' ') || 'gemini'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - Two Column Layout (Responsive + Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col lg:flex-row gap-6 min-h-full">
                    {/* Left Column - Phone Preview + Generate Buttons */}
                    <div className="flex flex-col gap-4 items-center lg:items-start shrink-0">
                        <div id="phone-preview-capture" className="rounded-[40px] overflow-hidden">
                            <PhoneScreen
                                config={chatConfig}
                                setConfig={setChatConfig}
                                height={680}
                            />
                        </div>

                        {/* Generate Buttons */}
                        <div className="space-y-2" style={{ width: Math.round(680 * (1408 / 3040)) + 'px' }}>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                            >
                                {generating ? (
                                    <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                    <Sparkles size={16} />
                                )}
                                {generating ? 'Gerando...' : 'Gerar Prova Social'}
                            </button>

                            <button
                                onClick={handleGenerateBatch}
                                disabled={generating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                <Layers size={16} />
                                Gerar em Lote (3x)
                            </button>

                            <button
                                onClick={handleDownload}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                            >
                                <Download size={16} />
                                Baixar Imagem
                            </button>
                        </div>
                    </div>

                    {/* Right Column - List Card - Same as Agents */}
                    <div className="flex-1 flex flex-col bg-[#0B0B0B] border border-white/10 rounded-xl overflow-hidden shadow-sm">
                        {/* Card Header with Search */}
                        <div className="p-4 border-b border-white/5">
                            <div className="relative w-full">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar provas..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/5 text-zinc-200 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all placeholder:text-zinc-700 text-sm hover:border-white/10"
                                />
                            </div>
                        </div>

                        {/* List Content */}
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-zinc-800 border-t-zinc-100 rounded-full animate-spin" />
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                                <MessageSquareHeart size={48} strokeWidth={1} className="opacity-20 mb-4" />
                                <p className="text-sm font-medium text-zinc-400">Nenhuma prova gerada</p>
                                <p className="text-xs mt-1 opacity-40">Clique em "Gerar Prova Social"</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                <AnimatePresence>
                                    {filteredItems.map(item => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            onClick={() => setSelectedItem(item)}
                                            className={`group flex items-center justify-between rounded-lg p-3 cursor-pointer transition-all duration-200 ${selectedItem?.id === item.id
                                                ? 'bg-emerald-500/10 border border-emerald-500/20'
                                                : 'bg-zinc-900/30 hover:bg-white/5 border border-transparent hover:border-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                                                    <img
                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.contact_name.replace(/\s/g, '')}&backgroundColor=b6e3f4`}
                                                        alt={item.contact_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                {/* Info */}
                                                <div className="flex flex-col">
                                                    <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                                                        {item.contact_name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-medium text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                            {item.messages?.length || 0} msgs
                                                        </span>
                                                        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {formatDate(item.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <button
                                                onClick={(e) => handleDeleteItem(e, item.id)}
                                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Excluir"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
