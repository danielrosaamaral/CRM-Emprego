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
      <div className="text-center py-16 px-4 bg-white rounded-lg border border-neutral-200">
        <p className="text-base font-semibold text-neutral-700 mb-2">
          Nenhuma empresa encontrada com os critérios de deslocação actuais.
        </p>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Ajusta o tempo máximo de condução ou o raio no slider de distância, ou clica em "Actualizar" para descobrir novas empresas industriais e comerciais.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {companies.map((company) => {
        const statusStyle = getStatusBadgeStyle(company.estado);
        const isPriorityDrive = company.tempoDeslocacaoCarroMin <= 5;

        return (
          <article
            key={company.id}
            className="bg-white border border-[#E5E5EA] rounded-lg p-5 transition-all hover:border-neutral-300 shadow-xs"
          >
            {/* Header: Company Name, Economic Scale & Driving Time */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-neutral-100">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">
                    {company.nome}
                  </h3>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                    {company.sector}
                  </span>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                  >
                    {statusStyle.label}
                  </span>
                  {company.dataEnviado && (
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Enviado em {formatDatePt(company.dataEnviado)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
                  <span className="flex items-center gap-1 text-neutral-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {company.localizacao} ({company.distanciaKm} km)
                  </span>
                  <span className="flex items-center gap-1 text-neutral-700 font-mono">
                    <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
                    {company.dimensaoEconomica}
                  </span>
                </div>
              </div>

              {/* Driving Time & Commute Indicator */}
              <div className="flex sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium ${
                    isPriorityDrive
                      ? 'bg-emerald-900 text-white'
                      : 'bg-neutral-800 text-white'
                  }`}
                >
                  <Car className="w-3.5 h-3.5 text-emerald-300" />
                  <span>~{company.tempoDeslocacaoCarroMin} min de carro</span>
                </div>
                {isPriorityDrive && (
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    ★ Prioridade Máxima (≤ 5 min)
                  </span>
                )}
              </div>
            </div>

            {/* Commute Details: Traffic & Parking */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2 text-[11px] bg-neutral-50 px-3 rounded mt-2.5 border border-neutral-200/60 text-neutral-600">
              <span className="flex items-center gap-1">
                <ParkingCircle className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-medium text-neutral-800">Estacionamento:</span> {company.notasEstacionamento}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-neutral-800">Trânsito Habitual:</span>
                <span className="capitalize">{company.nivelTransito}</span>
              </span>
            </div>

            {/* Middle Row: Strategic Reason & Relevant Persons */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3.5 text-xs">
              {/* Left Column: Why This Is a Great Spontaneous Application */}
              <div className="md:col-span-7 space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-400">
                  Razão Estratégica para Candidatura Espontânea:
                </div>
                <p className="text-neutral-700 leading-relaxed text-xs">
                  {company.razaoCandidatura}
                </p>
                <p className="text-[11px] text-neutral-400 font-mono pt-1">
                  Encontrada no sistema: {formatDatePt(company.dataEncontrado)}
                </p>
              </div>

              {/* Right Column: Relevant Key Decision Makers */}
              <div className="md:col-span-5 bg-neutral-50 rounded-md p-3 border border-neutral-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono text-neutral-500">
                  <span>Pessoas de Contacto Relevantes</span>
                  <span className="text-[10px] text-neutral-400">Ordem de Prioridade</span>
                </div>

                <div className="space-y-2">
                  {company.pessoasRelevantes.map((pessoa, idx) => (
                    <div key={idx} className="border-b border-neutral-200/60 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900 text-xs">{pessoa.nome}</span>
                        {pessoa.verificado ? (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 font-mono">
                            <ShieldCheck className="w-3 h-3" /> Verificado
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-700 font-mono">
                            <ShieldAlert className="w-3 h-3" /> Não Verificado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600">
                        {pessoa.cargo}
                        <span className="text-neutral-400 ml-1 text-[10px] font-mono">
                          (P{pessoa.prioridade})
                        </span>
                      </p>
                      {pessoa.email && (
                        <p className="text-neutral-700 font-mono text-[11px] mt-0.5">{pessoa.email}</p>
                      )}
                      {pessoa.linkedin && (
                        <a
                          href={pessoa.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-700 hover:text-neutral-950 underline mt-0.5"
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
                  <div className="pt-2 border-t border-neutral-200/80">
                    <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1 flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      <span>Pesquisas Google LinkedIn (1-clique para copiar):</span>
                    </div>
                    <div className="space-y-1">
                      {company.pesquisasGoogleSugeridas.map((query, qIdx) => (
                        <div
                          key={qIdx}
                          className="flex items-center justify-between gap-1 text-[10px] font-mono bg-white p-1 rounded border border-neutral-200 text-neutral-700"
                        >
                          <span className="truncate" title={query}>{query}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopy(query)}
                              className="p-1 text-neutral-500 hover:text-neutral-900 cursor-pointer"
                              title="Copiar termo de pesquisa"
                            >
                              {copiedQuery === query ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenGoogleSearch(query)}
                              className="p-1 text-neutral-500 hover:text-neutral-900 cursor-pointer"
                              title="Abrir pesquisa no Google"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Row: External Links & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-neutral-100">
              {/* External Links */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-neutral-800 hover:text-neutral-950 underline font-medium"
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
                    className="inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-900"
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
                  className="text-xs bg-white border border-neutral-200 rounded px-2 py-1 text-neutral-700 cursor-pointer focus:outline-none focus:border-neutral-400"
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
                    className="px-2.5 py-1 text-xs border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Marcar Enviado</span>
                  </button>
                )}

                {/* Prepare Email button */}
                <button
                  type="button"
                  onClick={() => onOpenEmail(company)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
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
