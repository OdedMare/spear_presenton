#!/bin/bash

# Script to update all imports from old structure to new clean architecture
# Run from servers/fastapi/ directory

echo "🔄 Updating imports to use clean architecture..."
echo ""

# Update services.* imports to service.*
echo "1. Updating services.* → service.*"
find . -name "*.py" -type f -not -path "./services/*" -not -path "./__pycache__/*" -not -path "./service/__pycache__/*" | xargs sed -i '' 's/from services\./from service./g'
find . -name "*.py" -type f -not -path "./services/*" -not -path "./__pycache__/*" -not -path "./service/__pycache__/*" | xargs sed -i '' 's/import services\./import service./g'

# Update utils.llm_calls.* imports to service.*
echo "2. Updating utils.llm_calls.* → service.*"
find . -name "*.py" -type f -not -path "./__pycache__/*" | xargs sed -i '' 's/from utils\.llm_calls\.generate_presentation_outlines/from service.outline_service/g'
find . -name "*.py" -type f -not -path "./__pycache__/*" | xargs sed -i '' 's/from utils\.llm_calls\.generate_presentation_structure/from service.structure_service/g'
find . -name "*.py" -type f -not -path "./__pycache__/*" | xargs sed -i '' 's/from utils\.llm_calls\.generate_slide_content/from service.slide_content_service/g'
find . -name "*.py" -type f -not -path "./__pycache__/*" | xargs sed -i '' 's/from utils\.llm_calls\.edit_slide/from service.slide_service/g'
find . -name "*.py" -type f -not -path "./__pycache__/*" | xargs sed -i '' 's/from utils\.llm_calls\.edit_slide_html/from service.slide_service/g'
find . -name "*.py" -type f -not -path "./__pycache__/*" | xargs sed -i '' 's/from utils\.llm_calls\.select_slide_type_on_edit/from service.slide_service/g'

# Update specific service imports
echo "3. Updating specific service class names..."
find . -name "*.py" -type f -not -path "./services/*" -not -path "./__pycache__/*" | xargs sed -i '' 's/from service\.llm_client import LLMClient/from service.llm_service import LLMService, LLMClient/g'
find . -name "*.py" -type f -not -path "./services/*" -not -path "./__pycache__/*" | xargs sed -i '' 's/from service\.pptx_presentation_creator/from service.export_service/g'
find . -name "*.py" -type f -not -path "./services/*" -not -path "./__pycache__/*" | xargs sed -i '' 's/from service\.image_generation_service/from service.image_service/g'
find . -name "*.py" -type f -not -path "./services/*" -not -path "./__pycache__/*" | xargs sed -i '' 's/from service\.documents_loader/from service.document_service/g'

echo ""
echo "✅ Import updates complete!"
echo ""
echo "📝 Next steps:"
echo "1. Review changes with: git diff"
echo "2. Test imports: python -m py_compile api/**/*.py"
echo "3. Run tests: pytest"
echo "4. If all good, delete old directories:"
echo "   rm -rf services/"
echo "   rm -rf utils/llm_calls/"
