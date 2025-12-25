# ✅ Utils Directory - Organized by Domain

## New Clean Structure

```
utils/
├── config/                    # Configuration & Environment (3 files)
│   ├── env_config.py          # Environment variables
│   ├── env_setter.py          # Set environment
│   └── user_config.py         # User configuration
│
├── file_operations/           # File & Asset Management (4 files)
│   ├── file_utils.py          # File utilities
│   ├── asset_directory.py     # Asset directories
│   ├── download.py            # Download helpers
│   └── safe_init.py           # Safe initialization
│
├── data_processing/           # Data Transformation (4 files)
│   ├── dict_utils.py          # Dictionary utilities
│   ├── json_utils.py          # JSON parsing & repair
│   ├── parsers.py             # Data parsers
│   └── validators.py          # Input validation
│
├── datetime/                  # Date & Time (1 file)
│   └── datetime_utils.py      # DateTime helpers
│
├── database/                  # Database Utilities (1 file)
│   └── db_utils.py            # Database helpers
│
├── llm/                       # LLM-Related Utilities (9 files)
│   ├── provider.py            # LLM provider management
│   ├── retry.py               # Retry logic
│   ├── error_handler.py       # Error handling
│   ├── performance_monitor.py # Performance monitoring
│   ├── model_capabilities.py  # Model capabilities
│   ├── model_availability.py  # Model availability
│   ├── available_models.py    # Available models list
│   ├── schema_utils.py        # JSON schema utilities
│   └── progressive_simplification.py  # Progressive simplification
│
├── media/                     # Image & Media Processing (2 files)
│   ├── image_utils.py         # Image utilities
│   └── image_provider.py      # Image provider selection
│
├── presentation/              # Presentation-Specific Utils (5 files)
│   ├── ppt_utils.py           # PowerPoint utilities
│   ├── export_utils.py        # Export utilities
│   ├── process_slides.py      # Slide processing
│   ├── presentation_chunker.py # Content chunking
│   └── get_layout_by_name.py  # Layout selection
│
├── async_helpers/             # Async Utilities (1 file)
│   └── async_iterator.py      # Async iterators
│
├── error_handling/            # Error Management (2 files)
│   ├── error_handling.py      # Error handling
│   └── user_friendly_errors.py # User-friendly errors
│
├── external_services/         # External Service Integrations (2 files)
│   ├── ollama.py              # Ollama integration
│   └── get_dynamic_models.py  # Dynamic models
│
└── helpers/                   # Miscellaneous Helpers (1 file)
    └── dummy_functions.py     # Dummy/placeholder functions
```

## Summary

- **Total**: 36 utility files
- **Organized into**: 12 logical directories
- **Benefits**:
  - ✅ Easy to navigate
  - ✅ Single Responsibility (each dir has one purpose)
  - ✅ Prevents circular dependencies
  - ✅ Easier to test
  - ✅ Scales better

## Usage Examples

### Old Way (Still Works!)
```python
from utils.get_env import get_openai_api_key_env
from utils.llm_retry import retry_with_backoff
from utils.json_repair import parse_llm_json
```

### New Organized Way
```python
from utils.config import get_openai_api_key_env
from utils.llm import retry_with_backoff
from utils.data_processing import parse_llm_json
```

### Domain-Specific Import
```python
# Import all LLM utilities
from utils.llm import *

# Import all file operations
from utils.file_operations import *

# Import specific function
from utils.presentation.ppt_utils import get_presentation_title_from_outlines
```

## Migration Notes

All old imports still work due to backward compatibility in `utils/__init__.py`.

However, new code should use the organized structure for better clarity and maintainability.

## Directory Purposes

| Directory | Purpose | File Count |
|-----------|---------|------------|
| `config/` | Environment variables & user configuration | 3 |
| `file_operations/` | File system operations & asset management | 4 |
| `data_processing/` | Data transformation, parsing, validation | 4 |
| `datetime/` | Date & time utilities | 1 |
| `database/` | Database connection & query helpers | 1 |
| `llm/` | LLM provider management & utilities | 9 |
| `media/` | Image & media processing | 2 |
| `presentation/` | Presentation-specific business utilities | 5 |
| `async_helpers/` | Async/await utilities | 1 |
| `error_handling/` | Error management & user-friendly messages | 2 |
| `external_services/` | External API integrations | 2 |
| `helpers/` | Miscellaneous helper functions | 1 |

## SOLID Compliance

✅ **Single Responsibility**: Each directory has one clear purpose
✅ **Open/Closed**: Easy to add new utilities without modifying existing structure
✅ **Liskov Substitution**: Not applicable (utilities, not classes)
✅ **Interface Segregation**: Small, focused modules instead of god objects
✅ **Dependency Inversion**: Utilities are low-level, depended upon by higher layers

## Next Steps (Optional)

Some files in `utils/presentation/` contain business logic and could eventually move to the service layer:
- `process_slides.py` → Could be part of `service/slide_service.py`
- `presentation_chunker.py` → Could be part of `service/content_service.py`
- `get_layout_by_name.py` → Could be part of `service/layout_service.py`

But they can stay in utils for now - this organization is perfectly fine!
