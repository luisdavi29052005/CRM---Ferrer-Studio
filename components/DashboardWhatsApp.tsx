// @ts-nocheck
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Wifi, WifiOff, MessageSquare, Send, Bot, Clock, Zap, Activity } from 'lucide-react';

interface DashboardWhatsAppProps {
    wahaStatus: 'WORKING' | 'FAILED' | 'STOPPED' | 'STARTING' | 'UNKNOWN';
    stats: {
        messagesReceivedToday: number;
        messagesSentToday: number;
        aiResponses: number;
        avgResponseTime: string;
        responseRate: number;
    };
    agentStats: Array<{
        name: string;
        responses: number;
    }>;
    hourlyData?: Array<{ hour: string; mensagens: number }>;
}

export const DashboardWhatsApp: React.FC<DashboardWhatsAppProps> = ({
    wahaStatus,
    stats,
    agentStats,
    hourlyData = []
}) => {
    const { t } = useTranslation();

    // Use real hourly data if available, otherwise show empty state
    const displayHourlyData = hourlyData.length > 0 ? hourlyData :
        Array.from({ length: 24 }, (_, i) => ({
            hour: `${i.toString().padStart(2, '0')}h`,
            mensagens: 0,
        }));

    const statusConfig = {
        WORKING: { color: 'bg-emerald-500', textColor: 'text-emerald-400', text: 'Conectado', icon: Wifi },
        FAILED: { color: 'bg-red-500', textColor: 'text-red-400', text: 'Erro', icon: WifiOff },
        STOPPED: { color: 'bg-zinc-500', textColor: 'text-zinc-400', text: 'Parado', icon: WifiOff },
        STARTING: { color: 'bg-yellow-500', textColor: 'text-yellow-400', text: 'Iniciando', icon: Activity },
        UNKNOWN: { color: 'bg-zinc-600', textColor: 'text-zinc-400', text: 'Desconhecido', icon: WifiOff },
    };

    const currentStatus = statusConfig[wahaStatus] || statusConfig.UNKNOWN;
    const StatusIcon = currentStatus.icon;

    return (
        <div className="flex flex-col h-full">
            {/* Metrics Row */}
            <div className="flex flex-wrap items-start gap-6 sm:gap-8 mb-8 px-2">
                {/* Session Status */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <StatusIcon size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">Status Sessão</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-bold tracking-tight ${currentStatus.textColor}`}>{currentStatus.text}</span>
                        <div className={`w-2 h-2 rounded-full ${currentStatus.color} ${wahaStatus === 'WORKING' ? 'animate-pulse' : ''}`}></div>
                    </div>
                </div>

                <div className="hidden sm:block w-px h-10 bg-white/5"></div>

                {/* Messages Received */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <MessageSquare size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">Recebidas</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-zinc-100 tracking-tight">{stats.messagesReceivedToday}</span>
                        <span className="text-xs text-zinc-500">hoje</span>
                    </div>
                </div>

                <div className="hidden sm:block w-px h-10 bg-white/5"></div>

                {/* Messages Sent */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Send size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">Enviadas</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-zinc-100 tracking-tight">{stats.messagesSentToday}</span>
                        <span className="text-xs text-zinc-500">hoje</span>
                    </div>
                </div>

                <div className="hidden sm:block w-px h-10 bg-white/5"></div>

                {/* AI Responses */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Bot size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">Respostas IA</span>
                    </div>
                    <span className="text-3xl font-bold text-purple-400 tracking-tight">{stats.aiResponses}</span>
                </div>

                <div className="hidden sm:block w-px h-10 bg-white/5"></div>

                {/* Avg Response Time */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Clock size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">Tempo Médio</span>
                    </div>
                    <span className="text-3xl font-bold text-zinc-100 tracking-tight">{stats.avgResponseTime || '-'}</span>
                </div>

                <div className="hidden sm:block w-px h-10 bg-white/5"></div>

                {/* Response Rate */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Zap size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">Taxa Resposta</span>
                    </div>
                    <span className="text-3xl font-bold text-emerald-400 tracking-tight">{stats.responseRate}%</span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 flex-1 min-h-0">
                {/* Left: Hourly Activity Chart */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-lg font-semibold text-zinc-100">Atividade por Hora</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Mensagens
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0 -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={displayHourlyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis
                                    dataKey="hour"
                                    stroke="#52525b"
                                    fontSize={9}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={2}
                                    dy={10}
                                />
                                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="mensagens" name="Mensagens" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Agent Performance */}
                <div className="flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-lg font-semibold text-zinc-100">Agentes Ativos</h3>
                        {agentStats.length > 0 && (
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                        <div className="space-y-6">
                            {agentStats.length > 0 ? (
                                agentStats.map((agent, index) => (
                                    <div key={index} className="group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                                    <Bot size={14} className="text-purple-400" />
                                                </div>
                                                <span className="text-sm text-zinc-300 font-medium group-hover:text-white transition-colors">{agent.name}</span>
                                            </div>
                                            <span className="text-lg font-bold text-zinc-100">{agent.responses}</span>
                                        </div>
                                        <div className="h-1 bg-zinc-800/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500/50 rounded-full transition-all"
                                                style={{ width: `${Math.min((agent.responses / Math.max(...agentStats.map(a => a.responses), 1)) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Bot size={32} className="mx-auto text-zinc-700 mb-3" />
                                    <p className="text-zinc-600 text-sm">Nenhum agente ativo.</p>
                                    <p className="text-zinc-700 text-xs mt-1">Configure agentes de IA em Automações</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
