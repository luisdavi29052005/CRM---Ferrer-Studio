const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });
const BlastService = require('./blastService');
const AIHandler = require('./aiHandler');

// Helper function to download and upload media to Supabase Storage
async function uploadMediaToSupabase(supabase, mediaUrl, mimetype, messageId, chatJid) {
    try {
        // Download the file from WAHA local URL
        const response = await fetch(mediaUrl);
        if (!response.ok) {
            throw new Error(`Failed to download media: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);

        // Determine file extension from mimetype
        const extensionMap = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'video/mp4': 'mp4',
            'audio/ogg': 'ogg',
            'audio/mpeg': 'mp3',
            'application/pdf': 'pdf',
        };
        const extension = extensionMap[mimetype] || 'bin';

        // Create a unique filename: chatJid/messageId.extension
        const cleanChatJid = chatJid.replace('@c.us', '').replace('@s.whatsapp.net', '');
        const filename = `${cleanChatJid}/${messageId}.${extension}`;

        // Upload to Supabase Storage (bucket: 'whatsapp-media')
        const { data, error } = await supabase.storage
            .from('whatsapp-media')
            .upload(filename, uint8Array, {
                contentType: mimetype,
                upsert: true
            });

        if (error) {
            console.error('Error uploading to Supabase Storage:', error);
            return null;
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
            .from('whatsapp-media')
            .getPublicUrl(filename);

        console.log('Media uploaded successfully:', urlData.publicUrl);
        return urlData.publicUrl;
    } catch (err) {
        console.error('Error in uploadMediaToSupabase:', err);
        return null;
    }
}

const app = express();
const port = process.env.PORT || 3001;

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const blastService = new BlastService(supabase);
const aiHandler = new AIHandler(supabase);

app.use(cors());
app.use(express.json());

// --- Smart Typing & Buffering Logic ---
const messageBuffers = new Map(); // chatJid -> { messages: [], timer: null }
const lidToPhoneMap = new Map();  // lid -> phoneJid

const BUFFER_DELAY = 15000; // 15 seconds max wait (safety valve)
const SILENCE_DELAY = 3500; // 3.5 seconds of silence -> send

function resolveJidFromPayload(payload) {
    let chatJid;
    if (payload.from) {
        chatJid = payload.fromMe ? payload.to : payload.from;
    } else {
        chatJid = payload.id;
    }

    if (!chatJid) return '';

    let effectiveJid = chatJid;

    // Resolve LID to Phone JID
    if (effectiveJid.includes('@lid')) {
        // 1. Try SenderAlt
        if (payload._data?.Info?.SenderAlt?.includes('@s.whatsapp.net')) {
            const altJid = payload._data.Info.SenderAlt;
            const userPart = altJid.split('@')[0].split(':')[0];
            effectiveJid = `${userPart}@s.whatsapp.net`;
        }
        // 2. Try Cache
        else if (lidToPhoneMap.has(chatJid)) {
            effectiveJid = lidToPhoneMap.get(chatJid);
        }
    }

    // Update Cache if we resolved it and it's different
    if (effectiveJid !== chatJid) {
        lidToPhoneMap.set(chatJid, effectiveJid);
    }

    // Verify and Force Standardization: @c.us -> @s.whatsapp.net
    if (effectiveJid.endsWith('@c.us') && !effectiveJid.includes(':')) {
        effectiveJid = effectiveJid.replace('@c.us', '@s.whatsapp.net');
    }

    return effectiveJid;
}

// Function to flush buffer
async function flushBuffer(chatJid) {
    const buffer = messageBuffers.get(chatJid);
    if (!buffer || buffer.messages.length === 0) return;

    const combinedText = buffer.messages.join('\n');
    let finalName = buffer.finalName;

    if (!finalName) {
        const { data: chat } = await supabase.from('whatsapp_waha_chats').select('name').eq('chat_jid', chatJid).maybeSingle();
        finalName = chat?.name || 'Unknown';
    }
    console.log(`[Smart Buffer] Flushing ${buffer.messages.length} messages for ${chatJid}`);

    // Clear buffer reference BEFORE processing to avoid race conditions
    messageBuffers.delete(chatJid);

    try {
        await aiHandler.processMessage(chatJid, combinedText, finalName, null);
    } catch (err) {
        console.error('Error in AI Handler (Buffered):', err);
    }
}
// --------------------------------------

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
            const effectiveJid = resolveJidFromPayload(payload);

            let { data: existingChat } = await supabase
                .from('whatsapp_waha_chats')
                .select('id, name')
                .eq('chat_jid', effectiveJid)
                .single();

            // Extract contact name (pushName) if available
            const contactName = payload.pushName || payload.notifyName || payload._data?.notifyName || payload._data?.Info?.PushName || 'Unknown';

            const chatUpdateData = {
                chat_jid: effectiveJid,
                last_message: payload.body,
                last_message_at: new Date(payload.timestamp * 1000).toISOString(),
                last_message_from_me: isFromMe,
                updated_at: new Date().toISOString()
            };

            // Name Logic:
            // 1. Check if this number exists in Apify leads to get the business name
            // 2. If not, use pushName/notifyName
            // 3. If not, use phone number

            let finalName = existingChat?.name; // Default to existing name

            // Try to find in Apify first (Highest Priority for Business Name)
            // Handle LID (Linked Device ID) -> Resolve to Phone Number


            const cleanPhone = effectiveJid.replace(/\D/g, '');
            const { data: apifyLead } = await supabase
                .from('apify')
                .select('title')
                .eq('phone', cleanPhone) // Assuming apify stores raw numbers or we need to match format
                .maybeSingle(); // Use maybeSingle to avoid errors

            // Also check 'leads' table? User specifically asked for Apify imports.

            if (apifyLead && apifyLead.title) {
                finalName = apifyLead.title;
            } else if (contactName !== 'Unknown') {
                // Only update to contactName if we don't have an existing name OR if we want to update it?
                // Usually we prefer the name we saved (Apify).
                // So if we have an existing name, we might want to keep it unless it was just a number.
                if (!existingChat || existingChat.name === effectiveJid.replace('@c.us', '')) {
                    finalName = contactName;
                }
            } else if (!existingChat) {
                finalName = effectiveJid.replace('@c.us', '');
            }

            if (finalName) {
                chatUpdateData.name = finalName;
            }

            // Upsert Chat to get ID
            const { data: upsertedChat, error: chatError } = await supabase
                .from('whatsapp_waha_chats')
                .upsert(chatUpdateData, { onConflict: 'chat_jid' })
                .select('id')
                .single();

            if (chatError) {
                console.error('Error upserting chat:', chatError);
            }

            const chatId = upsertedChat?.id;

            if (chatId) {
                // Handle media upload if message has media
                let mediaUrl = null;
                if (payload.hasMedia && payload.media?.url) {
                    console.log('Downloading and uploading media...');
                    mediaUrl = await uploadMediaToSupabase(
                        supabase,
                        payload.media.url,
                        payload.media.mimetype,
                        payload.id,
                        effectiveJid
                    );
                }

                const { error: messageError } = await supabase
                    .from('whatsapp_waha_messages')
                    .upsert({
                        chat_id: chatId,
                        message_id: payload.id,
                        session: data.session,
                        from_jid: payload.from,
                        from_me: isFromMe,
                        body: payload.body,
                        type: payload._data?.Info?.Type || 'text',
                        has_media: payload.hasMedia,
                        media_url: mediaUrl, // URL from Supabase Storage
                        media_mimetype: payload.media?.mimetype || null,
                        ack: payload.ack,
                        message_timestamp: new Date(payload.timestamp * 1000).toISOString(),
                        raw: data // Store the full raw webhook data
                    }, { onConflict: 'message_id' });

                if (messageError) {
                    console.error('Error inserting message:', messageError);
                } else {
                    console.log('Message inserted successfully');

                    // --- AI AGENT TRIGGER ---
                    // Trigger if message is NOT from me and has text OR media
                    if (!isFromMe && (payload.body || payload.hasMedia)) {
                        // MEDIA HANDLING: Flush buffer & Process immediately
                        if (payload.hasMedia) {
                            // Merge with buffer if exists (Context Continuity)
                            let combinedBody = payload.body || '[Enviou uma imagem]';
                            const buffer = messageBuffers.get(effectiveJid);

                            if (buffer && buffer.messages.length > 0) {
                                console.log(`[Smart Buffer] Merging ${buffer.messages.length} text messages with Media.`);
                                const bufferedText = buffer.messages.join('\n');
                                combinedBody = `${bufferedText}\n${combinedBody}`;

                                // Clear buffer
                                if (buffer.timer) clearTimeout(buffer.timer);
                                messageBuffers.delete(effectiveJid);
                            }

                            const mediaInfo = {
                                url: mediaUrl || payload.media.url,
                                mimetype: payload.media.mimetype
                            };
                            // Process immediately (Vision + Text)
                            aiHandler.processMessage(effectiveJid, combinedBody, finalName, mediaInfo).catch(err => {
                                console.error('Error in AI Handler (Media):', err);
                            });
                        }
                        // TEXT HANDLING: Buffer it
                        else if (payload.body) {
                            let buffer = messageBuffers.get(effectiveJid);
                            if (!buffer) {
                                buffer = { messages: [], timer: null, finalName: finalName }; // Added finalName
                                messageBuffers.set(effectiveJid, buffer);
                            } else {
                                buffer.finalName = finalName; // Update finalName
                            }

                            buffer.messages.push(payload.body);
                            console.log(`[Smart Buffer] Buffered message for ${effectiveJid}. Count: ${buffer.messages.length}`);

                            // Reset Timer (Wait for silence)
                            if (buffer.timer) clearTimeout(buffer.timer);
                            buffer.timer = setTimeout(() => {
                                console.log(`[Smart Buffer] Silence timer fired for ${effectiveJid}`);
                                flushBuffer(effectiveJid, finalName, aiHandler);
                            }, SILENCE_DELAY);

                            // Safety valve (in case they type forever or silence logic fails)
                            setTimeout(() => {
                                const b = messageBuffers.get(effectiveJid);
                                if (b && b.messages.length > 5) {
                                    console.log(`[Smart Buffer] Safety valve fired for ${effectiveJid}`);
                                    flushBuffer(effectiveJid, finalName, aiHandler);
                                }
                            }, BUFFER_DELAY);
                        }
                    }
                    // ------------------------
                }
            } else {
                console.error('Could not determine chat ID for message insertion');
            }
        } else if (data.event === 'presence.update') {
            const payload = data.payload;
            const effectiveJid = resolveJidFromPayload(payload);
            const buffer = messageBuffers.get(effectiveJid);

            if (buffer) {
                // Check presences array
                const presences = payload.presences || [];
                const isTyping = presences.some(p => p.lastKnownPresence === 'composing' || p.lastKnownPresence === 'typing');
                const isPaused = presences.some(p => p.lastKnownPresence === 'paused');

                if (isTyping) {
                    // User is typing -> Clear timer (WAIT)
                    if (buffer.timer) {
                        clearTimeout(buffer.timer);
                        buffer.timer = null;
                        console.log(`[Smart Buffer] User typing on ${effectiveJid}, holding response.`);
                    }
                } else if (isPaused) {
                    // User stopped typing -> Send sooner (1s delay) if not already scheduled
                    if (!buffer.timer) {
                        console.log(`[Smart Buffer] User paused on ${effectiveJid}, responding soon.`);
                        buffer.timer = setTimeout(() => {
                            console.log(`[Smart Buffer] Paused timer fired for ${effectiveJid}`);
                            flushBuffer(effectiveJid, buffer.finalName, aiHandler);
                        }, 1000);
                    }
                }
            }
        } else if (data.event === 'message.ack') {
            const payload = data.payload;
            const messageId = payload.id;
            const status = payload.ack; // 1=sent, 2=delivered, 3=read/played

            if (messageId && status) {
                console.log(`[ACK] Updating message ${messageId} to status ${status} (${payload.ackName})`);
                const { error } = await supabase
                    .from('whatsapp_waha_messages')
                    .update({ ack: status })
                    .eq('message_id', messageId);

                if (error) {
                    console.error('[ACK] Error updating message status:', error);
                }
            }
        }
    } catch (err) {
        console.error('Error processing webhook:', err);
    }

    res.status(200).send('OK');
});

app.post('/api/webhooks/paypal', async (req, res) => {
    const webhookData = req.body;
    console.log('-----------------------------------');
    console.log('PayPal Webhook Received:');
    console.log(JSON.stringify(webhookData, null, 2));
    console.log('-----------------------------------');

    try {
        const eventType = webhookData.event_type;

        switch (eventType) {
            // --- PAYMENTS ---
            case 'PAYMENT.CAPTURE.COMPLETED':
            case 'PAYMENT.SALE.COMPLETED':
                console.log('✅ Payment Successful:', eventType);
                // TODO: Grant access / Update order status
                break;

            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.SALE.DENIED':
            case 'PAYMENT.CAPTURE.DECLINED':
                console.log('❌ Payment Denied/Declined:', eventType);
                // TODO: Notify user / Update order status
                break;

            case 'PAYMENT.CAPTURE.REFUNDED':
            case 'PAYMENT.SALE.REFUNDED':
                console.log('💸 Payment Refunded:', eventType);
                // TODO: Revoke access / Update order status
                break;

            // --- SUBSCRIPTIONS ---
            case 'BILLING.SUBSCRIPTION.CREATED':
                console.log('📝 Subscription Created');
                break;

            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                console.log('✅ Subscription Activated');
                // TODO: Grant subscription access
                break;

            case 'BILLING.SUBSCRIPTION.CANCELLED':
                console.log('🚫 Subscription Cancelled');
                // TODO: Schedule access revocation at end of period
                break;

            case 'BILLING.SUBSCRIPTION.EXPIRED':
                console.log('⏰ Subscription Expired');
                // TODO: Revoke access immediately
                break;

            case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
                console.log('❌ Subscription Payment Failed');
                // TODO: Notify user / Grace period logic
                break;

            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                console.log('⏸️ Subscription Suspended');
                // TODO: Revoke access
                break;

            // --- DISPUTES ---
            case 'CUSTOMER.DISPUTE.CREATED':
                console.log('⚠️ Dispute Created');
                // TODO: Alert admin / Freeze account
                break;

            case 'CUSTOMER.DISPUTE.RESOLVED':
                console.log('⚖️ Dispute Resolved');
                break;

            default:
                console.log('ℹ️ Unhandled Webhook Event:', eventType);
        }

        res.status(200).send('Webhook received');
    } catch (error) {
        console.error('Error processing PayPal webhook:', error);
        res.status(500).send('Error processing webhook');
    }
});

app.get('/api/contacts/profile-picture', async (req, res) => {
    const { contactId, session = 'default' } = req.query;

    if (!contactId) {
        return res.status(400).json({ error: 'Missing contactId' });
    }

    try {
        // Fetch WAHA URL from system_settings
        const { data: settings } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'waha_api_url')
            .single();

        const wahaApiUrl = settings?.value;
        if (!wahaApiUrl) {
            return res.status(500).json({ error: 'WAHA API URL not configured in System Settings' });
        }
        const wahaUrl = `${wahaApiUrl}/contacts/profile-picture?contactId=${encodeURIComponent(contactId)}&session=${session}`;

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



app.get('/api/chats/id', async (req, res) => {
    const { chatJid } = req.query;
    if (!chatJid) return res.status(400).json({ error: 'Missing chatJid' });

    try {
        const { data, error } = await supabase
            .from('whatsapp_waha_chats')
            .select('id')
            .eq('chat_jid', chatJid)
            .maybeSingle();

        if (error) throw error;
        res.json(data || { id: null });
    } catch (error) {
        console.error('Error fetching chat ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const { ApifyClient } = require('apify-client');

// --- APIFY SCRAPE ENDPOINT ---
app.post('/api/apify/scrape', async (req, res) => {
    const {
        searchTerms,
        location,
        maxResults,
        language = 'en',
        skipClosedPlaces = false,
        scrapeContacts = false,
        scrapePlaceDetailPage = false,
        includeWebResults = false,
        maxReviews = 0
    } = req.body;

    if (!searchTerms || !Array.isArray(searchTerms) || searchTerms.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid searchTerms' });
    }

    try {
        // 1. Fetch Apify Token from System Settings
        const { data: settings, error: settingsError } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'apify_api_token')
            .single();

        if (settingsError || !settings?.value) {
            console.error('Apify Token not found in system_settings');
            return res.status(500).json({ error: 'Apify API Token not configured' });
        }

        const apifyToken = settings.value;
        const client = new ApifyClient({ token: apifyToken });

        // Sanitize language code (defensive programming for stale frontend state)
        let finalLanguage = language;
        if (finalLanguage === 'pt') {
            finalLanguage = 'pt-BR';
        }

        // 2. Prepare Actor Input
        const input = {
            searchStringsArray: searchTerms,
            locationQuery: location || 'New York, USA',
            maxCrawledPlacesPerSearch: maxResults || 50,
            language: finalLanguage,
            searchMatching: "all",
            website: "allPlaces",
            skipClosedPlaces: skipClosedPlaces,
            scrapePlaceDetailPage: scrapePlaceDetailPage,
            includeWebResults: includeWebResults,
            maxQuestions: 0,
            scrapeContacts: scrapeContacts,
            maximumLeadsEnrichmentRecords: 0,
            maxReviews: maxReviews,
            reviewsSort: "newest",
            reviewsOrigin: "all",
        };

        console.log('Starting Apify Scrape with input:', input);

        // 3. Run Actor
        const run = await client.actor("nwua9Gu5YrADL7ZDj").call(input);
        console.log('Apify Run Finished:', run.id);

        // 4. Fetch Results
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`Fetched ${items.length} items from Apify dataset.`);

        // 5. Process Results (Validate & Save)
        let addedCount = 0;
        let skippedCount = 0;
        let invalidCount = 0;

        // Process in parallel chunks to speed up validation
        const CHUNK_SIZE = 5;
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
            const chunk = items.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (place) => {
                if (!place.phone) {
                    skippedCount++;
                    return;
                }

                const cleanPhone = place.phone.replace(/\D/g, '');
                if (!cleanPhone) {
                    skippedCount++;
                    return;
                }

                // Insert into Supabase directly (Skip WAHA validation for now to ensure data appears)
                const { error: insertError } = await supabase
                    .from('apify')
                    .insert([{
                        title: place.title,
                        phone: cleanPhone, // Store clean phone
                        city: place.city,
                        state: place.state,
                        category: place.categoryName,
                        url: place.url,
                        source: 'apify_scraper',
                        status: 'not sent' // Default status
                    }]);

                if (!insertError) {
                    addedCount++;
                } else {
                    console.error('Error inserting lead:', insertError);
                    // Check if duplicate error, treat as skipped
                    if (insertError.code === '23505') { // Unique violation
                        skippedCount++;
                    }
                }
            }));
        }

        res.json({
            success: true,
            totalFound: items.length,
            added: addedCount,
            skipped: skippedCount,
            invalid: invalidCount
        });

    } catch (error) {
        console.error('Error in /api/apify/scrape:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- BLAST ENDPOINTS ---

app.post('/api/blast/start', async (req, res) => {
    const { runId, config } = req.body;
    if (!runId || !config) {
        return res.status(400).json({ error: 'Missing runId or config' });
    }
    try {
        await blastService.startBlast(runId, config);
        res.json({ message: 'Blast started', runId });
    } catch (error) {
        console.error('Error starting blast:', error);
        res.status(500).json({ error: 'Failed to start blast' });
    }
});

app.post('/api/blast/stop', async (req, res) => {
    const { runId } = req.body;
    if (!runId) {
        return res.status(400).json({ error: 'Missing runId' });
    }
    try {
        await blastService.stopBlast(runId);
        res.json({ message: 'Blast stopping...' });
    } catch (error) {
        console.error('Error stopping blast:', error);
        res.status(500).json({ error: 'Failed to stop blast' });
    }
});

app.post('/api/test', (req, res) => {
    console.log('Test endpoint hit', req.body);
    res.json({ message: 'Server is working' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
