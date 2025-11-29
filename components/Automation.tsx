import React from 'react';
import { useTranslation } from 'react-i18next';
import { AutomationFlow } from '../types';
import { Play, Pause, Workflow, Plus, Calendar, Activity, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';

interface AutomationProps {
  flows: AutomationFlow[];
  isAdmin: boolean;
}

export const Automation: React.FC<AutomationProps> = ({ flows, isAdmin }) => {
  const { t } = useTranslation();
  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">{t('automation.title')}</h2>
          <p className="text-zinc-500 text-sm mt-2 font-medium">{t('automation.subtitle')}</p>
        </div>
        {isAdmin && (
          <button className="group flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-black rounded-lg text-sm font-medium transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
            <Plus size={16} className="text-black/70 group-hover:text-black transition-colors" />
            <span>{t('automation.new_workflow')}</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-4 px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

          {/* Create Workflow Card */}
          {isAdmin && (
            <button className="group relative flex flex-col items-center justify-center p-6 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all min-h-[180px] text-center gap-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/0 to-zinc-800/0 group-hover:from-zinc-800/10 group-hover:to-transparent transition-all duration-500" />

              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-white/10 transition-all shadow-lg">
                <Plus size={20} className="text-zinc-500 group-hover:text-zinc-200 transition-colors" />
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{t('automation.create_workflow')}</h3>
                <p className="text-xs text-zinc-600 mt-1 max-w-[140px] mx-auto group-hover:text-zinc-500 transition-colors">{t('automation.connect_n8n')}</p>
              </div>
            </button>
          )}

          {/* Workflow Cards */}
          {flows.map((flow) => (
            <div key={flow.id} className="group relative flex flex-col p-5 rounded-xl border border-white/5 bg-[#0A0A0A] hover:border-white/10 transition-all hover:shadow-xl hover:shadow-black/50">

              {/* Status Badge */}
              <div className="flex justify-between items-start mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${flow.status === 'active'
                  ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500'
                  : 'bg-zinc-500/5 border-zinc-500/10 text-zinc-500'
                  }`}>
                  <Workflow size={14} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${flow.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-600'}`}></span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${flow.status === 'active' ? 'text-emerald-500' : 'text-zinc-600'}`}>
                    {flow.status === 'active' ? t('automation.active') : t('automation.paused')}
                  </span>
                </div>
              </div>

              {/* Info */}
              <h3 className="text-sm font-bold text-zinc-200 mb-1 truncate pr-6">{flow.name}</h3>
              <p className="text-xs text-zinc-500 line-clamp-2 mb-4 h-8">{flow.description || 'No description provided.'}</p>

              {/* Metrics */}
              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-600">
                <div className="flex items-center gap-1.5" title="Last Run">
                  <Calendar size={12} />
                  <span>{flow.last_run ? new Date(flow.last_run).toLocaleDateString() : 'Never'}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Leads Processed">
                  <Activity size={12} />
                  <span>{flow.leads_touched || 0}</span>
                </div>
              </div>

              {/* Hover Actions */}
              {isAdmin && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button className="p-1.5 rounded-md hover:bg-white/10 text-zinc-500 hover:text-zinc-200 transition-colors">
                    <Edit2 size={12} />
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Empty State (if no flows, but we always show Create Card so this might be redundant if we want grid always. 
              But if flows is empty, we just show Create Card. 
              If we wanted a dedicated empty state area, we could do that, but the grid with Create Card is cleaner.) 
          */}
        </div>

        {flows.length === 0 && (
          <div className="mt-12 flex flex-col items-center justify-center text-center opacity-40">
            <Workflow size={48} className="text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-sm">{t('automation.no_workflows')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

