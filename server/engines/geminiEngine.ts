import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
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

export async function runGemini(prompt: string, systemInstruction?: string, jsonMode = false): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.');
  }

  const response = await client.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || 'És um assistente profissional especializado em recrutamento e gestão de carreiras para profissionais seniores de design e marketing.',
      temperature: 0.2,
      responseMimeType: jsonMode ? 'application/json' : undefined,
    },
  });

  return response.text || '';
}

export function isGeminiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
