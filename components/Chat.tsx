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
import { Loader2, QrCode, Smartphone, RefreshCw, MessageSquare } from 'lucide-react';
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

  // 2. Load Chat List (Now handled in App.tsx)
  const refreshChats = async () => {
    // Optional: Implement manual refresh if needed, or rely on App.tsx polling/subscription
    console.log("Refresh requested - handled by App.tsx subscription");
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
          // loadChats(); // Removed
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

  // --- RENDERING ---

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

  if (isLoading) {
    return <ChatLoading />;
  }

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
    return <ChatLoading />;
  }

  // Main Chat Interface
  return (
    <div className="flex h-full bg-[#09090b] overflow-hidden">
      {/* Sidebar */}
      <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col bg-[#09090b]`}>
        <ChatSidebar
          chats={chatList}
          leads={leads}
          apifyLeads={apifyLeads}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          wahaProfile={wahaProfile}
          profilePics={profilePics}
          connectionStatus={status}
          onLogout={handleLogout}
          onRestart={handleRestart}
          onUpdateProfile={handleUpdateProfile}
          onNavigate={onNavigate}
          isLoading={isLoading || isChatListLoading}
        />
      </div>

      {/* Chat Window */}
      {selectedChatId ? (
        <ChatWindow
          activeChat={activeChat}
          messages={messages}
          onToggleContactInfo={() => setShowContactInfo(!showContactInfo)}
          onBack={() => setSelectedChatId(null)}
          profilePic={profilePics[selectedChatId]}
          presence={contactPresence}
          currentUserId={wahaProfile?.id}
          onSendMessage={handleSendMessage}
          onSendMedia={handleSendMedia}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-[#09090b] hidden md:flex">
          <div className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mb-4">
            <Smartphone size={32} className="text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-zinc-300 mb-1">{t('chat.welcome_title', 'Welcome to WhatsApp')}</h3>
          <p className="text-sm max-w-xs text-center text-zinc-500">{t('chat.welcome_subtitle', 'Select a chat to start messaging')}</p>
        </div>
      )}

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

      {/* Contact Info Sidebar (Right) */}
      {showContactInfo && activeChat && (
        <div className="w-80 bg-[#09090b] hidden xl:block">
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
