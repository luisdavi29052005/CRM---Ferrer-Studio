import React from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Activity, TrendingUp } from 'lucide-react';
import { Lead } from '../types';

interface DashboardFinancesProps {
    leads: Lead[];
}

export const DashboardFinances: React.FC<DashboardFinancesProps> = ({ leads }) => {
    const { t } = useTranslation();

    const totalPipeline = leads
        .filter(l => ['New', 'Contacted', 'In Negotiation'].includes(l.stage))
        .reduce((acc, curr) => acc + curr.budget, 0);

    const closedRevenue = leads
        .filter(l => l.stage === 'Won')
        .reduce((acc, curr) => acc + curr.budget, 0);

    // Mock data for Revenue Trend
    const revenueData = [
        { name: 'Jan', actual: 4000, projected: 2400 },
        { name: 'Feb', actual: 3000, projected: 1398 },
        { name: 'Mar', actual: 2000, projected: 9800 },
        { name: 'Apr', actual: 2780, projected: 3908 },
        { name: 'May', actual: 1890, projected: 4800 },
        { name: 'Jun', actual: 2390, projected: 3800 },
        { name: 'Jul', actual: 3490, projected: 4300 },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Metrics Row */}
            <div className="flex items-center justify-start gap-12 mb-12 px-2">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <DollarSign size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.pipeline_value')}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-zinc-100 tracking-tight">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalPipeline)}
                        </span>
                        <span className="text-xs text-emerald-500 font-medium">+12%</span>
                    </div>
                </div>

                <div className="w-px h-12 bg-white/5"></div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Activity size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.closed_revenue')}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-zinc-100 tracking-tight">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(closedRevenue)}
                        </span>
                        <span className="text-xs text-emerald-500 font-medium">+8%</span>
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Revenue Trend</h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Actual
                        <span className="w-2 h-2 rounded-full bg-zinc-600 ml-2"></span> Projected
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                                tickFormatter={(value) => `${value / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '12px' }}
                                labelStyle={{ color: '#666', marginBottom: '5px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="projected"
                                stroke="#52525b"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={0}
                                fill="transparent"
                            />
                            <Area
                                type="monotone"
                                dataKey="actual"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorActual)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
