import { Message } from '../types';

interface AIAnalysisResult {
    intent: 'won' | 'lost' | 'objection' | 'info' | 'price_inquiry' | 'handoff' | 'neutral';
    value?: number;
    confidence: number;
    reasoning?: string;
}

interface AIResponse {
    text: string;
    action?: 'update_lead' | 'promote_lead' | 'handoff' | 'none';
    meta?: any;
}

// Mock AI Service - In production this would call OpenAI/Anthropic
export const aiService = {
    analyzeConversation: async (messages: Message[], lastMessage: string): Promise<AIAnalysisResult> => {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const lowerMsg = lastMessage.toLowerCase();

        // 1. Detect Handoff
        if (lowerMsg.includes('humano') || lowerMsg.includes('atendente') || lowerMsg.includes('falar com alguém')) {
            return { intent: 'handoff', confidence: 0.95, reasoning: 'User requested human agent.' };
        }

        // 2. Detect Won/Closed
        if (lowerMsg.includes('fechado') || lowerMsg.includes('aceito') || lowerMsg.includes('pode mandar o contrato') || lowerMsg.includes('comprovante')) {
            // Try to extract value from previous context or current message
            const valueMatch = lastMessage.match(/R\$\s?(\d+([.,]\d{1,2})?)/) || lastMessage.match(/(\d+)\s?reais/);
            const value = valueMatch ? parseFloat(valueMatch[1].replace(',', '.')) : undefined;
            return { intent: 'won', value, confidence: 0.9, reasoning: 'User indicated agreement.' };
        }

        // 3. Detect Price Inquiry
        if (lowerMsg.includes('preço') || lowerMsg.includes('quanto custa') || lowerMsg.includes('valor') || lowerMsg.includes('orçamento')) {
            return { intent: 'price_inquiry', confidence: 0.85, reasoning: 'User asked for pricing.' };
        }

        // 4. Detect Lost
        if (lowerMsg.includes('não tenho interesse') || lowerMsg.includes('muito caro') || lowerMsg.includes('agora não')) {
            return { intent: 'lost', confidence: 0.8, reasoning: 'User expressed disinterest.' };
        }

        return { intent: 'neutral', confidence: 0.5 };
    },

    generateResponse: async (analysis: AIAnalysisResult, leadName: string): Promise<AIResponse> => {
        await new Promise(resolve => setTimeout(resolve, 800));

        switch (analysis.intent) {
            case 'handoff':
                return {
                    text: "Entendi. Vou transferir você para um de nossos especialistas humanos. Um momento, por favor.",
                    action: 'handoff'
                };
            case 'won':
                return {
                    text: `Perfeito, ${leadName}! Fico muito feliz que tenhamos fechado negócio. Vou preparar tudo por aqui. O valor ficou em R$ ${analysis.value || 'combinado'}.`,
                    action: 'update_lead',
                    meta: { stage: 'Won', budget: analysis.value }
                };
            case 'price_inquiry':
                return {
                    text: `O nosso serviço de automação e CRM completo começa a partir de R$ 1.500,00 mensais, mas depende da sua necessidade específica. Gostaria de agendar uma call rápida para eu entender melhor seu cenário?`,
                    action: 'none'
                };
            case 'lost':
                return {
                    text: "Entendo perfeitamente. Se mudar de ideia ou precisar de algo no futuro, estarei por aqui. Obrigado pela atenção!",
                    action: 'update_lead',
                    meta: { stage: 'Lost' }
                };
            default:
                // Generic engagement for neutral intent
                return {
                    text: "Entendi. Poderia me contar um pouco mais sobre como sua empresa lida com leads hoje?",
                    action: 'none'
                };
        }
    },

    shouldQualifyLead: (messages: Message[]): boolean => {
        // Simple logic: if conversation has > 3 messages from user, qualify.
        const userMessages = messages.filter(m => !m.fromMe).length;
        return userMessages >= 2;
    }
};
