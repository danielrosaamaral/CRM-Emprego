import {
  UploadCloud,
  FileText,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Quote,
  Layers,
  BookOpen,
  Calendar,
  Briefcase,
  Award,
} from 'lucide-react';
import React, { useState } from 'react';
import { KnowledgeDocument, RecallResult } from '../types';
import { formatDatePt } from '../utils';

interface KnowledgeBaseProps {
  documents: KnowledgeDocument[];
  onUploadFile: (file: File, tipo: 'cv' | 'portfolio') => Promise<void>;
  onRecallQuestion: (question: string) => Promise<RecallResult>;
  isUploading: boolean;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({
  documents,
  onUploadFile,
  onRecallQuestion,
  isUploading,
}) => {
  const [recallInput, setRecallInput] = useState('');
  const [recallResult, setRecallResult] = useState<RecallResult | null>(null);
  const [isRecalling, setIsRecalling] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const sampleQuestions = [
    'O que sabes sobre a minha experiência em branding?',
    'Que experiência tenho em packaging alimentar?',
    'Que clientes relevantes aparecem no meu portfólio?',
    'Como se aplica a minha experiência em SEO e Google Ads?',
  ];

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, tipo: 'cv' | 'portfolio') => {
    e.preventDefault();
    setUploadError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      try {
        await onUploadFile(file, tipo);
      } catch (err: any) {
        setUploadError(err?.message || 'Erro no upload do documento');
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'cv' | 'portfolio') => {
    setUploadError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        await onUploadFile(file, tipo);
      } catch (err: any) {
        setUploadError(err?.message || 'Erro no upload do documento');
      }
    }
  };

  const executeRecall = async (questionToAsk: string) => {
    if (!questionToAsk.trim()) return;
    try {
      setIsRecalling(true);
      setRecallInput(questionToAsk);
      const res = await onRecallQuestion(questionToAsk);
      setRecallResult(res);
    } catch (err: any) {
      setRecallResult({
        pergunta: questionToAsk,
        resposta: `Erro ao consultar a base de conhecimento: ${err?.message}`,
        fontes: [],
      });
    } finally {
      setIsRecalling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Intro Note */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
              Base de Conhecimento Estruturada
            </span>
            <h2 className="text-xl font-semibold text-neutral-100 mt-1">
              Perfil Profissional & Documentação Factual
            </h2>
            <p className="text-xs text-neutral-400 mt-2 max-w-3xl leading-relaxed">
              Carrega o teu <strong>Curriculum Vitae</strong> e <strong>Portfólio</strong>. A aplicação analisa os documentos, extrai competências, anos de experiência e projetos comprovados. Testa a base de conhecimento com a ferramenta <em>Search / Recall</em> para verificar as citações e garantir que nenhuma informação é inventada nos e-mails.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-3xl font-bold text-neutral-100">25</span>
            <span className="text-[11px] text-neutral-500 uppercase tracking-wide">Anos de Carreira</span>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-950/60 border border-red-800/80 text-red-200 px-4 py-3 rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Upload Zones Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CV Upload */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'cv')}
          className="bg-neutral-900/90 border-2 border-dashed border-neutral-700 hover:border-blue-500 rounded-lg p-6 text-center transition-colors flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-medium text-neutral-200">
              Curriculum Vitae (CV)
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Arrasta e solta o ficheiro PDF ou clica para substituir
            </p>
          </div>
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white text-xs rounded font-medium transition-colors shadow-sm shadow-blue-500/20">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isUploading ? 'A Carregar...' : 'Selecionar Ficheiro CV'}</span>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => handleFileChange(e, 'cv')}
              className="hidden"
            />
          </label>
        </div>

        {/* Portfolio Upload */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'portfolio')}
          className="bg-neutral-900/90 border-2 border-dashed border-neutral-700 hover:border-blue-500 rounded-lg p-6 text-center transition-colors flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-medium text-neutral-200">
              Portfólio de Trabalhos
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Arrasta e solta o ficheiro PDF ou clica para substituir
            </p>
          </div>
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white text-xs rounded font-medium transition-colors shadow-sm shadow-blue-500/20">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isUploading ? 'A Carregar...' : 'Selecionar Ficheiro Portfólio'}</span>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => handleFileChange(e, 'portfolio')}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Indexed Documents Details */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
        <h3 className="text-base font-medium text-neutral-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span>Documentos Atualmente Indexados no Sistema ({documents.length})</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border border-neutral-800 rounded-md p-4 bg-neutral-950/70 space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="uppercase font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-semibold border border-neutral-700">
                      {doc.tipo}
                    </span>
                    <span className="font-medium text-neutral-200">{doc.nomeFicheiro}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Atualizado em {formatDatePt(doc.dataUpload)} · {Math.round(doc.tamanhoBytes / 1024)} KB
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>

              <p className="text-neutral-300 leading-relaxed text-[11px] italic">
                "{doc.resumoExtraido}"
              </p>

              {/* Extracted Tags */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-800">
                <div className="text-[10px] font-mono uppercase text-neutral-400">
                  Competências e Especialidades Extraídas:
                </div>
                <div className="flex flex-wrap gap-1">
                  {doc.entidadesExtraidas.competencias.map((comp, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px]"
                    >
                      {comp}
                    </span>
                  ))}
                  {doc.entidadesExtraidas.sectores.map((sec, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/60 text-[10px]"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search / Recall Tool */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
            Ferramenta de Validação & Consulta
          </span>
          <h3 className="text-lg font-medium text-neutral-100 mt-0.5 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            <span>Search / Recall Factual</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Faz perguntas ao motor de conhecimento para testar se os teus documentos foram lidos com rigor e ver as fontes exactas.
          </p>
        </div>

        {/* Preset sample questions */}
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => executeRecall(q)}
              className="text-[11px] font-mono px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-md transition-colors cursor-pointer text-left"
            >
              "{q}"
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex gap-2">
          <input
            id="recall-question-input"
            type="text"
            value={recallInput}
            onChange={(e) => setRecallInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeRecall(recallInput)}
            placeholder="Ex: Que projetos de packaging alimentar aparecem no meu portfólio?"
            className="flex-1 text-xs px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:border-blue-500 text-neutral-100 placeholder-neutral-500"
          />
          <button
            type="button"
            onClick={() => executeRecall(recallInput)}
            disabled={isRecalling || !recallInput.trim()}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-sm shadow-blue-500/20"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isRecalling ? 'animate-spin' : 'text-amber-300'}`} />
            <span>{isRecalling ? 'A Consultar...' : 'Testar Recall'}</span>
          </button>
        </div>

        {/* Recall Output Display */}
        {recallResult && (
          <div className="border border-neutral-800 bg-neutral-950 rounded-lg p-5 space-y-4 animate-fade-in text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wide">
                Resposta Factual:
              </span>
              <p className="text-neutral-200 text-xs leading-relaxed font-sans whitespace-pre-wrap">
                {recallResult.resposta}
              </p>
            </div>

            {/* Citations / Sources */}
            {recallResult.fontes && recallResult.fontes.length > 0 && (
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Quote className="w-3 h-3 text-blue-400" />
                  <span>Fontes Comprovadas na Documentação ({recallResult.fontes.length}):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recallResult.fontes.map((fonte, idx) => (
                    <div
                      key={idx}
                      className="bg-neutral-900 p-2.5 rounded border border-neutral-800 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-neutral-400">
                        <span className="font-semibold text-neutral-200">{fonte.documento}</span>
                        <span className="text-neutral-500">{fonte.seccao}</span>
                      </div>
                      <p className="text-neutral-300 italic">"{fonte.evidencia}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
