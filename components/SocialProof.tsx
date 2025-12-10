import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MessageSquareHeart, Sparkles, Edit2, Trash2, FolderOpen, ChevronRight } from 'lucide-react';
import { SocialProofConfig } from '../types';
import { fetchSocialProofs, deleteSocialProof, updateSocialProof } from '../services/supabaseService';
import { SocialProofEditor } from './SocialProofEditor';
import { SocialProofAlbumView } from './SocialProofAlbumView';
import { AnimatePresence, motion } from 'framer-motion';

export interface SocialProofHandle {
    handleCreate: () => void;
}

export const SocialProof = forwardRef<SocialProofHandle>((props, ref) => {
    const { t } = useTranslation();
    const [configs, setConfigs] = useState<SocialProofConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<SocialProofConfig | undefined>(undefined);
    const [selectedAlbum, setSelectedAlbum] = useState<SocialProofConfig | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const loadConfigs = async () => {
        setLoading(true);
        const data = await fetchSocialProofs();
        setConfigs(data);
        setLoading(false);
    };

    useEffect(() => {
        loadConfigs();
    }, []);

    useImperativeHandle(ref, () => ({
        handleCreate: () => {
            setSelectedConfig(undefined);
            setIsEditorOpen(true);
        }
    }));

    const handleEdit = (e: React.MouseEvent, config: SocialProofConfig) => {
        e.stopPropagation();
        setSelectedConfig(config);
        setIsEditorOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Excluir este álbum e todas as provas sociais?')) {
            await deleteSocialProof(id);
            loadConfigs();
        }
    };

    const handleToggleActive = async (e: React.MouseEvent, config: SocialProofConfig) => {
        e.stopPropagation();
        const newStatus = !config.is_active;
        setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, is_active: newStatus } : c));
        await updateSocialProof(config.id, { is_active: newStatus });
    };

    const handleSave = () => {
        setIsEditorOpen(false);
        loadConfigs();
    };

    const handleOpenAlbum = (config: SocialProofConfig) => {
        setSelectedAlbum(config);
    };

    const handleBackFromAlbum = () => {
        setSelectedAlbum(null);
        loadConfigs();
    };

    const filteredConfigs = configs.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // If viewing an album, show the album view
    if (selectedAlbum) {
        return (
            <SocialProofAlbumView
                album={selectedAlbum}
                onBack={handleBackFromAlbum}
            />
        );
    }

    return (
        <div className="h-full flex flex-col relative pt-8">
            {/* Main Card Container - Same as Agents */}
            <div className="flex-1 flex flex-col bg-[#0B0B0B] border border-white/10 rounded-xl overflow-hidden shadow-sm">

                {/* Card Header with Search */}
                <div className="p-4 border-b border-white/5">
                    <div className="relative w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar álbuns..."
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
                ) : filteredConfigs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                        <MessageSquareHeart size={48} strokeWidth={1} className="opacity-20 mb-4" />
                        <p className="text-sm font-medium text-zinc-400">Nenhum álbum encontrado</p>
                        <p className="text-xs mt-1 opacity-40">Crie seu primeiro álbum para começar</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {filteredConfigs.map(config => (
                            <motion.div
                                key={config.id}
                                layoutId={config.id}
                                onClick={() => handleOpenAlbum(config)}
                                className="group flex items-center justify-between bg-zinc-900/30 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-lg p-3 cursor-pointer transition-all duration-200"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                        <FolderOpen size={18} className="text-emerald-400" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{config.name}</h3>

                                            {/* Toggle Switch */}
                                            <button
                                                onClick={(e) => handleToggleActive(e, config)}
                                                className={`relative w-8 h-4 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${config.is_active ? 'bg-emerald-500/20' : 'bg-zinc-700/50'}`}
                                                title={config.is_active ? 'Desativar' : 'Ativar'}
                                            >
                                                <span
                                                    className={`absolute left-0.5 top-0.5 w-3 h-3 rounded-full transition-transform duration-200 ease-in-out shadow-sm ${config.is_active ? 'translate-x-4 bg-emerald-500' : 'translate-x-0 bg-zinc-400'}`}
                                                />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                {config.category}
                                            </span>
                                            <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                <Sparkles size={10} />
                                                {config.model?.split('-').slice(0, 2).join(' ') || 'gemini'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleEdit(e, config)}
                                            className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-white/10 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, config.id)}
                                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Editor Slide-over */}
            <AnimatePresence>
                {isEditorOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditorOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <SocialProofEditor
                            config={selectedConfig}
                            onClose={() => setIsEditorOpen(false)}
                            onSave={handleSave}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
});

SocialProof.displayName = 'SocialProof';
