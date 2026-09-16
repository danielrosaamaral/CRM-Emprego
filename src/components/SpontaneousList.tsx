import {
  Car,
  ExternalLink,
  Mail,
  CheckCircle,
  Copy,
  MapPin,
  Building,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Search,
  Globe,
  ParkingCircle,
  AlertCircle,
  Check,
} from 'lucide-react';
import React, { useState } from 'react';
import { OfferStatus, SpontaneousCompany } from '../types';
import { formatDatePt, getStatusBadgeStyle } from '../utils';

interface SpontaneousListProps {
  companies: SpontaneousCompany[];
  onOpenEmail: (company: SpontaneousCompany) => void;
  onUpdateStatus: (id: string, status: OfferStatus) => void;
  onOpenGoogleSearch: (query: string) => void;
}

export const SpontaneousList: React.FC<SpontaneousListProps> = ({
  companies,
  onOpenEmail,
  onUpdateStatus,
  onOpenGoogleSearch,
}) => {
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const handleCopy = (query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedQuery(query);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  if (companies.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-neutral-900 rounded-lg border border-neutral-800">
        <p className="text-base text-neutral-300 font-medium mb-2">
          Nenhuma empresa encontrada com os critérios de deslocação actuais.
        </p>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Ajusta o tempo máximo de condução ou o raio no slider de distância, ou clica em "Actualizar" para descobrir novas empresas industriais e comerciais.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {companies.map((company) => {
        const statusStyle = getStatusBadgeStyle(company.estado);
        const isPriorityDrive = company.tempoDeslocacaoCarroMin <= 5;

        return (
          <article
            key={company.id}
            className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-5 transition-all hover:border-neutral-700 shadow-sm"
          >
            {/* Header: Company Name, Economic Scale & Driving Time */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-neutral-100 tracking-tight">
                    {company.nome}
                  </h2>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {company.sector}
                  </span>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                  >
                    {statusStyle.label}
                  </span>
                  {company.dataEnviado && (
                    <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      Enviado em {formatDatePt(company.dataEnviado)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
                  <span className="flex items-center gap-1 text-neutral-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    {company.localizacao} ({company.distanciaKm} km)
                  </span>
                  <span className="flex items-center gap-1 text-neutral-400 font-mono">
                    <TrendingUp className="w-3.5 h-3.5 text-neutral-500" />
                    {company.dimensaoEconomica}
                  </span>
                </div>
              </div>

              {/* Driving Time & Commute Indicator */}
              <div className="flex sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border ${
                    isPriorityDrive
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  <span>~{company.tempoDeslocacaoCarroMin} min de carro</span>
                </div>
                {isPriorityDrive && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50">
                    ★ Prioridade Máxima (≤ 5 min)
                  </span>
                )}
              </div>
            </div>

            {/* Commute Details: Traffic & Parking */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2 text-[11px] bg-neutral-800/50 px-3 rounded mt-2.5 border border-neutral-700/60 text-neutral-400">
              <span className="flex items-center gap-1">
                <ParkingCircle className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-neutral-200">Estacionamento:</span> {company.notasEstacionamento}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-neutral-200">Trânsito Habitual:</span>
                <span className="capitalize text-neutral-300">{company.nivelTransito}</span>
              </span>
            </div>

            {/* Middle Row: Strategic Reason & Relevant Persons */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3.5 text-xs">
              {/* Left Column: Why This Is a Great Spontaneous Application */}
              <div className="md:col-span-7 space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-400">
                  Razão Estratégica para Candidatura Espontânea:
                </div>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  {company.razaoCandidatura}
                </p>
                <p className="text-[11px] text-neutral-500 font-mono pt-1">
                  Encontrada no sistema: {formatDatePt(company.dataEncontrado)}
                </p>
              </div>

              {/* Right Column: Relevant Key Decision Makers */}
              <div className="md:col-span-5 bg-neutral-800/70 rounded-md p-3 border border-neutral-700/60 space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono text-neutral-400">
                  <span>Pessoas de Contacto Relevantes</span>
                  <span className="text-[10px] text-neutral-500">Ordem de Prioridade</span>
                </div>

                <div className="space-y-2">
                  {company.pessoasRelevantes.map((pessoa, idx) => (
                    <div key={idx} className="border-b border-neutral-800 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-100 text-xs">{pessoa.nome}</span>
                        {pessoa.verificado ? (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono">
                            <ShieldCheck className="w-3 h-3" /> Verificado
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-mono">
                            <ShieldAlert className="w-3 h-3" /> A validar
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        {pessoa.cargo}
                        <span className="text-neutral-500 ml-1 text-[10px] font-mono">
                          (P{pessoa.prioridade})
                        </span>
                      </p>
                      {pessoa.email && (
                        <p className="text-blue-300 font-mono text-[11px] mt-0.5">{pessoa.email}</p>
                      )}
                      {pessoa.linkedin && (
                        <a
                          href={pessoa.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 underline mt-0.5"
                        >
                          LinkedIn
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* Google Search Ready-to-copy queries */}
                {company.pesquisasGoogleSugeridas && company.pesquisasGoogleSugeridas.length > 0 && (
                  <div className="pt-2 border-t border-neutral-700/60">
                    <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1 flex items-center gap-1">
                      <Search className="w-3 h-3 text-blue-400" />
                      <span>Pesquisas Google LinkedIn (1-clique para copiar):</span>
                    </div>
                    <div className="space-y-1">
                      {company.pesquisasGoogleSugeridas.map((query, qIdx) => (
                        <div
                          key={qIdx}
                          className="flex items-center justify-between gap-1 text-[10px] font-mono bg-neutral-900/80 p-1.5 rounded border border-neutral-700 text-neutral-300"
                        >
                          <span className="truncate" title={query}>{query}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopy(query)}
                              className="p-1 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                              title="Copiar termo de pesquisa"
                            >
                              {copiedQuery === query ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-blue-400 hover:text-blue-300 cursor-pointer"
                              title="Abrir pesquisa no Google em nova tab"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Row: External Links & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-neutral-800">
              {/* External Links */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Website Oficial</span>
                  </a>
                )}
                {company.linkedin && (
                  <a
                    href={company.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-neutral-400 hover:text-neutral-200"
                  >
                    <span>LinkedIn da Empresa</span>
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Switcher Dropdown */}
                <select
                  value={company.estado}
                  onChange={(e) => onUpdateStatus(company.id, e.target.value as OfferStatus)}
                  className="text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-200 cursor-pointer focus:outline-none focus:border-blue-500"
                  aria-label="Alterar estado da candidatura espontânea"
                >
                  <option value="novo">Novo</option>
                  <option value="visto">Visto</option>
                  <option value="preparada">Candidatura Preparada</option>
                  <option value="enviado">Enviado</option>
                  <option value="ignorado">Ignorado</option>
                </select>

                {/* Mark Sent button */}
                {company.estado !== 'enviado' && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(company.id, 'enviado')}
                    className="px-2.5 py-1 text-xs border border-emerald-700/60 text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/80 rounded transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Marcar Enviado</span>
                  </button>
                )}

                {/* Prepare Email button */}
                <button
                  type="button"
                  onClick={() => onOpenEmail(company)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-mail</span>
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
