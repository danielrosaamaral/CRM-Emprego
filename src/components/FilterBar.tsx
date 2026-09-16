import { RefreshCw, Search, SlidersHorizontal, Car, Navigation, Globe, Compass } from 'lucide-react';
import React from 'react';
import { GeographicScope, OfferStatus } from '../types';

interface FilterBarProps {
  mode: 'ofertas' | 'espontaneas';
  distanceKm: number;
  onDistanceChange: (val: number) => void;
  geographicScope: GeographicScope;
  onGeographicScopeChange: (scope: GeographicScope) => void;
  maxCarMinutes?: number;
  onMaxCarMinutesChange?: (val: number) => void;
  statusFilter: 'todos' | OfferStatus;
  onStatusFilterChange: (status: 'todos' | OfferStatus) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalFiltered: number;
  totalInDatabase: number;
  locationName: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  mode,
  distanceKm,
  onDistanceChange,
  geographicScope,
  onGeographicScopeChange,
  maxCarMinutes = 10,
  onMaxCarMinutesChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  onRefresh,
  isRefreshing,
  totalFiltered,
  totalInDatabase,
  locationName,
}) => {
  const isNational = geographicScope === 'nacional';

  return (
    <div className="bg-white border-b border-[#E5E5EA] py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Main Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Geographic Scope Toggle (Nacional vs Internacional) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex p-0.5 rounded-lg bg-neutral-100 border border-neutral-200">
              <button
                type="button"
                id="btn-scope-nacional"
                onClick={() => onGeographicScopeChange('nacional')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isNational
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Nacional (por Raio)</span>
              </button>
              <button
                type="button"
                id="btn-scope-internacional"
                onClick={() => onGeographicScopeChange('internacional')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  !isNational
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Internacional / Remoto</span>
              </button>
            </div>
          </div>

          {/* Master Distance Slider (Active in National Mode) */}
          {isNational ? (
            <div className="flex-1 max-w-xl">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 uppercase tracking-wide">
                  <Navigation className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Raio Máximo de Distância</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-900 border border-neutral-200">
                    {distanceKm === 0
                      ? '0 km (Morada-base)'
                      : distanceKm >= 600
                      ? '600 km (Cobertura Nacional)'
                      : `${distanceKm} km`}
                  </span>
                  <span className="text-[11px] text-neutral-400">a partir de {locationName}</span>
                </div>
              </div>

              {/* Slider with preset tick marks */}
              <div className="space-y-1">
                <input
                  id="distance-slider"
                  type="range"
                  min="0"
                  max="600"
                  step="5"
                  value={distanceKm}
                  onChange={(e) => onDistanceChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#1D1D1F]"
                />
                <div className="flex justify-between text-[11px] font-mono text-neutral-500 px-0.5">
                  <button
                    type="button"
                    onClick={() => onDistanceChange(0)}
                    className={`hover:text-neutral-900 cursor-pointer ${distanceKm === 0 ? 'font-bold text-neutral-950 underline' : ''}`}
                    title="0 km: Abrangência mínima centrada na morada-base"
                  >
                    [ 0 km ]
                  </button>
                  <button
                    type="button"
                    onClick={() => onDistanceChange(10)}
                    className={`hover:text-neutral-900 cursor-pointer ${distanceKm === 10 ? 'font-bold text-neutral-950 underline' : ''}`}
                  >
                    [ 10 km ]
                  </button>
                  <button
                    type="button"
                    onClick={() => onDistanceChange(30)}
                    className={`hover:text-neutral-900 cursor-pointer ${distanceKm === 30 ? 'font-bold text-neutral-950 underline' : ''}`}
                  >
                    [ 30 km ]
                  </button>
                  <button
                    type="button"
                    onClick={() => onDistanceChange(75)}
                    className={`hover:text-neutral-900 cursor-pointer ${distanceKm === 75 ? 'font-bold text-neutral-950 underline' : ''}`}
                  >
                    [ 75 km ]
                  </button>
                  <button
                    type="button"
                    onClick={() => onDistanceChange(150)}
                    className={`hover:text-neutral-900 cursor-pointer ${distanceKm === 150 ? 'font-bold text-neutral-950 underline' : ''}`}
                  >
                    [ 150 km ]
                  </button>
                  <button
                    type="button"
                    onClick={() => onDistanceChange(350)}
                    className={`hover:text-neutral-900 cursor-pointer ${distanceKm === 350 ? 'font-bold text-neutral-950 underline' : ''}`}
                  >
                    [ 350 km ]
                  </button>
                  <button
                    type="button"
                    onClick={() => onDistanceChange(600)}
                    className={`hover:text-neutral-900 cursor-pointer ${distanceKm >= 600 ? 'font-bold text-neutral-950 underline' : ''}`}
                    title="600 km: Todo o território nacional"
                  >
                    [ Nacional ]
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 max-w-xl flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <Globe className="w-5 h-5 text-neutral-700 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-neutral-900">
                  Modo Internacional / Oportunidades Remotas Globais
                </p>
                <p className="text-[11px] text-neutral-500">
                  A filtrar oportunidades fora de Portugal ou sem limitação geográfica territorial.
                </p>
              </div>
            </div>
          )}

          {/* Drive Time Filter (Especially relevant for Spontaneous Prospects) */}
          {mode === 'espontaneas' && isNational && onMaxCarMinutesChange && (
            <div className="lg:w-64 border-l lg:border-neutral-200 lg:pl-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 uppercase tracking-wide">
                  <Car className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Deslocação de Carro</span>
                </div>
                <span className="text-xs font-mono font-medium text-neutral-900">
                  ≤ {maxCarMinutes} min
                </span>
              </div>
              <div className="flex gap-1">
                {[5, 10, 15].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onMaxCarMinutesChange(m)}
                    className={`flex-1 py-1 text-xs rounded border transition-colors cursor-pointer ${
                      maxCarMinutes === m
                        ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {m === 5 ? '≤ 5 min (Prioridade)' : `≤ ${m} min`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Refresh Action Button */}
          <div className="flex items-center gap-3">
            <button
              id="btn-actualizar"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-medium tracking-wide uppercase rounded-md transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'A Pesquisar...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Search & Status Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-neutral-100">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-neutral-400 mr-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Estado:
            </span>
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'novo', label: 'Novos' },
                { id: 'visto', label: 'Vistos' },
                { id: 'preparada', label: 'Preparadas' },
                { id: 'enviado', label: 'Enviados' },
                { id: 'ignorado', label: 'Ignorados' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onStatusFilterChange(item.id)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors cursor-pointer ${
                  statusFilter === item.id
                    ? 'bg-neutral-900 text-white font-medium'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Search Input & Counter */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Filtrar empresa, sector..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 text-neutral-800"
              />
            </div>
            <div className="text-xs font-mono text-neutral-500 whitespace-nowrap">
              <span className="font-semibold text-neutral-800">{totalFiltered}</span>
              <span className="text-neutral-400">/{totalInDatabase} na BD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
