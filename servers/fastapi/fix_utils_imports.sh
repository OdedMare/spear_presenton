#!/bin/bash

# Script to update imports within utils subdirectories

echo "🔄 Updating internal utils imports..."

# Update imports in config/
find utils/config -name "*.py" -type f | xargs sed -i '' 's/from utils\.get_env/from utils.config.env_config/g'
find utils/config -name "*.py" -type f | xargs sed -i '' 's/from utils\.set_env/from utils.config.env_setter/g'
find utils/config -name "*.py" -type f | xargs sed -i '' 's/from utils\.user_config/from utils.config.user_config/g'

# Update imports in file_operations/
find utils/file_operations -name "*.py" -type f | xargs sed -i '' 's/from utils\.file_utils/from utils.file_operations.file_utils/g'
find utils/file_operations -name "*.py" -type f | xargs sed -i '' 's/from utils\.asset_directory_utils/from utils.file_operations.asset_directory/g'
find utils/file_operations -name "*.py" -type f | xargs sed -i '' 's/from utils\.download_helpers/from utils.file_operations.download/g'

# Update imports in data_processing/
find utils/data_processing -name "*.py" -type f | xargs sed -i '' 's/from utils\.dict_utils/from utils.data_processing.dict_utils/g'
find utils/data_processing -name "*.py" -type f | xargs sed -i '' 's/from utils\.json_repair/from utils.data_processing.json_utils/g'
find utils/data_processing -name "*.py" -type f | xargs sed -i '' 's/from utils\.parsers/from utils.data_processing.parsers/g'
find utils/data_processing -name "*.py" -type f | xargs sed -i '' 's/from utils\.validators/from utils.data_processing.validators/g'

# Update imports in llm/
find utils/llm -name "*.py" -type f | xargs sed -i '' 's/from utils\.llm_provider/from utils.llm.provider/g'
find utils/llm -name "*.py" -type f | xargs sed -i '' 's/from utils\.llm_retry/from utils.llm.retry/g'
find utils/llm -name "*.py" -type f | xargs sed -i '' 's/from utils\.llm_client_error_handler/from utils.llm.error_handler/g'
find utils/llm -name "*.py" -type f | xargs sed -i '' 's/from utils\.model_capabilities/from utils.llm.model_capabilities/g'
find utils/llm -name "*.py" -type f | xargs sed -i '' 's/from utils\.model_availability/from utils.llm.model_availability/g'
find utils/llm -name "*.py" -type f | xargs sed -i '' 's/from utils\.schema_utils/from utils.llm.schema_utils/g'
find utils/llm -name "*.py" -type f | xargs sed -i '' 's/from utils\.progressive_simplification/from utils.llm.progressive_simplification/g'

# Update imports in media/
find utils/media -name "*.py" -type f | xargs sed -i '' 's/from utils\.image_utils/from utils.media.image_utils/g'
find utils/media -name "*.py" -type f | xargs sed -i '' 's/from utils\.image_provider/from utils.media.image_provider/g'

# Update imports in presentation/
find utils/presentation -name "*.py" -type f | xargs sed -i '' 's/from utils\.ppt_utils/from utils.presentation.ppt_utils/g'
find utils/presentation -name "*.py" -type f | xargs sed -i '' 's/from utils\.export_utils/from utils.presentation.export_utils/g'
find utils/presentation -name "*.py" -type f | xargs sed -i '' 's/from utils\.process_slides/from utils.presentation.process_slides/g'
find utils/presentation -name "*.py" -type f | xargs sed -i '' 's/from utils\.presentation_chunker/from utils.presentation.presentation_chunker/g'
find utils/presentation -name "*.py" -type f | xargs sed -i '' 's/from utils\.get_layout_by_name/from utils.presentation.get_layout_by_name/g'

# Update imports in error_handling/
find utils/error_handling -name "*.py" -type f | xargs sed -i '' 's/from utils\.error_handling import/from utils.error_handling.error_handling import/g'
find utils/error_handling -name "*.py" -type f | xargs sed -i '' 's/from utils\.user_friendly_errors/from utils.error_handling.user_friendly_errors/g'

# Update imports in external_services/
find utils/external_services -name "*.py" -type f | xargs sed -i '' 's/from utils\.ollama/from utils.external_services.ollama/g'
find utils/external_services -name "*.py" -type f | xargs sed -i '' 's/from utils\.get_dynamic_models/from utils.external_services.get_dynamic_models/g'

# Update datetime_utils references
find utils -name "*.py" -type f | xargs sed -i '' 's/from utils\.datetime_utils/from utils.datetime.datetime_utils/g'

# Update db_utils references
find utils -name "*.py" -type f | xargs sed -i '' 's/from utils\.db_utils/from utils.database.db_utils/g'

echo "✅ Internal utils imports updated!"
