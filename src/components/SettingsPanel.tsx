import {
  Key,
  ShieldCheck,
  Check,
  Save,
  Download,
  Upload,
  Cpu,
  MapPin,
  Car,
  FileSpreadsheet,
  Github,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import React, { useState } from 'react';
import { AppSettings, EngineConfig, EngineTask, EngineType } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onExportCsv: (tipo: 'ofertas' | 'empresas') => void;
  onImportCsv: (csvContent: string, tipo: 'ofertas' | 'empresas') => Promise<{ imported: number; total: number }>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSaveSettings,
  onExportCsv,
  onImportCsv,
}) => {
  const [localizacao, setLocalizacao] = useState(settings.localizacaoBase);
  const [distanciaPadrao, setDistanciaPadrao] = useState(settings.distanciaKmPadrao);
  const [tempoCarroMax, setTempoCarroMax] = useState(settings.tempoCarroMaxMin);

  // Engine toggles & models
  const [motores, setMotores] = useState<Record<EngineType, EngineConfig>>({ ...settings.motores });

  // Custom API keys entered in UI per engine
  const [keyInputs, setKeyInputs] = useState<Record<EngineType, string>>({
    gemini: '',
    groq: '',
    mistral: '',
  });
  const [savingKey, setSavingKey] = useState<Record<EngineType, boolean>>({
    gemini: false,
    groq: false,
    mistral: false,
  });
  const [testingEngine, setTestingEngine] = useState<Record<EngineType, boolean>>({
    gemini: false,
    groq: false,
    mistral: false,
  });
  const [testResults, setTestResults] = useState<
    Record<
      EngineType,
      {
        success: boolean;
        status: 'valid' | 'auth_error' | 'quota_error' | 'network_error' | 'service_unavailable' | string;
        message: string;
      } | null
    >
  >({
    gemini: null,
    groq: null,
    mistral: null,
  });

  // Routing tasks
  const [roteamento, setRoteamento] = useState({ ...settings.roteamento });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleToggleEngine = (id: EngineType) => {
    setMotores((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ativo: !prev[id].ativo,
      },
    }));
  };

  const handleUpdatePriority = (id: EngineType, prio: number) => {
    setMotores((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        prioridade: prio,
      },
    }));
  };

  const handleSaveKey = async (id: EngineType) => {
    try {
      setSavingKey((prev) => ({ ...prev, [id]: true }));
      const res = await fetch('/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine: id, apiKey: keyInputs[id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao guardar chave');

      setMotores((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          apiKeyConfigurada: data.configured,
          maskedKey: data.maskedKey,
        },
      }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.message || 'Erro ao guardar chave de API');
    } finally {
      setSavingKey((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleTestConnection = async (id: EngineType) => {
    try {
      setTestingEngine((prev) => ({ ...prev, [id]: true }));
      setTestResults((prev) => ({ ...prev, [id]: null }));
      const res = await fetch('/api/settings/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine: id, apiKey: keyInputs[id] || undefined }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: data.success,
          status: data.status,
          message: data.message,
        },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: false,
          status: 'network_error',
          message: `Erro ao comunicar com o servidor: ${err?.message || String(err)}`,
        },
      }));
    } finally {
      setTestingEngine((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Also save any typed keys if provided
      for (const id of ['gemini', 'groq', 'mistral'] as const) {
        if (keyInputs[id]?.trim()) {
          await fetch('/api/settings/keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ engine: id, apiKey: keyInputs[id] }),
          });
        }
      }

      await onSaveSettings({
        localizacaoBase: localizacao,
        distanciaKmPadrao: distanciaPadrao,
        tempoCarroMaxMin: tempoCarroMax,
        motores,
        roteamento,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'ofertas' | 'empresas') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          try {
            const res = await onImportCsv(text, tipo);
            setImportStatus(`Importação bem sucedida! ${res.imported} novos registos adicionados sem duplicações (${res.total} total na base de dados).`);
            setTimeout(() => setImportStatus(null), 5000);
          } catch (err: any) {
            setImportStatus(`Erro na importação: ${err?.message}`);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2 text-xs">
      {/* Editorial Title */}
      <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
            Painel de Configuração & Persistência
          </span>
          <h2 className="font-serif text-2xl font-normal text-neutral-900 mt-0.5">
            Definições do Sistema & Motores IA
          </h2>
          <p className="text-xs text-neutral-600 mt-1">
            Gere chaves de API, prioridade do router multi-engine, localização de mobilidade e cópia de segurança CSV.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1D1D1F] hover:bg-black text-white rounded-md text-xs font-medium tracking-wide uppercase transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          {saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaving ? 'A Guardar...' : saveSuccess ? 'Guardado com Sucesso' : 'Guardar Alterações'}</span>
        </button>
      </div>

      {importStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Mobility & Base Location */}
      <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 space-y-4">
        <h3 className="font-serif text-base font-medium text-neutral-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neutral-600" />
          <span>Localização Base & Critérios de Mobilidade</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-neutral-700 font-medium mb-1">
              Morada / Cidade Base do Candidato:
            </label>
            <input
              type="text"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Ex: Porto / Maia, Portugal"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-500 font-medium text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-neutral-700 font-medium mb-1">
              Raio Predefinido no Slider (km):
            </label>
            <select
              value={distanciaPadrao}
              onChange={(e) => setDistanciaPadrao(Number(e.target.value))}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-500 text-neutral-900"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={35}>35 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-700 font-medium mb-1">
              Tempo Máximo Deslocação Carro (min):
            </label>
            <select
              value={tempoCarroMax}
              onChange={(e) => setTempoCarroMax(Number(e.target.value))}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-500 text-neutral-900"
            >
              <option value={5}>≤ 5 minutos (Prioridade Máxima)</option>
              <option value={10}>≤ 10 minutos (Recomendado)</option>
              <option value={15}>≤ 15 minutos</option>
              <option value={20}>≤ 20 minutos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Multi-Engine Router Architecture */}
      <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
              Arquitetura Modular
            </span>
            <h3 className="font-serif text-base font-medium text-neutral-900 mt-0.5 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-neutral-600" />
              <span>Motores de Inteligência Artificial & Router com Fallback</span>
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            Nenhuma chamada é desperdiçada · Persistência Local em data/config.json
          </span>
        </div>

        {/* Engine Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              {
                id: 'gemini' as const,
                name: 'Google Gemini',
                label: 'Gemini',
                model: 'gemini-3.8-flash',
                desc: 'Motor primário nativo do ambiente AI Studio. Utilizado para pesquisa, raciocínio factual e elaboração de candidaturas.',
              },
              {
                id: 'groq' as const,
                name: 'Groq Cloud',
                label: 'Groq',
                model: 'llama-3.3-70b-versatile',
                desc: 'Inferência de alta velocidade com deteção automática de rate limit 429 e failover imediato para o próximo motor.',
              },
              {
                id: 'mistral' as const,
                name: 'Mistral AI',
                label: 'Mistral',
                model: 'mistral-small-latest',
                desc: 'Excelente capacidade linguística em português europeu e estruturação de dados de recrutamento.',
              },
            ] as const
          ).map((engine) => {
            const config = motores[engine.id];
            const hasKey = config?.apiKeyConfigurada || config?.temChaveAmbiente;
            return (
              <div
                key={engine.id}
                className="border border-neutral-200 rounded-md p-4 bg-neutral-50/50 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-neutral-900">{engine.name}</h4>
                      <p className="text-[11px] text-neutral-500 font-mono">{engine.model}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                        hasKey
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-neutral-200 text-neutral-700 border-neutral-300'
                      }`}
                    >
                      {hasKey ? (
                        <>
                          <ShieldCheck className="w-3 h-3" /> Configurado
                        </>
                      ) : (
                        'Sem Chave'
                      )}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-600 leading-relaxed">{engine.desc}</p>

                  {/* API Key Input & Action Block */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-200">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-medium text-neutral-700">
                        {engine.name} API Key:
                      </label>
                      {config?.maskedKey && (
                        <span className="text-[10px] font-mono text-neutral-500">
                          Guardada: <strong className="text-neutral-800">{config.maskedKey}</strong>
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      value={keyInputs[engine.id]}
                      onChange={(e) =>
                        setKeyInputs((prev) => ({ ...prev, [engine.id]: e.target.value }))
                      }
                      placeholder={`Colar ${engine.label} API Key aqui`}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-[11px] text-neutral-900 focus:outline-none focus:border-neutral-600 font-mono placeholder:font-sans placeholder:text-neutral-400"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleTestConnection(engine.id)}
                        disabled={testingEngine[engine.id]}
                        className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 rounded text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {testingEngine[engine.id] ? 'A testar...' : 'Testar ligação'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveKey(engine.id)}
                        disabled={savingKey[engine.id]}
                        className="px-3 py-1.5 bg-[#1D1D1F] hover:bg-black text-white rounded text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {savingKey[engine.id] ? 'A guardar...' : 'Guardar'}
                      </button>
                    </div>

                    {/* Test result feedback message */}
                    {testResults[engine.id] && (
                      <div
                        className={`p-2.5 rounded text-[11px] border mt-2 font-sans ${
                          testResults[engine.id]?.success
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : testResults[engine.id]?.status === 'quota_error'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : testResults[engine.id]?.status === 'service_unavailable'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                      >
                        <div className="font-semibold capitalize flex items-center gap-1.5">
                          {testResults[engine.id]?.success ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          <span>
                            {testResults[engine.id]?.status === 'valid' && 'Ligação Válida'}
                            {testResults[engine.id]?.status === 'auth_error' && 'Erro de Autenticação'}
                            {testResults[engine.id]?.status === 'quota_error' && 'Limite / Quota Atingido'}
                            {testResults[engine.id]?.status === 'network_error' && 'Erro de Rede'}
                            {testResults[engine.id]?.status === 'service_unavailable' && 'Serviço Indisponível'}
                          </span>
                        </div>
                        <p className="mt-0.5 leading-snug">{testResults[engine.id]?.message}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-200">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={config?.ativo || false}
                      onChange={() => handleToggleEngine(engine.id)}
                      className="rounded text-neutral-900 accent-[#1D1D1F]"
                    />
                    <span>Ativo</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-400 text-[10px]">Prioridade:</span>
                    <select
                      value={config?.prioridade || 1}
                      onChange={(e) => handleUpdatePriority(engine.id, Number(e.target.value))}
                      className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-[11px]"
                    >
                      <option value={1}>1 (Primário)</option>
                      <option value={2}>2 (Secundário)</option>
                      <option value={3}>3 (Fallback)</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Task routing matrix */}
        <div className="pt-2 border-t border-neutral-200">
          <h4 className="font-medium text-neutral-900 mb-2">
            Matriz de Encaminhamento por Tipo de Tarefa:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(
              [
                { id: 'pesquisa', label: 'Pesquisa & Prospecção' },
                { id: 'extraccao', label: 'Extração de Documentos' },
                { id: 'classificacao', label: 'Classificação de Compatibilidade' },
                { id: 'analise_perfil', label: 'Análise de CV / Portfólio' },
                { id: 'geracao_email', label: 'Geração de E-mail Executivo' },
              ] as const
            ).map((t) => {
              const current = roteamento[t.id as EngineTask];
              return (
                <div key={t.id} className="p-2.5 rounded bg-neutral-50 border border-neutral-200 text-[11px] space-y-1">
                  <span className="font-semibold text-neutral-800">{t.label}</span>
                  <div className="flex items-center gap-1 text-neutral-500">
                    <span className="capitalize">{current?.motorPrimario}</span>
                    <span>→</span>
                    <span className="capitalize">{current?.motorSecundario}</span>
                    <span>→</span>
                    <span className="capitalize">{current?.motorFallback}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CSV Persistence & Portability */}
      <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 space-y-4">
        <h3 className="font-serif text-base font-medium text-neutral-900 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-neutral-600" />
          <span>Cópia de Segurança & Exportação / Importação CSV</span>
        </h3>
        <p className="text-neutral-600 text-xs leading-relaxed">
          Os teus dados são guardados de forma persistente no servidor da aplicação. Podes também exportar a qualquer momento todos os dados para CSV ou importar novos registos com <strong>deduplicação automática</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export Group */}
          <div className="border border-neutral-200 rounded p-4 bg-neutral-50 space-y-3">
            <h4 className="font-medium text-neutral-900">Exportar Dados (CSV)</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onExportCsv('ofertas')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-neutral-800 font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Ofertas (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => onExportCsv('empresas')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-neutral-800 font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Empresas (CSV)</span>
              </button>
            </div>
          </div>

          {/* Import Group */}
          <div className="border border-neutral-200 rounded p-4 bg-neutral-50 space-y-3">
            <h4 className="font-medium text-neutral-900">Importar Dados sem Duplicações</h4>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded font-medium transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar Ofertas (CSV)</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileImport(e, 'ofertas')}
                  className="hidden"
                />
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded font-medium transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar Empresas (CSV)</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileImport(e, 'empresas')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Deployment & Versioning Ready */}
      <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 space-y-3">
        <h3 className="font-serif text-base font-medium text-neutral-900 flex items-center gap-2">
          <Github className="w-4 h-4 text-neutral-600" />
          <span>Pronto para GitHub & Google AI Studio</span>
        </h3>
        <p className="text-neutral-600 text-xs leading-relaxed">
          A aplicação está estruturada de forma 100% modular, sem chaves secretas codificadas no repositório. Podes exportar para o GitHub ou clonar livremente. A base de dados em <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-[11px]">data/db.json</code> mantém todos os registos intactos em cada atualização e a configuração de chaves fica segura em <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-[11px]">data/config.json</code>.
        </p>
      </div>
    </div>
  );
};
