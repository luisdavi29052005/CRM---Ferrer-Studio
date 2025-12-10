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
                    user_id: string | null
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
                    user_id?: string | null
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
                    user_id?: string | null
                }
                Relationships: []
            }
            blast_logs: {
                Row: {
                    blast_run_id: string | null
                    created_at: string
                    error_message: string | null
                    id: string
                    lead_id: number | null
                    lead_phone: string | null
                    status: string | null
                }
                Insert: {
                    blast_run_id?: string | null
                    created_at?: string
                    error_message?: string | null
                    id?: string
                    lead_id?: number | null
                    lead_phone?: string | null
                    status?: string | null
                }
                Update: {
                    blast_run_id?: string | null
                    created_at?: string
                    error_message?: string | null
                    id?: string
                    lead_id?: number | null
                    lead_phone?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "blast_logs_blast_run_id_fkey"
                        columns: ["blast_run_id"]
                        isOneToOne: false
                        referencedRelation: "blast_runs"
                        referencedColumns: ["id"]
                    }
                ]
            }
            blast_runs: {
                Row: {
                    batch_size: number | null
                    created_at: string
                    failed_count: number | null
                    filters: Json | null
                    id: string
                    interval_seconds: number | null
                    message_template: string | null
                    status: string | null
                    success_count: number | null
                    total_leads: number | null
                }
                Insert: {
                    batch_size?: number | null
                    created_at?: string
                    failed_count?: number | null
                    filters?: Json | null
                    id?: string
                    interval_seconds?: number | null
                    message_template?: string | null
                    status?: string | null
                    success_count?: number | null
                    total_leads?: number | null
                }
                Update: {
                    batch_size?: number | null
                    created_at?: string
                    failed_count?: number | null
                    filters?: Json | null
                    id?: string
                    interval_seconds?: number | null
                    message_template?: string | null
                    status?: string | null
                    success_count?: number | null
                    total_leads?: number | null
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
                    user_id: string | null
                }
                Insert: {
                    description?: string | null
                    id?: number
                    last_run?: string | null
                    leads_touched?: number | null
                    name?: string | null
                    status?: string | null
                    user_id?: string | null
                }
                Update: {
                    description?: string | null
                    id?: number
                    last_run?: string | null
                    leads_touched?: number | null
                    name?: string | null
                    status?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            chats: {
                Row: {
                    contact_name: string | null
                    created_at: string | null
                    id: number
                    last_message: string | null
                    last_message_time: string | null
                    phone_number: string | null
                    status: string | null
                    unread_count: number | null
                    user_id: string | null
                }
                Insert: {
                    contact_name?: string | null
                    created_at?: string | null
                    id?: number
                    last_message?: string | null
                    last_message_time?: string | null
                    phone_number?: string | null
                    status?: string | null
                    unread_count?: number | null
                    user_id?: string | null
                }
                Update: {
                    contact_name?: string | null
                    created_at?: string | null
                    id?: number
                    last_message?: string | null
                    last_message_time?: string | null
                    phone_number?: string | null
                    status?: string | null
                    unread_count?: number | null
                    user_id?: string | null
                }
                Relationships: []
            }
            leads: {
                Row: {
                    id: number
                    chat_id: string | null
                    name: string
                    business: string | null
                    company_name: string | null
                    phone: string | null
                    city: string | null
                    state: string | null
                    category: string | null
                    stage: string | null
                    temperature: string | null
                    score: number | null
                    budget: number | null
                    notes: string | null
                    source: string | null
                    email: string | null
                    last_contact: string | null
                    next_action: string | null
                    next_action_date: string | null
                    tags: string[] | null
                    user_id: string | null
                    created_at: string | null
                    updated_at: string | null
                    service: string | null
                    status: string | null
                }
                Insert: {
                    id?: number
                    chat_id?: string | null
                    name: string
                    business?: string | null
                    company_name?: string | null
                    phone?: string | null
                    city?: string | null
                    state?: string | null
                    category?: string | null
                    stage?: string | null
                    temperature?: string | null
                    score?: number | null
                    budget?: number | null
                    notes?: string | null
                    source?: string | null
                    email?: string | null
                    last_contact?: string | null
                    next_action?: string | null
                    next_action_date?: string | null
                    tags?: string[] | null
                    user_id?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    service?: string | null
                    status?: string | null
                }
                Update: {
                    id?: number
                    chat_id?: string | null
                    name?: string
                    business?: string | null
                    company_name?: string | null
                    phone?: string | null
                    city?: string | null
                    state?: string | null
                    category?: string | null
                    stage?: string | null
                    temperature?: string | null
                    score?: number | null
                    budget?: number | null
                    notes?: string | null
                    source?: string | null
                    email?: string | null
                    last_contact?: string | null
                    next_action?: string | null
                    next_action_date?: string | null
                    tags?: string[] | null
                    user_id?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    service?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "leads_chat_id_fkey"
                        columns: ["chat_id"]
                        isOneToOne: false
                        referencedRelation: "whatsapp_waha_chats"
                        referencedColumns: ["chat_jid"]
                    }
                ]
            }
            messages: {
                Row: {
                    chat_id: number | null
                    content: string | null
                    created_at: string | null
                    id: number
                    sender: string | null
                    timestamp: string | null
                }
                Insert: {
                    chat_id?: number | null
                    content?: string | null
                    created_at?: string | null
                    id?: number
                    sender?: string | null
                    timestamp?: string | null
                }
                Update: {
                    chat_id?: number | null
                    content?: string | null
                    created_at?: string | null
                    id?: number
                    sender?: string | null
                    timestamp?: string | null
                }
                Relationships: []
            }
            whatsapp_waha_chats: {
                Row: {
                    chat_jid: string | null
                    created_at: string | null
                    id: number
                    is_group: boolean | null
                    last_message: string | null
                    last_message_at: string | null
                    last_message_from_me: boolean | null
                    name: string | null
                    phone: string | null
                    session: string | null
                    unread_count: number | null
                    updated_at: string | null
                }
                Insert: {
                    chat_jid?: string | null
                    created_at?: string | null
                    id?: number
                    is_group?: boolean | null
                    last_message?: string | null
                    last_message_at?: string | null
                    last_message_from_me?: boolean | null
                    name?: string | null
                    phone?: string | null
                    session?: string | null
                    unread_count?: number | null
                    updated_at?: string | null
                }
                Update: {
                    chat_jid?: string | null
                    created_at?: string | null
                    id?: number
                    is_group?: boolean | null
                    last_message?: string | null
                    last_message_at?: string | null
                    last_message_from_me?: boolean | null
                    name?: string | null
                    phone?: string | null
                    session?: string | null
                    unread_count?: number | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            templates: {
                Row: {
                    content: string
                    created_at: string
                    id: string
                    name: string
                }
                Insert: {
                    content: string
                    created_at?: string
                    id?: string
                    name: string
                }
                Update: {
                    content?: string
                    created_at?: string
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            whatsapp_waha_messages: {
                Row: {
                    ack: number | null
                    body: string | null
                    chat_id: number | null
                    created_at: string | null
                    from_jid: string | null
                    from_me: boolean | null
                    has_media: boolean | null
                    id: number
                    media_caption: string | null
                    media_mime_type: string | null
                    media_url: string | null
                    message_id: string | null
                    message_timestamp: string | null
                    raw: Json | null
                    session: string | null
                    type: string | null
                    is_ai_generated?: boolean | null
                    agent_name?: string | null
                }
                Insert: {
                    ack?: number | null
                    body?: string | null
                    chat_id?: number | null
                    created_at?: string | null
                    from_jid?: string | null
                    from_me?: boolean | null
                    has_media?: boolean | null
                    id?: number
                    media_caption?: string | null
                    media_mime_type?: string | null
                    media_url?: string | null
                    message_id?: string | null
                    message_timestamp?: string | null
                    raw?: Json | null
                    session?: string | null
                    type?: string | null
                    is_ai_generated?: boolean | null
                    agent_name?: string | null
                }
                Update: {
                    ack?: number | null
                    body?: string | null
                    chat_id?: number | null
                    created_at?: string | null
                    from_jid?: string | null
                    from_me?: boolean | null
                    has_media?: boolean | null
                    id?: number
                    media_caption?: string | null
                    media_mime_type?: string | null
                    media_url?: string | null
                    message_id?: string | null
                    message_timestamp?: string | null
                    raw?: Json | null
                    session?: string | null
                    type?: string | null
                    is_ai_generated?: boolean | null
                    agent_name?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "whatsapp_waha_messages_chat_id_fkey"
                        columns: ["chat_id"]
                        isOneToOne: false
                        referencedRelation: "whatsapp_waha_chats"
                        referencedColumns: ["id"]
                    }
                ]
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

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof Database["public"]["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
    ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
