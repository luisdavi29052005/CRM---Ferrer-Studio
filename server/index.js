const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });
const BlastService = require('./blastService');

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
            // 1. Check if this number exists in Apify leads to get the business name
            // 2. If not, use pushName/notifyName
            // 3. If not, use phone number

            let finalName = existingChat?.name; // Default to existing name

            // Try to find in Apify first (Highest Priority for Business Name)
            const cleanPhone = chatJid.replace(/\D/g, '');
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
                if (!existingChat || existingChat.name === chatJid.replace('@c.us', '')) {
                    finalName = contactName;
                }
            } else if (!existingChat) {
                finalName = chatJid.replace('@c.us', '');
            }

            if (finalName) {
                chatUpdateData.name = finalName;
            }

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
                        .upsert({
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
                        }, { onConflict: 'message_id' });

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
