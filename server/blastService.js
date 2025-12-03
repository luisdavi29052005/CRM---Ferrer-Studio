const { createClient } = require('@supabase/supabase-js');

class BlastService {
    constructor(supabase) {
        this.supabase = supabase;
        this.activeRuns = new Map(); // runId -> { status: 'running' | 'stopping', timeoutId: null }
    }

    async startBlast(runId, config) {
        console.log(`Starting blast run ${runId} with config:`, config);

        if (this.activeRuns.has(runId)) {
            console.log(`Blast run ${runId} is already active.`);
            return;
        }

        this.activeRuns.set(runId, { status: 'running', timeoutId: null });

        // Run the loop asynchronously so we don't block the request
        this.runBlastLoop(runId, config).catch(err => {
            console.error(`Error in blast run ${runId}:`, err);
            this.activeRuns.delete(runId);
            // Update run status to failed?
        });
    }

    async stopBlast(runId) {
        console.log(`Stopping blast run ${runId}`);
        const run = this.activeRuns.get(runId);
        if (run) {
            run.status = 'stopping';
            if (run.timeoutId) {
                clearTimeout(run.timeoutId);
                run.timeoutId = null;
            }
            // The loop will check status and exit
        }
    }

    async runBlastLoop(runId, config) {
        const {
            batchSize = 5,
            intervalSeconds = 60,
            messageTemplate,
            filters,
            strategy = 'new_only', // 'new_only', 'follow_up', 'smart_mix'
            messageFormat = 'text', // 'text', 'image', 'video', 'audio', 'document'
            followUpMessage
        } = config;

        console.log(`[Blast ${runId}] Starting loop. Strategy: ${strategy}, BatchSize: ${batchSize}`);

        let isRunning = true;
        let lastId = 0; // Cursor for pagination (ID based)
        const processedPhones = new Set(); // Runtime deduplication for this run

        while (isRunning) {
            // Check if we should stop
            const runState = this.activeRuns.get(runId);
            if (!runState || runState.status === 'stopping') {
                console.log(`[Blast ${runId}] Stopping...`);
                await this.updateRunStatus(runId, 'completed'); // Or 'stopped'
                this.activeRuns.delete(runId);
                break;
            }

            try {
                // 1. Fetch eligible leads using Cursor (lastId)
                console.log(`[Blast ${runId}] Fetching next batch (LastId: ${lastId})...`);
                const leads = await this.fetchNextBatch(batchSize, filters, strategy, lastId);

                if (!leads || leads.length === 0) {
                    console.log(`[Blast ${runId}] No more leads found. Finishing.`);
                    await this.updateRunStatus(runId, 'completed');
                    this.activeRuns.delete(runId);
                    break;
                }

                console.log(`[Blast ${runId}] Processing batch of ${leads.length} leads.`);

                // 2. Process batch
                let successCount = 0;
                let failedCount = 0;
                let processedInBatch = 0;

                for (const lead of leads) {
                    // Update lastId to the current lead's ID to ensure progress
                    lastId = lead.id;

                    // Check stop again inside batch
                    if (this.activeRuns.get(runId)?.status === 'stopping') break;

                    // Runtime Deduplication: Skip if we already sent to this phone IN THIS RUN
                    if (processedPhones.has(lead.phone)) {
                        console.log(`[Blast ${runId}] Skipping duplicate phone ${lead.phone} (already processed in this run).`);
                        continue;
                    }

                    try {
                        console.log(`[Blast ${runId}] Sending to ${lead.phone}...`);
                        // Send Message
                        const messageToSend = this.determineMessage(lead, strategy, messageTemplate, followUpMessage);

                        // sendMessage now returns { success, error }
                        const result = await this.sendMessage(lead.phone, messageToSend, messageFormat);

                        if (result.success) {
                            console.log(`[Blast ${runId}] Sent to ${lead.phone} successfully.`);
                            successCount++;
                            processedPhones.add(lead.phone); // Mark phone as processed for this run

                            await this.logAction(runId, lead.id, lead.phone, 'sent', null);

                            // Update status ONLY for this specific lead ID
                            // We do NOT update all leads with the same phone, so they remain available for future runs (if 'new')
                            await this.updateLeadStatus(lead.id, 'sent');
                        } else {
                            console.error(`[Blast ${runId}] Failed to send to ${lead.phone}: ${result.error}`);
                            failedCount++;
                            // Log the specific error returned by sendMessage
                            await this.logAction(runId, lead.id, lead.phone, 'failed', result.error || 'Failed to send via WAHA');
                        }

                    } catch (err) {
                        console.error(`[Blast ${runId}] Error processing lead ${lead.id}:`, err);
                        failedCount++;
                        await this.logAction(runId, lead.id, lead.phone, 'failed', err.message);
                    }

                    processedInBatch++;
                    // Small delay between messages in batch
                    await new Promise(r => setTimeout(r, 2000));
                }

                // 3. Update Run Stats
                await this.incrementRunStats(runId, successCount, failedCount);

                // 4. Wait for interval
                console.log(`[Blast ${runId}] Waiting ${intervalSeconds}s before next batch...`);
                await new Promise((resolve) => {
                    const timeout = setTimeout(resolve, intervalSeconds * 1000);
                    const run = this.activeRuns.get(runId);
                    if (run) run.timeoutId = timeout;
                });

            } catch (err) {
                console.error(`[Blast ${runId}] Error in blast loop:`, err);
                // Wait a bit before retrying to avoid tight error loops
                await new Promise(r => setTimeout(r, 5000));
            }
        }
    }

    async fetchNextBatch(limit, filters, strategy, lastId = 0) {
        // Query 'apify' table for Apify Blast
        // Use ID-based cursor pagination for stability
        let query = this.supabase
            .from('apify')
            .select('*')
            .gt('id', lastId) // Fetch leads with ID > lastId
            .order('id', { ascending: true }) // Ensure consistent order
            .limit(limit);

        if (filters.city && filters.city.trim() !== '') {
            query = query.ilike('city', `%${filters.city}%`);
        }
        if (filters.category && filters.category.trim() !== '') {
            query = query.ilike('category', `%${filters.category}%`);
        }
        if (filters.state && filters.state.trim() !== '') {
            query = query.ilike('state', `%${filters.state}%`);
        }

        // Strategy specific
        if (strategy === 'new_only') {
            // Check for 'false' (string), 'new' (legacy), or null
            query = query.or('status.eq.false,status.eq.new,status.is.null');
        } else if (strategy === 'follow_up') {
            // Check for 'true' (string) or boolean true or 'sent'
            query = query.or('status.eq.true,status.eq.sent');
        }
        // smart_mix fetches everything (no status filter)

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching batch:', error);
            throw error;
        }
        console.log(`Fetched ${data?.length} leads.`);
        return data;
    }

    determineMessage(lead, strategy, template, followUp) {
        const name = lead.name || lead.title || 'Cliente';
        // Check for true status (already sent)
        if (strategy === 'smart_mix' && (lead.status === true || lead.status === 'true' || lead.status === 'sent')) {
            return followUp.replace('{{name}}', name);
        }
        return template.replace('{{name}}', name);
    }

    async sendMessage(phone, message, format) {
        // Hardcoded URL as requested by user
        const wahaApiUrl = 'http://localhost:3000/api/sendText';

        // Format phone: Remove all non-digits (Handles +55 18 99823-2124 -> 5518998232124)
        const cleanPhone = phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone + '@c.us';

        console.log(`Sending message to ${formattedPhone} via ${wahaApiUrl}`);

        try {
            const response = await fetch(wahaApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: formattedPhone,
                    text: message,
                    session: 'default'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`WAHA Error (${response.status}):`, errorText);
                return { success: false, error: `WAHA Error ${response.status}: ${errorText}` };
            }

            const messageData = await response.json();
            console.log(`Message sent successfully to ${formattedPhone}`);

            // --- SAVE TO DB (Ensure it appears in Chat) ---
            try {
                // 0. Resolve Chat Name from Apify (Lookup by exact phone match)
                let chatName = null;
                const { data: apifyLead } = await this.supabase
                    .from('apify')
                    .select('title')
                    .eq('phone', phone) // Use the raw phone passed in, which comes from the DB
                    .maybeSingle();

                if (apifyLead && apifyLead.title) {
                    chatName = apifyLead.title;
                }

                // Fallback: Try fuzzy search if exact match fails
                if (!chatName) {
                    const { data: fuzzyLead } = await this.supabase
                        .from('apify')
                        .select('title')
                        .ilike('phone', `%${cleanPhone}%`)
                        .maybeSingle();
                    if (fuzzyLead && fuzzyLead.title) chatName = fuzzyLead.title;
                }

                const chatUpdate = {
                    chat_jid: formattedPhone,
                    last_message: message,
                    last_message_at: new Date().toISOString(),
                    last_message_from_me: true,
                    updated_at: new Date().toISOString()
                };

                if (chatName) {
                    chatUpdate.name = chatName;
                }

                // 1. Upsert Chat
                const { data: chatData, error: chatError } = await this.supabase
                    .from('whatsapp_waha_chats')
                    .upsert(chatUpdate, { onConflict: 'chat_jid' })
                    .select('id')
                    .single();

                if (chatError) {
                    console.error('Error upserting chat in Blast:', chatError);
                } else if (chatData) {
                    // 2. Upsert Message
                    const { error: msgError } = await this.supabase
                        .from('whatsapp_waha_messages')
                        .upsert({
                            chat_id: chatData.id,
                            message_id: messageData.id || `blast-${Date.now()}`, // Fallback if no ID
                            session: 'default',
                            from_jid: formattedPhone, // Technically 'to', but for 'from_me=true' it's the chat JID
                            from_me: true,
                            body: message,
                            type: 'text',
                            has_media: false,
                            ack: 1, // Sent
                            message_timestamp: new Date().toISOString()
                        }, { onConflict: 'message_id' });

                    if (msgError) {
                        console.error('Error upserting message in Blast:', msgError);
                    }
                }
            } catch (dbErr) {
                console.error('Error saving blast message to DB:', dbErr);
                // We don't fail the blast if DB save fails, but we log it
            }
            // ----------------------------------------------

            return { success: true };
        } catch (err) {
            console.error('Error sending to WAHA:', err);
            return { success: false, error: err.message };
        }
    }

    async updateRunStatus(runId, status, finishedAt = null) {
        const updateData = { status };
        if (finishedAt) updateData.finished_at = finishedAt;
        else if (status === 'completed' || status === 'stopped' || status === 'failed') {
            updateData.finished_at = new Date();
        }

        await this.supabase.from('blast_runs').update(updateData).eq('id', runId);
    }

    async incrementRunStats(runId, success, failed) {
        // We need to fetch current stats first or use an RPC if available. 
        // For simplicity, we'll just fetch and update, but RPC is better for concurrency.
        // Assuming low concurrency for now.
        const { data: run } = await this.supabase.from('blast_runs').select('success_count, failed_count').eq('id', runId).single();

        if (run) {
            await this.supabase.from('blast_runs').update({
                success_count: (run.success_count || 0) + success,
                failed_count: (run.failed_count || 0) + failed
            }).eq('id', runId);
        }
    }

    async logAction(runId, leadId, leadPhone, status, errorMessage = null) {
        await this.supabase.from('blast_logs').insert({
            blast_run_id: runId,
            lead_id: leadId,
            lead_phone: leadPhone,
            status: status,
            error_message: errorMessage
        });
    }

    async updateLeadStatus(leadId, status) {
        // Update apify table status to 'sent' (string)
        // Only update the specific lead ID, not all with same phone
        await this.supabase.from('apify').update({
            status: status
        }).eq('id', leadId);
    }
}

module.exports = BlastService;
