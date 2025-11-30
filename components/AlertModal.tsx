// @ts-nocheck
import React from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message, type = 'info' }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="text-emerald-500" size={24} />;
            case 'error':
                return <AlertCircle className="text-red-500" size={24} />;
            default:
                return <Info className="text-blue-500" size={24} />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-[#09090b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                {getIcon()}
                                <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-zinc-300 text-sm whitespace-pre-line leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-zinc-100 hover:bg-white text-black text-sm font-medium rounded-lg transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
