
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try to load .env from root
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    console.log(`Loading .env from ${envPath}`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyDuplicates() {
    console.log('Fetching chats from Supabase...');

    // Fetch all chats
    const { data: chats, error } = await supabase
        .from('whatsapp_waha_chats')
        .select('id, chat_jid, name, phone');

    if (error) {
        console.error('Error fetching chats:', error);
        return;
    }

    console.log(`Total chats found: ${chats.length}`);

    // Group by phone/jid to find duplicates
    const map = new Map();
    const duplicates = [];

    for (const chat of chats) {
        // Normalize JID if needed, but strict duplicate check usually implies same JID
        const jid = chat.chat_jid;
        if (map.has(jid)) {
            duplicates.push({
                jid,
                original: map.get(jid),
                duplicate: chat
            });
        } else {
            map.set(jid, chat);
        }
    }

    if (duplicates.length > 0) {
        console.log('⚠️ DUPLICATES FOUND IN DATABASE:');
        duplicates.forEach(d => {
            console.log(`- JID: ${d.jid}`);
            console.log(`  Origin: ID=${d.original.id}, Name=${d.original.name}`);
            console.log(`  Dupe:   ID=${d.duplicate.id}, Name=${d.duplicate.name}`);
        });
    } else {
        console.log('✅ No exact JID duplicates found in database.');
    }

    // Check roughly by phone number just in case
    console.log('Checking for fuzzy phone duplicates...');
    const phoneMap = new Map();
    const phoneDupes = [];

    for (const chat of chats) {
        // Extract number from JID or phone
        const num = chat.phone || chat.chat_jid.replace(/\D/g, '');
        if (!num) continue;

        if (phoneMap.has(num)) {
            phoneDupes.push({
                num,
                first: phoneMap.get(num),
                second: chat
            });
        } else {
            phoneMap.set(num, chat);
        }
    }

    if (phoneDupes.length > 0) {
        console.log('⚠️ POTENTIAL PHONE DUPLICATES (Same number, different JID?):');
        phoneDupes.forEach(d => {
            if (d.first.chat_jid !== d.second.chat_jid) {
                console.log(`- Phone: ${d.num}`);
                console.log(`  1: JID=${d.first.chat_jid}, Name=${d.first.name}`);
                console.log(`  2: JID=${d.second.chat_jid}, Name=${d.second.name}`);
            }
        });
        console.log('(Note: If JIDs differ e.g. @c.us vs @s.whatsapp.net, this explains why you might see "duplicates" if logic merges them poorly, but they are distinct DB entries.)');
    } else {
        console.log('✅ No phone duplicates found.');
    }
}

verifyDuplicates();
