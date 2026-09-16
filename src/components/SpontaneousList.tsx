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
  Edit2,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { OfferStatus, SpontaneousCompany } from '../types';
import { formatDatePt, getStatusBadgeStyle } from '../utils';

interface SpontaneousListProps {
  companies: SpontaneousCompany[];
  onOpenEmail: (company: SpontaneousCompany) => void;
  onUpdateStatus: (id: string, status: OfferStatus) => void;
  onOpenGoogleSearch: (query: string) => void;
  onUpdateCompany?: (id: string, updates: Partial<SpontaneousCompany>) => Promise<SpontaneousCompany>;
}

export const SpontaneousList: React.FC<SpontaneousListProps> = ({
  companies,
  onOpenEmail,
  onUpdateStatus,
  onOpenGoogleSearch,
  onUpdateCompany,
}) => {
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nome: '',
    localizacao: '',
    distanciaKm: 5,
    tempoDeslocacaoCarroMin: 5,
    website: '',
    linkedin: '',
    dimensaoEconomica: '',
    sector: 'indústria' as SpontaneousCompany['sector'],
    notasEstacionamento: '',
    razaoCandidatura: '',
    contactoNome: '',
    contactoEmail: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleStartEdit = (company: SpontaneousCompany) => {
    setEditingId(company.id);
    setEditForm({
      nome: company.nome || '',
      localizacao: company.localizacao || '',
      distanciaKm: company.distanciaKm ?? 5,
      tempoDeslocacaoCarroMin: company.tempoDeslocacaoCarroMin ?? 5,
      website: company.website || '',
      linkedin: company.linkedin || '',
      dimensaoEconomica: company.dimensaoEconomica || '',
      sector: company.sector || 'indústria',
      notasEstacionamento: company.notasEstacionamento || '',
      razaoCandidatura: company.razaoCandidatura || '',
      contactoNome: company.pessoasRelevantes?.[0]?.nome || '',
      contactoEmail: company.pessoasRelevantes?.[0]?.email || '',
    });
    setSaveError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSaveError(null);
  };

  const handleSaveEdit = async (company: SpontaneousCompany) => {
    if (!editForm.nome.trim()) {
      setSaveError('O nome da empresa é obrigatório.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const updates: Partial<SpontaneousCompany> = {
        nome: editForm.nome.trim(),
        localizacao: editForm.localizacao.trim(),
        distanciaKm: Number(editForm.distanciaKm) || company.distanciaKm,
        tempoDeslocacaoCarroMin: Number(editForm.tempoDeslocacaoCarroMin) || company.tempoDeslocacaoCarroMin,
        website: editForm.website.trim(),
        linkedin: editForm.linkedin.trim(),
        dimensaoEconomica: editForm.dimensaoEconomica.trim(),
        sector: editForm.sector,
        notasEstacionamento: editForm.notasEstacionamento.trim(),
        razaoCandidatura: editForm.razaoCandidatura.trim(),
      };

      if (editForm.contactoEmail || editForm.contactoNome) {
        const currentPersons = company.pessoasRelevantes ? [...company.pessoasRelevantes] : [];
        if (currentPersons.length > 0) {
          currentPersons[0] = {
            ...currentPersons[0],
            nome: editForm.contactoNome.trim() || currentPersons[0].nome,
            email: editForm.contactoEmail.trim() || undefined,
          };
        } else {
          currentPersons.push({
            nome: editForm.contactoNome.trim() || 'Contacto',
            cargo: 'Recrutamento / Direção',
            prioridade: 1,
            email: editForm.contactoEmail.trim() || undefined,
            verificado: false,
          });
        }
        updates.pessoasRelevantes = currentPersons;
      }

      if (onUpdateCompany) {
        await onUpdateCompany(company.id, updates);
      } else {
        const res = await fetch(`/api/companies/${company.id}`, {
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

  const handleCopy = (query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedQuery(query);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  if (companies.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-neutral-900 rounded-lg border border-neutral-800">
        <p className="text-base font-semibold text-neutral-200 mb-2">
          Nenhuma empresa encontrada com os critérios de deslocação actuais.
        </p>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
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
        const isEditing = editingId === company.id;

        return (
          <article
            key={company.id}
            className={`bg-neutral-900 border ${
              isEditing ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-neutral-800'
            } rounded-lg p-5 transition-all hover:border-neutral-700 shadow-xs`}
          >
            {isEditing ? (
              /* Inline Edit Form for Spontaneous Company */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base text-neutral-100">
                      Editar Candidatura Espontânea
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">
                      ID: {company.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(company)}
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
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      value={editForm.nome}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, nome: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                      placeholder="Nome da empresa"
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
                      placeholder="Ex: Maia, Zona Industrial"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Website Oficial
                    </label>
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, website: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                      placeholder="https://exemplo.pt"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      LinkedIn da Empresa
                    </label>
                    <input
                      type="url"
                      value={editForm.linkedin}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, linkedin: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                      placeholder="https://linkedin.com/company/exemplo"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Dimensão Económica
                    </label>
                    <input
                      type="text"
                      value={editForm.dimensaoEconomica}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, dimensaoEconomica: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                      placeholder="Ex: Faturação > €10M, 80 colaboradores"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Sector
                    </label>
                    <select
                      value={editForm.sector}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, sector: e.target.value as any }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="indústria">Indústria</option>
                      <option value="alimentar">Alimentar</option>
                      <option value="distribuição">Distribuição</option>
                      <option value="tecnologia">Tecnologia</option>
                      <option value="farmacêutico">Farmacêutico</option>
                      <option value="serviços">Serviços</option>
                      <option value="produção">Produção</option>
                      <option value="sustentável">Sustentável</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Contacto Relevante (Nome)
                    </label>
                    <input
                      type="text"
                      value={editForm.contactoNome}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contactoNome: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                      placeholder="Ex: Dr. António Costa"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      E-mail de Contacto
                    </label>
                    <input
                      type="email"
                      value={editForm.contactoEmail}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contactoEmail: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                      placeholder="geral@exemplo.pt"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Notas de Estacionamento / Acesso
                    </label>
                    <input
                      type="text"
                      value={editForm.notasEstacionamento}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, notasEstacionamento: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                      placeholder="Ex: Estacionamento privativo no piso térreo"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Razão Estratégica para Candidatura
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.razaoCandidatura}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, razaoCandidatura: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-blue-500 resize-y placeholder:text-neutral-500"
                      placeholder="Razão estratégica e alinhamento de perfil..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
            {/* Header: Company Name, Economic Scale & Driving Time */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-neutral-100 tracking-tight">
                    {company.nome}
                  </h3>
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
                  <span className="flex items-center gap-1 text-neutral-400 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    {company.localizacao} ({company.distanciaKm} km)
                  </span>
                  <span className="flex items-center gap-1 text-neutral-300 font-mono">
                    <TrendingUp className="w-3.5 h-3.5 text-neutral-500" />
                    {company.dimensaoEconomica}
                  </span>
                </div>
              </div>

              {/* Driving Time & Commute Indicator */}
              <div className="flex sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium ${
                    isPriorityDrive
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                      : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                  }`}
                >
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  <span>~{company.tempoDeslocacaoCarroMin} min de carro</span>
                </div>
                {isPriorityDrive && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    ★ Prioridade Máxima (≤ 5 min)
                  </span>
                )}
              </div>
            </div>

            {/* Commute Details: Traffic & Parking */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2 text-[11px] bg-neutral-800/50 px-3 rounded mt-2.5 border border-neutral-800 text-neutral-400">
              <span className="flex items-center gap-1">
                <ParkingCircle className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-medium text-neutral-300">Estacionamento:</span> {company.notasEstacionamento}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-neutral-300">Trânsito Habitual:</span>
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
                <p className="text-neutral-300 leading-relaxed text-xs">
                  {company.razaoCandidatura}
                </p>
                <p className="text-[11px] text-neutral-500 font-mono pt-1">
                  Encontrada no sistema: {formatDatePt(company.dataEncontrado)}
                </p>
              </div>

              {/* Right Column: Relevant Key Decision Makers */}
              <div className="md:col-span-5 bg-neutral-800/40 rounded-md p-3 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono text-neutral-400">
                  <span>Pessoas de Contacto Relevantes</span>
                  <span className="text-[10px] text-neutral-500">Ordem de Prioridade</span>
                </div>

                <div className="space-y-2">
                  {company.pessoasRelevantes.map((pessoa, idx) => (
                    <div key={idx} className="border-b border-neutral-800 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-200 text-xs">{pessoa.nome}</span>
                        {pessoa.verificado ? (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono">
                            <ShieldCheck className="w-3 h-3" /> Verificado
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-mono">
                            <ShieldAlert className="w-3 h-3" /> Não Verificado
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
                        <p className="text-neutral-300 font-mono text-[11px] mt-0.5">{pessoa.email}</p>
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
                  <div className="pt-2 border-t border-neutral-800">
                    <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1 flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      <span>Pesquisas Google LinkedIn (1-clique para copiar):</span>
                    </div>
                    <div className="space-y-1">
                      {company.pesquisasGoogleSugeridas.map((query, qIdx) => (
                        <div
                          key={qIdx}
                          className="flex items-center justify-between gap-1 text-[10px] font-mono bg-neutral-800 p-1 rounded border border-neutral-700 text-neutral-300"
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
                            <button
                              type="button"
                              onClick={() => onOpenGoogleSearch(query)}
                              className="p-1 text-neutral-400 hover:text-neutral-200 cursor-pointer"
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-neutral-800">
              {/* External Links */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-neutral-300 hover:text-white underline font-medium"
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
                  className="text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-200 cursor-pointer focus:outline-none focus:border-neutral-500"
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
                    className="px-2.5 py-1 text-xs border border-emerald-800/60 text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 rounded transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Marcar Enviado</span>
                  </button>
                )}

                {/* Edit details button */}
                <button
                  type="button"
                  onClick={() => handleStartEdit(company)}
                  className="px-2.5 py-1 text-xs border border-neutral-700 text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors cursor-pointer flex items-center gap-1"
                  aria-label="Editar registo da empresa"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Editar</span>
                </button>

                {/* Prepare Email button */}
                <button
                  type="button"
                  onClick={() => onOpenEmail(company)}
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
