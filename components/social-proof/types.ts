export interface Message {
    id: string;
    type: 'text' | 'audio';
    content: string;
    isMe: boolean;
    time: string;
    status?: 'sent' | 'delivered' | 'read';
}

export interface ChatConfig {
    phoneTime: string;
    batteryLevel: number;
    hasWifi: boolean;
    contactName: string;
    contactStatus: string;
    contactAvatar: string;
    chatBackground: string;
    messages: Message[];
}
