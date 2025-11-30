const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 3001;

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

app.post('/webhook', async (req, res) => {
    const data = req.body;
    console.log('-----------------------------------');
    console.log('Webhook recebido:');
    console.log(JSON.stringify(data, null, 2));
    console.log('-----------------------------------');

    try {
        if (data.event === 'message') {
            const payload = data.payload;
            const me = data.me;

            // 1. Check if chat exists to preserve name
            const isFromMe = payload.fromMe;
            const chatJid = isFromMe ? payload.to : payload.from;

            let { data: existingChat } = await supabase
                .from('whatsapp_waha_chats')
                .select('id, name')
                .eq('chat_jid', chatJid)
                .single();

            // Extract contact name (pushName) if available
            const contactName = payload.pushName || payload.notifyName || payload._data?.notifyName || payload._data?.Info?.PushName || 'Unknown';

            const chatUpdateData = {
                chat_jid: chatJid,
                last_message: payload.body,
                last_message_at: new Date(payload.timestamp * 1000).toISOString(),
                last_message_from_me: isFromMe,
                updated_at: new Date().toISOString()
            };

            // Name Logic:
            // 1. If we have a valid new name, use it.
            // 2. If we don't have a valid name:
            //    a. If chat exists, KEEP existing name (don't overwrite with number).
            //    b. If chat is new, use phone number.
            if (contactName !== 'Unknown') {
                chatUpdateData.name = contactName;
            } else if (!existingChat) {
                chatUpdateData.name = chatJid.replace('@c.us', '');
            }
            // If existingChat && contactName === 'Unknown', we do NOT add 'name' to chatUpdateData, 
            // so the upsert will NOT modify the existing name column.

            const { data: upsertedChat, error: chatError } = await supabase
                .from('whatsapp_waha_chats')
                .upsert(chatUpdateData, { onConflict: 'chat_jid' })
                .select()
                .single();

            if (chatError) {
                console.error('Error upserting chat:', chatError);
            } else {
                // 2. Insert Message
                const chatId = upsertedChat ? upsertedChat.id : existingChat?.id;

                if (chatId) {
                    const { error: messageError } = await supabase
                        .from('whatsapp_waha_messages')
                        .insert({
                            chat_id: chatId,
                            message_id: payload.id,
                            session: data.session,
                            from_jid: payload.from,
                            from_me: isFromMe,
                            body: payload.body,
                            type: payload._data?.Info?.Type || 'text',
                            has_media: payload.hasMedia,
                            ack: payload.ack,
                            message_timestamp: new Date(payload.timestamp * 1000).toISOString(),
                            raw: data // Store the full raw webhook data
                        });

                    if (messageError) {
                        console.error('Error inserting message:', messageError);
                    } else {
                        console.log('Message inserted successfully');
                    }
                } else {
                    console.error('Could not determine chat ID for message insertion');
                }
            }
        }
    } catch (err) {
        console.error('Error processing webhook:', err);
    }

    res.status(200).send('OK');
});

app.get('/api/contacts/profile-picture', async (req, res) => {
    const { contactId, session = 'default' } = req.query;

    if (!contactId) {
        return res.status(400).json({ error: 'Missing contactId' });
    }

    try {
        const wahaUrl = `http://localhost:3000/api/contacts/${encodeURIComponent(contactId)}/profile-picture?session=${session}`;
        console.log(`Fetching profile picture from: ${wahaUrl}`);

        const response = await fetch(wahaUrl);

        if (!response.ok) {
            console.error(`Error fetching profile picture from WAHA: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ error: 'Failed to fetch from WAHA' });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error in /api/contacts/profile-picture:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/test', (req, res) => {
    console.log('Test endpoint hit', req.body);
    res.json({ message: 'Server is working' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
