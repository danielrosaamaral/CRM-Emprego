import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { csvService } from './server/csvService.js';
import { router } from './server/engines/router.js';
import { knowledgeService } from './server/knowledgeService.js';
import { searchService } from './server/searchService.js';
import { db } from './server/storage.js';

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
      // Ensure we inform client about environment keys without leaking secrets
      const definicoes = { ...data.definicoes };
      definicoes.motores.gemini.temChaveAmbiente = !!process.env.GEMINI_API_KEY;
      definicoes.motores.gemini.apiKeyConfigurada = !!process.env.GEMINI_API_KEY;
      definicoes.motores.groq.temChaveAmbiente = !!process.env.GROQ_API_KEY;
      definicoes.motores.mistral.temChaveAmbiente = !!process.env.MISTRAL_API_KEY;

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

  // Update settings (e.g. location, engine configurations, routing)
  app.post('/api/settings', (req, res) => {
    try {
      const newSettings = db.updateSettings(req.body);
      res.json({ success: true, definicoes: newSettings });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao atualizar definições' });
    }
  });

  // Search/refresh job offers
  app.post('/api/search/offers', async (req, res) => {
    try {
      const { location, maxKm } = req.body;
      const settings = db.getData().definicoes;
      const loc = location || settings.localizacaoBase;
      const radius = typeof maxKm === 'number' ? maxKm : settings.distanciaKmPadrao;

      const result = await searchService.refreshJobOffers(loc, radius);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao pesquisar ofertas' });
    }
  });

  // Search/refresh spontaneous prospect companies
  app.post('/api/search/companies', async (req, res) => {
    try {
      const { location, maxMinutes } = req.body;
      const settings = db.getData().definicoes;
      const loc = location || settings.localizacaoBase;
      const minutes = typeof maxMinutes === 'number' ? maxMinutes : settings.tempoCarroMaxMin;

      const result = await searchService.refreshCompanies(loc, minutes);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao pesquisar empresas' });
    }
  });

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
      const { type, item } = req.body;
      if (!type || !item) {
        return res.status(400).json({ error: 'Parâmetros "type" e "item" são obrigatórios' });
      }
      const email = await searchService.generateApplicationEmail(type, item);
      res.json(email);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao gerar e-mail' });
    }
  });

  // Upload and index CV/Portfolio
  app.post('/api/knowledge/upload', async (req, res) => {
    try {
      const { tipo, nomeFicheiro, conteudoTexto, tamanhoBytes } = req.body;
      if (!nomeFicheiro || !conteudoTexto) {
        return res.status(400).json({ error: 'Ficheiro ou conteúdo inválido' });
      }
      const doc = await knowledgeService.indexDocument(
        tipo || 'cv',
        nomeFicheiro,
        conteudoTexto,
        tamanhoBytes || conteudoTexto.length
      );
      res.json({ success: true, documento: doc, todosDocumentos: db.getData().documentos });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao indexar documento' });
    }
  });

  // Search/Recall from Knowledge Base
  app.post('/api/knowledge/recall', async (req, res) => {
    try {
      const { pergunta } = req.body;
      if (!pergunta) {
        return res.status(400).json({ error: 'Pergunta é obrigatória' });
      }
      const recallResult = await knowledgeService.recall(pergunta);
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

    // Explicit fallback for SPA routes in dev mode to guarantee index.html is transformed and served
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Gestão de Candidaturas ativo na porta ${PORT}`);
  });
}

startServer();
