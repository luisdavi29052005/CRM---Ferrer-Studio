const { GoogleGenerativeAI } = require('@google/generative-ai');

const SPLIT = '[SPLIT]';

class AIHandler {
    constructor(supabase) {
        this.supabase = supabase;
    }

    async processMessage(chatId, messageBody, senderName) {
        try {
            // 1. Find the contact in Apify table to get Category
            const cleanPhone = chatId.replace(/\D/g, '');
            const { data: contact } = await this.supabase
                .from('apify')

                .select('category, title, city, state')
                .eq('phone', cleanPhone)
                .maybeSingle();

            const category = contact?.category || 'Geral';
            const businessName = contact?.title || 'Cliente';
            const leadCity = contact?.city || '';
            const leadState = contact?.state || '';
            const senderDisplayName = senderName || 'Cliente';

            console.log(`[AI Handler] Processing message from ${cleanPhone}. Category: "${category}"`);

            // 2. Find the Agent for this Category
            // We search for an agent that matches the category. 
            // If the category is specific (e.g. "Lanchonete"), we look for an agent with that category.
            // If no specific agent is found, we could look for a 'Geral' agent or similar.

            let { data: agent } = await this.supabase
                .from('agents')
                .select('*')
                .eq('category', category)
                .eq('is_active', true)
                .maybeSingle();

            if (!agent) {
                console.log(`[AI Handler] No specific agent found for category "${category}". Trying "Geral"...`);
                const { data: generalAgent } = await this.supabase
                    .from('agents')
                    .select('*')
                    .eq('category', 'Geral')
                    .eq('is_active', true)
                    .maybeSingle();

                agent = generalAgent;
            }

            if (!agent) {
                console.log(`[AI Handler] No active agent found (Specific or Geral). Skipping AI response.`);
                return;
            }

            console.log(`[AI Handler] Selected Agent: ${agent.name} (${agent.model})`);

            // 3. Fetch System Settings for API Key
            const { data: settings } = await this.supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'gemini_api_key')
                .single();

            if (!settings?.value) {
                console.error('[AI Handler] Gemini API Key not configured in system_settings.');
                return;
            }

            // 4. Generate Response
            const genAI = new GoogleGenerativeAI(settings.value);
            const model = genAI.getGenerativeModel({ model: agent.model || 'gemini-1.5-flash' });

            // Fetch recent conversation history for context
            const { data: history } = await this.supabase
                .from('whatsapp_waha_messages')
                .select('body, from_me')
                .eq('chat_id', (await this.getChatId(chatId)))
                .order('message_timestamp', { ascending: false })
                .limit(10);

            const conversationHistory = history ? history.reverse().map(m => `${m.from_me ? 'Agent' : 'User'}: ${m.body}`).join('\n') : '';

            const prompt = `
                ${agent.prompt}

                CONTEXT:
                CONTEXT:
                User Business/Title: ${businessName}
                User Display Name: ${senderDisplayName}
                User Category: ${category}
                City: ${leadCity}
                State: ${leadState}
                
                CONVERSATION HISTORY:
                ${conversationHistory}

                INCOMING MESSAGE:
                "${messageBody}"

                INSTRUCTIONS:
                1. Analyze the conversation to determine the user's intent and status.
                2. If the user has agreed to buy or close the deal, mark intent as "won".
                3. If the user explicitly rejects, mark as "lost".
                4. Estimate the deal value if mentioned (or use a default based on context).
                5. Generate a natural response for WhatsApp.
                6. **IMPORTANT:** If you want to send multiple separate messages (e.g., a greeting first, then the question, or to create suspense), separate them with the tag '${SPLIT}'. 
                   Example: "Oi Davi! ${SPLIT} Tudo bem? ${SPLIT} Vi que você tem interesse..."
                   This makes the conversation feel more human.

                OUTPUT FORMAT:
                Return ONLY a JSON object with this structure:
                {
                    "intent": "won" | "lost" | "negotiation" | "info" | "neutral",
                    "value": number (optional, estimated deal value),
                    "name": "string (extracted real name of the person, if mentioned. If not mentioned, leave null)",
                    "response": "string (the natural text response to send. Use [SPLIT] to separate messages)",
                    "reasoning": "string (why you chose this intent)"
                }
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();

            // Clean up code blocks if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            let aiOutput;

            try {
                aiOutput = JSON.parse(cleanText);
            } catch (e) {
                console.error('[AI Handler] Failed to parse AI JSON:', cleanText);
                // Fallback: treat entire text as response
                aiOutput = { intent: 'neutral', response: cleanText };
            }

            console.log(`[AI Handler] Analysis: Intent=${aiOutput.intent}, Value=${aiOutput.value}`);
            console.log(`[AI Handler] Generated response: "${aiOutput.response}"`);

            // 5. Send Response via WAHA (with Splitting and Typing Indicators)
            if (aiOutput.response) {
                const messages = aiOutput.response.split(SPLIT).map(m => m.trim()).filter(m => m.length > 0);

                // Mark message as seen first
                await this.sendSeen(chatId);

                for (let i = 0; i < messages.length; i++) {
                    const msg = messages[i];

                    // Start typing indicator
                    await this.startTyping(chatId);

                    // Simulate natural typing delay (roughly 50ms per character, min 1s, max 4s)
                    const typingDelay = Math.min(Math.max(msg.length * 50, 1000), 4000);
                    await new Promise(resolve => setTimeout(resolve, typingDelay));

                    // Stop typing and send message
                    await this.stopTyping(chatId);
                    await this.sendResponse(chatId, msg, agent);

                    // Add delay between split messages
                    if (i < messages.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }
                }
            }

            // 6. Handle Lead Conversion (Won) or Status Update
            if (aiOutput.intent === 'won') {
                // Use extracted name if available, otherwise fallback to sender name or business name
                const finalName = aiOutput.name || senderDisplayName || businessName;
                await this.convertLead(cleanPhone, finalName, businessName, category, leadCity, leadState, aiOutput.value || 0, chatId);
            } else if (aiOutput.intent === 'lost') {
                await this.updateLeadStatus(cleanPhone, 'lost');
            } else if (aiOutput.intent === 'objection') {
                await this.updateLeadStatus(cleanPhone, 'objection');
            }

        } catch (error) {
            console.error('[AI Handler] Error processing message:', error);
        }
    }

    async convertLead(phone, name, business, category, city, state, value, chatId) {
        console.log(`[AI Handler] CONVERTING LEAD: ${name} (${phone}) - Business: ${business} - Value: ${value}`);

        try {
            // Format chat_id to ensure it has @c.us suffix
            const formattedChatId = chatId.includes('@') ? chatId : `${chatId.replace(/\D/g, '')}@c.us`;

            // 1. Insert into 'leads' table
            const { data: newLead, error: insertError } = await this.supabase
                .from('leads')
                .insert([{
                    name: name, // Real name extracted by AI or sender name
                    business: business, // Business name from Apify (title)
                    phone: phone,
                    city: city,
                    state: state,
                    category: category,
                    budget: value, // Map value to budget column
                    stage: 'Won',
                    temperature: 'Hot',
                    source: 'AI Conversion',
                    chat_id: formattedChatId, // Link to WhatsApp chat
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (insertError) {
                console.error('[AI Handler] Error inserting into leads:', insertError);
                return;
            }

            console.log(`[AI Handler] Lead inserted into 'leads' table with ID: ${newLead.id}`);

            // 2. Update 'apify' table (Delete to move)
            const { error: deleteError } = await this.supabase
                .from('apify')
                .delete()
                .eq('phone', phone);

            if (deleteError) {
                console.error('[AI Handler] Error deleting from apify:', deleteError);
            } else {
                console.log(`[AI Handler] Lead removed from 'apify' table.`);
            }

        } catch (err) {
            console.error('[AI Handler] Error converting lead:', err);
        }
    }

    async updateLeadStatus(phone, status) {
        console.log(`[AI Handler] Updating status for ${phone} to ${status}`);
        try {
            const { error } = await this.supabase
                .from('apify')
                .update({ status: status })
                .eq('phone', phone);

            if (error) console.error('[AI Handler] Error updating status:', error);
        } catch (e) {
            console.error('[AI Handler] Error in updateLeadStatus:', e);
        }
    }

    async sendResponse(chatId, text, agent) {
        const wahaApiUrl = 'http://localhost:3000/api/sendText';
        console.log(`[AI Handler] Sending response to ${chatId}: "${text}"`);

        try {
            const response = await fetch(wahaApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: chatId,
                    text: text,
                    session: 'default'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[AI Handler] WAHA Error (${response.status}):`, errorText);
            } else {
                const messageData = await response.json();
                console.log(`[AI Handler] Response sent successfully. ID: ${messageData.id}`);

                // Save to DB immediately to preserve context
                const internalChatId = await this.getChatId(chatId);
                if (internalChatId) {
                    const { error: saveError } = await this.supabase
                        .from('whatsapp_waha_messages')
                        .upsert({
                            chat_id: internalChatId,
                            message_id: messageData.id || `ai-${Date.now()}`,
                            session: 'default',
                            from_jid: chatId, // For fromMe=true, this is usually the chat JID
                            from_me: true,
                            body: text,
                            type: 'text',
                            has_media: false,
                            ack: 1,
                            message_timestamp: new Date().toISOString()
                        }, { onConflict: 'message_id' });

                    if (saveError) {
                        console.error('[AI Handler] Error saving AI response to DB:', saveError);
                    } else {
                        console.log('[AI Handler] AI response saved to DB.');
                    }
                }
            }
        } catch (error) {
            console.error('[AI Handler] Error sending response:', error);
        }
    }

    // WAHA Typing Indicators
    async startTyping(chatId) {
        try {
            await fetch('http://localhost:3000/api/startTyping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, session: 'default' })
            });
            console.log(`[AI Handler] Started typing for ${chatId}`);
        } catch (error) {
            console.error('[AI Handler] Error starting typing:', error);
        }
    }

    async stopTyping(chatId) {
        try {
            await fetch('http://localhost:3000/api/stopTyping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, session: 'default' })
            });
            console.log(`[AI Handler] Stopped typing for ${chatId}`);
        } catch (error) {
            console.error('[AI Handler] Error stopping typing:', error);
        }
    }

    async sendSeen(chatId) {
        try {
            await fetch('http://localhost:3000/api/sendSeen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, session: 'default' })
            });
            console.log(`[AI Handler] Marked as seen: ${chatId}`);
        } catch (error) {
            console.error('[AI Handler] Error sending seen:', error);
        }
    }

    async getChatId(chatJid) {
        const { data } = await this.supabase
            .from('whatsapp_waha_chats')
            .select('id')
            .eq('chat_jid', chatJid)
            .single();

        return data ? data.id : null;
    }
}

module.exports = AIHandler;
