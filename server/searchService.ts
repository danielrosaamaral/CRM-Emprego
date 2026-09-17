import { ContactType, GeographicScope, JobOffer, SpontaneousCompany } from '../src/types.js';
import { isValidEmailSyntax } from '../src/utils.js';
import { router } from './engines/router.js';
import { geoService } from './geoService.js';
import { db } from './storage.js';

export class SearchService {
  /**
   * Search for new job offers and add to database without duplicating
   */
  public async refreshJobOffers(
    locationBase: string,
    maxKm: number,
    geographicScope: GeographicScope = 'nacional'
  ): Promise<{ added: number; total: number; externalResults: number; offers: JobOffer[] }> {
    const docs = db.getData().documentos;
    const profileSummary = docs.map((d) => `${d.nomeFicheiro}: ${d.resumoExtraido}`).join('\n');

    const isInternational = geographicScope === 'internacional';
    const prompt = `Como motor de pesquisa e agregação de emprego especializado, identifica 3 a 5 novas ofertas de emprego REAIS e plausíveis para um Designer Gráfico Sénior com 25 anos de experiência nas áreas de Design Gráfico, Branding, Packaging, Editorial, Marketing, SEO e Google Ads.
  Âmbito geográfico: ${isInternational ? 'INTERNACIONAL (inclui ofertas remotas e fora de Portugal)' : `NACIONAL, com base em "${locationBase}" e distância máxima de ${maxKm} km`}.

CRITÉRIOS ESTRITOS:
- ${isInternational ? 'Inclui empresas e ofertas remotas de vários países. Indica sempre o país real da oferta.' : `Foco em empresas na região de ${locationBase} (ou num raio até ${maxKm} km).`}
- Funções compatíveis: Senior Graphic Designer, Brand Designer, Packaging Specialist, Diretor de Arte Editorial, Coordenador de Design e Marketing.
- Procura primeiro uma pessoa individual identificável para o contacto relevante.
- Se não existir uma pessoa pública identificável, podes usar uma equipa, departamento ou canal de recrutamento, classificando correctamente o tipo de contacto.
- Se não existir nenhum contacto útil, omite "contactoRelevante".
- Se o contacto/email não for público, marca "verificado": false. NÃO inventes emails que pareçam confidenciais.
- Só inclui URL de oferta ou website quando for uma URL canónica confirmada; caso contrário usa string vazia. Nunca construas URLs a partir do nome da empresa.
- Mantém separados "linkedinEmpresa" (página da empresa) e "contactoRelevante.linkedin" (perfil pessoal /in/); nunca uses uma página /company/ como perfil pessoal.
- Calcula a distância aproximada em km e tempo de deslocação em minutos.
- Determina grau de compatibilidade (0 a 100%) e 3 a 4 razões factuais.

Responde APENAS em formato JSON válido com este formato:
{
  "ofertas": [
    {
      "empresa": "Nome da Empresa",
      "funcao": "Título do Cargo",
      "localizacao": "Cidade / Freguesia",
      "pais": "País real da oferta",
      "ambito": "${geographicScope}",
      "distanciaKm": 4.5,
      "tempoCarroMin": 8,
      "dataOferta": "2026-03-12",
      "urlOferta": "URL canónica confirmada ou string vazia",
      "websiteEmpresa": "Website oficial confirmado ou string vazia",
      "linkedinEmpresa": "https://linkedin.com/company/...",
      "sector": "alimentar",
      "resumoRequisitos": "Resumo dos requisitos principais",
      "contactoRelevante": {
        "tipoContacto": "pessoa",
        "nome": "Nome da pessoa",
        "cargo": "Cargo",
        "linkedin": "https://linkedin.com/in/...",
        "email": "email se público ou omitir",
        "verificado": false
      },
      "grauCompatibilidade": 94,
      "razoesCompatibilidade": [
        "Razão 1",
        "Razão 2"
      ]
    }
  ]
}`;

    try {
      const res = await router.executeTask(
        'pesquisa',
        prompt,
        'És um pesquisador técnico de oportunidades no mercado laboral português e europeu. Retorna apenas JSON válido.',
        true
      );

      const parsed = JSON.parse(res.text);
      const rawOffers = Array.isArray(parsed.ofertas) ? parsed.ofertas : [];

      const newOffers: JobOffer[] = await Promise.all(
        rawOffers.map(async (o: any, idx: number) => {
          const loc = geoService.cleanLocationName(o.localizacao || locationBase);
          const geoCalc = isInternational
            ? { distanciaKm: typeof o.distanciaKm === 'number' ? o.distanciaKm : 0, tempoCarroMin: typeof o.tempoCarroMin === 'number' ? o.tempoCarroMin : 0 }
            : await geoService.calculateDistanceAndDuration(locationBase, loc);
          return {
            id: `off_${Date.now()}_${idx}`,
            empresa: o.empresa || 'Empresa Confidencial',
            funcao: o.funcao || 'Senior Designer',
            localizacao: loc,
            distanciaKm: geoCalc.distanciaKm,
            tempoCarroMin: geoCalc.tempoCarroMin,
            pais: o.pais,
            ambito: geographicScope,
            dataOferta: o.dataOferta || new Date().toISOString().split('T')[0],
            urlOferta: typeof o.urlOferta === 'string' ? o.urlOferta : '',
            websiteEmpresa: typeof o.websiteEmpresa === 'string' ? o.websiteEmpresa : '',
            linkedinEmpresa: o.linkedinEmpresa,
            contactoRelevante: o.contactoRelevante
              ? {
                  tipoContacto: this.normalizeContactType(o.contactoRelevante.tipoContacto),
                  nome: o.contactoRelevante.nome || 'Responsável de Recrutamento',
                  cargo: o.contactoRelevante.cargo || 'Recursos Humanos',
                  linkedin: this.isPersonalLinkedInUrl(o.contactoRelevante.linkedin)
                    ? o.contactoRelevante.linkedin
                    : undefined,
                  email: isValidEmailSyntax(o.contactoRelevante.email)
                    ? o.contactoRelevante.email
                    : undefined,
                  verificado: !!o.contactoRelevante.verificado,
                }
              : undefined,
            grauCompatibilidade: typeof o.grauCompatibilidade === 'number' ? o.grauCompatibilidade : 90,
            razoesCompatibilidade: Array.isArray(o.razoesCompatibilidade)
              ? o.razoesCompatibilidade
              : ['Alinhamento direto com os 25 anos de experiência do candidato.'],
            estado: 'novo',
            dataEncontrado: new Date().toISOString().split('T')[0],
            sector: o.sector || 'indústria',
            resumoRequisitos: o.resumoRequisitos || 'Perfil sénior em design visual, embalagem e estratégia de marca.',
          };
        })
      );

      const result = db.updateOffers(newOffers);
      return {
        added: result.added,
        total: result.total,
        externalResults: rawOffers.length,
        offers: db.getData().ofertas,
      };
    } catch (err) {
      console.warn('Falha na pesquisa automática de ofertas:', err);
      throw err;
    }
  }

  /**
   * Search for prospective companies for spontaneous applications
   */
  public async refreshCompanies(
    locationBase: string,
    maxMinutes = 10,
    geographicScope: GeographicScope = 'nacional'
  ): Promise<{ added: number; total: number; externalResults: number; companies: SpontaneousCompany[] }> {
    const isInternational = geographicScope === 'internacional';
    const prompt = `Como consultor de prospecção corporativa, identifica 3 a 5 empresas de GRANDE DIMENSÃO ECONÓMICA ${isInternational ? 'em vários países e/ou com trabalho remoto internacional' : `na área de "${locationBase}"`}.
Critério geográfico fundamental: ${isInternational ? 'modo internacional: não aplicar limite nacional de distância ou tempo de carro; indicar o país real.' : `tempo de deslocação de carro até ${maxMinutes} minutos (prioridade a ≤ 5 minutos).`}
EVITAR zonas de trânsito intenso. Avaliar acessibilidade e estacionamento.

OBJECTIVO:
Empresas suficientemente grandes nos sectores: indústria, alimentar, distribuição, tecnologia, farmacêutico, produção ou sustentáveis que possam contratar:
- Designer Gráfico / Brand Designer
- Packaging Designer
- Communication / Editorial Designer
- Marketing Designer

Não limitar a agências de design. Procurar clientes finais com dimensão económica comprovada.
Para cada empresa, identifica a pessoa mais relevante pela seguinte prioridade:
1. Responsável de Marketing / Comunicação
2. Responsável de Recursos Humanos
3. Diretor relevante
4. CEO / Administração
5. Proprietário

Se o contacto exato não puder ser 100% verificado, marca verificado: false e gera pesquisas Google LinkedIn prontas a copiar.

Responde APENAS em JSON no formato:
{
  "empresas": [
    {
      "nome": "Nome da Empresa",
      "localizacao": "Morada / Zona",
      "pais": "País real da empresa",
      "ambito": "${geographicScope}",
      "distanciaKm": 3.5,
      "tempoDeslocacaoCarroMin": 5,
      "nivelTransito": "baixo",
      "notasEstacionamento": "Parque próprio para colaboradores...",
      "website": "Website oficial confirmado ou string vazia",
      "linkedin": "https://linkedin.com/company/... apenas se for página empresarial confirmada",
      "dimensaoEconomica": "Faturação estimada, colaboradores...",
      "sector": "alimentar",
      "razaoCandidatura": "Razão factual pela qual a empresa beneficia dos 25 anos de experiência...",
      "pessoasRelevantes": [
        {
          "nome": "Nome",
          "cargo": "Cargo",
          "prioridade": 1,
          "linkedin": "https://linkedin.com/in/... apenas se for perfil pessoal confirmado",
          "email": "se público",
          "verificado": false
        }
      ],
      "pesquisasGoogleSugeridas": [
        "site:linkedin.com/in \\"Empresa\\" marketing",
        "site:linkedin.com/in \\"Empresa\\" recursos humanos"
      ]
    }
  ]
}`;

    try {
      const res = await router.executeTask(
        'pesquisa',
        prompt,
        'És um especialista em prospecção de mercado corporativo B2B e mobilidade urbana.',
        true
      );

      const parsed = JSON.parse(res.text);
      const rawCompanies = Array.isArray(parsed.empresas) ? parsed.empresas : [];

      const newCompanies: SpontaneousCompany[] = await Promise.all(
        rawCompanies.map(async (c: any, idx: number) => {
          const loc = geoService.cleanLocationName(c.localizacao || locationBase);
          const geoCalc = isInternational
            ? { distanciaKm: typeof c.distanciaKm === 'number' ? c.distanciaKm : 0, tempoCarroMin: typeof c.tempoDeslocacaoCarroMin === 'number' ? c.tempoDeslocacaoCarroMin : 0 }
            : await geoService.calculateDistanceAndDuration(locationBase, loc);
          return {
            id: `comp_${Date.now()}_${idx}`,
            nome: c.nome || 'Empresa Local',
            localizacao: loc,
            distanciaKm: geoCalc.distanciaKm,
            tempoDeslocacaoCarroMin: geoCalc.tempoCarroMin,
            pais: c.pais,
            ambito: geographicScope,
            nivelTransito: c.nivelTransito === 'elevado' ? 'elevado' : c.nivelTransito === 'moderado' ? 'moderado' : 'baixo',
            notasEstacionamento: c.notasEstacionamento || 'Estacionamento disponível nas imediações.',
            website: typeof c.website === 'string' ? c.website : '',
            linkedin: typeof c.linkedin === 'string' ? c.linkedin : '',
            dimensaoEconomica: c.dimensaoEconomica || 'Empresa de dimensão económica de relevo.',
            sector: c.sector || 'indústria',
            razaoCandidatura: c.razaoCandidatura || 'Grande volume de produtos e suportes com necessidade contínua de design de topo.',
            pessoasRelevantes: Array.isArray(c.pessoasRelevantes) && c.pessoasRelevantes.length > 0
              ? c.pessoasRelevantes.map((p: any) => ({
                  nome: p.nome || 'Responsável de Marketing / RH',
                  cargo: p.cargo || 'Direção',
                  prioridade: p.prioridade || 1,
                  linkedin: this.isPersonalLinkedInUrl(p.linkedin) ? p.linkedin : undefined,
                  email: p.email,
                  verificado: !!p.verificado,
                }))
              : [
                  {
                    nome: 'Direção de Marketing & Comunicação',
                    cargo: 'Diretor(a) de Marketing',
                    prioridade: 1,
                    verificado: false,
                  },
                ],
            pesquisasGoogleSugeridas: Array.isArray(c.pesquisasGoogleSugeridas) && c.pesquisasGoogleSugeridas.length > 0
              ? c.pesquisasGoogleSugeridas
              : [
                  `site:linkedin.com/in "${c.nome}" marketing`,
                  `site:linkedin.com/in "${c.nome}" recursos humanos`,
                  `site:linkedin.com/in "${c.nome}" director`,
                ],
            estado: 'novo',
            dataEncontrado: new Date().toISOString().split('T')[0],
          };
        })
      );

      const result = db.updateCompanies(newCompanies);
      return {
        added: result.added,
        total: result.total,
        externalResults: rawCompanies.length,
        companies: db.getData().empresas,
      };
    } catch (err) {
      console.warn('Falha na prospecção automática de empresas:', err);
      throw err;
    }
  }

  private isPersonalLinkedInUrl(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    try {
      const url = new URL(trimmed);
      const hostname = url.hostname.toLowerCase();
      const pathname = url.pathname;

      const isLinkedInDomain = hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com');
      const isPersonalProfilePath = /^\/in\//i.test(pathname);
      const isCompanyOrPeoplePath = /\/company\//i.test(pathname) || /\/people\//i.test(pathname);

      return isLinkedInDomain && isPersonalProfilePath && !isCompanyOrPeoplePath;
    } catch {
      return false;
    }
  }

  private normalizeContactType(value: unknown): ContactType | undefined {
    return value === 'pessoa' || value === 'equipa' || value === 'departamento' || value === 'canal_recrutamento'
      ? value
      : undefined;
  }

  /**
   * Generate factual customized application email
   */
  public async generateApplicationEmail(
    type: 'oferta' | 'espontanea',
    item: JobOffer | SpontaneousCompany,
    docIds?: string[]
  ): Promise<{ assunto: string; corpo: string; destinatario: string }> {
    let docs = db.getData().documentos;
    if (Array.isArray(docIds) && docIds.length > 0) {
      const selected = docs.filter((d) => docIds.includes(d.id));
      if (selected.length > 0) {
        docs = selected;
      }
    }
    const candidateFactContext = docs.map((d) => `DOCUMENTO: ${d.nomeFicheiro}\n${d.conteudoTexto}`).join('\n\n');

    let recipient = '';
    let targetTitle = '';
    let entityName = '';

    if (type === 'oferta') {
      const offer = item as JobOffer;
      entityName = offer.empresa;
      targetTitle = offer.funcao;
      recipient = offer.contactoRelevante?.email || '';
    } else {
      const comp = item as SpontaneousCompany;
      entityName = comp.nome;
      targetTitle = 'Colaboração Sénior em Design Gráfico, Branding & Packaging';
      const personWithEmail = comp.pessoasRelevantes.find((p) => p.email);
      recipient = personWithEmail?.email || '';
    }

    const prompt = `Gera um e-mail de candidatura profissional e factual para envio via Gmail.
TIPO DE CANDIDATURA: ${type === 'oferta' ? 'Resposta a Oferta de Emprego' : 'Candidatura Espontânea Estratégica'}.
EMPRESA: ${entityName}
CARGO/ÁREA: ${targetTitle}
DADOS DO ITEM:
${JSON.stringify(item, null, 2)}

BASE FACTUAL DO CANDIDATO (25 anos de experiência):
${candidateFactContext}

ESTRUTURA OBRIGATÓRIA DO E-MAIL:
1. Assunto claro e profissional
2. Pequeno parágrafo de apresentação pessoal (25 anos de experiência consolidada em design gráfico, branding, packaging, editorial e marketing/SEO/Google Ads)
3. Parágrafo personalizado de acordo com a empresa e contexto (${entityName})
4. Ligação factual e direta entre as necessidades da empresa e a experiência comprovada do candidato (NÃO inventar projetos fictícios!)
5. Fecho cordial e sucinto, propondo uma breve conversa
6. Indicação expressa de que o CV e Portfólio seguem em anexo

Responde APENAS em JSON no seguinte formato:
{
  "assunto": "Assunto conciso e impactante para o e-mail",
  "corpo": "Texto completo do e-mail com quebras de linha normais (\\n\\n)"
}`;

    try {
      const res = await router.executeTask(
        'geracao_email',
        prompt,
        'És um redator profissional de comunicação executiva para designers de topo. Responde em JSON rigoroso sem invenções.',
        true
      );

      const parsed = JSON.parse(res.text);
      const emailObj = {
        assunto: parsed.assunto || `Candidatura: ${targetTitle} // Designer Gráfico Sénior`,
        corpo: parsed.corpo || '',
        dataGeracao: new Date().toISOString(),
      };

      if (type === 'oferta') {
        db.updateOfferEmail(item.id, emailObj);
      } else {
        db.updateCompanyEmail(item.id, emailObj);
      }

      return {
        assunto: emailObj.assunto,
        corpo: emailObj.corpo,
        destinatario: recipient,
      };
    } catch (err) {
      console.warn('Falha na geração de email por IA, a usar modelo factual:', err);
      // High-grade factual fallback
      const fallbackSubject = type === 'oferta'
        ? `Candidatura: ${(item as JobOffer).funcao} - Designer Gráfico Sénior (25 anos de exp.)`
        : `Apresentação & Candidatura Espontânea // Designer Gráfico Sénior - ${entityName}`;

      const fallbackBody = `Exmo.(a) Senhor(a),

O meu nome é Daniel Rosa Amaral e sou Designer Gráfico Freelancer e Consultor Criativo com 25 anos de experiência no mercado profissional.

Ao longo de mais de duas décadas, tenho desenvolvido trabalho contínuo nas áreas de Identidade Visual e Branding, Packaging e Embalagem (com especial enfoque nos setores alimentar e industrial), Design Editorial de grande rigor técnico, bem como Estratégias Digitais de Marketing de Performance, SEO e campanhas de Google Ads.

Tendo em conta o posicionamento de referência da ${entityName} e o valor acrescentado de contar com uma resposta criativa e técnica sénior, autónoma e com profundo conhecimento de pré-impressão e conversão, apresento a minha disponibilidade para colaborar convosco.

Junto envio em anexo o meu Curriculum Vitae detalhado e uma seleção do meu Portfólio de projetos.

Fico à inteira disposição para uma breve reunião presencial ou chamada onde possa apresentar de que forma a minha experiência pode responder de imediato aos vossos desafios visuais e estratégicos.

Com os melhores cumprimentos,

Daniel Rosa Amaral
Designer Gráfico Sénior & Diretor de Arte
Tel: +351 910 000 000 | LinkedIn: linkedin.com/in/danielrosaamaral
Porto, Portugal`;

      const emailObj = {
        assunto: fallbackSubject,
        corpo: fallbackBody,
        dataGeracao: new Date().toISOString(),
      };

      if (type === 'oferta') {
        db.updateOfferEmail(item.id, emailObj);
      } else {
        db.updateCompanyEmail(item.id, emailObj);
      }

      return {
        assunto: fallbackSubject,
        corpo: fallbackBody,
        destinatario: recipient,
      };
    }
  }

  /**
   * Refine an existing email draft (encurtar, tornar_direto, reescrever)
   */
  public async refineEmailDraft(
    action: 'encurtar' | 'tornar_direto' | 'reescrever',
    subject: string,
    body: string,
    type: 'oferta' | 'espontanea',
    item?: JobOffer | SpontaneousCompany
  ): Promise<{ assunto: string; corpo: string }> {
    const definicoes = db.getData().definicoes;
    const copyRuleKey = type === 'oferta' ? 'candidatura' : 'email';
    const rule = definicoes.regrasCopy?.[copyRuleKey];

    let actionInstruction = '';
    if (action === 'encurtar') {
      actionInstruction = `OBJETIVO DA OPERAÇÃO: ENCURTAR O E-MAIL.
- Reduz a extensão do texto para um formato conciso e rápido de ler (cerca de 35% a 50% mais curto).
- Remove redundâncias e frases introdutórias desnecessárias.
- Preserva estritamente os factos essenciais: 25 anos de experiência, áreas-chave de especialidade (Design Gráfico, Branding, Packaging, Editorial), conexão à empresa e indicação de que o CV e Portfólio seguem em anexo.`;
    } else if (action === 'tornar_direto') {
      actionInstruction = `OBJETIVO DA OPERAÇÃO: TORNAR O E-MAIL MAIS DIRETO.
- Elimina rodeios e fórmulas protocolares excessivas.
- Entra diretamente na proposta de valor imediata e competências comprovadas.
- Tom executivo assertivo, claro e factual, sem perder o profissionalismo e o respeito.
- Preserva a menção factual ao CV e Portfólio em anexo.`;
    } else {
      // 'reescrever'
      actionInstruction = `OBJETIVO DA OPERAÇÃO: REESCREVER / REFORMULAR O E-MAIL.
- Reescreve o texto com uma redação renovada, fluida e elegante em português europeu.
- Mantém integralmente todos os factos, proposta de valor e argumentos da versão original.
- Melhora a articulação entre parágrafos e o ritmo da leitura, mantendo o fecho e a menção aos anexos.`;
    }

    const ruleContext = rule
      ? `REGRAS DE COPY APLICÁVEIS:
- Tom: ${rule.tom}
- Formalidade: ${rule.formalidade}
- Saudação recomendada: ${rule.saudacao}
- Assinatura recomendada: ${rule.assinatura}
- Instruções adicionais: ${rule.instrucoesAdicionais}`
      : '';

    const prompt = `${actionInstruction}

${ruleContext}

TEXTO ATUAL DO E-MAIL:
Assunto atual: ${subject}
Corpo atual:
${body}

${item ? `DADOS DE CONTEXTO DA CANDIDATURA:
${JSON.stringify({
  empresa: 'empresa' in item ? item.empresa : item.nome,
  funcao: 'funcao' in item ? item.funcao : 'Colaboração Sénior',
  localizacao: item.localizacao,
  sector: item.sector,
}, null, 2)}` : ''}

Responde APENAS em JSON rigoroso com a seguinte estrutura:
{
  "assunto": "Assunto refinado para o e-mail",
  "corpo": "Texto completo refinado com quebras de linha normais (\\n\\n)"
}`;

    try {
      const res = await router.executeTask(
        'geracao_email',
        prompt,
        'És um redator profissional de comunicação executiva para designers de topo. Responde exclusivamente em formato JSON sem texto adicional.',
        true
      );

      const parsed = JSON.parse(res.text);
      return {
        assunto: parsed.assunto || subject,
        corpo: parsed.corpo || body,
      };
    } catch (err) {
      console.warn(`Falha na operação de refinar e-mail (${action}):`, err);
      // Fallback sem quebrar
      if (action === 'encurtar') {
        const paragraphs = body.split('\n\n');
        const shortened = paragraphs.length > 3
          ? [paragraphs[0], paragraphs[1], paragraphs[paragraphs.length - 2], paragraphs[paragraphs.length - 1]].join('\n\n')
          : body;
        return { assunto: subject, corpo: shortened };
      }
      return { assunto: subject, corpo: body };
    }
  }
}

export const searchService = new SearchService();
