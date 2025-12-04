import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Bot, Search, MoreVertical, Edit2, Trash2, Sparkles } from 'lucide-react';
import { Agent } from '../types';
import { fetchAgents, deleteAgent, updateAgent } from '../services/supabaseService';
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

    const handleToggleStatus = async (e: React.MouseEvent, agent: Agent) => {
        e.stopPropagation();
        // Optimistic update
        const newStatus = !agent.is_active;
        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, is_active: newStatus } : a));

        await updateAgent(agent.id, { is_active: newStatus });
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
        <div className="h-full flex flex-col relative pt-8"> {/* Added pt-8 for vertical spacing */}

            {/* Main Card Container */}
            <div className="flex-1 flex flex-col bg-[#0B0B0B] border border-white/10 rounded-xl overflow-hidden shadow-sm">

                {/* Card Header with Search */}
                <div className="p-4 border-b border-white/5">
                    <div className="relative w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar agentes..."
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
                ) : filteredAgents.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                        <Bot size={48} strokeWidth={1} className="opacity-20 mb-4" />
                        <p className="text-sm font-medium text-zinc-400">Nenhum agente encontrado</p>
                        <p className="text-xs mt-1 opacity-40">Crie seu primeiro agente de IA para começar</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {filteredAgents.map(agent => (
                            <motion.div
                                key={agent.id}
                                layoutId={agent.id}
                                onClick={() => handleEdit(agent)}
                                className="group flex items-center justify-between bg-zinc-900/30 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-lg p-3 cursor-pointer transition-all duration-200"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                        {agent.avatar_url ? (
                                            <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <Bot size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{agent.name}</h3>

                                            {/* Toggle Switch */}
                                            <button
                                                onClick={(e) => handleToggleStatus(e, agent)}
                                                className={`relative w-8 h-4 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${agent.is_active ? 'bg-emerald-500/20' : 'bg-zinc-700/50'}`}
                                                title={agent.is_active ? 'Desativar agente' : 'Ativar agente'}
                                            >
                                                <span
                                                    className={`absolute left-0.5 top-0.5 w-3 h-3 rounded-full transition-transform duration-200 ease-in-out shadow-sm ${agent.is_active ? 'translate-x-4 bg-emerald-500' : 'translate-x-0 bg-zinc-400'}`}
                                                />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                {agent.category}
                                            </span>
                                            <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                <Sparkles size={10} />
                                                {agent.model}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(agent);
                                        }}
                                        className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-white/10 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, agent.id)}
                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

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
