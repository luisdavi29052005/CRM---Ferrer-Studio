import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Bot, Sparkles, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Agent } from '../types';
import { createAgent, updateAgent, fetchApifyCategories, uploadAgentAvatar } from '../services/supabaseService';
import { motion } from 'framer-motion';

interface AgentEditorProps {
    agent?: Agent;
    onClose: () => void;
    onSave: () => void;
}

export const AgentEditor: React.FC<AgentEditorProps> = ({ agent, onClose, onSave }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [formData, setFormData] = useState<Partial<Agent>>({
        name: '',
        description: '',
        category: '',
        model: 'gemini-1.5-flash',
        prompt: '',
        temperature: 0.7,
        is_active: true,
        avatar_url: ''
    });

    useEffect(() => {
        const loadCategories = async () => {
            const cats = await fetchApifyCategories();
            setCategories(cats);
            // Set default category if not set and categories exist
            if (!formData.category && cats.length > 0) {
                setFormData(prev => ({ ...prev, category: cats[0] }));
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        if (agent) {
            setFormData(agent);
        }
    }, [agent]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const { url, error } = await uploadAgentAvatar(file);
            if (error) {
                alert('Erro ao fazer upload da imagem: ' + error);
                return;
            }
            if (url) {
                setFormData(prev => ({ ...prev, avatar_url: url }));
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.model) return;

        setLoading(true);
        try {
            if (agent) {
                await updateAgent(agent.id, formData);
            } else {
                await createAgent(formData as Omit<Agent, 'id' | 'created_at'>);
            }
            onSave();
        } catch (error) {
            console.error('Error saving agent:', error);
        } finally {
            setLoading(false);
        }
    };

    // const categories = ['Geral', 'Vendas', 'Suporte', 'Marketing', 'Técnico']; // Removed hardcoded
    const models = [
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental (Novo)' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Novo)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Mais Inteligente)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Equilibrado)' },
        { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B (Mais Rápido)' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#0B0B0B] border-l border-white/10 shadow-2xl z-50 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-900/50 border border-white/5 flex items-center justify-center">
                        <Bot size={20} className="text-zinc-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-100">
                            {agent ? 'Editar Agente' : 'Criar Novo Agente'}
                        </h2>
                        <p className="text-xs text-zinc-500">Configure seu assistente de IA</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Informações Básicas</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500">Nome do Agente</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="ex: Assistente de Vendas"
                                className="w-full bg-black/20 border border-white/10 text-zinc-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all placeholder:text-zinc-700 text-sm hover:border-white/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500">Categoria</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 text-zinc-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all text-sm appearance-none hover:border-white/20"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500">Descrição</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descreva brevemente o que este agente faz..."
                            rows={2}
                            className="w-full bg-black/20 border border-white/10 text-zinc-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all placeholder:text-zinc-700 text-sm resize-none hover:border-white/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500">Avatar</label>
                        <div className="flex items-center gap-4">
                            <div
                                onClick={() => document.getElementById('avatar-upload')?.click()}
                                className="w-16 h-16 rounded-full bg-black/20 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-white/30 transition-all group relative"
                            >
                                {formData.avatar_url ? (
                                    <>
                                        <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ImageIcon size={20} className="text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <ImageIcon size={24} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                                <div className="text-xs text-zinc-500">
                                    <p className="font-medium text-zinc-400 mb-1">Clique na imagem para alterar</p>
                                    <p>Recomendado: 400x400px (JPG, PNG)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* AI Configuration */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Configuração do Modelo</h3>
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-500 font-medium">Desenvolvido por Gemini</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500">Modelo</label>
                        <select
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 text-zinc-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all text-sm appearance-none hover:border-white/20"
                        >
                            {models.map(model => (
                                <option key={model.id} value={model.id} className="bg-zinc-900">{model.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-medium text-zinc-500">Prompt do Sistema</label>
                            <span className="text-[10px] text-zinc-600">Defina a persona e regras do agente</span>
                        </div>
                        <textarea
                            value={formData.prompt}
                            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                            placeholder="Você é um assistente útil..."
                            rows={12}
                            className="w-full bg-black/20 border border-white/10 text-zinc-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all placeholder:text-zinc-700 text-sm font-mono leading-relaxed resize-none hover:border-white/20"
                        />
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-medium text-zinc-500">Temperatura (Criatividade)</label>
                            <span className="text-xs font-mono text-zinc-400">{formData.temperature}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={formData.temperature}
                            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-500"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
                            <span>Preciso</span>
                            <span>Equilibrado</span>
                            <span>Criativo</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                        <label className="text-xs font-medium text-zinc-500">Humanizar Mensagens</label>
                        <p className="text-[10px] text-zinc-600">Divide textos longos em múltiplas mensagens</p>
                    </div>
                    <button
                        onClick={() => setFormData({ ...formData, split_messages: !formData.split_messages })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 focus:ring-offset-black ${formData.split_messages ? 'bg-zinc-200' : 'bg-zinc-800'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${formData.split_messages ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-[#0B0B0B]/95 backdrop-blur flex justify-between items-center">
                {agent && (
                    <button className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium">
                        <Trash2 size={16} />
                        <span>Excluir</span>
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-zinc-100 hover:bg-white text-black rounded-lg text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-zinc-800 border-t-zinc-100 rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={16} />
                                <span>{agent ? 'Salvar Alterações' : 'Criar Agente'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div >
    );
};
