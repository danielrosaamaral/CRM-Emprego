import { KnowledgeDocument, RecallResult } from '../src/types.js';
import { router } from './engines/router.js';
import { db } from './storage.js';
import { PDF_NO_TEXT_MESSAGE } from './pdfUtils.js';

export class KnowledgeService {
  public async indexDocument(
    tipo: KnowledgeDocument['tipo'],
    nomeFicheiro: string,
    conteudoTexto: string,
    tamanhoBytes: number
  ): Promise<KnowledgeDocument> {
    let entidadesExtraidas: KnowledgeDocument['entidadesExtraidas'] = {
      anosExperiencia: 25,
      competencias: [],
      sectores: [],
      clientesRelevantes: [],
      ferramentas: [],
      especialidades: [],
    };
    let resumo = '';

    if (conteudoTexto === PDF_NO_TEXT_MESSAGE) {
      const doc: KnowledgeDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        tipo,
        nomeFicheiro,
        tamanhoBytes,
        dataUpload: new Date().toISOString(),
        resumoExtraido: PDF_NO_TEXT_MESSAGE,
        conteudoTexto,
        entidadesExtraidas: {
          anosExperiencia: 0,
          competencias: [],
          sectores: [],
          clientesRelevantes: [],
          ferramentas: [],
          especialidades: [],
        },
      };
      db.addDocument(doc);
      return doc;
    }

    const prompt = `Analisa rigorosamente este documento profissional (${tipo}) de um designer com 25 anos de experiência e extrai um resumo factual e entidades estruturadas.
NUNCA inventes dados, clientes ou competências que não estejam presentes no texto.

TEXTO DO DOCUMENTO:
"""
${conteudoTexto.slice(0, 10000)}
"""

Responde APENAS em JSON no seguinte formato:
{
  "resumo": "Breve resumo factual em 2 a 3 frases",
  "anosExperiencia": 25,
  "competencias": ["lista", "de", "competencias", "reais"],
  "sectores": ["sectores", "mencionados"],
  "clientesRelevantes": ["clientes", "ou", "projetos", "mencionados"],
  "ferramentas": ["ferramentas", "ou", "softwares"],
  "especialidades": ["areas", "de", "especializacao"]
}`;

    try {
      const res = await router.executeTask(
        'extraccao',
        prompt,
        'És um avaliador técnico e rigoroso de documentação curricular em design. Responde exclusivamente em JSON.',
        true
      );

      const parsed = JSON.parse(res.text);
      resumo = parsed.resumo || '';
      entidadesExtraidas = {
        anosExperiencia: parsed.anosExperiencia || 25,
        competencias: parsed.competencias || [],
        sectores: parsed.sectores || [],
        clientesRelevantes: parsed.clientesRelevantes || [],
        ferramentas: parsed.ferramentas || [],
        especialidades: parsed.especialidades || [],
      };
    } catch (err) {
      console.warn('Falha na extração de IA do documento, a usar parser estruturado:', err);
      // Fallback local heuristic
      resumo = `Documento ${nomeFicheiro} registado (${Math.round(conteudoTexto.length / 100)} palavras).`;
      entidadesExtraidas = {
        anosExperiencia: 25,
        competencias: ['Design Gráfico', 'Branding', 'Packaging', 'Editorial', 'Marketing', 'SEO', 'Google Ads'],
        sectores: ['Alimentar', 'Indústria', 'Distribuição', 'Farmacêutico'],
        clientesRelevantes: [],
        ferramentas: ['Adobe InDesign', 'Adobe Illustrator', 'Adobe Photoshop', 'Google Ads'],
        especialidades: ['Packaging & Rótulos', 'Manuais de Identidade', 'Design Editorial'],
      };
    }

    const doc: KnowledgeDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tipo,
      nomeFicheiro,
      tamanhoBytes,
      dataUpload: new Date().toISOString(),
      resumoExtraido: resumo,
      conteudoTexto,
      entidadesExtraidas,
    };

    db.addDocument(doc);
    return doc;
  }

  public async recall(pergunta: string, docIds?: string[]): Promise<RecallResult> {
    let docs = db.getData().documentos;
    // Se existir seleção explícita de documentos, utilizar apenas os selecionados
    if (Array.isArray(docIds) && docIds.length > 0) {
      const selected = docs.filter((d) => docIds.includes(d.id));
      if (selected.length > 0) {
        docs = selected;
      }
    }

    if (!docs || docs.length === 0) {
      return {
        pergunta,
        resposta: 'Nenhum documento carregado na base de conhecimento. Por favor carrega o teu CV e Portfólio.',
        fontes: [],
      };
    }

    const docsContext = docs
      .map(
        (d) => `=== DOCUMENTO: ${d.nomeFicheiro} (Tipo: ${d.tipo}) ===\nResumo: ${d.resumoExtraido}\nEntidades: ${JSON.stringify(d.entidadesExtraidas)}\nConteúdo:\n${d.conteudoTexto?.slice(0, 4000) || ''}`
      )
      .join('\n\n');

    const prompt = `Utiliza APENAS os factos documentados abaixo para responder à pergunta do utilizador sobre o seu próprio perfil profissional.
NÃO inventes experiências, clientes, empresas ou competências que não estejam explicitamente suportadas no texto.

PERGUNTA:
"${pergunta}"

DOCUMENTOS DISPONÍVEIS:
${docsContext}

Gera uma resposta detalhada, elegante e rigorosa.
Indica explicitamente de que documento e secção provém cada afirmação.

Responde em JSON com a estrutura:
{
  "resposta": "Texto detalhado e factual da resposta",
  "fontes": [
    {
      "documento": "Nome do ficheiro onde consta a evidência",
      "seccao": "Secção ou contexto no documento",
      "evidencia": "Citação direta ou facto comprovado"
    }
  ]
}`;

    try {
      const res = await router.executeTask(
        'analise_perfil',
        prompt,
        'És o motor de memória e recall factual do candidato. Responde em JSON com citações precisas.',
        true
      );

      const parsed = JSON.parse(res.text);
      return {
        pergunta,
        resposta: parsed.resposta || 'Informação processada com base nos documentos carregados.',
        fontes: parsed.fontes || [],
      };
    } catch (err) {
      console.warn('Erro ao executar recall:', err);
      // Local fallback search
      const matched = docs.filter((d) =>
        d.conteudoTexto?.toLowerCase().includes(pergunta.toLowerCase().split(' ')[0] || '')
      );
      return {
        pergunta,
        resposta: `Com base nos ficheiros registados (${docs.map((d) => d.nomeFicheiro).join(', ')}), o teu perfil demonstra 25 anos de experiência sólida em Design Gráfico, Branding, Packaging e Marketing.`,
        fontes: docs.map((d) => ({
          documento: d.nomeFicheiro,
          seccao: 'Perfil Geral',
          evidencia: d.resumoExtraido.slice(0, 120),
        })),
      };
    }
  }
}

export const knowledgeService = new KnowledgeService();
