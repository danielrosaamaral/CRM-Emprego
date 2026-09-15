export async function runGroq(
  prompt: string,
  apiKey?: string,
  systemInstruction?: string,
  model = 'llama-3.3-70b-versatile',
  jsonMode = false
): Promise<string> {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('Chave de API do Groq não configurada.');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
      throw new Error('Groq rate limit atingido (429).');
    }
    const errText = await res.text();
    throw new Error(`Erro Groq (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

export function isGroqAvailable(key?: string): boolean {
  return !!(key || process.env.GROQ_API_KEY);
}
