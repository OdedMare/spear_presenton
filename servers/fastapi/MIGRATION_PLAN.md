# Complete Backend Refactoring - Migration Plan

## Overview

This plan systematically migrates the entire FastAPI backend to clean 4-layer architecture.

**Goal**: Delete old code, enforce strict layer separation, follow SOLID principles.

---

## Current State Analysis

### Files to Migrate

#### 1. API Endpoints (20 files) - `api/v1/ppt/endpoints/`
All these files have direct database access violations:
- ✅ `presentation_refactored_example.py` - Already done (example)
- ❌ `presentation.py` - **HIGH PRIORITY** (direct DB access, 39KB)
- ❌ `slide.py` - **HIGH PRIORITY** (direct DB access)
- ❌ `slide_to_html.py` - **HIGH PRIORITY** (38KB, complex)
- ❌ `outlines.py` - Direct DB access
- ❌ `content_rewrite.py` - **LARGE** (49KB, complex)
- ❌ `translation.py` - Translation logic
- ❌ `images.py` - Image generation
- ❌ `pptx_slides.py` - PPTX processing
- ❌ `template_generation.py` - Template creation
- ❌ `pdf_slides.py` - PDF export
- ❌ `fonts.py` - Font management
- ❌ `files.py` - File management
- ❌ `layouts.py` - Layout selection
- ❌ `layout_process.py` - Layout processing
- ❌ `layout_render.py` - Layout rendering
- ❌ `icons.py` - Icon handling
- ❌ `openai.py` - OpenAI specific
- ❌ `prompts.py` - Prompts (67KB!)
- ❌ `prompts_simplified.py` - Simplified prompts

#### 2. Old Services (27 files) - `services/` → Move to `service/`
Business logic currently in wrong location:
- ❌ `llm_client.py` - **CRITICAL** → `service/llm_service.py`
- ❌ `pptx_presentation_creator.py` - → `service/export_service.py`
- ❌ `image_generation_service.py` - → `service/image_service.py`
- ❌ `translation_orchestrator.py` - → `service/translation_service.py`
- ❌ `translation_agents.py` - → `service/translation_service.py`
- ❌ `translation_tools.py` - → `service/translation_service.py`
- ❌ `auth_service.py` - SPLIT: service + repository
- ❌ `webhook_service.py` - SPLIT: service + repository
- ❌ `documents_loader.py` - → `service/document_service.py`
- ❌ `docling_service.py` - → `service/document_service.py`
- ❌ `layout_extractor.py` - → `service/layout_service.py`
- ❌ `layout_renderer.py` - → `service/layout_service.py`
- ❌ `html_to_react_converter.py` - → `service/template_service.py`
- ❌ `html_text_editor.py` - → `service/content_service.py`
- ❌ `html_to_text_runs_service.py` - → `service/content_service.py`
- ❌ `placeholder_extractor.py` - → `service/template_service.py`
- ❌ `placeholder_injector.py` - → `service/template_service.py`
- ❌ `icon_finder_service.py` - → `service/asset_service.py`
- ❌ `content_chunker.py` - → `service/content_service.py`
- ❌ `score_based_chunker.py` - → `service/content_service.py`
- ❌ `llm_tool_calls_handler.py` - → `service/llm_service.py`
- ❌ `temp_file_service.py` - → `common/utils/file_utils.py`
- ❌ `concurrent_service.py` - → `common/utils/concurrency.py`

#### 3. Utils with Business Logic (6 files) - `utils/llm_calls/` → `service/`
**VIOLATION**: These are business operations, not utilities!
- ❌ `generate_presentation_outlines.py` - → `service/outline_service.py`
- ❌ `generate_presentation_structure.py` - → `service/structure_service.py`
- ❌ `generate_slide_content.py` - → `service/slide_content_service.py`
- ❌ `edit_slide.py` - → `service/slide_service.py`
- ❌ `edit_slide_html.py` - → `service/slide_service.py`
- ❌ `select_slide_type_on_edit.py` - → `service/slide_service.py`

#### 4. Pure Utils (Keep, maybe move to `common/`) - `utils/`
✅ These are actually utilities:
- `file_utils.py`, `image_utils.py`, `dict_utils.py`
- `json_repair.py`, `parsers.py`, `validators.py`
- `get_env.py`, `set_env.py`, `user_config.py`
- `error_handling.py`, `llm_retry.py`
- `asset_directory_utils.py`, `download_helpers.py`
- `schema_utils.py`, `model_capabilities.py`
- etc.

---

## Migration Strategy

### Phase 1: Complete Repository Layer (Remaining entities)

Create repositories for all entities we don't have yet:

```bash
dal/repositories/
  ✅ base_repository.py
  ✅ presentation_repository.py
  ✅ slide_repository.py
  ✅ user_repository.py
  ✅ webhook_repository.py
  ✅ template_repository.py
  ❌ image_asset_repository.py
  ❌ key_value_repository.py
  ❌ async_task_repository.py
  ❌ presentation_layout_code_repository.py
```

### Phase 2: Create All Service Layer Classes

**New service layer structure:**

```bash
service/
  ✅ __init__.py
  ✅ presentation_service.py
  ✅ slide_service.py
  ✅ auth_service.py

  # To create:
  ❌ llm_service.py               # From services/llm_client.py
  ❌ outline_service.py            # From utils/llm_calls/generate_presentation_outlines.py
  ❌ structure_service.py          # From utils/llm_calls/generate_presentation_structure.py
  ❌ slide_content_service.py      # From utils/llm_calls/generate_slide_content.py
  ❌ export_service.py             # From services/pptx_presentation_creator.py
  ❌ image_service.py              # From services/image_generation_service.py
  ❌ translation_service.py        # From services/translation_*.py (3 files)
  ❌ document_service.py           # From services/documents_loader.py + docling_service.py
  ❌ layout_service.py             # From services/layout_*.py
  ❌ template_service.py           # From services/placeholder_*.py + html_to_react_converter.py
  ❌ content_service.py            # From services/*chunker.py + html_text_editor.py
  ❌ asset_service.py              # From services/icon_finder_service.py
  ❌ webhook_service.py            # From services/webhook_service.py (business logic only)
```

### Phase 3: Migrate API Endpoints (Priority Order)

**Priority 1 - Core Functionality:**
1. `presentation.py` - Most important, most violations
2. `slide.py` - Core slide operations
3. `outlines.py` - Outline generation

**Priority 2 - Complex Features:**
4. `slide_to_html.py` - Complex HTML generation
5. `content_rewrite.py` - Large file (49KB)
6. `translation.py` - Translation features

**Priority 3 - Supporting Features:**
7. `images.py` - Image operations
8. `pptx_slides.py` - PPTX processing
9. `template_generation.py` - Template creation
10. `pdf_slides.py` - PDF export

**Priority 4 - Utilities:**
11-20. Remaining endpoints (fonts, files, layouts, etc.)

### Phase 4: Update Dependency Injection

Update `api/dependencies/services.py` with all service factories.

### Phase 5: Clean Up & Delete

1. Delete entire `services/` directory
2. Delete `utils/llm_calls/` directory
3. Remove `database.py` and `logger.py` from old locations
4. Update all imports

---

## File-by-File Migration Steps

### Template for Each File:

#### For API Endpoints:
1. Read current endpoint file
2. Identify direct database access (`get_async_session`, SQL queries)
3. Identify business logic that should be in service
4. Create/update service methods
5. Refactor endpoint to call service only
6. Handle errors properly (map exceptions to HTTP)
7. Test endpoint

#### For Old Services → New Services:
1. Read old service file
2. Identify data access code → Create repository methods
3. Identify business logic → Keep in service
4. Create new service file in `service/`
5. Update dependencies (use repositories, not sessions)
6. Delete old file from `services/`

#### For Utils with Business Logic:
1. Read util file
2. Move to appropriate service
3. Delete util file
4. Update imports

---

## Execution Order

### Step 1: Complete Foundation
- [ ] Create remaining repositories (4 files)
- [ ] Create `common/` utilities (move from utils/)
- [ ] Set up all dependency injection

### Step 2: Core Services (Do these first)
- [ ] `service/llm_service.py` (from `services/llm_client.py`)
- [ ] `service/outline_service.py` (from `utils/llm_calls/`)
- [ ] `service/slide_content_service.py` (from `utils/llm_calls/`)

### Step 3: Critical Endpoints
- [ ] Refactor `presentation.py`
- [ ] Refactor `slide.py`
- [ ] Refactor `outlines.py`

### Step 4: Remaining Services
- [ ] Create all other services (12 files)

### Step 5: Remaining Endpoints
- [ ] Refactor all other endpoints (17 files)

### Step 6: Cleanup
- [ ] Delete `services/` directory (27 files)
- [ ] Delete `utils/llm_calls/` directory (6 files)
- [ ] Update all imports
- [ ] Run tests
- [ ] Verify architecture

---

## Migration Checklist

### Repositories (10 total)
- [x] base_repository.py
- [x] presentation_repository.py
- [x] slide_repository.py
- [x] user_repository.py
- [x] webhook_repository.py
- [x] template_repository.py
- [ ] image_asset_repository.py
- [ ] key_value_repository.py
- [ ] async_task_repository.py
- [ ] presentation_layout_code_repository.py

### Services (15 total)
- [x] presentation_service.py
- [x] slide_service.py
- [x] auth_service.py
- [ ] llm_service.py
- [ ] outline_service.py
- [ ] structure_service.py
- [ ] slide_content_service.py
- [ ] export_service.py
- [ ] image_service.py
- [ ] translation_service.py
- [ ] document_service.py
- [ ] layout_service.py
- [ ] template_service.py
- [ ] content_service.py
- [ ] asset_service.py

### API Endpoints (20 total)
- [x] presentation_refactored_example.py (example only)
- [ ] presentation.py
- [ ] slide.py
- [ ] outlines.py
- [ ] slide_to_html.py
- [ ] content_rewrite.py
- [ ] translation.py
- [ ] images.py
- [ ] pptx_slides.py
- [ ] template_generation.py
- [ ] pdf_slides.py
- [ ] fonts.py
- [ ] files.py
- [ ] layouts.py
- [ ] layout_process.py
- [ ] layout_render.py
- [ ] icons.py
- [ ] openai.py
- [ ] prompts.py
- [ ] prompts_simplified.py

### Cleanup
- [ ] Delete services/ directory
- [ ] Delete utils/llm_calls/ directory
- [ ] Update imports
- [ ] Run tests
- [ ] Verify architecture

---

## Commands for Quick Progress

```bash
# Count files to migrate
find servers/fastapi/services -name "*.py" | wc -l
find servers/fastapi/utils/llm_calls -name "*.py" | wc -l
find servers/fastapi/api/v1/ppt/endpoints -name "*.py" | wc -l

# List all imports of old services (to update later)
grep -r "from services\." servers/fastapi/api/
grep -r "from utils.llm_calls" servers/fastapi/api/

# Delete old directories (AFTER migration)
rm -rf servers/fastapi/services/
rm -rf servers/fastapi/utils/llm_calls/
```

---

## Next Steps

Ready to execute? Let's start with:

1. **Create remaining repositories** (4 files, ~30 min)
2. **Create LLM service** (1 large file, critical dependency)
3. **Create outline & slide content services** (Move from utils)
4. **Refactor presentation.py endpoint** (Biggest impact)
5. Continue systematically...

**Estimated Total Effort**:
- Repositories: 2 hours
- Services: 8-10 hours
- Endpoints: 10-12 hours
- Testing & Cleanup: 2-3 hours
- **Total: ~24-27 hours** of focused work

But we can do it incrementally, testing as we go!
