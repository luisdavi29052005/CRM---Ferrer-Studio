
// @ts-nocheck
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Plus, MoreHorizontal, MessageCircle, Phone, MapPin, Calendar, DollarSign, X } from 'lucide-react';
import { Lead, Stage, Temperature } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { HighlightText } from './HighlightText';

interface LeadsProps {
  leads: Lead[];
  onOpenChat: (lead: Lead) => void;
  isAdmin: boolean;
}

const StageBadge = ({ stage }: { stage: string }) => {
  const colors: Record<string, string> = {
    'New': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Contacted': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'In Negotiation': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'Won': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Lost': 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colors[stage] || 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}>
      {stage}
    </span>
  );
};

const TemperatureBadge = ({ temp }: { temp: string }) => {
  const colors: Record<string, string> = {
    'Cold': 'text-blue-400',
    'Warm': 'text-orange-400',
    'Hot': 'text-red-400',
  };

  return (
    <span className={`text-xs font-bold ${colors[temp] || 'text-zinc-400'}`}>
      {temp}
    </span>
  );
};

export const Leads: React.FC<LeadsProps> = ({ leads, onOpenChat, isAdmin }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    category: '',
    stage: 'all' as 'all' | Stage,
    temperature: 'all' as 'all' | Temperature,
    dateStart: '',
    dateEnd: ''
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.business.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);

    const matchesCity = !filters.city || (lead.city && lead.city.toLowerCase().includes(filters.city.toLowerCase()));
    const matchesState = !filters.state || (lead.state && lead.state.toLowerCase().includes(filters.state.toLowerCase()));
    const matchesCategory = !filters.category || (lead.category && lead.category.toLowerCase().includes(filters.category.toLowerCase()));
    const matchesStage = filters.stage === 'all' || lead.stage === filters.stage;
    const matchesTemperature = filters.temperature === 'all' || lead.temperature === filters.temperature;

    let matchesDate = true;
    if (filters.dateStart) {
      matchesDate = matchesDate && new Date(lead.last_interaction) >= new Date(filters.dateStart);
    }
    if (filters.dateEnd) {
      const endDate = new Date(filters.dateEnd);
      endDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(lead.last_interaction) <= endDate;
    }

    return matchesSearch && matchesCity && matchesState && matchesCategory && matchesStage && matchesTemperature && matchesDate;
  });

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all' && v !== '').length;

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">{t('leads.title')}</h2>
          <p className="text-zinc-500 text-sm mt-2 font-medium">{t('leads.subtitle')}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" size={16} />
            <input
              type="text"
              placeholder={t('leads.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-b border-zinc-800 text-zinc-200 pl-6 pr-4 py-2 focus:outline-none focus:border-bronze-500 transition-colors text-sm w-64 placeholder:text-zinc-600"
            />
          </div>

          <div className="h-6 w-px bg-white/10 mx-2"></div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${showFilters || activeFiltersCount > 0
                ? 'bg-white/10 text-zinc-100 border-white/10'
                : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200 border-transparent hover:border-white/5'
                }`}
            >
              <Filter size={14} />
              {t('common.filter')}
              {activeFiltersCount > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-bronze-500 text-black text-[9px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)}></div>
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-[#0B0B0B] border border-white/10 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl z-50 p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-zinc-200">Filters</h3>
                      <button
                        onClick={() => {
                          setFilters({
                            city: '',
                            state: '',
                            category: '',
                            stage: 'all',
                            temperature: 'all',
                            dateStart: '',
                            dateEnd: ''
                          });
                        }}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-wider font-medium"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Stage & Temperature */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Stage</label>
                          <select
                            value={filters.stage}
                            onChange={(e) => setFilters({ ...filters, stage: e.target.value as any })}
                            className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors"
                          >
                            <option value="all">All Stages</option>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="In Negotiation">In Negotiation</option>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Temperature</label>
                          <select
                            value={filters.temperature}
                            onChange={(e) => setFilters({ ...filters, temperature: e.target.value as any })}
                            className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors"
                          >
                            <option value="all">All Temps</option>
                            <option value="Cold">Cold</option>
                            <option value="Warm">Warm</option>
                            <option value="Hot">Hot</option>
                          </select>
                        </div>
                      </div>

                      {/* City & State */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">City</label>
                          <select
                            value={filters.city}
                            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                            className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors appearance-none"
                          >
                            <option value="">All Cities</option>
                            {Array.from(new Set(leads.map(lead => lead.city).filter(Boolean))).sort().map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">State</label>
                          <select
                            value={filters.state}
                            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                            className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors appearance-none"
                          >
                            <option value="">All States</option>
                            {Array.from(new Set(leads.map(lead => lead.state).filter(Boolean))).sort().map((state) => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Category</label>
                        <input
                          type="text"
                          value={filters.category}
                          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                          placeholder="e.g. Real Estate"
                          className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors placeholder:text-zinc-700"
                        />
                      </div>

                      {/* Date Range */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Last Interaction</label>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="date"
                            value={filters.dateStart}
                            onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                            className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors"
                          />
                          <input
                            type="date"
                            value={filters.dateEnd}
                            onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                            className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-black rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2">
            <Plus size={14} />
            {t('leads.add_lead')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar -mx-8 px-8">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
            <tr>
              <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('leads.table.name')}</th>
              <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">Location</th>
              <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">Category</th>
              <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('leads.table.status')}</th>
              <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('leads.table.temp')}</th>
              <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('leads.table.value')}</th>
              <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('leads.table.last_contact')}</th>
              <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500 border border-white/5 group-hover:border-bronze-500/30 group-hover:text-bronze-500 transition-colors">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm group-hover:text-white transition-colors">
                          <HighlightText text={lead.name} highlight={searchTerm} />
                        </div>
                        <div className="text-xs text-zinc-500">
                          <HighlightText text={lead.business} highlight={searchTerm} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-zinc-400">
                    <div className="flex flex-col">
                      <HighlightText text={lead.city || ''} highlight={filters.city || searchTerm} />
                      <span className="text-xs text-zinc-600">
                        <HighlightText text={lead.state || ''} highlight={filters.state} />
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-zinc-400">
                    <HighlightText text={lead.category || ''} highlight={filters.category} />
                  </td>
                  <td className="py-4 px-4">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="py-4 px-4">
                    <TemperatureBadge temp={lead.temperature} />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-zinc-300 text-sm font-medium font-mono">
                      <DollarSign size={12} className="text-zinc-500" />
                      {lead.budget.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs">
                      <Calendar size={12} />
                      {lead.last_interaction}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onOpenChat(lead)}
                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-bronze-400 transition-colors"
                      >
                        <MessageCircle size={16} />
                      </button>
                      {isAdmin && (
                        <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500 text-sm">
                  No leads found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};