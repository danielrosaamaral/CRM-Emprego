import {
  X,
  Send,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Paperclip,
  MailCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import { JobOffer, SpontaneousCompany } from '../types';
import { createGmailComposeUrl, createMailtoUrl } from '../utils';

interface EmailModalProps {
  item: JobOffer | SpontaneousCompany;
  type: 'oferta' | 'espontanea';
  initialRecipient: string;
  initialSubject: string;
  initialBody: string;
  onClose: () => void;
  onMarkAsSent: (id: string) => void;
  onRegenerate: () => Promise<{ assunto: string; corpo: string; destinatario: string }>;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  item,
  type,
  initialRecipient,
  initialSubject,
  initialBody,
  onClose,
  onMarkAsSent,
  onRegenerate,
}) => {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasMarkedSent, setHasMarkedSent] = useState(item.estado === 'enviado');

  const entityName = 'empresa' in item ? item.empresa : item.nome;
  const entitySubtitle = 'funcao' in item ? item.funcao : item.dimensaoEconomica;

  const handleOpenGmail = () => {
    const url = createGmailComposeUrl(recipient, subject, body);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenMailto = () => {
    const url = createMailtoUrl(recipient, subject, body);
    window.location.href = url;
  };

  const handleCopyAll = () => {
    const fullText = `Para: ${recipient}\nAssunto: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTriggerRegenerate = async () => {
    try {
      setIsRegenerating(true);
      const res = await onRegenerate();
      if (res.assunto) setSubject(res.assunto);
      if (res.corpo) setBody(res.corpo);
      if (res.destinatario) setRecipient(res.destinatario);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleConfirmSent = () => {
    onMarkAsSent(item.id);
    setHasMarkedSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-lg max-w-3xl w-full border border-neutral-300 shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-200 text-neutral-800">
                {type === 'oferta' ? 'Resposta a Oferta' : 'Candidatura Espontânea'}
              </span>
              <h2 className="font-serif text-lg font-semibold text-neutral-900 tracking-tight">
                Preparação de E-mail: {entityName}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">{entitySubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form Fields */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Recipient Field */}
          <div>
            <label className="block font-medium text-neutral-700 mb-1">
              Destinatário (E-mail):
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. recrutamento@empresa.pt ou nome@empresa.pt"
              className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-500 font-mono text-neutral-900"
            />
            {!recipient && (
              <p className="text-[11px] text-amber-700 mt-1">
                Aviso: Nenhum e-mail público foi verificado. Podes introduzir o e-mail manualmente ou selecionar no Gmail ao enviar.
              </p>
            )}
          </div>

          {/* Subject Field */}
          <div>
            <label className="block font-medium text-neutral-700 mb-1">
              Assunto:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-500 font-medium text-neutral-900"
            />
          </div>

          {/* Body Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-neutral-700">
                Corpo da Mensagem (Factual, baseado no CV e Portfólio de 25 anos):
              </label>
              <button
                type="button"
                onClick={handleTriggerRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>Regenerar Texto com IA</span>
              </button>
            </div>

            <textarea
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full text-xs p-3.5 bg-neutral-50 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-500 font-sans leading-relaxed text-neutral-900 whitespace-pre-wrap selection:bg-neutral-200"
            />
          </div>

          {/* Notice about attachments */}
          <div className="flex items-center gap-2 p-2.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 text-[11px]">
            <Paperclip className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span>
              <strong>Lembrete importante:</strong> Não te esqueças de anexar o teu ficheiro <strong>CV</strong> e <strong>Portfólio</strong> no Gmail antes de premir Enviar.
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 text-xs font-medium transition-colors cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            {hasMarkedSent ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 px-2 py-1 bg-emerald-50 rounded border border-emerald-200">
                <MailCheck className="w-3.5 h-3.5" /> Marcado como Enviado
              </span>
            ) : (
              <button
                type="button"
                onClick={handleConfirmSent}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-medium transition-colors cursor-pointer"
              >
                <MailCheck className="w-3.5 h-3.5" />
                <span>Marcar Enviado</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenMailto}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 text-xs font-medium transition-colors cursor-pointer"
              title="Abrir no cliente de e-mail predefinido do sistema operacional"
            >
              <span>mailto</span>
            </button>

            <button
              type="button"
              onClick={handleOpenGmail}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-[#1D1D1F] hover:bg-black text-white text-xs font-medium tracking-wide transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Abrir no Gmail</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
