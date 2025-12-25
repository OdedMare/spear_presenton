# Utils Directory Reorganization Plan

## Current State (36 files in flat structure)
All files currently in `utils/` with no organization ❌

## Proposed Clean Structure (Organized by Domain)

```
utils/
├── __init__.py
│
├── config/                    # Configuration & Environment
│   ├── __init__.py
│   ├── env_config.py          ← get_env.py
│   ├── env_setter.py          ← set_env.py
│   └── user_config.py         ← user_config.py
│
├── file_operations/           # File & Asset Management
│   ├── __init__.py
│   ├── file_utils.py          ← file_utils.py
│   ├── asset_directory.py     ← asset_directory_utils.py
│   ├── download.py            ← download_helpers.py
│   └── safe_init.py           ← safe_init.py
│
├── data_processing/           # Data Transformation
│   ├── __init__.py
│   ├── dict_utils.py          ← dict_utils.py
│   ├── json_utils.py          ← json_repair.py
│   ├── parsers.py             ← parsers.py
│   └── validators.py          ← validators.py
│
├── datetime/                  # Date & Time Utilities
│   ├── __init__.py
│   └── datetime_utils.py      ← datetime_utils.py
│
├── database/                  # Database Utilities
│   ├── __init__.py
│   └── db_utils.py            ← db_utils.py
│
├── llm/                       # LLM-Related Utilities
│   ├── __init__.py
│   ├── provider.py            ← llm_provider.py
│   ├── retry.py               ← llm_retry.py
│   ├── error_handler.py       ← llm_client_error_handler.py
│   ├── performance_monitor.py ← llm_performance_monitor.py
│   ├── model_capabilities.py  ← model_capabilities.py
│   ├── model_availability.py  ← model_availability.py
│   ├── available_models.py    ← available_models.py
│   ├── schema_utils.py        ← schema_utils.py
│   └── progressive_simplification.py ← progressive_simplification.py
│
├── media/                     # Image & Media Processing
│   ├── __init__.py
│   ├── image_utils.py         ← image_utils.py
│   └── image_provider.py      ← image_provider.py
│
├── presentation/              # Presentation-Specific Utils
│   ├── __init__.py
│   ├── ppt_utils.py           ← ppt_utils.py
│   ├── export_utils.py        ← export_utils.py
│   ├── process_slides.py      ← process_slides.py
│   ├── presentation_chunker.py ← presentation_chunker.py
│   └── get_layout_by_name.py  ← get_layout_by_name.py
│
├── async_helpers/             # Async Utilities
│   ├── __init__.py
│   └── async_iterator.py      ← async_iterator.py
│
├── error_handling/            # Error Management
│   ├── __init__.py
│   ├── error_handling.py      ← error_handling.py
│   └── user_friendly_errors.py ← user_friendly_errors.py
│
├── external_services/         # External Service Utilities
│   ├── __init__.py
│   ├── ollama.py              ← ollama.py
│   └── get_dynamic_models.py  ← get_dynamic_models.py
│
└── helpers/                   # Miscellaneous Helpers
    ├── __init__.py
    └── dummy_functions.py     ← dummy_functions.py
```

## Benefits of This Organization

### 1. Single Responsibility Principle ✅
Each directory has ONE clear purpose:
- `config/` → Environment & configuration only
- `llm/` → LLM-related utilities only
- `media/` → Image/media processing only
- etc.

### 2. Easy to Navigate ✅
Developers know exactly where to find utilities:
- Need file operations? → `utils/file_operations/`
- Need LLM helpers? → `utils/llm/`
- Need data parsing? → `utils/data_processing/`

### 3. Prevents Circular Dependencies ✅
Clear hierarchy prevents import cycles:
- Each subdirectory is independent
- No cross-directory dependencies (except via `common/`)

### 4. Easier to Test ✅
Can test each category independently:
- `test_config/` tests config utilities
- `test_llm/` tests LLM utilities
- etc.

### 5. Scales Better ✅
Easy to add new utilities:
- Add new file utils? → `utils/file_operations/new_file.py`
- Add new LLM helper? → `utils/llm/new_helper.py`

## Migration Strategy

### Phase 1: Create Directory Structure
```bash
mkdir -p utils/{config,file_operations,data_processing,datetime,database,llm,media,presentation,async_helpers,error_handling,external_services,helpers}
```

### Phase 2: Move Files to Appropriate Directories
Move each file to its logical home with proper imports

### Phase 3: Update All Imports
Update all files that import from `utils/` to use new paths:
- `from utils.get_env import ...` → `from utils.config.env_config import ...`
- `from utils.llm_retry import ...` → `from utils.llm.retry import ...`

### Phase 4: Create Convenient __init__.py Files
Re-export commonly used functions for backward compatibility:
```python
# utils/config/__init__.py
from .env_config import get_env_variable, get_openai_api_key_env
from .user_config import get_user_config, set_user_config
```

## File Categorization Logic

### Configuration & Environment (utils/config/)
Files dealing with environment variables and user configuration

### File Operations (utils/file_operations/)
Files dealing with file system operations, downloads, assets

### Data Processing (utils/data_processing/)
Files dealing with data transformation, parsing, validation

### LLM (utils/llm/)
Files specific to LLM operations (10 files!)
- Provider management
- Error handling
- Retry logic
- Model capabilities
- Schema utils

### Media (utils/media/)
Image and media processing utilities

### Presentation (utils/presentation/)
Presentation-specific business utilities (could move to service layer later)

### Error Handling (utils/error_handling/)
Error management and user-friendly error messages

### External Services (utils/external_services/)
Integration with external services (Ollama, etc.)

## Backward Compatibility

To maintain backward compatibility during migration:

```python
# utils/__init__.py (maintains old imports)
from .config.env_config import (
    get_openai_api_key_env,
    get_custom_llm_url_env,
    # ... other commonly used functions
)

from .llm.retry import retry_with_backoff
from .data_processing.json_utils import parse_llm_json
# ... etc
```

This allows existing code to work while new code uses organized imports.

## Implementation Steps

1. ✅ Create directory structure
2. ✅ Move files to new locations
3. ✅ Update imports within moved files
4. ✅ Create convenience __init__.py files
5. ✅ Update imports in rest of codebase
6. ✅ Test everything still works
7. ✅ Remove backward compatibility layer (optional)

## Files That Might Move to Service Layer

Some files in `utils/presentation/` contain business logic and should eventually move to `service/`:
- `process_slides.py` → Could be part of slide_service
- `presentation_chunker.py` → Could be part of content_service
- `get_layout_by_name.py` → Could be part of layout_service

But we can keep them in utils for now and refactor later.
