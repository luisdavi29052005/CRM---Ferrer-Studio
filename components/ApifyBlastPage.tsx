import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Pause, ChevronDown, Clock, Activity, Users, CheckCircle, AlertCircle, LayoutDashboard, Globe, Terminal } from 'lucide-react';
import {
    fetchApifyLeads,
    sendMessage,
    createBlastRun,
    fetchBlastRuns,
    startBlastBackend,
    stopBlastBackend,
    fetchBlastRun,
    fetchBlastLogs
} from '../services/supabaseService';
import { ApifyLead } from '../types';

export interface ApifyBlastPageHandle {
    handleStartBlast: () => void;
    handleStopBlast: () => void;
    isBlasting: boolean;
    eligibleLeadsCount: number;
}

export const ApifyBlastPage = forwardRef<ApifyBlastPageHandle>((props, ref) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Tabs
    const [activeTab, setActiveTab] = useState<'input' | 'runs'>('input');

    // Blast State
    const [blastName, setBlastName] = useState('');
    const [blastMessage, setBlastMessage] = useState('');
    const [followUpMessage, setFollowUpMessage] = useState('');
    const [blastStrategy, setBlastStrategy] = useState<'new_only' | 'follow_up' | 'smart_mix'>('new_only');
    const [messageFormat, setMessageFormat] = useState<'structured' | 'free_text'>('structured');
    const [blastInterval, setBlastInterval] = useState(10);
    const [blastBatchSize, setBlastBatchSize] = useState(20);
    const [blastPauseMinutes, setBlastPauseMinutes] = useState(5);
    const [blastFilters, setBlastFilters] = useState({ city: '', category: '' });
    const [isBlasting, setIsBlasting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseCountdown, setPauseCountdown] = useState(0);
    const [blastProgress, setBlastProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
    const [blastLogs, setBlastLogs] = useState<string[]>([]);
    const [eligibleLeads, setEligibleLeads] = useState<ApifyLead[]>([]);
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [testNumber, setTestNumber] = useState('');
    const [currentRunId, setCurrentRunId] = useState<string | null>(null);
    const [estimatedTime, setEstimatedTime] = useState<string>('');

    // Runs State
    const [runs, setRuns] = useState<any[]>([]);
    const [isLoadingRuns, setIsLoadingRuns] = useState(false);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        handleStartBlast,
        handleStopBlast,
        isBlasting,
        eligibleLeadsCount: eligibleLeads.length
    }));

    // Poll for Runs when tab is active
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const loadRuns = async () => {
            if (!isLoadingRuns && runs.length === 0) setIsLoadingRuns(true);
            const data = await fetchBlastRuns();
            if (data) setRuns(data);
            setIsLoadingRuns(false);
        };

        if (activeTab === 'runs') {
            loadRuns(); // Initial load
            intervalId = setInterval(loadRuns, 5000); // Poll every 5s
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [activeTab]);

    // Fetch eligible leads
    useEffect(() => {
        const loadLeads = async () => {
            const leads = await fetchApifyLeads();

            // Filter based on strategy
            let strategyLeads: ApifyLead[] = [];

            if (blastStrategy === 'new_only') {
                strategyLeads = leads.filter(l => !l.status);
            } else if (blastStrategy === 'follow_up') {
                strategyLeads = leads.filter(l => l.status);
            } else {
                // smart_mix: all leads
                strategyLeads = leads;
            }

            // Deduplicate by phone number to prevent double sending within the same run
            const uniqueLeads = strategyLeads.filter((lead, index, self) =>
                index === self.findIndex((t) => (
                    t.phone === lead.phone
                ))
            );

            const cities = Array.from(new Set(uniqueLeads.map(l => l.city).filter(Boolean))).sort() as string[];
            const categories = Array.from(new Set(uniqueLeads.map(l => l.category).filter(Boolean))).sort() as string[];
            setAvailableCities(cities);
            setAvailableCategories(categories);

            const filtered = uniqueLeads.filter(l => {
                const cityMatch = !blastFilters.city || l.city === blastFilters.city;
                const categoryMatch = !blastFilters.category || l.category === blastFilters.category;
                return cityMatch && categoryMatch;
            });

            setEligibleLeads(filtered);
            setBlastProgress(prev => ({ ...prev, total: filtered.length }));
        };
        loadLeads();
    }, [blastFilters, blastStrategy]);

    // Calculate Estimated Time
    useEffect(() => {
        if (eligibleLeads.length === 0) {
            setEstimatedTime('');
            return;
        }
        const totalLeads = eligibleLeads.length;
        const batches = Math.ceil(totalLeads / blastBatchSize);
        const totalSeconds = (batches * blastInterval) + (totalLeads * 2);

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes > 0) {
            setEstimatedTime(`${minutes}m ${seconds}s`);
        } else {
            setEstimatedTime(`${seconds}s`);
        }
    }, [eligibleLeads.length, blastBatchSize, blastInterval]);

    // Poll for Blast Updates
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isBlasting && currentRunId) {
            intervalId = setInterval(async () => {
                // 1. Fetch Run Stats
                const runData = await fetchBlastRun(currentRunId);
                if (runData) {
                    setBlastProgress({
                        current: (runData.success_count || 0) + (runData.failed_count || 0),
                        total: runData.total_leads,
                        success: runData.success_count || 0,
                        failed: runData.failed_count || 0
                    });

                    if (runData.status === 'completed' || runData.status === 'stopped' || runData.status === 'failed') {
                        setIsBlasting(false);
                        addLog(`🏁 Disparo finalizado com status: ${runData.status}`);
                    }
                }

                // 2. Fetch Logs
                const logs = await fetchBlastLogs(currentRunId);
                if (logs && logs.length > 0) {
                    // Map logs to string format
                    const formattedLogs = logs.map((l: any) => {
                        const time = new Date(l.created_at).toLocaleTimeString();
                        const statusIcon = l.status === 'success' ? '✅' : '❌';
                        return `[${time}] ${statusIcon} ${l.lead_phone}: ${l.status} ${l.error_message ? `(${l.error_message})` : ''}`;
                    });
                    setBlastLogs(formattedLogs);
                }

            }, 2000); // Poll every 2 seconds
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isBlasting, currentRunId]);

    const processSpintax = (text: string): string => {
        return text.replace(/\{([^{}]+)\}/g, (match, content) => {
            const options = content.split('|');
            return options[Math.floor(Math.random() * options.length)];
        });
    };

    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Bom dia';
        if (hour >= 12 && hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const addLog = (msg: string) => {
        setBlastLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 100));
    };

    const handleTestBlast = async () => {
        if (!testNumber.trim()) {
            alert("Por favor, insira um número de teste.");
            return;
        }
        if (!blastMessage.trim()) {
            alert("Por favor, insira o conteúdo da mensagem.");
            return;
        }

        try {
            const spintaxBody = processSpintax(blastMessage);
            let fullMessage = spintaxBody;

            if (messageFormat === 'structured') {
                const greeting = getGreeting();
                const companyName = "Empresa Teste";
                fullMessage = `${greeting}, ${companyName},\n\n${spintaxBody}`;
            }

            const cleanNumber = testNumber.replace(/\D/g, '');
            const formattedNumber = cleanNumber.includes('@c.us') ? cleanNumber : `${cleanNumber}@c.us`;

            await sendMessage(formattedNumber, fullMessage);
            addLog(`🧪 Mensagem de teste enviada para ${testNumber}`);
            alert(`Mensagem de teste enviada para ${testNumber}`);
        } catch (error) {
            console.error("Falha no teste de disparo:", error);
            addLog(`❌ Falha na mensagem de teste: ${error}`);
            alert(`Falha na mensagem de teste: ${error}`);
        }
    };

    const handleStartBlast = async () => {
        if (!blastMessage.trim()) {
            alert("Por favor, insira uma mensagem principal.");
            return;
        }
        if (blastStrategy === 'smart_mix' && !followUpMessage.trim()) {
            alert("Por favor, insira uma mensagem de follow-up para o Mix Inteligente.");
            return;
        }


        setIsBlasting(true);
        setBlastProgress({ current: 0, total: eligibleLeads.length, success: 0, failed: 0 });
        setBlastLogs([]);
        addLog(`🚀 Iniciando disparo para ${eligibleLeads.length} leads...`);

        // Create Blast Run
        const runId = await createBlastRun(
            eligibleLeads.length,
            {
                ...blastFilters,
                strategy: blastStrategy,
                messageFormat,
                followUpMessage: blastStrategy === 'smart_mix' ? followUpMessage : undefined
            },
            blastMessage,
            blastBatchSize,
            blastInterval,
            blastName // Pass blast name
        );

        if (!runId) {
            alert('Falha ao criar execução de disparo');
            setIsBlasting(false);
            return;
        }

        setCurrentRunId(runId);

        // Start Backend Blast
        try {
            await startBlastBackend(runId, {
                batchSize: blastBatchSize,
                intervalSeconds: blastInterval,
                messageTemplate: blastMessage,
                filters: blastFilters,
                strategy: blastStrategy,
                messageFormat,
                followUpMessage
            });
            alert('Disparo iniciado! Monitorando em tempo real...');
        } catch (error) {
            console.error('Falha ao iniciar disparo no backend:', error);
            alert('Falha ao iniciar processo de disparo');
            setIsBlasting(false);
        }
    };

    const handleStopBlast = async () => {
        if (!currentRunId) return;
        try {
            await stopBlastBackend(currentRunId);
            alert('Parando disparo...');
            setIsBlasting(false);
        } catch (error) {
            console.error('Falha ao parar disparo:', error);
            alert('Falha ao parar disparo');
        }
    };

    const SectionHeader = ({ title }: { title: string }) => (
        <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</h3>
        </div>
    );

    const Label = ({ children }: { children: React.ReactNode }) => (
        <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">{children}</label>
    );

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            {/* Single Panel Container */}
            <div className="bg-[#0B0B0B] border border-white/10 rounded-xl shadow-sm overflow-hidden">

                {/* 1. Message Composition (Full Width) */}
                <SectionHeader title="1. Composição da Mensagem" />
                <div className="p-6 grid grid-cols-12 gap-6">
                    <div className="col-span-12 md:col-span-3 space-y-4">
                        <div>
                            <Label>Formato da Mensagem</Label>
                            <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5">
                                <button
                                    onClick={() => setMessageFormat('structured')}
                                    className={`flex-1 px-3 py-2 rounded-md text-[10px] font-medium transition-all ${messageFormat === 'structured'
                                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    Estruturado
                                </button>
                                <button
                                    onClick={() => setMessageFormat('free_text')}
                                    className={`flex-1 px-3 py-2 rounded-md text-[10px] font-medium transition-all ${messageFormat === 'free_text'
                                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    Texto Livre
                                </button>
                            </div>
                        </div>
                        <div>
                            <Label>Estratégia</Label>
                            <div className="relative">
                                <select
                                    value={blastStrategy}
                                    onChange={(e) => setBlastStrategy(e.target.value as any)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 px-3 text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 appearance-none cursor-pointer transition-all text-xs hover:border-white/20"
                                >
                                    <option value="new_only" className="bg-[#09090b]">Apenas Novos Leads</option>
                                    <option value="follow_up" className="bg-[#09090b]">Apenas Follow-up</option>
                                    <option value="smart_mix" className="bg-[#09090b]">Mix Inteligente</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 md:col-span-9 flex flex-col">
                        <Label>Mensagem Principal</Label>
                        <textarea
                            value={blastMessage}
                            onChange={(e) => setBlastMessage(e.target.value)}
                            placeholder="Digite sua mensagem aqui..."
                            className="flex-1 w-full bg-black/20 border border-white/10 rounded-lg p-4 text-zinc-200 focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 outline-none resize-none font-mono text-xs leading-relaxed transition-all placeholder:text-zinc-700 hover:border-white/20 min-h-[120px]"
                        />
                        <p className="text-[10px] text-zinc-600 mt-2">
                            Use {'{Oi|Olá}'} para spintax. Variáveis: {'{{name}}'}, {'{{city}}'}.
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/5 w-full" />

                {/* Bottom Section: Config & Monitoring */}
                <div className="grid grid-cols-12 divide-x divide-white/5">

                    {/* 2. Configuration & Testing (Left Column) */}
                    <div className="col-span-12 lg:col-span-7">
                        <SectionHeader title="2. Configuração e Teste" />
                        <div className="p-6 space-y-6">
                            {/* Filters Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Cidade</Label>
                                    <div className="relative">
                                        <select
                                            value={blastFilters.city}
                                            onChange={(e) => setBlastFilters(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 appearance-none cursor-pointer text-xs hover:border-white/20 transition-all"
                                        >
                                            <option value="" className="bg-[#09090b]">Todas as Cidades</option>
                                            {availableCities.map(city => (
                                                <option key={city} value={city} className="bg-[#09090b]">{city}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <Label>Categoria</Label>
                                    <div className="relative">
                                        <select
                                            value={blastFilters.category}
                                            onChange={(e) => setBlastFilters(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 appearance-none cursor-pointer text-xs hover:border-white/20 transition-all"
                                        >
                                            <option value="" className="bg-[#09090b]">Todas as Categorias</option>
                                            {availableCategories.map(cat => (
                                                <option key={cat} value={cat} className="bg-[#09090b]">{cat}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Campaign Name */}
                            <div>
                                <Label>Nome da Campanha</Label>
                                <input
                                    type="text"
                                    value={blastName}
                                    onChange={(e) => setBlastName(e.target.value)}
                                    placeholder="ex: Promoção Novembro"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 text-xs placeholder:text-zinc-700 hover:border-white/20 transition-all"
                                />
                            </div>

                            {/* Interval / Batch / Pause */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Intervalo (s)</Label>
                                    <input
                                        type="number"
                                        value={blastInterval}
                                        onChange={(e) => setBlastInterval(Number(e.target.value))}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 text-xs hover:border-white/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <Label>Tamanho do Lote</Label>
                                    <input
                                        type="number"
                                        value={blastBatchSize}
                                        onChange={(e) => setBlastBatchSize(Number(e.target.value))}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 text-xs hover:border-white/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <Label>Pausa (min)</Label>
                                    <input
                                        type="number"
                                        value={blastPauseMinutes}
                                        onChange={(e) => setBlastPauseMinutes(Number(e.target.value))}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 text-xs hover:border-white/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Test Blast */}
                            <div>
                                <Label>Teste de Disparo</Label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={testNumber}
                                        onChange={(e) => setTestNumber(e.target.value)}
                                        placeholder="5511999999999"
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 font-mono text-xs hover:border-white/20 transition-all"
                                    />
                                    <button
                                        onClick={handleTestBlast}
                                        className="px-4 py-2 bg-transparent hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-white/10 hover:border-white/20 transition-all text-xs font-bold uppercase tracking-wide"
                                    >
                                        Enviar Teste
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Live Monitoring (Right Column) */}
                    <div className="col-span-12 lg:col-span-5">
                        <SectionHeader title="3. Monitoramento em Tempo Real" />
                        <div className="p-6 flex flex-col h-full">
                            {/* Stats Headers */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label>Progresso</Label>
                                    <div className="text-xl font-mono text-zinc-200">
                                        {blastProgress.current} <span className="text-zinc-600 text-sm">/ {blastProgress.total}</span>
                                    </div>
                                </div>
                                <div>
                                    <Label>Sucesso</Label>
                                    <div className="text-xl font-mono text-emerald-400">
                                        {blastProgress.current > 0 ? Math.round((blastProgress.success / blastProgress.current) * 100) : 0}%
                                    </div>
                                </div>
                            </div>

                            {/* Logs List View */}
                            <div className="flex-1 bg-black/20 border border-white/5 rounded-lg overflow-hidden flex flex-col">
                                <div className="px-3 py-2 border-b border-white/5 bg-white/[0.02]">
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Log de Atividade</span>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                    {blastLogs.length === 0 ? (
                                        <div className="p-4 text-center text-zinc-600 text-xs italic">
                                            Aguardando início do disparo...
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-white/5">
                                            {blastLogs.map((log, i) => (
                                                <div key={i} className="px-3 py-2 text-[10px] font-mono text-zinc-400 hover:bg-white/[0.02] transition-colors truncate">
                                                    {log}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
