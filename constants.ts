import { ApifyLead, AutomationFlow, Lead, Message, WahaChat } from "./types";

export const MOCK_APIFY_LEADS: ApifyLead[] = [
  { id: '1', title: 'Padaria Saborosa', phone: '5511999991111', city: 'São Paulo', state: 'SP', category: 'Bakery', source: 'apify', created_at: '2023-10-25', status: 'not sent' },
  { id: '2', title: 'Tech Solutions Ltda', phone: '5511999992222', city: 'Barueri', state: 'SP', category: 'IT Services', source: 'apify', created_at: '2023-10-26', status: 'sent' },
  { id: '3', title: 'Dr. Silva Odonto', phone: '5511999993333', city: 'Osasco', state: 'SP', category: 'Dentist', source: 'apify', created_at: '2023-10-27', status: 'not sent' },
  { id: '4', title: 'Mega Fitness Gym', phone: '5521988884444', city: 'Rio de Janeiro', state: 'RJ', category: 'Gym', source: 'apify', created_at: '2023-10-27', status: 'error' },
  { id: '5', title: 'Advocacia Souza', phone: '5531977775555', city: 'Belo Horizonte', state: 'MG', category: 'Lawyer', source: 'apify', created_at: '2023-10-28', status: 'not sent' },
];

export const MOCK_LEADS: Lead[] = [
  { id: '101', chat_id: '5511999992222@c.us', name: 'Roberto Tech', business: 'Tech Solutions Ltda', phone: '+55 11 99999-2222', city: 'Barueri', stage: 'In Negotiation', temperature: 'Hot', score: 85, budget: 5000, notes: 'Interested in the premium automation package.', source: 'apify', last_interaction: '2h ago' },
  { id: '102', chat_id: '5511988887777@c.us', name: 'Ana Fitness', business: 'Crossfit Alpha', phone: '+55 11 98888-7777', city: 'São Paulo', stage: 'Contacted', temperature: 'Warm', score: 60, budget: 2500, notes: 'Asked about pricing models.', source: 'manual', last_interaction: '1d ago' },
  { id: '103', chat_id: '5541966665555@c.us', name: 'Carlos Pizza', business: 'Bella Pizza', phone: '+55 41 96666-5555', city: 'Curitiba', stage: 'New', temperature: 'Cold', score: 20, budget: 0, notes: 'Just imported.', source: 'apify', last_interaction: 'Never' },
  { id: '104', chat_id: '5551944443333@c.us', name: 'Julia Marketing', business: 'Growth Agency', phone: '+55 51 94444-3333', city: 'Porto Alegre', stage: 'Won', temperature: 'Hot', score: 100, budget: 12000, notes: 'Closed annual contract.', source: 'referral', last_interaction: '3d ago' },
];

export const MOCK_WAHA_CHATS: WahaChat[] = [
  { id: 'w1', chatID: '5511999992222@c.us', push_name: 'Roberto Tech', last_text: 'That sounds great, send me the proposal.', last_from_me: false, last_timestamp: 1698432000000, status: 'received', unreadCount: 1 },
  { id: 'w2', chatID: '5511988887777@c.us', push_name: 'Ana Fitness', last_text: 'Here is the pricing list regarding the automation.', last_from_me: true, last_timestamp: 1698345600000, status: 'sent', unreadCount: 0 },
  { id: 'w3', chatID: '5541966665555@c.us', push_name: 'Bella Pizza', last_text: 'Hello! I saw your bakery on Google...', last_from_me: true, last_timestamp: 1698259200000, status: 'sent', unreadCount: 0 },
  { id: 'w4', chatID: '5551944443333@c.us', push_name: 'Julia Marketing', last_text: 'Thanks for the partnership!', last_from_me: false, last_timestamp: 1698172800000, status: 'received', unreadCount: 0 },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  '5511999992222@c.us': [
    { id: 'm1', text: 'Hello Roberto, I saw Tech Solutions is growing fast.', fromMe: true, timestamp: 1698420000000, isAiGenerated: true },
    { id: 'm2', text: 'Yes, we are looking for new tools.', fromMe: false, timestamp: 1698420500000 },
    { id: 'm3', text: 'Our system can automate 80% of your outbound.', fromMe: true, timestamp: 1698421000000, isAiGenerated: true },
    { id: 'm4', text: 'That sounds great, send me the proposal.', fromMe: false, timestamp: 1698432000000 },
  ],
  '5511988887777@c.us': [
    { id: 'm5', text: 'Hi Ana, how much for the chatbot?', fromMe: false, timestamp: 1698340000000 },
    { id: 'm6', text: 'Here is the pricing list regarding the automation.', fromMe: true, timestamp: 1698345600000, isAiGenerated: true },
  ]
};

export const MOCK_AUTOMATIONS: AutomationFlow[] = [
  { id: 'a1', name: 'Initial Outreach', description: 'Sends template message to new Apify leads', status: 'Active', lastRun: '10m ago', leadsTouched: 124 },
  { id: 'a2', name: 'Qualification AI', description: 'Process inbound responses with Gemini', status: 'Active', lastRun: '2m ago', leadsTouched: 45 },
  { id: 'a3', name: 'Follow-up 1', description: 'Checks for no-reply after 24h', status: 'Paused', lastRun: '1d ago', leadsTouched: 0 },
  { id: 'a4', name: 'Sync CRM', description: 'Updates Supabase from Waha events', status: 'Error', lastRun: '5m ago', leadsTouched: 12 },
];