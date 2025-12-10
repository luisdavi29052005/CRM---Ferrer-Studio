import { GoogleGenerativeAI } from '@google/generative-ai';
import { SocialProofMessage } from '../types';
import { settingsService } from './settingsService';

interface GeneratedFeedback {
    contact_name: string;
    messages: SocialProofMessage[];
}

// Prompts por categoria para geração de feedback
const CATEGORY_PROMPTS: Record<string, string> = {
    'lanchonete': 'Cliente de lanchonete/hamburgueria conversando sobre pedidos, delivery, lanches, combos e qualidade da comida.',
    'restaurante': 'Cliente de restaurante conversando sobre reservas, cardápio, ambiente e experiência gastronômica.',
    'pizzaria': 'Cliente de pizzaria conversando sobre sabores, tempo de entrega, bordas recheadas e promoções.',
    'barbearia': 'Cliente de barbearia conversando sobre horários, cortes de cabelo, barba e estilo.',
    'academia': 'Cliente de academia conversando sobre planos, horários, equipamentos e resultados.',
    'petshop': 'Cliente de pet shop conversando sobre banho e tosa, produtos para pets e agendamentos.',
    'salao': 'Cliente de salão de beleza conversando sobre tratamentos capilares, unhas e agendamentos.',
    'advogado': 'Cliente de escritório de advocacia conversando sobre consultas, processos e honorários.',
    'clinica': 'Cliente de clínica médica/odontológica conversando sobre consultas, procedimentos e agendamentos.',
    'loja': 'Cliente de loja conversando sobre produtos, preços, disponibilidade e entrega.',
    'default': 'Cliente satisfeito conversando sobre serviços, qualidade do atendimento e experiência positiva.'
};

export const socialProofAiService = {
    /**
     * Gera uma conversa de feedback realista no estilo WhatsApp
     */
    generateFeedback: async (
        category: string,
        model: string = 'gemini-2.0-flash-exp',
        customPrompt?: string,
        temperature: number = 0.8
    ): Promise<GeneratedFeedback | null> => {
        const apiKey = await settingsService.getSetting('gemini_api_key');

        if (!apiKey) {
            console.warn('Gemini API Key is missing in System Settings.');
            return null;
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const aiModel = genAI.getGenerativeModel({
                model: model,
                generationConfig: { temperature }
            });

            const categoryContext = CATEGORY_PROMPTS[category.toLowerCase()]
                || `Cliente de ${category} conversando sobre serviços, produtos, qualidade do atendimento e experiência positiva com o estabelecimento.`;
            const userContext = customPrompt ? `\n\nInstruções adicionais: ${customPrompt}` : '';


            const prompt = `
Você é um gerador de provas sociais para WhatsApp. Crie uma conversa REALISTA e NATURAL entre um cliente e um estabelecimento.

CONTEXTO: ${categoryContext}${userContext}

REGRAS:
1. A conversa deve parecer 100% real, como uma conversa verdadeira de WhatsApp
2. Use linguagem informal brasileira, com gírias e expressões naturais
3. Use emojis de forma natural (não exagere)
4. A conversa deve ter entre 4 a 7 mensagens
5. DEVE incluir um feedback positivo genuíno no final (elogio, satisfação, recomendação)
6. Use horários realistas para as mensagens
7. O cliente deve parecer genuinamente satisfeito

FORMATO DE RESPOSTA (JSON válido):
{
    "contact_name": "Nome Brasileiro Realista",
    "messages": [
        {
            "id": "1",
            "text": "Mensagem do cliente",
            "time": "20:15",
            "fromMe": false,
            "type": "text",
            "status": "read"
        },
        {
            "id": "2", 
            "text": "Resposta do estabelecimento",
            "time": "20:16",
            "fromMe": true,
            "type": "text",
            "status": "read"
        }
    ]
}

Gere a conversa agora. Retorne APENAS o JSON, sem markdown ou texto adicional.
`;

            const result = await aiModel.generateContent(prompt);
            const response = result.response;
            const text = response.text().trim();

            // Clean up code blocks if present
            const cleanText = text
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();

            const parsed = JSON.parse(cleanText) as GeneratedFeedback;
            return parsed;

        } catch (error) {
            console.error('Error generating social proof feedback:', error);
            return null;
        }
    },

    /**
     * Gera múltiplas conversas em lote
     */
    generateBatchFeedback: async (
        category: string,
        model: string = 'gemini-2.0-flash-exp',
        count: number = 3,
        customPrompt?: string,
        temperature: number = 0.8
    ): Promise<GeneratedFeedback[]> => {
        const results: GeneratedFeedback[] = [];

        for (let i = 0; i < count; i++) {
            const feedback = await socialProofAiService.generateFeedback(
                category,
                model,
                customPrompt,
                temperature
            );
            if (feedback) {
                results.push(feedback);
            }
            // Small delay between requests to avoid rate limiting
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return results;
    }
};
