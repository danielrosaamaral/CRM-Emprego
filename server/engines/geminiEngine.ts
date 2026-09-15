import { GoogleGenAI } from '@google/genai';

export async function runGemini(
  prompt: string,
  apiKey?: string,
  systemInstruction?: string,
  model = 'gemini-3.8-flash',
  jsonMode = false
): Promise<string> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Chave de API do Gemini não configurada.');
  }

  const client = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

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

export function isGeminiAvailable(apiKey?: string): boolean {
  return !!(apiKey || process.env.GEMINI_API_KEY);
}
