// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { wahaService } from '../services/wahaService';
import { WahaChat, WahaMessage } from '../types/waha';
import { ChatSidebar } from './chat/ChatSidebar';
import { ChatWindow } from './chat/ChatWindow';
import { ChatInput } from './chat/ChatInput';
import { ContactInfo } from './chat/ContactInfo';
import { ChatLoading } from './chat/ChatLoading';
import { MediaPreview } from './chat/MediaPreview';
import { Loader2, QrCode, Smartphone, RefreshCw, MessageSquare, MoreVertical, Plus, MonitorSmartphone } from 'lucide-react';
import { Lead } from '../types';
import { fetchLeads, fetchApifyLeads, fetchContactProfilePic, fetchWahaChats, fetchWahaMessages, formatChatId } from '../services/supabaseService';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { aiService } from '../services/aiService';

interface ChatProps {
  initialChatId?: string;
  initialLead?: Lead;
  onConnectClick?: () => void;
  isAdmin?: boolean;
  chats?: any[]; // Legacy prop support
  leads?: any[]; // Legacy prop support
  apifyLeads?: any[]; // Legacy prop support
  profilePics: Record<string, string>;
  isLoading?: boolean;
  onNavigate?: (view: string) => void;
}

export const Chat: React.FC<ChatProps> = ({ initialChatId, initialLead, profilePics, leads: propLeads, apifyLeads: propApifyLeads, isLoading, onNavigate, chats: propChats }) => {
  const { t } = useTranslation();
  const [sessionName] = useState('default'); // Default session
  const [status, setStatus] = useState<'WORKING' | 'SCAN_QR_CODE' | 'STARTING' | 'STOPPED' | 'FAILED'>('STARTING');


  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [chats, setChats] = useState<WahaChat[]>(propChats || []);

  // Sync chats when prop changes
  useEffect(() => {
    if (propChats) {
      setChats(propChats);
    }
  }, [propChats]);

  // Initialize selectedChatId with robust fallback logic to prevent flicker
  const [selectedChatId, setSelectedChatId] = useState<string | null>(() => {
    console.log('Chat initializing', { initialChatId, initialLead });
    if (initialChatId) return formatChatId(initialChatId);
    if (initialLead?.chat_id) return formatChatId(initialLead.chat_id);
    if (initialLead?.phone) return formatChatId(initialLead.phone);
    return null;
  });

  // Ensure selectedChatId updates if props change (e.g. if initialLead was undefined on first render)
  useEffect(() => {
    console.log('Chat props changed', { initialChatId, initialLead });
    if (initialChatId) {
      setSelectedChatId(formatChatId(initialChatId));
    } else if (initialLead?.chat_id) {
      setSelectedChatId(formatChatId(initialLead.chat_id));
    } else if (initialLead?.phone) {
      setSelectedChatId(formatChatId(initialLead.phone));
    }
  }, [initialChatId, initialLead]);
  const [messages, setMessages] = useState<WahaMessage[]>([]);
  const [wahaProfile, setWahaProfile] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>(propLeads || []);
  const [apifyLeads, setApifyLeads] = useState<any[]>(propApifyLeads || []);
  const [isSending, setIsSending] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [contactPresence, setContactPresence] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [isChatListLoading, setIsChatListLoading] = useState(false);

  // AI Processing State
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Load CRM Data - Use props if available, otherwise fetch (fallback)
  useEffect(() => {
    if (!propLeads || !propApifyLeads) {
      const loadData = async () => {
        const [crmLeads, apify] = await Promise.all([
          fetchLeads(),
          fetchApifyLeads()
        ]);
        if (!propLeads) setLeads(crmLeads || []);
        if (!propApifyLeads) setApifyLeads(apify || []);
      };
      loadData();
    }
  }, [propLeads, propApifyLeads]);

  // 1. Session Monitoring (Simple Polling)
  const checkSessionStatus = useCallback(async () => {
    try {
      try {
        const session = await wahaService.getSession(sessionName);
        setStatus(session.status);

        if (session.status === 'SCAN_QR_CODE') {
          // If need to scan, fetch QR
          const blob = await wahaService.getQR(sessionName);
          setQrCodeUrl(URL.createObjectURL(blob));
        } else if (session.status === 'WORKING') {
          // If connected, clear QR and load chats
          if (qrCodeUrl) {
            URL.revokeObjectURL(qrCodeUrl);
            setQrCodeUrl(null);
          }
          if (!wahaProfile) {
            try {
              const me = await wahaService.getMe(sessionName);
              setWahaProfile(me);
            } catch (e) {
              console.error("Failed to fetch profile", e);
            }
          }
        }
      } catch (e) {
        // Session doesn't exist, try to create/start
        console.log("Session not found, starting...");
        await wahaService.startSession(sessionName);
      }
    } catch (error) {
      console.error("Error checking WAHA session:", error);
    }
  }, [sessionName, qrCodeUrl, wahaProfile, leads]);

  // Poll status every 3s
  useEffect(() => {
    checkSessionStatus();
    const interval = setInterval(checkSessionStatus, 3000);
    return () => clearInterval(interval);
  }, [checkSessionStatus]);

  // 3. Load Messages for selected chat
  useEffect(() => {
    if (!selectedChatId) return;

    let isMounted = true;

    const fetchMsgs = async () => {
      try {
        // Fetch from both sources in parallel
        const [wahaMsgs, supabaseMsgs] = await Promise.all([
          wahaService.getChatMessages(sessionName, selectedChatId).catch(() => []),
          fetchWahaMessages(selectedChatId).catch(() => [])
        ]);

        if (!isMounted) return;

        // Merge messages: Supabase (history) + WAHA (live)
        // Use a Map to deduplicate by ID
        const msgMap = new Map<string, WahaMessage>();

        // Add Supabase messages first
        supabaseMsgs.forEach(m => msgMap.set(m.id, m));

        // Add/Override with WAHA messages
        wahaMsgs.forEach(m => msgMap.set(m.id, m));

        // Convert back to array and sort by timestamp
        const mergedMsgs = Array.from(msgMap.values()).sort((a, b) => a.timestamp - b.timestamp);

        setMessages(mergedMsgs);

        // Mark as seen (only if connected)
        if (status === 'WORKING') {
          wahaService.sendSeen(sessionName, selectedChatId).catch(() => { });
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchMsgs();
  }, [selectedChatId, status, sessionName]);

  // Merge chats with lead info for active chat
  const chatList = chats.map(chat => {
    const lead = leads.find(l => l.chat_id === chat.id);
    return { ...chat, lead, chatID: chat.id }; // Ensure chatID compatibility
  });

  let activeChat = chatList.find(c => c.id === selectedChatId);

  // If no existing chat, try to find lead and create temp chat object
  if (!activeChat && selectedChatId) {
    let lead = leads.find(l => l.chat_id === selectedChatId);

    if (!lead && initialLead && initialLead.chat_id === selectedChatId) {
      lead = initialLead;
    }

    if (lead) {
      activeChat = {
        id: lead.chat_id,
        chatID: lead.chat_id,
        name: lead.business || lead.name || lead.phone,
        push_name: lead.business || lead.name || lead.phone,
        timestamp: Date.now(),
        unreadCount: 0,
        isGroup: false,
        lead: lead
      } as any;
    } else if (apifyLeads && apifyLeads.length > 0) {
      // Check Apify Leads
      const apifyLead = apifyLeads.find(l =>
        l.phone === selectedChatId ||
        l.id === selectedChatId
      );

      if (apifyLead) {
        activeChat = {
          id: apifyLead.phone || apifyLead.id,
          chatID: apifyLead.phone || apifyLead.id,
          name: apifyLead.title || apifyLead.phone,
          push_name: apifyLead.title || apifyLead.phone,
          timestamp: Date.now(),
          unreadCount: 0,
          isGroup: false,
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
            last_interaction: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: '',
            source: 'apify'
          }
        } as any;
      }
    }
  }

  // Fetch Profile Pictures locally when Chat component mounts
  const [localProfilePics, setLocalProfilePics] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchImages = async () => {
      const newPics: Record<string, string> = {};
      const uniqueChatIds = Array.from(new Set(chats.map(c => c.id)));

      // Also check leads
      leads.forEach(l => {
        if (l.chat_id) uniqueChatIds.push(l.chat_id);
        else if (l.phone) uniqueChatIds.push(`${l.phone}@c.us`);
      });

      const uniqueIds = Array.from(new Set(uniqueChatIds));

      // Filter out IDs we already have
      const idsToFetch = uniqueIds.filter(id => {
        if (localProfilePics[id]) return false;

        // Filter out junk/system IDs
        if (id.includes('@lid') || id.startsWith('0@') || id.includes('status@broadcast')) return false;

        // Check if it's a valid contact we care about
        // 1. Is it a Lead?
        const isLead = leads.some(l => l.chat_id === id || `${l.phone}@c.us` === id);
        if (isLead) return true;

        // 2. Is it an Apify Lead? (Assuming apifyLeads are passed or accessible, though here we rely on leads prop mostly)
        // If apifyLeads are merged into leads or handled separately, check them.
        // In Chat.tsx we have apifyLeads prop.
        const isApify = apifyLeads?.some(l => l.phone && (`${l.phone}@c.us` === id || l.phone === id));
        if (isApify) return true;

        // 3. Is it a persisted chat?
        const chat = chats.find(c => c.id === id);
        if (chat && chat._persisted) return true;

        // If none of the above, skip it (it's likely a random WAHA contact not in our DB)
        return false;
      });

      if (idsToFetch.length === 0) return;

      const batchSize = 5;
      for (let i = 0; i < idsToFetch.length; i += batchSize) {
        const batch = idsToFetch.slice(i, i + batchSize);
        await Promise.all(batch.map(async (chatId) => {
          try {
            const url = await fetchContactProfilePic(chatId);
            if (url) {
              newPics[chatId] = url;
            }
          } catch (e) { }
        }));
      }

      if (Object.keys(newPics).length > 0) {
        setLocalProfilePics(prev => ({ ...prev, ...newPics }));
      }
    };

    if (chats.length > 0 || leads.length > 0) {
      fetchImages();
    }
  }, [chats.length, leads.length]); // Only re-run if counts change significantly to avoid loops

  // 4. Realtime Subscription for Messages (Active Chat)
  useEffect(() => {
    if (!activeChat?.chatID) return;

    const chatJid = activeChat.chatID;
    let channel: any;

    const setupSubscription = async () => {
      // Get Integer ID for this chat to subscribe to messages
      const { data } = await supabase
        .from('whatsapp_waha_chats')
        .select('id')
        .eq('chat_jid', chatJid)
        .maybeSingle();

      if (!data) return; // Chat not in DB yet

      const chatIdInt = data.id;

      channel = supabase
        .channel(`chat:${chatIdInt}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'whatsapp_waha_messages',
            filter: `chat_id=eq.${chatIdInt}`
          },
          (payload) => {
            const newMsg = payload.new as any;
            const wahaMsg: WahaMessage = {
              id: newMsg.message_id || newMsg.id.toString(),
              timestamp: new Date(newMsg.message_timestamp).getTime() / 1000,
              from: newMsg.from_jid,
              body: newMsg.body || '',
              fromMe: newMsg.from_me,
              ack: newMsg.ack,
              hasMedia: newMsg.has_media,
              mediaUrl: newMsg.media_url,
              mediaType: newMsg.type,
              caption: newMsg.media_caption
            };

            setMessages(prev => {
              if (prev.some(m => m.id === wahaMsg.id)) return prev;
              return [...prev, wahaMsg].sort((a, b) => a.timestamp - b.timestamp);
            });

            // Update Chat List (Sidebar) Optimistically
            setChats(prevChats => {
              return prevChats.map(c => {
                if (c.id === chatJid || c.chatID === chatJid) {
                  return {
                    ...c,
                    last_message: wahaMsg.body,
                    last_message_at: new Date(wahaMsg.timestamp * 1000).toISOString(),
                    timestamp: wahaMsg.timestamp,
                    unreadCount: status === 'WORKING' ? 0 : (c.unreadCount || 0) + 1
                  };
                }
                return c;
              }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            });

            // Mark as seen
            if (status === 'WORKING') {
              wahaService.sendSeen(sessionName, chatJid).catch(() => { });
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeChat?.chatID, status, sessionName]);

  // 5. Realtime Subscription for Chat List Updates
  useEffect(() => {
    const channel = supabase
      .channel('public:whatsapp_waha_chats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_waha_chats' },
        async (payload) => {
          // Only fetch if it's a new chat or significant update that we missed
          // For simple message updates, we handle it in the message subscription above to be faster
          // But let's keep this for sync
          const latestChats = await fetchWahaChats().catch(() => []);
          if (latestChats) {
            setChats(prev => {
              // Merge to keep selection state stable if needed, though replacing is usually fine
              // The key is that selectedChatId is separate state, so replacing chats shouldn't close it
              // unless the selected chat is missing from the new list.
              return latestChats;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // AI Auto-Response Logic
  useEffect(() => {
    if (!activeChat || !messages.length) return;

    const lastMessage = messages[messages.length - 1];

    // 1. Check if last message is from user (not from me)
    if (lastMessage.fromMe) return;

    // 2. Check if already processed to avoid loops
    if (processedMessageIds.current.has(lastMessage.id)) return;

    // 3. Check if lead source is 'apify'
    const isApifyLead = activeChat.lead?.source === 'apify';

    if (isApifyLead) {
      // Mark as processed immediately
      processedMessageIds.current.add(lastMessage.id);

      const runAI = async () => {
        try {
          // Simulate typing delay
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Analyze
          const analysis = await aiService.analyzeConversation(messages, lastMessage.body);

          // Generate Response
          const response = await aiService.generateResponse(
            analysis,
            activeChat.name || 'Client',
            messages,
            activeChat.lead?.category || '' // Pass category
          );

          // Send
          if (response.text) {
            await handleSendMessage(response.text);
          }

          // Handle Actions (e.g. update lead stage)
          // We can implement stage updates here later if needed
          if (response.meta?.stage) {
            console.log(`AI suggests moving lead to stage: ${response.meta.stage}`);
          }

        } catch (err) {
          console.error("AI Auto-Response Error:", err);
        }
      };

      runAI();
    }
  }, [messages, activeChat]);

  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const handleSendMedia = (file: File, type: 'image' | 'video' | 'audio' | 'file') => {
    setPreviewFile(file);
  };

  const handleSendMessage = async (text: string, file?: File) => {
    if (!selectedChatId) return;

    setIsSending(true);
    try {
      let base64 = '';

      if (file) {
        // Convert file to base64 first
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Optimistic update
      const newMessage: WahaMessage = {
        id: 'temp-' + Date.now(),
        timestamp: Date.now() / 1000,
        from: 'me',
        body: text,
        fromMe: true,
        ack: 0,
        hasMedia: !!file,
        media: file ? {
          url: base64,
          mimetype: file.type,
          filename: file.name
        } : undefined,
        mediaUrl: file ? base64 : undefined,
        mediaType: file ? (file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file') : undefined
      };
      setMessages(prev => [...prev, newMessage]);

      if (file) {
        // Send media
        // Use sendFile instead of sendImage to avoid GOWS engine restrictions
        await wahaService.sendFile({
          session: sessionName,
          chatId: selectedChatId,
          file: {
            mimetype: file.type,
            filename: file.name,
            url: base64
          },
          caption: text
        });
      } else {
        // Send text
        await wahaService.sendText({
          session: sessionName,
          chatId: selectedChatId,
          text: text
        });
      }

      // Refresh messages after short delay
      setTimeout(() => {
        // fetchMsgs(); // handled by interval
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // --- ACTIONS ---
  const handleLogout = async () => {
    try {
      await wahaService.logoutSession(sessionName);
      // Status update will be handled by polling/websocket
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleRestart = async () => {
    try {
      await wahaService.startSession(sessionName);
    } catch (error) {
      console.error('Error restarting session:', error);
    }
  };

  // Connection Screen (QR Code)
  const handleUpdateProfile = async (data: { name?: string; status?: string; picture?: File }) => {
    try {
      if (data.name) {
        await wahaService.setProfileName(sessionName, data.name);
        setWahaProfile((prev: any) => ({ ...prev, pushName: data.name }));
      }
      if (data.status) {
        await wahaService.setProfileStatus(sessionName, data.status);
        setWahaProfile((prev: any) => ({ ...prev, status: data.status }));
      }
      if (data.picture) {
        await wahaService.setProfilePicture(sessionName, data.picture);
        // Refresh profile to get new picture URL
        const profile = await wahaService.getProfile(sessionName);
        setWahaProfile(profile);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    setIsChatListLoading(true);
    try {
      const [latestChats, latestLeads, latestApify] = await Promise.all([
        fetchWahaChats().catch(() => []),
        fetchLeads().catch(() => []),
        fetchApifyLeads().catch(() => [])
      ]);

      if (latestChats) setChats(latestChats);
      if (!propLeads && latestLeads) setLeads(latestLeads);
      if (!propApifyLeads && latestApify) setApifyLeads(latestApify);

      await checkSessionStatus();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsChatListLoading(false);
    }
  };

  if (isLoading) {
    return <ChatLoading />;
  }

  if (status === 'SCAN_QR_CODE' && qrCodeUrl) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#0F0F0F] text-zinc-200">
        <div className="bg-white p-4 rounded-xl shadow-2xl mb-6">
          <img src={qrCodeUrl} alt="Scan QR Code" className="w-64 h-64" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Conectar ao WhatsApp</h2>
        <p className="text-zinc-500">Abra o WhatsApp no seu celular &gt; Aparelhos conectados &gt; Conectar um aparelho</p>
      </div>
    );
  }

  if (status === 'STARTING') {
    return <ChatLoading />;
  }

  // Main Chat Interface
  return (
    <div className="p-8 h-full flex flex-col overflow-hidden relative">
      {/* 1. Page Header */}
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/5 shrink-0">
        <div>
          {/* Breadcrumb / Overline - Removed as per user request */}
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Conversas</h2>
          <p className="text-zinc-500 text-sm mt-2 font-medium">Gerencie e responda conversas sincronizadas com o WhatsApp.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isChatListLoading}
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors text-xs font-bold uppercase tracking-wide flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={isChatListLoading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
          <button className="p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* 2. Content Area - Two Panels */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel: Chat List */}
        <div className="w-[30%] min-w-[320px] bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-xl">
          <ChatSidebar
            chats={chatList}
            leads={leads}
            apifyLeads={apifyLeads}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            wahaProfile={wahaProfile}
            profilePics={localProfilePics}
            connectionStatus={status}
            onLogout={handleLogout}
            onRestart={handleRestart}
            onUpdateProfile={handleUpdateProfile}
            onNavigate={onNavigate}
            isLoading={isLoading || isChatListLoading}
          />
        </div>

        {/* Right Panel: Chat Window */}
        <div className="flex-1 bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-xl relative">
          {selectedChatId && activeChat ? (
            <ChatWindow
              activeChat={activeChat}
              messages={messages}
              onToggleContactInfo={() => setShowContactInfo(!showContactInfo)}
              onBack={() => setSelectedChatId(null)}
              profilePic={localProfilePics[selectedChatId]}
              presence={contactPresence}
              currentUserId={wahaProfile?.id}
              onSendMessage={handleSendMessage}
              onSendMedia={handleSendMedia}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-[#09090b]">
              <div className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mb-4 border border-white/5">
                <MessageSquare size={32} className="text-zinc-600" />
              </div>
              <h3 className="text-lg font-medium text-zinc-300 mb-1">Bem-vindo ao Chat</h3>
              <p className="text-sm max-w-xs text-center text-zinc-500">Selecione uma conversa ao lado para começar o atendimento.</p>
            </div>
          )}
        </div>
      </div>

      {/* Media Preview Overlay */}
      {previewFile && (
        <MediaPreview
          file={previewFile}
          onSend={(file, caption) => {
            handleSendMessage(caption, file);
            setPreviewFile(null);
          }}
          onCancel={() => setPreviewFile(null)}
        />
      )}

      {/* Contact Info Sidebar (Right) - Optional, maybe overlay or inside right panel? 
          For now keeping it as overlay or hidden to respect strict 2-panel layout request 
          unless user opens it. 
      */}
      {showContactInfo && activeChat && (
        <div className="absolute right-8 top-8 bottom-8 w-80 bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <ContactInfo
            chat={activeChat}
            onClose={() => setShowContactInfo(false)}
            profilePic={localProfilePics[activeChat.id]}
          />
        </div>
      )}
    </div>
  );
};
