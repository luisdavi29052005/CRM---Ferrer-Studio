import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Pause, ChevronDown, Clock, List, LayoutDashboard, CheckCircle, AlertCircle } from 'lucide-react';
import {
    fetchApifyLeads,
    updateApifyLeadStatus,
    sendMessage,
    createBlastRun,
    updateBlastRun,
    logBlastAction,
    fetchBlastRuns,
    startBlastBackend,
    stopBlastBackend,
    fetchBlastRun,
    fetchBlastLogs
} from '../services/supabaseService';
import { ApifyLead } from '../types';

export const ApifyBlastPage: React.FC = () => {
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

    const stopBlastRef = useRef(false);

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
        // Total time = (batches * interval) + (processing time per batch ~ 2s * batchSize)
        // This is a rough estimate.
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
                        addLog(`🏁 Blast finished with status: ${runData.status}`);
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

    // Fetch Runs when tab changes
    useEffect(() => {
        if (activeTab === 'runs') {
            const loadRuns = async () => {
                setIsLoadingRuns(true);
                const data = await fetchBlastRuns();
                setRuns(data || []);
                setIsLoadingRuns(false);
            };
            loadRuns();
        }
    }, [activeTab]);

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
            alert("Please enter a test number.");
            return;
        }
        if (!blastMessage.trim()) {
            alert("Please enter a message content.");
            return;
        }

        try {
            const spintaxBody = processSpintax(blastMessage);
            let fullMessage = spintaxBody;

            if (messageFormat === 'structured') {
                const greeting = getGreeting();
                const companyName = "Test Company";
                fullMessage = `${greeting}, ${companyName},\n\n${spintaxBody}`;
            }

            const cleanNumber = testNumber.replace(/\D/g, '');
            const formattedNumber = cleanNumber.includes('@c.us') ? cleanNumber : `${cleanNumber}@c.us`;

            await sendMessage(formattedNumber, fullMessage);
            addLog(`🧪 Test message sent to ${testNumber}`);
            alert(`Test message sent to ${testNumber}`);
        } catch (error) {
            console.error("Test blast failed:", error);
            addLog(`❌ Test message failed: ${error}`);
            alert(`Test message failed: ${error}`);
        }
    };

    const handleStartBlast = async () => {
        if (!blastMessage.trim()) {
            alert("Please enter a primary message.");
            return;
        }
        if (blastStrategy === 'smart_mix' && !followUpMessage.trim()) {
            alert("Please enter a follow-up message for Smart Mix.");
            return;
        }


        setIsBlasting(true);
        setBlastProgress({ current: 0, total: eligibleLeads.length, success: 0, failed: 0 });
        setBlastLogs([]);
        addLog(`🚀 Starting blast to ${eligibleLeads.length} leads...`);

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
            alert('Failed to create blast run');
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
            alert('Blast started! Monitoring in real-time...');
            // setActiveTab('runs'); // Removed redirection
        } catch (error) {
            console.error('Failed to start backend blast:', error);
            alert('Failed to start blast process');
            setIsBlasting(false);
        }
    };

    const handleStopBlast = async () => {
        if (!currentRunId) return;
        try {
            await stopBlastBackend(currentRunId);
            alert('Stopping blast...');
            setIsBlasting(false);
        } catch (error) {
            console.error('Failed to stop blast:', error);
            alert('Failed to stop blast');
        }
    };

    return (
        <div className="h-screen overflow-hidden flex flex-col bg-[#09090b] text-zinc-200 font-sans p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0 border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/automation')}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft size={20} strokeWidth={1.5} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Apify Blast Workflow</h1>
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">Bulk Message Sender</p>
                    </div>
                </div>
                <div>
                    {!isBlasting ? (
                        <button
                            onClick={handleStartBlast}
                            disabled={eligibleLeads.length === 0 || activeTab !== 'input'}
                            className={`flex items-center gap-2 px-5 py-2 bg-zinc-100 hover:bg-white text-black rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm ${activeTab !== 'input' ? 'opacity-0 pointer-events-none' : ''}`}
                        >
                            <Play size={14} fill="currentColor" />
                            Start Blast
                        </button>
                    ) : (
                        <button
                            onClick={handleStopBlast}
                            className="flex items-center gap-2 px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-medium transition-all text-sm"
                        >
                            <Pause size={14} fill="currentColor" />
                            Stop Blast
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 mb-6 border-b border-white/5 px-2">
                <button
                    onClick={() => setActiveTab('input')}
                    className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'input' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Input
                    {activeTab === 'input' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-100 rounded-t-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('runs')}
                    className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${activeTab === 'runs' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Runs
                    <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[10px] font-mono">{runs.length}</span>
                    {activeTab === 'runs' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-100 rounded-t-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                    )}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'input' ? (
                    // INPUT TAB CONTENT
                    <div className="h-full grid grid-cols-12 gap-6">
                        {/* Left Panel: Message Composition (Cols 1-5) */}
                        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                                    1. Message Composition
                                </h3>
                                {/* Format Toggle */}
                                <div className="flex bg-zinc-900/50 p-0.5 rounded-lg border border-zinc-800">
                                    <button
                                        onClick={() => setMessageFormat('structured')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all ${messageFormat === 'structured'
                                            ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                            }`}
                                    >
                                        Structured
                                    </button>
                                    <button
                                        onClick={() => setMessageFormat('free_text')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all ${messageFormat === 'free_text'
                                            ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                            }`}
                                    >
                                        Free Text
                                    </button>
                                </div>
                            </div>



                            {/* Strategy Selector */}
                            <div>
                                <div className="relative">
                                    <select
                                        value={blastStrategy}
                                        onChange={(e) => setBlastStrategy(e.target.value as any)}
                                        className="w-full bg-zinc-900/30 border border-zinc-800 rounded-lg py-2 px-3 text-zinc-300 outline-none focus:border-zinc-600 appearance-none cursor-pointer transition-colors text-xs"
                                    >
                                        <option value="new_only" className="bg-[#09090b]">New Leads Only (Default)</option>
                                        <option value="follow_up" className="bg-[#09090b]">Follow-up Only (Previously Contacted)</option>
                                        <option value="smart_mix" className="bg-[#09090b]">Smart Mix (New + Follow-up)</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                                </div>
                            </div>

                            {/* Primary Message */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                                    Primary Message {blastStrategy === 'smart_mix' && '(New Leads)'}
                                </label>
                                <div className="relative flex-1 flex flex-col">
                                    <textarea
                                        value={blastMessage}
                                        onChange={(e) => setBlastMessage(e.target.value)}
                                        placeholder="Type your message here... Use {Hi|Hello} for spintax. {{name}} and {{city}} variables supported."
                                        className="flex-1 w-full bg-zinc-900/30 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:border-zinc-600 outline-none resize-none font-mono text-xs leading-relaxed transition-all placeholder:text-zinc-700"
                                    />
                                    <div className="absolute bottom-2 right-2 text-[10px] text-zinc-600 font-mono">
                                        {blastMessage.length} chars
                                    </div>
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-1.5">
                                    {messageFormat === 'structured'
                                        ? "Auto-Greeting: Bom dia/tarde/noite, [Company Name]"
                                        : "Sent exactly as typed (No auto-greeting)"}
                                </p>
                            </div>

                            {/* Follow-up Message (Conditional) */}
                            {blastStrategy === 'smart_mix' && (
                                <div className="flex-1 flex flex-col min-h-0 border-t border-white/5 pt-4">
                                    <label className="block text-[10px] font-medium text-blue-400 uppercase tracking-wider mb-2">
                                        Follow-up Message (Contacted Leads)
                                    </label>
                                    <div className="relative flex-1 flex flex-col">
                                        <textarea
                                            value={followUpMessage}
                                            onChange={(e) => setFollowUpMessage(e.target.value)}
                                            placeholder="Type your follow-up message here..."
                                            className="flex-1 w-full bg-blue-900/5 border border-blue-900/20 rounded-lg p-3 text-zinc-300 focus:border-blue-500/30 outline-none resize-none font-mono text-xs leading-relaxed transition-all placeholder:text-zinc-700"
                                        />
                                        <div className="absolute bottom-2 right-2 text-[10px] text-zinc-600 font-mono">
                                            {followUpMessage.length} chars
                                        </div>
                                    </div>
                                </div>
                            )}


                        </div>

                        {/* Middle Panel: Configuration (Cols 6-9) */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2">
                            <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                                2. Configuration & Testing
                            </h3>

                            {/* Filters */}
                            <div className="space-y-4 p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Target Filters</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <select
                                            value={blastFilters.city}
                                            onChange={(e) => setBlastFilters(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full bg-transparent border-b border-zinc-800 py-1.5 text-zinc-300 outline-none focus:border-zinc-500 appearance-none cursor-pointer text-xs"
                                        >
                                            <option value="" className="bg-[#09090b]">All Cities</option>
                                            {availableCities.map(city => (
                                                <option key={city} value={city} className="bg-[#09090b]">{city}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={blastFilters.category}
                                            onChange={(e) => setBlastFilters(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full bg-transparent border-b border-zinc-800 py-1.5 text-zinc-300 outline-none focus:border-zinc-500 appearance-none cursor-pointer text-xs"
                                        >
                                            <option value="" className="bg-[#09090b]">All Categories</option>
                                            {availableCategories.map(cat => (
                                                <option key={cat} value={cat} className="bg-[#09090b]">{cat}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Execution Settings */}
                            <div className="space-y-4 p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Execution Controls</label>

                                {/* Blast Name Input */}
                                <div>
                                    <label className="block text-[10px] text-zinc-600 mb-1">Blast Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={blastName}
                                        onChange={(e) => setBlastName(e.target.value)}
                                        placeholder="e.g. Campaign November 2024"
                                        className="w-full bg-transparent border-b border-zinc-800 py-1 text-zinc-300 outline-none focus:border-zinc-500 text-xs placeholder:text-zinc-700"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-zinc-600 mb-1">Interval (s)</label>
                                        <input
                                            type="number"
                                            value={blastInterval}
                                            onChange={(e) => setBlastInterval(Number(e.target.value))}
                                            className="w-full bg-transparent border-b border-zinc-800 py-1 text-zinc-300 outline-none focus:border-zinc-500 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-600 mb-1">Batch Size</label>
                                        <input
                                            type="number"
                                            value={blastBatchSize}
                                            onChange={(e) => setBlastBatchSize(Number(e.target.value))}
                                            className="w-full bg-transparent border-b border-zinc-800 py-1 text-zinc-300 outline-none focus:border-zinc-500 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-600 mb-1">Pause (min)</label>
                                        <input
                                            type="number"
                                            value={blastPauseMinutes}
                                            onChange={(e) => setBlastPauseMinutes(Number(e.target.value))}
                                            className="w-full bg-transparent border-b border-zinc-800 py-1 text-zinc-300 outline-none focus:border-zinc-500 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Estimated Time Display */}
                            {estimatedTime && (
                                <div className="px-4 pb-4">
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-3">
                                        <Clock size={16} className="text-blue-400" />
                                        <div>
                                            <div className="text-[10px] text-blue-300 uppercase font-bold tracking-wider">Estimated Duration</div>
                                            <div className="text-sm font-mono font-bold text-blue-100">{estimatedTime}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Test Blast */}
                            <div className="space-y-4 p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Test Blast</label>
                                <div className="flex gap-3 items-end">
                                    <input
                                        type="text"
                                        value={testNumber}
                                        onChange={(e) => setTestNumber(e.target.value)}
                                        placeholder="5511999999999"
                                        className="flex-1 bg-transparent border-b border-zinc-800 py-1.5 text-zinc-300 outline-none focus:border-zinc-500 font-mono text-xs"
                                    />
                                    <button
                                        onClick={handleTestBlast}
                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium transition-colors"
                                    >
                                        Send Test
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Monitoring (Cols 10-12) */}
                        <div className="col-span-12 lg:col-span-3 flex flex-col h-full overflow-hidden border-l border-white/5 pl-6">
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                                    3. Live Monitoring
                                </h3>
                                {isPaused && (
                                    <span className="text-[10px] font-mono text-yellow-500 animate-pulse bg-yellow-500/10 px-2 py-0.5 rounded">
                                        Paused ({Math.floor(pauseCountdown)}s)
                                    </span>
                                )}
                            </div>

                            {/* Progress Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Progress</div>
                                    <div className="text-xl font-mono font-bold text-zinc-200">
                                        {blastProgress.current}<span className="text-zinc-600 text-sm">/{blastProgress.total}</span>
                                    </div>
                                </div>
                                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Success Rate</div>
                                    <div className="text-xl font-mono font-bold text-green-400">
                                        {blastProgress.current > 0 ? Math.round((blastProgress.success / blastProgress.current) * 100) : 0}%
                                    </div>
                                </div>
                            </div>

                            {/* Logs */}
                            <div className="flex-1 bg-black/40 rounded-lg border border-white/5 p-3 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar">
                                {blastLogs.length === 0 ? (
                                    <div className="text-zinc-600 italic text-center mt-10">Ready to start...</div>
                                ) : (
                                    blastLogs.map((log, i) => (
                                        <div key={i} className="text-zinc-400 border-b border-white/5 pb-1 last:border-0">
                                            {log}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // RUNS TAB CONTENT
                    <div className="h-full overflow-y-auto custom-scrollbar p-6">
                        {isLoadingRuns ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        ) : runs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                                <LayoutDashboard size={48} strokeWidth={1} className="mb-4 opacity-50" />
                                <p>No blast runs found.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto custom-scrollbar -mx-6 px-6">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
                                        <tr>
                                            <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 w-12">
                                                <div className="w-4 h-4 border border-zinc-700 rounded bg-zinc-900/50"></div>
                                            </th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">Status</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">Actor</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">Task</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 text-right">Results</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">Started</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">Finished</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 text-right">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {runs.map((run) => {
                                            const startTime = new Date(run.created_at);
                                            const endTime = run.finished_at ? new Date(run.finished_at) : (run.status === 'completed' ? new Date() : null);
                                            const duration = endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
                                            const durationStr = duration > 60 ? `${Math.floor(duration / 60)}m ${duration % 60}s` : `${duration}s`;

                                            return (
                                                <tr key={run.id} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="w-4 h-4 border border-zinc-700 rounded bg-zinc-900/50 group-hover:border-zinc-500 transition-colors"></div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1 rounded ${run.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                                run.status === 'running' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                                                                    run.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                                                        'bg-zinc-500/10 text-zinc-500'
                                                                }`}>
                                                                {run.status === 'completed' ? <CheckCircle size={14} /> :
                                                                    run.status === 'running' ? <Play size={14} /> :
                                                                        run.status === 'failed' ? <AlertCircle size={14} /> :
                                                                            <Clock size={14} />}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center shadow-sm">
                                                                <img src="https://apify.com/favicon.ico" alt="Apify" className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-zinc-200 text-sm">Apify Blast</div>
                                                                <div className="text-[10px] text-zinc-500 font-mono">comp...blast</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="text-sm text-zinc-300 font-medium">
                                                            {run.filters?.run_name || `Blast Run #${run.id.slice(0, 8)}`}
                                                        </div>
                                                        <div className="text-[10px] text-zinc-500 mt-0.5">
                                                            {run.filters?.strategy === 'new_only' ? 'New Leads' :
                                                                run.filters?.strategy === 'follow_up' ? 'Follow-up' : 'Smart Mix'}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="font-mono text-sm text-blue-400 font-bold">
                                                            {run.success_count}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="text-xs text-zinc-400 font-mono">
                                                            {startTime.toLocaleDateString()}
                                                            <br />
                                                            {startTime.toLocaleTimeString()}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="text-xs text-zinc-400 font-mono">
                                                            {run.status === 'completed' || run.status === 'failed' ? (
                                                                <>
                                                                    {endTime?.toLocaleDateString()}
                                                                    <br />
                                                                    {endTime?.toLocaleTimeString()}
                                                                </>
                                                            ) : (
                                                                <span className="text-zinc-600">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="text-sm text-zinc-300 font-mono">
                                                            {run.status === 'running' ? (
                                                                <span className="text-blue-500 animate-pulse">Running...</span>
                                                            ) : (
                                                                durationStr
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
