# Project Structure

Presenton - AI Presentation Generator

## 📁 Directory Organization

```
presenton/
├── README.md                          # Main project documentation
├── CLAUDE.md                          # Development guidelines for AI assistants
├── PROJECT_STRUCTURE.md              # This file
├── docker-compose.yml                # Docker orchestration
├── Dockerfile                        # Production Docker image
├── start.js                          # Development server launcher
├── .gitignore                        # Git ignore rules (updated)
│
├── docs/                             # 📚 All Documentation (NEW)
│   ├── README.md                     # Documentation index
│   ├── QUICK_START.md                # 5-minute setup guide
│   ├── TRANSLATION_API.md            # Translation API reference
│   ├── TRANSLATION_AGENTS.md         # Multi-agent architecture
│   ├── IMPLEMENTATION_SUMMARY.md     # Technical implementation
│   ├── FULL_INTEGRATION_MAP.md       # Integration documentation
│   ├── DEPLOYMENT_NOTES.md           # Production deployment
│   ├── INSTALL_DEPENDENCIES.md       # Dependency setup
│   ├── UI_FIX_GUIDE.md              # UI troubleshooting
│   ├── UI_INTEGRATION_COMPLETE.md    # Frontend integration
│   ├── CONTENT_REWRITE_FEATURE.md    # Content rewrite docs
│   ├── CHUNKING_IMPLEMENTATION.md    # Smart chunking
│   ├── INHERITANCE_RESOLUTION.md     # Template inheritance
│   └── VLM_REMOVAL_COMPLETE.md       # VLM removal notes
│
├── tests/                            # 🧪 All Test Files (Organized)
│   ├── test_content_rewrite.py
│   ├── test_content_rewrite_strict.py
│   ├── test_content_rewrite_robust.py
│   ├── test_content_rewrite_fallback.py
│   ├── test_content_chunker.py
│   ├── test_template_extraction.py
│   ├── test_extractor.py
│   ├── test_smartart_injection.py
│   ├── test_smartart_bug.py
│   ├── test_paragraph_formatting.py
│   ├── test_rtl_support.py
│   ├── test_empty_elements.py
│   ├── test_out_of_order.py
│   ├── test_keyword_enforcement.py
│   └── generate_test_pptx.py
│
├── servers/
│   ├── fastapi/                      # 🐍 Backend (Python)
│   │   ├── server.py                 # FastAPI entry point
│   │   ├── requirements.txt          # Python dependencies
│   │   ├── api/
│   │   │   └── v1/ppt/
│   │   │       ├── router.py         # Main API router
│   │   │       └── endpoints/
│   │   │           ├── translation.py         # NEW: Translation endpoint
│   │   │           ├── content_rewrite.py     # Content rewrite
│   │   │           ├── presentation.py
│   │   │           ├── outlines.py
│   │   │           ├── slide.py
│   │   │           ├── files.py
│   │   │           ├── fonts.py
│   │   │           ├── icons.py
│   │   │           ├── images.py
│   │   │           ├── layouts.py
│   │   │           ├── openai.py
│   │   │           ├── pptx_slides.py
│   │   │           ├── pdf_slides.py
│   │   │           ├── slide_to_html.py
│   │   │           ├── layout_process.py
│   │   │           ├── layout_render.py
│   │   │           ├── template_generation.py
│   │   │           └── prompts.py
│   │   ├── services/
│   │   │   ├── translation_tools.py          # NEW: Tool registry (15 tools)
│   │   │   ├── translation_orchestrator.py   # NEW: Enhanced orchestrator
│   │   │   ├── translation_agents.py         # 3-agent translation system
│   │   │   ├── llm_client.py
│   │   │   ├── llm_tool_calls_handler.py
│   │   │   ├── pptx_presentation_creator.py
│   │   │   ├── placeholder_extractor.py
│   │   │   ├── placeholder_injector.py
│   │   │   ├── image_generation_service.py
│   │   │   ├── docling_service.py
│   │   │   ├── documents_loader.py
│   │   │   ├── database.py
│   │   │   ├── temp_file_service.py
│   │   │   ├── content_chunker.py
│   │   │   ├── html_to_text_runs_service.py
│   │   │   ├── html_text_editor.py
│   │   │   ├── html_to_react_converter.py
│   │   │   ├── layout_extractor.py
│   │   │   ├── layout_renderer.py
│   │   │   ├── icon_finder_service.py
│   │   │   ├── score_based_chunker.py
│   │   │   ├── concurrent_service.py
│   │   │   └── webhook_service.py
│   │   ├── models/
│   │   │   ├── llm_message.py
│   │   │   ├── llm_tool_call.py
│   │   │   ├── llm_tools.py
│   │   │   └── llm_config.py
│   │   ├── tests/                    # FastAPI-specific tests
│   │   │   ├── test_gemini_schema_support.py
│   │   │   ├── test_pptx_creator.py
│   │   │   ├── test_slide_to_html.py
│   │   │   └── test_mcp_server.py
│   │   ├── enums/
│   │   ├── utils/
│   │   └── mcp_server.py             # Model Context Protocol server
│   │
│   └── nextjs/                       # ⚛️ Frontend (React/Next.js)
│       ├── package.json              # Node dependencies
│       ├── tsconfig.json
│       ├── app/
│       │   └── (presentation-generator)/
│       │       ├── dashboard/
│       │       ├── outline/
│       │       ├── presentation/
│       │       ├── settings/
│       │       │   └── SettingPage.tsx
│       │       ├── content-rewrite/
│       │       │   └── components/
│       │       │       └── ContentRewritePage.tsx  # Translation UI
│       │       └── custom-template/
│       ├── components/
│       │   ├── TranslationAgentsConfig.tsx   # NEW: Translation config UI
│       │   ├── LLMSelection.tsx              # LLM provider selection
│       │   ├── OpenAIConfig.tsx
│       │   ├── GoogleConfig.tsx
│       │   ├── AnthropicConfig.tsx
│       │   ├── OllamaConfig.tsx
│       │   ├── CustomConfig.tsx
│       │   ├── TemplateModelConfig.tsx
│       │   └── ui/                   # shadcn/ui components
│       ├── types/
│       │   └── llm_config.ts         # LLM config types
│       ├── store/
│       │   └── store.ts              # Redux store
│       ├── utils/
│       └── presentation-templates/   # HTML/Tailwind templates
│           ├── general/
│           ├── modern/
│           ├── standard/
│           ├── swift/
│           ├── minimal/
│           ├── professional/
│           ├── tech/
│           └── vibrant/
│
├── app_data/                         # Runtime application data (gitignored)
│   ├── presentations/
│   ├── uploads/
│   ├── temp_uploads/
│   ├── custom_templates/
│   ├── translation_maps/             # Translation persistence
│   ├── userConfig.json               # User settings
│   └── database.db
│
└── readme_assets/                    # README images/assets
    ├── images/
    └── demo.gif
```

---

## 📚 Documentation Structure

All documentation is now organized in the `docs/` directory:

### Quick Reference
- **Getting Started:** [docs/QUICK_START.md](docs/QUICK_START.md)
- **Translation API:** [docs/TRANSLATION_API.md](docs/TRANSLATION_API.md)
- **Deployment:** [docs/DEPLOYMENT_NOTES.md](docs/DEPLOYMENT_NOTES.md)

### For Developers
- **Claude Instructions:** [CLAUDE.md](CLAUDE.md)
- **Translation Architecture:** [docs/TRANSLATION_AGENTS.md](docs/TRANSLATION_AGENTS.md)
- **Implementation Details:** [docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md)

### Full Documentation Index
See [docs/README.md](docs/README.md) for complete documentation catalog.

---

## 🧪 Test Organization

All tests are in the `tests/` directory:

### Backend Tests (FastAPI)
Located in `servers/fastapi/tests/`:
- `test_pptx_creator.py` - PPTX generation tests
- `test_slide_to_html.py` - HTML conversion tests
- `test_gemini_schema_support.py` - Gemini integration tests
- `test_mcp_server.py` - MCP server tests

### Integration Tests
Located in root `tests/`:
- `test_content_rewrite.py` - Content rewrite tests
- `test_template_extraction.py` - Template extraction tests
- `test_smartart_injection.py` - SmartArt handling tests
- `test_rtl_support.py` - RTL language support tests
- And more...

---

## 🔧 Key Files

### Configuration
- `docker-compose.yml` - Docker services configuration
- `Dockerfile` - Production Docker image
- `.gitignore` - Git ignore patterns (comprehensive)
- `servers/fastapi/requirements.txt` - Python dependencies
- `servers/nextjs/package.json` - Node dependencies

### Entry Points
- `start.js` - Development server (runs all services)
- `servers/fastapi/server.py` - FastAPI backend
- `servers/nextjs/app/layout.tsx` - Next.js app entry
- `servers/fastapi/mcp_server.py` - MCP server

### New Translation Features
- `servers/fastapi/services/translation_tools.py` - Tool registry
- `servers/fastapi/services/translation_orchestrator.py` - Orchestrator
- `servers/fastapi/api/v1/ppt/endpoints/translation.py` - API endpoint
- `servers/nextjs/components/TranslationAgentsConfig.tsx` - UI config

---

## 🚀 Quick Commands

### Development
```bash
# Start all services
node start.js --dev

# Start frontend only
cd servers/nextjs && npm run dev

# Start backend only
cd servers/fastapi && python server.py --reload true

# Run tests
cd servers/fastapi && pytest
```

### Docker
```bash
# Production
docker-compose up production

# Development
docker-compose up development

# With GPU (for Ollama)
docker-compose up production-gpu
```

### Testing
```bash
# All Python tests
pytest

# Specific test file
pytest tests/test_content_rewrite.py

# FastAPI tests
cd servers/fastapi && pytest tests/
```

---

## 📝 Recent Changes

### Project Organization (2025-12-06)
- ✅ Updated `.gitignore` with comprehensive patterns
- ✅ Moved all documentation to `docs/` directory
- ✅ Created `docs/README.md` index
- ✅ Organized test files in `tests/` directory
- ✅ Created this `PROJECT_STRUCTURE.md` file

### Multi-Agent Translation (2025-12-06)
- ✅ Added 3-agent translation system
- ✅ Created tool registry (15 tools)
- ✅ Added orchestrator with retry logic
- ✅ New API endpoint: `/api/v1/ppt/translate`
- ✅ UI configuration in settings
- ✅ Full integration with content rewrite

---

## 🔍 Finding Things

### Where to find...

**API Endpoints:**
`servers/fastapi/api/v1/ppt/endpoints/`

**Services/Business Logic:**
`servers/fastapi/services/`

**UI Components:**
`servers/nextjs/components/`

**Pages:**
`servers/nextjs/app/(presentation-generator)/`

**Templates:**
`servers/nextjs/presentation-templates/`

**Documentation:**
`docs/`

**Tests:**
`tests/` and `servers/fastapi/tests/`

---

**Last Updated:** 2025-12-06
