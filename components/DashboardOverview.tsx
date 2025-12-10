// @ts-nocheck
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Users, MessageSquare, Bot, Rocket, TrendingUp, Activity, MapPin
} from 'lucide-react';
import { Lead, ActivityItem } from '../types';

interface DashboardOverviewProps {
    leads: Lead[];
    activity: ActivityItem[];
    apifyStats: {
        total: number;
        sent: number;
        pending: number;
        error: number;
        lost: number;
    };
    chatStats: {
        activeChats: number;
        aiResponses: number;
        messagesSentToday: number;
    };
}

const COLORS = {
    new: '#3b82f6',
    contacted: '#f59e0b',
    negotiation: '#a855f7',
    won: '#10b981',
    lost: '#ef4444',
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    leads,
    activity,
    apifyStats,
    chatStats
}) => {
    const { t } = useTranslation();

    // Calculate KPIs from REAL data
    const totalLeads = leads.length;
    const wonLeads = leads.filter(l => l.stage === 'Won').length;
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';

    // Funnel data from REAL leads
    const funnelData = [
        { name: 'Novo', value: leads.filter(l => l.stage === 'New').length, color: COLORS.new },
        { name: 'Contatado', value: leads.filter(l => l.stage === 'Contacted').length, color: COLORS.contacted },
        { name: 'Negociação', value: leads.filter(l => l.stage === 'In Negotiation').length, color: COLORS.negotiation },
        { name: 'Ganho', value: leads.filter(l => l.stage === 'Won').length, color: COLORS.won },
        { name: 'Perdido', value: leads.filter(l => l.stage === 'Lost').length, color: COLORS.lost },
    ].filter(d => d.value > 0);

    // Leads by CITY - REAL data
    const cityCount: Record<string, number> = {};
    leads.forEach(lead => {
        const city = lead.city || 'Não informado';
        cityCount[city] = (cityCount[city] || 0) + 1;
    });
    const topCities = Object.entries(cityCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }));

    // Leads by STATE - REAL data
    const stateCount: Record<string, number> = {};
    leads.forEach(lead => {
        const state = lead.state || 'N/A';
        stateCount[state] = (stateCount[state] || 0) + 1;
    });
    const topStates = Object.entries(stateCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }));

    // Leads by CREATION DATE (last 7 days) - REAL data
    const last7DaysData: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        last7DaysData[dateKey] = 0;
    }

    leads.forEach(lead => {
        if (lead.last_interaction) {
            const leadDate = new Date(lead.last_interaction);
            const daysDiff = Math.floor((today.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 7) {
                const dateKey = leadDate.toLocaleDateString('pt-BR', { weekday: 'short' });
                if (last7DaysData[dateKey] !== undefined) {
                    last7DaysData[dateKey]++;
                }
            }
        }
    });

    const trendData = Object.entries(last7DaysData).map(([name, leads]) => ({ name, leads }));

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Agora mesmo';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m atrás`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h atrás`;
        const days = Math.floor(hours / 24);
        return `${days}d atrás`;
    };

    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'lead_new': return <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>;
            case 'lead_won': return <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>;
            case 'lead_hot': return <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>;
            case 'apify_import': return <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>;
            case 'automation_run': return <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>;
            default: return <div className="w-2 h-2 rounded-full bg-zinc-500"></div>;
        }
    };

    return (
        <div className="flex flex-col xl:flex-row h-full overflow-y-auto xl:overflow-hidden custom-scrollbar">
            {/* LEFT SECTION */}
            <div className="w-full xl:w-[50%] flex flex-col shrink-0 xl:h-full">
                {/* Metrics Row */}
                <div className="flex flex-wrap items-start gap-6 sm:gap-8 mb-8 px-2">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <Users size={14} />
                            <span className="text-xs font-medium uppercase tracking-wider">Total Leads</span>
                        </div>
                        <span className="text-3xl font-bold text-zinc-100 tracking-tight">{totalLeads}</span>
                    </div>

                    <div className="hidden sm:block w-px h-10 bg-white/5"></div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <Rocket size={14} />
                            <span className="text-xs font-medium uppercase tracking-wider">Blast</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-zinc-100 tracking-tight">{apifyStats.sent}</span>
                            <span className="text-sm text-zinc-500">/{apifyStats.total}</span>
                        </div>
                    </div>

                    <div className="hidden sm:block w-px h-10 bg-white/5"></div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <TrendingUp size={14} />
                            <span className="text-xs font-medium uppercase tracking-wider">Conversão</span>
                        </div>
                        <span className="text-3xl font-bold text-emerald-400 tracking-tight">{conversionRate}%</span>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex flex-col gap-6 px-2 xl:overflow-y-auto xl:flex-1 custom-scrollbar">
                    {/* Funnel Chart */}
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="text-lg font-semibold text-zinc-100">Funil de Vendas</h3>
                        </div>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={funnelData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                            {funnelData.map((item, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-400">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    {item.name} ({item.value})
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Leads by City */}
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <MapPin size={14} strokeWidth={1.5} />
                                Leads por Cidade
                            </h3>
                        </div>
                        <div className="h-[150px] -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topCities} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} width={80} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} />
                                    <Bar dataKey="value" name="Leads" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Leads Trend */}
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Activity size={14} strokeWidth={1.5} />
                                Interações - Últimos 7 Dias
                            </h3>
                        </div>
                        <div className="h-[120px] -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorLeadsOverview" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} />
                                    <Area type="monotone" dataKey="leads" name="Interações" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLeadsOverview)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px xl:w-px xl:h-full bg-white/10 my-4 xl:my-0 xl:mx-4 shrink-0"></div>

            {/* RIGHT SECTION */}
            <div className="w-full xl:w-[50%] flex flex-col shrink-0 xl:h-full">
                {/* States + Activity */}
                <div className="flex flex-col gap-6 px-2 xl:overflow-y-auto xl:flex-1 custom-scrollbar">
                    {/* Leads by State */}
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                                <MapPin size={16} />
                                Leads por Estado
                            </h3>
                        </div>
                        <div className="h-[180px] -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topStates} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} width={50} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} />
                                    <Bar dataKey="value" name="Leads" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Live Activity */}
                    <div className="flex-1 min-h-0">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="text-lg font-semibold text-zinc-100">Atividade em Tempo Real</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar pr-2 -mr-2" style={{ maxHeight: '300px' }}>
                            <div className="space-y-6 relative">
                                <div className="absolute left-[3px] top-2 bottom-2 w-[2px] bg-zinc-800/50"></div>
                                {activity.length > 0 ? (
                                    activity.slice(0, 10).map((item) => (
                                        <div key={item.id} className="relative pl-6 group">
                                            <div className="absolute left-0 top-1.5 transition-transform group-hover:scale-125 duration-300">
                                                {getActivityIcon(item.type)}
                                            </div>
                                            <div>
                                                <p className="text-sm text-zinc-300 font-medium leading-snug group-hover:text-white transition-colors">
                                                    {item.title}
                                                </p>
                                                <span className="text-xs text-zinc-600 mt-1 block font-medium">
                                                    {formatTimeAgo(item.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-zinc-600 text-sm">Nenhuma atividade recente.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
