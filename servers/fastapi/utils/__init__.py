"""
Utilities - Organized by Domain

This module provides backward compatibility while encouraging use of
the new organized structure.

Old imports still work:
    from utils.get_env import get_openai_api_key_env

New organized imports (recommended):
    from utils.config import get_openai_api_key_env
"""

# Backward compatibility - re-export all utilities
# This allows old imports to keep working while new code uses organized structure

# Configuration & Environment
from .config import *  # noqa: F403, F401

# File Operations
from .file_operations import *  # noqa: F403, F401

# Data Processing
from .data_processing import *  # noqa: F403, F401

# DateTime
from .datetime import *  # noqa: F403, F401

# Database
from .database import *  # noqa: F403, F401

# LLM
from .llm import *  # noqa: F403, F401

# Media
from .media import *  # noqa: F403, F401

# Presentation
from .presentation import *  # noqa: F403, F401

# Async Helpers
from .async_helpers import *  # noqa: F403, F401

# Error Handling
from .error_handling import *  # noqa: F403, F401

# External Services
from .external_services import *  # noqa: F403, F401

# Helpers
from .helpers import *  # noqa: F403, F401
