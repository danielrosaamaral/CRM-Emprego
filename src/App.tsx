import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  GeographicScope,
  JobOffer,
  KnowledgeDocument,
  OfferStatus,
  RecallResult,
  SpontaneousCompany,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'ofertas' | 'espontaneas' | 'perfil' | 'definicoes'>(() => {
    const savedTab = window.localStorage.getItem('crm-active-tab');
    return savedTab === 'ofertas' || savedTab === 'espontaneas' || savedTab === 'perfil' || savedTab === 'definicoes'
      ? savedTab
      : 'ofertas';
  });
  const [distanceKm, setDistanceKm] = useState<number>(10);
  const [geographicScope, setGeographicScope] = useState<GeographicScope>('nacional');
  const [maxCarMinutes, setMaxCarMinutes] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<'todos' | OfferStatus>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [companies, setCompanies] = useState<SpontaneousCompany[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const SEARCH_TIMEOUT_MS = 45000;

  const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit, timeoutMs = SEARCH_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`Pesquisa excedeu o tempo limite de ${Math.round(timeoutMs / 1000)} segundos.`);
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

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

  useEffect(() => {
    window.localStorage.setItem('crm-active-tab', activeTab);
  }, [activeTab]);

  const showNotice = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Debounced persistence for geographic distance slider
  const distanceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDistanceChange = (val: number) => {
    setDistanceKm(val);
    if (distanceDebounceRef.current) {
      clearTimeout(distanceDebounceRef.current);
    }
    distanceDebounceRef.current = setTimeout(async () => {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ distanciaKmPadrao: val }),
        });
        setSettings((prev) => (prev ? { ...prev, distanciaKmPadrao: val } : prev));
      } catch (err) {
        console.error('Erro ao guardar distância predefinida:', err);
      }
    }, 400);
  };

  const handleMaxCarMinutesChange = async (val: number) => {
    setMaxCarMinutes(val);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempoCarroMaxMin: val }),
      });
      setSettings((prev) => (prev ? { ...prev, tempoCarroMaxMin: val } : prev));
    } catch (err) {
      console.error('Erro ao guardar tempo de carro predefinido:', err);
    }
  };

  // Refresh trigger (searches for new items and deduplicates)
  const handleRefresh = async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      if (activeTab === 'ofertas') {
        const res = await fetchWithTimeout('/api/search/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: settings?.localizacaoBase || 'Rua Garcia de Orta, 6, 2780-113 Oeiras, Portugal',
            maxKm: distanceKm,
            geographicScope,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'A pesquisa de ofertas falhou.');
        }
        const data = await res.json();
        if (data.offers) {
          setOffers(data.offers);
          showNotice(
            data.externalResults === 0
              ? 'A pesquisa externa não encontrou ofertas para os critérios indicados. Os resultados existentes foram mantidos.'
              : data.added > 0
              ? `${data.added} nova(s) oferta(s) encontrada(s) e adicionada(s) à base de dados.`
              : 'Pesquisa concluída: todas as ofertas atuais já se encontravam na base de dados.',
            data.externalResults === 0 ? 'info' : 'success'
          );
        }
      } else if (activeTab === 'espontaneas') {
        const res = await fetchWithTimeout('/api/search/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: settings?.localizacaoBase || 'Rua Garcia de Orta, 6, 2780-113 Oeiras, Portugal',
            maxMinutes: maxCarMinutes,
            geographicScope,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'A pesquisa de empresas falhou.');
        }
        const data = await res.json();
        if (data.companies) {
          setCompanies(data.companies);
          showNotice(
            data.externalResults === 0
              ? 'A pesquisa externa não encontrou empresas para os critérios indicados. Os resultados existentes foram mantidos.'
              : data.added > 0
              ? `${data.added} nova(s) empresa(s) para candidatura espontânea adicionada(s).`
              : 'Pesquisa concluída: nenhuma nova empresa identificada neste lote.',
            data.externalResults === 0 ? 'info' : 'success'
          );
        }
      }
    } catch (err: any) {
      console.error('Erro ao atualizar:', err);
      const message =
        err?.message?.includes('tempo limite') || err?.name === 'AbortError'
          ? 'A pesquisa excedeu o tempo limite de 45 segundos. Os resultados atuais foram mantidos; pode tentar novamente.'
          : 'Erro durante a pesquisa e atualização de dados.';
      showNotice(message, 'error');
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

  // Inline update of offer details
  const handleUpdateOffer = async (id: string, updates: Partial<JobOffer>): Promise<JobOffer> => {
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Falha ao atualizar oferta');
      const data = await res.json();
      const updatedOffer: JobOffer = data.oferta;

      setOffers((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...updatedOffer } : o))
      );
      showNotice('Oferta atualizada com sucesso.', 'success');
      return updatedOffer;
    } catch (err: any) {
      console.error('Erro ao atualizar oferta:', err);
      showNotice('Erro ao atualizar oferta na base de dados.', 'error');
      throw err;
    }
  };

  // Inline update of company details
  const handleUpdateCompany = async (id: string, updates: Partial<SpontaneousCompany>): Promise<SpontaneousCompany> => {
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Falha ao atualizar candidatura espontânea');
      const data = await res.json();
      const updatedCompany: SpontaneousCompany = data.empresa;

      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedCompany } : c))
      );
      showNotice('Candidatura espontânea atualizada com sucesso.', 'success');
      return updatedCompany;
    } catch (err: any) {
      console.error('Erro ao atualizar candidatura espontânea:', err);
      showNotice('Erro ao atualizar candidatura espontânea na base de dados.', 'error');
      throw err;
    }
  };

  // Open Email Preparer Modal
  const handleOpenEmail = async (item: JobOffer | SpontaneousCompany) => {
    const isOffer = 'empresa' in item;
    const type = isOffer ? 'oferta' : 'espontanea';

    // If item already has a prepared email (emailPreparado or emailGerado), show it; otherwise call generator
    const existingEmail = item.emailPreparado || item.emailGerado;
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
        body: JSON.stringify({
          type,
          item,
          docIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
        }),
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

      // Update state in memory (both emailPreparado and emailGerado for compatibility)
      const emailRecord = {
        assunto: email.assunto,
        corpo: email.corpo,
        dataGeracao: new Date().toISOString(),
      };

      if (isOffer) {
        setOffers((prev) =>
          prev.map((o) =>
            o.id === item.id
              ? {
                  ...o,
                  estado: o.estado === 'novo' ? 'preparada' : o.estado,
                  emailPreparado: emailRecord,
                  emailGerado: emailRecord,
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
                  emailPreparado: emailRecord,
                  emailGerado: emailRecord,
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
        docIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      }),
    });
    if (!res.ok) throw new Error('Erro ao regenerar');
    return await res.json();
  };

  // Selective document selection handlers
  const handleToggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const handleSelectAllDocs = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedDocIds(documents.map((d) => d.id));
    } else {
      setSelectedDocIds([]);
    }
  };

  // Delete document with server synchronization
  const handleDeleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao eliminar documento no servidor');
      const data = await res.json();
      setDocuments(data.todosDocumentos || []);
      setSelectedDocIds((prev) => prev.filter((docId) => docId !== id));
      showNotice('Documento eliminado da base de conhecimento com sucesso.', 'success');
    } catch (err: any) {
      console.error('Erro ao eliminar documento:', err);
      showNotice(err?.message || 'Erro ao eliminar documento.', 'error');
    }
  };

  // Upload CV or Portfolio
  const handleUploadFile = async (file: File, tipo: 'cv' | 'portfolio') => {
    try {
      setIsUploading(true);
      showNotice(`A carregar e extrair ${file.name}...`, 'info');

      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      let requestBody: {
        tipo: 'cv' | 'portfolio';
        nomeFicheiro: string;
        conteudoTexto?: string;
        conteudoBase64?: string;
        tamanhoBytes: number;
      } = {
        tipo,
        nomeFicheiro: file.name,
        tamanhoBytes: file.size,
      };

      if (isPdf) {
        // Binary-safe Base64 read for PDF to preserve binary streams for extraction
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const commaIndex = result.indexOf(',');
            resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
          };
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
        requestBody.conteudoBase64 = base64Data;
      } else {
        const textContent = await file.text();
        requestBody.conteudoTexto = textContent || `Ficheiro ${file.name} carregado com sucesso.`;
      }

      const res = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
  const handleRecallQuestion = async (pergunta: string, docIds?: string[]): Promise<RecallResult> => {
    const targetDocIds = docIds && docIds.length > 0 ? docIds : (selectedDocIds.length > 0 ? selectedDocIds : undefined);
    const res = await fetch('/api/knowledge/recall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pergunta,
        docIds: targetDocIds,
      }),
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
    if (data.data?.ofertas) {
      setOffers(data.data.ofertas);
    }
    if (data.data?.empresas) {
      setCompanies(data.data.empresas);
    }
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

   // Filtered Job Offers based on geographic scope, master distance slider and status
  const filteredOffers = useMemo(() => {
    const list = offers.filter((o) => {
      // Geographic scope filter: Nacional vs Internacional
      const isOfferIntl =
        o.ambito === 'internacional' ||
        o.isInternacional === true ||
        (o.pais && o.pais.toLowerCase() !== 'portugal');

      if (geographicScope === 'internacional') {
        if (!isOfferIntl) return false;
      } else {
        // Mode 'nacional': ignore international offers
        if (isOfferIntl) return false;

        // Distance filter: master slider from 0 km (immediate base location) up to 600 km (national)
        if (distanceKm === 0) {
          if (o.distanciaKm > 1.0) return false;
        } else if (distanceKm < 600) {
          if (o.distanciaKm > distanceKm) return false;
        }
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
        const distA =
          typeof a.distanciaKm === 'number' && !isNaN(a.distanciaKm)
            ? a.distanciaKm
            : Number.POSITIVE_INFINITY;
        const distB =
          typeof b.distanciaKm === 'number' && !isNaN(b.distanciaKm)
            ? b.distanciaKm
            : Number.POSITIVE_INFINITY;

        if (distA !== distB) {
          return distA - distB;
        }

        const timeA =
          a.dataOferta || a.dataEncontrado
            ? new Date(a.dataOferta || a.dataEncontrado).getTime() || 0
            : 0;
        const timeB =
          b.dataOferta || b.dataEncontrado
            ? new Date(b.dataOferta || b.dataEncontrado).getTime() || 0
            : 0;

        return timeB - timeA;
      } else {
        const timeA =
          a.dataOferta || a.dataEncontrado
            ? new Date(a.dataOferta || a.dataEncontrado).getTime() || 0
            : 0;
        const timeB =
          b.dataOferta || b.dataEncontrado
            ? new Date(b.dataOferta || b.dataEncontrado).getTime() || 0
            : 0;

        if (timeA !== timeB) {
          return timeB - timeA;
        }

        const distA =
          typeof a.distanciaKm === 'number' && !isNaN(a.distanciaKm)
            ? a.distanciaKm
            : Number.POSITIVE_INFINITY;
        const distB =
          typeof b.distanciaKm === 'number' && !isNaN(b.distanciaKm)
            ? b.distanciaKm
            : Number.POSITIVE_INFINITY;

        return distA - distB;
      }
    });
  }, [
    offers,
    geographicScope,
    distanceKm,
    statusFilter,
    searchQuery,
    settings?.ordenacaoPadrao,
  ]);

  // Filtered Spontaneous Companies based on geographic scope, distance slider, drive time, and status
  const filteredCompanies = useMemo(() => {
    const list = companies.filter((c) => {
      const isCompanyIntl =
        c.ambito === 'internacional' ||
        c.isInternacional === true ||
        (c.pais && c.pais.toLowerCase() !== 'portugal');

      if (geographicScope === 'internacional') {
        if (!isCompanyIntl) return false;
      } else {
        if (isCompanyIntl) return false;

        if (distanceKm === 0) {
          if (c.distanciaKm > 1.0) return false;
        } else if (distanceKm < 600) {
          if (c.distanciaKm > distanceKm) return false;
        }
      }

      if (
        geographicScope === 'nacional' &&
        c.tempoDeslocacaoCarroMin > maxCarMinutes
      ) {
        return false;
      }

      if (statusFilter !== 'todos' && c.estado !== statusFilter) return false;

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
      const distA =
        typeof a.distanciaKm === 'number' && !isNaN(a.distanciaKm)
          ? a.distanciaKm
          : Number.POSITIVE_INFINITY;
      const distB =
        typeof b.distanciaKm === 'number' && !isNaN(b.distanciaKm)
          ? b.distanciaKm
          : Number.POSITIVE_INFINITY;

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
  }, [
    companies,
    geographicScope,
    distanceKm,
    maxCarMinutes,
    statusFilter,
    searchQuery,
    settings?.ordenacaoPadrao,
  ]);

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
          onDistanceChange={handleDistanceChange}
          geographicScope={geographicScope}
          onGeographicScopeChange={setGeographicScope}
          maxCarMinutes={maxCarMinutes}
          onMaxCarMinutesChange={handleMaxCarMinutesChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          totalFiltered={activeTab === 'ofertas' ? filteredOffers.length : filteredCompanies.length}
          totalInDatabase={activeTab === 'ofertas' ? offers.length : companies.length}
          locationName={settings?.localizacaoBase || 'Rua Garcia de Orta, 6, Oeiras'}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-base text-neutral-600">A carregar base de candidaturas...</p>
          </div>
        ) : (
          <>
            {activeTab === 'ofertas' && (
              <JobOffersList
                offers={filteredOffers}
                onOpenEmail={handleOpenEmail}
                onUpdateStatus={handleUpdateStatus}
                onOpenGoogleSearch={(query) => setActiveSearchQuery(query)}
                onUpdateOffer={handleUpdateOffer}
              />
            )}

            {activeTab === 'espontaneas' && (
              <SpontaneousList
                companies={filteredCompanies}
                emptyReason={
                  companies.length > 0 && geographicScope === 'nacional'
                    ? `As ${companies.length} empresas existentes foram eliminadas pelos filtros cumulativos: distância até ${distanceKm} km e tempo de deslocação até ${maxCarMinutes} minutos.`
                    : undefined
                }
                onOpenEmail={handleOpenEmail}
                onUpdateStatus={handleUpdateStatus}
                onOpenGoogleSearch={(query) => setActiveSearchQuery(query)}
                onUpdateCompany={handleUpdateCompany}
              />
            )}

            {activeTab === 'perfil' && (
              <KnowledgeBase
                documents={documents}
                selectedDocIds={selectedDocIds}
                onToggleSelectDoc={handleToggleSelectDoc}
                onSelectAllDocs={handleSelectAllDocs}
                onDeleteDocument={handleDeleteDocument}
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
