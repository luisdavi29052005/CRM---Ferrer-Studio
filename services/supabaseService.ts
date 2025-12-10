import { supabase } from '../supabaseClient';
import { Lead, ApifyLead, WahaChat, WahaMessage, Message, AutomationFlow, Stage, Temperature, Source, WahaStatus, Template, Agent } from '../types';
import { Database } from '../database.types';

type DBLead = Database['public']['Tables']['leads']['Row'];
type DBApify = Database['public']['Tables']['apify']['Row'];
type DBWahaChat = Database['public']['Tables']['whatsapp_waha_chats']['Row'];
type DBWahaMessage = Database['public']['Tables']['whatsapp_waha_messages']['Row'];
type DBAutomation = Database['public']['Tables']['automations']['Row'];
type DBTemplate = Database['public']['Tables']['templates']['Row'];

export const fetchLeads = async (page = 0, pageSize = 50): Promise<Lead[]> => {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching leads:', error);
        return [];
    }


    return (data as DBLead[]).map(lead => ({
        id: lead.id.toString(),
        chat_id: lead.chat_id || '',
        name: lead.name || 'Unknown',
        business: lead.business || lead.company_name || lead.name || '', // Use business column, fallback to company_name
        phone: lead.phone || '',
        city: lead.city || '',
        state: lead.state || '',
        category: lead.category || '',
        stage: (lead.status as Stage) || (lead.stage as Stage) || 'New',
        temperature: (lead.temperature as Temperature) || 'Cold',
        score: lead.budget ? Math.min(lead.budget / 100, 100) : 0,
        budget: Number(lead.budget) || 0,
        notes: lead.notes || '',
        source: (lead.source as Source) || 'manual',
        last_interaction: lead.last_contact ? new Date(lead.last_contact).toLocaleDateString() : 'Never',
    }));
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
    // Map frontend Lead fields to DB columns
    const dbUpdates: any = {};
    if (updates.stage) dbUpdates.status = updates.stage;
    if (updates.temperature) dbUpdates.temperature = updates.temperature;
    // Add other fields as needed

    const { error } = await supabase
        .from('leads')
        .update(dbUpdates)
        .eq('id', id);

    if (error) {
        console.error('Error updating lead:', error);
        throw error;
    }
};

export const fetchApifyLeads = async (page = 0, pageSize = 50): Promise<ApifyLead[]> => {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
        .from('apify')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching apify leads:', error);
        return [];
    }

    return (data as DBApify[]).map(item => ({
        id: item.id.toString(),
        title: item.title || '',
        phone: item.phone || '',
        city: item.city || '',
        state: item.state || '',
        category: item.category || '',
        url: item.url || '',
        source: item.source || 'apify',
        created_at: item.created_at || new Date().toISOString(),
        status: item.status, // Return raw status string
    }));
};

// Fetch ALL Apify leads without pagination (for frontend pagination)
export const fetchAllApifyLeads = async (): Promise<ApifyLead[]> => {
    const { data, error, count } = await supabase
        .from('apify')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 9999); // Fetch up to 10000 records

    if (error) {
        console.error('Error fetching all apify leads:', error);
        return [];
    }

    console.log(`[fetchAllApifyLeads] Total leads: ${count}`);

    return (data as DBApify[]).map(item => ({
        id: item.id.toString(),
        title: item.title || '',
        phone: item.phone || '',
        city: item.city || '',
        state: item.state || '',
        category: item.category || '',
        url: item.url || '',
        source: item.source || 'apify',
        created_at: item.created_at || new Date().toISOString(),
        status: item.status,
    }));
};

export const deleteApifyLeads = async (ids: string[]): Promise<void> => {
    const { error } = await supabase
        .from('apify')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('Error deleting apify leads:', error);
        throw error;
    }
};

export const deleteLeads = async (ids: string[]): Promise<void> => {
    const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('Error deleting leads:', error);
        throw error;
    }
};

export const updateApifyLeadStatus = async (id: string, status: boolean | string): Promise<void> => {
    const { error } = await supabase
        .from('apify')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Error updating apify lead status:', error);
        throw error;
    }
};

export const fetchApifyCategories = async (): Promise<string[]> => {
    const { data, error } = await supabase
        .from('apify')
        .select('category');

    if (error) {
        console.error('Error fetching apify categories:', error);
        return [];
    }

    // Extract unique non-null categories
    const categories = Array.from(new Set((data as any[]).map(item => item.category).filter(Boolean))).sort();
    return categories as string[];
};

export const fetchWahaChats = async (): Promise<WahaChat[]> => {
    const { data, error } = await supabase
        .from('whatsapp_waha_chats')
        .select('*')
        .order('last_message_at', { ascending: false });

    if (error) {
        console.error('Error fetching waha chats:', error);
        return [];
    }

    return (data as DBWahaChat[]).map(chat => ({
        id: chat.id.toString(),
        chatID: chat.chat_jid || '',
        push_name: chat.name || 'Unknown',
        last_text: chat.last_message || '',
        last_from_me: chat.last_message_from_me || false,
        last_timestamp: chat.last_message_at ? new Date(chat.last_message_at).getTime() : 0,
        status: 'sent', // Default
        unreadCount: chat.unread_count || 0,
    }));
};

export const fetchMessages = async (chatId: string): Promise<Message[]> => {
    // We need to find the chat_id (int) from the chat_jid (string) first, 
    // OR we can join. But for now, let's assume we can query by chat_id if we have it, 
    // OR we query by joining.
    // Actually, the messages table uses the integer ID of the chat.
    // But the frontend passes the chatJid (string).
    // So we need to look up the chat first.

    const formattedId = formatChatId(chatId);

    const { data: chatData, error: chatError } = await supabase
        .from('whatsapp_waha_chats')
        .select('id')
        .eq('chat_jid', formattedId)
        .maybeSingle();

    if (chatError || !chatData) {
        // If chat not found, return empty or try to fetch by string ID if logic changes
        // console.error('Error fetching chat for messages:', chatError); // Suppress error for new chats
        return [];
    }

    const { data, error } = await supabase
        .from('whatsapp_waha_messages')
        .select('*')
        .eq('chat_id', chatData.id)
        .order('message_timestamp', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    return (data as DBWahaMessage[]).map(msg => ({
        id: msg.id.toString(),
        text: msg.body || '',
        fromMe: msg.from_me || false,
        timestamp: msg.message_timestamp ? new Date(msg.message_timestamp).getTime() : 0,
        isAiGenerated: false, // Not yet in DB schema
        ack: msg.ack || 0,
        mediaUrl: msg.media_url || undefined,
        mediaType: msg.type as any || undefined,
        caption: msg.media_caption || undefined
    }));
};

export const fetchWahaMessages = async (chatId: string): Promise<WahaMessage[]> => {
    // Look up chat ID from JID
    const formattedId = formatChatId(chatId);

    const { data: chatData, error: chatError } = await supabase
        .from('whatsapp_waha_chats')
        .select('id')
        .eq('chat_jid', formattedId)
        .maybeSingle();

    if (chatError || !chatData) {
        return [];
    }

    const { data, error } = await supabase
        .from('whatsapp_waha_messages')
        .select('*')
        .eq('chat_id', chatData.id)
        .order('message_timestamp', { ascending: true });

    if (error) {
        console.error('Error fetching waha messages:', error);
        return [];
    }

    return (data as DBWahaMessage[]).map(msg => ({
        id: msg.message_id || msg.id.toString(),
        timestamp: msg.message_timestamp ? new Date(msg.message_timestamp).getTime() / 1000 : 0,
        from: msg.from_jid || '',
        to: msg.chat_id?.toString() || '', // This is technically wrong (should be JID) but we don't have 'to' in DB easily without join.
        fromMe: msg.from_me || false,
        body: msg.body || '',
        hasMedia: msg.has_media || false,
        ack: (msg.ack as any) || 0,
        mediaUrl: msg.media_url || undefined,
        mediaType: msg.type as any || undefined,
        caption: msg.media_caption || undefined,
        isAiGenerated: msg.is_ai_generated || false,
        agentName: msg.agent_name || undefined
    }));
};

export const startWahaSession = async (session: string = 'default') => {
    try {
        console.log(`Attempting to start WAHA session: ${session}...`);
        const response = await fetch(`http://localhost:3000/api/sessions/${session}/start`, {
            method: 'POST',
        });
        if (!response.ok) {
            console.error("Failed to start WAHA session:", await response.text());
        } else {
            console.log(`WAHA session ${session} start command sent.`);
            // Wait a bit for the session to initialize
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    } catch (e) {
        console.error("Error starting WAHA session:", e);
    }
};

export const getWahaScreenshot = async (session: string = 'default'): Promise<string | null> => {
    try {
        const response = await fetch(`http://localhost:3000/api/screenshot?session=${session}`, {
            method: 'GET',
            headers: {
                'Accept': 'image/jpeg'
            }
        });
        if (response.ok) {
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        }
        return null;
    } catch (e) {
        console.error("Error getting WAHA screenshot:", e);
        return null;
    }
};

export const fetchSessions = async (): Promise<{ name: string, status: string }[]> => {
    try {
        const response = await fetch('http://localhost:3000/api/sessions');
        if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }
};

export const checkWahaStatus = async (): Promise<'WORKING' | 'FAILED' | 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'UNKNOWN'> => {
    try {
        // List all sessions and check if any is WORKING
        const sessions = await fetchSessions();
        if (!sessions || sessions.length === 0) {
            return 'STOPPED';
        }
        // Check for any WORKING session
        const workingSession = sessions.find((s: any) => s.status === 'WORKING');
        if (workingSession) return 'WORKING';

        const startingSession = sessions.find((s: any) => s.status === 'STARTING');
        if (startingSession) return 'STARTING';

        const qrSession = sessions.find((s: any) => s.status === 'SCAN_QR_CODE');
        if (qrSession) return 'SCAN_QR_CODE';

        return 'STOPPED';
    } catch (e) {
        console.error("Error checking WAHA status:", e);
        return 'FAILED';
    }
};

export const checkNumberExists = async (phone: string, session: string = 'default'): Promise<boolean> => {
    try {
        // Format phone number: remove non-digits (leave only raw numbers)
        const cleanPhone = phone.replace(/\D/g, '');

        if (!cleanPhone) return false;

        // Get active session if session is 'default' or empty
        let activeSession = session;
        if (!session || session === 'default') {
            try {
                const sessionsRes = await fetch('http://localhost:3000/api/sessions');
                if (sessionsRes.ok) {
                    const sessions = await sessionsRes.json();
                    const workingSession = sessions.find((s: any) => s.status === 'WORKING');
                    if (workingSession) {
                        activeSession = workingSession.name;
                    }
                }
            } catch (e) {
                console.error('Error fetching active session:', e);
            }
        }

        // Endpoint: /api/contacts/check-exists?phone={phone}&session={session}
        const response = await fetch(`http://localhost:3000/api/contacts/check-exists?phone=${cleanPhone}&session=${activeSession}`);

        if (!response.ok) {
            console.error('Error checking number existence:', response.statusText);
            return false;
        }

        const data = await response.json();
        return data.numberExists === true;
    } catch (error) {
        console.error('Error checking number existence for', phone, error);
        return false;
    }
};

export const checkApifyStatus = async (token: string): Promise<boolean> => {
    if (!token) return false;
    try {
        const response = await fetch('https://api.apify.com/v2/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Error checking Apify status:', error);
        return false;
    }
};

export const checkPaypalStatus = async (clientId: string, clientSecret: string, env: string): Promise<boolean> => {
    if (!clientId || !clientSecret) return false;
    const baseUrl = env === 'PRODUCTION' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    try {
        const auth = btoa(`${clientId}:${clientSecret}`);
        const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        return response.ok;
    } catch (error) {
        console.error('Error checking PayPal status:', error);
        return false;
    }
};

export const fetchContactProfilePic = async (chatId: string, session?: string): Promise<string | null> => {
    try {
        // Ensure chatId is formatted correctly (e.g. has @c.us if it's just a number)
        let formattedId = chatId;
        if (!chatId.includes('@')) {
            formattedId = `${chatId.replace(/\D/g, '')}@c.us`;
        }

        // If no session provided, try to get active session
        let activeSession = session;
        if (!activeSession || activeSession === 'default') {
            try {
                const sessionsResponse = await fetch('http://localhost:3000/api/sessions');
                if (sessionsResponse.ok) {
                    const sessions = await sessionsResponse.json();
                    const workingSession = sessions.find((s: any) => s.status === 'WORKING');
                    if (workingSession) {
                        activeSession = workingSession.name;
                    }
                }
            } catch (e) {
                // Fallback to default
            }
        }
        activeSession = activeSession || 'default';

        // Use port 3001 for backend proxy
        const response = await fetch(`http://localhost:3001/api/contacts/profile-picture?contactId=${encodeURIComponent(formattedId)}&refresh=false&session=${activeSession}`);
        if (response.ok) {
            const data = await response.json();
            return data.profilePictureURL || null;
        }
        return null;
    } catch (error) {
        console.error('Error fetching profile pic:', error);
        return null;
    }
};

export const fetchChatId = async (chatJid: string): Promise<number | null> => {
    try {
        // Use port 3001 for backend proxy to avoid CORS
        const response = await fetch(`http://localhost:3001/api/chats/id?chatJid=${encodeURIComponent(chatJid)}`);
        if (response.ok) {
            const data = await response.json();
            return data.id || null;
        }
        return null;
    } catch (error) {
        console.error('Error fetching chat ID:', error);
        return null;
    }
};

export const formatChatId = (chatId: string) => {
    if (!chatId) return '';
    if (chatId.includes('@')) return chatId;
    const numericId = chatId.replace(/\D/g, '');
    return `${numericId}@c.us`;
};

export const fetchWahaProfile = async (session: string = 'default'): Promise<{ id: string, name: string, picture: string } | null> => {
    try {
        const response = await fetch(`http://localhost:3000/api/${session}/profile`, {
            method: 'GET',
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (e) {
        console.error("Error fetching WAHA profile:", e);
        return null;
    }
};

export const sendMessage = async (chatId: string, text: string, name?: string, session: string = 'default'): Promise<{ success: boolean, error?: string, message?: any }> => {
    try {
        const sendToWaha = async () => {
            // Sanitize chatId: remove non-digits, ensure @c.us suffix
            const formattedChatId = formatChatId(chatId);

            return await fetch('http://localhost:3000/api/sendText', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: formattedChatId,
                    text: text,
                    session: session,
                    linkPreview: false
                })
            });
        };

        let response = await sendToWaha();

        if (response.status === 422) {
            const errorData = await response.json().catch(() => ({}));
            // Check if error is related to session status
            if (errorData.status === 'FAILED' || errorData.status === 'STOPPED' || (errorData.error && errorData.error.includes('Session status is not as expected'))) {
                console.warn("WAHA Session not working, attempting to start...");
                await startWahaSession();
                // Retry sending
                response = await sendToWaha();
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("WAHA Error:", errorText);

            // Try to parse error for better user feedback
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.status === 'SCAN_QR_CODE') {
                    return { success: false, error: "Please scan the QR code in the connection menu." };
                }
                if (errorJson.status === 'FAILED' || errorJson.status === 'STOPPED') {
                    return { success: false, error: "WhatsApp connection failed. Please check the status icon and try to reconnect." };
                }
            } catch (e) { }

            return { success: false, error: `WAHA Error: ${response.status} - ${errorText}` };
        }
    } catch (e: any) {
        console.error("WAHA Network Error:", e);
        return { success: false, error: `Network Error: ${e.message}` };
    }

    // 2. Upsert WAHA chat record to ensure foreign key constraint
    const formattedChatId = formatChatId(chatId);
    const timestamp = Date.now();

    const { error: wahaError } = await supabase
        .from('whatsapp_waha_chats')
        .upsert({
            chat_jid: formattedChatId,
            last_message: text,
            last_message_from_me: true,
            last_message_at: new Date(timestamp).toISOString(),
            name: name || formattedChatId, // Use provided business name or fallback to chat ID
            unread_count: 0
        }, { onConflict: 'chat_jid' });

    if (wahaError) {
        console.error('Error upserting waha chat:', wahaError);
    }

    // 3. Insert Message
    // First get the internal ID of the chat
    const { data: chatData, error: fetchChatError } = await supabase
        .from('whatsapp_waha_chats')
        .select('id')
        .eq('chat_jid', formattedChatId)
        .single();

    if (fetchChatError || !chatData) {
        console.error('Error fetching chat ID for message insertion:', fetchChatError);
        return { success: false, error: `Database Error: Could not find chat to insert message` };
    }

    const { data, error } = await supabase
        .from('whatsapp_waha_messages')
        .insert([
            {
                chat_id: chatData.id,
                body: text,
                from_me: true,
                message_timestamp: new Date(timestamp).toISOString(),
                from_jid: formattedChatId,
                has_media: false,
                ack: 1 // Sent
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        return { success: false, error: `Database Error: ${error.message}` };
    }

    const msg = data as DBWahaMessage;
    return {
        success: true,
        message: {
            id: msg.id.toString(),
            text: msg.body || '',
            fromMe: msg.from_me || false,
            timestamp: msg.message_timestamp ? new Date(msg.message_timestamp).getTime() : 0,
            isAiGenerated: false,
            ack: msg.ack || 1
        }
    };
};

export const sendImage = async (chatId: string, file: { mimetype: string, filename: string, url: string, caption?: string }, session: string = 'default') => {
    const formattedChatId = formatChatId(chatId);
    return await fetch('http://localhost:3000/api/sendImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatId: formattedChatId,
            file: {
                mimetype: file.mimetype,
                filename: file.filename,
                url: file.url
            },
            caption: file.caption,
            session: session
        })
    });
};

export const sendFile = async (chatId: string, file: { mimetype: string, filename: string, url: string, caption?: string }, session: string = 'default') => {
    const formattedChatId = formatChatId(chatId);
    return await fetch('http://localhost:3000/api/sendFile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatId: formattedChatId,
            file: {
                mimetype: file.mimetype,
                filename: file.filename,
                url: file.url
            },
            caption: file.caption,
            session: session
        })
    });
};

export const sendVoice = async (chatId: string, file: { mimetype: string, url: string }, session: string = 'default') => {
    const formattedChatId = formatChatId(chatId);
    return await fetch('http://localhost:3000/api/sendVoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatId: formattedChatId,
            file: {
                mimetype: file.mimetype,
                url: file.url
            },
            session: session
        })
    });
};

export const sendVideo = async (chatId: string, file: { mimetype: string, filename: string, url: string, caption?: string }, session: string = 'default') => {
    const formattedChatId = formatChatId(chatId);
    return await fetch('http://localhost:3000/api/sendVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatId: formattedChatId,
            file: {
                mimetype: file.mimetype,
                filename: file.filename,
                url: file.url
            },
            caption: file.caption,
            session: session
        })
    });
};

export const sendLocation = async (chatId: string, location: { latitude: number, longitude: number, title?: string }, session: string = 'default') => {
    const formattedChatId = formatChatId(chatId);
    return await fetch('http://localhost:3000/api/sendLocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatId: formattedChatId,
            latitude: location.latitude,
            longitude: location.longitude,
            title: location.title,
            session: session
        })
    });
};

export const sendContact = async (chatId: string, contact: { fullName: string, phoneNumber: string, organization?: string }, session: string = 'default') => {
    const formattedChatId = formatChatId(chatId);
    return await fetch('http://localhost:3000/api/sendContactVcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatId: formattedChatId,
            contacts: [
                {
                    fullName: contact.fullName,
                    phoneNumber: contact.phoneNumber,
                    organization: contact.organization
                }
            ],
            session: session
        })
    });
};


export const startTyping = async (chatId: string, session: string = 'default') => {
    const formattedChatId = formatChatId(chatId);
    return await fetch('http://localhost:3000/api/startTyping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatId: formattedChatId,
            session: session
        })
    });
};

export const stopTyping = async (chatId: string, session: string = 'default') => {
    const formattedChatId = formatChatId(chatId);
    return await fetch('http://localhost:3000/api/stopTyping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatId: formattedChatId,
            session: session
        })
    });
};

export const sendReaction = async (messageId: string, emoji: string, session: string = 'default') => {
    return await fetch('http://localhost:3000/api/reaction', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messageId: messageId,
            reaction: emoji,
            session: session
        })
    });
};

export const setPresence = async (status: 'online' | 'offline', session: string = 'default') => {
    try {
        await fetch(`http://localhost:3000/api/${session}/presence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ presence: status })
        });
    } catch (e) {
        console.error("Error setting presence:", e);
    }
};

export const checkPresence = async (chatId: string, session: string = 'default'): Promise<'online' | 'offline' | 'unknown'> => {
    try {
        const formattedChatId = formatChatId(chatId);
        const response = await fetch(`http://localhost:3000/api/${session}/presence/${formattedChatId}`);
        if (response.ok) {
            const data = await response.json();
            // WAHA might return { status: 'online' } or { presence: 'online' }
            const status = data.presence || data.status || 'unknown';
            return status as 'online' | 'offline' | 'unknown';
        }
        return 'unknown';
    } catch (e) {
        console.error("Error checking presence:", e);
        return 'unknown';
    }
};

export const subscribePresence = async (chatId: string, session: string = 'default') => {
    try {
        const formattedChatId = formatChatId(chatId);
        await fetch(`http://localhost:3000/api/${session}/presence/${formattedChatId}/subscribe`, {
            method: 'POST',
        });
    } catch (e) {
        console.error("Error subscribing to presence:", e);
    }
};

export const fetchAutomations = async (): Promise<AutomationFlow[]> => {
    const { data, error } = await supabase
        .from('automations')
        .select('*');

    if (error) {
        console.error('Error fetching automations:', error);
        return [];
    }

    return (data as DBAutomation[]).map(auto => ({
        id: auto.id.toString(),
        name: auto.name || '',
        description: auto.description || '',
        status: (auto.status as "Active" | "Paused" | "Error") || 'Paused',
        lastRun: auto.last_run ? new Date(auto.last_run).toLocaleTimeString() : 'Never',
        leadsTouched: auto.leads_touched || 0,
    }));
};

export const fetchTemplates = async (): Promise<Template[]> => {
    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching templates:', error);
        return [];
    }

    return (data as any[]).map(t => ({
        id: t.id,
        name: t.name,
        content: t.content,
        created_at: t.created_at
    }));
};

export const createTemplate = async (template: Omit<Template, 'id' | 'created_at'>): Promise<Template | null> => {
    const { data, error } = await supabase
        .from('templates')
        .insert([template])
        .select()
        .single();

    if (error) {
        console.error('Error creating template:', error);
        return null;
    }

    return data as Template;
};

export const deleteTemplate = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting template:', error);
        return false;
    }
    return true;
};

// --- Agent Management ---

export const fetchAgents = async (): Promise<Agent[]> => {
    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching agents:', error);
        return [];
    }

    return data as Agent[];
};

export const createAgent = async (agent: Omit<Agent, 'id' | 'created_at'>): Promise<Agent | null> => {
    const { data, error } = await supabase
        .from('agents')
        .insert([agent])
        .select()
        .single();

    if (error) {
        console.error('Error creating agent:', error);
        return null;
    }

    return data as Agent;
};

export const updateAgent = async (id: string, updates: Partial<Agent>): Promise<Agent | null> => {
    const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating agent:', error);
        return null;
    }

    return data as Agent;
};

export const deleteAgent = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting agent:', error);
        return false;
    }
    return true;
};


// --- Social Proof Management ---

export const fetchSocialProofs = async (): Promise<import('../types').SocialProofConfig[]> => {
    const { data, error } = await supabase
        .from('social_proofs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching social proofs:', error);
        return [];
    }

    return (data || []).map(item => ({
        ...item,
        messages: item.messages || []
    })) as import('../types').SocialProofConfig[];
};

export const createSocialProof = async (config: Omit<import('../types').SocialProofConfig, 'id' | 'created_at' | 'updated_at'>): Promise<import('../types').SocialProofConfig | null> => {
    const { data, error } = await supabase
        .from('social_proofs')
        .insert([config])
        .select()
        .single();

    if (error) {
        console.error('Error creating social proof:', error);
        return null;
    }

    return data as import('../types').SocialProofConfig;
};

export const updateSocialProof = async (id: string, updates: Partial<import('../types').SocialProofConfig>): Promise<import('../types').SocialProofConfig | null> => {
    const { data, error } = await supabase
        .from('social_proofs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating social proof:', error);
        return null;
    }

    return data as import('../types').SocialProofConfig;
};

export const deleteSocialProof = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('social_proofs')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting social proof:', error);
        return false;
    }
    return true;
};

// --- Social Proof Items (Generated Proofs) ---

export const fetchSocialProofItems = async (albumId: string): Promise<import('../types').SocialProofItem[]> => {
    const { data, error } = await supabase
        .from('social_proof_items')
        .select('*')
        .eq('album_id', albumId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching social proof items:', error);
        return [];
    }

    return (data || []).map(item => ({
        ...item,
        messages: item.messages || []
    })) as import('../types').SocialProofItem[];
};

export const createSocialProofItem = async (item: Omit<import('../types').SocialProofItem, 'id' | 'created_at'>): Promise<import('../types').SocialProofItem | null> => {
    const { data, error } = await supabase
        .from('social_proof_items')
        .insert([item])
        .select()
        .single();

    if (error) {
        console.error('Error creating social proof item:', error);
        return null;
    }

    return data as import('../types').SocialProofItem;
};

export const deleteSocialProofItem = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('social_proof_items')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting social proof item:', error);
        return false;
    }
    return true;
};



export const fetchChartData = async () => {
    const { data, error } = await supabase
        .rpc('get_weekly_stats');

    if (error) {
        console.error('Error fetching chart data:', error);
        return [];
    }

    return data;
};

export const authActions = {
    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },
    signUp: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { data, error };
    },
    signInWithGoogle: async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        return { data, error };
    },
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    },
    getCurrentProfile: async (userId?: string) => {
        let uid = userId;
        if (!uid) {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.warn("No user found in getCurrentProfile");
                return null;
            }
            uid = user.id;
        }

        let retries = 3;
        while (retries > 0) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();

            if (data) {
                return data;
            }

            if (error) {
                console.error("Error fetching profile:", error);
            }

            console.log(`Profile not found, retrying... (${retries} attempts left)`);
            retries--;
            if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return null;
    },
};

export const fetchProfiles = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching profiles:', error);
        return [];
    }
    return data;
};

export const updateProfile = async (id: string, updates: any) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    return { data, error };
};

export const uploadChatMedia = async (file: File): Promise<{ url: string | null, error: string | null }> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `chat-media/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('media') // Using 'media' bucket, ensure it exists
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading media:', uploadError);
            return { url: null, error: uploadError.message };
        }

        const { data } = supabase.storage.from('media').getPublicUrl(filePath);
        return { url: data.publicUrl, error: null };
    } catch (e: any) {
        console.error('Error in uploadChatMedia:', e);
        return { url: null, error: e.message };
    }
};

export const uploadAgentAvatar = async (file: File): Promise<{ url: string | null, error: string | null }> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatars/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            return { url: null, error: uploadError.message };
        }

        const { data } = supabase.storage.from('media').getPublicUrl(fileName);
        return { url: data.publicUrl, error: null };
    } catch (e: any) {
        console.error('Error in uploadAgentAvatar:', e);
        return { url: null, error: e.message };
    }
};

export const fetchRecentActivity = async (): Promise<import('../types').ActivityItem[]> => {
    try {
        const activities: import('../types').ActivityItem[] = [];

        // 1. Fetch Recent Leads (New, Won, Hot)
        const { data: leads } = await supabase
            .from('leads')
            .select('id, name, stage, temperature, created_at, updated_at, source')
            .order('updated_at', { ascending: false })
            .limit(5);

        if (leads) {
            leads.forEach(lead => {
                // New Lead Activity
                if (new Date(lead.created_at!).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
                    activities.push({
                        id: `lead_new_${lead.id}`,
                        type: 'lead_new',
                        title: `New lead '${lead.name}' added manually`,
                        timestamp: lead.created_at!,
                        meta: { source: lead.source }
                    });
                }

                // Won Lead Activity
                if (lead.stage === 'Won') {
                    activities.push({
                        id: `lead_won_${lead.id}`,
                        type: 'lead_won',
                        title: `Lead '${lead.name}' marked as Won`,
                        timestamp: lead.updated_at!,
                    });
                }

                // Hot Lead Activity
                if (lead.temperature === 'Hot') {
                    activities.push({
                        id: `lead_hot_${lead.id}`,
                        type: 'lead_hot',
                        title: `Lead '${lead.name}' is now Hot`,
                        timestamp: lead.updated_at!,
                    });
                }
            });
        }

        // 2. Fetch Recent Apify Imports
        const { data: apify } = await supabase
            .from('apify')
            .select('id, title, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (apify) {
            apify.forEach(item => {
                activities.push({
                    id: `apify_${item.id}`,
                    type: 'apify_import',
                    title: `New lead '${item.title}' imported from Apify`,
                    timestamp: item.created_at!,
                });
            });
        }

        // 3. Fetch Recent Automations
        const { data: automations } = await supabase
            .from('automations')
            .select('id, name, last_run, status')
            .order('last_run', { ascending: false })
            .limit(5);

        if (automations) {
            automations.forEach(auto => {
                if (auto.last_run) {
                    activities.push({
                        id: `auto_${auto.id}`,
                        type: 'automation_run',
                        title: `Automation '${auto.name}' ran successfully`,
                        timestamp: auto.last_run,
                    });
                }
            });
        }

        // Sort by timestamp descending and take top 10
        return activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);

    } catch (error) {
        console.error("Error fetching recent activity:", error);
        return [];
    }
};

export const promoteApifyLeadToCRM = async (apifyLeadId: string, leadData: Partial<Lead>): Promise<{ success: boolean; error?: string }> => {
    // 1. Get Apify Lead Data
    const { data: apifyLead, error: fetchError } = await supabase
        .from('apify')
        .select('*')
        .eq('id', apifyLeadId)
        .single();

    if (fetchError || !apifyLead) {
        return { success: false, error: fetchError?.message || 'Apify lead not found' };
    }

    // 2. Insert into Leads Table
    const { error: insertError } = await supabase
        .from('leads')
        .insert([{
            chat_id: leadData.chat_id,
            name: leadData.name || apifyLead.title,
            business: leadData.business || apifyLead.title,
            phone: leadData.phone || apifyLead.phone,
            city: leadData.city || apifyLead.city,
            stage: 'New',
            temperature: 'Warm',
            score: 50,
            budget: 0,
            source: 'apify',
            notes: `Promoted from Apify. Original URL: ${apifyLead.url}`
        }]);

    if (insertError) {
        return { success: false, error: insertError.message };
    }

    // 3. Update Apify Status
    await supabase
        .from('apify')
        .update({ status: 'sent' }) // Or a new status 'promoted'
        .eq('id', apifyLeadId);

    return { success: true };
};

export const updateLeadStatus = async (leadId: string, stage: Stage, budget?: number, temperature?: Temperature) => {
    const updates: any = { stage };
    if (budget !== undefined) updates.budget = budget;
    if (temperature !== undefined) updates.temperature = temperature;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId);

    if (error) {
        console.error('Error updating lead status:', error);
    }
};

export const getOrCreateApifyBlastWorkflow = async (): Promise<string | null> => {
    try {
        // 1. Check if it exists
        const { data: existing, error: fetchError } = await supabase
            .from('automations')
            .select('id')
            .eq('name', 'Apify Blast')
            .single();

        if (existing) return existing.id;

        // 2. Create if not exists
        const { data: newWorkflow, error: insertError } = await supabase
            .from('automations')
            .insert([{
                name: 'Apify Blast',
                description: 'Automated bulk messaging to imported leads',
                status: 'active',
                leads_touched: 0
            }])
            .select('id')
            .single();

        if (insertError) {
            console.error("Error creating Apify Blast workflow:", insertError);
            // Fallback to a static UUID if DB insert fails (e.g. permissions)
            return 'apify-blast-workflow-id';
        }

        return newWorkflow.id;
    } catch (error) {
        console.error("Error in getOrCreateApifyBlastWorkflow:", error);
        return 'apify-blast-workflow-id';
    }
};

// --- Blast Run Tracking ---

export const createBlastRun = async (
    totalLeads: number,
    filters: any,
    messageTemplate: string,
    batchSize: number,
    intervalSeconds: number,
    runName?: string
): Promise<string | null> => {
    try {
        const filtersWithMeta = { ...filters, run_name: runName };
        const { data, error } = await supabase
            .from('blast_runs')
            .insert([{
                total_leads: totalLeads,
                filters: filtersWithMeta,
                message_template: messageTemplate,
                batch_size: batchSize,
                interval_seconds: intervalSeconds,
                status: 'running',
                success_count: 0,
                failed_count: 0
            }])
            .select('id')
            .single();

        if (error) {
            console.error('Error creating blast run:', error);
            return null;
        }
        return data.id;
    } catch (error) {
        console.error('Error in createBlastRun:', error);
        return null;
    }
};

export const updateBlastRun = async (
    runId: string,
    updates: {
        status?: string;
        success_count?: number;
        failed_count?: number;
    }
): Promise<void> => {
    try {
        const { error } = await supabase
            .from('blast_runs')
            .update(updates)
            .eq('id', runId);

        if (error) {
            console.error('Error updating blast run:', error);
        }
    } catch (error) {
        console.error('Error in updateBlastRun:', error);
    }
};

export const logBlastAction = async (
    runId: string,
    leadId: number | null,
    leadPhone: string,
    status: 'success' | 'failed',
    errorMessage?: string
): Promise<void> => {
    try {
        const { error } = await supabase
            .from('blast_logs')
            .insert([{
                blast_run_id: runId,
                lead_id: leadId,
                lead_phone: leadPhone,
                status: status,
                error_message: errorMessage
            }]);

        if (error) {
            console.error('Error logging blast action:', error);
        }
    } catch (error) {
        console.error('Error in logBlastAction:', error);
    }
};

export const fetchBlastRuns = async () => {
    const { data, error } = await supabase
        .from('blast_runs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching blast runs:', error);
        return [];
    }
    return data;
};

export const startBlastBackend = async (runId: string, config: any) => {
    const response = await fetch('http://localhost:3001/api/blast/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, config })
    });
    if (!response.ok) {
        throw new Error('Failed to start blast on backend');
    }
    return response.json();
};

export const stopBlastBackend = async (runId: string) => {
    const response = await fetch('http://localhost:3001/api/blast/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId })
    });
    if (!response.ok) {
        throw new Error('Failed to stop blast on backend');
    }
    return response.json();
};

export const fetchBlastRun = async (runId: string) => {
    const { data, error } = await supabase
        .from('blast_runs')
        .select('*')
        .eq('id', runId)
        .single();

    if (error) {
        console.error('Error fetching blast run:', error);
        return null;
    }
    return data;
};

export const fetchBlastLogs = async (runId: string) => {
    const { data, error } = await supabase
        .from('blast_logs')
        .select('*')
        .eq('blast_run_id', runId)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching blast logs:', error);
        return [];
    }
    return data;
};
