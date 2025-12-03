// @ts-nocheck
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Globe, Zap, Save, Check, AlertCircle, RefreshCw, Smartphone, CreditCard, Database } from 'lucide-react';
import { updateProfile } from '../services/supabaseService';
import { settingsService } from '../services/settingsService';

interface SettingsProps {
    user: {
        id: string;
        name: string;
        email: string;
        avatar: string;
    };
    wahaStatus: 'WORKING' | 'FAILED' | 'STOPPED' | 'STARTING' | 'UNKNOWN';
    onUpdateProfile: () => void;
    isAdmin: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ user, wahaStatus, onUpdateProfile, isAdmin }) => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState<'account' | 'general' | 'integrations' | 'system'>('account');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Form States
    const [name, setName] = useState(user.name);
    const [avatarUrl, setAvatarUrl] = useState(user.avatar);





    const handleSaveProfile = async () => {
        setLoading(true);
        setSuccess('');
        setError('');
        try {
            await updateProfile(user.id, { full_name: name, avatar_url: avatarUrl });
            onUpdateProfile();
            setSuccess(t('settings.profile_updated'));
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('i18nextLng', lng);
    };

    const tabs = [
        { id: 'account', label: t('settings.tabs.account'), icon: User },
        { id: 'general', label: t('settings.tabs.general'), icon: Globe },
        { id: 'general', label: t('settings.tabs.general'), icon: Globe },
    ];

    return (
        <div className="flex flex-col md:flex-row h-full max-w-5xl mx-auto p-4 md:p-8 gap-6 md:gap-12">
            {/* Minimalist Sidebar */}
            <div className="w-full md:w-56 flex-shrink-0">
                <h2 className="text-2xl font-bold text-zinc-100 mb-8 tracking-tight">{t('settings.title')}</h2>
                <nav className="space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-0 py-2 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'text-zinc-100'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area - No Borders/Boxes */}
            <div className="flex-1 min-w-0 pt-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* ACCOUNT SETTINGS */}
                        {activeTab === 'account' && (
                            <div className="space-y-10">
                                <div>
                                    <h3 className="text-lg font-semibold text-zinc-100 mb-1">{t('settings.account.profile_header')}</h3>
                                    <p className="text-sm text-zinc-500">{t('settings.account.profile_subheader')}</p>
                                </div>

                                <div className="space-y-8 max-w-md">
                                    <div className="flex items-start gap-6">
                                        <div className="w-16 h-16 rounded-full bg-zinc-900 overflow-hidden shrink-0">
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t('settings.account.avatar_url')}</label>
                                                <input
                                                    type="text"
                                                    value={avatarUrl}
                                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                                    className="w-full bg-transparent border-b border-zinc-800 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-700"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t('settings.account.full_name')}</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-transparent border-b border-zinc-800 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t('settings.account.email')}</label>
                                        <input
                                            type="email"
                                            value={user.email}
                                            disabled
                                            className="w-full bg-transparent border-b border-zinc-800 py-2 text-sm text-zinc-500 cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            onClick={handleSaveProfile}
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
                        )}

                        {/* GENERAL SETTINGS */}
                        {activeTab === 'general' && (
                            <div className="space-y-10">
                                <div>
                                    <h3 className="text-lg font-semibold text-zinc-100 mb-1">{t('settings.general.language_header')}</h3>
                                    <p className="text-sm text-zinc-500">{t('settings.general.language_subheader')}</p>
                                </div>

                                <div className="space-y-4 max-w-sm">
                                    {[
                                        { code: 'en', name: 'English', flag: '🇺🇸' },
                                        { code: 'pt', name: 'Português', flag: '🇧🇷' },
                                        { code: 'es', name: 'Español', flag: '🇪🇸' }
                                    ].map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => changeLanguage(lang.code)}
                                            className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all text-left group ${i18n.language.startsWith(lang.code)
                                                ? 'bg-zinc-900/50 text-zinc-100'
                                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{lang.flag}</span>
                                            <span className="font-medium text-sm">{lang.name}</span>
                                            {i18n.language.startsWith(lang.code) && <Check size={14} className="ml-auto text-zinc-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}



                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
