import React, { useEffect, useMemo, useState } from 'react';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { JobOffersList } from './components/JobOffersList';
import { KnowledgeBase } from './components/KnowledgeBase';
import { QuickSearchModal } from './components/QuickSearchModal';
import { SettingsPanel } from './components/SettingsPanel';
import { SpontaneousList } from './components/SpontaneousList';
import { EmailModal } from './components/EmailModal';
import {
  AppDataResponse,
  AppSettings,
  JobOffer,
  KnowledgeDocument,
  OfferStatus,
  RecallResult,
  SpontaneousCompany,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'ofertas' | 'espontaneas' | 'perfil' | 'definicoes'>('ofertas');
  const [distanceKm, setDistanceKm] = useState<number>(10);
  const [geoMode, setGeoMode] = useState<'nacional' | 'internacional'>('nacional');
  const [maxCarMinutes, setMaxCarMinutes] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<'todos' | OfferStatus>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [companies, setCompanies] = useState<SpontaneousCompany[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Email modal state
  const [selectedEmailItem, setSelectedEmailItem] = useState<{
    item: JobOffer | SpontaneousCompany;
    type: 'oferta' | 'espontanea';
    assunto: string;
    corpo: string;
    destinatario: string;
  } | null>(null);

  // Quick Google Search modal state
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | null>(null);

  // Load initial application data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Falha ao contactar o servidor');
      const data: AppDataResponse = await res.json();
      setOffers(data.ofertas || []);
      setCompanies(data.empresas || []);
      setDocuments(data.documentos || []);
      setSettings(data.definicoes);
      if (data.definicoes?.distanciaKmPadrao) {
        setDistanceKm(data.definicoes.distanciaKmPadrao);
      }
      if (data.definicoes?.tempoCarroMaxMin) {
        setMaxCarMinutes(data.definicoes.tempoCarroMaxMin);
      }
      if (data.definicoes?.modoGeografico) {
        setGeoMode(data.definicoes.modoGeografico);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      showNotice('Erro ao carregar dados do servidor local.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotice = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Refresh trigger (searches for new items and deduplicates)
  const handleRefresh = async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      if (activeTab === 'ofertas') {
        const res = await fetch('/api/search/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: settings?.localizacaoBase || 'Rua Garcia de Orta, 6, 2780-113 Oeiras, Portugal',
            maxKm: distanceKm,
          }),
        });
        const data = await res.json();
        if (data.offers) {
          setOffers(data.offers);
          showNotice(
            data.added > 0
              ? `${data.added} nova(s) oferta(s) encontrada(s) e adicionada(s) à base de dados.`
              : 'Pesquisa concluída: todas as ofertas atuais já se encontravam na base de dados.',
            'success'
          );
        }
      } else if (activeTab === 'espontaneas') {
        const res = await fetch('/api/search/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: settings?.localizacaoBase || 'Rua Garcia de Orta, 6, 2780-113 Oeiras, Portugal',
            maxMinutes: maxCarMinutes,
          }),
        });
        const data = await res.json();
        if (data.companies) {
          setCompanies(data.companies);
          showNotice(
            data.added > 0
              ? `${data.added} nova(s) empresa(s) para candidatura espontânea adicionada(s).`
              : 'Pesquisa concluída: nenhuma nova empresa identificada neste lote.',
            'success'
          );
        }
      }
    } catch (err: any) {
      console.error('Erro ao atualizar:', err);
      showNotice('Erro durante a pesquisa e atualização de dados.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update status
  const handleUpdateStatus = async (id: string, newStatus: OfferStatus) => {
    const isOffer = offers.some((o) => o.id === id);
    const endpoint = isOffer ? `/api/offers/${id}/status` : `/api/companies/${id}/status`;
    const dataEnviado = newStatus === 'enviado' ? new Date().toISOString().split('T')[0] : undefined;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus, dataEnviado }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar estado');

      if (isOffer) {
        setOffers((prev) =>
          prev.map((o) => (o.id === id ? { ...o, estado: newStatus, dataEnviado: dataEnviado || o.dataEnviado } : o))
        );
      } else {
        setCompanies((prev) =>
          prev.map((c) => (c.id === id ? { ...c, estado: newStatus, dataEnviado: dataEnviado || c.dataEnviado } : c))
        );
      }
      showNotice(`Estado alterado para "${newStatus}".`, 'info');
    } catch (err: any) {
      console.error('Erro ao atualizar estado:', err);
      showNotice('Erro ao atualizar estado na base de dados.', 'error');
    }
  };

  // Open Email Preparer Modal
  const handleOpenEmail = async (item: JobOffer | SpontaneousCompany) => {
    const isOffer = 'empresa' in item;
    const type = isOffer ? 'oferta' : 'espontanea';

    // If item already has a prepared email, show it; otherwise call generator
    const existingEmail = item.emailGerado;
    let initialRecipient = '';
    if (isOffer) {
      initialRecipient = (item as JobOffer).contactoRelevante?.email || '';
    } else {
      const person = (item as SpontaneousCompany).pessoasRelevantes.find((p) => p.email);
      initialRecipient = person?.email || '';
    }

    if (existingEmail && existingEmail.corpo) {
      setSelectedEmailItem({
        item,
        type,
        assunto: existingEmail.assunto,
        corpo: existingEmail.corpo,
        destinatario: initialRecipient,
      });
      return;
    }

    try {
      showNotice('A preparar e-mail factual com IA...', 'info');
      const res = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, item }),
      });
      if (!res.ok) throw new Error('Falha ao gerar e-mail');
      const email = await res.json();

      setSelectedEmailItem({
        item,
        type,
        assunto: email.assunto,
        corpo: email.corpo,
        destinatario: email.destinatario || initialRecipient,
      });

      // Update state in memory
      if (isOffer) {
        setOffers((prev) =>
          prev.map((o) =>
            o.id === item.id
              ? {
                  ...o,
                  estado: o.estado === 'novo' ? 'preparada' : o.estado,
                  emailGerado: {
                    assunto: email.assunto,
                    corpo: email.corpo,
                    dataGeracao: new Date().toISOString(),
                  },
                }
              : o
          )
        );
      } else {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === item.id
              ? {
                  ...c,
                  estado: c.estado === 'novo' ? 'preparada' : c.estado,
                  emailGerado: {
                    assunto: email.assunto,
                    corpo: email.corpo,
                    dataGeracao: new Date().toISOString(),
                  },
                }
              : c
          )
        );
      }
    } catch (err: any) {
      console.error('Erro na geração de e-mail:', err);
      showNotice('Erro ao gerar e-mail personalizado.', 'error');
    }
  };

  // Regenerate email inside modal
  const handleRegenerateEmail = async (): Promise<{ assunto: string; corpo: string; destinatario: string }> => {
    if (!selectedEmailItem) {
      return { assunto: '', corpo: '', destinatario: '' };
    }
    const res = await fetch('/api/email/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: selectedEmailItem.type,
        item: selectedEmailItem.item,
      }),
    });
    if (!res.ok) throw new Error('Erro ao regenerar');
    return await res.json();
  };

  // Upload CV or Portfolio
  const handleUploadFile = async (file: File, tipo: 'cv' | 'portfolio') => {
    try {
      setIsUploading(true);
      showNotice(`A carregar e extrair ${file.name}...`, 'info');

      // Read content as text or base64
      const textContent = await file.text();

      const res = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          nomeFicheiro: file.name,
          conteudoTexto: textContent || `Ficheiro ${file.name} carregado com sucesso.`,
          tamanhoBytes: file.size,
        }),
      });

      if (!res.ok) throw new Error('Erro ao indexar ficheiro no servidor');
      const data = await res.json();
      setDocuments(data.todosDocumentos);
      showNotice(`Documento "${file.name}" analisado e indexado com sucesso!`, 'success');
    } finally {
      setIsUploading(false);
    }
  };

  // Recall question test bench
  const handleRecallQuestion = async (pergunta: string): Promise<RecallResult> => {
    const res = await fetch('/api/knowledge/recall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pergunta }),
    });
    if (!res.ok) throw new Error('Erro na consulta de conhecimento');
    return await res.json();
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (!res.ok) throw new Error('Falha ao guardar definições');
    const data = await res.json();
    setSettings(data.definicoes);
    showNotice('Definições atualizadas com sucesso.', 'success');
  };

  // CSV Export
  const handleExportCsv = (tipo: 'ofertas' | 'empresas') => {
    window.location.href = `/api/export/csv?tipo=${tipo}`;
  };

  // CSV Import
  const handleImportCsv = async (csvContent: string, tipo: 'ofertas' | 'empresas') => {
    const res = await fetch('/api/import/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: csvContent, tipo }),
    });
    if (!res.ok) throw new Error('Erro ao importar CSV');
    const data = await res.json();
    if (tipo === 'ofertas') {
      setOffers(data.data.ofertas);
    } else {
      setCompanies(data.data.empresas);
    }
    return { imported: data.imported, total: data.total };
  };

  // Filtered Job Offers based on geo mode, master distance slider and status
  const filteredOffers = useMemo(() => {
    const list = offers.filter((o) => {
      // Geo mode filter
      if (geoMode === 'internacional') {
        if (!o.isInternacional) return false;
      } else {
        // Nacional: skip international offers; apply distance filter
        if (o.isInternacional) return false;
        if (typeof o.distanciaKm === 'number' && distanceKm > 0 && o.distanciaKm > distanceKm) return false;
      }

      // Status filter
      if (statusFilter !== 'todos' && o.estado !== statusFilter) return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCompany = (o.empresa || '').toLowerCase().includes(q);
        const matchesRole = (o.funcao || '').toLowerCase().includes(q);
        const matchesLoc = (o.localizacao || '').toLowerCase().includes(q);
        const matchesSector = (o.sector || '').toLowerCase().includes(q);
        if (!matchesCompany && !matchesRole && !matchesLoc && !matchesSector) return false;
      }

      return true;
    });

    const ordenacao = settings?.ordenacaoPadrao || 'recentes';

    return list.sort((a, b) => {
      if (ordenacao === 'proximos') {
        const distA = typeof a.distanciaKm === 'number' && !isNaN(a.distanciaKm) ? a.distanciaKm : Number.POSITIVE_INFINITY;
        const distB = typeof b.distanciaKm === 'number' && !isNaN(b.distanciaKm) ? b.distanciaKm : Number.POSITIVE_INFINITY;
        if (distA !== distB) {
          return distA - distB;
        }
        // Desempate: mais recentes primeiro
        const timeA = a.dataOferta || a.dataEncontrado ? new Date(a.dataOferta || a.dataEncontrado).getTime() || 0 : 0;
        const timeB = b.dataOferta || b.dataEncontrado ? new Date(b.dataOferta || b.dataEncontrado).getTime() || 0 : 0;
        return timeB - timeA;
      } else {
        // 'recentes' (por defeito)
        const timeA = a.dataOferta || a.dataEncontrado ? new Date(a.dataOferta || a.dataEncontrado).getTime() || 0 : 0;
        const timeB = b.dataOferta || b.dataEncontrado ? new Date(b.dataOferta || b.dataEncontrado).getTime() || 0 : 0;
        if (timeA !== timeB) {
          return timeB - timeA;
        }
        // Desempate: mais próximos primeiro
        const distA = typeof a.distanciaKm === 'number' && !isNaN(a.distanciaKm) ? a.distanciaKm : Number.POSITIVE_INFINITY;
        const distB = typeof b.distanciaKm === 'number' && !isNaN(b.distanciaKm) ? b.distanciaKm : Number.POSITIVE_INFINITY;
        return distA - distB;
      }
    });
  }, [offers, geoMode, distanceKm, statusFilter, searchQuery, settings?.ordenacaoPadrao]);

  // Filtered Spontaneous Companies based on geo mode, distance slider, drive time, and status
  const filteredCompanies = useMemo(() => {
    const list = companies.filter((c) => {
      // Geo mode filter
      if (geoMode === 'internacional') {
        if (!c.isInternacional) return false;
      } else {
        // Nacional: skip international companies; apply distance filter
        if (c.isInternacional) return false;
        if (typeof c.distanciaKm === 'number' && distanceKm > 0 && c.distanciaKm > distanceKm) return false;
        // Drive time filter (only in nacional)
        if (typeof c.tempoDeslocacaoCarroMin === 'number' && c.tempoDeslocacaoCarroMin > maxCarMinutes) return false;
      }

      // Status filter
      if (statusFilter !== 'todos' && c.estado !== statusFilter) return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (c.nome || '').toLowerCase().includes(q);
        const matchesSector = (c.sector || '').toLowerCase().includes(q);
        const matchesLoc = (c.localizacao || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSector && !matchesLoc) return false;
      }

      return true;
    });

    const ordenacao = settings?.ordenacaoPadrao || 'recentes';

    return list.sort((a, b) => {
      const timeA = a.dataEncontrado ? new Date(a.dataEncontrado).getTime() || 0 : 0;
      const timeB = b.dataEncontrado ? new Date(b.dataEncontrado).getTime() || 0 : 0;
      const distA = typeof a.distanciaKm === 'number' && !isNaN(a.distanciaKm) ? a.distanciaKm : Number.POSITIVE_INFINITY;
      const distB = typeof b.distanciaKm === 'number' && !isNaN(b.distanciaKm) ? b.distanciaKm : Number.POSITIVE_INFINITY;

      if (ordenacao === 'proximos') {
        if (distA !== distB) {
          return distA - distB;
        }
        return timeB - timeA;
      } else {
        // 'recentes' (por defeito)
        if (timeA !== timeB) {
          return timeB - timeA;
        }
        return distA - distB;
      }
    });
  }, [companies, geoMode, distanceKm, maxCarMinutes, statusFilter, searchQuery, settings?.ordenacaoPadrao]);


  // Global counts for the header
  const counts = useMemo(() => {
    const ofertasNovas = offers.filter((o) => o.estado === 'novo').length;
    const espontaneasNovas = companies.filter((c) => c.estado === 'novo').length;
    const enviadosTotal =
      offers.filter((o) => o.estado === 'enviado').length +
      companies.filter((c) => c.estado === 'enviado').length;

    return {
      ofertasNovas,
      ofertasTotal: offers.length,
      espontaneasNovas,
      espontaneasTotal: companies.length,
      enviadosTotal,
    };
  }, [offers, companies]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-blue-900 selection:text-white">
      {/* Editorial Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setStatusFilter('todos');
          setSearchQuery('');
        }}
        counts={counts}
        activeEngineName={settings?.motores?.gemini?.modeloPreferido || 'Gemini 3.8 Flash'}
      />

      {/* Ephemeral Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
          <div
            className={`px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium border ${
              notification.type === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
                : notification.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-800'
                : 'bg-neutral-900 text-neutral-200 border-neutral-700'
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}

      {/* Filter Bar (Only for Offers and Spontaneous lists) */}
      {(activeTab === 'ofertas' || activeTab === 'espontaneas') && (
        <FilterBar
          mode={activeTab}
          distanceKm={distanceKm}
          onDistanceChange={setDistanceKm}
          maxCarMinutes={maxCarMinutes}
          onMaxCarMinutesChange={setMaxCarMinutes}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          totalFiltered={activeTab === 'ofertas' ? filteredOffers.length : filteredCompanies.length}
          totalInDatabase={activeTab === 'ofertas' ? offers.length : companies.length}
          locationName={settings?.localizacaoBase || 'Rua Garcia de Orta, 6, Oeiras'}
          geoMode={geoMode}
          onGeoModeChange={setGeoMode}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-neutral-400">A carregar base de candidaturas...</p>
          </div>
        ) : (
          <>
            {activeTab === 'ofertas' && (
              <JobOffersList
                offers={filteredOffers}
                onOpenEmail={handleOpenEmail}
                onUpdateStatus={handleUpdateStatus}
                onOpenGoogleSearch={(query) => setActiveSearchQuery(query)}
              />
            )}

            {activeTab === 'espontaneas' && (
              <SpontaneousList
                companies={filteredCompanies}
                onOpenEmail={handleOpenEmail}
                onUpdateStatus={handleUpdateStatus}
                onOpenGoogleSearch={(query) => setActiveSearchQuery(query)}
              />
            )}

            {activeTab === 'perfil' && (
              <KnowledgeBase
                documents={documents}
                onUploadFile={handleUploadFile}
                onRecallQuestion={handleRecallQuestion}
                isUploading={isUploading}
              />
            )}

            {activeTab === 'definicoes' && settings && (
              <SettingsPanel
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onExportCsv={handleExportCsv}
                onImportCsv={handleImportCsv}
              />
            )}
          </>
        )}
      </main>

      {/* Email Modal */}
      {selectedEmailItem && (
        <EmailModal
          item={selectedEmailItem.item}
          type={selectedEmailItem.type}
          initialRecipient={selectedEmailItem.destinatario}
          initialSubject={selectedEmailItem.assunto}
          initialBody={selectedEmailItem.corpo}
          onClose={() => setSelectedEmailItem(null)}
          onMarkAsSent={(id) => handleUpdateStatus(id, 'enviado')}
          onRegenerate={handleRegenerateEmail}
        />
      )}

      {/* Quick Search Modal */}
      {activeSearchQuery && (
        <QuickSearchModal
          query={activeSearchQuery}
          onClose={() => setActiveSearchQuery(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-900 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-200">Atelier Daniel Rosa Amaral</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">25 Anos de Experiência em Design & Estratégia</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
            <span>Persistência JSON Ativa</span>
            <span className="text-neutral-600">·</span>
            <span>Sem Envio Automático</span>
            <span className="text-neutral-600">·</span>
            <span>Gmail Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
