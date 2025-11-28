
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lead } from '../types';
import { Search, Filter, MoreHorizontal, MessageCircle } from 'lucide-react';

interface LeadsProps {
  leads: Lead[];
  onOpenChat: (lead: Lead) => void;
}

const StageBadge = ({ stage }: { stage: string }) => {
  const colors: Record<string, string> = {
    'New': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Contacted': 'bg-bronze-500/10 text-bronze-400 border-bronze-500/20',
    'In Negotiation': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Won': 'bg-olive-500/10 text-olive-400 border-olive-500/20',
    'Lost': 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border uppercase ${colors[stage] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
      {stage}
    </span>
  );
};

const TempBadge = ({ temp }: { temp: string }) => {
  const colors: Record<string, string> = {
    'Hot': 'text-red-400 bg-red-500/10 border-red-500/20',
    'Warm': 'text-bronze-400 bg-bronze-500/10 border-bronze-500/20',
    'Cold': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${colors[temp]}`}>
      {temp}
    </span>
  );
};

const ScoreBar = ({ score }: { score: number }) => (
  <div className="flex items-center gap-3">
    <div className="h-1.5 w-20 bg-black/40 rounded-full overflow-hidden border border-white/5">
      <div
        className={`h-full rounded-full ${score > 70 ? 'bg-gradient-to-r from-olive-600 to-olive-400' : score > 40 ? 'bg-gradient-to-r from-bronze-600 to-bronze-400' : 'bg-zinc-600'}`}
        style={{ width: `${score}%` }}
      />
    </div>
    <span className="text-xs font-mono text-zinc-400">{score}</span>
  </div>
);

export const Leads: React.FC<LeadsProps> = ({ leads, onOpenChat }) => {
  const { t } = useTranslation();
  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      {/* Minimalist Header */}
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">{t('leads.title')}</h2>
          <p className="text-zinc-500 text-sm mt-2 font-medium">{t('leads.subtitle')}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Minimalist Search */}
          <div className="relative group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" size={16} />
            <input
              type="text"
              placeholder={t('leads.search_placeholder')}
              className="bg-transparent border-b border-zinc-800 text-zinc-200 pl-6 pr-4 py-2 focus:outline-none focus:border-bronze-500 transition-colors text-sm w-64 placeholder:text-zinc-600"
            />
          </div>

          <div className="h-6 w-px bg-white/10 mx-2"></div>

          <button className="px-3 py-1.5 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
            <Filter size={14} />
            {t('common.filter')}
          </button>

          <button className="px-4 py-2 bg-zinc-100 hover:bg-white text-black rounded-lg transition-all transform hover:scale-105 text-xs font-bold uppercase tracking-wide shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            + {t('leads.add_lead')}
          </button>
        </div>
      </div>

      {/* Table Container - No Box, Just Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('leads.all_leads')} ({leads.length})</span>
          <div className="flex gap-2">
            {/* Optional: View toggles or bulk actions could go here */}
          </div>
        </div>

        <div className="overflow-auto custom-scrollbar flex-1 -mx-4 px-4">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
              <tr>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('leads.table.lead_details')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('leads.table.status')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('leads.table.value')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('leads.table.temperature')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('leads.table.ai_score')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('leads.table.last_contact')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 text-right">{t('leads.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.map((lead) => (
                <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500 border border-white/5 group-hover:border-bronze-500/30 group-hover:text-bronze-500 transition-colors">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-200 text-sm group-hover:text-white transition-colors">{lead.name}</p>
                        <p className="text-xs text-zinc-500">{lead.business}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-zinc-300 text-sm font-medium font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.budget)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${lead.score >= 80 ? 'bg-emerald-500' : lead.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${lead.score}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">{lead.score}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-zinc-500 text-xs">2 days ago</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onOpenChat(lead)}
                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-bronze-400 transition-colors"
                        title="Open Chat"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
