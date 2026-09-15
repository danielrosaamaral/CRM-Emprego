import { X, ExternalLink, Copy, Check, Search } from 'lucide-react';
import React, { useState } from 'react';

interface QuickSearchModalProps {
  query: string;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ query, onClose }) => {
  const [copied, setCopied] = useState(false);

  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGoogle = () => {
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full border border-neutral-300 shadow-xl overflow-hidden text-xs">
        <div className="px-5 py-3.5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-neutral-600" />
            <h3 className="font-serif text-sm font-semibold text-neutral-900">
              Pesquisa Focada no LinkedIn
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-neutral-600 leading-relaxed">
            Utiliza este operador de pesquisa avançada para encontrar imediatamente os perfis públicos de decisão no LinkedIn sem necessidade de conta Premium:
          </p>

          <div className="p-3 bg-neutral-100 rounded-md border border-neutral-200 font-mono text-[11px] text-neutral-900 break-all select-all">
            {query}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar Termo'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenGoogle}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#1D1D1F] hover:bg-black text-white font-medium transition-colors cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir no Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
