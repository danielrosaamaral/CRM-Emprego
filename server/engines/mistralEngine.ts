export async function runMistral(
  prompt: string,
  apiKey?: string,
  systemInstruction?: string,
  model = 'mistral-small-latest',
  jsonMode = false
): Promise<string> {
  const key = apiKey || process.env.MISTRAL_API_KEY;
  if (!key) {
    throw new Error('Chave de API do Mistral não configurada.');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    }),
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Mistral rate limit atingido (429).');
    }
    const errText = await res.text();
    throw new Error(`Erro Mistral (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

export function isMistralAvailable(key?: string): boolean {
  return !!(key || process.env.MISTRAL_API_KEY);
}
