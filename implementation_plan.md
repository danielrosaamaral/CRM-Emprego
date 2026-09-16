# Plano de Implementação — Filtro Geográfico & Eixo de Mobilidade

## 1. Localização & Eixo Geográfico (Especificação Corrigida)
- **0 km = Abrangência mínima**: Centrada estritamente na morada-base do candidato (Maia / Porto, Portugal), apresentando apenas oportunidades imediatas/locais directas.
- **Progressão contínua em quilómetros**: O slider aumenta de forma progressiva a distância (ex.: 0 km, 5 km, 10 km, 20 km, 35 km, 50 km, até ao raio que abranja todo o território nacional: 600 km).
- **Valor máximo (600 km)**: Abrange todo o território de Portugal Continental e Ilhas (cobertura nacional total).
- **Filtragem dinâmica**: Mover o slider filtra os resultados (ofertas de emprego e empresas para candidatura espontânea) em tempo real por `distanciaKm <= distanceKm`.
- **Modo "Internacional" separado**: Mantém-se como um modo/filtro independente do filtro nacional em km (ofertas internacionais/remotas globais tratadas à parte da grelha de distância quilométrica nacional).

## 2. Compatibilidade e Preservação
- Preservar integralmente os dados em `data/db.json` e as configurações em `data/config.json`.
- Manter o debounce e persistência da distância predefinida em `/api/settings`.
- Preservar o filtro de deslocação de carro (≤ 5 min, ≤ 10 min, ≤ 15 min) para candidaturas espontâneas.
- Manter suporte ao modo Nacional vs. Internacional nas vistas e no FilterBar.
