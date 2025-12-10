// @ts-nocheck
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Download, CheckCircle, Clock, XCircle, UserX, TrendingUp, Activity, MapPin } from 'lucide-react';

interface ApifyLead {
    id: number;
    status: string; // 'sent', 'not_sent', 'error', 'lost', true, false
    category?: string;
    city?: string;
    state?: string;
    created_at?: string;
}

interface DashboardProspectingProps {
    apifyLeads: ApifyLead[];
}

const STATUS_COLORS = {
    sent: '#10b981',
    not_sent: '#f59e0b',
    error: '#ef4444',
    lost: '#6b7280',
};

export const DashboardProspecting: React.FC<DashboardProspectingProps> = ({ apifyLeads }) => {
    const { t } = useTranslation();

    // Calculate stats from REAL data
    const total = apifyLeads.length;
    const sent = apifyLeads.filter(l => l.status === 'sent' || l.status === true).length;
    const pending = apifyLeads.filter(l => l.status === 'not_sent' || l.status === false || !l.status).length;
    const errors = apifyLeads.filter(l => l.status === 'error').length;
    const lost = apifyLeads.filter(l => l.status === 'lost').length;
    const successRate = total > 0 ? ((sent / total) * 100).toFixed(1) : '0.0';

    // Status distribution for pie chart - REAL data
    const statusData = [
        { name: 'Enviados', value: sent, color: STATUS_COLORS.sent },
        { name: 'Pendentes', value: pending, color: STATUS_COLORS.not_sent },
        { name: 'Erros', value: errors, color: STATUS_COLORS.error },
        { name: 'Perdidos', value: lost, color: STATUS_COLORS.lost },
    ].filter(d => d.value > 0);

    // Top categories - REAL data
    const categoryCount: Record<string, number> = {};
    apifyLeads.forEach(lead => {
        const cat = lead.category || 'Sem categoria';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name: name.length > 25 ? name.substring(0, 22) + '...' : name, value }));

    // Top cities - REAL data
    const cityCount: Record<string, number> = {};
    apifyLeads.forEach(lead => {
        const city = lead.city || 'Não informado';
        cityCount[city] = (cityCount[city] || 0) + 1;
    });
    const topCities = Object.entries(cityCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    // Imports by day (last 7 days) - REAL data
    const importsByDay: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        importsByDay[dateKey] = 0;
    }

    apifyLeads.forEach(lead => {
        if (lead.created_at) {
            const leadDate = new Date(lead.created_at);
            const daysDiff = Math.floor((today.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 7) {
                const dateKey = leadDate.toLocaleDateString('pt-BR', { weekday: 'short' });
                if (importsByDay[dateKey] !== undefined) {
                    importsByDay[dateKey]++;
                }
            }
        }
    });

    const trendData = Object.entries(importsByDay).map(([name, imports]) => ({ name, imports }));

    return (
        <div className="flex flex-col xl:flex-row h-full overflow-y-auto xl:overflow-hidden custom-scrollbar">
            {/* LEFT SECTION */}
            <div className="w-full xl:w-[50%] flex flex-col shrink-0 xl:h-full">
                {/* Metrics Row */}
                <div className="flex flex-wrap items-start gap-6 sm:gap-8 mb-8 px-2">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <Download size={14} />
                            <span className="text-xs font-medium uppercase tracking-wider">Total</span>
                        </div>
                        <span className="text-3xl font-bold text-zinc-100 tracking-tight">{total}</span>
                    </div>

                    <div className="hidden sm:block w-px h-10 bg-white/5"></div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-emerald-500 mb-1">
                            <CheckCircle size={14} />
                            <span className="text-xs font-medium uppercase tracking-wider">Enviados</span>
                        </div>
                        <span className="text-3xl font-bold text-emerald-400 tracking-tight">{sent}</span>
                    </div>

                    <div className="hidden sm:block w-px h-10 bg-white/5"></div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-yellow-500 mb-1">
                            <Clock size={14} />
                            <span className="text-xs font-medium uppercase tracking-wider">Pendentes</span>
                        </div>
                        <span className="text-3xl font-bold text-yellow-400 tracking-tight">{pending}</span>
                    </div>

                    <div className="hidden sm:block w-px h-10 bg-white/5"></div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-red-500 mb-1">
                            <XCircle size={14} />
                            <span className="text-xs font-medium uppercase tracking-wider">Erros</span>
                        </div>
                        <span className="text-3xl font-bold text-red-400 tracking-tight">{errors}</span>
                    </div>

                    <div className="hidden sm:block w-px h-10 bg-white/5"></div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <TrendingUp size={14} />
                            <span className="text-xs font-medium uppercase tracking-wider">Taxa Sucesso</span>
                        </div>
                        <span className="text-3xl font-bold text-emerald-400 tracking-tight">{successRate}%</span>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex flex-col gap-6 px-2 xl:overflow-y-auto xl:flex-1 custom-scrollbar">
                    {/* Status Distribution */}
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="text-lg font-semibold text-zinc-100">Distribuição por Status</h3>
                        </div>
                        <div className="h-[180px]">
                            {statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                                    Nenhum dado disponível
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                            {statusData.map((item, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-400">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    {item.name} ({item.value})
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Imports Trend */}
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Activity size={14} strokeWidth={1.5} />
                                Importações - Últimos 7 Dias
                            </h3>
                        </div>
                        <div className="h-[120px] -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorImportsProspecting" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} />
                                    <Area type="monotone" dataKey="imports" name="Importações" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorImportsProspecting)" />
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
                <div className="flex flex-col gap-6 px-2 xl:overflow-y-auto xl:flex-1 custom-scrollbar">
                    {/* Top Cities */}
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                                <MapPin size={16} />
                                Top Cidades
                            </h3>
                        </div>
                        <div className="h-[150px] -ml-4">
                            {topCities.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topCities} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} width={80} />
                                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} />
                                        <Bar dataKey="value" name="Leads" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                                    Nenhuma cidade registrada
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Categories */}
                    <div className="flex-1 min-h-0">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="text-lg font-semibold text-zinc-100">Top Categorias</h3>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar pr-2 -mr-2" style={{ maxHeight: '250px' }}>
                            <div className="space-y-4">
                                {topCategories.length > 0 ? (
                                    topCategories.map((cat, index) => (
                                        <div key={index} className="group">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-sm text-zinc-300 font-medium group-hover:text-white transition-colors truncate max-w-[180px]" title={cat.name}>{cat.name}</span>
                                                <span className="text-sm font-bold text-zinc-100">{cat.value}</span>
                                            </div>
                                            <div className="h-1 bg-zinc-800/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500/50 rounded-full transition-all"
                                                    style={{ width: `${Math.min((cat.value / (topCategories[0]?.value || 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <Download size={32} className="mx-auto text-zinc-700 mb-3" />
                                        <p className="text-zinc-600 text-sm">Nenhuma categoria encontrada.</p>
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
