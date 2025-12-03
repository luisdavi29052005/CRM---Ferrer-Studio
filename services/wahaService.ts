import {
    WahaSession, WahaChat, WahaMessage,
    SendTextPayload, SendFilePayload, SendPollPayload, SendLocationPayload,
    WahaGroup, WahaContact, WahaMe
} from '../types/waha';
import { settingsService } from './settingsService';
import { supabase } from '../supabaseClient';

class WahaService {

    private async saveToSupabase(chatId: string, messageData: WahaMessage, body: string, type: string) {
        try {
            // 0. Resolve Chat Name from Apify
            let chatName = null;
            const cleanPhone = chatId.replace(/\D/g, '');
            // Try to find in Apify
            const { data: apifyLead } = await supabase
                .from('apify')
                .select('title')
                .ilike('phone', `%${cleanPhone}%`) // Flexible match
                .maybeSingle();

            if (apifyLead?.title) {
                chatName = apifyLead.title;
            }

            // 1. Upsert Chat
            const chatUpdate: any = {
                chat_jid: chatId,
                last_message: body,
                last_message_at: new Date().toISOString(),
                last_message_from_me: true,
                updated_at: new Date().toISOString()
            };

            if (chatName) {
                chatUpdate.name = chatName;
            }

            const { data: chatData, error: chatError } = await supabase
                .from('whatsapp_waha_chats')
                .upsert(chatUpdate, { onConflict: 'chat_jid' })
                .select('id')
                .maybeSingle();

            if (chatError) console.error('Error upserting chat:', chatError);

            if (chatData) {
                // 2. Upsert Message
                const { error: msgError } = await supabase
                    .from('whatsapp_waha_messages')
                    .upsert({
                        chat_id: chatData.id,
                        message_id: messageData.id || `manual-${Date.now()}`,
                        session: 'default',
                        from_jid: chatId,
                        from_me: true,
                        body: body,
                        type: type,
                        has_media: type !== 'text',
                        ack: 1,
                        message_timestamp: new Date().toISOString()
                    }, { onConflict: 'message_id' });

                if (msgError) console.error('Error upserting message:', msgError);
            }
        } catch (err) {
            console.error('Error saving to Supabase:', err);
        }
    }

    private async request<T>(endpoint: string, method: string = 'GET', body?: any, isBlob: boolean = false): Promise<T> {
        const apiUrl = await settingsService.getSetting('waha_api_url');
        if (!apiUrl) throw new Error('WAHA API URL not configured in System Settings');

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': isBlob ? 'image/*' : 'application/json'
        };

        try {
            const response = await fetch(`${apiUrl}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                // Handle 404 or other errors gracefully if needed, or throw
                const errorText = await response.text();
                throw new Error(`WAHA API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            if (isBlob) {
                return await response.blob() as unknown as T;
            }

            // Handle 204 No Content
            if (response.status === 204) return {} as T;

            return await response.json();
        } catch (error) {
            console.error(`Request failed: ${method} ${endpoint}`, error);
            throw error;
        }
    }

    // --- SESSIONS ---
    async getSessions(): Promise<WahaSession[]> {
        return this.request<WahaSession[]>('/sessions');
    }

    async getSession(session: string): Promise<WahaSession> {
        return this.request<WahaSession>(`/sessions/${session}`);
    }

    // --- PROFILE ---
    async getProfile(session: string): Promise<WahaMe> {
        return this.request<WahaMe>(`/${session}/profile`);
    }

    async setProfileName(session: string, name: string): Promise<{ name: string }> {
        return this.request<{ name: string }>(`/${session}/profile/name`, 'PUT', { name });
    }

    async setProfileStatus(session: string, status: string): Promise<{ status: string }> {
        return this.request<{ status: string }>(`/${session}/profile/status`, 'PUT', { status });
    }

    async setProfilePicture(session: string, file: File): Promise<void> {
        const apiUrl = await settingsService.getSetting('waha_api_url');
        if (!apiUrl) throw new Error('WAHA API URL not configured in System Settings');
        const formData = new FormData();
        formData.append('file', file);

        // Custom request for FormData
        const response = await fetch(`${apiUrl}/${session}/profile/picture`, {
            method: 'PUT',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`WAHA API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }
    }

    async deleteProfilePicture(session: string): Promise<void> {
        return this.request<void>(`/${session}/profile/picture`, 'DELETE');
    }

    async startSession(session: string): Promise<void> {
        return this.request<void>(`/sessions/${session}/start`, 'POST');
    }

    async stopSession(session: string): Promise<void> {
        return this.request<void>(`/sessions/${session}/stop`, 'POST');
    }

    async logoutSession(session: string): Promise<void> {
        return this.request<void>(`/sessions/${session}/logout`, 'POST');
    }

    async getMe(session: string): Promise<any> {
        return this.request<any>(`/sessions/${session}/me`);
    }

    // --- AUTH (QR Code) ---
    async getQR(session: string): Promise<Blob> {
        return this.request<Blob>(`/${session}/auth/qr?format=image`, 'GET', undefined, true);
    }

    async getScreenshot(session: string): Promise<Blob> {
        return this.request<Blob>(`/screenshot?session=${session}`, 'GET', undefined, true);
    }

    // --- CHATS ---
    async getChats(session: string): Promise<WahaChat[]> {
        return this.request<WahaChat[]>(`/${session}/chats`);
    }

    async getChatMessages(session: string, chatId: string, limit: number = 50): Promise<WahaMessage[]> {
        return this.request<WahaMessage[]>(`/${session}/chats/${chatId}/messages?limit=${limit}&downloadMedia=true`);
    }

    async sendSeen(session: string, chatId: string): Promise<void> {
        return this.request<void>('/sendSeen', 'POST', { session, chatId });
    }

    private formatChatId(chatId: string): string {
        if (!chatId) return chatId;
        if (chatId.includes('@')) return chatId;
        return `${chatId.replace(/\D/g, '')}@c.us`;
    }

    // --- SENDING MESSAGES ---
    async sendText(payload: SendTextPayload): Promise<WahaMessage> {
        const chatId = this.formatChatId(payload.chatId);
        const response = await this.request<WahaMessage>('/sendText', 'POST', { ...payload, chatId });
        await this.saveToSupabase(chatId, response, payload.text, 'text');
        return response;
    }

    async sendImage(payload: SendFilePayload): Promise<WahaMessage> {
        const chatId = this.formatChatId(payload.chatId);
        return this.request<WahaMessage>('/sendImage', 'POST', { ...payload, chatId });
    }

    async sendVoice(payload: { session: string, chatId: string, file: { url: string, mimetype: string } }): Promise<WahaMessage> {
        const chatId = this.formatChatId(payload.chatId);
        return this.request<WahaMessage>('/sendVoice', 'POST', { ...payload, chatId });
    }

    async sendVideo(payload: SendFilePayload): Promise<WahaMessage> {
        const chatId = this.formatChatId(payload.chatId);
        return this.request<WahaMessage>('/sendVideo', 'POST', { ...payload, chatId });
    }

    async sendFile(payload: SendFilePayload): Promise<WahaMessage> {
        const chatId = this.formatChatId(payload.chatId);
        return this.request<WahaMessage>('/sendFile', 'POST', { ...payload, chatId });
    }

    async sendPoll(payload: SendPollPayload): Promise<WahaMessage> {
        const chatId = this.formatChatId(payload.chatId);
        return this.request<WahaMessage>('/sendPoll', 'POST', { ...payload, chatId });
    }

    async sendLocation(payload: SendLocationPayload): Promise<WahaMessage> {
        const chatId = this.formatChatId(payload.chatId);
        return this.request<WahaMessage>('/sendLocation', 'POST', { ...payload, chatId });
    }

    // Typing Indicators
    async startTyping(session: string, chatId: string): Promise<void> {
        return this.request<void>('/startTyping', 'POST', { session, chatId });
    }

    async stopTyping(session: string, chatId: string): Promise<void> {
        return this.request<void>('/stopTyping', 'POST', { session, chatId });
    }

    async sendReaction(session: string, messageId: string, reaction: string): Promise<void> {
        return this.request<void>('/reaction', 'POST', { session, messageId, reaction });
    }

    // --- GROUPS ---
    async createGroup(session: string, name: string, participants: string[]): Promise<any> {
        return this.request<any>(`/${session}/groups`, 'POST', { name, participants });
    }

    async leaveGroup(session: string, groupId: string): Promise<void> {
        return this.request<void>(`/${session}/groups/${groupId}/leave`, 'POST');
    }

    async getGroupInfo(session: string, groupId: string): Promise<any> {
        return this.request<any>(`/${session}/groups/${groupId}`);
    }

    // --- CONTACTS ---
    async checkExists(session: string, phone: string): Promise<boolean> {
        const data = await this.request<{ exists: boolean }>(`/contacts/check-exists?session=${session}&phone=${phone}`);
        return data.exists;
    }

    async getProfilePicture(session: string, contactId: string): Promise<string> {
        const data = await this.request<{ url: string }>(`/contacts/profile-picture?session=${session}&contactId=${contactId}`);
        return data.url;
    }

    // --- STATUS (STORIES) ---
    async sendStatusText(session: string, text: string, backgroundColor: string): Promise<void> {
        return this.request<void>(`/${session}/status/text`, 'POST', { text, backgroundColor });
    }
}

export const wahaService = new WahaService();
