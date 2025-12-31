# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

Presenton (this fork: SpearPresenton) is an open-source, full-stack AI presentation generator. It has:
- A FastAPI backend (`servers/fastapi/`) that handles presentation generation, content rewrite, multi-agent translation, file processing, database access, and an MCP server.
- A Next.js 14 frontend (`servers/nextjs/`) that provides the UI for creating, editing, translating, and exporting presentations.
- A Node entry script (`start.js`) that orchestrates the FastAPI server, MCP server, Next.js dev/prod server, and an Ollama service.
- Docker/Docker Compose for single-command deployments (with optional GPU support).

The upstream project documentation in `README.md`, `CLAUDE.md`, and `docs/` is accurate for this repo and should be treated as the canonical reference for feature behavior.

## Common development commands

All commands below assume the repo root is the current working directory unless noted.

### Recommended local dev entrypoint

Runs FastAPI, MCP server, Next.js dev server, and Ollama in one shot, wiring up all ports and APP_DATA_DIRECTORY for you:

```bash
node start.js --dev
```

Behavior:
- FastAPI: listens on port `8000` from `servers/fastapi/server.py` with `--reload` enabled.
- Next.js: dev server on `3000` from `servers/nextjs`.
- MCP server: `servers/fastapi/mcp_server.py` on port `8001`.
- Ollama: `ollama serve` (assumes Ollama installed on the host).
- Sets `APP_DATA_DIRECTORY` (default `./app_data`), `TEMP_DIRECTORY`, and `USER_CONFIG_PATH` for children.
- If `CAN_CHANGE_KEYS` is not `"false"`, it bootstraps `APP_DATA_DIRECTORY/userConfig.json` from environment variables.

Use this when iterating on either backend or frontend: Next.js dev will proxy API calls to FastAPI via `next.config.mjs` rewrites.

### Running servers individually

#### FastAPI backend

From `servers/fastapi/`:

```bash
python server.py --port 8000 --reload true
```

Notes:
- Python 3.11+ is required (see `pyproject.toml`).
- Dependencies are defined in both `pyproject.toml` and `requirements.txt`; for local dev, using `requirements.txt` is sufficient:

```bash
cd servers/fastapi
pip install -r requirements.txt
```

#### Next.js frontend

From `servers/nextjs/`:

```bash
npm install        # first time only
npm run dev        # start dev server on http://localhost:3000
```

Production build:

```bash
cd servers/nextjs
npm run build
npm start          # serves the built app from .next-build
```

`next.config.mjs` configures rewrites so that, in dev, requests to:
- `/api/v1/*` → `http://localhost:8000/api/v1/*` (FastAPI)
- `/app_data/fonts/*` → `http://localhost:8000/app_data/fonts/*`

### Docker / Docker Compose

From repo root (`docker-compose.yml`):

```bash
# Production image (CPU)
docker-compose up production

# Production image with GPU (NVIDIA runtime required)
docker-compose up production-gpu

# Development container (mounts local source)
docker-compose up development

docker-compose up development-gpu
```

All services:
- Expose HTTP on host port `5000` → container port `80`.
- Mount `./app_data` into `/app_data` so generated presentations, configs, and DB are persisted.
- Inherit env vars like `LLM`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `ANTHROPIC_API_KEY`, `OLLAMA_MODEL`, `IMAGE_PROVIDER`, `CAN_CHANGE_KEYS`, `WEB_GROUNDING`, `DATABASE_URL`, etc. See `README.md` and `docker-compose.yml` for the full list and semantics.

If you only need a prebuilt image (no source changes), `README.md` documents the `docker run ghcr.io/presenton/presenton:latest ...` variants.

## Testing & linting

### Backend tests (FastAPI)

From `servers/fastapi/`:

```bash
pytest                              # run full backend test suite
pytest -k "test_name"               # run tests matching substring
pytest tests/test_some_file.py      # run a single test file
pytest -v                           # verbose
```

The backend tests cover API endpoints, services (including PPTX generation, content rewrite, and translation), and integration flows.

### Frontend linting and tests (Next.js)

From `servers/nextjs/`:

```bash
npm run lint        # Next.js / ESLint
```

Cypress is configured via `cypress.config.ts` and `cypress` is installed as a dev dependency. If npm scripts for Cypress are not present in `package.json`, you can invoke it directly:

```bash
cd servers/nextjs
npx cypress open    # interactive test runner
npx cypress run     # headless run
```

## High-level architecture

### Process topology

In a typical development setup (`node start.js --dev`) you have:
- **FastAPI backend** on `:8000`: all presentation/translation/content-rewrite APIs, file handling, persistence, and MCP server (on `:8001`).
- **Next.js frontend** on `:3000`: user-facing UI, calling backend via relative paths (`/api/v1/...`).
- **Ollama service** on the host: used when `LLM=ollama`.
- **Nginx** (production only): reverse proxies traffic to the frontend/backend inside the container image.

The runtime data directory is `APP_DATA_DIRECTORY` (default `./app_data`):
- Presentations, uploads, custom templates, translation maps, logs, and (optionally) external DB files live under this tree.
- A `userConfig.json` file in this directory stores user-editable model and feature configuration when `CAN_CHANGE_KEYS=true`.

### Backend (FastAPI) structure

Backend root: `servers/fastapi/`.

**Key layers:**
- `api/v1/ppt/endpoints/`
  - REST endpoints for presentation generation, content rewrite, translation, file upload/download, and MCP/OpenAPI exposure.
  - `content_rewrite.py` wires together placeholder extraction, chunking, LLM calls, and injection for design-preserving rewrites.
  - `translation.py` exposes the three-agent translation pipeline as `POST /api/v1/ppt/translate` plus health/status endpoints.
  - `prompts.py` contains system prompts such as `CONTENT_REWRITE_SYSTEM_PROMPT`.
- `services/`
  - **Core generation services** (as documented in `CLAUDE.md`):
    - `llm_client.py`: unified client for OpenAI, Google, Anthropic, Ollama, and custom OpenAI-compatible endpoints, including structured output and tool calling.
    - `pptx_presentation_creator.py`: converts HTML/Tailwind slide markup into native PPTX using `python-pptx`.
    - `image_generation_service.py`: integrates DALL-E 3, Gemini Flash, Pexels, and Pixabay.
    - `docling_service.py`: document parsing and text extraction for uploads.
    - `llm_tool_calls_handler.py`: web search and tool-call orchestration when `WEB_GROUNDING` is enabled.
    - `database.py`: SQLModel-based DB access, configurable via `DATABASE_URL` (SQLite by default, PostgreSQL/MySQL supported).
  - **Template/content manipulation:**
    - `placeholder_extractor.py` / `placeholder_injector.py`: extract text-only placeholder structures from PPTX and inject rewritten content back while preserving design.
    - `content_chunker.py`: splits large content-rewrite requests into token-bounded batches based on `CONTENT_REWRITE_MAX_INPUT_TOKENS` to avoid context-limit errors.
  - **Translation stack (multi-agent system):**
    - `translation_agents.py`: defines Agent 1 (structure/parser), Agent 2 (translator), Agent 3 (validator/assembler).
    - `translation_tools.py`: central registry of tools used by all agents (placeholder extraction, Google-based translation, quality checks, RTL handling, output writing, etc.).
    - `translation_orchestrator.py`: orchestrates the three agents with retry logic, statistics, and structured error reporting.
- `models/`
  - Pydantic models for requests/responses and SQLModel ORM entities.
- `mcp_server.py`
  - Wraps the OpenAPI spec to expose the service via the Model Context Protocol.

**Data flow (presentation generation):**
1. Frontend sends a generation request to `/api/v1/ppt/presentation/generate`.
2. FastAPI validates the request using Pydantic models.
3. `llm_client.py` calls the selected LLM provider to generate an outline and slide content in a structured format.
4. The HTML/Tailwind template renders slides.
5. `pptx_presentation_creator.py` converts HTML into PPTX; optionally, Puppeteer (via the Next.js side) exports to PDF.
6. Results and related metadata are stored under `APP_DATA_DIRECTORY` and surfaced back to the UI.

**Data flow (content rewrite):**
1. Client uploads an existing PPTX; backend uses `placeholder_extractor.py` to produce a JSON placeholder structure and persists the original file in a temp location.
2. Client provides a prompt (and optionally translation mode) to `/rewrite/generate-rewritten-content`.
3. Backend runs the content-rewrite prompt via `llm_client.py`, optionally using `content_chunker.py` to split large decks into multiple LLM calls.
4. LLM response is validated to match the original placeholder structure.
5. `placeholder_injector.py` writes new text back into a copy of the original PPTX, preserving design.
6. User downloads the rewritten presentation via `/rewrite/inject-and-download` or the convenience `/rewrite/rewrite-complete` endpoint.

**Data flow (multi-agent translation):**
1. Client calls `POST /api/v1/ppt/translate` with a PPTX file plus `source_language` and `target_language`.
2. Agent 1 (structure) extracts placeholders, validates structure, detects language, and creates a translation map.
3. Agent 2 (translator) uses batch translation (typically via Google Translate through `deep-translator`) with optional LLM-based quality checks.
4. Agent 3 (validator/assembler) merges translations, enforces length constraints, and applies RTL layout when needed.
5. The orchestrator writes a translated PPTX plus a translation map under `APP_DATA_DIRECTORY` and returns a `download_url` and stats.

### Frontend (Next.js) structure

Frontend root: `servers/nextjs/`.

Key aspects:
- **App Router:** Pages under `app/(presentation-generator)/` implement the main flows:
  - `dashboard/`: main entry for creating presentations from prompts/documents.
  - `outline/`: review/edit generated outlines.
  - `presentation/`: presentation viewer/editor.
  - `custom-template/`: upload PPTX and derive reusable templates.
  - `content-rewrite/`: UI for the content rewrite feature (upload existing deck, prompt for new content, preview, download).
  - `settings/`: configure LLM provider, models, image provider, translation agent settings, and related flags.
- **State management:** Redux Toolkit is used for global state (e.g., user config/LLM settings). The translation system reads and writes agent configuration through this store.
- **API client layer:** Under `app/(presentation-generator)/services/api/` (and related utilities), the frontend calls backend endpoints via relative URLs (`/api/v1/...`).
- **Presentation templates:**
  - `presentation-templates/[template-name]/` contains React components that define slide layouts and theme metadata.
  - `defaultSchemes.ts` in each template namespace defines default color schemes and styles.
  - Custom templates extracted from user PPTX uploads are stored under `APP_DATA_DIRECTORY/custom_templates/` on the backend but rendered by the frontend.
- **Export:**
  - PDF export uses Puppeteer from the Next.js side; PPTX export is handled by the FastAPI backend.

### Configuration and environment

Core configuration comes from environment variables plus `APP_DATA_DIRECTORY/userConfig.json`:

- **LLM selection and keys**
  - `LLM`: `openai`, `google`, `anthropic`, `ollama`, or `custom`.
  - Provider-specific keys and models: `OPENAI_API_KEY`, `OPENAI_MODEL`, `GOOGLE_API_KEY`, `GOOGLE_MODEL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `OLLAMA_URL`, `OLLAMA_MODEL`, `CUSTOM_LLM_URL`, `CUSTOM_LLM_API_KEY`, `CUSTOM_MODEL`.
  - `TOOL_CALLS`, `DISABLE_THINKING`, `EXTENDED_REASONING`, `WEB_GROUNDING` control advanced behavior.
- **Image provider**
  - `IMAGE_PROVIDER`: `pexels`, `pixabay`, `gemini_flash`, or `dall-e-3`, with corresponding API keys (`PEXELS_API_KEY`, `PIXABAY_API_KEY`, `GOOGLE_API_KEY`, `OPENAI_API_KEY`).
- **Translation system** (multi-agent)
  - `TRANSLATION_USE_AGENTS`, `TRANSLATION_PARSER_USE_LLM`, `TRANSLATION_PARSER_MODEL`.
  - `TRANSLATION_MODEL`, `TRANSLATION_BATCH_SIZE`.
  - `TRANSLATION_VALIDATOR_MODEL`.
- **Content rewrite chunking**
  - `CONTENT_REWRITE_MAX_INPUT_TOKENS`: upper bound for tokens per content-rewrite batch used by `content_chunker.py`.
- **Storage and DB**
  - `APP_DATA_DIRECTORY`: base directory for app data (used by both servers and Docker images).
  - `DATABASE_URL`: optional external DB (PostgreSQL/MySQL); SQLite is default when unset.

When `CAN_CHANGE_KEYS=true`, the UI (Settings page) writes a subset of this configuration to `userConfig.json`. `start.js` merges environment values with any existing file, with env vars taking precedence where present. When `CAN_CHANGE_KEYS=false`, API keys and model choices come only from environment and are not editable in the UI.

## Documentation map (for deeper dives)

This WARP file is intentionally high level. For detailed behavior and implementation notes, prefer:
- `CLAUDE.md`: end-to-end architecture, major services, and common workflows.
- `docs/README.md`: index for all feature-specific docs.
- `docs/CONTENT_REWRITE_FEATURE.md`: content rewrite architecture and endpoints.
- `docs/CHUNKING_IMPLEMENTATION.md`: content chunking strategy and token-limit handling.
- `docs/TRANSLATION_AGENTS.md`, `docs/TRANSLATION_API.md`, `docs/IMPLEMENTATION_SUMMARY.md`, `docs/FULL_INTEGRATION_MAP.md`: multi-agent translation design and integration (backend + frontend).
- `docs/INSTALL_DEPENDENCIES.md`, `docs/QUICK_START.md`, `docs/DEPLOYMENT_NOTES.md`: backend dependency setup and deployment guidance.

Use these documents when you need exact request/response shapes, environment variable defaults, or a line-by-line integration map for the translation and content-rewrite pipelines.