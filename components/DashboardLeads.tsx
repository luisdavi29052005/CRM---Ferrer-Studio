import React from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, MessageSquare } from 'lucide-react';
import { Lead, ActivityItem } from '../types';

interface DashboardLeadsProps {
    leads: Lead[];
    chartData: any[];
    activity: ActivityItem[];
}

export const DashboardLeads: React.FC<DashboardLeadsProps> = ({ leads, chartData, activity }) => {
    const { t } = useTranslation();

    const totalLeads = leads.length;

    // Fallback data if no real data yet
    const displayData = chartData.length > 0 ? chartData : [
        { name: 'Mon', sent: 0, replies: 0 },
        { name: 'Tue', sent: 0, replies: 0 },
        { name: 'Wed', sent: 0, replies: 0 },
    ];

    // Calculate Response Rate
    const responseRate = leads.length > 0 ?
        ((leads.filter(l => ['Contacted', 'In Negotiation', 'Won'].includes(l.stage)).length / leads.length) * 100).toFixed(1)
        : '0.0';

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
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
        <div className="flex flex-col h-full">
            {/* Metrics Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-6 sm:gap-12 mb-8 sm:mb-12 px-2">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Users size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.total_leads')}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-zinc-100 tracking-tight">{totalLeads}</span>
                        <span className="text-xs text-zinc-500 font-medium">Active</span>
                    </div>
                </div>

                <div className="hidden sm:block w-px h-12 bg-white/5"></div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <MessageSquare size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.active_chats')}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-zinc-100 tracking-tight">{responseRate}%</span>
                        <span className="text-xs text-zinc-500 font-medium">Avg</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 flex-1 min-h-0">
                {/* Outbound Performance Chart */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Outbound Performance</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <span className="w-2 h-2 rounded-full bg-bronze-500"></span> Sent
                                <span className="w-2 h-2 rounded-full bg-olive-500 ml-2"></span> Replies
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={displayData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#84cc16" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#52525b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value} `}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                    labelStyle={{ color: '#666', marginBottom: '5px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sent"
                                    stroke="#d97706"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorSent)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="replies"
                                    stroke="#84cc16"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorReplies)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Live Activity */}
                <div className="flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Live Activity</h3>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                        <div className="space-y-8 relative">
                            <div className="absolute left-[3px] top-2 bottom-2 w-[2px] bg-zinc-800/50"></div>
                            {activity.length > 0 ? (
                                activity.map((item) => (
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
                                    <p className="text-zinc-600 text-sm">No recent activity.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
