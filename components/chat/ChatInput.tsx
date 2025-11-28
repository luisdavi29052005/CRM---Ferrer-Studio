import React, { useState, useRef } from 'react';
import { Send, Paperclip, Mic, Smile, X, Image as ImageIcon, FileText, Camera, Plus } from 'lucide-react';

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    onSendMedia: (file: File, type: 'image' | 'video' | 'file' | 'audio') => void;
    isSending: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onSendMedia, isSending }) => {
    const [text, setText] = useState('');
    const [showAttachments, setShowAttachments] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachmentType, setAttachmentType] = useState<'image' | 'video' | 'file' | 'audio' | null>(null);

    const handleSend = () => {
        if (text.trim()) {
            onSendMessage(text);
            setText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleAttachmentClick = (type: 'image' | 'video' | 'file') => {
        setAttachmentType(type);
        if (fileInputRef.current) {
            if (type === 'image') fileInputRef.current.accept = 'image/*';
            else if (type === 'video') fileInputRef.current.accept = 'video/*';
            else fileInputRef.current.accept = '*/*';

            fileInputRef.current.click();
        }
        setShowAttachments(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && attachmentType) {
            onSendMedia(file, attachmentType);
        }
        // Reset
        if (fileInputRef.current) fileInputRef.current.value = '';
        setAttachmentType(null);
    };

    return (
        <div className="p-8 pt-4 bg-[#0F0F0F] relative z-30 shrink-0 border-t border-white/5">
            {/* Attachment Menu */}
            {showAttachments && (
                <div className="absolute bottom-24 left-8 flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200 z-50 bg-zinc-900 border border-white/5 p-2 rounded-lg shadow-xl">
                    <button
                        onClick={() => handleAttachmentClick('image')}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-md transition-colors text-zinc-400 hover:text-zinc-200 text-sm font-medium"
                    >
                        <ImageIcon size={16} />
                        <span>Photos & Videos</span>
                    </button>
                    <button
                        onClick={() => handleAttachmentClick('file')}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-md transition-colors text-zinc-400 hover:text-zinc-200 text-sm font-medium"
                    >
                        <FileText size={16} />
                        <span>Document</span>
                    </button>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="flex items-end gap-4">
                <div className="flex gap-2 pb-2">
                    <button
                        onClick={() => setShowAttachments(!showAttachments)}
                        className={`p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all ${showAttachments ? 'text-zinc-200 bg-white/5' : ''}`}
                        title="Attach"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex-1 relative group">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-b border-zinc-800 text-zinc-200 px-0 py-2 focus:outline-none focus:border-bronze-500 transition-colors text-sm placeholder:text-zinc-600 min-h-[40px] max-h-[120px] resize-none custom-scrollbar leading-relaxed"
                        rows={1}
                    />
                </div>

                <div className="pb-1">
                    {text.trim() ? (
                        <button
                            onClick={handleSend}
                            disabled={isSending}
                            className="p-2 bg-zinc-100 hover:bg-white text-black rounded-lg transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} />
                        </button>
                    ) : (
                        <button className="p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all">
                            <Mic size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
