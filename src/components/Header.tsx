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
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-8 h-8 rounded-md bg-[#2563EB] text-white flex items-center justify-center font-sans text-sm font-bold tracking-tight shadow-sm shadow-blue-500/20">
              CRM
            </div>
            <div>
              <h1 className="font-sans text-base font-semibold tracking-tight text-neutral-100">
                Gestão de Candidaturas
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto" aria-label="Navegação Principal">
            <button
              id="tab-btn-ofertas"
              onClick={() => onTabChange('ofertas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'ofertas'
                  ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/30'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Ofertas de Emprego</span>
              {counts.ofertasNovas > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'ofertas'
                      ? 'bg-amber-300 text-neutral-950'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {counts.ofertasNovas}
                </span>
              )}
            </button>

            <button
              id="tab-btn-espontaneas"
              onClick={() => onTabChange('espontaneas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'espontaneas'
                  ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/30'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Candidaturas Espontâneas</span>
              {counts.espontaneasNovas > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'espontaneas'
                      ? 'bg-amber-300 text-neutral-950'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {counts.espontaneasNovas}
                </span>
              )}
            </button>

            <button
              id="tab-btn-perfil"
              onClick={() => onTabChange('perfil')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/30'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Base de Conhecimento</span>
            </button>

            <button
              id="tab-btn-definicoes"
              onClick={() => onTabChange('definicoes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'definicoes'
                  ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/30'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Definições</span>
            </button>
          </nav>

          {/* Sent counter */}
          {counts.enviadosTotal > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 text-emerald-400 text-xs font-medium px-2 py-1 rounded bg-emerald-950/50 border border-emerald-800/50">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{counts.enviadosTotal} enviados</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
