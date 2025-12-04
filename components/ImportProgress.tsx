import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Loader2 } from 'lucide-react';

interface ImportProgressProps {
    isOpen: boolean;
    progress: number;
    onCancel?: () => void;
    onMinimize?: () => void;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({ isOpen, progress, onCancel, onMinimize }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-6 right-6 z-50 w-80"
                >
                    {/* Glassmorphism container - minimal borders as requested */}
                    <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-bronze-500/10 flex items-center justify-center">
                                    <Loader2 className="text-bronze-500 animate-spin" size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-zinc-100">Importando Leads...</span>
                                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Por favor, aguarde</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {onMinimize && (
                                    <button onClick={onMinimize} className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-white/5 transition-colors">
                                        <Minimize2 size={14} />
                                    </button>
                                )}
                                {onCancel && (
                                    <button onClick={onCancel} className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                                <span>Progresso</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-bronze-600 to-bronze-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
