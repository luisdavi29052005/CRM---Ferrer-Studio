
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from '../types';
import { BOT_DETECTION_PROMPT, getPromptByCategory } from './prompts';
import { settingsService } from './settingsService';

interface AIAnalysisResult {
    intent: 'won' | 'lost' | 'objection' | 'info' | 'price_inquiry' | 'handoff' | 'neutral' | 'bot_detected' | 'sales_pitch';
    value?: number;
    confidence: number;
    reasoning?: string;
}

interface AIResponse {
    text: string;
    action?: 'update_lead' | 'promote_lead' | 'handoff' | 'none';
    meta?: any;
}

export const aiService = {
    analyzeConversation: async (messages: Message[], lastMessage: string): Promise<AIAnalysisResult> => {
        const apiKey = await settingsService.getSetting('gemini_api_key');

        if (!apiKey) {
            console.warn('Gemini API Key is missing in System Settings. Falling back to mock logic.');
            return mockAnalyze(lastMessage);
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            // Construct the prompt for analysis
            const conversationHistory = messages.map(m => `${m.fromMe ? 'Agent' : 'User'}: ${m.body}`).join('\n');
            const prompt = `
                ${BOT_DETECTION_PROMPT}

                Analyze the following conversation and determine the user's intent.
                
                Conversation History:
                ${conversationHistory}
                
                Current Message: "${lastMessage}"

                Possible Intents:
                - bot_detected: User is likely a bot (e.g. "Type 1", "Menu:").
                - won: User agreed to buy/closed the deal.
                - lost: User explicitly rejected/not interested.
                - objection: User has a concern (price, trust, etc.).
                - price_inquiry: User asking about cost.
                - handoff: User wants a human.
                - sales_pitch: User mentions "lanchonete", "restaurante", "cardápio" or is open to hearing about the solution.
                - neutral: General conversation.

                Return ONLY a JSON object with this structure:
                {
                    "intent": "string",
                    "confidence": number (0-1),
                    "reasoning": "string",
                    "value": number (optional, if a deal value is mentioned)
                }
            `;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Clean up code blocks if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText) as AIAnalysisResult;

        } catch (error) {
            console.error('Gemini Analysis Failed:', error);
            return mockAnalyze(lastMessage);
        }
    },

    generateResponse: async (analysis: AIAnalysisResult, leadName: string, messages: Message[], category: string = ''): Promise<AIResponse> => {
        const apiKey = await settingsService.getSetting('gemini_api_key');

        if (!apiKey) {
            return mockGenerate(analysis, leadName);
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const conversationHistory = messages.map(m => `${m.fromMe ? 'Agent' : 'User'}: ${m.body}`).join('\n');

            let systemInstruction = '';
            if (analysis.intent === 'bot_detected') {
                systemInstruction = "You detected a bot. Politely ask to speak to a human responsible for the store.";
            } else if (analysis.intent === 'sales_pitch' || analysis.intent === 'objection' || analysis.intent === 'price_inquiry') {
                // DYNAMIC PROMPT SELECTION
                systemInstruction = getPromptByCategory(category);
            } else if (analysis.intent === 'won') {
                systemInstruction = "User closed the deal. Congratulate them and confirm the value. Be professional and happy.";
            } else if (analysis.intent === 'lost') {
                systemInstruction = "User is not interested. Be polite, thank them, and leave the door open.";
            } else if (analysis.intent === 'handoff') {
                return {
                    text: "Entendi. Vou transferir você para um de nossos especialistas humanos. Um momento, por favor.",
                    action: 'handoff'
                };
            } else {
                systemInstruction = "Engage the user naturally. Try to steer the conversation towards their menu photos if appropriate.";
            }

            const prompt = `
                ${systemInstruction}

                Context:
                Lead Name: ${leadName}
                Category: ${category}
                Intent Detected: ${analysis.intent}
                Reasoning: ${analysis.reasoning}

                Conversation History:
                ${conversationHistory}

                Generate the next response for the Agent. Keep it concise (under 50 words) and natural for WhatsApp.
                Return ONLY the response text.
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();

            let action: any = 'none';
            if (analysis.intent === 'won') action = 'update_lead';
            if (analysis.intent === 'lost') action = 'update_lead';
            if (analysis.intent === 'handoff') action = 'handoff';

            return {
                text,
                action,
                meta: analysis.intent === 'won' || analysis.intent === 'lost' ? { stage: analysis.intent } : undefined
            };

        } catch (error) {
            console.error('Gemini Generation Failed:', error);
            return mockGenerate(analysis, leadName);
        }
    },

    shouldQualifyLead: (messages: Message[]): boolean => {
        // Simple logic: if conversation has > 3 messages from user, qualify.
        const userMessages = messages.filter(m => !m.fromMe).length;
        return userMessages >= 2;
    }
};

// Fallback Mock Functions (kept for safety/no-key scenarios)
const mockAnalyze = (lastMessage: string): AIAnalysisResult => {
    const lowerMsg = lastMessage.toLowerCase();
    if (lowerMsg.includes('digite 1') || lowerMsg.includes('menu:')) return { intent: 'bot_detected', confidence: 0.9, reasoning: 'Fallback mock bot detection' };
    if (lowerMsg.includes('humano')) return { intent: 'handoff', confidence: 0.9, reasoning: 'Fallback mock handoff' };
    if (lowerMsg.includes('lanchonete')) return { intent: 'sales_pitch', confidence: 0.8, reasoning: 'Fallback mock sales pitch' };
    return { intent: 'neutral', confidence: 0.5 };
};

const mockGenerate = (analysis: AIAnalysisResult, leadName: string): AIResponse => {
    if (analysis.intent === 'bot_detected') return { text: "Olá, gostaria de falar com um humano.", action: 'none' };
    if (analysis.intent === 'sales_pitch') return { text: `Olá ${leadName}, vi sua lanchonete e tenho uma proposta de fotos IA.`, action: 'none' };
    return { text: "Olá, como posso ajudar?", action: 'none' };
};
