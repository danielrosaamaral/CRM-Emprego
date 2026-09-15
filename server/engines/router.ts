import { EngineConfig, EngineTask, EngineType } from '../../src/types.js';
import { configService } from '../configService.js';
import { db } from '../storage.js';
import { isGeminiAvailable, runGemini } from './geminiEngine.js';
import { isGroqAvailable, runGroq } from './groqEngine.js';
import { isMistralAvailable, runMistral } from './mistralEngine.js';

export interface ExecutionResult {
  text: string;
  engineUsed: EngineType;
  attempts: Array<{ engine: EngineType; error?: string }>;
}

export class MultiEngineRouter {
  // Simple in-memory response cache to avoid repeated calls
  private responseCache = new Map<string, string>();

  public async executeTask(
    task: EngineTask,
    prompt: string,
    systemInstruction?: string,
    jsonMode = false
  ): Promise<ExecutionResult> {
    // Generate cache key
    const cacheKey = `${task}:${prompt}`;
    if (this.responseCache.has(cacheKey)) {
      return {
        text: this.responseCache.get(cacheKey)!,
        engineUsed: 'gemini',
        attempts: [],
      };
    }

    const settings = db.getData().definicoes;
    const routing = settings.roteamento[task] || {
      tarefa: task,
      motorPrimario: 'gemini',
      motorSecundario: 'groq',
      motorFallback: 'mistral',
    };

    const chain: EngineType[] = [
      routing.motorPrimario,
      routing.motorSecundario,
      routing.motorFallback,
    ];

    // Remove duplicates preserving order
    const orderedEngines = Array.from(new Set(chain)).filter(Boolean);

    const attempts: Array<{ engine: EngineType; error?: string }> = [];

    for (const engineId of orderedEngines) {
      const config = settings.motores[engineId];
      if (config && !config.ativo) {
        attempts.push({ engine: engineId, error: 'Motor inativo nas definições' });
        continue;
      }

      try {
        let text = '';
        const effectiveKey = configService.getEffectiveApiKey(engineId);

        if (engineId === 'gemini') {
          if (!isGeminiAvailable(effectiveKey)) {
            attempts.push({ engine: 'gemini', error: 'Chave Gemini não configurada' });
            continue;
          }
          text = await runGemini(prompt, effectiveKey, systemInstruction, config?.modeloPreferido, jsonMode);
        } else if (engineId === 'groq') {
          if (!isGroqAvailable(effectiveKey)) {
            attempts.push({ engine: 'groq', error: 'Chave Groq não configurada' });
            continue;
          }
          text = await runGroq(prompt, effectiveKey, systemInstruction, config?.modeloPreferido, jsonMode);
        } else if (engineId === 'mistral') {
          if (!isMistralAvailable(effectiveKey)) {
            attempts.push({ engine: 'mistral', error: 'Chave Mistral não configurada' });
            continue;
          }
          text = await runMistral(prompt, effectiveKey, systemInstruction, config?.modeloPreferido, jsonMode);
        }

        if (text && text.trim().length > 0) {
          // Cache successful answer
          this.responseCache.set(cacheKey, text);
          return {
            text,
            engineUsed: engineId,
            attempts,
          };
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        attempts.push({ engine: engineId, error: errMsg });
        console.warn(`Motor ${engineId} falhou para a tarefa "${task}":`, errMsg);

        // Mark rate limit or error in settings
        if (config) {
          if (errMsg.includes('429') || errMsg.toLowerCase().includes('rate limit')) {
            config.limiteAtingido = true;
          }
          config.ultimosErros = errMsg;
          db.updateSettings({ motores: { ...settings.motores, [engineId]: config } });
        }
      }
    }

    // If all failed, throw descriptive error with attempt history
    const history = attempts.map((a) => `${a.engine}: ${a.error}`).join('; ');
    throw new Error(`Todos os motores configurados falharam para "${task}". Tentativas: ${history}`);
  }

  public clearCache() {
    this.responseCache.clear();
  }
}

export const router = new MultiEngineRouter();
