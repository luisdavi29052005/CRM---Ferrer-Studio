// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { wahaService } from '../services/wahaService';
import { WahaChat, WahaMessage } from '../types/waha';
import { ChatSidebar } from './chat/ChatSidebar';
import { ChatWindow } from './chat/ChatWindow';
import { ChatInput } from './chat/ChatInput';
import { ContactInfo } from './chat/ContactInfo';
import { Loader2, QrCode, Smartphone, RefreshCw, MessageSquare } from 'lucide-react';
import { Lead } from '../types';
import { fetchLeads, fetchApifyLeads, fetchContactProfilePic, fetchWahaChats, fetchWahaMessages } from '../services/supabaseService';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

interface ChatProps {
  initialChatId?: string;
  initialLead?: Lead;
  onConnectClick?: () => void;
  isAdmin?: boolean;
  chats?: any[]; // Legacy prop support
  leads?: any[]; // Legacy prop support
  apifyLeads?: any[]; // Legacy prop support
}

export const Chat: React.FC<ChatProps> = ({ initialChatId, initialLead }) => {
  const { t } = useTranslation();
  const [sessionName] = useState('default'); // Default session
  const [status, setStatus] = useState<'WORKING' | 'SCAN_QR_CODE' | 'STARTING' | 'STOPPED' | 'FAILED'>('STARTING');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [chats, setChats] = useState<WahaChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [messages, setMessages] = useState<WahaMessage[]>([]);
  const [wahaProfile, setWahaProfile] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [apifyLeads, setApifyLeads] = useState<any[]>([]);
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [contactPresence, setContactPresence] = useState<'online' | 'offline' | 'unknown'>('unknown');

  // Load CRM Data
  useEffect(() => {
    const loadData = async () => {
      const [crmLeads, apify] = await Promise.all([
        fetchLeads(),
        fetchApifyLeads()
      ]);
      setLeads(crmLeads || []);
      setApifyLeads(apify || []);
    };
    loadData();
  }, []);

  // 2. Load Chat List
  const loadChats = async () => {
    try {
      // Fetch from both sources in parallel
      const [wahaChats, supabaseChats] = await Promise.all([
        wahaService.getChats(sessionName).catch(() => []),
        fetchWahaChats().catch(() => [])
      ]);

      // Map Supabase chats to WahaChat format
      const mappedSupabaseChats: WahaChat[] = supabaseChats.map(c => ({
        id: c.chatID, // Use JID as ID
        name: c.push_name,
        push_name: c.push_name,
        timestamp: c.last_timestamp / 1000, // Convert ms to s
        unreadCount: c.unreadCount,
        isGroup: c.chatID.endsWith('@g.us'),
        lastMessage: {
          content: c.last_text,
          timestamp: c.last_timestamp / 1000
        },
        last_text: c.last_text,
        last_timestamp: c.last_timestamp,
        status: 'read' // Default
      }));

      // Merge: Start with Supabase chats (history), then override with WAHA chats (live)
      const chatMap = new Map<string, WahaChat>();

      mappedSupabaseChats.forEach(c => chatMap.set(c.id, c));
      wahaChats.forEach(c => chatMap.set(c.id, { ...chatMap.get(c.id), ...c })); // WAHA takes precedence

      // Convert map back to array
      const mergedChats = Array.from(chatMap.values());

      // 1. Enrich chats with Lead data
      const enrichedChats = mergedChats.map(chat => {
        const lead = leads.find(l => l.chat_id === chat.id || l.phone === chat.id.replace('@c.us', ''));
        return { ...chat, lead };
      });

      // 2. Add Leads that don't have a chat yet (Virtual Chats)
      leads.forEach(lead => {
        const chatId = lead.chat_id || `${lead.phone}@c.us`;
        if (!chatMap.has(chatId)) {
          // Check if we already added this via another ID format
          const alreadyExists = enrichedChats.some(c => c.id === chatId);
          if (!alreadyExists) {
            enrichedChats.push({
              id: chatId,
              name: lead.name,
              push_name: lead.name,
              timestamp: new Date(lead.last_interaction || Date.now()).getTime() / 1000,
              unreadCount: 0,
              isGroup: false,
              lead: lead,
              last_text: 'Start a conversation',
              status: 'read'
            } as WahaChat);
          }
        }
      });

      // Sort by timestamp desc
      enrichedChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setChats(enrichedChats);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };

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
          loadChats();
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


  // Fetch Profile Pictures
  useEffect(() => {
    const fetchImages = async () => {
      const newPics: Record<string, string> = {};
      const uniqueChatIds = Array.from(new Set(chats.map(c => c.id)));

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
    // Poll messages every 2s (Replace with Webhook later)
    const msgInterval = setInterval(fetchMsgs, 2000);

    return () => {
      isMounted = false;
      clearInterval(msgInterval);
    };
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
            budget: 0,
            source: 'apify',
            notes: `Apify Import: ${apifyLead.url}`,
            last_interaction: 'Never'
          }
        } as any;
      }
    }
  }

  // 4. Send Text Message
  // 4. Send Text Message
  const handleSendMessage = async (text: string) => {
    if (!selectedChatId) return;

    // Optimistic Update
    const tempId = 'temp-' + Date.now();
    const tempMessage: WahaMessage = {
      id: tempId,
      timestamp: Date.now() / 1000,
      from: wahaProfile?.id || 'me',
      to: selectedChatId,
      fromMe: true,
      body: text,
      hasMedia: false,
      ack: 0 // Pending
    };

    setMessages(prev => [...prev, tempMessage]);
    setIsSending(true);

    try {
      const sentMsg = await wahaService.sendText({
        session: sessionName,
        chatId: selectedChatId,
        text: text
      });

      // Update with real message
      setMessages(prev => prev.map(m => m.id === tempId ? sentMsg : m));
    } catch (error) {
      console.error("Error sending message:", error);
      // Mark as error or remove? For now, remove to indicate failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // --- RENDERING ---

  // Connection Screen (QR Code)
  if (status === 'SCAN_QR_CODE' && qrCodeUrl) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#0F0F0F] text-zinc-200">
        <div className="bg-white p-4 rounded-xl shadow-2xl mb-6">
          <img src={qrCodeUrl} alt="Scan QR Code" className="w-64 h-64" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect to WhatsApp</h2>
        <p className="text-zinc-500">Open WhatsApp on your phone &gt; Linked devices &gt; Link a device</p>
      </div>
    );
  }

  if (status === 'STARTING') {
    return (
      <div className="flex h-full items-center justify-center bg-[#0F0F0F] text-zinc-500">
        <Loader2 className="animate-spin mr-2" /> Starting session...
      </div>
    );
  }

  // Main Chat Interface
  return (
    <div className="flex h-full bg-[#0F0F0F] relative overflow-hidden">
      {/* Sidebar */}
      <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-none h-full border-r border-white/5 flex-col`}>
        <ChatSidebar
          chats={chatList as any}
          leads={leads}
          apifyLeads={apifyLeads}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          wahaProfile={wahaProfile}
          profilePics={profilePics}
          connectionStatus={status}
          onLogout={() => wahaService.logoutSession(sessionName)}
          onRestart={() => wahaService.startSession(sessionName)}
        />
      </div>

      {/* Chat Window */}
      <div className={`${!selectedChatId ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-[#0F0F0F] h-full relative`}>
        {selectedChatId && activeChat ? (
          <ChatWindow
            activeChat={activeChat}
            messages={messages}
            onToggleContactInfo={() => setShowContactInfo(!showContactInfo)}
            onBack={() => setSelectedChatId(null)}
            profilePic={profilePics[selectedChatId]}
            presence={contactPresence}
            currentUserId={wahaProfile?.id}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-[#0F0F0F]">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Smartphone size={32} className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-300 mb-1">{t('chat.welcome_title', 'Welcome to WhatsApp')}</h3>
            <p className="text-sm max-w-xs text-center">{t('chat.welcome_subtitle', 'Select a chat to start messaging')}</p>
          </div>
        )}
      </div>

      {/* Contact Info Sidebar (Right) */}
      {showContactInfo && activeChat && (
        <div className="w-80 border-l border-white/5 bg-[#0F0F0F] hidden xl:block">
          <ContactInfo
            chat={activeChat}
            onClose={() => setShowContactInfo(false)}
            profilePic={profilePics[activeChat.id]}
          />
        </div>
      )}
    </div>
  );
};
