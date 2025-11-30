export interface WahaSession {
    name: string;
    status: 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';
    config?: any;
    me?: WahaMe;
}

export interface WahaMe {
    id: string;
    pushName: string;
    name?: string;
    picture?: string;
    about?: string;
}

export interface WahaChat {
    id: string;
    lastMessage?: WahaMessage;
    contact?: WahaContact;
    name?: string;
    unreadCount?: number;
    timestamp?: number;
    pinned?: boolean;
    muted?: boolean;
    archived?: boolean;
}

export interface WahaMessage {
    id: string;
    from: string;
    to: string;
    body: string;
    timestamp: number;
    fromMe: boolean;
    hasMedia: boolean;
    type: 'text' | 'image' | 'voice' | 'audio' | 'video' | 'document' | 'location' | 'vcard' | 'sticker' | 'revoked' | 'unknown';
    ack: 0 | 1 | 2 | 3 | 4; // 0: pending, 1: sent, 2: received, 3: read, 4: played
    mediaUrl?: string;
    thumbnailUrl?: string;
    caption?: string;
    replyTo?: {
        id: string;
    };
    location?: {
        latitude: number;
        longitude: number;
        description?: string;
    };
    vcard?: {
        fn: string;
        tel?: string;
    };
}

export interface WahaContact {
    id: string;
    pushname?: string;
    name?: string;
    shortName?: string;
    profilePicUrl?: string;
    isBusiness?: boolean;
    isEnterprise?: boolean;
}

export interface WahaGroup {
    id: string;
    subject: string;
    description?: string;
    owner: string;
    participants: {
        id: string;
        isAdmin: boolean;
        isSuperAdmin: boolean;
    }[];
    creation?: number;
}

export interface WahaSendTextRequest {
    chatId: string;
    text: string;
    session: string;
    replyTo?: string;
}

export interface WahaSendImageRequest {
    chatId: string;
    file: {
        mimetype: string;
        filename: string;
        data: string; // Base64
    };
    caption?: string;
    session: string;
    replyTo?: string;
}

export interface WahaSendVoiceRequest {
    chatId: string;
    file: {
        mimetype: string;
        filename?: string;
        data: string; // Base64
    };
    session: string;
    replyTo?: string;
}

export interface WahaSendVideoRequest {
    chatId: string;
    file: {
        mimetype: string;
        filename: string;
        data: string; // Base64
    };
    caption?: string;
    session: string;
    replyTo?: string;
}

export interface WahaSendFileRequest {
    chatId: string;
    file: {
        mimetype: string;
        filename: string;
        data: string; // Base64
    };
    caption?: string;
    session: string;
    replyTo?: string;
}

export interface WahaSendLocationRequest {
    chatId: string;
    latitude: number;
    longitude: number;
    title?: string;
    session: string;
}

export interface WahaSendContactVcardRequest {
    chatId: string;
    contactsId: string; // ID of the contact to send
    name?: string; // Name to display
    session: string;
}

export interface WahaSendPollRequest {
    chatId: string;
    name: string;
    options: string[];
    multipleAnswers?: boolean;
    session: string;
}

export interface WahaSendLinkPreviewRequest {
    chatId: string;
    url: string;
    title: string;
    session: string;
}
