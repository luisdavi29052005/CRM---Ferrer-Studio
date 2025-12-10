import React, { useState, useRef, useEffect } from 'react';
import { ChatConfig, Message } from './types';
import { WA_COLORS } from './constants';
import MessageBubble from './MessageBubble';
import { Trash2, Repeat, Type, ArrowLeft, Video, Phone, MoreVertical, Smile, Paperclip, Camera, Mic, Send } from 'lucide-react';

interface PhoneScreenProps {
    config: ChatConfig;
    setConfig: React.Dispatch<React.SetStateAction<ChatConfig>>;
    height?: number; // Allow passing custom height
}

const PhoneScreen: React.FC<PhoneScreenProps> = ({ config, setConfig, height }) => {
    const [inputText, setInputText] = useState('');
    const [isMe, setIsMe] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Phone dimensions - iPhone aspect ratio (1408x3040 scaled down)
    const PHONE_HEIGHT = height || 700;
    const PHONE_WIDTH = Math.round(PHONE_HEIGHT * (1408 / 3040)); // ~324px at 700h

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msgId: string } | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [config.messages.length]);

    const handleUpdateConfig = (key: keyof ChatConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            type: 'text',
            content: inputText,
            isMe: isMe,
            time: config.phoneTime,
            status: 'read'
        };

        setConfig(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage]
        }));
        setInputText('');
    };

    const handleUpdateMessage = (id: string, updates: Partial<Message>) => {
        setConfig(prev => ({
            ...prev,
            messages: prev.messages.map(m => m.id === id ? { ...m, ...updates } : m)
        }));
    };

    const handleDeleteMessage = (id: string) => {
        setConfig(prev => ({
            ...prev,
            messages: prev.messages.filter(m => m.id !== id)
        }));
        setContextMenu(null);
    };

    const toggleMessageSide = (id: string) => {
        const msg = config.messages.find(m => m.id === id);
        if (msg) handleUpdateMessage(id, { isMe: !msg.isMe });
        setContextMenu(null);
    };

    const toggleMessageType = (id: string) => {
        const msg = config.messages.find(m => m.id === id);
        if (msg) {
            const newType = msg.type === 'text' ? 'audio' : 'text';
            const newContent = newType === 'audio' ? "0:15" : (msg.type === 'audio' ? "Áudio transcrito..." : msg.content);
            handleUpdateMessage(id, { type: newType, content: newContent });
        }
        setContextMenu(null);
    };

    const handleContextMenu = (e: React.MouseEvent, msgId: string) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            msgId
        });
    };

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden font-sans select-none"
            style={{
                width: `${PHONE_WIDTH}px`,
                height: `${PHONE_HEIGHT}px`,
                borderRadius: '40px',
                border: '3px solid #2a2a2a',
                backgroundColor: '#0b141a',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
        >
            <div
                className="flex flex-col"
                style={{
                    width: '100%',
                    height: '100%',
                }}
            >
                {/* Status Bar */}
                {/* Status Bar - Compressed */}
                <div className="h-7 flex items-end justify-between px-6 shrink-0 pb-1" style={{ backgroundColor: '#0b1014' }}>
                    <input
                        value={config.phoneTime}
                        onChange={(e) => handleUpdateConfig('phoneTime', e.target.value)}
                        className="bg-transparent text-white text-[13px] font-medium w-12 outline-none"
                    />
                    <div className="flex items-center gap-1.5">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                        </svg>
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2 22h20V2z" />
                        </svg>
                        <span className="text-white text-[13px] ml-0.5">{config.batteryLevel}%</span>
                    </div>
                </div>

                {/* WhatsApp Header - Compressed */}
                <div className="flex items-center px-2 py-1.5 shrink-0 gap-2" style={{ backgroundColor: '#0b1014' }}>
                    <button className="p-1 text-white">
                        <ArrowLeft size={20} />
                    </button>

                    <div
                        className="w-8 h-8 rounded-full overflow-hidden mr-1 cursor-pointer shrink-0"
                        onClick={() => {
                            const url = prompt("URL da imagem:", config.contactAvatar);
                            if (url) handleUpdateConfig('contactAvatar', url);
                        }}
                    >
                        <img
                            src={config.contactAvatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
                            }}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <input
                            value={config.contactName}
                            onChange={(e) => handleUpdateConfig('contactName', e.target.value)}
                            className="bg-transparent text-white text-[15px] font-medium w-full outline-none leading-tight"
                        />
                        {/* Status removed from view or hidden to match ref if needed, but keeping small */}
                        <input
                            value={config.contactStatus}
                            onChange={(e) => handleUpdateConfig('contactStatus', e.target.value)}
                            className="bg-transparent text-[11px] w-full outline-none leading-tight"
                            style={{ color: '#8696a0' }}
                        />
                    </div>

                    <div className="flex items-center gap-3 text-white pr-2">
                        <Video size={20} strokeWidth={1.5} />
                        <Phone size={18} strokeWidth={1.5} />
                        <MoreVertical size={18} />
                    </div>
                </div>
                {/* Chat + Input + Home Container with Background */}
                <div
                    className="flex-1 flex flex-col min-h-0"
                    style={{
                        backgroundColor: '#0b141a',
                        backgroundImage: 'url("/assets/bg_chat_prova_social.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Chat Area - Scrollbar invisible but functional */}
                    <div
                        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 relative chat-scroll-container"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <style>{`
                            .chat-scroll-container::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>

                        {/* Encryption Notice */}
                        <div className="flex justify-center mb-4">
                            <div className="bg-[#182229] rounded-lg px-2.5 py-1 text-center max-w-[280px]">
                                <p className="text-[10px] leading-3" style={{ color: '#ffd279' }}>
                                    🔒 As mensagens são protegidas com criptografia de ponta a ponta.
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex flex-col gap-1">
                            {config.messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    onContextMenu={(e) => handleContextMenu(e, msg.id)}
                                    className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className="relative max-w-[240px] px-2 py-1 rounded-lg"
                                        style={{
                                            backgroundColor: msg.isMe ? '#005c4b' : '#202c33',
                                            borderRadius: msg.isMe ? '12px 0 12px 12px' : '0 12px 12px 12px',
                                        }}
                                    >
                                        {msg.type === 'audio' ? (
                                            <div className="flex items-center gap-2 py-1">
                                                <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center">
                                                    <Mic size={14} className="text-white" />
                                                </div>
                                                <div className="flex-1 h-1 bg-white/30 rounded-full">
                                                    <div className="w-1/3 h-full bg-white rounded-full" />
                                                </div>
                                                <span className="text-white text-xs">{msg.content}</span>
                                            </div>
                                        ) : (
                                            <p className="text-white text-[13.5px] leading-4 pr-12 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{msg.content}</p>
                                        )}

                                        <div className="absolute bottom-1 right-2 flex items-center gap-0.5">
                                            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                                {msg.time}
                                            </span>
                                            {msg.isMe && (
                                                <svg className="w-3 h-3" style={{ color: '#53bdeb' }} viewBox="0 0 16 15" fill="currentColor">
                                                    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Context Menu */}
                        {
                            contextMenu && (
                                <div
                                    className="fixed bg-[#233138] border border-[#1f2937] shadow-xl rounded-lg py-2 z-50 text-white min-w-[150px]"
                                    style={{ top: contextMenu.y + 100, left: contextMenu.x + 50 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button onClick={() => toggleMessageSide(contextMenu.msgId)} className="w-full text-left px-4 py-2 hover:bg-[#182229] text-sm flex items-center gap-2">
                                        <Repeat size={14} /> Alternar Lado
                                    </button>
                                    <button onClick={() => toggleMessageType(contextMenu.msgId)} className="w-full text-left px-4 py-2 hover:bg-[#182229] text-sm flex items-center gap-2">
                                        <Type size={14} /> Texto/Áudio
                                    </button>
                                    <hr className="border-gray-700 my-1" />
                                    <button onClick={() => handleDeleteMessage(contextMenu.msgId)} className="w-full text-left px-4 py-2 hover:bg-[#182229] text-sm text-red-400 flex items-center gap-2">
                                        <Trash2 size={14} /> Excluir
                                    </button>
                                </div>
                            )
                        }
                    </div >

                    {/* Input Area */}
                    <div className="flex items-center gap-1 px-1 pt-1 pb-1">
                        <div
                            className="flex-1 flex items-center gap-1 px-3 py-2 rounded-full"
                            style={{ backgroundColor: '#1f272a' }}
                        >
                            <button
                                onClick={() => setIsMe(!isMe)}
                                className={`shrink-0 ${isMe ? 'opacity-100' : 'opacity-60'}`}
                                title={isMe ? "Enviando como Eu" : "Enviando como Contato"}
                            >
                                <Smile size={20} className="text-[#8696a0]" />
                            </button>

                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Mensagem"
                                className="flex-2 bg-transparent text-white text-sm outline-none placeholder-[#8696a0]"
                            />

                            <Paperclip size={18} className="text-[#8696a0] shrink-0" />
                            <Camera size={18} className="text-[#8696a0] shrink-0" />
                        </div>

                        <button
                            onClick={handleSendMessage}
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: '#00a884' }}
                        >
                            {inputText ? (
                                <Send size={18} className="text-white" />
                            ) : (
                                <Mic size={20} className="text-white" />
                            )}
                        </button>
                    </div>

                    {/* Home Indicator - Black Background */}
                    <div className="h-4 flex justify-center items-center shrink-0" style={{ backgroundColor: '#000000' }}>
                        <div className="w-36 h-1 bg-white/70 rounded-full" />
                    </div>
                </div>
            </div >
        </div >
    );
};

export default PhoneScreen;
