import { configService } from '../configService.js';

export async function runMistral(
  prompt: string,
  apiKey?: string,
  systemInstruction?: string,
  model = 'mistral-small-latest',
  jsonMode = false
): Promise<string> {
  const key = apiKey || configService.getApiKey('mistral');
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
  return !!(key || configService.getApiKey('mistral'));
}

export async function testMistralConnection(overrideKey?: string): Promise<{
  success: boolean;
  status: 'valid' | 'auth_error' | 'quota_error' | 'network_error' | 'service_unavailable';
  message: string;
}> {
  const key = overrideKey || configService.getApiKey('mistral');
  if (!key) {
    return {
      success: false,
      status: 'auth_error',
      message: 'Nenhuma chave de API fornecida ou configurada para o Mistral AI.',
    };
  }

  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    if (res.ok) {
      return {
        success: true,
        status: 'valid',
        message: 'Ligação ao Mistral AI (Mistral Small / Large) estabelecida com sucesso.',
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        status: 'auth_error',
        message: 'Chave de API do Mistral inválida ou não autorizada (401/403).',
      };
    }

    if (res.status === 429) {
      return {
        success: false,
        status: 'quota_error',
        message: 'Limite de quota/taxa ativado no Mistral AI (Rate Limit 429).',
      };
    }

    if (res.status >= 500) {
      return {
        success: false,
        status: 'service_unavailable',
        message: `Serviço Mistral AI temporariamente indisponível (${res.status}).`,
      };
    }

    const errText = await res.text();
    return {
      success: false,
      status: 'auth_error',
      message: `Erro ao validar Mistral (${res.status}): ${errText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'network_error',
      message: `Erro de rede ao ligar ao Mistral AI: ${err?.message || String(err)}`,
    };
  }
}
