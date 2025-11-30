// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, RefreshCw, Loader2, Smartphone } from 'lucide-react';
import { ChatSidebar } from './chat/ChatSidebar';
import { ChatWindow } from './chat/ChatWindow';
import { ChatInput } from './chat/ChatInput';
import { ContactInfo } from './chat/ContactInfo';
import { WahaChat, Message, Lead } from '../types';
import { WahaSession, WahaMe } from '../types/waha';
import { wahaService } from '../services/wahaService';
import { supabase } from '../supabaseClient';
import { fetchContactProfilePic } from '../services/supabaseService';

interface ChatProps {
  chats: WahaChat[];
  leads: Lead[];
  apifyLeads?: any[];
  initialChatId?: string;
  initialLead?: Lead;
  onConnectClick?: () => void;
  isAdmin?: boolean;
}

export const Chat: React.FC<ChatProps> = ({
  chats,
  leads,
  apifyLeads = [],
  initialChatId,
  initialLead,
  onConnectClick,
  isAdmin = false
}) => {
  const { t } = useTranslation();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [wahaStatus, setWahaStatus] = useState<'WORKING' | 'FAILED' | 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'UNKNOWN'>('UNKNOWN');
  const [wahaProfile, setWahaProfile] = useState<WahaMe | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contactPresence, setContactPresence] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});

  // Session Management
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const session = await wahaService.getSession('default');
        setWahaStatus(session.status as any);

        if (session.status === 'WORKING' && !wahaProfile) {
          try {
            const me = await wahaService.getMe('default');
            setWahaProfile(me);
          } catch (e) {
            console.error("Failed to fetch profile", e);
          }
        }
      } catch (error) {
        console.error("Failed to check WAHA status", error);
        setWahaStatus('UNKNOWN');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [wahaProfile]);

  // QR Code Polling
  useEffect(() => {
    if (wahaStatus === 'SCAN_QR_CODE' || (wahaStatus === 'STARTING' && !wahaProfile)) {
      const fetchQR = async () => {
        try {
          const blob = await wahaService.getScreenshot('default');
          const url = URL.createObjectURL(blob);
          if (qrCodeUrl) URL.revokeObjectURL(qrCodeUrl);
          setQrCodeUrl(url);
        } catch (error) {
          console.error("Failed to fetch QR code", error);
        }
      };

      fetchQR();
      const interval = setInterval(fetchQR, 3000);
      return () => clearInterval(interval);
    }
  }, [wahaStatus, wahaProfile]);

  // Fetch Profile Pictures
  useEffect(() => {
    const fetchImages = async () => {
      const newPics: Record<string, string> = {};
      const uniqueChatIds = Array.from(new Set(chats.map(c => c.chatID)));

      // Process in batches
      const batchSize = 5;
      for (let i = 0; i < uniqueChatIds.length; i += batchSize) {
        const batch = uniqueChatIds.slice(i, i + batchSize);
        await Promise.all(batch.map(async (chatId) => {
          if (!profilePics[chatId]) {
            try {
              const url = await fetchContactProfilePic(chatId);
              if (url) {
                newPics[chatId] = url;
              }
            } catch (e) {
              // Ignore errors for profile pics
            }
          }
        }));
      }

      if (Object.keys(newPics).length > 0) {
        setProfilePics(prev => ({ ...prev, ...newPics }));
      }
    };

    if (chats.length > 0) {
      fetchImages();
    }
  }, [chats]);

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      await wahaService.startSession('default');
      // Wait a bit and check status
      setTimeout(async () => {
        try {
          const session = await wahaService.getSession('default');
          setWahaStatus(session.status as any);
        } catch (e) { }
        setIsLoading(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to start session", error);
      setIsLoading(false);
    }
  };

  // Merge chats with lead info
  const chatList = chats.map(chat => {
    const lead = leads.find(l => l.chat_id === chat.chatID);
    return { ...chat, lead };
  });

  let activeChat = chatList.find(c => c.chatID === selectedChatId);

  // If no existing chat, try to find lead and create temp chat object
  if (!activeChat && selectedChatId) {
    let lead = leads.find(l => l.chat_id === selectedChatId);

    if (!lead && initialLead && initialLead.chat_id === selectedChatId) {
      lead = initialLead;
    }

    if (lead) {
      activeChat = {
        id: 'temp',
        chatID: lead.chat_id,
        push_name: lead.business || lead.name || lead.phone,
        last_text: '',
        last_from_me: true,
        last_timestamp: Date.now(),
        status: 'sent',
        unreadCount: 0,
        lead: lead
      };
    } else if (apifyLeads && apifyLeads.length > 0) {
      // Check Apify Leads
      const apifyLead = apifyLeads.find(l =>
        l.phone === selectedChatId ||
        l.id === selectedChatId
      );

      if (apifyLead) {
        activeChat = {
          id: 'temp-apify',
          chatID: apifyLead.phone || apifyLead.id, // Best effort chat ID
          push_name: apifyLead.title || apifyLead.phone,
          last_text: '',
          last_from_me: true,
          last_timestamp: Date.now(),
          status: 'sent',
          unreadCount: 0,
          lead: {
            id: apifyLead.id,
            chat_id: apifyLead.phone || '',
            name: apifyLead.title || 'Unknown',
            business: apifyLead.title || '',
            phone: apifyLead.phone,
            city: apifyLead.city || '',
            state: apifyLead.state || '',
            category: apifyLead.category || '',
            stage: 'New',
            temperature: 'Cold',
            score: 0,
            budget: 0,
            notes: '',
            source: 'apify',
            last_interaction: new Date().toISOString(),
          } as Lead
        };
      }
    }
  }

  // Load Messages & Presence
  useEffect(() => {
    if (selectedChatId) {
      const loadMessages = async () => {
        try {
          const msgs = await wahaService.getChatMessages('default', selectedChatId, 50);
          // Map WahaMessage to Message
          const mappedMsgs: Message[] = msgs.map(m => ({
            id: m.id,
            chat_id: selectedChatId,
            text: m.body,
            fromMe: m.fromMe,
            timestamp: m.timestamp * 1000, // WAHA uses seconds? Check types. Usually seconds.
            isAiGenerated: false,
            ack: m.ack,
            mediaUrl: m.mediaUrl,
            mediaType: m.type as any,
            caption: m.caption
          }));
          // Sort by timestamp
          mappedMsgs.sort((a, b) => a.timestamp - b.timestamp);
          setMessages(mappedMsgs);
        } catch (error) {
          console.error("Failed to load messages", error);
        }

        // Presence Logic
        setContactPresence('unknown'); // Reset
        try {
          await wahaService.subscribePresence('default', selectedChatId);
          const presence = await wahaService.checkPresence('default', selectedChatId);
          setContactPresence(presence);
        } catch (e) {
          console.error("Presence check failed", e);
        }
      };

      const cleanupPromise = loadMessages();

      // Realtime Subscription (Supabase for now, as WAHA pushes to DB)
      // Assuming existing logic relies on Supabase for realtime messages
      const chatInternalId = chats.find(c => c.chatID === selectedChatId)?.id;

      if (chatInternalId) {
        const channel = supabase
          .channel(`chat:${selectedChatId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'whatsapp_waha_messages',
              filter: `chat_id=eq.${chatInternalId}`
            },
            (payload) => {
              console.log('New message received:', payload);
              const newMsg = payload.new as any;
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id.toString())) {
                  return prev;
                }
                return [...prev, {
                  id: newMsg.id.toString(),
                  chat_id: selectedChatId, // Add chat_id
                  body: newMsg.body || '', // Map body
                  fromMe: newMsg.from_me || false,
                  timestamp: newMsg.message_timestamp ? new Date(newMsg.message_timestamp).getTime() : Date.now(),
                  isAiGenerated: false,
                  ack: newMsg.ack || 0,
                  mediaUrl: newMsg.media_url || undefined,
                  mediaType: newMsg.type as any || undefined,
                  caption: newMsg.media_caption || undefined
                }];
              });
            }
          )
          .subscribe((status) => {
            console.log(`Subscription status for chat ${selectedChatId}:`, status);
          });

        return () => {
          supabase.removeChannel(channel);
          // cleanupPromise.then(cleanup => cleanup && cleanup());
        };
      }

      return () => {
        // cleanupPromise.then(cleanup => cleanup && cleanup());
      };
    }
  }, [selectedChatId, chats]);

  const handleSend = async (text: string) => {
    if (!selectedChatId || isSending) return;

    // Optimistic Update
    const tempId = 'temp-' + Date.now();
    const tempMessage: Message = {
      id: tempId,
      chat_id: selectedChatId,
      body: text,
      fromMe: true,
      timestamp: Date.now(),
      isAiGenerated: false,
      ack: 0, // Pending (Clock icon)
    };

    setMessages(prev => [...prev, tempMessage]);
    setIsSending(true);

    try {
      const result = await wahaService.sendText({
        session: 'default',
        chatId: selectedChatId,
        text: text
      });

      if (result && result.id) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === result.id);
          if (exists) {
            return prev.filter(m => m.id !== tempId);
          }
          return prev.map(m => m.id === tempId ? {
            ...tempMessage,
            id: result.id,
            ack: result.ack,
            timestamp: result.timestamp * 1000 // Convert if needed
          } : m);
        });
      } else {
        throw new Error("No message ID returned");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert(`Failed to send message`);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!selectedChatId) return;
    try {
      if (isTyping) {
        await wahaService.startTyping('default', selectedChatId);
      } else {
        await wahaService.stopTyping('default', selectedChatId);
      }
    } catch (e) {
      console.error("Typing status error", e);
    }
  };

  return (
    <div className="flex h-full bg-[#0F0F0F] relative overflow-hidden">

      {/* Disconnected Overlay - Gradient with Warning */}
      {wahaStatus !== 'WORKING' && (
        <div className="absolute inset-0 z-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-[#050505] to-black flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
          <div className="flex flex-col items-center max-w-md w-full">

            {wahaStatus === 'SCAN_QR_CODE' || (wahaStatus === 'STARTING' && qrCodeUrl) ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <div className="bg-white p-3 rounded-xl shadow-2xl shadow-black/50 mb-8 relative group">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-zinc-500/20 to-transparent rounded-2xl blur-sm opacity-50"></div>
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-60 h-60 object-contain relative z-10" />
                  ) : (
                    <div className="w-60 h-60 bg-zinc-50 flex items-center justify-center text-zinc-300 relative z-10">
                      <Loader2 size={32} className="animate-spin" />
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Scan QR Code</h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8 font-medium">
                  Open WhatsApp on your phone and scan the code to connect.
                </p>

                {isAdmin && (
                  <button
                    onClick={() => setQrCodeUrl(null)} // Trigger refresh
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 uppercase tracking-wider font-medium group"
                  >
                    <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                    Refresh Code
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full opacity-20"></div>
                  <Smartphone strokeWidth={1.5} size={56} className="text-zinc-400 relative z-10" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-4 border-black"></div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Session Disconnected</h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8 font-medium">
                  Start a new session to generate a QR code.
                </p>

                {isAdmin && (
                  <button
                    onClick={handleStartSession}
                    disabled={isLoading}
                    className="group px-6 py-2.5 bg-white text-black rounded-md hover:bg-zinc-200 transition-colors font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} className={`transition-transform duration-500 group-hover:rotate-180`} />
                    )}
                    <span>{isLoading ? 'Starting...' : 'Start New Session'}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Sidebar - Hidden on mobile when chat is selected */}
      <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-none h-full border-r border-white/5`}>
        <ChatSidebar
          chats={chatList}
          leads={leads}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          wahaProfile={wahaProfile}
          apifyLeads={apifyLeads}
          profilePics={profilePics}
        />
      </div>

      {/* Main Chat Area - Hidden on mobile when no chat is selected */}
      <div className={`${!selectedChatId ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-[#0F0F0F] h-full relative`}>
        {selectedChatId && activeChat ? (
          <>
            <div className="flex-1 flex min-h-0 relative">
              <ChatWindow
                activeChat={activeChat}
                messages={messages}
                onToggleContactInfo={() => setShowContactInfo(!showContactInfo)}
                onBack={() => setSelectedChatId(null)}
                profilePic={profilePics[activeChat.chatID]}
                presence={contactPresence}
              />

              {/* Contact Info Overlay - Responsive */}
              {showContactInfo && (
                <div className="absolute inset-y-0 right-0 z-50 w-full md:w-80 shadow-2xl border-l border-white/5 bg-[#0F0F0F] animate-in slide-in-from-right duration-300">
                  <ContactInfo
                    lead={activeChat.lead}
                    onClose={() => setShowContactInfo(false)}
                    profilePic={profilePics[activeChat.chatID]}
                  />
                </div>
              )}
            </div>

            <ChatInput
              onSendMessage={handleSend}
              onSendMedia={() => { }} // Placeholder for now
              onTyping={handleTyping}
              isSending={isSending}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-[#0F0F0F]">
            <div className="max-w-md text-center p-8">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-6 border border-white/5">
                <MessageSquare size={24} className="text-zinc-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-200 mb-2 tracking-tight">Select a conversation</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Choose a chat from the sidebar to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
