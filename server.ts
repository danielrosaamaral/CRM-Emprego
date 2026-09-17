import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { configService } from './server/configService.js';
import { csvService } from './server/csvService.js';
import { testGeminiConnection } from './server/engines/geminiEngine.js';
import { testGroqConnection } from './server/engines/groqEngine.js';
import { testMistralConnection } from './server/engines/mistralEngine.js';
import { router } from './server/engines/router.js';
import { knowledgeService } from './server/knowledgeService.js';
import { extractTextFromPdfBuffer, PDF_NO_TEXT_MESSAGE } from './server/pdfUtils.js';
import { geoService } from './server/geoService.js';
import { searchService } from './server/searchService.js';
import { db } from './server/storage.js';
import { EngineType } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON parsing with ample limit for documents
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API ROUTES (Always before Vite middleware)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get all app data
  app.get('/api/data', (req, res) => {
    try {
      const data = db.getData();
      const definicoes = JSON.parse(JSON.stringify(data.definicoes));

      for (const engineId of ['gemini', 'groq', 'mistral'] as const) {
        const status = configService.getEngineStatus(engineId);
        if (definicoes.motores[engineId]) {
          definicoes.motores[engineId].apiKeyConfigurada = status.configured;
          definicoes.motores[engineId].temChaveAmbiente = status.temChaveAmbiente;
          definicoes.motores[engineId].maskedKey = status.maskedKey;
          definicoes.motores[engineId].hasKey = status.hasKey;
          definicoes.motores[engineId].isEnvKey = status.isEnvKey;
        }
      }

      res.json({
        ofertas: data.ofertas,
        empresas: data.empresas,
        documentos: data.documentos,
        definicoes,
        historicoEmails: data.historicoEmails,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao carregar dados' });
    }
  });

  // Get current engine configuration (masked, never leaks real keys)
  app.get('/api/config', (req, res) => {
    try {
      const publicEngines = configService.getPublicEngineConfigs();
      res.json({ success: true, motores: publicEngines });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao carregar configuração' });
    }
  });

  // Handler for saving/updating engine API Key
  const handleSaveEngineKey = (req: express.Request, res: express.Response) => {
    try {
      const { engine, apiKey } = req.body;
      if (!engine || !['gemini', 'groq', 'mistral'].includes(engine)) {
        return res.status(400).json({ error: 'Motor de IA inválido' });
      }
      if (typeof apiKey !== 'string') {
        return res.status(400).json({ error: 'Formato de chave de API inválido' });
      }

      const updated = configService.updateEngineKey(engine as EngineType, apiKey);
      const status = configService.getEngineStatus(engine as EngineType);

      // Update db settings config state
      const data = db.getData();
      if (data.definicoes.motores[engine as EngineType]) {
        data.definicoes.motores[engine as EngineType].apiKeyConfigurada = status.configured;
        db.updateSettings({ motores: data.definicoes.motores });
      }

      res.json({
        success: true,
        engine: updated,
        configured: status.configured,
        maskedKey: status.maskedKey,
        message: status.configured ? 'Chave de API guardada com sucesso' : 'Chave de API removida',
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao guardar chave de API' });
    }
  };

  app.post('/api/config/key', handleSaveEngineKey);
  app.post('/api/settings/keys', handleSaveEngineKey);

  // Save/Update engine attributes (ativo, prioridade, modeloPreferido) into data/config.json
  app.post('/api/config/engine', (req, res) => {
    try {
      const { engine, ativo, prioridade, modeloPreferido } = req.body;
      if (!engine || !['gemini', 'groq', 'mistral'].includes(engine)) {
        return res.status(400).json({ error: 'Motor de IA inválido' });
      }

      const updatedEngine = configService.updateEngineSettings(engine, { ativo, prioridade, modeloPreferido });

      // Sync with storage DB
      const currentData = db.getData();
      const currentEngConfig = currentData.definicoes.motores[engine as EngineType];
      if (currentEngConfig) {
        if (typeof ativo === 'boolean') currentEngConfig.ativo = ativo;
        if (typeof prioridade === 'number') currentEngConfig.prioridade = prioridade;
        if (modeloPreferido) currentEngConfig.modeloPreferido = modeloPreferido;
        db.updateSettings({
          motores: {
            ...currentData.definicoes.motores,
            [engine]: currentEngConfig,
          },
        });
      }

      res.json({ success: true, engine: updatedEngine });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao atualizar motor' });
    }
  });

  // Handler for testing engine connection
  const handleTestEngineConnection = async (req: express.Request, res: express.Response) => {
    try {
      const { engine, apiKey } = req.body;
      if (!engine || !['gemini', 'groq', 'mistral'].includes(engine)) {
        return res.status(400).json({ error: 'Motor de IA inválido' });
      }

      let result: {
        success: boolean;
        status: string;
        message: string;
        details?: string;
      };

      if (engine === 'gemini') {
        const testRes = await testGeminiConnection(apiKey);
        result = {
          success: testRes.success,
          status: testRes.status,
          message: testRes.message,
        };
      } else if (engine === 'groq') {
        const testRes = await testGroqConnection(apiKey);
        result = {
          success: testRes.success,
          status: testRes.status,
          message: testRes.message,
        };
      } else if (engine === 'mistral') {
        const testRes = await testMistralConnection(apiKey);
        result = {
          success: testRes.success,
          status: testRes.status,
          message: testRes.message,
        };
      } else {
        const testRes = await configService.testConnection(engine, apiKey);
        result = {
          success: testRes.status === 'valida',
          status: testRes.status,
          message: testRes.message,
          details: testRes.details,
        };
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        status: 'network_error',
        message: `Erro interno ao testar ligação: ${err?.message || String(err)}`,
      });
    }
  };

  app.post('/api/config/test', handleTestEngineConnection);
  app.post('/api/settings/test-key', handleTestEngineConnection);

  // Update settings (e.g. location, engine configurations, routing)
  app.post('/api/settings', async (req, res) => {
    try {
      const body = req.body;
      const newSettings = db.updateSettings(body);

      // Recalculate distances dynamically across all offers and companies if locationBase changed
      if (body.localizacaoBase) {
        await db.recalculateAllDistances(body.localizacaoBase);
      }

      // Also persist to config.json
      if (body.localizacaoBase || body.distanciaKmPadrao || body.tempoCarroMaxMin) {
        configService.updateGeneralSettings({
          localizacaoBase: body.localizacaoBase,
          distanciaKmPadrao: body.distanciaKmPadrao,
          tempoCarroMaxMin: body.tempoCarroMaxMin,
        });
      }

      if (body.motores) {
        for (const [eng, val] of Object.entries(body.motores) as Array<[any, any]>) {
          if (['gemini', 'groq', 'mistral'].includes(eng)) {
            configService.updateEngineSettings(eng, {
              ativo: val.ativo,
              prioridade: val.prioridade,
              modeloPreferido: val.modeloPreferido,
            });
          }
        }
      }

      // Include masked key state in response
      const responseSettings = JSON.parse(JSON.stringify(newSettings));
      for (const engineId of ['gemini', 'groq', 'mistral'] as const) {
        const status = configService.getEngineStatus(engineId);
        if (responseSettings.motores[engineId]) {
          responseSettings.motores[engineId].apiKeyConfigurada = status.configured;
          responseSettings.motores[engineId].temChaveAmbiente = status.temChaveAmbiente;
          responseSettings.motores[engineId].maskedKey = status.maskedKey;
          responseSettings.motores[engineId].hasKey = status.hasKey;
          responseSettings.motores[engineId].isEnvKey = status.isEnvKey;
        }
      }

      res.json({ success: true, definicoes: responseSettings, data: db.getData() });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao atualizar definições' });
    }
  });

  // Search/refresh job offers
  app.post('/api/search/offers', async (req, res) => {
    try {
      const { location, maxKm, geographicScope } = req.body;
      const settings = db.getData().definicoes;
      const loc = location || settings.localizacaoBase;
      const radius = typeof maxKm === 'number' ? maxKm : settings.distanciaKmPadrao;

      const result = await searchService.refreshJobOffers(loc, radius, geographicScope === 'internacional' ? 'internacional' : 'nacional');
      res.json(result);
    } catch (err: any) {
      res.status(502).json({ error: err?.message || 'Erro ao pesquisar ofertas' });
    }
  });

  // Search/refresh spontaneous prospect companies
  app.post('/api/search/companies', async (req, res) => {
    try {
      const { location, maxMinutes, geographicScope } = req.body;
      const settings = db.getData().definicoes;
      const loc = location || settings.localizacaoBase;
      const minutes = typeof maxMinutes === 'number' ? maxMinutes : settings.tempoCarroMaxMin;

      const result = await searchService.refreshCompanies(loc, minutes, geographicScope === 'internacional' ? 'internacional' : 'nacional');
      res.json(result);
    } catch (err: any) {
      res.status(502).json({ error: err?.message || 'Erro ao pesquisar empresas' });
    }
  });

  // Update offer details (inline editing)
  const handleUpdateOfferRoute = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (updates.localizacao) {
        updates.localizacao = geoService.cleanLocationName(updates.localizacao);
        const base = db.getData().definicoes.localizacaoBase;
        const calc = await geoService.calculateDistanceAndDuration(base, updates.localizacao);
        updates.distanciaKm = calc.distanciaKm;
        updates.tempoCarroMin = calc.tempoCarroMin;
      }
      const updated = db.updateOffer(id, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Oferta não encontrada' });
      }
      res.json({ success: true, oferta: updated });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao atualizar oferta' });
    }
  };

  app.put('/api/offers/:id', handleUpdateOfferRoute);
  app.post('/api/offers/:id', handleUpdateOfferRoute);

  // Update offer status
  app.post('/api/offers/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { estado, dataEnviado } = req.body;
      const updated = db.updateOfferStatus(id, estado, dataEnviado);
      if (!updated) {
        return res.status(404).json({ error: 'Oferta não encontrada' });
      }
      res.json({ success: true, oferta: updated });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao atualizar estado' });
    }
  });

  // Update company details (inline editing)
  const handleUpdateCompanyRoute = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (updates.localizacao) {
        updates.localizacao = geoService.cleanLocationName(updates.localizacao);
        const base = db.getData().definicoes.localizacaoBase;
        const calc = await geoService.calculateDistanceAndDuration(base, updates.localizacao);
        updates.distanciaKm = calc.distanciaKm;
        updates.tempoDeslocacaoCarroMin = calc.tempoCarroMin;
      }
      const updated = db.updateCompany(id, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }
      res.json({ success: true, empresa: updated });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao atualizar empresa' });
    }
  };

  app.put('/api/companies/:id', handleUpdateCompanyRoute);
  app.post('/api/companies/:id', handleUpdateCompanyRoute);

  // Update company status
  app.post('/api/companies/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { estado, dataEnviado } = req.body;
      const updated = db.updateCompanyStatus(id, estado, dataEnviado);
      if (!updated) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }
      res.json({ success: true, empresa: updated });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao atualizar estado' });
    }
  });

  // Generate factual customized email
  app.post('/api/email/generate', async (req, res) => {
    try {
      const { type, item, docIds } = req.body;
      if (!type || !item) {
        return res.status(400).json({ error: 'Parâmetros "type" e "item" são obrigatórios' });
      }
      const email = await searchService.generateApplicationEmail(type, item, docIds);
      res.json(email);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao gerar e-mail' });
    }
  });

  // Refine existing email draft (encurtar, tornar_direto, reescrever)
  app.post('/api/email/refine', async (req, res) => {
    try {
      const { action, subject, body, type, item } = req.body;
      if (!action || !body) {
        return res.status(400).json({ error: 'Parâmetros "action" e "body" são obrigatórios' });
      }
      const refined = await searchService.refineEmailDraft(
        action,
        subject || '',
        body,
        type || 'oferta',
        item
      );
      res.json(refined);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao refinar e-mail' });
    }
  });

  // Upload and index CV/Portfolio
  app.post('/api/knowledge/upload', async (req, res) => {
    try {
      const { tipo, nomeFicheiro, conteudoTexto, conteudoBase64, tamanhoBytes } = req.body;
      if (!nomeFicheiro || (!conteudoTexto && !conteudoBase64)) {
        return res.status(400).json({ error: 'Ficheiro ou conteúdo inválido' });
      }

      let textToProcess = conteudoTexto || '';
      if (conteudoBase64) {
        try {
          const pdfBuffer = Buffer.from(conteudoBase64, 'base64');
          textToProcess = await extractTextFromPdfBuffer(pdfBuffer);
        } catch (pdfErr) {
          console.warn('Erro ao processar buffer PDF:', pdfErr);
          textToProcess = PDF_NO_TEXT_MESSAGE;
        }
      }

      const doc = await knowledgeService.indexDocument(
        tipo || 'cv',
        nomeFicheiro,
        textToProcess,
        tamanhoBytes || textToProcess.length
      );
      res.json({ success: true, documento: doc, todosDocumentos: db.getData().documentos });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao indexar documento' });
    }
  });

  // Delete document from Knowledge Base
  app.delete('/api/knowledge/:id', (req, res) => {
    try {
      const { id } = req.params;
      const success = db.deleteDocument(id);
      if (!success) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }
      res.json({ success: true, todosDocumentos: db.getData().documentos });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao apagar documento' });
    }
  });

  // Search/Recall from Knowledge Base
  app.post('/api/knowledge/recall', async (req, res) => {
    try {
      const pergunta = req.body.pergunta || req.body.question;
      const { docIds } = req.body;
      if (!pergunta) {
        return res.status(400).json({ error: 'Pergunta é obrigatória' });
      }
      const recallResult = await knowledgeService.recall(pergunta, docIds);
      res.json(recallResult);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro no recall da base de conhecimento' });
    }
  });

  // CSV Export
  app.get('/api/export/csv', (req, res) => {
    try {
      const tipo = req.query.tipo === 'empresas' ? 'empresas' : 'ofertas';
      let csv = '';
      let filename = '';
      if (tipo === 'ofertas') {
        csv = csvService.exportOffersCsv();
        filename = `ofertas_emprego_${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        csv = csvService.exportCompaniesCsv();
        filename = `candidaturas_espontaneas_${new Date().toISOString().split('T')[0]}.csv`;
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (err: any) {
      res.status(500).send(`Erro ao exportar CSV: ${err?.message}`);
    }
  });

  // CSV Import
  app.post('/api/import/csv', (req, res) => {
    try {
      const { csv, tipo } = req.body;
      if (!csv) {
        return res.status(400).json({ error: 'Conteúdo CSV vazio' });
      }
      const result = csvService.importCsv(csv, tipo === 'empresas' ? 'empresas' : 'ofertas');
      res.json({ success: true, ...result, data: db.getData() });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao importar CSV' });
    }
  });

  // Clear AI router cache
  app.post('/api/cache/clear', (req, res) => {
    router.clearCache();
    res.json({ success: true, message: 'Cache de IA limpa' });
  });

  // Vite middleware for development vs static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Recalculate geographic distances on boot using current base location
  try {
    await db.recalculateAllDistances();
  } catch (geoErr) {
    console.warn('Aviso: falha ao recalcular distâncias no arranque:', geoErr);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Gestão de Candidaturas ativo na porta ${PORT}`);
  });
}

startServer();
