# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Presenton is an open-source AI presentation generator that runs locally. It's a full-stack application with a FastAPI backend and Next.js frontend, supporting multiple LLM providers (OpenAI, Google, Anthropic, Ollama, custom OpenAI-compatible endpoints) and image generation services.

The system generates presentations from prompts or documents, allows custom HTML/Tailwind templates, exports to PPTX/PDF, and includes an MCP (Model Context Protocol) server for integration with Claude Desktop and other MCP clients.

## Architecture

### Multi-Server Setup

The application runs three main processes orchestrated by `start.js`:
- **FastAPI Backend** (port 8000): Python API server handling presentation generation, LLM interactions, and file processing
- **Next.js Frontend** (port 3000): React-based UI for creating and editing presentations
- **MCP Server** (port 8001): OpenAPI-based MCP server for external integrations
- **Nginx**: Reverse proxy serving the frontend on port 80/5000

### Key Components

#### FastAPI Backend (`servers/fastapi/`)
- **API Structure**: RESTful API at `/api/v1/ppt/` with modular endpoints
- **Core Services**:
  - `llm_client.py`: Unified LLM client supporting multiple providers with structured output
  - `pptx_presentation_creator.py`: Converts HTML slides to PowerPoint using python-pptx
  - `image_generation_service.py`: Handles image generation (DALL-E 3, Gemini Flash, Pexels, Pixabay)
  - `docling_service.py`: Document parsing and text extraction
  - `database.py`: SQLModel-based database layer supporting SQLite, PostgreSQL, MySQL
  - `llm_tool_calls_handler.py`: Web search and tool calling for LLMs
- **Presentation Generation Pipeline**:
  1. Document/prompt processing → outline generation
  2. LLM generates structured slide content
  3. Template rendering (HTML/Tailwind)
  4. Export to PPTX via python-pptx or PDF via Puppeteer
- **Template System**: HTML templates in `servers/nextjs/presentation-templates/` (general, modern, standard, swift)
- **Custom Template Generation**: Extracts layouts, fonts, and styles from uploaded PPTX files to create new templates

#### Next.js Frontend (`servers/nextjs/`)
- **App Router Structure**: Routes in `app/(presentation-generator)/`
  - `dashboard/`: Main entry point for creating presentations
  - `outline/`: Review and edit AI-generated outlines
  - `presentation/`: Presentation viewer and editor
  - `custom-template/`: Upload PPTX to generate custom templates
  - `settings/`: Configure LLM and image providers
- **Template Rendering**: Dynamic React components render HTML templates with live editing
- **State Management**: Redux Toolkit for global state
- **Export**: Puppeteer for PDF, API calls for PPTX generation

#### MCP Server (`servers/fastapi/mcp_server.py`)
Uses FastMCP to expose presentation generation API via Model Context Protocol. The server wraps the OpenAPI spec (`openai_spec.json`) for Claude Desktop integration.

### Data Flow

```
User Input → Next.js UI → FastAPI API → LLM Client → Provider (OpenAI/Google/etc)
                                     ↓
                              Outline Generation
                                     ↓
                              Slide Content Generation
                                     ↓
                              Template Rendering
                                     ↓
                              Export (PPTX/PDF)
```

### Configuration

Environment variables control LLM providers, API keys, and features. See `docker-compose.yml` for complete list. User configuration stored in `APP_DATA_DIRECTORY/userConfig.json` when `CAN_CHANGE_KEYS=true`.

Key env vars:
- `LLM`: Provider selection (openai/google/anthropic/ollama/custom)
- `{PROVIDER}_API_KEY`: API keys for each provider
- `IMAGE_PROVIDER`: Image generation service
- `WEB_GROUNDING`: Enable web search for research
- `DATABASE_URL`: External database connection (PostgreSQL/MySQL)

## Development Commands

### Local Development

**Start development servers:**
```bash
node start.js --dev
```
This runs FastAPI with auto-reload, Next.js in dev mode, and Ollama service.

**Start individual servers:**
```bash
# FastAPI (from servers/fastapi/)
python server.py --port 8000 --reload true

# Next.js (from servers/nextjs/)
npm run dev

# MCP Server (from servers/fastapi/)
python mcp_server.py --port 8001
```

### Docker

**Production:**
```bash
docker-compose up production
```

**Production with GPU (for Ollama):**
```bash
docker-compose up production-gpu
```

**Development:**
```bash
docker-compose up development
```

**Development with GPU:**
```bash
docker-compose up development-gpu
```

### Testing

**Python tests (from servers/fastapi/):**
```bash
pytest                                    # Run all tests
pytest tests/test_presentation_generation_api.py  # Single test file
pytest -v                                 # Verbose output
pytest -k "test_name"                    # Run specific test
```

**Cypress E2E tests (from servers/nextjs/):**
```bash
npm run cypress:open    # Interactive mode
npm run cypress:run     # Headless mode
```

### Building

**Build Next.js production bundle:**
```bash
cd servers/nextjs
npm run build
npm start              # Run production build
```

**Build Docker image:**
```bash
docker build -t presenton .
```

### Linting

**Next.js linting:**
```bash
cd servers/nextjs
npm run lint
```

## Working with Presentation Templates

Templates are React components in `servers/nextjs/presentation-templates/[template-name]/`. Each template includes:
- Layout components (TitleSlide, ContentSlide, TwoColumnSlide, etc.)
- Default color schemes in `defaultSchemes.ts`
- Template metadata and preview images

**Creating a new template:**
1. Create directory: `servers/nextjs/presentation-templates/[template-name]/`
2. Implement required layout components (reference `ExampleSlideLayout.tsx`)
3. Add color schemes to `defaultSchemes.ts`
4. Template becomes available via API and UI

**Template generation from PPTX:**
The system can analyze uploaded PPTX files to extract:
- Layout patterns and slide types
- Font families, sizes, and styles
- Color schemes and backgrounds
- Positioning and spacing rules

Generated templates are stored in `APP_DATA_DIRECTORY/custom_templates/`.

## Working with LLM Integration

The `llm_client.py` provides a unified interface across providers:
- Structured output using response_format (OpenAI) or JSON schema (Google/Anthropic)
- Tool calling for web search via `llm_tool_calls_handler.py`
- Streaming support for real-time updates
- Provider-specific adapters handle API differences

**When adding LLM features:**
1. Define Pydantic models for structured output
2. Use `LLMClient.get_completion()` with `response_format` parameter
3. Handle provider-specific quirks in the adapter layer
4. Test with multiple providers to ensure compatibility

## File Structure Notes

- `servers/fastapi/api/v1/ppt/endpoints/`: All API endpoints for presentation operations
- `servers/fastapi/models/`: Pydantic models for API requests/responses and database
- `servers/fastapi/utils/`: Utility functions for file handling, validation, etc.
- `servers/nextjs/app/(presentation-generator)/services/api/`: Frontend API client
- `servers/nextjs/components/`: Shared UI components (shadcn/ui based)
- `app_data/`: Runtime data directory (presentations, uploads, templates, database)

## Important Implementation Details

### PPTX Generation
The system converts HTML slides to PPTX by:
1. Parsing HTML to extract text, images, charts, and layout
2. Mapping HTML elements to python-pptx shapes
3. Applying font sizes, colors, and positioning from the template
4. Generating native PowerPoint objects for compatibility

See `servers/fastapi/services/pptx_presentation_creator.py` and `servers/fastapi/api/v1/ppt/endpoints/slide_to_html.py` for implementation.

### Error Handling
The FastAPI backend wraps all presentation generation in try-catch blocks (see recent commits). Errors are logged and returned to the frontend for user-friendly display.

### Database
Uses SQLModel for ORM, supporting SQLite (default), PostgreSQL, and MySQL. Connection configured via `DATABASE_URL` environment variable. Models in `servers/fastapi/models/`.

## Common Workflows

**Adding a new API endpoint:**
1. Create endpoint file in `servers/fastapi/api/v1/ppt/endpoints/`
2. Define Pydantic request/response models
3. Implement endpoint logic (business logic in `services/`)
4. Add router to `servers/fastapi/api/v1/ppt/router.py`
5. Update `openai_spec.json` if MCP access needed

**Modifying presentation generation logic:**
1. Locate relevant service in `servers/fastapi/services/`
2. Update LLM prompts in `servers/fastapi/api/v1/ppt/endpoints/prompts.py`
3. Test with multiple LLM providers
4. Run pytest to verify no regressions

**Frontend feature development:**
1. Add UI components in `servers/nextjs/components/`
2. Create/modify pages in `servers/nextjs/app/(presentation-generator)/`
3. Add API integration in `servers/nextjs/app/(presentation-generator)/services/api/`
4. Update Redux store if global state needed

**Testing changes:**
1. Run `pytest` for backend changes
2. Test manually with Docker setup
3. Verify with different LLM providers
4. Check PPTX/PDF export functionality
