import React from 'react';
import { Lock, MessageSquare } from 'lucide-react';

export const ChatLoading: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0F0F0F] text-zinc-300 z-50 relative">
            {/* Main Content */}
            <div className="flex flex-col items-center mb-16">
                {/* Icon */}
                <div className="mb-6 text-zinc-500">
                    <MessageSquare size={64} strokeWidth={1} />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-medium text-zinc-200 tracking-wide">Ferrer Studio</h1>

                {/* Subtitle / Description (Optional, keeping it clean like WA) */}
                <div className="mt-8 w-72 bg-zinc-800 h-0.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-progress-indeterminate w-1/3 rounded-full"></div>
                </div>
                <p className="mt-4 text-sm text-zinc-500">Loading your chats...</p>
            </div>

            {/* Footer - Encryption Message */}
            <div className="absolute bottom-10 flex items-center gap-2 text-xs text-zinc-500">
                <Lock size={12} />
                <span>End-to-end encrypted</span>
            </div>

            <style>{`
                @keyframes progress-indeterminate {
                    0% { margin-left: -30%; width: 30%; }
                    50% { width: 50%; }
                    100% { margin-left: 100%; width: 30%; }
                }
                .animate-progress-indeterminate {
                    animation: progress-indeterminate 1.5s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};
