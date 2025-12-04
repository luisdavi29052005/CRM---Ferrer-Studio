import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AutomationFlow } from '../types';
import { ApifyBlastPage, ApifyBlastPageHandle } from './ApifyBlastPage';
import { Agents, AgentsHandle } from './Agents';
import { Zap, Bot, Send, Play, Pause, Plus, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AutomationProps {
  flows: AutomationFlow[];
  isAdmin: boolean;
  isLoading?: boolean;
}

export const Automation: React.FC<AutomationProps> = ({ flows, isAdmin, isLoading }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'blast' | 'agents'>('blast');
  const blastPageRef = useRef<ApifyBlastPageHandle>(null);
  const agentsRef = useRef<AgentsHandle>(null);
  const [isBlasting, setIsBlasting] = useState(false);

  const handleBlastClick = () => {
    if (blastPageRef.current) {
      if (blastPageRef.current.isBlasting) {
        blastPageRef.current.handleStopBlast();
        setIsBlasting(false);
      } else {
        blastPageRef.current.handleStartBlast();
        setIsBlasting(true);
      }
    }
  };

  const handleCreateAgentClick = () => {
    if (agentsRef.current) {
      agentsRef.current.handleCreate();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-100 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden relative bg-[#050505]">
      {/* Header - Matches ApifyImports Header */}
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">
            {activeTab === 'blast' ? 'Disparo em Massa' : 'Agentes AI'}
          </h2>
          <p className="text-zinc-500 text-sm mt-2 font-medium">
            {activeTab === 'blast'
              ? 'Configure e acompanhe disparos automáticos para seus leads.'
              : 'Crie e gerencie seus assistentes virtuais.'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Tab Switcher */}
          <div className="flex bg-black/20 p-1 rounded-lg backdrop-blur-sm border border-white/5">
            <button
              onClick={() => setActiveTab('blast')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${activeTab === 'blast'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
            >
              <Send size={12} />
              Disparo
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${activeTab === 'agents'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
            >
              <Bot size={12} />
              Agentes
            </button>
          </div>

          <div className="h-6 w-px bg-white/10 mx-2"></div>

          {/* Actions */}
          {activeTab === 'blast' && (
            <button
              onClick={handleBlastClick}
              className={`px-4 py-2 rounded-lg transition-colors text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${isBlasting
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                : 'bg-white hover:bg-zinc-200 text-black'
                }`}
            >
              {isBlasting ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              <span>{isBlasting ? 'Parar Disparo' : 'Iniciar Disparo'}</span>
            </button>
          )}

          {activeTab === 'agents' && (
            <button
              onClick={handleCreateAgentClick}
              className="px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors text-xs font-bold uppercase tracking-wide flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Criar Agente</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'blast' ? (
            <motion.div
              key="blast"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ApifyBlastPage ref={blastPageRef} />
            </motion.div>
          ) : (
            <motion.div
              key="agents"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Agents ref={agentsRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
