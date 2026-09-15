# Gestão de Candidaturas & Procura de Emprego // Designer Gráfico Sénior

Aplicação web profissional, limpa e modular desenvolvida para um Designer Gráfico freelancer com 25 anos de experiência nas áreas de **Design Gráfico, Branding, Packaging, Editorial, Marketing Digital, SEO e Google Ads**.

A aplicação automatiza a identificação de ofertas, a prospecção de candidaturas espontâneas por tempo real de deslocação de carro e a elaboração factual de e-mails, deixando sempre a decisão e o clique final no Gmail ao utilizador.

---

## Princípios de Funcionamento

- **Sem Envios Automáticos:** A aplicação prepara o assunto e corpo do e-mail com base em factos reais do CV/Portfólio, mas **nunca** envia e-mails sozinha.
- **Gmail Ready:** O botão "Abrir no Gmail" abre uma nova janela de composição do Gmail com destinatário, assunto e corpo já preenchidos. Disponibiliza também o protocolo `mailto:` e botão de cópia instantânea.
- **Filtro Mestre de Distância:** Slider de distância no topo (`[ 5 km ] --- [ 10 km ] --- [ 20 km ]`). A base de dados retém sempre todos os registos; o slider apenas ajusta a visualização.
- **Deslocação de Carro Real:** No modo de candidaturas espontâneas, é dada prioridade a empresas com tempos de deslocação de carro até 5 minutos (máximo ~10 min), com notas de trânsito e estacionamento.
- **Base de Conhecimento Factual:** Extrator e ferramenta interativa *Search / Recall* com indicação explícita das fontes e citações de documentos para evitar alucinações.

---

## Arquitetura & Estrutura do Código

```
├── data/
│   └── db.json                  # Base de dados persistente (ofertas, empresas, perfil, histórico)
├── server/
│   ├── engines/                 # Motores de Inteligência Artificial
│   │   ├── geminiEngine.ts      # Integração @google/genai (Gemini 3.8 Flash)
│   │   ├── groqEngine.ts        # Integração Groq (Llama 3.3 70B)
│   │   ├── mistralEngine.ts     # Integração Mistral (Mistral Small)
│   │   └── router.ts            # Router multi-engine, fallback em cascata e cache
│   ├── csvService.ts            # Exportação e importação CSV com deduplicação
│   ├── knowledgeService.ts      # Indexação estruturada e RAG factual com citações
│   ├── searchService.ts         # Pesquisa de ofertas, prospecção corporativa e e-mails
│   └── storage.ts               # Gestor de persistência JSON à prova de atualizações
├── src/
│   ├── components/
│   │   ├── EmailModal.tsx       # Preparador de e-mail e atalhos para Gmail/mailto
│   │   ├── FilterBar.tsx        # Slider de distância mestre, tempos de condução e estados
│   │   ├── Header.tsx           # Navegação e contadores de estados
│   │   ├── JobOffersList.tsx    # Listagem de ofertas com compatibilidade e contactos
│   │   ├── KnowledgeBase.tsx    # Drag & drop de CV/portfólio e Search / Recall
│   │   ├── QuickSearchModal.tsx # Operadores de pesquisa avançada para LinkedIn
│   │   ├── SettingsPanel.tsx    # Painel de APIs, prioridades de motores e cópia CSV
│   │   └── SpontaneousList.tsx  # Listagem de candidaturas espontâneas e decisores
│   ├── App.tsx                  # Ponto de entrada do cliente React
│   ├── types.ts                 # Modelos de dados e interfaces TypeScript
│   └── utils.ts                 # Construtores de links para Gmail e formatações
├── server.ts                    # Servidor Express com rotas REST e middleware Vite
├── .env.example                 # Declaração das variáveis de ambiente necessárias
└── metadata.json                # Metadados da aplicação
```

---

## Como Clonar e Correr o Projeto

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   Copie `.env.example` para `.env` e configure a sua chave Gemini (no Google AI Studio já é injetada automaticamente):
   ```bash
   cp .env.example .env
   ```

3. **Iniciar em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação fica disponível em `http://localhost:3000`.

4. **Compilar para produção:**
   ```bash
   npm run build
   npm start
   ```

---

## Como Funcionam os Motores de IA & Router Multi-Engine

- **Motor Primário (Google Gemini):** Utiliza o modelo `gemini-3.8-flash` através do SDK oficial `@google/genai`. Executado exclusivamente no lado do servidor para garantir que a chave nunca é exposta no browser.
- **Motores Secundários (Groq & Mistral):** Opcionais. Podem ser ativados e configurados com chaves no ficheiro `.env` ou no painel de Definições.
- **Encaminhamento Inteligente & Fallback:** Se um motor atingir limites de rate limit (429) ou erro temporário, o router avança instantaneamente para o motor secundário ou de fallback configurado, sem interromper a utilização.
- **Cache de Respostas:** Perguntas repetidas na base de conhecimento ou pedidos idênticos são servidos via cache em memória para economizar quota de API.

---

## Onde Ficam Guardados os Dados e Como Recuperá-los

1. **Ficheiro de Persistência Local:**
   Todos os dados (ofertas, empresas, contactos, histórico de e-mails, documentos de CV e preferências) são guardados de forma duradoura em `data/db.json`.
2. **Atualizações de Código:**
   A base de dados é mantida e preservada automaticamente quando novo código é publicado ou quando o servidor reinicia.
3. **Cópia de Segurança em CSV:**
   No painel **Definições & APIs**, pode descarregar a qualquer momento um ficheiro `.csv` completo de:
   - Ofertas de Emprego
   - Candidaturas Espontâneas
4. **Importação sem Duplicações:**
   Ao importar um ficheiro CSV, a aplicação verifica a existência de cada registo (por combinação de empresa e cargo) e adiciona apenas novos itens.

---

## Como Continuar o Desenvolvimento no Google AI Studio

O projeto foi construído respeitando as convenções da plataforma Google AI Studio Build:
- O servidor roda estritamente na porta 3000 (`0.0.0.0:3000`).
- O segredo `GEMINI_API_KEY` é gerido através do menu de configurações do AI Studio e consumido em `server.ts`.
- As alterações de código podem ser sincronizadas diretamente com um repositório GitHub através do menu de exportação da plataforma.
