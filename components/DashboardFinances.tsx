import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Activity, TrendingUp, TrendingDown, Globe, CreditCard, Users, Receipt } from 'lucide-react';
import { Lead } from '../types';
import { getInternationalEarnings, PayPalDashboardData } from '../services/paypalService';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import WorldMap from './WorldMap';

interface DashboardFinancesProps {
    leads: Lead[];
}

export const DashboardFinances: React.FC<DashboardFinancesProps> = ({ leads }) => {
    const { t } = useTranslation();

    // Skeleton Component
    const Skeleton = ({ className }: { className?: string }) => (
        <div className={`animate-pulse bg-white/5 rounded ${className}`} />
    );

    const [payPalData, setPayPalData] = useState<PayPalDashboardData | null>(null);
    const [loadingPayPal, setLoadingPayPal] = useState(true);
    const [dateRange, setDateRange] = useState<'30d' | '90d' | 'ytd' | '1y'>('30d');
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchPayPalData = async () => {
            setLoadingPayPal(true);
            try {
                const data = await getInternationalEarnings(dateRange);
                setPayPalData(data);
            } catch (error) {
                console.error("Error fetching PayPal data:", error);
            } finally {
                setLoadingPayPal(false);
            }
        };

        fetchPayPalData();
    }, [dateRange]);

    const totalPipeline = leads
        .filter(l => ['New', 'Contacted', 'In Negotiation'].includes(l.stage))
        .reduce((acc, curr) => acc + curr.budget, 0);

    const closedRevenue = leads
        .filter(l => l.stage === 'Won')
        .reduce((acc, curr) => acc + curr.budget, 0);

    // Real data for Revenue Trend (Lead Pipeline) - Currently empty as we don't have historical data in Lead type
    const revenueData: { name: string; actual: number; projected: number }[] = [];

    const leadMetrics = [
        { title: t('dashboard.pipeline_value'), value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalPipeline), icon: DollarSign },
        { title: t('dashboard.closed_revenue'), value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(closedRevenue), icon: Activity },
    ];

    return (
        <div className="flex flex-col xl:flex-row h-full overflow-y-auto xl:overflow-hidden custom-scrollbar">
            {/* SECTION 1: LEAD PIPELINE REVENUE (Left Side) */}
            <div className="w-full xl:w-[40%] flex flex-col shrink-0 xl:h-full">
                {/* Header */}
                <div className="sticky xl:static top-0 z-20 bg-[#050505] p-2 pb-4 border-b border-white/5 xl:border-none">
                    <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                        {t('dashboard.lead_pipeline_revenue')}
                    </h2>
                </div>

                {/* Scrollable Content */}
                <div className="flex flex-col gap-6 p-2 xl:overflow-y-auto xl:flex-1 custom-scrollbar">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {leadMetrics.map((metric, index) => (
                            <div key={index} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                    <metric.icon size={14} strokeWidth={1.5} />
                                    <span className="text-xs font-medium uppercase tracking-wider">{metric.title}</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-zinc-100 tracking-tight">
                                        {metric.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chart */}
                    <div className="h-[300px] flex flex-col">
                        <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                            <Activity size={14} strokeWidth={1.5} />
                            {t('dashboard.revenue_trend')}
                        </h3>
                        <div className="flex-1 w-full min-h-0 -ml-4 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} />
                                    <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px xl:w-px xl:h-full bg-white/10 my-4 xl:my-0 xl:mx-4 shrink-0"></div>

            {/* SECTION 2: INTERNATIONAL SALES (PAYPAL) (Right Side) */}
            <div className="w-full xl:w-[60%] flex flex-col shrink-0 xl:h-full">
                {/* Header */}
                <div className="sticky xl:static top-0 z-20 bg-[#050505] p-2 pb-4 border-b border-white/5 xl:border-none">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                            {t('dashboard.international_sales')}
                        </h2>

                        {/* Date Range Selector */}
                        <div className="flex bg-black/20 p-1 rounded-lg backdrop-blur-sm">
                            {(['30d', '90d', 'ytd', '1y'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all duration-200 ${dateRange === range
                                        ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                        }`}
                                >
                                    {range === '30d' ? t('dashboard.date_ranges.30d') : range === '90d' ? t('dashboard.date_ranges.90d') : range === 'ytd' ? t('dashboard.date_ranges.ytd') : t('dashboard.date_ranges.1y')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex flex-col gap-6 p-2 xl:overflow-y-auto xl:flex-1 custom-scrollbar">
                    <div className={`relative transition-all duration-300 ${loadingPayPal && payPalData ? 'opacity-50 pointer-events-none' : ''}`}>
                        {loadingPayPal && !payPalData ? (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* Summary Cards Skeleton */}
                                <div className="grid grid-cols-2 gap-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Skeleton className="w-4 h-4 rounded-full" />
                                                <Skeleton className="w-24 h-3" />
                                            </div>
                                            <Skeleton className="w-32 h-8" />
                                        </div>
                                    ))}
                                </div>

                                {/* Chart Skeleton */}
                                <div className="h-[300px] flex flex-col">
                                    <Skeleton className="w-32 h-4 mb-4" />
                                    <Skeleton className="w-full flex-1 rounded-xl" />
                                </div>

                                {/* Map Skeleton */}
                                <div className="h-[400px] flex flex-col">
                                    <Skeleton className="w-32 h-4 mb-4" />
                                    <Skeleton className="w-full flex-1 rounded-xl" />
                                </div>

                                {/* Table Skeleton */}
                                <div className="flex flex-col h-[300px]">
                                    <div className="mb-4">
                                        <Skeleton className="w-40 h-4" />
                                    </div>
                                    <div className="flex-1 border border-white/5 rounded-xl overflow-hidden">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <Skeleton className="w-20 h-3" />
                                                <Skeleton className="w-32 h-3" />
                                                <Skeleton className="w-16 h-3 ml-auto" />
                                                <Skeleton className="w-20 h-5 rounded-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : payPalData ? (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                            <DollarSign size={14} strokeWidth={1.5} />
                                            <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.gross_revenue')}</span>
                                        </div>
                                        <span className="text-3xl font-bold text-zinc-100 tracking-tight">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payPalData.summary.grossTotal)}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                            <Receipt size={14} strokeWidth={1.5} />
                                            <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.paypal_fees')}</span>
                                        </div>
                                        <span className="text-3xl font-bold text-rose-400 tracking-tight">
                                            -{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payPalData.summary.feeTotal)}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                            <CreditCard size={14} strokeWidth={1.5} />
                                            <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.net_revenue')}</span>
                                        </div>
                                        <span className="text-3xl font-bold text-emerald-400 tracking-tight">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payPalData.summary.netTotal)}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                            <Users size={14} strokeWidth={1.5} />
                                            <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.sales_count')}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-blue-400 tracking-tight">
                                                {payPalData.summary.transactionCount}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                (Avg {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payPalData.summary.avgTicket)})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* PayPal Chart */}
                                <div className="h-[300px] flex flex-col">
                                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                                        <Activity size={14} strokeWidth={1.5} />
                                        {t('dashboard.earnings_trend')}
                                    </h3>
                                    <div className="flex-1 w-full min-h-0 -ml-4 h-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={payPalData.chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorPayPal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#52525b"
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    dy={10}
                                                    tickFormatter={(value) => {
                                                        const date = new Date(value);
                                                        return dateRange === '1y' || dateRange === 'ytd'
                                                            ? date.toLocaleDateString('en-US', { month: 'short' })
                                                            : date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
                                                    }}
                                                />
                                                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                                    itemStyle={{ fontSize: '12px', color: '#fff' }}
                                                    formatter={(v: number) => [`$${v.toFixed(2)}`, 'Earnings']}
                                                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                />
                                                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPayPal)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Transactions Table */}
                                <div className="flex flex-col h-[400px]">
                                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                                        <Receipt size={14} strokeWidth={1.5} />
                                        {t('dashboard.recent_transactions')}
                                    </h3>
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
                                                <tr>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('dashboard.transactions_table.date')}</th>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('dashboard.transactions_table.customer')}</th>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 text-right">{t('dashboard.transactions_table.gross')}</th>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 text-right">{t('dashboard.transactions_table.fee')}</th>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 text-right">{t('dashboard.transactions_table.net')}</th>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 text-center">{t('dashboard.transactions_table.status')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {payPalData.transactions.slice(0, 50).map((tx) => (
                                                    <tr
                                                        key={tx.id}
                                                        className="group hover:bg-white/5 transition-colors cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedTransactionId(tx.id);
                                                            setIsModalOpen(true);
                                                        }}
                                                    >
                                                        <td className="py-3 px-4 whitespace-nowrap text-zinc-300 text-sm">
                                                            {new Date(tx.date).toLocaleDateString()}
                                                            <div className="text-[10px] text-zinc-600">{new Date(tx.date).toLocaleTimeString()}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-zinc-200 font-medium text-sm truncate max-w-[120px]">{tx.customerName}</span>
                                                                <span className="text-xs text-zinc-500 truncate max-w-[120px]">{tx.customerEmail}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-zinc-200 font-medium text-sm">
                                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.gross)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-rose-400 text-sm">
                                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.fee)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-emerald-400 font-bold text-sm">
                                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.net)}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${tx.status === 'S' || tx.status === 'COMPLETED'
                                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                                : 'bg-yellow-500/10 text-yellow-500'
                                                                }`}>
                                                                {tx.status === 'S' ? 'COMPLETED' : tx.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!payPalData.transactions || payPalData.transactions.length === 0) && (
                                                    <tr>
                                                        <td colSpan={6} className="p-8 text-center text-zinc-500 text-sm">
                                                            {t('dashboard.transactions_table.no_transactions')}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Sales by Country Map */}
                                <div className="flex flex-col min-h-[600px]">
                                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                                        <Globe size={14} strokeWidth={1.5} />
                                        {t('dashboard.sales_by_country')}
                                    </h3>
                                    <div className="flex-1 w-full min-h-0 bg-black/20 rounded-xl border border-white/5 p-4">
                                        <WorldMap data={payPalData.salesByCountry} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-zinc-500 py-12">
                                {t('dashboard.transactions_table.no_international_transactions')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <TransactionDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                transactionId={selectedTransactionId}
            />
        </div>
    );
};
