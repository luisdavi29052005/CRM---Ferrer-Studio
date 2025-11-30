import {
    WahaSession,
    WahaChat,
    WahaMessage,
    WahaContact,
    WahaGroup,
    WahaSendTextRequest,
    WahaSendImageRequest,
    WahaSendVoiceRequest,
    WahaSendVideoRequest,
    WahaSendFileRequest,
    WahaSendLocationRequest,
    WahaSendContactVcardRequest,
    WahaSendPollRequest,

    WahaSendLinkPreviewRequest,
    WahaMe
} from '../types/waha';

const API_URL = 'http://localhost:3000/api';
const DEFAULT_SESSION = 'default';

class WahaService {
    private async request<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`WAHA API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            // Handle empty responses (e.g. 204 No Content)
            if (response.status === 204) {
                return {} as T;
            }

            // Some endpoints might return raw text or blob, but most return JSON.
            // We'll assume JSON for now and handle exceptions if needed.
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            // Fallback for non-JSON responses (like images)
            if (contentType && (contentType.includes('image/') || contentType.includes('application/pdf'))) {
                const blob = await response.blob();
                return URL.createObjectURL(blob) as unknown as T;
            }

            return await response.text() as unknown as T;

        } catch (error) {
            console.error(`Request failed: ${method} ${endpoint}`, error);
            throw error;
        }
    }

    // --- Sessions ---

    async getSessions(): Promise<WahaSession[]> {
        return this.request<WahaSession[]>('/sessions');
    }

    async createSession(name: string, config?: any): Promise<WahaSession> {
        return this.request<WahaSession>('/sessions', 'POST', { name, config });
    }

    async getSession(session: string = DEFAULT_SESSION): Promise<WahaSession> {
        return this.request<WahaSession>(`/sessions/${session}`);
    }

    async updateSessionConfig(session: string = DEFAULT_SESSION, config: any): Promise<void> {
        return this.request<void>(`/sessions/${session}`, 'PUT', config);
    }

    async deleteSession(session: string = DEFAULT_SESSION): Promise<void> {
        return this.request<void>(`/sessions/${session}`, 'DELETE');
    }

    async getMe(session: string = DEFAULT_SESSION): Promise<WahaMe> {
        return this.request<WahaMe>(`/sessions/${session}/me`);
    }

    async startSession(session: string = DEFAULT_SESSION): Promise<void> {
        return this.request<void>(`/sessions/${session}/start`, 'POST');
    }

    async stopSession(session: string = DEFAULT_SESSION): Promise<void> {
        return this.request<void>(`/sessions/${session}/stop`, 'POST');
    }

    async logoutSession(session: string = DEFAULT_SESSION): Promise<void> {
        return this.request<void>(`/sessions/${session}/logout`, 'POST');
    }

    async restartSession(session: string = DEFAULT_SESSION): Promise<void> {
        return this.request<void>(`/sessions/${session}/restart`, 'POST');
    }

    // --- Auth ---

    async getQR(session: string = DEFAULT_SESSION): Promise<Blob> {
        const response = await fetch(`${API_URL}/${session}/auth/qr?format=image`);
        if (!response.ok) throw new Error('Failed to fetch QR code');
        return response.blob();
    }

    async getQRJson(session: string = DEFAULT_SESSION): Promise<{ qr: string }> {
        return this.request<{ qr: string }>(`/${session}/auth/qr?format=json`);
    }

    async requestCode(session: string = DEFAULT_SESSION, phoneNumber: string): Promise<{ code: string }> {
        return this.request<{ code: string }>(`/${session}/auth/request-code`, 'POST', { phoneNumber });
    }

    // --- Screenshot ---

    async getScreenshot(session: string = DEFAULT_SESSION): Promise<Blob> {
        const response = await fetch(`${API_URL}/screenshot?session=${session}`);
        if (!response.ok) throw new Error('Failed to fetch screenshot');
        return response.blob();
    }

    // --- Chatting ---

    async sendText(request: WahaSendTextRequest): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendText', 'POST', request);
    }

    async sendImage(request: WahaSendImageRequest): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendImage', 'POST', request);
    }

    async sendVoice(request: WahaSendVoiceRequest): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendVoice', 'POST', request);
    }

    async sendVideo(request: WahaSendVideoRequest): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendVideo', 'POST', request);
    }

    async sendFile(request: WahaSendFileRequest): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendFile', 'POST', request);
    }

    async sendLocation(request: WahaSendLocationRequest): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendLocation', 'POST', request);
    }

    async sendContactVcard(request: WahaSendContactVcardRequest): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendContactVcard', 'POST', request);
    }

    async sendPoll(request: WahaSendPollRequest): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendPoll', 'POST', request);
    }

    async sendPollVote(session: string, chatId: string, pollId: string, optionIds: string[]): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendPollVote', 'POST', { session, chatId, pollId, selectedOptions: optionIds });
    }

    async sendLinkPreview(request: WahaSendLinkPreviewRequest): Promise<WahaMessage> {
        return this.request<WahaMessage>('/sendLinkPreview', 'POST', request);
    }

    async startTyping(session: string, chatId: string): Promise<void> {
        return this.request<void>('/startTyping', 'POST', { session, chatId });
    }

    async stopTyping(session: string, chatId: string): Promise<void> {
        return this.request<void>('/stopTyping', 'POST', { session, chatId });
    }

    async sendSeen(session: string, chatId: string): Promise<void> {
        return this.request<void>('/sendSeen', 'POST', { session, chatId });
    }

    async reaction(session: string, messageId: string, reaction: string): Promise<void> {
        return this.request<void>('/reaction', 'POST', { session, messageId, reaction });
    }

    async star(session: string, messageId: string, star: boolean): Promise<void> {
        return this.request<void>('/star', 'PUT', { session, messageId, star });
    }

    async forwardMessage(session: string, chatId: string, messageId: string): Promise<WahaMessage> {
        return this.request<WahaMessage>('/forwardMessage', 'POST', { session, chatId, messageId });
    }

    async deleteMessage(session: string, chatId: string, messageId: string): Promise<void> {
        return this.request<void>(`/${session}/chats/${chatId}/messages/${messageId}`, 'DELETE');
    }

    // --- Chats ---

    async getChats(session: string = DEFAULT_SESSION): Promise<WahaChat[]> {
        return this.request<WahaChat[]>(`/${session}/chats`);
    }

    async getChatsOverview(session: string = DEFAULT_SESSION): Promise<WahaChat[]> {
        return this.request<WahaChat[]>(`/${session}/chats/overview`);
    }

    async getChatMessages(session: string, chatId: string, limit: number = 50, offset: number = 0): Promise<WahaMessage[]> {
        return this.request<WahaMessage[]>(`/${session}/chats/${chatId}/messages?limit=${limit}&offset=${offset}`);
    }

    async deleteChat(session: string, chatId: string): Promise<void> {
        return this.request<void>(`/${session}/chats/${chatId}`, 'DELETE');
    }

    async clearChat(session: string, chatId: string): Promise<void> {
        return this.request<void>(`/${session}/chats/${chatId}/messages`, 'DELETE');
    }

    async archiveChat(session: string, chatId: string): Promise<void> {
        return this.request<void>(`/${session}/chats/${chatId}/archive`, 'POST');
    }

    async unarchiveChat(session: string, chatId: string): Promise<void> {
        return this.request<void>(`/${session}/chats/${chatId}/unarchive`, 'POST');
    }

    // --- Groups ---

    async getGroups(session: string = DEFAULT_SESSION): Promise<WahaGroup[]> {
        return this.request<WahaGroup[]>(`/${session}/groups`);
    }

    async createGroup(session: string, name: string, participants: string[]): Promise<WahaGroup> {
        return this.request<WahaGroup>(`/${session}/groups`, 'POST', { name, participants });
    }

    async getGroup(session: string, id: string): Promise<WahaGroup> {
        return this.request<WahaGroup>(`/${session}/groups/${id}`);
    }

    async leaveGroup(session: string, id: string): Promise<void> {
        return this.request<void>(`/${session}/groups/${id}/leave`, 'POST');
    }

    async getGroupInviteCode(session: string, id: string): Promise<string> {
        return this.request<string>(`/${session}/groups/${id}/invite-code`);
    }

    async revokeGroupInviteCode(session: string, id: string): Promise<string> {
        return this.request<string>(`/${session}/groups/${id}/invite-code/revoke`, 'POST');
    }

    async getGroupParticipants(session: string, id: string): Promise<any[]> {
        return this.request<any[]>(`/${session}/groups/${id}/participants`);
    }

    async addGroupParticipant(session: string, id: string, participant: string): Promise<void> {
        return this.request<void>(`/${session}/groups/${id}/participants/add`, 'POST', { participant });
    }

    async removeGroupParticipant(session: string, id: string, participant: string): Promise<void> {
        return this.request<void>(`/${session}/groups/${id}/participants/remove`, 'POST', { participant });
    }

    async promoteGroupParticipant(session: string, id: string, participant: string): Promise<void> {
        return this.request<void>(`/${session}/groups/${id}/admin/promote`, 'POST', { participant });
    }

    async demoteGroupParticipant(session: string, id: string, participant: string): Promise<void> {
        return this.request<void>(`/${session}/groups/${id}/admin/demote`, 'POST', { participant });
    }

    async updateGroupSubject(session: string, id: string, subject: string): Promise<void> {
        return this.request<void>(`/${session}/groups/${id}/subject`, 'PUT', { subject });
    }

    async updateGroupDescription(session: string, id: string, description: string): Promise<void> {
        return this.request<void>(`/${session}/groups/${id}/description`, 'PUT', { description });
    }

    // --- Contacts ---

    async getAllContacts(session: string = DEFAULT_SESSION): Promise<WahaContact[]> {
        return this.request<WahaContact[]>('/contacts/all', 'GET', { session }); // Query param or body? Usually query for GET.
        // The API definition says GET /contacts/all. It probably expects session as query param if not default.
        // Let's assume it might need ?session=...
    }

    async checkNumberExists(session: string = DEFAULT_SESSION, phone: string): Promise<boolean> {
        const result = await this.request<{ exists: boolean }>(`/contacts/check-exists?phone=${phone}&session=${session}`);
        return result.exists;
    }

    async getProfilePicture(session: string = DEFAULT_SESSION, contactId: string): Promise<string> {
        const result = await this.request<{ url: string }>(`/contacts/profile-picture?contactId=${contactId}&session=${session}`);
        return result.url;
    }

    async getStatus(session: string = DEFAULT_SESSION, contactId: string): Promise<string> {
        const result = await this.request<{ status: string }>(`/contacts/about?contactId=${contactId}&session=${session}`);
        return result.status;
    }

    async blockContact(session: string = DEFAULT_SESSION, contactId: string): Promise<void> {
        return this.request<void>('/contacts/block', 'POST', { session, contactId });
    }

    async unblockContact(session: string = DEFAULT_SESSION, contactId: string): Promise<void> {
        return this.request<void>('/contacts/unblock', 'POST', { session, contactId });
    }

    // --- Presence ---

    async setPresence(session: string, presence: 'online' | 'offline'): Promise<void> {
        return this.request<void>(`/${session}/presence`, 'POST', { presence });
    }

    async subscribePresence(session: string, chatId: string): Promise<void> {
        return this.request<void>(`/${session}/presence/${chatId}/subscribe`, 'POST');
    }

    async checkPresence(session: string, chatId: string): Promise<'online' | 'offline' | 'unknown'> {
        // Subscribe to presence updates. The actual status will be received via webhook/websocket.
        // We return 'unknown' initially as WAHA doesn't provide a synchronous check in this endpoint.
        await this.subscribePresence(session, chatId);
        return 'unknown';
    }
}

export const wahaService = new WahaService();
