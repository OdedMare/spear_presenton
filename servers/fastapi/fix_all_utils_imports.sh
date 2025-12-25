#!/bin/bash

# Script to update all old utils imports across the entire codebase

echo "🔄 Updating all old utils imports to new organized structure..."

# Fix datetime_utils imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.datetime_utils/from utils.datetime.datetime_utils/g' {} \;

# Fix asset_directory_utils imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.asset_directory_utils/from utils.file_operations.asset_directory/g' {} \;

# Fix get_env imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.get_env/from utils.config.env_config/g' {} \;

# Fix user_config imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.user_config/from utils.config.user_config/g' {} \;

# Fix validators imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.validators/from utils.data_processing.validators/g' {} \;

# Fix file_utils imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.file_utils/from utils.file_operations.file_utils/g' {} \;

# Fix process_slides imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.process_slides/from utils.presentation.process_slides/g' {} \;

# Fix available_models imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.available_models/from utils.llm.available_models/g' {} \;

# Fix get_layout_by_name imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.get_layout_by_name/from utils.presentation.get_layout_by_name/g' {} \;

# Fix ppt_utils imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.ppt_utils/from utils.presentation.ppt_utils/g' {} \;

# Fix ollama imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.ollama/from utils.external_services.ollama/g' {} \;

# Fix llm_provider imports (in tests)
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.llm_provider/from utils.llm.provider/g' {} \;

# Fix image_provider imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.image_provider/from utils.media.image_provider/g' {} \;

# Fix download_helpers imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.download_helpers/from utils.file_operations.download/g' {} \;

echo "✅ All utils imports updated to new organized structure!"

# Additional fixes for remaining imports
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.model_availability/from utils.llm.model_availability/g' {} \;
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.safe_init/from utils.helpers.safe_init/g' {} \;
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.llm_client_error_handler/from utils.llm.error_handler/g' {} \;
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.get_dynamic_models/from utils.external_services.get_dynamic_models/g' {} \;
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.model_capabilities/from utils.llm.model_capabilities/g' {} \;
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.schema_utils/from utils.llm.schema_utils/g' {} \;
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.async_iterator/from utils.async_helpers.async_iterator/g' {} \;
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.dummy_functions/from utils.helpers.dummy_functions/g' {} \;
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.parsers/from utils.data_processing.parsers/g' {} \;
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.json_repair/from utils.data_processing.json_utils/g' {} \;
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.llm_retry/from utils.llm.retry/g' {} \;
find . -name "*.py" -type f ! -path "./__pycache__/*" ! -path "./utils/__init__.py" -exec sed -i '' 's/from utils\.db_utils/from utils.database.db_utils/g' {} \;

echo "✅ Additional imports updated!"
