
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    console.log(`Loading .env from ${envPath}`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; // Need service role for deletion if RLS is strict, but usually anon works if policy allows

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deduplicateChats() {
    console.log('Starting chat deduplication...');

    // 1. Fetch all chats
    const { data: chats, error } = await supabase
        .from('whatsapp_waha_chats')
        .select('*');

    if (error) {
        console.error('Error fetching chats:', error);
        return;
    }

    console.log(`Fetched ${chats.length} chats.`);

    // 2. Group by normalized ID (phone number)
    const groups = {};
    for (const chat of chats) {
        // Assume format is like 5518998232124@c.us or @s.whatsapp.net
        // Extract raw number
        const jid = chat.chat_jid;
        if (!jid) continue;

        // Remove known suffixes to get the base number
        const base = jid.replace('@c.us', '').replace('@s.whatsapp.net', '').replace(/:.*$/, ''); // handle :DeviceID if present

        if (!groups[base]) groups[base] = [];
        groups[base].push(chat);
    }

    let mergedCount = 0;

    // 3. Process groups > 1
    for (const baseId in groups) {
        const group = groups[baseId];
        if (group.length < 2) continue;

        console.log(`Duplicate found for ${baseId}: ${group.length} records`);

        // Determine Survivor
        // Preference: @s.whatsapp.net > @c.us
        let survivor = group.find(c => c.chat_jid.includes('@s.whatsapp.net'));
        if (!survivor) {
            // Fallback: Pick the one with the most recent message or update
            survivor = group.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
        }

        const duplicates = group.filter(c => c.id !== survivor.id);

        for (const dupe of duplicates) {
            console.log(`-- Merging ${dupe.chat_jid} (ID: ${dupe.id}) INTO ${survivor.chat_jid} (ID: ${survivor.id})`);

            // A. Move Leads
            const { error: leadError } = await supabase
                .from('leads')
                .update({ chat_id: survivor.chat_jid }) // Reference by JID string
                .eq('chat_id', dupe.chat_jid);

            if (leadError) console.error(`Failed to move leads for ${dupe.chat_jid}:`, leadError);
            else console.log(`   Leads moved.`);

            // B. Move Messages
            const { error: msgError } = await supabase
                .from('whatsapp_waha_messages')
                .update({ chat_id: survivor.id }) // Reference by ID int
                .eq('chat_id', dupe.id);

            if (msgError) console.error(`Failed to move messages for ${dupe.id}:`, msgError);
            else console.log(`   Messages moved.`);

            // C. Delete Duplicate Chat
            const { error: delError } = await supabase
                .from('whatsapp_waha_chats')
                .delete()
                .eq('id', dupe.id);

            if (delError) console.error(`Failed to delete duplicated chat ${dupe.id}:`, delError);
            else {
                console.log(`   Duplicate chat deleted.`);
                mergedCount++;
            }
        }
    }

    console.log('--------------------------------------------------');
    console.log(`Deduplication complete. Merged/Deleted ${mergedCount} duplicate chats.`);
}

deduplicateChats();
