import fs from 'fs';
import path from 'path';
import { EngineType } from '../src/types.js';

export type ConnectionStatus = 'nao_configurada' | 'valida' | 'invalida' | 'erro_ligacao';

export interface PersistentEngineEntry {
  apiKey: string;
  ativo: boolean;
  prioridade: number;
  modeloPreferido: string;
}

export interface PersistentConfig {
  motores: {
    gemini: PersistentEngineEntry;
    groq: PersistentEngineEntry;
    mistral: PersistentEngineEntry;
  };
  localizacaoBase: string;
  distanciaKmPadrao: number;
  tempoCarroMaxMin: number;
}

export interface PublicEngineConfig {
  id: EngineType;
  nome: string;
  ativo: boolean;
  prioridade: number;
  modeloPreferido: string;
  hasKey: boolean;
  isEnvKey: boolean;
  maskedKey: string;
  connectionStatus: ConnectionStatus;
  statusMessage?: string;
  ultimosErros?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const DEFAULT_CONFIG: PersistentConfig = {
  motores: {
    gemini: {
      apiKey: '',
      ativo: true,
      prioridade: 1,
      modeloPreferido: 'gemini-3.8-flash',
    },
    groq: {
      apiKey: '',
      ativo: true,
      prioridade: 2,
      modeloPreferido: 'llama-3.3-70b-versatile',
    },
    mistral: {
      apiKey: '',
      ativo: true,
      prioridade: 3,
      modeloPreferido: 'mistral-small-latest',
    },
  },
  localizacaoBase: 'Porto / Maia, Portugal',
  distanciaKmPadrao: 10,
  tempoCarroMaxMin: 10,
};

// In-memory status cache for connection health
const connectionStatusCache = new Map<EngineType, { status: ConnectionStatus; message?: string }>();

class ConfigService {
  private config: PersistentConfig | null = null;

  constructor() {
    this.ensureDataDir();
    this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public load(): PersistentConfig {
    this.ensureDataDir();
    if (!fs.existsSync(CONFIG_FILE)) {
      this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      this.saveToFile();
      console.log(`[ConfigService] Ficheiro ${CONFIG_FILE} inicializado com sucesso.`);
    } else {
      try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.config = {
          ...DEFAULT_CONFIG,
          ...parsed,
          motores: {
            gemini: { ...DEFAULT_CONFIG.motores.gemini, ...(parsed.motores?.gemini || {}) },
            groq: { ...DEFAULT_CONFIG.motores.groq, ...(parsed.motores?.groq || {}) },
            mistral: { ...DEFAULT_CONFIG.motores.mistral, ...(parsed.motores?.mistral || {}) },
          },
        };
        console.log(`[ConfigService] Configuração lida de ${CONFIG_FILE}.`);
      } catch (err) {
        console.error(`[ConfigService] Erro ao ler ${CONFIG_FILE}, a usar padrões:`, err);
        this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      }
    }
    return this.config!;
  }

  private saveToFile() {
    if (!this.config) return;
    try {
      this.ensureDataDir();
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[ConfigService] Erro ao guardar em ${CONFIG_FILE}:`, err);
      throw err;
    }
  }

  public getConfig(): PersistentConfig {
    if (!this.config) {
      this.load();
    }
    return this.config!;
  }

  public getEffectiveApiKey(engine: EngineType): string {
    const cfg = this.getConfig();
    const stored = cfg.motores[engine]?.apiKey?.trim();
    if (stored) return stored;

    // Fallback to environment variables
    if (engine === 'gemini') return process.env.GEMINI_API_KEY?.trim() || '';
    if (engine === 'groq') return process.env.GROQ_API_KEY?.trim() || '';
    if (engine === 'mistral') return process.env.MISTRAL_API_KEY?.trim() || '';
    return '';
  }

  public maskApiKey(key: string): string {
    if (!key || key.trim().length === 0) return '';
    const clean = key.trim();
    if (clean.startsWith('gsk_')) {
      const tail = clean.slice(-4);
      return `gsk_••••••••••••${tail}`;
    }
    if (clean.startsWith('AIza')) {
      const tail = clean.slice(-4);
      return `AIza••••••••${tail}`;
    }
    if (clean.length > 8) {
      const head = clean.slice(0, 3);
      const tail = clean.slice(-4);
      return `${head}••••••••${tail}`;
    }
    return '••••••••';
  }

  public getPublicEngineConfigs(): Record<EngineType, PublicEngineConfig> {
    const cfg = this.getConfig();
    const engines: EngineType[] = ['gemini', 'groq', 'mistral'];
    const names: Record<EngineType, string> = {
      gemini: 'Google Gemini',
      groq: 'Groq Cloud',
      mistral: 'Mistral AI',
    };

    const result = {} as Record<EngineType, PublicEngineConfig>;

    for (const id of engines) {
      const entry = cfg.motores[id];
      const hasStoredKey = !!entry.apiKey?.trim();
      const envKey = id === 'gemini' ? process.env.GEMINI_API_KEY?.trim() : id === 'groq' ? process.env.GROQ_API_KEY?.trim() : process.env.MISTRAL_API_KEY?.trim();
      const hasEnvKey = !!envKey;
      const effectiveKey = hasStoredKey ? entry.apiKey.trim() : (envKey || '');
      const hasKey = !!effectiveKey;

      const cachedStatus = connectionStatusCache.get(id);
      let status: ConnectionStatus = 'nao_configurada';
      let message = 'Não configurada';

      if (cachedStatus) {
        status = cachedStatus.status;
        message = cachedStatus.message || '';
      } else if (hasKey) {
        status = 'valida';
        message = hasStoredKey ? 'Chave configurada em data/config.json' : 'Chave ativa no ambiente do servidor';
      }

      result[id] = {
        id,
        nome: names[id],
        ativo: entry.ativo,
        prioridade: entry.prioridade,
        modeloPreferido: entry.modeloPreferido,
        hasKey,
        isEnvKey: !hasStoredKey && hasEnvKey,
        maskedKey: this.maskApiKey(effectiveKey),
        connectionStatus: status,
        statusMessage: message,
      };
    }

    return result;
  }

  public updateEngineKey(engine: EngineType, key: string): PublicEngineConfig {
    const cfg = this.getConfig();
    cfg.motores[engine].apiKey = key.trim();
    this.saveToFile();

    // Clear or update connection status cache
    if (!key.trim()) {
      connectionStatusCache.delete(engine);
    }

    return this.getPublicEngineConfigs()[engine];
  }

  public updateEngineSettings(
    engine: EngineType,
    updates: { ativo?: boolean; prioridade?: number; modeloPreferido?: string }
  ): PublicEngineConfig {
    const cfg = this.getConfig();
    if (typeof updates.ativo === 'boolean') {
      cfg.motores[engine].ativo = updates.ativo;
    }
    if (typeof updates.prioridade === 'number') {
      cfg.motores[engine].prioridade = updates.prioridade;
    }
    if (updates.modeloPreferido) {
      cfg.motores[engine].modeloPreferido = updates.modeloPreferido;
    }
    this.saveToFile();
    return this.getPublicEngineConfigs()[engine];
  }

  public updateGeneralSettings(updates: {
    localizacaoBase?: string;
    distanciaKmPadrao?: number;
    tempoCarroMaxMin?: number;
  }) {
    const cfg = this.getConfig();
    if (updates.localizacaoBase) cfg.localizacaoBase = updates.localizacaoBase;
    if (typeof updates.distanciaKmPadrao === 'number') cfg.distanciaKmPadrao = updates.distanciaKmPadrao;
    if (typeof updates.tempoCarroMaxMin === 'number') cfg.tempoCarroMaxMin = updates.tempoCarroMaxMin;
    this.saveToFile();
    return cfg;
  }

  public async testConnection(
    engine: EngineType,
    candidateKey?: string
  ): Promise<{ status: ConnectionStatus; message: string; details?: string }> {
    const key = candidateKey?.trim() || this.getEffectiveApiKey(engine);

    if (!key) {
      const res = {
        status: 'nao_configurada' as ConnectionStatus,
        message: 'Nenhuma chave fornecida ou guardada para testar.',
      };
      connectionStatusCache.set(engine, res);
      return res;
    }

    try {
      if (engine === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const resp = await fetch(url);
        if (resp.ok) {
          const res = {
            status: 'valida' as ConnectionStatus,
            message: 'Ligação bem sucedida (Google Gemini validado)',
          };
          connectionStatusCache.set(engine, res);
          return res;
        }

        const data = (await resp.json().catch(() => ({}))) as any;
        const errMsg = data?.error?.message || `HTTP ${resp.status}`;
        if (resp.status === 400 || resp.status === 403) {
          const res = {
            status: 'invalida' as ConnectionStatus,
            message: 'Chave Gemini inválida ou não autorizada',
            details: errMsg,
          };
          connectionStatusCache.set(engine, res);
          return res;
        }
        if (resp.status === 429) {
          const res = {
            status: 'erro_ligacao' as ConnectionStatus,
            message: 'Limite de quota Gemini excedido (429)',
            details: errMsg,
          };
          connectionStatusCache.set(engine, res);
          return res;
        }
        const res = {
          status: 'erro_ligacao' as ConnectionStatus,
          message: `Erro na API Gemini (${resp.status})`,
          details: errMsg,
        };
        connectionStatusCache.set(engine, res);
        return res;
      }

      if (engine === 'groq') {
        const resp = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (resp.ok) {
          const res = {
            status: 'valida' as ConnectionStatus,
            message: 'Ligação bem sucedida (Groq Cloud validado)',
          };
          connectionStatusCache.set(engine, res);
          return res;
        }

        const errText = await resp.text().catch(() => '');
        if (resp.status === 401 || resp.status === 403) {
          const res = {
            status: 'invalida' as ConnectionStatus,
            message: 'Chave Groq inválida ou não autorizada (401)',
            details: errText,
          };
          connectionStatusCache.set(engine, res);
          return res;
        }
        if (resp.status === 429) {
          const res = {
            status: 'erro_ligacao' as ConnectionStatus,
            message: 'Limite de pedidos Groq atingido (429)',
            details: errText,
          };
          connectionStatusCache.set(engine, res);
          return res;
        }
        const res = {
          status: 'erro_ligacao' as ConnectionStatus,
          message: `Erro no serviço Groq (${resp.status})`,
          details: errText,
        };
        connectionStatusCache.set(engine, res);
        return res;
      }

      if (engine === 'mistral') {
        const resp = await fetch('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (resp.ok) {
          const res = {
            status: 'valida' as ConnectionStatus,
            message: 'Ligação bem sucedida (Mistral AI validado)',
          };
          connectionStatusCache.set(engine, res);
          return res;
        }

        const errText = await resp.text().catch(() => '');
        if (resp.status === 401 || resp.status === 403) {
          const res = {
            status: 'invalida' as ConnectionStatus,
            message: 'Chave Mistral inválida ou não autorizada (401)',
            details: errText,
          };
          connectionStatusCache.set(engine, res);
          return res;
        }
        if (resp.status === 429) {
          const res = {
            status: 'erro_ligacao' as ConnectionStatus,
            message: 'Limite de quota Mistral atingido (429)',
            details: errText,
          };
          connectionStatusCache.set(engine, res);
          return res;
        }
        const res = {
          status: 'erro_ligacao' as ConnectionStatus,
          message: `Erro no serviço Mistral (${resp.status})`,
          details: errText,
        };
        connectionStatusCache.set(engine, res);
        return res;
      }

      return {
        status: 'erro_ligacao',
        message: 'Motor não reconhecido.',
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      const isNetwork =
        msg.includes('fetch failed') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('network');
      const res = {
        status: 'erro_ligacao' as ConnectionStatus,
        message: isNetwork ? 'Erro de rede ao contactar a API' : `Erro de ligação: ${msg}`,
        details: msg,
      };
      connectionStatusCache.set(engine, res);
      return res;
    }
  }
}

export const configService = new ConfigService();
