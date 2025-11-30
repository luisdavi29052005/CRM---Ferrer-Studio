import {
    WahaSession, WahaChat, WahaMessage,
    SendTextPayload, SendFilePayload, SendPollPayload, SendLocationPayload,
    WahaGroup, WahaContact
} from '../types/waha';

const API_URL = 'http://localhost:3000/api';

class WahaService {

    private async request<T>(endpoint: string, method: string = 'GET', body?: any, isBlob: boolean = false): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': isBlob ? 'image/*' : 'application/json'
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
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

    // --- SENDING MESSAGES ---
    async sendText(payload: SendTextPayload): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendText', 'POST', payload);
    }

    async sendImage(payload: SendFilePayload): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendImage', 'POST', payload);
    }

    async sendVoice(payload: { session: string, chatId: string, file: { url: string, mimetype: string } }): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendVoice', 'POST', payload);
    }

    async sendVideo(payload: SendFilePayload): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendVideo', 'POST', payload);
    }

    async sendFile(payload: SendFilePayload): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendFile', 'POST', payload);
    }

    async sendPoll(payload: SendPollPayload): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendPoll', 'POST', payload);
    }

    async sendLocation(payload: SendLocationPayload): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendLocation', 'POST', payload);
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
