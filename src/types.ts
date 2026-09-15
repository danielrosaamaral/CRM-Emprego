export type OfferStatus = 'novo' | 'visto' | 'preparada' | 'enviado' | 'ignorado';

export interface JobOffer {
  id: string;
  empresa: string;
  funcao: string;
  localizacao: string;
  distanciaKm: number;
  tempoCarroMin?: number;
  dataOferta: string;
  urlOferta: string;
  websiteEmpresa: string;
  linkedinEmpresa?: string;
  contactoRelevante?: {
    nome: string;
    cargo: string;
    linkedin?: string;
    email?: string;
    verificado: boolean;
  };
  grauCompatibilidade: number; // 0 to 100
  razoesCompatibilidade: string[];
  estado: OfferStatus;
  dataEncontrado: string;
  dataEnviado?: string;
  resumoRequisitos?: string;
  sector?: string;
  emailPreparado?: {
    assunto: string;
    corpo: string;
    dataGeracao: string;
  };
  emailGerado?: {
    assunto: string;
    corpo: string;
    dataGeracao: string;
  };
}

export interface SpontaneousCompany {
  id: string;
  nome: string;
  localizacao: string;
  distanciaKm: number;
  tempoDeslocacaoCarroMin: number; // real driving time
  nivelTransito: 'baixo' | 'moderado' | 'elevado';
  notasEstacionamento: string;
  website: string;
  linkedin: string;
  dimensaoEconomica: string; // e.g. "Faturação > €15M, ~120 colaboradores"
  sector: 'indústria' | 'alimentar' | 'distribuição' | 'tecnologia' | 'farmacêutico' | 'serviços' | 'produção' | 'sustentável' | 'outro';
  pessoasRelevantes: Array<{
    nome: string;
    cargo: string;
    prioridade: 1 | 2 | 3 | 4 | 5; // 1: marketing/comms, 2: RH, 3: director, 4: CEO, 5: proprietario
    linkedin?: string;
    email?: string;
    verificado: boolean;
  }>;
  razaoCandidatura: string;
  pesquisasGoogleSugeridas: string[];
  estado: OfferStatus;
  dataEncontrado: string;
  dataEnviado?: string;
  emailPreparado?: {
    assunto: string;
    corpo: string;
    dataGeracao: string;
  };
  emailGerado?: {
    assunto: string;
    corpo: string;
    dataGeracao: string;
  };
}

export interface KnowledgeDocument {
  id: string;
  tipo: 'cv' | 'portfolio' | 'certificacoes' | 'outro';
  nomeFicheiro: string;
  tamanhoBytes: number;
  dataUpload: string;
  resumoExtraido: string;
  conteudoTexto?: string;
  entidadesExtraidas: {
    competencias: string[];
    anosExperiencia: number;
    sectores: string[];
    clientesRelevantes: string[];
    ferramentas: string[];
    especialidades: string[];
  };
}

export interface RecallResult {
  pergunta: string;
  resposta: string;
  fontes: Array<{
    documento: string;
    seccao: string;
    evidencia: string;
  }>;
}

export type EngineType = 'gemini' | 'groq' | 'mistral';

export type ConnectionStatus = 'nao_configurada' | 'valida' | 'invalida' | 'erro_ligacao';

export interface EngineConfig {
  id: EngineType;
  nome: string;
  ativo: boolean;
  prioridade: number; // 1 = primário, 2 = secundário, 3 = fallback
  modeloPreferido: string;
  apiKeyConfigurada: boolean;
  temChaveAmbiente: boolean;
  limiteAtingido: boolean;
  ultimosErros?: string;
  hasKey?: boolean;
  isEnvKey?: boolean;
  maskedKey?: string;
  connectionStatus?: ConnectionStatus;
  statusMessage?: string;
}

export type EngineTask = 'pesquisa' | 'extraccao' | 'classificacao' | 'analise_perfil' | 'geracao_email';

export interface TaskEngineRouting {
  tarefa: EngineTask;
  motorPrimario: EngineType;
  motorSecundario: EngineType;
  motorFallback: EngineType;
}

export interface AppSettings {
  localizacaoBase: string; // e.g. "Maia, Porto, Portugal"
  distanciaKmPadrao: number; // 5, 10, 20
  tempoCarroMaxMin: number; // default 10
  motores: Record<EngineType, EngineConfig>;
  roteamento: Record<EngineTask, TaskEngineRouting>;
}

export interface AppStatePayload {
  ofertas: JobOffer[];
  empresas: SpontaneousCompany[];
  documentos: KnowledgeDocument[];
  definicoes: AppSettings;
}

export interface AppDataResponse {
  ofertas: JobOffer[];
  empresas: SpontaneousCompany[];
  documentos: KnowledgeDocument[];
  definicoes: AppSettings;
  historicoEmails?: Record<string, { assunto: string; corpo: string; dataGeracao: string }>;
}
