import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lead, Message, WahaChat, ApifyLead } from '../types';
import { fetchMessages, sendMessage, checkWahaStatus, fetchWahaProfile, startWahaSession, getWahaScreenshot } from '../services/supabaseService';
import { ChatSidebar } from './chat/ChatSidebar';
import { ChatWindow } from './chat/ChatWindow';
import { ChatInput } from './chat/ChatInput';
import { ContactInfo } from './chat/ContactInfo';
import { Smartphone, RefreshCw, MessageSquare, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface ChatProps {
  chats: WahaChat[];
  leads: Lead[];
  apifyLeads?: ApifyLead[];
  initialChatId?: string;
  initialLead?: Lead;
  onConnectClick?: () => void;
}

export const Chat: React.FC<ChatProps> = ({ chats, leads, apifyLeads = [], initialChatId, initialLead, onConnectClick }) => {
  const { t } = useTranslation();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || (chats[0]?.chatID ?? null));
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [wahaStatus, setWahaStatus] = useState<'WORKING' | 'FAILED' | 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'UNKNOWN'>('UNKNOWN');
  const [wahaProfile, setWahaProfile] = useState<{ id: string, name: string, picture: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check WAHA status and profile periodically
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkWahaStatus();
      setWahaStatus(status);

      if (status === 'WORKING' && !wahaProfile) {
        const profile = await fetchWahaProfile();
        if (profile) setWahaProfile(profile);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [wahaProfile]);

  // Poll for QR code if status is SCAN_QR_CODE or STARTING
  useEffect(() => {
    if (wahaStatus === 'SCAN_QR_CODE' || (wahaStatus === 'STARTING' && !wahaProfile)) {
      fetchQRCode();
      const interval = setInterval(fetchQRCode, 3000);
      return () => clearInterval(interval);
    }
  }, [wahaStatus, wahaProfile]);

  const fetchQRCode = async () => {
    const url = await getWahaScreenshot();
    if (url) {
      if (qrCodeUrl) URL.revokeObjectURL(qrCodeUrl);
      setQrCodeUrl(url);
    }
  };

  const handleStartSession = async () => {
    setIsLoading(true);
    await startWahaSession();
    // Wait a bit and check status
    setTimeout(async () => {
      const status = await checkWahaStatus();
      setWahaStatus(status);
      setIsLoading(false);
    }, 3000);
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
    }
  }

  useEffect(() => {
    if (selectedChatId) {
      const loadMessages = async () => {
        const msgs = await fetchMessages(selectedChatId);
        setMessages(msgs);
      };
      loadMessages();
      // Optional: Set up realtime subscription here
    }
  }, [selectedChatId]);

  const handleSend = async (text: string) => {
    if (!selectedChatId || isSending) return;

    setIsSending(true);
    const result = await sendMessage(selectedChatId, text);
    setIsSending(false);

    if (result.success && result.message) {
      setMessages(prev => [...prev, result.message!]);

      // --- AI Integration ---
      // Only trigger AI if the message is from the user (simulated here for demo purposes, 
      // normally we'd listen to incoming messages via webhook/realtime)
      // BUT for this demo, we'll assume we want the AI to reply to OUR message if we are testing,
      // OR more realistically, we should trigger this when an INCOMING message arrives.
      // Since we don't have real incoming messages easily in this dev env without a phone,
      // I will trigger the AI response logic when WE send a message just to demonstrate the logic flow,
      // OR I can add a "Simulate Incoming" button. 
      // Better yet: I'll add a hidden trigger or just let the AI reply to itself for testing? 
      // No, that's infinite loop risk.

      // Let's assume we want to test the AI logic. I'll add a temporary "Simulate Reply" effect
      // that pretends the user replied, then the AI analyzes THAT.
      // For now, I will just implement the AI analysis part that would run on incoming messages.

      // However, the user request implies the AI acts as the agent.
      // So if *I* (the human using the dashboard) send a message, the AI shouldn't reply to me.
      // The AI should reply when the *Lead* sends a message.
      // Since I cannot easily receive real WhatsApp messages here, I will add a helper to simulate an incoming message
      // for testing purposes.
    } else {
      console.error("Failed to send message:", result.error);
      alert(`Failed to send message: ${result.error || 'Unknown error'}`);
    }
  };

  // --- AI Logic for Incoming Messages (Simulated) ---
  // In a real app, this would be in a Supabase Edge Function triggered by a webhook.
  // Here, we'll simulate it by listening to the messages array changes.
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.fromMe && !lastMessage.isAiGenerated && activeChat) {
      const processAI = async () => {
        const { aiService } = await import('../services/aiService');
        const { updateLeadStatus, promoteApifyLeadToCRM, sendMessage } = await import('../services/supabaseService');

        // 1. Analyze
        const analysis = await aiService.analyzeConversation(messages, lastMessage.text);
        console.log("AI Analysis:", analysis);

        // 2. Handle Intent
        if (analysis.intent === 'handoff') {
          // Notify user (toast or visual indicator)
          console.log("User requested handoff");
          return; // Stop AI
        }

        if (analysis.intent === 'won' && activeChat.lead) {
          await updateLeadStatus(activeChat.lead.id, 'Won', analysis.value);
          console.log("Lead marked as Won");
        }

        if (analysis.intent === 'lost' && activeChat.lead) {
          await updateLeadStatus(activeChat.lead.id, 'Lost');
          console.log("Lead marked as Lost");
        }

        // 3. Qualify Lead (Apify -> CRM)
        if (!activeChat.lead && aiService.shouldQualifyLead(messages)) {
          // It's an Apify chat without a CRM lead yet
          // Promote it
          // We need the apify ID, which might be the chatID or linked. 
          // For now, we'll assume we can create a lead from the chat info.
          // This part is tricky without the exact Apify ID link, but we can try to find it or just create a new lead.
          // Let's assume we create a new lead.
          await promoteApifyLeadToCRM(activeChat.id, { // activeChat.id here is the waha table id, might not match apify.
            chat_id: activeChat.chatID,
            name: activeChat.push_name,
            phone: activeChat.chatID.replace('@c.us', '')
          });
          console.log("Lead Promoted to CRM");
        }

        // 4. Generate Response
        const response = await aiService.generateResponse(analysis, activeChat.push_name);

        // 5. Send Response (Simulated delay)
        setTimeout(async () => {
          await sendMessage(activeChat!.chatID, response.text);
          // We need to refresh messages to see the new one, but sendMessage updates DB.
          // The realtime sub or manual fetch would update UI.
          // For now, let's just manually update state to show it immediately
          setMessages(prev => [...prev, {
            id: 'temp-ai-' + Date.now(),
            text: response.text,
            fromMe: true,
            timestamp: Date.now(),
            isAiGenerated: true
          }]);
        }, 2000);
      };

      processAI();
    }
  }, [messages, activeChat]);

  return (
    <div className="flex h-full bg-[#0F0F0F] relative overflow-hidden">

      {/* Disconnected Overlay - Gradient with Warning */}
      {/* Disconnected / QR Code Overlay */}
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

                <button
                  onClick={fetchQRCode}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 uppercase tracking-wider font-medium group"
                >
                  <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                  Refresh Code
                </button>
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
              />

              {/* Contact Info Overlay - Responsive */}
              {showContactInfo && (
                <div className="absolute inset-y-0 right-0 z-50 w-full md:w-80 shadow-2xl border-l border-white/5 bg-[#0F0F0F] animate-in slide-in-from-right duration-300">
                  <ContactInfo
                    lead={activeChat.lead}
                    onClose={() => setShowContactInfo(false)}
                  />
                </div>
              )}
            </div>

            <ChatInput
              onSendMessage={handleSend}
              onSendMedia={() => { }} // Placeholder for now
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
