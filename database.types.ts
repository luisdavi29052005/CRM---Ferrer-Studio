export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            apify: {
                Row: {
                    category: string | null
                    city: string | null
                    country: string | null
                    created_at: string | null
                    id: number
                    phone: string | null
                    source: string | null
                    state: string | null
                    status: string | null
                    street: string | null
                    title: string | null
                    url: string | null
                }
                Insert: {
                    category?: string | null
                    city?: string | null
                    country?: string | null
                    created_at?: string | null
                    id?: number
                    phone?: string | null
                    source?: string | null
                    state?: string | null
                    status?: string | null
                    street?: string | null
                    title?: string | null
                    url?: string | null
                }
                Update: {
                    category?: string | null
                    city?: string | null
                    country?: string | null
                    created_at?: string | null
                    id?: number
                    phone?: string | null
                    source?: string | null
                    state?: string | null
                    status?: string | null
                    street?: string | null
                    title?: string | null
                    url?: string | null
                }
                Relationships: []
            }
            automations: {
                Row: {
                    description: string | null
                    id: number
                    last_run: string | null
                    leads_touched: number | null
                    name: string | null
                    status: string | null
                }
                Insert: {
                    description?: string | null
                    id?: number
                    last_run?: string | null
                    leads_touched?: number | null
                    name?: string | null
                    status?: string | null
                }
                Update: {
                    description?: string | null
                    id?: number
                    last_run?: string | null
                    leads_touched?: number | null
                    name?: string | null
                    status?: string | null
                }
                Relationships: []
            }
            leads: {
                Row: {
                    budget: string | null
                    business: string | null
                    chat_id: string | null
                    city: string | null
                    created_at: string | null
                    id: number
                    name: string | null
                    notes: string | null
                    phone: string | null
                    score: number | null
                    service: string | null
                    source: string | null
                    stage: string | null
                    temperature: string | null
                    updated_at: string | null
                }
                Insert: {
                    budget?: string | null
                    business?: string | null
                    chat_id?: string | null
                    city?: string | null
                    created_at?: string | null
                    id?: number
                    name?: string | null
                    notes?: string | null
                    phone?: string | null
                    score?: number | null
                    service?: string | null
                    source?: string | null
                    stage?: string | null
                    temperature?: string | null
                    updated_at?: string | null
                }
                Update: {
                    budget?: string | null
                    business?: string | null
                    chat_id?: string | null
                    city?: string | null
                    created_at?: string | null
                    id?: number
                    name?: string | null
                    notes?: string | null
                    phone?: string | null
                    score?: number | null
                    service?: string | null
                    source?: string | null
                    stage?: string | null
                    temperature?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "leads_chat_id_fkey"
                        columns: ["chat_id"]
                        isOneToOne: false
                        referencedRelation: "waha"
                        referencedColumns: ["chatID"]
                    },
                ]
            }
            messages: {
                Row: {
                    chat_id: string | null
                    from_me: boolean | null
                    id: number
                    is_ai_generated: boolean | null
                    text: string | null
                    timestamp: number | null
                }
                Insert: {
                    chat_id?: string | null
                    from_me?: boolean | null
                    id?: number
                    is_ai_generated?: boolean | null
                    text?: string | null
                    timestamp?: number | null
                }
                Update: {
                    chat_id?: string | null
                    from_me?: boolean | null
                    id?: number
                    is_ai_generated?: boolean | null
                    text?: string | null
                    timestamp?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_chat_id_fkey"
                        columns: ["chat_id"]
                        isOneToOne: false
                        referencedRelation: "waha"
                        referencedColumns: ["chatID"]
                    },
                ]
            }
            waha: {
                Row: {
                    chatID: string | null
                    id: number
                    last_from_me: boolean | null
                    last_text: string | null
                    last_timestamp: number | null
                    push_name: string | null
                    session: string | null
                    status: string | null
                    unreadCount: number | null
                }
                Insert: {
                    chatID?: string | null
                    id?: number
                    last_from_me?: boolean | null
                    last_text?: string | null
                    last_timestamp?: number | null
                    push_name?: string | null
                    session?: string | null
                    status?: string | null
                    unreadCount?: number | null
                }
                Update: {
                    chatID?: string | null
                    id?: number
                    last_from_me?: boolean | null
                    last_text?: string | null
                    last_timestamp?: number | null
                    push_name?: string | null
                    session?: string | null
                    status?: string | null
                    unreadCount?: number | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
