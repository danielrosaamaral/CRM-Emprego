import { GoogleGenAI } from '@google/genai';
import { configService } from '../configService.js';

let geminiClient: GoogleGenAI | null = null;
let cachedKeyUsed: string | null = null;

function getGeminiClient(overrideKey?: string): GoogleGenAI | null {
  const apiKey = overrideKey?.trim() || configService.getApiKey('gemini') || process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  if (!geminiClient || cachedKeyUsed !== apiKey) {
    cachedKeyUsed = apiKey;
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export async function runGemini(
  prompt: string,
  apiKey?: string,
  systemInstruction?: string,
  model = 'gemini-3.8-flash',
  jsonMode = false
): Promise<string> {
  const client = getGeminiClient(apiKey);
  if (!client) {
    throw new Error('Chave de API do Gemini não configurada.');
  }

  const response = await client.models.generateContent({
    model: model || 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction:
        systemInstruction ||
        'És um assistente profissional especializado em recrutamento e gestão de carreiras para profissionais seniores de design e marketing.',
      temperature: 0.2,
      responseMimeType: jsonMode ? 'application/json' : undefined,
    },
  });

  return response.text || '';
}

export function isGeminiAvailable(overrideKey?: string): boolean {
  return !!(overrideKey?.trim() || configService.getApiKey('gemini') || process.env.GEMINI_API_KEY?.trim());
}

export async function testGeminiConnection(overrideKey?: string): Promise<{
  success: boolean;
  status: 'valid' | 'auth_error' | 'quota_error' | 'network_error' | 'service_unavailable';
  message: string;
}> {
  const apiKey = overrideKey?.trim() || configService.getApiKey('gemini') || process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      status: 'auth_error',
      message: 'Nenhuma chave de API fornecida ou configurada para o Google Gemini.',
    };
  }

  try {
    const client = getGeminiClient(apiKey);
    if (!client) {
      return {
        success: false,
        status: 'auth_error',
        message: 'Falha ao inicializar o cliente do Google Gemini.',
      };
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Responder OK',
      config: {
        maxOutputTokens: 5,
        temperature: 0.1,
      },
    });

    if (response.text !== undefined) {
      return {
        success: true,
        status: 'valid',
        message: 'Ligação ao Google Gemini (Gemini 3.8 Flash) estabelecida com sucesso.',
      };
    }

    return {
      success: true,
      status: 'valid',
      message: 'Resposta recebida do Google Gemini.',
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const statusLower = errMsg.toLowerCase();

    if (
      statusLower.includes('api_key_invalid') ||
      statusLower.includes('invalid api key') ||
      statusLower.includes('unauthorized') ||
      statusLower.includes('401') ||
      statusLower.includes('403') ||
      statusLower.includes('permission_denied')
    ) {
      return {
        success: false,
        status: 'auth_error',
        message: 'Chave de API do Google Gemini inválida ou sem permissões suficientes.',
      };
    }

    if (
      statusLower.includes('429') ||
      statusLower.includes('quota') ||
      statusLower.includes('resource_exhausted') ||
      statusLower.includes('rate limit')
    ) {
      return {
        success: false,
        status: 'quota_error',
        message: 'Limite de quota ou taxa de pedidos atingido no Google Gemini (Rate Limit 429).',
      };
    }

    if (
      statusLower.includes('econnrefused') ||
      statusLower.includes('enotfound') ||
      statusLower.includes('fetch failed') ||
      statusLower.includes('network')
    ) {
      return {
        success: false,
        status: 'network_error',
        message: 'Erro de rede: Não foi possível alcançar os servidores da Google AI.',
      };
    }

    if (statusLower.includes('500') || statusLower.includes('503') || statusLower.includes('unavailable')) {
      return {
        success: false,
        status: 'service_unavailable',
        message: 'Serviço do Google Gemini temporariamente indisponível (500/503).',
      };
    }

    return {
      success: false,
      status: 'auth_error',
      message: `Erro na validação do Gemini: ${errMsg}`,
    };
  }
}
