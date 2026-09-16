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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-lg max-w-lg w-full border border-neutral-700 shadow-2xl overflow-hidden text-xs">
        <div className="px-5 py-3.5 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-neutral-100">
              Pesquisa Focada no LinkedIn
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-neutral-800 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-neutral-300 leading-relaxed">
            Utiliza este operador de pesquisa avançada para encontrar imediatamente os perfis públicos de decisão no LinkedIn sem necessidade de conta Premium:
          </p>

          <div className="p-3 bg-neutral-950 rounded-md border border-neutral-800 font-mono text-[11px] text-blue-300 break-all select-all">
            {query}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-neutral-700 text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
            <span>{copied ? 'Copiado' : 'Copiar Termo'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenGoogle}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#2563EB] hover:bg-blue-600 text-white font-medium transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir no Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
