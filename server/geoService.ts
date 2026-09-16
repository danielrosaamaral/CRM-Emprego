import fs from 'fs';
import path from 'path';

export interface GeoCoordinate {
  lat: number;
  lon: number;
}

export interface DistanceResult {
  distanciaKm: number;
  tempoCarroMin: number;
  geoDistanciaKm: number;
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'geo-cache.json');

// Dicionário de coordenadas de referência para resolução instantânea a 0ms (offline)
const KNOWN_LOCATIONS: Record<string, GeoCoordinate> = {
  // Distrito de Lisboa / Concelho de Oeiras e arredores
  'rua garcia de orta': { lat: 38.71128, lon: -9.24482 },
  '2680-113': { lat: 38.71128, lon: -9.24482 },
  'oeiras': { lat: 38.69258, lon: -9.31231 },
  'linda-a-velha': { lat: 38.71128, lon: -9.24482 },
  'carnaxide': { lat: 38.7214, lon: -9.2412 },
  'alges': { lat: 38.7001, lon: -9.2312 },
  'algés': { lat: 38.7001, lon: -9.2312 },
  'paco de arcos': { lat: 38.6953, lon: -9.2934 },
  'paço de arcos': { lat: 38.6953, lon: -9.2934 },
  'caxias': { lat: 38.7032, lon: -9.2741 },
  'carcavelos': { lat: 38.6833, lon: -9.3333 },
  'porto salvo': { lat: 38.7167, lon: -9.3000 },
  'taguspark': { lat: 38.7369, lon: -9.3025 },
  'barcarena': { lat: 38.7333, lon: -9.2833 },
  'queijas': { lat: 38.7211, lon: -9.2612 },
  'cascais': { lat: 38.6979, lon: -9.4215 },
  'estoril': { lat: 38.7042, lon: -9.3972 },
  'sintra': { lat: 38.8029, lon: -9.3817 },
  'amadora': { lat: 38.7594, lon: -9.2245 },
  'lisboa': { lat: 38.7223, lon: -9.1393 },
  'loures': { lat: 38.8312, lon: -9.1678 },
  'odivelas': { lat: 38.7934, lon: -9.1834 },
  'almada': { lat: 38.6804, lon: -9.1585 },
  'seixal': { lat: 38.6433, lon: -9.1023 },
  'barreiro': { lat: 38.6633, lon: -9.0723 },
  'setubal': { lat: 38.5244, lon: -8.8882 },
  'setúbal': { lat: 38.5244, lon: -8.8882 },

  // Grande Porto e Norte
  'porto': { lat: 41.1579, lon: -8.6291 },
  'matosinhos': { lat: 41.1807, lon: -8.6822 },
  'leca do balio': { lat: 41.2084, lon: -8.6296 },
  'leça do balio': { lat: 41.2084, lon: -8.6296 },
  'senhora da hora': { lat: 41.1853, lon: -8.6514 },
  'sao mamede de infesta': { lat: 41.1925, lon: -8.6083 },
  'são mamede de infesta': { lat: 41.1925, lon: -8.6083 },
  'arroteia': { lat: 41.1940, lon: -8.6120 },
  'maia': { lat: 41.2333, lon: -8.6167 },
  'aguas santas': { lat: 41.2058, lon: -8.5775 },
  'águas santas': { lat: 41.2058, lon: -8.5775 },
  'trofa': { lat: 41.3392, lon: -8.5601 },
  'coronado': { lat: 41.2800, lon: -8.5794 },
  'vila nova de gaia': { lat: 41.1333, lon: -8.6167 },
  'gaia': { lat: 41.1333, lon: -8.6167 },
  'santa maria da feira': { lat: 40.9258, lon: -8.5422 },
  'espinho': { lat: 40.9933, lon: -8.6417 },
  'vale de cambra': { lat: 40.8500, lon: -8.3833 },
  'sao joao da madeira': { lat: 40.9000, lon: -8.4833 },
  'são joão da madeira': { lat: 40.9000, lon: -8.4833 },
  'braga': { lat: 41.5454, lon: -8.4265 },
  'guimaraes': { lat: 41.4425, lon: -8.2918 },
  'guimarães': { lat: 41.4425, lon: -8.2918 },
  'viana do castelo': { lat: 41.6932, lon: -8.8329 },
  'vila do conde': { lat: 41.3556, lon: -8.7444 },
  'povoa de varzim': { lat: 41.3833, lon: -8.7667 },
  'póvoa de varzim': { lat: 41.3833, lon: -8.7667 },
  'famalicao': { lat: 41.4167, lon: -8.5167 },
  'famalicão': { lat: 41.4167, lon: -8.5167 },

  // Centro e Sul
  'aveiro': { lat: 40.6405, lon: -8.6538 },
  'coimbra': { lat: 40.2033, lon: -8.4103 },
  'leiria': { lat: 39.7436, lon: -8.8071 },
  'santarem': { lat: 39.2367, lon: -8.6855 },
  'santarém': { lat: 39.2367, lon: -8.6855 },
  'caldas da rainha': { lat: 39.4033, lon: -9.1367 },
  'torres vedras': { lat: 39.0917, lon: -9.2583 },
  'evora': { lat: 38.5714, lon: -7.9097 },
  'évora': { lat: 38.5714, lon: -7.9097 },
  'faro': { lat: 37.0194, lon: -7.9304 },
  'portimao': { lat: 37.1367, lon: -8.5378 },
  'portimão': { lat: 37.1367, lon: -8.5378 },
  'funchal': { lat: 32.6669, lon: -16.9241 },
  'ponta delgada': { lat: 37.7412, lon: -25.6756 },

  // Capitais / Cidades Internacionais
  'madrid': { lat: 40.4168, lon: -3.7038 },
  'barcelona': { lat: 41.3879, lon: 2.1699 },
  'paris': { lat: 48.8566, lon: 2.3522 },
  'londres': { lat: 51.5074, lon: -0.1278 },
  'london': { lat: 51.5074, lon: -0.1278 },
  'berlim': { lat: 52.5200, lon: 13.4050 },
  'berlin': { lat: 52.5200, lon: 13.4050 },
  'amesterdao': { lat: 52.3676, lon: 4.9041 },
  'amsterdam': { lat: 52.3676, lon: 4.9041 },
  'bruxelas': { lat: 50.8503, lon: 4.3517 },
  'brussels': { lat: 50.8503, lon: 4.3517 },
  'dublin': { lat: 53.3498, lon: -6.2603 },
  'zurique': { lat: 47.3769, lon: 8.5417 },
  'zurich': { lat: 47.3769, lon: 8.5417 },
  'genebra': { lat: 46.2044, lon: 6.1432 },
  'geneva': { lat: 46.2044, lon: 6.1432 },
  'milao': { lat: 45.4642, lon: 9.1900 },
  'milão': { lat: 45.4642, lon: 9.1900 },
  'milan': { lat: 45.4642, lon: 9.1900 },
  'roma': { lat: 41.9028, lon: 12.4964 },
  'rome': { lat: 41.9028, lon: 12.4964 },
  'nova iorque': { lat: 40.7128, lon: -74.0060 },
  'new york': { lat: 40.7128, lon: -74.0060 },
  'sao paulo': { lat: -23.5505, lon: -46.6333 },
  'são paulo': { lat: -23.5505, lon: -46.6333 },
};

export class GeoService {
  private cache: Record<string, GeoCoordinate> = {};

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        this.cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      }
    } catch {
      this.cache = {};
    }
  }

  private saveCache() {
    try {
      const dir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2), 'utf8');
    } catch {
      // Ignore cache write errors
    }
  }

  /**
   * Limpa a string de localização, removendo sufixos legados como '(4.2 km)'
   */
  public cleanLocationName(loc: string): string {
    if (!loc) return '';
    return loc
      .replace(/[\r\n]+/g, ', ')
      .replace(/\s*\(\d+(\.\d+)?\s*km\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Resolve as coordenadas geográficas para um dado endereço/cidade
   */
  public async getCoordinates(rawLocation: string): Promise<GeoCoordinate | null> {
    const cleaned = this.cleanLocationName(rawLocation).trim();
    if (!cleaned) return null;

    const normalized = cleaned.toLowerCase();

    // 1. Verificar cache em disco
    if (this.cache[normalized]) {
      return this.cache[normalized];
    }

    // 2. Verificar correspondência exata ou por termos no dicionário pré-definido
    for (const [key, coord] of Object.entries(KNOWN_LOCATIONS)) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(normalized)) {
        this.cache[normalized] = coord;
        this.saveCache();
        return coord;
      }
    }

    // 3. Fallback online com OpenStreetMap Nominatim
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const query = encodeURIComponent(cleaned.includes('Portugal') || cleaned.includes(',') ? cleaned : `${cleaned}, Portugal`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'CRM-Emprego-GeoService/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          const coord: GeoCoordinate = {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
          };
          this.cache[normalized] = coord;
          this.saveCache();
          return coord;
        }
      }
    } catch {
      // Ignora erro de rede/timeout do geocoder online
    }

    // 4. Se contiver termos óbvios de Oeiras / Lisboa / Porto por subpartes
    if (/oeiras|linda-a-velha|carnaxide|alges|algés|caxias|paço de arcos|carcavelos/i.test(normalized)) {
      return KNOWN_LOCATIONS['oeiras'];
    }
    if (/lisboa|lisbon/i.test(normalized)) {
      return KNOWN_LOCATIONS['lisboa'];
    }
    if (/matosinhos|leça|leca/i.test(normalized)) {
      return KNOWN_LOCATIONS['matosinhos'];
    }
    if (/porto/i.test(normalized)) {
      return KNOWN_LOCATIONS['porto'];
    }
    if (/maia/i.test(normalized)) {
      return KNOWN_LOCATIONS['maia'];
    }

    return null;
  }

  /**
   * Fórmula de Haversine para cálculo da distância geodésica em linha reta (km)
   */
  public haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio médio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Estima a distância rodoviária com base na distância geodésica (fator de curvatura da rede viária portuguesa)
   */
  public estimateRoadDistance(geoKm: number): number {
    if (geoKm <= 0.5) return 0;
    if (geoKm <= 1.0) return Math.round(geoKm * 10) / 10;
    // Em distâncias urbanas (< 15 km), a sinuosidade das ruas introduz ~25%
    if (geoKm < 15) {
      return Math.round(geoKm * 1.25 * 10) / 10;
    }
    // Em autoestradas interurbanas (A1, A2, A8, etc.), o fator médio é ~1.15
    return Math.round(geoKm * 1.15 * 10) / 10;
  }

  /**
   * Estima o tempo de condução em minutos
   */
  public estimateDriveTimeMinutes(roadKm: number): number {
    if (roadKm <= 0.5) return 0;
    if (roadKm <= 1.5) return 2;
    if (roadKm < 5) return Math.round((roadKm / 28) * 60);
    if (roadKm < 20) return Math.round((roadKm / 45) * 60);
    if (roadKm < 50) return Math.round((roadKm / 75) * 60);
    // Viagens de longa distância (autoestrada a 100-110 km/h + 15 min de acessos urbanos nas pontas)
    return Math.round((roadKm / 105) * 60 + 15);
  }

  /**
   * Calcula a distância rodoviária e tempo de condução entre duas localizações textuais
   */
  public async calculateDistanceAndDuration(baseLocation: string, targetLocation: string): Promise<DistanceResult> {
    const baseCoords = await this.getCoordinates(baseLocation);
    const targetCoords = await this.getCoordinates(targetLocation);

    if (!baseCoords || !targetCoords) {
      // Caso não seja possível geocodificar, assume 0 se for a mesma string, senão 50 km genérico
      const isSame = this.cleanLocationName(baseLocation).toLowerCase() === this.cleanLocationName(targetLocation).toLowerCase();
      const fallbackRoad = isSame ? 0 : 50;
      return {
        distanciaKm: fallbackRoad,
        tempoCarroMin: isSame ? 0 : 35,
        geoDistanciaKm: isSame ? 0 : 40,
      };
    }

    const geoKm = this.haversineDistance(baseCoords.lat, baseCoords.lon, targetCoords.lat, targetCoords.lon);
    const roadKm = this.estimateRoadDistance(geoKm);
    const timeMin = this.estimateDriveTimeMinutes(roadKm);

    return {
      distanciaKm: roadKm,
      tempoCarroMin: timeMin,
      geoDistanciaKm: Math.round(geoKm * 10) / 10,
    };
  }
}

export const geoService = new GeoService();
