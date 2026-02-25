# ProtoForge — Plano de Implementação

> **Projeto para o Agents League Contest — Creative Apps Track**
> Um sistema multi-agente que transforma designs do Figma + requisitos de PO em PoCs funcionais na Azure.

---

## 1. Visão Geral

**ProtoForge** é um "Lovable turbinado": captura designs do Figma via MCP Server oficial do VS Code, coleta requisitos de um Product Owner por entrevista interativa, e gera um PoC completo com deploy automático na Azure.

Internamente, o ProtoForge usa **Spec Kit** (github/spec-kit) como referência de Spec-Driven Development — os agentes geram artefatos **compatíveis com Spec Kit** (ex.: `base/memory/constitution.md`, `specs/001-poc-feature/spec.md`, `plan.md`, `tasks.md`) antes de gerar código, garantindo PoCs robustos e rastreáveis.

### Fluxo End-to-End (com Spec Kit integrado)

```
┌──────────────────────────────────── VS Code ────────────────────────────────────┐
│                                                                                 │
│  ┌─────────────┐                                                                │
│  │ Figma MCP   │  (servidor oficial — mcp.figma.com/mcp)                        │
│  │ Server      │  40+ tools: get_file, get_styles, get_components...            │
│  └──────┬──────┘                                                                │
│         │                                                                       │
│         ▼                                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐        │
│  │                    ProtoForge MCP Server                            │        │
│  │  (orquestra tudo via GitHub Copilot Agent Mode + Spec Kit SDD)     │        │
│  │                                                                     │        │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐  ┌───────┐ │        │
│  │  │ PO Agent │─▶│ Architect │─▶│ CodeGen  │─▶│ Deploy │─▶│Review │ │        │
│  │  │spec+const│  │plan+tasks │  │implement │  │(Azure) │  │(valid)│ │        │
│  │  └──────────┘  └───────────┘  └──────────┘  └────────┘  └───────┘ │        │
│  │       │              │              │                               │        │
│  │  Spec Kit:      Spec Kit:      Spec Kit (estilo):                  │        │
│  │  constitution   plan.md        implement                           │        │
│  │  spec.md        tasks.md       (executa tasks.md em ordem)          │        │
│  └──────────────────────────────────────────────────────────────────────┘        │
│                                                                                 │
│  GitHub Copilot (Agent Mode) ←→ ProtoForge tools ←→ Figma MCP tools            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Diferenciais vs Lovable

| Aspecto            | Lovable              | ProtoForge                                       |
|--------------------|----------------------|--------------------------------------------------|
| Input              | Texto/prompt         | Figma design + PO requirements                   |
| Fidelidade visual  | Aproximada           | Pixel-perfect via Figma MCP                      |
| Requisitos         | Ad-hoc               | Estruturado com PO workflow                      |
| Deploy             | Preview interno      | Azure (produção real)                            |
| Extensibilidade    | Fechado              | MCP (Figma MCP oficial + ProtoForge MCP)         |
| Metodologia        | Vibe coding          | Spec-Driven Development (Spec Kit)              |
| Integração         | Standalone           | GitHub Copilot Agent Mode + Figma MCP + Azure    |

---

## 2. Arquitetura Técnica

### Tech Stack

| Camada         | Tecnologia                      | Responsabilidade                          |
|----------------|----------------------------------|-------------------------------------------|
| Core/MCP       | TypeScript + Node.js             | MCP Server, orquestração, CLI             |
| AI/ML          | Python                           | LLM client, análise de design, codegen    |
| Design Input   | Figma MCP Server (externo)       | 40+ tools — consumido, não reimplementado |
| Deploy Target  | Azure Static Web Apps + Container Apps | Front-end + back-end dos PoCs gerados |
| IaC            | Bicep                            | Provisionamento Azure                     |
| CI/CD          | GitHub Actions                   | Deploy automatizado                       |

### Estrutura do Projeto

```
protoforge/
├── package.json                   # Deps TypeScript (MCP SDK, Azure SDK, etc.)
├── tsconfig.json
├── pyproject.toml                 # Deps Python (openai, etc.)
├── README.md
├── .env.example                   # Template de variáveis (sem secrets!)
├── .gitignore
│
├── .vscode/
│   ├── mcp.json                   # Configura Figma MCP + ProtoForge MCP
│   └── settings.json              # Copilot Agent Mode habilitado
│
├── src/
│   ├── mcp/
│   │   └── server.ts              # ProtoForge MCP Server — expõe nossos tools
│   │
│   ├── figma/
│   │   ├── client.ts              # MCP Client — consome Figma MCP Server
│   │   ├── normalizer.ts          # Figma output → Design Spec JSON
│   │   └── types.ts               # Tipos: DesignSpec, Component, Token, etc.
│   │
│   ├── agents/
│   │   ├── orchestrator.ts        # Pipeline: Figma→PO→Arch→Code→Deploy→Review
│   │   │
│   │   ├── po/
│   │   │   ├── agent.ts           # Entrevista interativa com o PO
│   │   │   ├── prompts.ts         # System prompts para cada fase
│   │   │   └── templates/
│   │   │       ├── constitution.md # Template Spec Kit: princípios do PoC
│   │   │       ├── spec.md        # Template Spec Kit: user stories + acceptance
│   │   │       └── prd.md         # Template PRD markdown
│   │   │
│   │   ├── architect/
│   │   │   ├── agent.ts           # Decisão de stack + tech spec
│   │   │   ├── prompts.ts
│   │   │   ├── stacks/            # Configs por stack (React, Next, HTML)
│   │   │   └── templates/
│   │   │       └── plan.md        # Template Spec Kit: implementation plan
│   │   │
│   │   ├── codegen/
│   │   │   ├── agent.ts           # Geração de código via Spec Kit tasks
│   │   │   ├── prompts.ts
│   │   │   ├── generators/        # Geradores especializados por stack
│   │   │   └── templates/
│   │   │       └── tasks.md       # Template Spec Kit: task breakdown
│   │   │
│   │   ├── deploy/
│   │   │   ├── agent.ts           # Deploy Azure automatizado
│   │   │   ├── azure.ts           # Azure SDK wrapper
│   │   │   └── templates/         # Bicep templates
│   │   │
│   │   └── review/
│   │       ├── agent.ts           # Validação PoC vs requisitos/design/spec
│   │       └── prompts.ts
│   │
│   ├── ai/
│   │   ├── llm.py                 # Azure OpenAI client
│   │   ├── vision.py              # Análise visual (GPT-4V)
│   │   └── codegen.py             # Pipeline de geração de código
│   │
│   ├── cli/
│   │   └── index.ts               # CLI: new, capture, interview, generate, deploy
│   │
│   └── shared/
│       ├── types.ts               # Tipos compartilhados
│       ├── config.ts              # Configuração centralizada
│       └── logger.ts              # Logging estruturado
│
├── templates/
│   ├── react-vite/                # Starter React + Vite
│   ├── nextjs/                    # Starter Next.js
│   ├── static/                    # Starter HTML/CSS/JS
│   └── azure/
│       ├── staticwebapp.bicep     # IaC para Static Web Apps
│       └── containerapp.bicep     # IaC para Container Apps
│
└── tests/
    ├── figma/                     # Testes do MCP Client + normalizer
    ├── agents/                    # Testes unitários por agente
    └── e2e/                       # Pipeline completo com mocks
```

---

## 3. Componentes Detalhados

### 3.1 Figma MCP Client (`src/figma/`)

**Abordagem**: Consome o Figma MCP Server oficial já configurado no VS Code. Não reimplementamos a API do Figma.

**Responsabilidades**:
- Wrapper tipado sobre os tools do Figma MCP Server
- Chamadas principais: `get_file`, `get_node_info`, `get_styles`, `get_components`, `get_images`
- Normalização do output em **Design Spec JSON** — formato interno padronizado

**Design Spec JSON** (schema simplificado):
```json
{
  "projectName": "MeuApp",
  "pages": [
    {
      "name": "Home",
      "frames": [
        {
          "id": "frame-1",
          "name": "Hero Section",
          "layout": { "type": "flex", "direction": "column", "gap": 16 },
          "children": [
            {
              "type": "text",
              "content": "Welcome",
              "style": { "font": "Inter", "size": 32, "weight": 700, "color": "#1a1a1a" }
            },
            {
              "type": "button",
              "label": "Get Started",
              "style": { "bg": "#6366f1", "radius": 8, "padding": "12px 24px" }
            }
          ]
        }
      ]
    }
  ],
  "tokens": {
    "colors": { "primary": "#6366f1", "text": "#1a1a1a" },
    "typography": { "heading": { "font": "Inter", "weight": 700 } },
    "spacing": { "sm": 8, "md": 16, "lg": 24 }
  },
  "components": [
    { "name": "Button", "variants": ["primary", "secondary", "ghost"] }
  ]
}
```

### 3.2 PO Agent (`src/agents/po/`) — gera Spec Kit constitution + spec

**Abordagem**: Chat interativo que guia o PO por um fluxo estruturado. Ao final, gera artefatos no formato **Spec Kit** para o PoC.

**Fluxo de Entrevista**:
1. **Visão do Produto** — Qual o objetivo? Para quem? Qual problema resolve?
2. **Princípios** — Quais valores guiam o produto? (gera `base/memory/constitution.md`)
3. **User Stories** — Como [persona], quero [ação], para [benefício]
4. **Critérios de Aceite** — Given/When/Then para cada story
5. **Priorização** — P1/P2/P3 (cada story independentemente testável)
6. **Validação** — Resumo + confirmação do PO

**Output** — Artefatos Spec Kit gerados no PoC (layout do Spec Kit):
```
poc-output/
├── base/
│   └── memory/
│       └── constitution.md   ← princípios do PoC (Spec Kit)
└── specs/
    └── 001-poc-feature/
        └── spec.md           ← user stories + acceptance (Spec Kit)
```

**Exemplo de `spec.md` gerado (formato Spec Kit)**:
```markdown
# Feature Specification: Photo Album App

**Status**: Draft
**Input**: PO interview + Figma design

## User Scenarios & Testing

### User Story 1 - View Photo Albums (Priority: P1)
User can see all photo albums organized by date on the main page.

**Independent Test**: Open app → albums visible sorted by date

**Acceptance Scenarios**:
1. **Given** user has photos, **When** opens app, **Then** sees albums by date
2. **Given** empty library, **When** opens app, **Then** sees empty state with CTA

### User Story 2 - Drag & Drop Reorganize (Priority: P2)
User can drag and drop albums to reorder them on the main page.
...
```

### 3.3 Architect Agent (`src/agents/architect/`) — gera Spec Kit plan

**Input**: Design Spec JSON + Spec Kit spec.md + constitution.md

**Decisões automáticas**:
| Complexidade               | Stack Recomendada      |
|----------------------------|------------------------|
| Landing page / site simples | HTML/CSS/JS (static)   |
| SPA com interatividade     | React + Vite           |
| App com API / SSR / auth   | Next.js + API routes   |
| Backend pesado             | Next.js front + Container Apps back |

**Output** — Adiciona artefatos Spec Kit:
```
poc-output/
├── base/
│   └── memory/
│       └── constitution.md
└── specs/
    └── 001-poc-feature/
        ├── spec.md
        ├── plan.md            ← implementation plan (Spec Kit format)
        ├── research.md        ← pesquisa técnica (dependências, patterns)
        └── data-model.md      ← entidades e relacionamentos
```

**O `plan.md` segue o template Spec Kit** com:
- Summary, Technical Context, Constitution Check
- Project Structure (baseado na stack escolhida)
- Referências cruzadas com spec.md

### 3.4 CodeGen Agent (`src/agents/codegen/`) — gera Spec Kit tasks + implementa

**Input**: Spec Kit plan.md + Design Spec JSON + spec.md

**Fluxo em 2 fases (Spec Kit SDD)**:

**Fase A — Gera `tasks.md`** (formato Spec Kit):
```markdown
# Tasks: Photo Album App

## Phase 1: Setup (Shared Infrastructure)
- [ ] T001 Create React + Vite project structure
- [ ] T002 [P] Configure Tailwind with Figma design tokens

## Phase 2: Foundational
- [ ] T003 Setup component library (Button, Card, Grid)
- [ ] T004 [P] Configure routing (react-router)

## Phase 3: User Story 1 - View Albums (P1) 🎯 MVP
- [ ] T005 [P] [US1] Create Album model
- [ ] T006 [US1] Implement AlbumGrid component (from Figma frame)
- [ ] T007 [US1] Implement AlbumCard component (from Figma component)
- [ ] T008 [US1] Add date-based sorting logic
**Checkpoint**: Album listing works standalone

## Phase 4: User Story 2 - Drag & Drop (P2)
- [ ] T009 [US2] Add drag-and-drop with @dnd-kit
- [ ] T010 [US2] Implement reorder persistence
**Checkpoint**: Drag & drop works independently
```

**Fase B — Implementa tasks** (equivalente ao passo *implement* do Spec Kit, mas executado pelo ProtoForge — não depende do `specify` CLI):
- Executa tasks em ordem, respeitando dependências e marcações [P]
- Gera código fiel ao Design Spec do Figma para componentes UI
- Valida cada checkpoint antes de avançar para próximo user story

**Output final**:
```
poc-output/
├── base/memory/constitution.md
├── specs/001-poc-feature/
│   ├── spec.md
│   ├── plan.md
│   ├── tasks.md
│   ├── research.md        (opcional)
│   └── data-model.md      (opcional)
├── src/                           ← código gerado
├── tests/                         ← testes gerados
├── package.json
└── README.md
```

### 3.5 Deploy Agent (`src/agents/deploy/`)

**Input**: Código gerado + plan.md (para contexto de stack)

**Pipeline**:
1. Gera `staticwebapp.config.json` ou `Dockerfile` conforme a stack
2. Gera Bicep templates para provisionamento Azure
3. Gera GitHub Actions workflow (`.github/workflows/deploy.yml`)
4. Executa `az deployment` via Azure CLI
5. Retorna URL do PoC deployado

**Azure Resources**:
- **Front-end**: Azure Static Web Apps (free tier para PoC)
- **Back-end**: Azure Container Apps (consumption plan)
- **Opcional**: Azure Cosmos DB (se houver persistência)

### 3.6 Review Agent (`src/agents/review/`)

**Input**: URL do PoC + Design Spec + Spec Kit artifacts (spec.md, tasks.md)

**Validações** (rastreáveis via Spec Kit):
1. **Spec Compliance** — Cada user story do spec.md tem implementação? Acceptance scenarios passam?
2. **Task Coverage** — Todas as tasks do tasks.md foram executadas?
3. **Visual** — Screenshot do PoC vs design Figma (similarity score)
4. **Técnico** — Build ok? Testes passam? Sem vulnerabilidades?
5. **Constitution** — Princípios definidos no constitution.md foram respeitados?

**Output**: Relatório de conformidade rastreável aos artefatos Spec Kit

---

## 4. Integração com VS Code / GitHub Copilot

### `.vscode/mcp.json` (configuração)
```json
{
  "servers": {
    "figma": {
      "url": "https://mcp.figma.com/mcp",
      "type": "sse"
    },
    "protoforge": {
      "command": "node",
      "args": ["--experimental-strip-types", "src/mcp/server.ts"],
      "cwd": "${workspaceFolder}\\protoforge",
      "env": {
        "AZURE_OPENAI_ENDPOINT": "${env:AZURE_OPENAI_ENDPOINT}",
        "AZURE_OPENAI_KEY": "${env:AZURE_OPENAI_KEY}"
      }
    }
  }
}
```

### Tools expostos pelo ProtoForge MCP Server

| Tool                    | Descrição                                                      | Spec Kit Output (paths no PoC)                          |
|-------------------------|----------------------------------------------------------------|----------------------------------------------------------|
| `protoforge_capture`    | Captura design do Figma via MCP e gera Design Spec JSON        | —                                                        |
| `protoforge_interview`  | Entrevista PO, gera constitution + spec                        | `base/memory/constitution.md`, `specs/001-poc-feature/spec.md`  |
| `protoforge_architect`  | Analisa Design Spec + spec.md → plan técnico                   | `specs/001-poc-feature/plan.md`, `specs/001-poc-feature/research.md`, `specs/001-poc-feature/data-model.md` |
| `protoforge_generate`   | Gera tasks + implementa código do PoC                          | `specs/001-poc-feature/tasks.md` + `src/` + `tests/`            |
| `protoforge_deploy`     | Deploya PoC na Azure, retorna URL                              | —                                                        |
| `protoforge_review`     | Valida PoC contra spec/tasks/constitution e design             | `specs/001-poc-feature/review.md`                               |
| `protoforge_forge`      | Pipeline completo (capture→interview→arch→gen→deploy→review)   | Todos os artefatos acima                                 |

### Uso no Copilot Agent Mode
```
Usuário: @protoforge forge este design do Figma em um PoC na Azure

Copilot:
1. protoforge_capture   → extrai Design Spec JSON do Figma MCP
2. protoforge_interview → entrevista PO → `base/memory/constitution.md` + `specs/001-poc-feature/spec.md`
3. protoforge_architect → analisa spec + design → `specs/001-poc-feature/plan.md` + `specs/001-poc-feature/research.md`
4. protoforge_generate  → gera `specs/001-poc-feature/tasks.md` → implementa `src/` + `tests/`
5. protoforge_deploy    → deploya na Azure → retorna URL
6. protoforge_review    → valida PoC → gera `specs/001-poc-feature/review.md`
7. Retorna: URL + `specs/001-poc-feature/` + `base/memory/constitution.md` + `specs/001-poc-feature/review.md`
```

---

## 5. Plano de Implementação (Tasks Ordenadas)

### Fase 1 — Fundação
| #  | Task               | Descrição                                                                 | Depende de |
|----|--------------------|---------------------------------------------------------------------------|------------|
| 1  | scaffold-project   | package.json, tsconfig, pyproject.toml, .gitignore, .env.example, dirs    | —          |
| 2  | templates          | Starters (react-vite, nextjs, static) + Bicep templates Azure             | 1          |

### Fase 2 — Agentes Core (paralelos)
| #  | Task               | Descrição                                                                 | Depende de |
|----|--------------------|---------------------------------------------------------------------------|------------|
| 3  | figma-mcp          | MCP Client para Figma MCP Server + normalizer → Design Spec JSON          | 1          |
| 4  | po-agent           | Entrevista PO → `base/memory/constitution.md` + `specs/001-poc-feature/spec.md` | 1          |
| 5  | architect-agent    | Design Spec + spec.md → `specs/001-poc-feature/plan.md` + `specs/001-poc-feature/research.md` | 1          |

### Fase 3 — Agentes Downstream
| #  | Task               | Descrição                                                                 | Depende de |
|----|--------------------|---------------------------------------------------------------------------|------------|
| 6  | codegen-agent      | `specs/001-poc-feature/tasks.md` + implementa `src/` + `tests/`                 | 2, 5       |
| 7  | deploy-agent       | Deploy Azure (Static Web Apps + Container Apps) + GitHub Actions          | 2          |
| 8  | review-agent       | Validação rastreável → `specs/001-poc-feature/review.md`                        | 6          |

### Fase 4 — Integração
| #  | Task               | Descrição                                                                 | Depende de |
|----|--------------------|---------------------------------------------------------------------------|------------|
| 9  | orchestrator       | Pipeline completo coordenando todos os agentes. Estado, erros, retry.     | 3–8        |
| 10 | cli                | CLI com comandos: new, capture, interview, generate, deploy, review       | 9          |

### Fase 5 — Qualidade e Entrega
| #  | Task               | Descrição                                                                 | Depende de |
|----|--------------------|---------------------------------------------------------------------------|------------|
| 11 | tests              | Testes unitários (agentes, MCP) + e2e (pipeline com mocks)                | 9          |
| 12 | readme-demo        | README completo + vídeo demo para submissão no contest                    | 10, 11     |

### Grafo de Dependências

```
scaffold-project ──┬── templates ──────┬── codegen-agent ──┬── review-agent ──┐
                   │                   │                   │                  │
                   ├── figma-mcp ──────┤                   │                  │
                   │                   │                   │                  │
                   ├── po-agent ───────┼── orchestrator ◄──┴──────────────────┤
                   │                   │       │                              │
                   └── architect-agent─┘       ▼                              │
                                             cli ─────────────────────────────┤
                                             tests ───────────────────────────┤
                                                                              ▼
                                                                         readme-demo
```

---

## 6. Critérios do Contest Atendidos

| Critério                          | Peso  | Como o ProtoForge atende                                         |
|-----------------------------------|-------|------------------------------------------------------------------|
| Accuracy & Relevance              | 20%   | PoC fiel ao design Figma + spec.md rastreável (Spec Kit)         |
| Reasoning & Multi-step Thinking   | 20%   | Pipeline SDD: constitution→spec→plan→tasks→implement→review      |
| Creativity & Originality          | 15%   | Conceito único: Figma + PO + Spec Kit SDD → Azure em minutos    |
| UX & Presentation                 | 15%   | Agent Mode no Copilot + artefatos Spec Kit navegáveis            |
| Reliability & Safety              | 20%   | Constitution governa código, IaC, validação, zero secrets        |
| Community Vote                    | 10%   | Demo "uau": design vira app + specs completas na Azure           |

---

## 7. Checklist de Submissão

- [ ] Repositório público no GitHub com MIT License
- [ ] README completo (install, usage, architecture, screenshots)
- [ ] Documentar uso do GitHub Copilot no desenvolvimento
- [ ] Vídeo demo (Figma design → PoC rodando na Azure)
- [ ] Nenhum secret/credential/PII no código
- [ ] `.env.example` com placeholders
- [ ] Submeter issue no repositório Agents League

---

## 8. Execução (log)

- 2026-02-25 — Scaffold inicial criado em `protoforge/` (package.json, tsconfig, pyproject, `.env.example`, `.gitignore`, `.vscode/mcp.json`).
- 2026-02-25 — CLI scaffold executada (`npm run init` e `npm run interview`), gerando:
  - `protoforge/base/memory/constitution.md`
  - `protoforge/specs/001-poc-feature/spec.md`
- 2026-02-25 — Templates iniciais criados em `protoforge/templates/`:
  - `static/` (HTML/CSS/JS funcional)
  - `azure/` (placeholders Bicep)
  - `react-vite/` e `nextjs/` (placeholders)
- 2026-02-25 — PO Agent (incremental) implementado via CLI: `npm run interview` agora faz entrevista simples e reescreve `constitution.md` + `spec.md` a partir de templates.
- 2026-02-25 — Figma MCP Client (incremental) criado em `protoforge/src/figma/` com wrapper tipado + normalizer inicial.
- 2026-02-25 — Architect Agent (incremental) criado e integrado ao CLI via `npm run architect` (gera `specs/001-poc-feature/plan.md`, `research.md`, `data-model.md`).
- 2026-02-25 — CodeGen Agent (incremental) criado e integrado ao CLI via `npm run generate` (gera `specs/001-poc-feature/tasks.md` e materializa PoC em `protoforge/pocs/001-poc-feature/`).
- 2026-02-25 — Review Agent (incremental) criado e integrado ao CLI via `npm run review` (gera `specs/001-poc-feature/review.md`).
- 2026-02-25 — Deploy Agent (incremental) criado e integrado ao CLI via `npm run deploy` (gera `specs/001-poc-feature/deploy.md` com pré-requisitos e próximos passos). 
- 2026-02-25 — Orchestrator (incremental) criado e integrado ao CLI via `npm run forge` (encadeia architect→generate→review→deploy; requer `spec.md`).
- 2026-02-25 — CLI expandida com comando `capture` (stub) para gerar `design-spec.json` a partir de um JSON de entrada.
- 2026-02-25 — Testes mínimos adicionados com `node --test` (smoke test do normalizer).
- 2026-02-25 — README do `protoforge/` atualizado com o fluxo e comandos atuais.
- 2026-02-25 — Spec Kit clonado em `context/spec-kit` (referência de templates/metodologia).
