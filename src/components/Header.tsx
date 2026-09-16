import { Briefcase, Building2, BookOpen, Settings2, Sparkles, CheckCircle2 } from 'lucide-react';
import React from 'react';
import { EngineConfig } from '../types';

interface HeaderProps {
  activeTab: 'ofertas' | 'espontaneas' | 'perfil' | 'definicoes';
  onTabChange: (tab: 'ofertas' | 'espontaneas' | 'perfil' | 'definicoes') => void;
  counts: {
    ofertasNovas: number;
    ofertasTotal: number;
    espontaneasNovas: number;
    espontaneasTotal: number;
    enviadosTotal: number;
  };
  activeEngineName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  counts,
  activeEngineName = 'Gemini 3.8 Flash',
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-xs sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center text-lg font-bold tracking-tight shadow-xs shadow-blue-500/20">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight text-neutral-100">
                  Gestão de Candidaturas
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Senior Designer · 25a
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Branding · Packaging · Editorial · Marketing & SEO
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 md:pb-0" aria-label="Navegação Principal">
            <button
              id="tab-btn-ofertas"
              onClick={() => onTabChange('ofertas')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'ofertas'
                  ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Ofertas de Emprego</span>
              {counts.ofertasNovas > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeTab === 'ofertas'
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                  }`}
                >
                  {counts.ofertasNovas}
                </span>
              )}
            </button>

            <button
              id="tab-btn-espontaneas"
              onClick={() => onTabChange('espontaneas')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'espontaneas'
                  ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Candidaturas Espontâneas</span>
              {counts.espontaneasNovas > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeTab === 'espontaneas'
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                  }`}
                >
                  {counts.espontaneasNovas}
                </span>
              )}
            </button>

            <button
              id="tab-btn-perfil"
              onClick={() => onTabChange('perfil')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Base de Conhecimento</span>
            </button>

            <button
              id="tab-btn-definicoes"
              onClick={() => onTabChange('definicoes')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'definicoes'
                  ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Definições & APIs</span>
            </button>
          </nav>

          {/* Quick Engine Indicator & Sent counter */}
          <div className="hidden lg:flex items-center space-x-3 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-800/80 border border-neutral-700">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-[11px] font-mono text-neutral-300">{activeEngineName}</span>
            </div>
            {counts.enviadosTotal > 0 && (
              <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{counts.enviadosTotal} enviados</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
