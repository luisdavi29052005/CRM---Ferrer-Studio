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
        <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">{t('settings.system.title') || 'Configurações do Sistema'}</h2>
                <p className="text-zinc-500 text-sm mt-2 font-medium">{t('settings.system.description') || 'Configure parâmetros globais do sistema e conexões de API.'}</p>
            </div>

            <div className="flex-1 min-w-0">
                <div className="space-y-10">
                    <div className="space-y-6 max-w-xl">

                        {/* WAHA Configuration */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                <h4 className="text-sm font-medium text-zinc-300">WhatsApp API (WAHA)</h4>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${wahaStatus === 'WORKING' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    <span className="text-xs font-medium text-zinc-400">{wahaStatus === 'WORKING' ? 'Conectado' : 'Desconectado'}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">API URL</label>
                                <input
                                    type="text"
                                    value={systemSettings['waha_api_url'] || ''}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, waha_api_url: e.target.value })}
                                    className="w-full bg-transparent border-b border-zinc-800 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                                    placeholder="http://localhost:3000/api"
                                />
                            </div>
                        </div>

                        {/* Server Configuration */}
                        <div className="space-y-4 pt-4">
                            <h4 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">Servidor Backend</h4>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">URL do Servidor</label>
                                <input
                                    type="text"
                                    value={systemSettings['server_api_url'] || ''}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, server_api_url: e.target.value })}
                                    className="w-full bg-transparent border-b border-zinc-800 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                                    placeholder="http://localhost:3001"
                                />
                            </div>
                        </div>

                        {/* AI Configuration */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                <h4 className="text-sm font-medium text-zinc-300">Configuração de IA (Gemini)</h4>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${systemSettings['gemini_api_key'] ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                                    <span className="text-xs font-medium text-zinc-400">
                                        {systemSettings['gemini_api_key'] ? 'Configurado' : 'Não Configurado'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Chave da API Gemini</label>
                                <input
                                    type="password"
                                    value={systemSettings['gemini_api_key'] || ''}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, gemini_api_key: e.target.value })}
                                    className="w-full bg-transparent border-b border-zinc-800 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                                    placeholder="Insira sua Chave da API Google Gemini"
                                />
                            </div>
                        </div>

                        {/* Apify Configuration */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                <h4 className="text-sm font-medium text-zinc-300">Configuração Apify</h4>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${apifyStatus === 'active' ? 'bg-emerald-500' : apifyStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                                    <span className="text-xs font-medium text-zinc-400">
                                        {apifyStatus === 'active' ? 'Ativo' : apifyStatus === 'checking' ? 'Verificando...' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Token da API</label>
                                <input
                                    type="password"
                                    value={systemSettings['apify_api_token'] || ''}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, apify_api_token: e.target.value })}
                                    className="w-full bg-transparent border-b border-zinc-800 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                                    placeholder="Insira seu Token da API Apify"
                                />
                            </div>
                        </div>

                        {/* PayPal Configuration */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                <h4 className="text-sm font-medium text-zinc-300">Configuração PayPal</h4>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${paypalStatus === 'active' ? 'bg-emerald-500' : paypalStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                                    <span className="text-xs font-medium text-zinc-400">
                                        {paypalStatus === 'active' ? 'Ativo' : paypalStatus === 'checking' ? 'Verificando...' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Ambiente</label>
                                <select
                                    value={systemSettings['paypal_env'] || 'SANDBOX'}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, paypal_env: e.target.value })}
                                    className="w-full bg-zinc-900 border-b border-zinc-800 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                                >
                                    <option value="SANDBOX">Sandbox</option>
                                    <option value="PRODUCTION">Produção</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">ID do Cliente</label>
                                <input
                                    type="text"
                                    value={systemSettings['paypal_client_id'] || ''}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, paypal_client_id: e.target.value })}
                                    className="w-full bg-transparent border-b border-zinc-800 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Segredo do Cliente</label>
                                <input
                                    type="password"
                                    value={systemSettings['paypal_secret'] || ''}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, paypal_secret: e.target.value })}
                                    className="w-full bg-transparent border-b border-zinc-800 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSaveSystemSettings}
                                disabled={loading}
                                className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-black px-6 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                            >
                                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
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
