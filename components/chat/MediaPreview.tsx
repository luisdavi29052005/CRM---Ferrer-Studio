import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface MediaPreviewProps {
    file: File;
    onSend: (file: File, caption: string) => void;
    onCancel: () => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ file, onSend, onCancel }) => {
    const [caption, setCaption] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleSend = () => {
        onSend(file, caption);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!previewUrl) return null;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    return (
        <div className="fixed inset-0 z-[60] bg-[#09090b] flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="h-[60px] px-4 flex items-center justify-between bg-[#09090b] shrink-0">
                <button
                    onClick={onCancel}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>
                <h2 className="text-zinc-200 font-medium">Pré-visualização</h2>
                <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* Media Display */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-[#09090b]">
                {isImage && (
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                )}
                {isVideo && (
                    <video
                        src={previewUrl}
                        controls
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                )}
                {!isImage && !isVideo && (
                    <div className="flex flex-col items-center justify-center text-zinc-400 p-10 bg-zinc-900 rounded-xl">
                        <span className="text-lg font-medium mb-2">{file.name}</span>
                        <span className="text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                )}
            </div>

            {/* Caption Input Area */}
            <div className="p-4 bg-[#09090b] shrink-0 flex justify-center pb-8">
                <div className="max-w-3xl w-full flex items-end gap-2">
                    <div className="flex-1 bg-zinc-900 rounded-lg flex items-center">
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Adicione uma legenda..."
                            className="w-full bg-transparent border-none focus:ring-0 text-zinc-200 placeholder:text-zinc-500 resize-none py-3 px-4 text-[15px] custom-scrollbar leading-relaxed outline-none"
                            rows={1}
                            style={{
                                minHeight: '48px',
                                maxHeight: '120px'
                            }}
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSend}
                        className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-colors flex items-center justify-center"
                    >
                        <Send size={20} className="ml-0.5" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
