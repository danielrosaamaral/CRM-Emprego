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
  Pencil,
  Check,
  X,
  FileText,
} from 'lucide-react';
import React, { useState } from 'react';
import { JobOffer, OfferStatus } from '../types';
import { formatDatePt, getStatusBadgeStyle } from '../utils';

interface JobOffersListProps {
  offers: JobOffer[];
  onOpenEmail: (offer: JobOffer) => void;
  onUpdateStatus: (id: string, status: OfferStatus) => void;
  onOpenGoogleSearch: (query: string) => void;
  onUpdateOffer?: (id: string, updates: Partial<JobOffer>) => Promise<JobOffer>;
}

export const JobOffersList: React.FC<JobOffersListProps> = ({
  offers,
  onOpenEmail,
  onUpdateStatus,
  onOpenGoogleSearch,
  onUpdateOffer,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    empresa: '',
    funcao: '',
    localizacao: '',
    urlOferta: '',
    email: '',
    notas: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleStartEdit = (offer: JobOffer) => {
    setEditingId(offer.id);
    setEditForm({
      empresa: offer.empresa || '',
      funcao: offer.funcao || '',
      localizacao: offer.localizacao || '',
      urlOferta: offer.urlOferta || '',
      email: offer.contactoRelevante?.email || offer.email || '',
      notas: offer.notas || '',
    });
    setSaveError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSaveError(null);
  };

  const handleSaveEdit = async (offer: JobOffer) => {
    if (!editForm.empresa.trim() || !editForm.funcao.trim()) {
      setSaveError('Empresa e Função são campos obrigatórios.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const updates: Partial<JobOffer> = {
        empresa: editForm.empresa.trim(),
        funcao: editForm.funcao.trim(),
        localizacao: editForm.localizacao.trim(),
        urlOferta: editForm.urlOferta.trim(),
        fontesUrls: offer.fontesUrls && offer.fontesUrls.length > 0
          ? Array.from(new Set([editForm.urlOferta.trim(), ...offer.fontesUrls].filter(Boolean)))
          : (editForm.urlOferta.trim() ? [editForm.urlOferta.trim()] : undefined),
        notas: editForm.notas.trim(),
        contactoRelevante: offer.contactoRelevante
          ? {
              ...offer.contactoRelevante,
              email: editForm.email.trim() || undefined,
            }
          : editForm.email.trim()
          ? {
              nome: 'Contacto',
              cargo: 'Recrutamento',
              email: editForm.email.trim(),
              verificado: false,
            }
          : undefined,
      };

      if (onUpdateOffer) {
        await onUpdateOffer(offer.id, updates);
      } else {
        const res = await fetch(`/api/offers/${offer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Falha ao guardar alterações');
      }

      setEditingId(null);
    } catch (err: any) {
      setSaveError(err?.message || 'Erro ao guardar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  if (offers.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-neutral-900 rounded-lg border border-neutral-800">
        <p className="text-base font-semibold text-neutral-300 mb-2">
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
        const isEditing = editingId === offer.id;

        return (
          <article
            key={offer.id}
            className={`bg-neutral-900 border ${
              isEditing ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-neutral-800'
            } rounded-lg p-5 transition-all hover:border-neutral-700 shadow-xs`}
          >
            {isEditing ? (
              /* Inline Edit Form */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base text-neutral-100">
                      Editar Registo da Oferta
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">
                      ID: {offer.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(offer)}
                      disabled={isSaving}
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      {isSaving ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>

                {saveError && (
                  <div className="p-2.5 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/80 rounded">
                    {saveError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Empresa *
                    </label>
                    <input
                      type="text"
                      value={editForm.empresa}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, empresa: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Função *
                    </label>
                    <input
                      type="text"
                      value={editForm.funcao}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, funcao: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                      placeholder="Função ou cargo"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Localização
                    </label>
                    <input
                      type="text"
                      value={editForm.localizacao}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, localizacao: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                      placeholder="ex: Porto / Matosinhos"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Contacto / E-mail
                    </label>
                    <input
                      type="text"
                      value={editForm.email}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                      placeholder="ex: recrutamento@empresa.pt"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      URL Principal da Oferta
                    </label>
                    <input
                      type="url"
                      value={editForm.urlOferta}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, urlOferta: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 font-mono text-xs placeholder:text-neutral-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Notas
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.notas}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, notas: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 resize-y placeholder:text-neutral-500"
                      placeholder="Notas internas ou observações sobre a oferta..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Display View */
              <>
                {/* Header: Company, Role & Status */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-neutral-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-neutral-100 tracking-tight">
                        {offer.funcao}
                      </h3>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {statusStyle.label}
                      </span>
                      {offer.dataEnviado && (
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                          Enviado em {formatDatePt(offer.dataEnviado)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
                      <span className="font-medium text-neutral-200">{offer.empresa}</span>
                      <span className="flex items-center gap-1 text-neutral-400">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                        {offer.localizacao} ({offer.distanciaKm} km
                        {offer.tempoCarroMin ? ` · ~${offer.tempoCarroMin} min de carro` : ''})
                      </span>
                      {offer.dataOferta && (
                        <span className="flex items-center gap-1 text-neutral-400">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          Oferta: {formatDatePt(offer.dataOferta)}
                        </span>
                      )}
                      <span className="text-neutral-500">
                        Encontrada: {formatDatePt(offer.dataEncontrado)}
                      </span>
                    </div>
                  </div>

                  {/* Compatibility Score Pill */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs font-mono font-medium">
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
                        <li key={idx} className="flex items-start gap-2 text-neutral-300">
                          <span className="text-neutral-500 select-none">•</span>
                          <span>{razao}</span>
                        </li>
                      ))}
                    </ul>
                    {offer.resumoRequisitos && (
                      <p className="text-neutral-400 italic pt-1 border-t border-neutral-800 text-[11px]">
                        Requisitos: {offer.resumoRequisitos}
                      </p>
                    )}

                    {/* Notas, se existirem */}
                    {offer.notas && (
                      <div className="mt-2 text-xs bg-amber-950/40 border border-amber-800/50 rounded p-2 text-amber-200 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-amber-100">Notas:</span> {offer.notas}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Contact & Verification */}
                  <div className="md:col-span-5 bg-neutral-800/60 rounded-md p-3 border border-neutral-700/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono text-neutral-400">
                      <span>Pessoa / Contacto Relevante</span>
                      {offer.contactoRelevante ? (
                        offer.contactoRelevante.verificado ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <ShieldCheck className="w-3 h-3" /> Verificado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-400">
                            <ShieldAlert className="w-3 h-3" /> Não Verificado
                          </span>
                        )
                      ) : (
                        <span className="text-neutral-500">Não Identificado</span>
                      )}
                    </div>

                    {offer.contactoRelevante ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-neutral-100">
                          {offer.contactoRelevante.nome}
                        </p>
                        <p className="text-neutral-400 text-[11px]">{offer.contactoRelevante.cargo}</p>
                        {offer.contactoRelevante.email && (
                          <p className="text-neutral-300 font-mono text-[11px]">
                            {offer.contactoRelevante.email}
                          </p>
                        )}
                        {offer.contactoRelevante.linkedin && (
                          <a
                            href={offer.contactoRelevante.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline text-[11px]"
                          >
                            Ver Perfil no LinkedIn
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-neutral-400">
                        <p className="text-[11px]">Contacto direto não identificado na oferta pública.</p>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenGoogleSearch(`site:linkedin.com/in "${offer.empresa}" recursos humanos`)
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:text-blue-300 underline cursor-pointer"
                        >
                          <Search className="w-3 h-3" />
                          Procurar RH de {offer.empresa} no LinkedIn
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Row: Source Links & Primary Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-neutral-800">
                  {/* External Links */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                    {offer.fontesUrls && offer.fontesUrls.length > 1 ? (
                      offer.fontesUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-neutral-300 hover:text-neutral-100 underline font-medium"
                          title={url}
                        >
                          <span>Fonte {idx + 1}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))
                    ) : offer.urlOferta ? (
                      <a
                        href={offer.urlOferta}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-neutral-300 hover:text-neutral-100 underline font-medium"
                      >
                        <span>Ver Oferta</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : null}
                    {offer.websiteEmpresa && (
                      <a
                        href={offer.websiteEmpresa}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-neutral-400 hover:text-neutral-200"
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
                        className="inline-flex items-center gap-1 text-neutral-400 hover:text-neutral-200"
                      >
                        <span>LinkedIn Empresa</span>
                      </a>
                    )}
                  </div>

                  {/* Action Buttons: Edit, E-mail & Status Changes */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Inline Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(offer)}
                      title="Editar detalhes da oferta"
                      className="px-2.5 py-1 text-xs border border-neutral-700 text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Editar</span>
                    </button>

                    {/* Status Switcher Dropdown */}
                    <select
                      value={offer.estado}
                      onChange={(e) => onUpdateStatus(offer.id, e.target.value as OfferStatus)}
                      className="text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-200 cursor-pointer focus:outline-none focus:border-blue-500"
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
                        className="px-2.5 py-1 text-xs border border-emerald-700/80 text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 rounded transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Marcar Enviado</span>
                      </button>
                    )}

                    {/* Primary Button: Prepare Email */}
                    <button
                      type="button"
                      onClick={() => onOpenEmail(offer)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>E-mail</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </article>
        );
      })}
    </div>
  );
};
