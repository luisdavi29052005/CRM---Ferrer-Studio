import React, { useState } from 'react';
import { Message } from './types';
import { WA_COLORS } from './constants';
import { Mic } from 'lucide-react';

interface MessageBubbleProps {
    message: Message;
    onUpdate: (updates: Partial<Message>) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.content);

    const handleBlur = () => {
        setIsEditing(false);
        if (editText !== message.content) {
            onUpdate({ content: editText });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleBlur();
        }
    };

    if (message.type === 'audio') {
        return (
            <div className={`flex ${message.isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                <div
                    className={`relative max-w-[75%] px-2 py-1.5 rounded-lg ${message.isMe ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                    style={{ backgroundColor: message.isMe ? WA_COLORS.sentBubble : WA_COLORS.receivedBubble }}
                >
                    {/* Audio waveform placeholder */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center">
                            <Mic size={14} className="text-white" />
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Fake waveform */}
                            {[...Array(15)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-0.5 bg-zinc-400 rounded-full"
                                    style={{ height: `${4 + Math.random() * 12}px` }}
                                />
                            ))}
                        </div>
                        <span className="text-[11px] ml-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            {message.content || '0:15'}
                        </span>
                    </div>
                    {/* Time and status */}
                    <div className="flex items-center justify-end gap-0.5 mt-1">
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {message.time}
                        </span>
                        {message.isMe && message.status === 'read' && (
                            <svg viewBox="0 0 16 11" width="14" height="10" fill={WA_COLORS.checkBlue}>
                                <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.136.475.475 0 0 0-.347.136.47.47 0 0 0 0 .678l2.728 2.58a.46.46 0 0 0 .312.117.478.478 0 0 0 .37-.166l6.553-8.089a.472.472 0 0 0 0-.56z" />
                                <path d="M15.229.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.2-1.133a.449.449 0 0 0-.027.678l1.227 1.16a.46.46 0 0 0 .312.117.478.478 0 0 0 .37-.166l6.193-7.808a.472.472 0 0 0 0-.56z" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${message.isMe ? 'justify-end' : 'justify-start'} mb-1`}>
            <div
                className={`relative max-w-[75%] px-2 py-1.5 rounded-lg ${message.isMe ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                style={{ backgroundColor: message.isMe ? WA_COLORS.sentBubble : WA_COLORS.receivedBubble }}
            >
                {/* Bubble tail */}
                <div
                    className={`absolute top-0 w-0 h-0 ${message.isMe ? 'right-[-8px]' : 'left-[-8px]'}`}
                    style={{
                        borderTop: `8px solid ${message.isMe ? WA_COLORS.sentBubble : WA_COLORS.receivedBubble}`,
                        borderRight: message.isMe ? 'none' : '8px solid transparent',
                        borderLeft: message.isMe ? '8px solid transparent' : 'none',
                    }}
                />

                <div className="flex items-end gap-1">
                    {isEditing ? (
                        <textarea
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className="text-[14px] leading-[19px] bg-transparent border-b border-white/30 outline-none resize-none min-w-[100px]"
                            style={{ color: WA_COLORS.textWhite }}
                            rows={1}
                        />
                    ) : (
                        <p
                            onClick={() => setIsEditing(true)}
                            className="text-[14px] leading-[19px] cursor-text hover:bg-white/5 rounded px-0.5 -mx-0.5 transition-colors"
                            style={{ color: WA_COLORS.textWhite }}
                        >
                            {message.content}
                        </p>
                    )}
                    <div className="flex items-center gap-0.5 ml-1 flex-shrink-0 translate-y-0.5">
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {message.time}
                        </span>
                        {message.isMe && message.status === 'read' && (
                            <svg viewBox="0 0 16 11" width="14" height="10" fill={WA_COLORS.checkBlue}>
                                <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.136.475.475 0 0 0-.347.136.47.47 0 0 0 0 .678l2.728 2.58a.46.46 0 0 0 .312.117.478.478 0 0 0 .37-.166l6.553-8.089a.472.472 0 0 0 0-.56z" />
                                <path d="M15.229.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.2-1.133a.449.449 0 0 0-.027.678l1.227 1.16a.46.46 0 0 0 .312.117.478.478 0 0 0 .37-.166l6.193-7.808a.472.472 0 0 0 0-.56z" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
