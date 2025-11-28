import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, ActivityItem } from '../types';
import { DashboardFinances } from './DashboardFinances';
import { DashboardLeads } from './DashboardLeads';

interface DashboardProps {
  leads: Lead[];
  chartData: any[];
  activity: ActivityItem[];
}

export const Dashboard: React.FC<DashboardProps> = ({ leads, chartData, activity }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'finances' | 'leads'>('finances');

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center gap-6 mb-8 border-b border-white/5">
        <button
          onClick={() => setActiveTab('finances')}
          className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'finances'
            ? 'text-zinc-100'
            : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
          Finances
          {activeTab === 'finances' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'leads'
            ? 'text-zinc-100'
            : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
          Leads
          {activeTab === 'leads' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="h-full"
          >
            {activeTab === 'finances' ? (
              <DashboardFinances leads={leads} />
            ) : (
              <DashboardLeads leads={leads} chartData={chartData} activity={activity} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
