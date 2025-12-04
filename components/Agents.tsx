import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Bot, Search, MoreVertical, Edit2, Trash2, Sparkles } from 'lucide-react';
import { Agent } from '../types';
import { fetchAgents, deleteAgent } from '../services/supabaseService';
import { AgentEditor } from './AgentEditor';
import { AnimatePresence, motion } from 'framer-motion';

export interface AgentsHandle {
    handleCreate: () => void;
}

export const Agents = forwardRef<AgentsHandle>((props, ref) => {
    const { t } = useTranslation();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    const loadAgents = async () => {
        setLoading(true);
        const data = await fetchAgents();
        setAgents(data);
        setLoading(false);
    };

    useEffect(() => {
        loadAgents();
    }, []);

    const handleCreate = () => {
        setSelectedAgent(undefined);
        setIsEditorOpen(true);
    };

    useImperativeHandle(ref, () => ({
        handleCreate
    }));

    const handleEdit = (agent: Agent) => {
        setSelectedAgent(agent);
        setIsEditorOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir este agente?')) {
            await deleteAgent(id);
            loadAgents();
        }
    };

    const handleSave = () => {
        setIsEditorOpen(false);
        loadAgents();
    };

    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col relative">
            {/* Search & Filters - Moved up since header is gone */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar agentes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 text-zinc-200 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all placeholder:text-zinc-700 text-sm hover:border-white/20"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-zinc-800 border-t-zinc-100 rounded-full animate-spin" />
                </div>
            ) : filteredAgents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                    <Bot size={48} strokeWidth={1} className="opacity-20 mb-4" />
                    <p className="text-sm font-medium text-zinc-400">Nenhum agente encontrado</p>
                    <p className="text-xs mt-1 opacity-40">Crie seu primeiro agente de IA para começar</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 overflow-y-auto custom-scrollbar">
                    {filteredAgents.map(agent => (
                        <motion.div
                            key={agent.id}
                            layoutId={agent.id}
                            onClick={() => handleEdit(agent)}
                            className="group relative bg-black/20 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-5 cursor-pointer transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-900/50 border border-white/5 flex items-center justify-center overflow-hidden">
                                        {agent.avatar_url ? (
                                            <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <Bot size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{agent.name}</h3>
                                        <span className="inline-flex items-center text-[10px] font-medium text-zinc-500 mt-0.5">
                                            {agent.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                        onClick={(e) => handleDelete(e, agent.id)}
                                        className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/5 rounded-md transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-zinc-500 line-clamp-2 mb-4 min-h-[2.5em] leading-relaxed">
                                {agent.description || "Nenhuma descrição fornecida."}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles size={12} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                    <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">{agent.model}</span>
                                </div>
                                <div className={`w-1.5 h-1.5 rounded-full ${agent.is_active ? 'bg-zinc-500 group-hover:bg-zinc-300' : 'bg-zinc-800'}`} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Editor Modal/Slide-over */}
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
                        <AgentEditor
                            agent={selectedAgent}
                            onClose={() => setIsEditorOpen(false)}
                            onSave={handleSave}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
});
