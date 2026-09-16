import fs from 'fs';
import path from 'path';
import { ConnectionStatus, EngineConfig, EngineType } from '../src/types.js';

interface LocalEngineConfig {
  apiKey?: string;
  ativo?: boolean;
  prioridade?: number;
  modeloPreferido?: string;
}

interface ConfigSchema {
  apiKeys: {
    gemini?: string;
    groq?: string;
    mistral?: string;
  };
  general?: {
    localizacaoBase?: string;
    distanciaKmPadrao?: number;
    tempoCarroMaxMin?: number;
  };
  motores?: {
    gemini?: LocalEngineConfig;
    groq?: LocalEngineConfig;
    mistral?: LocalEngineConfig;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const connectionStatusCache = new Map<
  EngineType,
  { status: ConnectionStatus; message: string; details?: string }
>();

class ConfigService {
  private config: ConfigSchema;

  constructor() {
    this.ensureDataDir();
    this.config = this.loadConfig();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadConfig(): ConfigSchema {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          apiKeys: {
            gemini: parsed?.apiKeys?.gemini || parsed?.motores?.gemini?.apiKey || '',
            groq: parsed?.apiKeys?.groq || parsed?.motores?.groq?.apiKey || '',
            mistral: parsed?.apiKeys?.mistral || parsed?.motores?.mistral?.apiKey || '',
          },
          general: parsed?.general || {},
          motores: parsed?.motores || {},
        };
      }
    } catch (err) {
      console.warn('Aviso: Não foi possível ler data/config.json, a inicializar configuração nova:', err);
    }
    return {
      apiKeys: { gemini: '', groq: '', mistral: '' },
      general: {},
      motores: {},
    };
  }

  private saveConfig() {
    try {
      this.ensureDataDir();
      const tmpFile = `${CONFIG_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.config, null, 2), 'utf-8');
      fs.renameSync(tmpFile, CONFIG_FILE);
    } catch (err) {
      console.error('Erro ao guardar data/config.json:', err);
    }
  }

  public getApiKey(engine: EngineType): string {
    const storedKey = this.config.apiKeys[engine]?.trim() || this.config.motores?.[engine]?.apiKey?.trim();
    if (storedKey) {
      return storedKey;
    }

    if (engine === 'gemini') return process.env.GEMINI_API_KEY?.trim() || '';
    if (engine === 'groq') return process.env.GROQ_API_KEY?.trim() || '';
    if (engine === 'mistral') return process.env.MISTRAL_API_KEY?.trim() || '';

    return '';
  }

  public getEffectiveApiKey(engine: EngineType): string {
    return this.getApiKey(engine);
  }

  public setApiKey(engine: EngineType, apiKey: string) {
    const trimmed = apiKey.trim();
    this.config.apiKeys[engine] = trimmed;
    if (!this.config.motores) this.config.motores = {};
    if (!this.config.motores[engine]) this.config.motores[engine] = {};
    this.config.motores[engine]!.apiKey = trimmed;
    this.saveConfig();
  }

  public updateEngineKey(engine: EngineType, apiKey: string) {
    this.setApiKey(engine, apiKey);
    return this.getEngineStatus(engine);
  }

  public getMaskedKey(key: string): string {
    const trimmed = key.trim();
    if (!trimmed) return '';
    if (trimmed.length <= 4) return '••••';
    return `••••••••${trimmed.slice(-4)}`;
  }

  public getEngineStatus(engine: EngineType): {
    configured: boolean;
    hasKey: boolean;
    isEnvKey: boolean;
    maskedKey: string;
    temChaveAmbiente: boolean;
  } {
    const storedKey = this.config.apiKeys[engine]?.trim() || this.config.motores?.[engine]?.apiKey?.trim();
    const envKey =
      engine === 'gemini'
        ? process.env.GEMINI_API_KEY?.trim()
        : engine === 'groq'
        ? process.env.GROQ_API_KEY?.trim()
        : process.env.MISTRAL_API_KEY?.trim();

    const activeKey = storedKey || envKey || '';
    const isEnv = !storedKey && !!envKey;

    return {
      configured: !!activeKey,
      hasKey: !!activeKey,
      isEnvKey: isEnv,
      maskedKey: this.getMaskedKey(activeKey),
      temChaveAmbiente: !!envKey,
    };
  }

  public getPublicEngineConfigs(): Record<EngineType, Partial<EngineConfig>> {
    const engines: EngineType[] = ['gemini', 'groq', 'mistral'];
    const res: Partial<Record<EngineType, Partial<EngineConfig>>> = {};

    for (const eng of engines) {
      const status = this.getEngineStatus(eng);
      const local = this.config.motores?.[eng] || {};
      const cachedConn = connectionStatusCache.get(eng);

      res[eng] = {
        hasKey: status.hasKey,
        isEnvKey: status.isEnvKey,
        maskedKey: status.maskedKey,
        apiKeyConfigurada: status.configured,
        temChaveAmbiente: status.temChaveAmbiente,
        ativo: local.ativo !== undefined ? local.ativo : true,
        prioridade: local.prioridade || (eng === 'gemini' ? 1 : eng === 'groq' ? 2 : 3),
        modeloPreferido: local.modeloPreferido || '',
        connectionStatus: cachedConn?.status || (status.hasKey ? 'valida' : 'nao_configurada'),
        statusMessage: cachedConn?.message || '',
      };
    }

    return res as Record<EngineType, Partial<EngineConfig>>;
  }

  public updateEngineSettings(
    engine: EngineType,
    settings: { ativo?: boolean; prioridade?: number; modeloPreferido?: string }
  ) {
    if (!this.config.motores) this.config.motores = {};
    if (!this.config.motores[engine]) this.config.motores[engine] = {};

    if (typeof settings.ativo === 'boolean') this.config.motores[engine]!.ativo = settings.ativo;
    if (typeof settings.prioridade === 'number') this.config.motores[engine]!.prioridade = settings.prioridade;
    if (settings.modeloPreferido !== undefined) this.config.motores[engine]!.modeloPreferido = settings.modeloPreferido;

    this.saveConfig();
    return this.getPublicEngineConfigs()[engine];
  }

  public updateGeneralSettings(settings: { localizacaoBase?: string; distanciaKmPadrao?: number; tempoCarroMaxMin?: number }) {
    if (!this.config.general) this.config.general = {};
    if (settings.localizacaoBase) this.config.general.localizacaoBase = settings.localizacaoBase;
    if (settings.distanciaKmPadrao) this.config.general.distanciaKmPadrao = settings.distanciaKmPadrao;
    if (settings.tempoCarroMaxMin) this.config.general.tempoCarroMaxMin = settings.tempoCarroMaxMin;
    this.saveConfig();
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
