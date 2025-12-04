// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Save, Check, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { checkApifyStatus, checkPaypalStatus } from '../services/supabaseService';

interface SystemSettingsProps {
    isAdmin: boolean;
    wahaStatus: 'WORKING' | 'FAILED' | 'STOPPED' | 'STARTING' | 'UNKNOWN';
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ isAdmin, wahaStatus }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [systemSettings, setSystemSettings] = useState<{ [key: string]: string }>({});
    const [apifyStatus, setApifyStatus] = useState<'active' | 'inactive' | 'checking'>('checking');
    const [paypalStatus, setPaypalStatus] = useState<'active' | 'inactive' | 'checking'>('checking');

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (systemSettings['apify_api_token']) {
            checkApify();
        } else {
            setApifyStatus('inactive');
        }

        if (systemSettings['paypal_client_id'] && systemSettings['paypal_secret']) {
            checkPaypal();
        } else {
            setPaypalStatus('inactive');
        }
    }, [systemSettings]);

    const loadSettings = async () => {
        const settings = await settingsService.fetchSettings();
        setSystemSettings(settings);
    };

    const checkApify = async () => {
        setApifyStatus('checking');
        const isActive = await checkApifyStatus(systemSettings['apify_api_token']);
        setApifyStatus(isActive ? 'active' : 'inactive');
    };

    const checkPaypal = async () => {
        setPaypalStatus('checking');
        const isActive = await checkPaypalStatus(
            systemSettings['paypal_client_id'],
            systemSettings['paypal_secret'],
            systemSettings['paypal_env']
        );
        setPaypalStatus(isActive ? 'active' : 'inactive');
    };

    const handleSaveSystemSettings = async () => {
        setLoading(true);
        setSuccess('');
        setError('');
        try {
            for (const [key, value] of Object.entries(systemSettings)) {
                await settingsService.updateSetting(key, value);
            }
            setSuccess(t('settings.system_updated') || 'Configurações do sistema atualizadas com sucesso');
            // Re-check statuses after save
            checkApify();
            checkPaypal();
        } catch (err: any) {
            setError(err.message || 'Falha ao atualizar configurações do sistema');
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500">
                Acesso Negado
            </div>
        );
    }

    return (
        <div className="p-8 h-full flex flex-col overflow-hidden relative">
            {/* 1. Page Header - Outside the card */}
            <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/5 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">{t('settings.system.title') || 'Configurações do Sistema'}</h2>
                    <p className="text-zinc-500 text-sm mt-2 font-medium">{t('settings.system.description') || 'Configure parâmetros globais do sistema e conexões de API.'}</p>
                </div>
            </div>

            {/* 2. Content Card */}
            <div className="flex-1 min-h-0 overflow-auto">
                <div className="bg-[#09090b] border border-white/5 rounded-2xl shadow-xl p-8">
                    <div className="space-y-8 max-w-2xl">

                        {/* WAHA Configuration */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">WhatsApp API (WAHA)</h4>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${wahaStatus === 'WORKING' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    <span className="text-xs font-medium text-zinc-400">{wahaStatus === 'WORKING' ? 'Conectado' : 'Desconectado'}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">API URL</label>
                                <input
                                    type="text"
                                    value={systemSettings['waha_api_url'] || ''}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, waha_api_url: e.target.value })}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                                    placeholder="http://localhost:3000/api"
                                />
                            </div>
                        </div>

                        {/* Server Configuration */}
                        <div className="space-y-4">
                            <div className="border-b border-white/5 pb-3">
                                <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">Servidor Backend</h4>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">URL do Servidor</label>
                                <input
                                    type="text"
                                    value={systemSettings['server_api_url'] || ''}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, server_api_url: e.target.value })}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                                    placeholder="http://localhost:3001"
                                />
                            </div>
                        </div>

                        {/* AI Configuration */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">Configuração de IA (Gemini)</h4>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${systemSettings['gemini_api_key'] ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                                    <span className="text-xs font-medium text-zinc-400">
                                        {systemSettings['gemini_api_key'] ? 'Configurado' : 'Não Configurado'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Chave da API Gemini</label>
                                <input
                                    type="password"
                                    value={systemSettings['gemini_api_key'] || ''}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, gemini_api_key: e.target.value })}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                                    placeholder="Insira sua Chave da API Google Gemini"
                                />
                            </div>
                        </div>

                        {/* Apify Configuration */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">Configuração Apify</h4>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${apifyStatus === 'active' ? 'bg-emerald-500' : apifyStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                                    <span className="text-xs font-medium text-zinc-400">
                                        {apifyStatus === 'active' ? 'Ativo' : apifyStatus === 'checking' ? 'Verificando...' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Token da API</label>
                                <input
                                    type="password"
                                    value={systemSettings['apify_api_token'] || ''}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, apify_api_token: e.target.value })}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                                    placeholder="Insira seu Token da API Apify"
                                />
                            </div>
                        </div>

                        {/* PayPal Configuration */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">Configuração PayPal</h4>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${paypalStatus === 'active' ? 'bg-emerald-500' : paypalStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                                    <span className="text-xs font-medium text-zinc-400">
                                        {paypalStatus === 'active' ? 'Ativo' : paypalStatus === 'checking' ? 'Verificando...' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Ambiente</label>
                                    <select
                                        value={systemSettings['paypal_env'] || 'SANDBOX'}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, paypal_env: e.target.value })}
                                        className="w-full bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors appearance-none"
                                    >
                                        <option value="SANDBOX">Sandbox</option>
                                        <option value="PRODUCTION">Produção</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">ID do Cliente</label>
                                    <input
                                        type="text"
                                        value={systemSettings['paypal_client_id'] || ''}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, paypal_client_id: e.target.value })}
                                        className="w-full bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                                        placeholder="Client ID"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Segredo do Cliente</label>
                                <input
                                    type="password"
                                    value={systemSettings['paypal_secret'] || ''}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, paypal_secret: e.target.value })}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                                    placeholder="Client Secret"
                                />
                            </div>
                        </div>

                        {/* Save Button & Feedback */}
                        <div className="pt-6 border-t border-white/5">
                            <button
                                onClick={handleSaveSystemSettings}
                                disabled={loading}
                                className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide transition-all disabled:opacity-50"
                            >
                                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                {t('settings.save_changes')}
                            </button>

                            {success && (
                                <div className="mt-4 flex items-center gap-2 text-emerald-500 text-sm">
                                    <Check size={14} /> {success}
                                </div>
                            )}
                            {error && (
                                <div className="mt-4 flex items-center gap-2 text-red-500 text-sm">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
