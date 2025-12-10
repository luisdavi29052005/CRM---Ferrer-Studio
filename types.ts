export type Stage = "New" | "Contacted" | "In Negotiation" | "Won" | "Lost";
export type Temperature = "Cold" | "Warm" | "Hot";
export type Source = "apify" | "manual" | "referral";
export type WahaStatus = "to_send" | "sent" | "error" | "received";

// Waha/Chat Metadata
export interface WahaChat {
  id: string;
  chatID: string; // Unique Identifier
  push_name: string;
  last_text: string;
  last_from_me: boolean;
  last_timestamp: number; // Unix timestamp
  status: WahaStatus;
  unreadCount: number;
}

// CRM Lead
export interface Lead {
  id: string;
  chat_id: string; // FK to WahaChat
  name: string;
  business: string;
  phone: string;
  city: string;
  state?: string;
  category?: string;
  stage: Stage;
  temperature: Temperature;
  score: number; // 0-100
  budget: number;
  notes: string;
  source: Source;
  last_interaction: string;
  last_contact?: string; // Added to match usage in supabaseService
  value?: number; // Added to match usage in supabaseService
  status?: string; // Added to match usage in supabaseService
  company_name?: string; // Added to match usage in supabaseService
}

// Message within a chat
export interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  timestamp: number;
  isAiGenerated?: boolean;
  ack?: number; // 0=pending, 1=sent, 2=received, 3=read, 4=played
  // Media fields
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact';
  caption?: string;
  location?: {
    latitude: number;
    longitude: number;
    description?: string;
  };
  contact?: {
    name: string;
    phone: string;
  };
}

export interface AutomationFlow {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Paused" | "Error";
  lastRun: string;
  leadsTouched: number;
}

export interface ActivityItem {
  id: string;
  type: 'lead_new' | 'lead_won' | 'lead_hot' | 'apify_import' | 'automation_run' | 'message_sent';
  title: string;
  timestamp: string; // ISO string
  meta?: any;
}

export * from './types/waha';

export interface Template {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

export interface Agent {
  id: string;
  created_at?: string;
  name: string;
  description?: string;
  avatar_url?: string;
  category: string;
  model: string;
  prompt: string;
  temperature: number;
  is_active: boolean;
  user_id?: string;
  split_messages?: boolean;
  session?: string; // WAHA session name to use for this agent
}

// Social Proof Message
export interface SocialProofMessage {
  id: string;
  text: string;
  time: string;
  fromMe: boolean;
  type?: 'text' | 'audio';
  status?: 'sent' | 'delivered' | 'read';
}

// Social Proof Configuration
export interface SocialProofConfig {
  id: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  name: string;
  category: string;
  model: string;
  ai_prompt?: string;
  temperature: number;
  avatar_url?: string;
  contact_name?: string;
  is_active: boolean;
  messages: SocialProofMessage[];
}

// Social Proof Item (Generated Proof)
export interface SocialProofItem {
  id: string;
  created_at?: string;
  album_id: string;
  contact_name: string;
  messages: SocialProofMessage[];
}


// Apify Lead
export interface ApifyLead {
  id: string;
  title: string;
  phone: string;
  city: string;
  state: string;
  category: string;
  url: string;
  source: string;
  created_at: string;
  status: 'sent' | 'not sent' | 'error' | 'lost' | 'NEEDS_EDIT' | boolean | string;
}
