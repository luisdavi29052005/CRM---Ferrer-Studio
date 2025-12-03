export interface WahaSession {
    name: string;
    status: 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';
    config?: any;
}

export interface WahaMe {
    id: string;
    pushName: string;
    picture?: string;
    status?: string; // About status
}

export interface WahaProfileStatus {
    status: string;
}

export interface WahaProfilePictureRequest {
    file: Blob;
}

export interface WahaChat {
    id: string; // Serialized ID (e.g., 551199999999@c.us)
    name: string; // Display name
    image?: string;
    timestamp: number;
    unreadCount: number;
    lastMessage?: {
        content: string;
        timestamp: number;
    };
    isGroup: boolean;
    // Additional fields for compatibility/UI
    chatID?: string; // Alias for id if needed by legacy code
    push_name?: string; // Alias for name
    last_text?: string;
    last_from_me?: boolean;
    last_timestamp?: number;
}

export interface WahaMessage {
    id: string;
    timestamp: number;
    from: string;
    to: string;
    fromMe: boolean;
    body: string;
    hasMedia: boolean;
    media?: {
        url: string;
        mimetype: string;
        filename?: string;
    };
    ack: 0 | 1 | 2 | 3 | 4; // 0: pending, 1: sent, 2: received, 3: read, 4: played
    participant?: string; // For groups: who sent it
    replyTo?: {
        id: string;
        body: string;
        participant: string;
    };
    _data?: any;
    // Additional fields for compatibility
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio' | 'file';
    caption?: string;
    isAiGenerated?: boolean;
}

// Payloads for sending
export interface SendTextPayload {
    session: string;
    chatId: string;
    text: string;
    reply_to?: string;
}

export interface SendFilePayload {
    session: string;
    chatId: string;
    file: {
        mimetype: string;
        filename: string;
        url: string; // Base64 data URL or public link
    };
    caption?: string;
}

export interface SendPollPayload {
    session: string;
    chatId: string;
    question: string;
    options: string[];
}

export interface SendLocationPayload {
    session: string;
    chatId: string;
    latitude: number;
    longitude: number;
    title?: string;
    address?: string;
}

export interface WahaContact {
    id: string;
    name?: string;
    pushname?: string;
    shortName?: string;
    number?: string;
    isBusiness?: boolean;
    isEnterprise?: boolean;
    profilePicUrl?: string;
}

export interface WahaGroup {
    id: string;
    subject: string;
    description?: string;
    participants: string[];
    creation?: number;
    owner?: string;
}
