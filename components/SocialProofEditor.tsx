import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { SocialProofConfig } from '../types';
import { createSocialProof, updateSocialProof, fetchApifyCategories } from '../services/supabaseService';
import { motion } from 'framer-motion';

interface SocialProofEditorProps {
    config?: SocialProofConfig;
    onClose: () => void;
    onSave: () => void;
}

export const SocialProofEditor: React.FC<SocialProofEditorProps> = ({ config, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [formData, setFormData] = useState<Partial<SocialProofConfig>>({
        name: '',
        category: '',
        model: 'gemini-2.0-flash-exp',
        ai_prompt: '',
        temperature: 0.8,
        is_active: true,
        messages: []
    });

    // Available AI models (same as AgentEditor)
    const models = [
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental (Novo)' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Novo)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Mais Inteligente)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Equilibrado)' },
        { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B (Mais Rápido)' }
    ];

    useEffect(() => {
        const loadCategories = async () => {
            const cats = await fetchApifyCategories();
            setCategories(cats);
            if (!formData.category && cats.length > 0) {
                setFormData(prev => ({ ...prev, category: cats[0] }));
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        if (config) {
            setFormData(config);
        }
    }, [config]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.category) return;

        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                messages: []
            } as Omit<SocialProofConfig, 'id' | 'created_at' | 'updated_at'>;

            if (config) {
                await updateSocialProof(config.id, dataToSave);
            } else {
                await createSocialProof(dataToSave);
            }
            onSave();
        } catch (error) {
            console.error('Error saving social proof:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#0B0B0B] border-l border-white/10 shadow-2xl z-50 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                    <h2 className="text-lg font-bold text-zinc-100">
                        {config ? 'Editar Álbum' : 'Criar Novo Álbum'}
                    </h2>
                    <p className="text-xs text-zinc-500">Configure a categoria e modelo de IA</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Configuração do Álbum</h3>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500">Nome do Álbum</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="ex: Feedbacks Lanchonete"
                            className="w-full bg-black/20 border border-white/10 text-zinc-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 text-sm hover:border-white/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500">Categoria</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 text-zinc-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 text-sm appearance-none hover:border-white/20"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* AI Configuration */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Configuração AI</h3>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500">Modelo AI</label>
                        <select
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 text-zinc-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 text-sm appearance-none hover:border-white/20"
                        >
                            {models.map(m => (
                                <option key={m.id} value={m.id} className="bg-zinc-900">{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500">Prompt Customizado (opcional)</label>
                        <textarea
                            value={formData.ai_prompt || ''}
                            onChange={(e) => setFormData({ ...formData, ai_prompt: e.target.value })}
                            placeholder="Instruções adicionais para a IA gerar o feedback..."
                            rows={4}
                            className="w-full bg-black/20 border border-white/10 text-zinc-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 text-sm resize-none hover:border-white/20"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-medium text-zinc-500">Criatividade</label>
                            <span className="text-xs font-mono text-zinc-400">{formData.temperature}</span>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={formData.temperature}
                            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
                            <span>Preciso</span>
                            <span>Equilibrado</span>
                            <span>Criativo</span>
                        </div>
                    </div>
                </div>

                {/* Toggle Active */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="space-y-0.5">
                        <label className="text-xs font-medium text-zinc-500">Status</label>
                        <p className="text-[10px] text-zinc-600">Álbuns ativos aparecem na lista</p>
                    </div>
                    <button
                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500/50 ${formData.is_active ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-[#0B0B0B]/95 backdrop-blur flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !formData.name}
                    className="flex items-center gap-2 px-6 py-2 bg-zinc-100 hover:bg-white text-black rounded-lg text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-zinc-800 border-t-zinc-100 rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save size={16} />
                            <span>{config ? 'Salvar Alterações' : 'Criar Álbum'}</span>
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};
