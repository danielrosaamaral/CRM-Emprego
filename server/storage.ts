import fs from 'fs';
import path from 'path';
import {
  AppSettings,
  CopyCommunicationType,
  CopyRuleDetail,
  FonteUrl,
  JobOffer,
  KnowledgeDocument,
  OFFER_PROCESSING_START_DATE,
  SpontaneousCompany,
} from '../src/types.js';
import { geoService } from './geoService.js';
export interface DatabaseSchema {
  ofertas: JobOffer[];
  empresas: SpontaneousCompany[];
  documentos: KnowledgeDocument[];
  definicoes: AppSettings;
  historicoEmails: Array<{
    id: string;
    tipo: 'oferta' | 'espontanea';
    entidadeId: string;
    entidadeNome: string;
    destinatario: string;
    assunto: string;
    corpo: string;
    data: string;
  }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_SETTINGS: AppSettings = {
  localizacaoBase: 'Rua Garcia de Orta, 6, 2780-113 Oeiras, Portugal',
  distanciaKmPadrao: 10,
  tempoCarroMaxMin: 10,
  motores: {
    gemini: {
      id: 'gemini',
      nome: 'Google Gemini (Gemini 3.8 Flash)',
      ativo: true,
      prioridade: 1,
      modeloPreferido: 'gemini-3.8-flash',
      apiKeyConfigurada: !!process.env.GEMINI_API_KEY,
      temChaveAmbiente: !!process.env.GEMINI_API_KEY,
      limiteAtingido: false,
    },
    groq: {
      id: 'groq',
      nome: 'Groq Cloud (Llama 3.3 70B)',
      ativo: true,
      prioridade: 2,
      modeloPreferido: 'openai/gpt-oss-120b',
      apiKeyConfigurada: !!process.env.GROQ_API_KEY,
      temChaveAmbiente: !!process.env.GROQ_API_KEY,
      limiteAtingido: false,
    },
    mistral: {
      id: 'mistral',
      nome: 'Mistral AI (Mistral Small / Large)',
      ativo: true,
      prioridade: 3,
      modeloPreferido: 'mistral-small-latest',
      apiKeyConfigurada: !!process.env.MISTRAL_API_KEY,
      temChaveAmbiente: !!process.env.MISTRAL_API_KEY,
      limiteAtingido: false,
    },
  },
  roteamento: {
    pesquisa: {
      tarefa: 'pesquisa',
      motorPrimario: 'gemini',
      motorSecundario: 'groq',
      motorFallback: 'mistral',
    },
    extraccao: {
      tarefa: 'extraccao',
      motorPrimario: 'gemini',
      motorSecundario: 'mistral',
      motorFallback: 'groq',
    },
    classificacao: {
      tarefa: 'classificacao',
      motorPrimario: 'gemini',
      motorSecundario: 'groq',
      motorFallback: 'mistral',
    },
    analise_perfil: {
      tarefa: 'analise_perfil',
      motorPrimario: 'gemini',
      motorSecundario: 'mistral',
      motorFallback: 'groq',
    },
    geracao_email: {
      tarefa: 'geracao_email',
      motorPrimario: 'gemini',
      motorSecundario: 'mistral',
      motorFallback: 'groq',
    },
  },
  modoGeografico: 'nacional',
  ordenacaoPadrao: 'recentes',
  regrasCopy: {
    candidatura: {
      tipo: 'candidatura',
      nome: 'Candidatura Direta a Oferta',
      tom: 'Executivo Factual e Direto',
      formalidade: 'formal',
      comprimento: 'medio',
      estrutura: 'Apresentação breve, alinhamento com a vaga, evidências do CV e proposta de valor.',
      saudacao: 'Exmo(a). Senhor(a),',
      assinatura: 'Com os melhores cumprimentos,',
      instrucoesAdicionais: 'Foco exclusivo em competências e experiência comprovada com 25 anos de carreira.',
    },
    linkedin: {
      tipo: 'linkedin',
      nome: 'Mensagem / InMail LinkedIn',
      tom: 'Profissional e Conciso',
      formalidade: 'neutro',
      comprimento: 'curto',
      estrutura: 'Gancho inicial contextualizado, valor prático e convite para conversa.',
      saudacao: 'Olá,',
      assinatura: 'Cumprimentos,',
      instrucoesAdicionais: 'Manter a mensagem abaixo de 100 palavras.',
    },
    email: {
      tipo: 'email',
      nome: 'Candidatura Espontânea por E-mail',
      tom: 'Executivo e Consultivo',
      formalidade: 'formal',
      comprimento: 'medio',
      estrutura: 'Motivo do contacto, conhecimento prévio sobre a empresa, como posso resolver problemas criativos/branding, portfolio e contactos.',
      saudacao: 'Exmo(a). Senhor(a),',
      assinatura: 'Atenciosamente,',
      instrucoesAdicionais: 'Não usar adjetivos vazios; usar factos do portefólio e áreas de especialidade.',
    },
    followup: {
      tipo: 'followup',
      nome: 'Mensagem de Follow-up',
      tom: 'Cortês e Objetivo',
      formalidade: 'neutro',
      comprimento: 'curto',
      estrutura: 'Referência ao envio inicial, reafirmação breve de disponibilidade e questão direta sobre o processo.',
      saudacao: 'Caro(a),',
      assinatura: 'Com os melhores cumprimentos,',
      instrucoesAdicionais: 'Esperar pelo menos 5 dias úteis antes de enviar.',
    },
  },
};

const INITIAL_KNOWLEDGE: KnowledgeDocument[] = [
  {
    id: 'doc_cv_senior_25',
    tipo: 'cv',
    nomeFicheiro: 'CV_Senior_Designer_25Anos.pdf',
    tamanhoBytes: 482000,
    dataUpload: '2026-03-01T10:00:00Z',
    resumoExtraido: 'Designer Gráfico Freelancer Sénior com 25 anos de experiência contínua no mercado nacional e internacional. Especialista em Design Gráfico global, Identidade Visual & Branding corporativo, Packaging para bens de grande consumo (FMCG e alimentar), Design Editorial (livros, catálogos e relatórios anuais), Marketing de Conteúdo, SEO técnico/on-page e Gestão de Campanhas de Google Ads.',
    conteudoTexto: `EXPERIÊNCIA PROFISSIONAL:
- 25 anos como Designer Gráfico Freelancer e Consultor Criativo Independente.
- Domínio integral da cadeia gráfica: da conceção concetual à pré-impressão de alta fidelidade e supervisão em gráfica.
- Criação e reformulação de marcas, manuais de normas de identidade corporativa (branding 360º).
- Packaging Design: Desenvolvimento estrutural e gráfico de embalagens para setor alimentar, vinhos, cosmética e indústria transformadora.
- Design Editorial: Direção de arte, paginação avançada em InDesign, relatórios de contas, catálogos técnicos e edições especiais.
- Marketing Digital & Performance: Criação de landing pages com otimização SEO técnica, pesquisa de palavras-chave e campanhas de Google Ads (Search & Performance Max) orientadas a conversão.

COMPETÊNCIAS TÉCNICAS:
- Adobe Creative Suite (InDesign, Illustrator, Photoshop, Acrobat Pro).
- Tipografia avançada, gestão de cor (FOGRA, Pantone, CMYK), acabamentos especiais (verniz UV, estampagem a quente, cortantes).
- SEO On-Page, Google Search Console, Google Ads, Google Analytics.
- UI/UX básico em Figma e WordPress.`,
    entidadesExtraidas: {
      anosExperiencia: 25,
      competencias: [
        'Design Gráfico',
        'Branding & Identidade Corporativa',
        'Packaging & Embalagem',
        'Design Editorial & Paginação',
        'Marketing',
        'SEO Técnico',
        'Google Ads',
        'Pré-Impressão & Produção Gráfica',
      ],
      sectores: ['Alimentar & Vinhos', 'Indústria Transformadora', 'Distribuição & Retalho', 'Farmacêutico', 'Editorial'],
      clientesRelevantes: ['Produtores Vinícolas do Norte', 'Empresas de Componentes Industriais', 'Marcas Alimentares Nacionais', 'Editoras Independentes'],
      ferramentas: ['Adobe Illustrator', 'Adobe InDesign', 'Adobe Photoshop', 'Google Ads Manager', 'Google Search Console', 'Acrobat Pro'],
      especialidades: ['Design de Embalagem', 'Identidade de Marca', 'Catálogos Complexos', 'Campanhas de Google Ads', 'SEO Local e Orgânico'],
    },
  },
  {
    id: 'doc_portfolio_casestudies',
    tipo: 'portfolio',
    nomeFicheiro: 'Portfolio_SelectedWorks_SeniorDesigner.pdf',
    tamanhoBytes: 1250000,
    dataUpload: '2026-03-01T10:15:00Z',
    resumoExtraido: 'Seleção de projetos de packaging industrial e alimentar, rebranding de empresas de média-grande dimensão, catálogos técnicos de 200+ páginas e projetos de performance digital com aumento comprovado de leads via Google Ads e SEO.',
    conteudoTexto: `CASOS DE ESTUDO DESTACADOS NO PORTFÓLIO:
1. Rebranding & Packaging Linha Gourmet "Quinta do Solar" (Alimentar / Azeites e Conservas):
   - Redesenho completo de rótulos, escolha de papéis com textura resistente a gordura, verniz serigráfico localizado.
   - Crescimento de vendas em 35% no canal de exportação.
2. Catálogo Técnico e Identidade "Metalurgia & Moldes do Norte" (Indústria Transformadora):
   - Design editorial de catálogo com 240 páginas de produtos técnicos e tabelas complexas.
   - Produção gráfica com capa dura e estampagem metálica.
3. Estratégia de Captação Digital (SEO + Google Ads) para Marca de Mobiliário de Escritório:
   - Estruturação de catálogo online, arquitetura de informação SEO e campanhas Search no Google Ads gerando leads B2B com redução de 40% no CPL.
4. Identidade Corporativa e Packaging para Linha Cosmética Sustentável "Botânica":
   - Embalagens em cartão kraft 100% reciclado com impressão a duas cores e relevo a seco.`,
    entidadesExtraidas: {
      anosExperiencia: 25,
      competencias: ['Design de Rótulos', 'Catálogos Técnicos', 'Rebranding Industrial', 'Campanhas Google Ads B2B', 'Materiais Sustentáveis'],
      sectores: ['Alimentar', 'Metalomecânica', 'Mobiliário', 'Cosmética Sustentável'],
      clientesRelevantes: ['Quinta do Solar', 'Metalurgia & Moldes do Norte', 'Botânica Cosmética Natural'],
      ferramentas: ['InDesign', 'Illustrator', 'Google Ads', 'Color Management'],
      especialidades: ['Embalagens com Cortante e Vernizes Especiais', 'Design Editorial de Grande Volume', 'Campanhas de Aquisição B2B'],
    },
  },
];

const INITIAL_OFFERS: JobOffer[] = [
  {
    id: 'off_01',
    empresa: 'Lactogal Produtos Alimentares',
    funcao: 'Senior Brand & Packaging Designer',
    localizacao: 'Porto / Matosinhos (4.2 km)',
    distanciaKm: 4.2,
    tempoCarroMin: 8,
    dataOferta: '2026-03-12',
    urlOferta: 'https://pt.linkedin.com/jobs/view/senior-brand-packaging-designer-lactogal',
    websiteEmpresa: 'https://www.lactogal.pt',
    linkedinEmpresa: 'https://www.linkedin.com/company/lactogal',
    contactoRelevante: {
      nome: 'Marta Ribeiro',
      cargo: 'Directora de Marketing e Comunicação de Marcas',
      linkedin: 'https://www.linkedin.com/in/marta-ribeiro-marketing',
      email: 'marta.ribeiro@lactogal.pt',
      verificado: true,
    },
    grauCompatibilidade: 96,
    razoesCompatibilidade: [
      '25 anos de experiência prática comprovada em Packaging alimentar e bens de consumo diário',
      'Domínio exaustivo de processos industriais de pré-impressão e rotulagem',
      'Alinhamento total com as marcas nacionais do grupo',
      'Distância excelente (apenas 4.2 km da residência)',
    ],
    estado: 'novo',
    dataEncontrado: '2026-03-14',
    sector: 'alimentar',
    resumoRequisitos: 'Gestão da identidade visual e redesign de linhas de embalagem para marcas nacionais de grande consumo. Colaboração estreita com equipa de marketing e fornecedores de embalagens.',
  },
  {
    id: 'off_02',
    empresa: 'Bial Farmacêutica',
    funcao: 'Lead Graphic & Editorial Designer',
    localizacao: 'Coronado / Trofa / Maia (7.8 km)',
    distanciaKm: 7.8,
    tempoCarroMin: 11,
    dataOferta: '2026-03-10',
    urlOferta: 'https://bial.com/careers/lead-designer',
    websiteEmpresa: 'https://www.bial.com',
    linkedinEmpresa: 'https://www.linkedin.com/company/bial',
    contactoRelevante: {
      nome: 'Pedro Guimarães',
      cargo: 'Head of Global Corporate Communications',
      linkedin: 'https://www.linkedin.com/in/pedro-guimaraes-bial',
      verificado: true,
    },
    grauCompatibilidade: 92,
    razoesCompatibilidade: [
      'Grande capacidade de design editorial rigoroso (relatórios científicos e manuais de normas)',
      'Experiência consolidada de 25 anos em branding corporativo internacional',
      'Localização muito acessível e infraestrutura de ponta',
    ],
    estado: 'visto',
    dataEncontrado: '2026-03-12',
    sector: 'farmacêutico',
    resumoRequisitos: 'Coordenação e execução de suportes institucionais mundiais, relatórios integrados, folhetos de embalagem e campanhas de sensibilização médica.',
  },
  {
    id: 'off_03',
    empresa: 'Sonae MC / Continente',
    funcao: 'Senior Packaging & Brand Specialist',
    localizacao: 'Senhora da Hora, Matosinhos (5.5 km)',
    distanciaKm: 5.5,
    tempoCarroMin: 9,
    dataOferta: '2026-03-08',
    urlOferta: 'https://recrutamento.sonae.pt/packaging-senior-mc',
    websiteEmpresa: 'https://www.sonaemc.com',
    linkedinEmpresa: 'https://www.linkedin.com/company/sonae-mc',
    contactoRelevante: {
      nome: 'Ana Sofia Valente',
      cargo: 'Brand & Private Label Design Manager',
      linkedin: 'https://www.linkedin.com/in/anasofiavalente-packaging',
      verificado: true,
    },
    grauCompatibilidade: 95,
    razoesCompatibilidade: [
      'Vasta experiência em embalagem de marca própria e adaptação a linhas mass market',
      'Conhecimento em rotulagem regulamentar e sustentabilidade de materiais',
      'Proximidade imediata e vias rápidas sem constrangimentos de trânsito',
    ],
    estado: 'novo',
    dataEncontrado: '2026-03-14',
    sector: 'distribuição',
    resumoRequisitos: 'Desenvolvimento das gamas de packaging das marcas próprias, contacto com gráficas flexográficas e offset, supervisão de provas de cor.',
  },
  {
    id: 'off_04',
    empresa: 'Farfetch Group / Studio',
    funcao: 'Senior Editorial & Digital Art Director',
    localizacao: 'Leça do Balio, Matosinhos (6.1 km)',
    distanciaKm: 6.1,
    tempoCarroMin: 10,
    dataOferta: '2026-03-05',
    urlOferta: 'https://farfetch.wd3.myworkdayjobs.com/editorial-art-director',
    websiteEmpresa: 'https://www.farfetch.com',
    linkedinEmpresa: 'https://www.linkedin.com/company/farfetch',
    contactoRelevante: {
      nome: 'Ricardo Santos',
      cargo: 'Creative Operations Director',
      verificado: false,
    },
    grauCompatibilidade: 88,
    razoesCompatibilidade: [
      'Forte sensibilidade tipográfica e editorial para marcas de luxo',
      'Experiência complementar em SEO e estruturação de campanhas de tráfego',
      'Histórico de projetos de prestígio no portfólio',
    ],
    estado: 'preparada',
    dataEncontrado: '2026-03-11',
    sector: 'tecnologia',
    resumoRequisitos: 'Supervisão de lookbooks digitais, publicações editoriais de alta gama e comunicação visual multiplataforma.',
  },
  {
    id: 'off_05',
    empresa: 'Amorim Cork Composites',
    funcao: 'Lead Brand & Communications Designer',
    localizacao: 'Santa Maria da Feira / Espinho (18.5 km)',
    distanciaKm: 18.5,
    tempoCarroMin: 22,
    dataOferta: '2026-03-02',
    urlOferta: 'https://amorimcorkcomposites.com/carreiras/brand-designer',
    websiteEmpresa: 'https://www.amorim.com',
    linkedinEmpresa: 'https://www.linkedin.com/company/corticeira-amorim',
    contactoRelevante: {
      nome: 'Carlos Amorim Ferreira',
      cargo: 'Diretor de Comunicação Estratégica e Marca',
      verificado: true,
    },
    grauCompatibilidade: 91,
    razoesCompatibilidade: [
      'Grande afinidade com branding industrial de prestígio global e sustentabilidade',
      'Portfólio com soluções em materiais ecológicos e catálogos técnicos',
      'Experiência sénior de 25 anos que transmite total autonomia',
    ],
    estado: 'novo',
    dataEncontrado: '2026-03-13',
    sector: 'indústria',
    resumoRequisitos: 'Desenvolvimento de identidade de produtos sustentáveis, catálogos técnicos para o mercado global e presença em feiras internacionais.',
  },
];

const INITIAL_COMPANIES: SpontaneousCompany[] = [
  {
    id: 'comp_01',
    nome: 'Super Bock Group',
    localizacao: 'Leça do Balio / Matosinhos (3.8 km)',
    distanciaKm: 3.8,
    tempoDeslocacaoCarroMin: 5,
    nivelTransito: 'baixo',
    notasEstacionamento: 'Parque privativo amplo para colaboradores e visitantes; acesso fácil sem constrangimentos de tráfego urbano.',
    website: 'https://www.superbockgroup.com',
    linkedin: 'https://www.linkedin.com/company/super-bock-group',
    dimensaoEconomica: 'Faturação > €500M, mais de 1.400 colaboradores. Líder no setor de bebidas.',
    sector: 'alimentar',
    pessoasRelevantes: [
      {
        nome: 'Bruno Albuquerque',
        cargo: 'Diretor de Marketing de Cervejas e Patrocínios',
        prioridade: 1,
        linkedin: 'https://www.linkedin.com/in/bruno-albuquerque-sbgroup',
        email: 'bruno.albuquerque@superbockgroup.com',
        verificado: true,
      },
      {
        nome: 'Teresa Santos',
        cargo: 'Diretora de Recursos Humanos e Talento',
        prioridade: 2,
        verificado: false,
      },
    ],
    razaoCandidatura: 'Empresa de enorme dimensão com necessidade permanente de redesign de packaging, edições sazonais, ativações de marca e comunicação visual de ponto de venda. Os 25 anos de experiência em embalagem de bebidas e branding são um encaixe imediato para reforço da equipa criativa ou prestação continuada de serviços freelancer.',
    pesquisasGoogleSugeridas: [
      'site:linkedin.com/in "Super Bock Group" marketing',
      'site:linkedin.com/in "Super Bock Group" packaging designer',
      'site:linkedin.com/in "Super Bock Group" recursos humanos',
    ],
    estado: 'novo',
    dataEncontrado: '2026-03-14',
  },
  {
    id: 'comp_02',
    nome: 'Colep Packaging & Consumer Products',
    localizacao: 'Vale de Cambra / São João da Madeira (Parque Empresarial Maia escritório - 4.5 km)',
    distanciaKm: 4.5,
    tempoDeslocacaoCarroMin: 6,
    nivelTransito: 'baixo',
    notasEstacionamento: 'Zona industrial com estacionamento à porta e circulação desafogada.',
    website: 'https://www.colep.com',
    linkedin: 'https://www.linkedin.com/company/colep',
    dimensaoEconomica: 'Faturação > €350M, grupo RAR. Um dos maiores fabricantes europeus de embalagens metálicas e aerossóis.',
    sector: 'produção',
    pessoasRelevantes: [
      {
        nome: 'Paulo Sousa',
        cargo: 'Marketing & Innovation Director',
        prioridade: 1,
        linkedin: 'https://www.linkedin.com/in/paulo-sousa-colep',
        email: 'paulo.sousa@colep.com',
        verificado: true,
      },
      {
        nome: 'Margarida Ramos',
        cargo: 'Diretora de RH Corporativo',
        prioridade: 2,
        verificado: false,
      },
    ],
    razaoCandidatura: 'Gigante da produção de embalagens para cosmética, higiene e alimentação a nível mundial. Um designer com 25 anos de domínio técnico em rotulagem e impressão sobre metais/embalagens rígidas acrescenta valor direto aos projetos de novos produtos e catálogos B2B.',
    pesquisasGoogleSugeridas: [
      'site:linkedin.com/in "Colep" marketing director',
      'site:linkedin.com/in "Colep" packaging innovation',
      'site:linkedin.com/in "Colep" recursos humanos',
    ],
    estado: 'novo',
    dataEncontrado: '2026-03-14',
  },
  {
    id: 'comp_03',
    nome: 'EFACEC Power Solutions',
    localizacao: 'Arroteia, São Mamede de Infesta (3.2 km)',
    distanciaKm: 3.2,
    tempoDeslocacaoCarroMin: 5,
    nivelTransito: 'baixo',
    notasEstacionamento: 'Campus industrial próprio com parqueamento reservado vasto.',
    website: 'https://www.efacec.pt',
    linkedin: 'https://www.linkedin.com/company/efacec',
    dimensaoEconomica: 'Faturação > €200M, mais de 2.000 engenheiros e técnicos. Empresa industrial de referência nacional.',
    sector: 'indústria',
    pessoasRelevantes: [
      {
        nome: 'Marta Delgado',
        cargo: 'Diretora de Marca e Comunicação Corporativa',
        prioridade: 1,
        linkedin: 'https://www.linkedin.com/in/marta-delgado-efacec',
        email: 'marta.delgado@efacec.com',
        verificado: true,
      },
      {
        nome: 'Gonçalo Peixoto',
        cargo: 'Head of People & Organization',
        prioridade: 2,
        verificado: false,
      },
    ],
    razaoCandidatura: 'Empresa em ciclo de modernização de marca e reposicionamento em energia verde e mobilidade elétrica. Necessidade crítica de catálogos técnicos de elevada complexidade, relatórios anuais de sustentabilidade e materiais de comunicação B2B onde a maturidade de 25 anos de design gráfico e editorial faz toda a diferença.',
    pesquisasGoogleSugeridas: [
      'site:linkedin.com/in "Efacec" comunicacao marca',
      'site:linkedin.com/in "Efacec" diretor marketing',
      'site:linkedin.com/in "Efacec" recursos humanos',
    ],
    estado: 'visto',
    dataEncontrado: '2026-03-13',
  },
  {
    id: 'comp_04',
    nome: 'Cerealis - Produtos Alimentares (Nacional / Milaneza)',
    localizacao: 'Águas Santas, Maia (4.1 km)',
    distanciaKm: 4.1,
    tempoDeslocacaoCarroMin: 6,
    nivelTransito: 'baixo',
    notasEstacionamento: 'Instalações fabris e administrativas com parqueamento próprio sem custos.',
    website: 'https://www.cerealis.pt',
    linkedin: 'https://www.linkedin.com/company/cerealis',
    dimensaoEconomica: 'Faturação > €250M, líder nacional na transformação de cereais (marcas Milaneza e Nacional).',
    sector: 'alimentar',
    pessoasRelevantes: [
      {
        nome: 'Sofia Lourenço',
        cargo: 'Brand Manager Mass Market & Cereals',
        prioridade: 1,
        linkedin: 'https://www.linkedin.com/in/sofia-lourenco-cerealis',
        verificado: true,
      },
      {
        nome: 'António Cerealis Teixeira',
        cargo: 'Diretor de Marketing Geral',
        prioridade: 3,
        verificado: true,
      },
    ],
    razaoCandidatura: 'Dezenas de referências de massas, farinhas e bolachas que exigem atualizações regulares de embalagem, tabelas nutricionais segundo normativas europeias e campanhas promocionais. Um designer sénior experiente em packaging poupa tempo considerável à equipa interna.',
    pesquisasGoogleSugeridas: [
      'site:linkedin.com/in "Cerealis" marketing',
      'site:linkedin.com/in "Cerealis" brand manager',
      'site:linkedin.com/in "Cerealis" designer',
    ],
    estado: 'novo',
    dataEncontrado: '2026-03-14',
  },
  {
    id: 'comp_05',
    nome: 'Sonae Indústria / Surforma',
    localizacao: 'Maia Industrial (4.9 km)',
    distanciaKm: 4.9,
    tempoDeslocacaoCarroMin: 7,
    nivelTransito: 'baixo',
    notasEstacionamento: 'Parque empresarial muito espaçoso com facilidade absoluta de estacionamento.',
    website: 'https://www.surforma.com',
    linkedin: 'https://www.linkedin.com/company/sonae-industria',
    dimensaoEconomica: 'Faturação > €600M no grupo. Maior produtor ibérico de derivados de madeira e laminados decorativos.',
    sector: 'indústria',
    pessoasRelevantes: [
      {
        nome: 'Inês Caldas',
        cargo: 'Global Marketing & Communications Lead',
        prioridade: 1,
        linkedin: 'https://www.linkedin.com/in/ines-caldas-marketing',
        verificado: true,
      },
      {
        nome: 'Miguel Brandão',
        cargo: 'Chief Commercial Officer',
        prioridade: 4,
        verificado: false,
      },
    ],
    razaoCandidatura: 'Produção massiva de catálogos de arquitetura, amostras de materiais para designers de interiores, fichas de produto e presença em certames internacionais. O perfil de 25 anos em design editorial, catálogo técnico e branding corporativo é sob medida para este setor.',
    pesquisasGoogleSugeridas: [
      'site:linkedin.com/in "Sonae Industria" marketing',
      'site:linkedin.com/in "Surforma" comunicacao',
      'site:linkedin.com/in "Sonae Industria" recursos humanos',
    ],
    estado: 'novo',
    dataEncontrado: '2026-03-14',
  },
  {
    id: 'comp_06',
    nome: 'Iberfar / Laboratórios Farmacêuticos',
    localizacao: 'Polígono Industrial Maia / Trofa (7.5 km)',
    distanciaKm: 7.5,
    tempoDeslocacaoCarroMin: 9,
    nivelTransito: 'moderado',
    notasEstacionamento: 'Edifício com controlo de acessos e estacionamento garantido.',
    website: 'https://www.iberfar.pt',
    linkedin: 'https://www.linkedin.com/company/iberfar',
    dimensaoEconomica: 'Faturação > €40M, produção farmacêutica e embalagem de medicamentos para terceiros.',
    sector: 'farmacêutico',
    pessoasRelevantes: [
      {
        nome: 'Helena Miranda',
        cargo: 'Responsável de Comunicação e Assuntos Regulamentares',
        prioridade: 1,
        verificado: false,
      },
      {
        nome: 'Vasco Ramos',
        cargo: 'Diretor Geral e Administração',
        prioridade: 4,
        verificado: true,
      },
    ],
    razaoCandidatura: 'O setor farmacêutico requer rigor tipográfico máximo, cumprimento escrupuloso de normas Infarmed/EMA em caixas e bulas, e design de materiais informativos para profissionais de saúde. A maturidade profissional do candidato assegura zero falhas técnicas.',
    pesquisasGoogleSugeridas: [
      'site:linkedin.com/in "Iberfar" marketing',
      'site:linkedin.com/in "Iberfar" comunicacao',
      'site:linkedin.com/in "Iberfar" recursos humanos',
    ],
    estado: 'novo',
    dataEncontrado: '2026-03-14',
  },
];

function normalizeUrl(url: string | undefined | null): string {
  if (!url) return '';
  try {
    const trimmed = url.trim();
    if (!trimmed) return '';
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.protocol}//${host}${pathname}${parsed.search}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }
}

function detectPortal(url: string | undefined | null): string {
  if (!url) return 'Outro Portal';
  const lower = url.toLowerCase();
  if (lower.includes('linkedin.com')) return 'LinkedIn';
  if (lower.includes('indeed.com') || lower.includes('indeed.pt')) return 'Indeed';
  if (lower.includes('net-empregos.com')) return 'Net-Empregos';
  if (lower.includes('cargadetrabalhos.net')) return 'Carga de Trabalhos';
  if (lower.includes('expressoemprego.pt')) return 'Expresso Emprego';
  if (lower.includes('itjobs.pt')) return 'IT Jobs';
  if (lower.includes('landing.jobs')) return 'Landing.jobs';
  if (lower.includes('glassdoor.')) return 'Glassdoor';
  if (lower.includes('sapo.pt')) return 'Sapo Emprego';
  if (lower.includes('jooble.org') || lower.includes('jooble.pt')) return 'Jooble';
  if (lower.includes('infojobs.pt') || lower.includes('infojobs.net')) return 'InfoJobs';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'Outro Portal';
  }
}

function normalizeText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mergeFontesUrls(
  primaryUrl: string,
  existingList?: FonteUrl[],
  incomingUrl?: string,
  incomingList?: FonteUrl[]
): FonteUrl[] {
  const normPrimary = normalizeUrl(primaryUrl);
  const seenUrls = new Set<string>();
  if (normPrimary) {
    seenUrls.add(normPrimary);
  }

  const result: FonteUrl[] = [];

  const addFonte = (item?: { portal?: string; url?: string }) => {
    if (!item || !item.url) return;
    const trimmedUrl = item.url.trim();
    const norm = normalizeUrl(trimmedUrl);
    if (!norm || seenUrls.has(norm)) return;
    seenUrls.add(norm);
    result.push({
      portal: item.portal && item.portal !== 'Outro Portal' ? item.portal : detectPortal(trimmedUrl),
      url: trimmedUrl,
    });
  };

  if (existingList && Array.isArray(existingList)) {
    for (const f of existingList) {
      addFonte(f);
    }
  }

  if (incomingUrl) {
    addFonte({ portal: detectPortal(incomingUrl), url: incomingUrl });
  }

  if (incomingList && Array.isArray(incomingList)) {
    for (const f of incomingList) {
      addFonte(f);
    }
  }

  return result;
}

function areOffersMatching(a: JobOffer, b: JobOffer): boolean {
  // 1. Direct URL match
  const normUrlA = normalizeUrl(a.urlOferta);
  const normUrlB = normalizeUrl(b.urlOferta);
  if (normUrlA && normUrlB && normUrlA === normUrlB) {
    return true;
  }

  // Check any URL intersection between a and b
  const urlsA = new Set<string>();
  if (normUrlA) urlsA.add(normUrlA);
  if (a.fontesUrls) {
    for (const f of a.fontesUrls) {
      const nu = normalizeUrl(f.url);
      if (nu) urlsA.add(nu);
    }
  }

  if (normUrlB && urlsA.has(normUrlB)) return true;
  if (b.fontesUrls) {
    for (const f of b.fontesUrls) {
      const nu = normalizeUrl(f.url);
      if (nu && urlsA.has(nu)) return true;
    }
  }

  // 2. Conservative Company + Role match
  const compA = normalizeText(a.empresa);
  const compB = normalizeText(b.empresa);
  const roleA = normalizeText(a.funcao);
  const roleB = normalizeText(b.funcao);

  if (compA && compB && roleA && roleB && compA === compB && roleA === roleB) {
    if (!!a.isInternacional === !!b.isInternacional) {
      return true;
    }
  }

  return false;
}

function mergeJobOffers(existing: JobOffer, incoming: JobOffer): JobOffer {
  const primaryUrl = existing.urlOferta || incoming.urlOferta || '';
  const incomingAltUrl = existing.urlOferta ? incoming.urlOferta : undefined;
  const mergedFontes = mergeFontesUrls(
    primaryUrl,
    existing.fontesUrls,
    incomingAltUrl,
    incoming.fontesUrls
  );

  const searchSet = new Set<string>(existing.pesquisasGoogleSugeridas || []);
  if (incoming.pesquisasGoogleSugeridas) {
    for (const q of incoming.pesquisasGoogleSugeridas) {
      if (q && q.trim()) searchSet.add(q.trim());
    }
  }

  const reasonsSet = new Set<string>(existing.razoesCompatibilidade || []);
  if (incoming.razoesCompatibilidade) {
    for (const r of incoming.razoesCompatibilidade) {
      if (r && r.trim()) reasonsSet.add(r.trim());
    }
  }

  return {
    ...incoming,
    ...existing, // User edits and existing status take priority
    urlOferta: primaryUrl,
    dataOferta: existing.dataOferta || incoming.dataOferta,
    fontesUrls: mergedFontes.length > 0 ? mergedFontes : undefined,
    websiteEmpresa: existing.websiteEmpresa || incoming.websiteEmpresa,
    linkedinEmpresa: existing.linkedinEmpresa || incoming.linkedinEmpresa,
    contactoRelevante: existing.contactoRelevante?.nome
      ? {
          ...incoming.contactoRelevante,
          ...existing.contactoRelevante,
          email: existing.contactoRelevante.email || incoming.contactoRelevante?.email,
          linkedin: existing.contactoRelevante.linkedin || incoming.contactoRelevante?.linkedin,
        }
      : incoming.contactoRelevante || existing.contactoRelevante,
    distanciaKm:
      typeof existing.distanciaKm === 'number' && !isNaN(existing.distanciaKm) && existing.distanciaKm > 0
        ? existing.distanciaKm
        : incoming.distanciaKm,
    tempoCarroMin:
      typeof existing.tempoCarroMin === 'number' && !isNaN(existing.tempoCarroMin) && existing.tempoCarroMin > 0
        ? existing.tempoCarroMin
        : incoming.tempoCarroMin,
    grauCompatibilidade:
      existing.grauCompatibilidade > 0 ? existing.grauCompatibilidade : (incoming.grauCompatibilidade || 0),
    razoesCompatibilidade: Array.from(reasonsSet),
    pesquisasGoogleSugeridas: searchSet.size > 0 ? Array.from(searchSet) : undefined,
    resumoRequisitos: existing.resumoRequisitos || incoming.resumoRequisitos,
    sector: existing.sector || incoming.sector,
    estado: existing.estado,
    dataEncontrado: existing.dataEncontrado || incoming.dataEncontrado,
    dataEnviado: existing.dataEnviado,
    emailPreparado: existing.emailPreparado || incoming.emailPreparado,
    emailGerado: existing.emailGerado || incoming.emailGerado,
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private validateDatabaseIntegrity(parsed: any): void {
    const issues: string[] = [];

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      console.warn('[INTEGRIDADE DB] A raiz da base de dados data/db.json não é um objeto JSON válido.');
      return;
    }

    // 1. Confirmação da estrutura principal
    const collections = ['ofertas', 'empresas', 'documentos'];
    for (const col of collections) {
      if (!(col in parsed)) {
        issues.push(`Coleção principal ausente: "${col}".`);
      } else if (!Array.isArray(parsed[col])) {
        issues.push(`Coleção "${col}" tem tipo inválido (esperado Array, recebido ${typeof parsed[col]}).`);
      }
    }

    if (!('definicoes' in parsed)) {
      issues.push('Configurações principais ausentes: "definicoes".');
    } else if (typeof parsed.definicoes !== 'object' || parsed.definicoes === null || Array.isArray(parsed.definicoes)) {
      issues.push(`Configurações "definicoes" têm tipo inválido (esperado Object, recebido ${typeof parsed.definicoes}).`);
    }

    // 2. Verificação de ofertas (offers)
    if (Array.isArray(parsed.ofertas)) {
      parsed.ofertas.forEach((o: any, idx: number) => {
        const idStr = o?.id || `índice ${idx}`;
        if (!o || typeof o !== 'object') {
          issues.push(`Oferta [${idStr}] não é um objeto válido.`);
          return;
        }
        if (!o.id || typeof o.id !== 'string') {
          issues.push(`Oferta [${idStr}] sem 'id' válido.`);
        }
        if (!o.empresa || typeof o.empresa !== 'string') {
          issues.push(`Oferta [${idStr}] sem 'empresa' (campo essencial).`);
        }
        if (!o.funcao || typeof o.funcao !== 'string') {
          issues.push(`Oferta [${idStr}] sem 'funcao' (campo essencial).`);
        }
        if (!o.localizacao || typeof o.localizacao !== 'string') {
          issues.push(`Oferta [${idStr}] sem 'localizacao' válida.`);
        }
        if (o.distanciaKm !== undefined && typeof o.distanciaKm !== 'number') {
          issues.push(`Oferta [${idStr}] tem 'distanciaKm' não numérica.`);
        }
        if (!o.estado || typeof o.estado !== 'string') {
          issues.push(`Oferta [${idStr}] sem 'estado' válido.`);
        }
        // Verificação de fontesUrls quando presente
        if (o.fontesUrls !== undefined) {
          if (!Array.isArray(o.fontesUrls)) {
            issues.push(`Oferta [${idStr}] tem 'fontesUrls' inválido (esperado Array de strings).`);
          } else {
            const hasInvalidUrl = o.fontesUrls.some((u: any) => typeof u !== 'string');
            if (hasInvalidUrl) {
              issues.push(`Oferta [${idStr}] contém elementos não-string em 'fontesUrls'.`);
            }
          }
        }
      });
    }

    // 3. Verificação de candidaturas espontâneas (spontaneousCompanies)
    if (Array.isArray(parsed.empresas)) {
      parsed.empresas.forEach((c: any, idx: number) => {
        const idStr = c?.id || `índice ${idx}`;
        if (!c || typeof c !== 'object') {
          issues.push(`Empresa [${idStr}] não é um objeto válido.`);
          return;
        }
        if (!c.id || typeof c.id !== 'string') {
          issues.push(`Empresa [${idStr}] sem 'id' válido.`);
        }
        if (!c.nome || typeof c.nome !== 'string') {
          issues.push(`Empresa [${idStr}] sem 'nome' (campo essencial).`);
        }
        if (!c.localizacao || typeof c.localizacao !== 'string') {
          issues.push(`Empresa [${idStr}] sem 'localizacao' válida.`);
        }
        if (c.distanciaKm !== undefined && typeof c.distanciaKm !== 'number') {
          issues.push(`Empresa [${idStr}] tem 'distanciaKm' não numérica.`);
        }
        if (c.tempoDeslocacaoCarroMin !== undefined && typeof c.tempoDeslocacaoCarroMin !== 'number') {
          issues.push(`Empresa [${idStr}] tem 'tempoDeslocacaoCarroMin' não numérico.`);
        }
        if (c.pessoasRelevantes !== undefined && !Array.isArray(c.pessoasRelevantes)) {
          issues.push(`Empresa [${idStr}] tem 'pessoasRelevantes' inválido (esperado Array).`);
        }
      });
    }

    // 4. Verificação de definições (settings)
    if (parsed.definicoes && typeof parsed.definicoes === 'object') {
      const def = parsed.definicoes;
      if (def.localizacaoBase !== undefined && typeof def.localizacaoBase !== 'string') {
        issues.push("Definição 'localizacaoBase' tem tipo inválido (esperado string).");
      }
      if (def.distanciaKmPadrao !== undefined && typeof def.distanciaKmPadrao !== 'number') {
        issues.push("Definição 'distanciaKmPadrao' tem tipo inválido (esperado number).");
      }
      if (def.tempoCarroMaxMin !== undefined && typeof def.tempoCarroMaxMin !== 'number') {
        issues.push("Definição 'tempoCarroMaxMin' tem tipo inválido (esperado number).");
      }
      if (def.motores !== undefined && (typeof def.motores !== 'object' || def.motores === null)) {
        issues.push("Definição 'motores' tem tipo inválido (esperado object).");
      }
      // Verificação de regrasCopy quando presente
      if (def.regrasCopy !== undefined) {
        if (!Array.isArray(def.regrasCopy) && typeof def.regrasCopy !== 'string' && typeof def.regrasCopy !== 'object') {
          issues.push("Definição 'regrasCopy' com estrutura inválida.");
        }
      }
    }

    // Registo claro no log
    if (issues.length > 0) {
      console.warn(`[INTEGRIDADE DB] Foram detetados ${issues.length} alerta(s) na base de dados data/db.json:`);
      issues.forEach((issue) => console.warn(`  - ${issue}`));
      console.warn('[INTEGRIDADE DB] Arranque mantido sem destruição ou substituição de dados.');
    } else {
      console.info('[INTEGRIDADE DB] Verificação de integridade no arranque concluída com sucesso: dados consistentes.');
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Executar verificação de integridade estrutural
        this.validateDatabaseIntegrity(parsed);

        return {
          ofertas: Array.isArray(parsed.ofertas) ? parsed.ofertas : INITIAL_OFFERS,
          empresas: Array.isArray(parsed.empresas) ? parsed.empresas : INITIAL_COMPANIES,
          documentos: Array.isArray(parsed.documentos) ? parsed.documentos : INITIAL_KNOWLEDGE,
          definicoes: parsed.definicoes && typeof parsed.definicoes === 'object' && !Array.isArray(parsed.definicoes)
            ? { ...INITIAL_SETTINGS, ...parsed.definicoes }
            : INITIAL_SETTINGS,
          historicoEmails: Array.isArray(parsed.historicoEmails) ? parsed.historicoEmails : [],
        };
      }
    } catch (err) {
      console.warn('Erro ao ler base de dados, a criar nova:', err);
    }

    const initial: DatabaseSchema = {
      ofertas: INITIAL_OFFERS,
      empresas: INITIAL_COMPANIES,
      documentos: INITIAL_KNOWLEDGE,
      definicoes: INITIAL_SETTINGS,
      historicoEmails: [],
    };
    this.saveDatabase(initial);
    return initial;
  }

  public saveDatabase(dataToSave?: DatabaseSchema) {
    try {
      this.ensureDataDir();
      const payload = dataToSave || this.data;
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Erro ao guardar base de dados persistente:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public updateOffers(newOffers: JobOffer[]) {
    let addedCount = 0;
    let mergedCount = 0;
    const processingStartTime = Date.parse(OFFER_PROCESSING_START_DATE);

    for (const incoming of newOffers) {
      const publicationTime = incoming.dataOferta ? Date.parse(incoming.dataOferta) : NaN;
      if (Number.isNaN(publicationTime) || publicationTime < processingStartTime) {
        continue;
      }

      const existingIdx = this.data.ofertas.findIndex((exist) => areOffersMatching(exist, incoming));
      if (existingIdx >= 0) {
        this.data.ofertas[existingIdx] = mergeJobOffers(this.data.ofertas[existingIdx], incoming);
        mergedCount++;
      } else {
        this.data.ofertas.push(incoming);
        addedCount++;
      }
    }

    this.saveDatabase();
    return { total: this.data.ofertas.length, added: addedCount, merged: mergedCount };
  }

  public updateOffer(id: string, updates: Partial<JobOffer>): JobOffer | null {
    const target = this.data.ofertas.find((o) => o.id === id);
    if (target) {
      // Obligatorily preserve the original id
      const { id: _ignoredId, ...safeUpdates } = updates;

      // Merge contactoRelevante if both exist so existing fields (nome, cargo, linkedin, verificado) are kept
      if (safeUpdates.contactoRelevante && target.contactoRelevante) {
        safeUpdates.contactoRelevante = {
          ...target.contactoRelevante,
          ...safeUpdates.contactoRelevante,
        };
      }

      Object.assign(target, safeUpdates);
      this.saveDatabase();
      return target;
    }
    return null;
  }

  public updateOfferStatus(id: string, estado: JobOffer['estado'], dataEnviado?: string) {
    const target = this.data.ofertas.find((o) => o.id === id);
    if (target) {
      target.estado = estado;
      if (dataEnviado) {
        target.dataEnviado = dataEnviado;
      }
      this.saveDatabase();
      return target;
    }
    return null;
  }

  public updateOfferEmail(id: string, emailPreparado: { assunto: string; corpo: string; dataGeracao?: string }) {
    const target = this.data.ofertas.find((o) => o.id === id);
    if (target) {
      const emailWithDate = {
        assunto: emailPreparado.assunto,
        corpo: emailPreparado.corpo,
        dataGeracao: emailPreparado.dataGeracao || new Date().toISOString(),
      };
      target.emailPreparado = emailWithDate;
      target.emailGerado = emailWithDate;
      if (target.estado === 'novo') {
        target.estado = 'preparada';
      }
      this.saveDatabase();
      return target;
    }
    return null;
  }

  public updateCompanies(newCompanies: SpontaneousCompany[]) {
    const existingMap = new Map<string, SpontaneousCompany>();
    for (const comp of this.data.empresas) {
      const key = comp.nome.toLowerCase().trim();
      existingMap.set(key, comp);
    }

    let addedCount = 0;
    for (const comp of newCompanies) {
      const key = comp.nome.toLowerCase().trim();
      if (!existingMap.has(key)) {
        existingMap.set(key, comp);
        addedCount++;
      }
    }

    this.data.empresas = Array.from(existingMap.values());
    this.saveDatabase();
    return { total: this.data.empresas.length, added: addedCount };
  }

  public updateCompany(id: string, updates: Partial<SpontaneousCompany>): SpontaneousCompany | null {
    const target = this.data.empresas.find((c) => c.id === id);
    if (target) {
      // Obligatorily preserve the original id
      const { id: _ignoredId, ...safeUpdates } = updates;

      // Merge pessoasRelevantes if provided, otherwise preserve existing
      if (safeUpdates.pessoasRelevantes && target.pessoasRelevantes) {
        safeUpdates.pessoasRelevantes = safeUpdates.pessoasRelevantes;
      }

      Object.assign(target, safeUpdates);
      this.saveDatabase();
      return target;
    }
    return null;
  }

  public updateCompanyStatus(id: string, estado: SpontaneousCompany['estado'], dataEnviado?: string) {
    const target = this.data.empresas.find((c) => c.id === id);
    if (target) {
      target.estado = estado;
      if (dataEnviado) {
        target.dataEnviado = dataEnviado;
      }
      this.saveDatabase();
      return target;
    }
    return null;
  }

  public updateCompanyEmail(id: string, emailPreparado: { assunto: string; corpo: string; dataGeracao?: string }) {
    const target = this.data.empresas.find((c) => c.id === id);
    if (target) {
      const emailWithDate = {
        assunto: emailPreparado.assunto,
        corpo: emailPreparado.corpo,
        dataGeracao: emailPreparado.dataGeracao || new Date().toISOString(),
      };
      target.emailPreparado = emailWithDate;
      target.emailGerado = emailWithDate;
      if (target.estado === 'novo') {
        target.estado = 'preparada';
      }
      this.saveDatabase();
      return target;
    }
    return null;
  }

  public addDocument(doc: KnowledgeDocument) {
    // Replace if same name or type
    this.data.documentos = this.data.documentos.filter((d) => d.id !== doc.id && d.nomeFicheiro !== doc.nomeFicheiro);
    this.data.documentos.push(doc);
    this.saveDatabase();
    return doc;
  }

  public deleteDocument(id: string): boolean {
    const prevCount = this.data.documentos.length;
    this.data.documentos = this.data.documentos.filter((d) => d.id !== id);
    if (this.data.documentos.length !== prevCount) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public updateSettings(settings: Partial<AppSettings>) {
    this.data.definicoes = {
      ...this.data.definicoes,
      ...settings,
      motores: {
        ...this.data.definicoes.motores,
        ...(settings.motores || {}),
      },
      roteamento: {
        ...this.data.definicoes.roteamento,
        ...(settings.roteamento || {}),
      },
      regrasCopy: {
        ...this.data.definicoes.regrasCopy,
        ...(settings.regrasCopy || {}),
      },
    };
    this.saveDatabase();
    return this.data.definicoes;
  }

  public async recalculateAllDistances(customBase?: string): Promise<void> {
    const base = customBase || this.data.definicoes.localizacaoBase || 'Rua Garcia de Orta, 6, 2680-113 Oeiras, Portugal';

    // Recalcular ofertas
    for (const offer of this.data.ofertas) {
      const cleanLoc = geoService.cleanLocationName(offer.localizacao);
      if (cleanLoc) {
        offer.localizacao = cleanLoc;
      }
      const calc = await geoService.calculateDistanceAndDuration(base, offer.localizacao);
      offer.distanciaKm = calc.distanciaKm;
      offer.tempoCarroMin = calc.tempoCarroMin;

      // Se nas razões de compatibilidade houver menção antiga a "4.2 km" ou similar, atualiza
      if (Array.isArray(offer.razoesCompatibilidade)) {
        offer.razoesCompatibilidade = offer.razoesCompatibilidade.map((r) =>
          r.replace(/apenas \d+(\.\d+)?\s*km da residência/gi, `${calc.distanciaKm} km da localização-base`)
        );
      }
    }

    // Recalcular empresas espontâneas
    for (const comp of this.data.empresas) {
      const cleanLoc = geoService.cleanLocationName(comp.localizacao);
      if (cleanLoc) {
        comp.localizacao = cleanLoc;
      }
      const calc = await geoService.calculateDistanceAndDuration(base, comp.localizacao);
      comp.distanciaKm = calc.distanciaKm;
      comp.tempoDeslocacaoCarroMin = calc.tempoCarroMin;
    }

    this.saveDatabase();
  }
}

export const db = new DatabaseManager();
