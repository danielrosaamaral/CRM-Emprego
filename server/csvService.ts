import { JobOffer, SpontaneousCompany } from '../src/types.js';
import { db } from './storage.js';

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

export class CsvService {
  public exportOffersCsv(): string {
    const offers = db.getData().ofertas;
    const headers = [
      'id',
      'empresa',
      'funcao',
      'localizacao',
      'distanciaKm',
      'tempoCarroMin',
      'dataOferta',
      'urlOferta',
      'websiteEmpresa',
      'linkedinEmpresa',
      'contactoNome',
      'contactoCargo',
      'contactoEmail',
      'contactoLinkedin',
      'contactoVerificado',
      'grauCompatibilidade',
      'razoesCompatibilidade',
      'estado',
      'dataEncontrado',
      'dataEnviado',
      'sector',
    ];

    const rows = offers.map((o) => [
      escapeCsvField(o.id),
      escapeCsvField(o.empresa),
      escapeCsvField(o.funcao),
      escapeCsvField(o.localizacao),
      escapeCsvField(o.distanciaKm),
      escapeCsvField(o.tempoCarroMin || ''),
      escapeCsvField(o.dataOferta),
      escapeCsvField(o.urlOferta),
      escapeCsvField(o.websiteEmpresa),
      escapeCsvField(o.linkedinEmpresa || ''),
      escapeCsvField(o.contactoRelevante?.nome || ''),
      escapeCsvField(o.contactoRelevante?.cargo || ''),
      escapeCsvField(o.contactoRelevante?.email || ''),
      escapeCsvField(o.contactoRelevante?.linkedin || ''),
      escapeCsvField(o.contactoRelevante?.verificado ? 'true' : 'false'),
      escapeCsvField(o.grauCompatibilidade),
      escapeCsvField(o.razoesCompatibilidade.join(' | ')),
      escapeCsvField(o.estado),
      escapeCsvField(o.dataEncontrado),
      escapeCsvField(o.dataEnviado || ''),
      escapeCsvField(o.sector || ''),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public exportCompaniesCsv(): string {
    const companies = db.getData().empresas;
    const headers = [
      'id',
      'nome',
      'localizacao',
      'distanciaKm',
      'tempoDeslocacaoCarroMin',
      'nivelTransito',
      'notasEstacionamento',
      'website',
      'linkedin',
      'dimensaoEconomica',
      'sector',
      'pessoasRelevantes',
      'razaoCandidatura',
      'pesquisasGoogleSugeridas',
      'estado',
      'dataEncontrado',
      'dataEnviado',
    ];

    const rows = companies.map((c) => [
      escapeCsvField(c.id),
      escapeCsvField(c.nome),
      escapeCsvField(c.localizacao),
      escapeCsvField(c.distanciaKm),
      escapeCsvField(c.tempoDeslocacaoCarroMin),
      escapeCsvField(c.nivelTransito),
      escapeCsvField(c.notasEstacionamento),
      escapeCsvField(c.website),
      escapeCsvField(c.linkedin),
      escapeCsvField(c.dimensaoEconomica),
      escapeCsvField(c.sector),
      escapeCsvField(JSON.stringify(c.pessoasRelevantes)),
      escapeCsvField(c.razaoCandidatura),
      escapeCsvField(c.pesquisasGoogleSugeridas.join(' | ')),
      escapeCsvField(c.estado),
      escapeCsvField(c.dataEncontrado),
      escapeCsvField(c.dataEnviado || ''),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public importCsv(csvContent: string, tipo: 'ofertas' | 'empresas'): { imported: number; total: number } {
    const lines = csvContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      return { imported: 0, total: 0 };
    }

    // Basic CSV parser accounting for quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      return result;
    };

    const header = parseLine(lines[0]);

    if (tipo === 'ofertas') {
      const newOffers: JobOffer[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        if (row.length < 3) continue;

        const getCol = (name: string, fallback = '') => {
          const idx = header.indexOf(name);
          return idx >= 0 && row[idx] !== undefined ? row[idx] : fallback;
        };

        const empresa = getCol('empresa');
        const funcao = getCol('funcao');
        if (!empresa || !funcao) continue;

        newOffers.push({
          id: getCol('id') || `off_${Date.now()}_${i}`,
          empresa,
          funcao,
          localizacao: getCol('localizacao', 'Local'),
          distanciaKm: parseFloat(getCol('distanciaKm', '5')) || 5,
          tempoCarroMin: parseInt(getCol('tempoCarroMin', '8'), 10) || 8,
          dataOferta: getCol('dataOferta', new Date().toISOString().split('T')[0]),
          urlOferta: getCol('urlOferta', ''),
          websiteEmpresa: getCol('websiteEmpresa', ''),
          linkedinEmpresa: getCol('linkedinEmpresa'),
          contactoRelevante: getCol('contactoNome')
            ? {
                nome: getCol('contactoNome'),
                cargo: getCol('contactoCargo', 'Recrutamento'),
                email: getCol('contactoEmail'),
                linkedin: getCol('contactoLinkedin'),
                verificado: getCol('contactoVerificado') === 'true',
              }
            : undefined,
          grauCompatibilidade: parseInt(getCol('grauCompatibilidade', '90'), 10) || 90,
          razoesCompatibilidade: getCol('razoesCompatibilidade')
            ? getCol('razoesCompatibilidade').split('|').map((s) => s.trim())
            : ['Perfil compatível.'],
          estado: (getCol('estado', 'novo') as JobOffer['estado']) || 'novo',
          dataEncontrado: getCol('dataEncontrado', new Date().toISOString().split('T')[0]),
          dataEnviado: getCol('dataEnviado') || undefined,
          sector: getCol('sector', 'indústria'),
        });
      }

      const res = db.updateOffers(newOffers);
      return { imported: res.added, total: res.total };
    } else {
      const newCompanies: SpontaneousCompany[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        if (row.length < 2) continue;

        const getCol = (name: string, fallback = '') => {
          const idx = header.indexOf(name);
          return idx >= 0 && row[idx] !== undefined ? row[idx] : fallback;
        };

        const nome = getCol('nome');
        if (!nome) continue;

        let pessoas: any[] = [];
        try {
          const parsed = JSON.parse(getCol('pessoasRelevantes', '[]'));
          if (Array.isArray(parsed)) pessoas = parsed;
        } catch {
          pessoas = [];
        }

        newCompanies.push({
          id: getCol('id') || `comp_${Date.now()}_${i}`,
          nome,
          localizacao: getCol('localizacao', 'Local'),
          distanciaKm: parseFloat(getCol('distanciaKm', '4')) || 4,
          tempoDeslocacaoCarroMin: parseInt(getCol('tempoDeslocacaoCarroMin', '5'), 10) || 5,
          nivelTransito: (getCol('nivelTransito', 'baixo') as any) || 'baixo',
          notasEstacionamento: getCol('notasEstacionamento', 'Estacionamento no local'),
          website: getCol('website', ''),
          linkedin: getCol('linkedin', ''),
          dimensaoEconomica: getCol('dimensaoEconomica', 'Dimensão económica relevante'),
          sector: (getCol('sector', 'indústria') as any) || 'indústria',
          pessoasRelevantes: pessoas,
          razaoCandidatura: getCol('razaoCandidatura', 'Grande potencial de contratação criativa.'),
          pesquisasGoogleSugeridas: getCol('pesquisasGoogleSugeridas')
            ? getCol('pesquisasGoogleSugeridas').split('|').map((s) => s.trim())
            : [`site:linkedin.com/in "${nome}" marketing`],
          estado: (getCol('estado', 'novo') as any) || 'novo',
          dataEncontrado: getCol('dataEncontrado', new Date().toISOString().split('T')[0]),
          dataEnviado: getCol('dataEnviado') || undefined,
        });
      }

      const res = db.updateCompanies(newCompanies);
      return { imported: res.added, total: res.total };
    }
  }
}

export const csvService = new CsvService();
