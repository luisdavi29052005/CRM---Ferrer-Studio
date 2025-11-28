import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchProfiles, updateProfile } from '../services/supabaseService';
import { Check, X, Shield, User, MoreVertical, Loader2, ChevronDown } from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    role?: 'admin' | 'user';
    status?: 'active' | 'pending' | 'blocked';
    created_at?: string;
    avatar_url?: string;
}

export const UserManagement: React.FC = () => {
    const { t } = useTranslation();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProfiles = async () => {
        setLoading(true);
        const data = await fetchProfiles();
        setProfiles(data as Profile[]);
        setLoading(false);
    };

    useEffect(() => {
        loadProfiles();
    }, []);

    const handleStatusChange = async (id: string, newStatus: 'active' | 'pending' | 'blocked') => {
        const { error } = await updateProfile(id, { status: newStatus });
        if (!error) {
            setProfiles(profiles.map(p => p.id === id ? { ...p, status: newStatus } : p));
        } else {
            console.error("Failed to update status", error);
        }
    };

    const handleRoleChange = async (id: string, newRole: 'admin' | 'user') => {
        const { error } = await updateProfile(id, { role: newRole });
        if (!error) {
            setProfiles(profiles.map(p => p.id === id ? { ...p, role: newRole } : p));
        } else {
            console.error("Failed to update role", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-bronze-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 h-full flex flex-col overflow-hidden">
            {/* Minimalist Header */}
            <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/5">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">{t('team.title')}</h2>
                    <p className="text-zinc-500 text-sm mt-2 font-medium">{t('team.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-500 font-medium">{t('team.total_users')}:</span>
                    <span className="text-zinc-200 font-bold">{profiles.length}</span>
                </div>
            </div>

            {/* Table Container - No Box */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="overflow-auto custom-scrollbar flex-1 -mx-4 px-4">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
                            <tr>
                                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('team.table.user')}</th>
                                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('team.table.role')}</th>
                                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('team.table.status')}</th>
                                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('team.table.joined')}</th>
                                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 text-right">{t('team.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {profiles.map((profile) => (
                                <tr key={profile.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt={profile.email} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-zinc-300">{profile.email.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <span className="text-zinc-200 font-medium text-sm">{profile.email}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            {(profile.role || 'user') === 'admin' ? <Shield size={14} className="text-bronze-500" /> : <User size={14} className="text-zinc-600" />}
                                            <div className="relative group/select">
                                                <select
                                                    value={profile.role || 'user'}
                                                    onChange={(e) => handleRoleChange(profile.id, e.target.value as 'admin' | 'user')}
                                                    className="appearance-none bg-transparent text-zinc-300 text-sm font-medium focus:outline-none cursor-pointer pr-6 py-1 rounded hover:bg-white/5 transition-colors"
                                                >
                                                    <option value="admin" className="bg-zinc-900 text-zinc-300">{t('team.roles.admin')}</option>
                                                    <option value="user" className="bg-zinc-900 text-zinc-300">{t('team.roles.user')}</option>
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 group-hover/select:text-zinc-400 pointer-events-none transition-colors" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${(profile.status || 'pending') === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : (profile.status || 'pending') === 'pending'
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {t(`team.status.${profile.status || 'pending'}`)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-zinc-500 font-mono">
                                        {new Date(profile.created_at || Date.now()).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(profile.status || 'pending') === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusChange(profile.id, 'active')}
                                                    className="p-1.5 rounded-md hover:bg-emerald-500/10 text-zinc-600 hover:text-emerald-500 transition-colors"
                                                    title="Approve"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            {(profile.status || 'pending') !== 'blocked' ? (
                                                <button
                                                    onClick={() => handleStatusChange(profile.id, 'blocked')}
                                                    className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors"
                                                    title="Block"
                                                >
                                                    <X size={14} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStatusChange(profile.id, 'active')}
                                                    className="p-1.5 rounded-md hover:bg-emerald-500/10 text-zinc-600 hover:text-emerald-500 transition-colors"
                                                    title="Unblock"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
