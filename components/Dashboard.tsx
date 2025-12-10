// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, ActivityItem } from '../types';
import { DashboardOverview } from './DashboardOverview';
import { DashboardFinances } from './DashboardFinances';
import { DashboardLeads } from './DashboardLeads';
import { DashboardWhatsApp } from './DashboardWhatsApp';
import { DashboardProspecting } from './DashboardProspecting';
import { LayoutDashboard, DollarSign, Users, MessageSquare, Rocket } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { fetchAgents } from '../services/supabaseService';

interface DashboardProps {
  leads: Lead[];
  chartData: any[];
  activity: ActivityItem[];
  isLoading?: boolean;
  wahaStatus?: 'WORKING' | 'FAILED' | 'STOPPED' | 'STARTING' | 'UNKNOWN';
  apifyLeads?: any[];
}

const tabs = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard, description: 'Resumo completo do seu negócio em tempo real.' },
  { id: 'finances', label: 'Finanças', icon: DollarSign, description: 'Acompanhe receitas, vendas internacionais e transações.' },
  { id: 'leads', label: 'Leads', icon: Users, description: 'Visualize o funil de vendas e métricas de conversão.' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, description: 'Status da conexão e métricas de mensagens.' },
  { id: 'prospecting', label: 'Prospecção', icon: Rocket, description: 'Estatísticas de importação e disparos Apify.' },
];

export const Dashboard: React.FC<DashboardProps> = ({
  leads,
  chartData,
  activity,
  isLoading,
  wahaStatus = 'UNKNOWN',
  apifyLeads = []
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Real data states
  const [messageStats, setMessageStats] = useState({ received: 0, sent: 0, aiResponses: 0 });
  const [hourlyData, setHourlyData] = useState<Array<{ hour: string; mensagens: number }>>([]);
  const [agentStats, setAgentStats] = useState<Array<{ name: string; responses: number }>>([]);
  const [activeChats, setActiveChats] = useState(0);

  // Fetch real message stats from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Messages today
      const { data: messages } = await supabase
        .from('whatsapp_waha_messages')
        .select('from_me, message_timestamp, body')
        .gte('message_timestamp', todayISO);

      if (messages) {
        const received = messages.filter(m => !m.from_me).length;
        const sent = messages.filter(m => m.from_me).length;
        const aiCount = messages.filter(m => m.from_me && m.body?.length > 50).length;

        setMessageStats({ received, sent, aiResponses: aiCount });

        // Hourly data
        const hourlyMap: Record<string, number> = {};
        for (let i = 0; i < 24; i++) {
          hourlyMap[`${i.toString().padStart(2, '0')}h`] = 0;
        }
        messages.forEach(msg => {
          if (msg.message_timestamp) {
            const hour = new Date(msg.message_timestamp).getHours();
            hourlyMap[`${hour.toString().padStart(2, '0')}h`]++;
          }
        });
        setHourlyData(Object.entries(hourlyMap).map(([hour, mensagens]) => ({ hour, mensagens })));
      }

      // Active chats
      const { count } = await supabase
        .from('whatsapp_waha_chats')
        .select('*', { count: 'exact', head: true })
        .gte('last_message_at', todayISO);
      if (count !== null) setActiveChats(count);

      // Agents
      const agents = await fetchAgents();
      setAgentStats(agents.filter(a => a.is_active).map(a => ({ name: a.name, responses: 0 })));
    };

    fetchData();
  }, []);

  // Calculate stats
  const apifyStats = {
    total: apifyLeads.length,
    sent: apifyLeads.filter((l: any) => l.status === 'sent' || l.status === true).length,
    pending: apifyLeads.filter((l: any) => l.status === 'not_sent' || l.status === false || !l.status).length,
    error: apifyLeads.filter((l: any) => l.status === 'error').length,
    lost: apifyLeads.filter((l: any) => l.status === 'lost').length,
  };

  const chatStats = {
    activeChats,
    aiResponses: messageStats.aiResponses,
    messagesSentToday: messageStats.sent,
  };

  const whatsappStats = {
    messagesReceivedToday: messageStats.received,
    messagesSentToday: messageStats.sent,
    aiResponses: messageStats.aiResponses,
    avgResponseTime: '-',
    responseRate: messageStats.received > 0
      ? Math.round((messageStats.sent / messageStats.received) * 100)
      : 0,
  };

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-100 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden relative bg-[#050505]">
      {/* Header - Same style as Automation */}
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">
            {currentTab.label}
          </h2>
          <p className="text-zinc-500 text-sm mt-2 font-medium">
            {currentTab.description}
          </p>
        </div>

        {/* Tab Switcher - Same style as Automation */}
        <div className="flex bg-black/20 p-1 rounded-lg backdrop-blur-sm border border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'overview' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'overview' ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'overview' && (
              <DashboardOverview
                leads={leads}
                activity={activity}
                apifyStats={apifyStats}
                chatStats={chatStats}
              />
            )}
            {activeTab === 'finances' && (
              <DashboardFinances leads={leads} />
            )}
            {activeTab === 'leads' && (
              <DashboardLeads leads={leads} chartData={chartData} activity={activity} />
            )}
            {activeTab === 'whatsapp' && (
              <DashboardWhatsApp
                wahaStatus={wahaStatus}
                stats={whatsappStats}
                agentStats={agentStats}
                hourlyData={hourlyData}
              />
            )}
            {activeTab === 'prospecting' && (
              <DashboardProspecting apifyLeads={apifyLeads} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
