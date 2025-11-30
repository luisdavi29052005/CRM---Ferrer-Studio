import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Shield, Activity, Target, Trophy, Percent, Clock } from 'lucide-react';
import { Lead, ActivityItem } from '../types';

interface ProfileProps {
    user: {
        name: string;
        email: string;
        avatar: string;
        role: string;
    };
    leads: Lead[];
    activity: ActivityItem[];
}

export const Profile: React.FC<ProfileProps> = ({ user, leads, activity }) => {
    const { t } = useTranslation();

    // Calculate Stats
    const totalLeads = leads.length;
    const wonDeals = leads.filter(l => l.stage === 'Won').length;
    const conversionRate = totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(1) : '0.0';

    // Mock "Avg Response Time"
    const avgResponseTime = "2m";

    const stats = [
        { label: t('profile.total_leads'), value: totalLeads, icon: Target },
        { label: t('profile.won_deals'), value: wonDeals, icon: Trophy },
        { label: t('profile.conversion_rate'), value: `${conversionRate}%`, icon: Percent },
        { label: t('profile.avg_response'), value: avgResponseTime, icon: Clock },
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12">
            {/* Minimalist Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-6"
            >
                <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-900">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#050505]" title="Online"></div>
                </div>

                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">{user.name}</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 font-medium">
                        <div className="flex items-center gap-1.5">
                            <Mail size={14} />
                            <span>{user.email}</span>
                        </div>
                        <div className="w-1 h-1 bg-zinc-800 rounded-full"></div>
                        <div className="flex items-center gap-1.5">
                            <Shield size={14} />
                            <span className="capitalize">{user.role}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Clean Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-col gap-2"
                    >
                        <div className="flex items-center gap-2 text-zinc-500">
                            <stat.icon size={14} strokeWidth={2} />
                            <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <div className="text-3xl font-bold text-zinc-100 tracking-tight">{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Minimalist Activity Feed */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6 pt-4"
            >
                <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <Activity size={16} className="text-zinc-500" />
                    {t('profile.recent_activity')}
                </h2>

                <div className="relative border-l border-white/5 ml-2 space-y-8 pl-8 py-2">
                    {activity.length > 0 ? (
                        activity.slice(0, 8).map((item, i) => (
                            <div key={item.id} className="relative">
                                <div className="absolute -left-[37px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-[#050505]"></div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-zinc-300">
                                        <span className="font-medium text-zinc-100">{item.user}</span> {item.action} <span className="text-zinc-100">{item.target}</span>
                                    </p>
                                    <p className="text-xs text-zinc-600 font-medium">{item.time}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-zinc-500 text-sm italic">
                            {t('profile.no_activity')}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
