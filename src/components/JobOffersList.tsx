import {
  ExternalLink,
  Mail,
  CheckCircle,
  Eye,
  XCircle,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Search,
  Globe,
  Clock,
} from 'lucide-react';
import React from 'react';
import { JobOffer, OfferStatus } from '../types.js';
import { formatDatePt, getStatusBadgeStyle } from '../utils.js';

interface JobOffersListProps {
  offers: JobOffer[];
  onOpenEmail: (offer: JobOffer) => void;
  onUpdateStatus: (id: string, status: OfferStatus) => void;
  onOpenGoogleSearch: (query: string) => void;
}

export const JobOffersList: React.FC<JobOffersListProps> = ({
  offers,
  onOpenEmail,
  onUpdateStatus,
  onOpenGoogleSearch,
}) => {
  if (offers.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-lg border border-neutral-200">
        <p className="font-serif text-lg text-neutral-600 mb-2">
          Nenhuma oferta de emprego encontrada para os filtros atuais.
        </p>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Experimenta aumentar o raio no slider de distância no topo ou clica em "Actualizar" para pesquisar novas oportunidades.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => {
        const statusStyle = getStatusBadgeStyle(offer.estado);

        return (
          <article
            key={offer.id}
            className="bg-white border border-[#E5E5EA] rounded-lg p-5 transition-all hover:border-neutral-300 shadow-xs"
          >
            {/* Header: Company, Role & Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-neutral-100">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif text-lg font-semibold text-[#1D1D1F] tracking-tight">
                    {offer.funcao}
                  </h3>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                  >
                    {statusStyle.label}
                  </span>
                  {offer.dataEnviado && (
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Enviado em {formatDatePt(offer.dataEnviado)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
                  <span className="font-medium text-neutral-900">{offer.empresa}</span>
                  <span className="flex items-center gap-1 text-neutral-500">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {offer.localizacao} ({offer.distanciaKm} km
                    {offer.tempoCarroMin ? ` · ~${offer.tempoCarroMin} min de carro` : ''})
                  </span>
                  {offer.dataOferta && (
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Oferta: {formatDatePt(offer.dataOferta)}
                    </span>
                  )}
                  <span className="text-neutral-400">
                    Encontrada: {formatDatePt(offer.dataEncontrado)}
                  </span>
                </div>
              </div>

              {/* Compatibility Score Pill */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 text-white text-xs font-mono font-medium">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{offer.grauCompatibilidade}% compatível</span>
                </div>
                <span className="text-[10px] text-neutral-400">25 anos de experiência</span>
              </div>
            </div>

            {/* Middle Row: Links & Contact & Compatibility Reasons */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3.5 text-xs">
              {/* Left Column: Key Compatibility Reasons */}
              <div className="md:col-span-7 space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-400">
                  Principais Razões de Compatibilidade Factual:
                </div>
                <ul className="space-y-1">
                  {offer.razoesCompatibilidade.map((razao, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-neutral-700">
                      <span className="text-neutral-400 select-none">•</span>
                      <span>{razao}</span>
                    </li>
                  ))}
                </ul>
                {offer.resumoRequisitos && (
                  <p className="text-neutral-500 italic pt-1 border-t border-neutral-100 text-[11px]">
                    Requisitos: {offer.resumoRequisitos}
                  </p>
                )}
              </div>

              {/* Right Column: Contact & Verification */}
              <div className="md:col-span-5 bg-neutral-50 rounded-md p-3 border border-neutral-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono text-neutral-500">
                  <span>Pessoa / Contacto Relevante</span>
                  {offer.contactoRelevante ? (
                    offer.contactoRelevante.verificado ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <ShieldCheck className="w-3 h-3" /> Verificado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-700">
                        <ShieldAlert className="w-3 h-3" /> Não Verificado
                      </span>
                    )
                  ) : (
                    <span className="text-neutral-400">Não Identificado</span>
                  )}
                </div>

                {offer.contactoRelevante ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-neutral-900">
                      {offer.contactoRelevante.nome}
                    </p>
                    <p className="text-neutral-600 text-[11px]">{offer.contactoRelevante.cargo}</p>
                    {offer.contactoRelevante.email && (
                      <p className="text-neutral-700 font-mono text-[11px]">
                        {offer.contactoRelevante.email}
                      </p>
                    )}
                    {offer.contactoRelevante.linkedin && (
                      <a
                        href={offer.contactoRelevante.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-neutral-700 hover:text-neutral-900 underline text-[11px]"
                      >
                        Ver Perfil no LinkedIn
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 text-neutral-500">
                    <p className="text-[11px]">Contacto direto não identificado na oferta pública.</p>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenGoogleSearch(`site:linkedin.com/in "${offer.empresa}" recursos humanos`)
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-700 hover:text-neutral-950 underline cursor-pointer"
                    >
                      <Search className="w-3 h-3" />
                      Procurar RH de {offer.empresa} no LinkedIn
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Row: Source Links & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-neutral-100">
              {/* External Links */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                {offer.urlOferta && (
                  <a
                    href={offer.urlOferta}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-neutral-800 hover:text-neutral-950 underline font-medium"
                  >
                    <span>Ver Oferta</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {offer.websiteEmpresa && (
                  <a
                    href={offer.websiteEmpresa}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-900"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Website</span>
                  </a>
                )}
                {offer.linkedinEmpresa && (
                  <a
                    href={offer.linkedinEmpresa}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-900"
                  >
                    <span>LinkedIn Empresa</span>
                  </a>
                )}
              </div>

              {/* Action Buttons: E-mail & Status Changes */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Switcher Dropdown */}
                <select
                  value={offer.estado}
                  onChange={(e) => onUpdateStatus(offer.id, e.target.value as OfferStatus)}
                  className="text-xs bg-white border border-neutral-200 rounded px-2 py-1 text-neutral-700 cursor-pointer focus:outline-none focus:border-neutral-400"
                  aria-label="Alterar estado da oferta"
                >
                  <option value="novo">Novo</option>
                  <option value="visto">Visto</option>
                  <option value="preparada">Candidatura Preparada</option>
                  <option value="enviado">Enviado</option>
                  <option value="ignorado">Ignorado</option>
                </select>

                {/* Mark as sent quick action */}
                {offer.estado !== 'enviado' && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(offer.id, 'enviado')}
                    title="Marcar como Enviado"
                    className="px-2.5 py-1 text-xs border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Marcar Enviado</span>
                  </button>
                )}

                {/* Primary Button: Prepare Email */}
                <button
                  type="button"
                  onClick={() => onOpenEmail(offer)}
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
