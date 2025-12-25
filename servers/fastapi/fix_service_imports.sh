#!/bin/bash

echo "🔄 Fixing service module imports..."

# Fix layout_renderer imports -> layout_service
find . -name "*.py" -type f ! -path "./__pycache__/*" -exec sed -i '' 's/from service\.layout_renderer/from service.layout_service/g' {} \;

# Fix layout_extractor imports -> layout_service
find . -name "*.py" -type f ! -path "./__pycache__/*" -exec sed -i '' 's/from service\.layout_extractor/from service.layout_service/g' {} \;

# Fix placeholder_extractor imports -> template_service
find . -name "*.py" -type f ! -path "./__pycache__/*" -exec sed -i '' 's/from service\.placeholder_extractor/from service.template_service/g' {} \;

# Fix placeholder_injector imports -> template_service
find . -name "*.py" -type f ! -path "./__pycache__/*" -exec sed -i '' 's/from service\.placeholder_injector/from service.template_service/g' {} \;

# Fix html_to_react_converter imports -> template_service
find . -name "*.py" -type f ! -path "./__pycache__/*" -exec sed -i '' 's/from service\.html_to_react_converter/from service.template_service/g' {} \;

# Fix html_text_editor imports -> template_service
find . -name "*.py" -type f ! -path "./__pycache__/*" -exec sed -i '' 's/from service\.html_text_editor/from service.template_service/g' {} \;

# Fix translation_agents imports -> translation_service
find . -name "*.py" -type f ! -path "./__pycache__/*" -exec sed -i '' 's/from service\.translation_agents/from service.translation_service/g' {} \;

# Fix translation_orchestrator imports -> translation_service
find . -name "*.py" -type f ! -path "./__pycache__/*" -exec sed -i '' 's/from service\.translation_orchestrator/from service.translation_service/g' {} \;

echo "✅ Service imports fixed!"
