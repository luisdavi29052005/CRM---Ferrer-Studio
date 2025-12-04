const { GoogleGenerativeAI } = require('@google/generative-ai');

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
                .select('category, title')
                .eq('phone', cleanPhone)
                .maybeSingle();

            const category = contact?.category || 'Geral';
            const leadName = contact?.title || senderName || 'Cliente';

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
                User Name: ${leadName}
                User Category: ${category}
                
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

                OUTPUT FORMAT:
                Return ONLY a JSON object with this structure:
                {
                    "intent": "won" | "lost" | "negotiation" | "info" | "neutral",
                    "value": number (optional, estimated deal value),
                    "response": "string (the natural text response to send)",
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

            // 5. Send Response via WAHA
            if (aiOutput.response) {
                await this.sendResponse(chatId, aiOutput.response);
            }

            // 6. Handle Lead Conversion (Won)
            if (aiOutput.intent === 'won') {
                await this.convertLead(cleanPhone, leadName, category, aiOutput.value || 0, chatId);
            }



        } catch (error) {
            console.error('[AI Handler] Error processing message:', error);
        }
    }

    async convertLead(phone, name, category, value, chatId) {
        console.log(`[AI Handler] CONVERTING LEAD: ${name} (${phone}) - Value: ${value}`);

        try {
            // 1. Insert into 'leads' table
            const { data: newLead, error: insertError } = await this.supabase
                .from('leads')
                .insert([{
                    name: name,
                    phone: phone,
                    category: category,
                    status: 'won',
                    value: value,
                    source: 'AI Conversion',
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

    async getChatId(chatJid) {
        const { data } = await this.supabase
            .from('whatsapp_waha_chats')
            .select('id')
            .eq('chat_jid', chatJid)
            .single();
        return data?.id;
    }

    async sendResponse(chatId, text) {
        const wahaApiUrl = 'http://localhost:3000/api/sendText';
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
                console.error(`[AI Handler] Failed to send response: ${response.statusText}`);
            } else {
                console.log(`[AI Handler] Response sent successfully to ${chatId}`);
                // Note: The webhook will pick up this sent message and save it to DB, 
                // so we don't strictly need to save it here, but saving it ensures consistency if webhook fails.
                // However, let's rely on webhook for now to avoid duplication logic complexity.
            }
        } catch (e) {
            console.error(`[AI Handler] Network error sending response:`, e);
        }
    }
}

module.exports = AIHandler;
