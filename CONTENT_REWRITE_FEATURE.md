# Content Rewrite Feature

## Overview

The **Content Rewrite** feature allows users to upload an existing PowerPoint presentation with their desired design (colors, fonts, layouts, shapes, backgrounds) and have AI generate new textual content while preserving the exact visual design.

This feature is perfect for:
- Reusing a branded template with new content
- Quickly creating presentations with consistent design
- Generating multiple presentations from a single template
- Maintaining design standards while varying content

## Architecture

### Backend Components

#### 1. **Placeholder Extractor** ([placeholder_extractor.py](servers/fastapi/services/placeholder_extractor.py))

Lightweight service that extracts **text-only** placeholders from PPTX files.

**Key Functions:**
- `extract_all_placeholders(pptx_path)` - Main entry point
- `extract_placeholders_from_slide()` - Extracts placeholders from a single slide
- `extract_text_from_shape()` - Extracts text content from shape elements
- `get_placeholder_type()` - Identifies placeholder type (title, body, subtitle, etc.)
- `map_placeholder_to_common_name()` - Maps PowerPoint types to UI-friendly names
- `extract_speaker_notes()` - Extracts speaker notes
- `validate_rewritten_content()` - Validates LLM output structure

**Placeholder Mapping:**
- `title`, `ctrTitle` → "title"
- `subTitle` → "subtitle"
- `body` → "body" (or "left"/"right" for two-column layouts)
- `dt` → "date"
- `ftr` → "footer"
- `sldNum` → "slideNumber"

**Output Structure:**
```json
{
  "slides": [
    {
      "slideNumber": 1,
      "placeholders": {
        "title": "Current Title Text",
        "subtitle": "Current Subtitle",
        "body": "Current body content"
      },
      "notes": "Speaker notes"
    }
  ]
}
```

#### 2. **Placeholder Injector** ([placeholder_injector.py](servers/fastapi/services/placeholder_injector.py))

Service that injects rewritten text content back into PPTX placeholders.

**Key Functions:**
- `inject_content_into_pptx()` - Main entry point
- `inject_text_into_slide()` - Injects text into a single slide's placeholders
- `replace_text_in_shape()` - Replaces text in a shape element
- `inject_speaker_notes()` - Updates speaker notes

**Process:**
1. Extracts PPTX to temporary directory
2. Modifies slide XML with new text content
3. Preserves all formatting (fonts, colors, sizes) from first run
4. Repackages as new PPTX file
5. Cleans up temporary files

#### 3. **LLM Prompt** ([prompts.py](servers/fastapi/api/v1/ppt/endpoints/prompts.py))

`CONTENT_REWRITE_SYSTEM_PROMPT` - Detailed system prompt that instructs the LLM to:
- Generate text-only content (no design changes)
- Match the exact placeholder structure
- Never add/remove placeholders or slides
- Output clean JSON only
- Use `\n` for bullet points and line breaks

#### 4. **API Endpoints** ([content_rewrite.py](servers/fastapi/api/v1/ppt/endpoints/content_rewrite.py))

**Endpoints:**

1. **POST `/api/v1/ppt/rewrite/extract-placeholders`**
   - Uploads PPTX file
   - Extracts placeholder structure
   - Returns JSON structure for UI preview
   - Stores temp file path for later use

2. **POST `/api/v1/ppt/rewrite/generate-rewritten-content`**
   - Receives placeholder structure + user prompt
   - Calls LLM with content rewrite prompt
   - Returns rewritten content in same structure
   - Validates output matches input structure

3. **POST `/api/v1/ppt/rewrite/inject-and-download`**
   - Takes rewritten content + temp file path
   - Injects content into PPTX
   - Returns modified file for download

4. **POST `/api/v1/ppt/rewrite/rewrite-complete`** (convenience endpoint)
   - Single API call for entire workflow
   - Upload → Extract → Generate → Inject → Download

### Frontend Components

#### Content Rewrite Page ([content-rewrite/](servers/nextjs/app/(presentation-generator)/content-rewrite/))

**Route:** `/content-rewrite`

**Component:** `ContentRewritePage.tsx`

**User Flow:**

1. **Step 1: Upload**
   - User uploads .pptx file
   - Drag-and-drop or file picker
   - Validates file type

2. **Step 2: Enter Prompt**
   - Displays extracted placeholder structure
   - User enters content generation prompt
   - Example prompts provided

3. **Step 3: Preview**
   - Shows generated content for all slides
   - Displays all placeholders and speaker notes
   - Option to regenerate or download

4. **Step 4: Download**
   - Downloads rewritten PPTX
   - Success message
   - Option to create another

**Features:**
- Error handling and user feedback
- Loading states for async operations
- Preview before download
- Clean, step-by-step UI
- Reset/start over option

## Usage Examples

### Example 1: Simple Workflow

**User uploads:** `company_template.pptx` with branded design

**User prompt:**
```
Create a presentation about our Q4 2024 product launch.
Include product features, target market, pricing strategy, and launch timeline.
```

**System:**
1. Extracts 5 slides with title, body, and subtitle placeholders
2. Sends to LLM with prompt
3. LLM generates content matching structure
4. Injects content back into template
5. User downloads `rewritten_company_template.pptx`

**Result:** Same branded design, new content about Q4 product launch

### Example 2: Multi-Column Layout

**Placeholder Structure:**
```json
{
  "slides": [
    {
      "slideNumber": 1,
      "placeholders": {
        "title": "Old Title",
        "left": "Left column content",
        "right": "Right column content"
      }
    }
  ]
}
```

**User Prompt:**
```
Create a comparison of solar vs wind energy.
Left side: solar benefits. Right side: wind benefits.
```

**LLM Output:**
```json
{
  "slides": [
    {
      "slideNumber": 1,
      "placeholders": {
        "title": "Solar vs Wind Energy Comparison",
        "left": "Solar Benefits:\n• Clean renewable energy\n• Low maintenance costs\n• Scalable solutions",
        "right": "Wind Benefits:\n• Consistent power generation\n• Minimal land use\n• Cost-effective at scale"
      }
    }
  ]
}
```

## API Reference

### Extract Placeholders

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ppt/rewrite/extract-placeholders \
  -F "file=@template.pptx"
```

**Response:**
```json
{
  "placeholder_structure": {
    "slides": [...],
    "_temp_file_path": "/app/app_data/temp_uploads/abc123.pptx",
    "_original_filename": "template.pptx"
  },
  "message": "Successfully extracted placeholders from 5 slides"
}
```

### Generate Rewritten Content

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ppt/rewrite/generate-rewritten-content \
  -H "Content-Type: application/json" \
  -d '{
    "user_prompt": "Create a presentation about AI in healthcare",
    "placeholder_structure": { "slides": [...] }
  }'
```

**Response:**
```json
{
  "rewritten_content": {
    "slides": [...]
  },
  "message": "Successfully generated content for 5 slides"
}
```

### Inject and Download

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ppt/rewrite/inject-and-download \
  -F "temp_file_path=/app/app_data/temp_uploads/abc123.pptx" \
  -F "rewritten_content={...}" \
  -F "original_filename=template.pptx" \
  --output rewritten.pptx
```

**Response:** Binary PPTX file

### Complete Rewrite (Single Call)

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ppt/rewrite/rewrite-complete \
  -F "file=@template.pptx" \
  -F "user_prompt=Create a presentation about climate change" \
  --output rewritten.pptx
```

**Response:** Binary PPTX file

## Configuration

### Environment Variables

- `APP_DATA_DIRECTORY` - Base directory for file storage (default: `/app/app_data`)
  - Temp uploads: `{APP_DATA_DIRECTORY}/temp_uploads`
  - Rewritten presentations: `{APP_DATA_DIRECTORY}/rewritten_presentations`

- `LLM` - LLM provider (openai, anthropic, google, ollama, custom)
- `{PROVIDER}_API_KEY` - API key for LLM provider
- `NEXT_PUBLIC_API_URL` - Frontend API URL (default: `http://localhost:8000`)

### LLM Configuration

The content rewrite uses:
- **response_format:** `{"type": "json_object"}` for structured JSON output
- **temperature:** `0.7` for creative but controlled content generation
- **system_prompt:** `CONTENT_REWRITE_SYSTEM_PROMPT` with strict formatting rules

## Limitations

### Current Limitations

1. **Notes Creation:** If a slide doesn't have existing speaker notes, the system won't create new notes (requires complex PPTX relationship updates). Existing notes can be updated.

2. **Placeholder Detection:** Only detects official PowerPoint placeholders (shapes with `<p:ph>` elements). Regular text boxes are not detected.

3. **Design Preservation:** Text formatting (bold, italic, font size) uses the first run's properties. Complex inline formatting is simplified.

4. **File Size:** Large presentations may take longer to process. Recommended max: 50 slides.

5. **LLM Constraints:** Content quality depends on LLM provider and model selection.

### Future Enhancements

- [ ] Support for creating new speaker notes
- [ ] Detection of non-placeholder text boxes
- [ ] Preserve inline text formatting (bold/italic/colors)
- [ ] Real-time preview of injected content
- [ ] Batch processing of multiple presentations
- [ ] Template library for common designs
- [ ] Content history and versioning
- [ ] Multi-language content generation

## Testing

### Backend Testing

Test placeholder extraction:
```bash
cd servers/fastapi
python -c "from services.placeholder_extractor import extract_all_placeholders; print(extract_all_placeholders('test.pptx'))"
```

Test API endpoints:
```bash
# Start server
python server.py --port 8000

# Test extract
curl -X POST http://localhost:8000/api/v1/ppt/rewrite/extract-placeholders -F "file=@test.pptx"

# Test complete workflow
curl -X POST http://localhost:8000/api/v1/ppt/rewrite/rewrite-complete \
  -F "file=@test.pptx" \
  -F "user_prompt=Test content" \
  --output output.pptx
```

### Frontend Testing

```bash
cd servers/nextjs
npm run dev
# Navigate to http://localhost:3000/content-rewrite
```

## Troubleshooting

### Error: "Slide count mismatch"

**Cause:** LLM returned different number of slides than input

**Solution:** Check LLM output, ensure system prompt is being used correctly

### Error: "Placeholder mismatch"

**Cause:** LLM added/removed placeholders

**Solution:** Validate LLM is using JSON mode and following prompt instructions

### Error: "Original PPTX file not found"

**Cause:** Temp file was deleted or path is incorrect

**Solution:** Re-upload the PPTX file to extract placeholders again

### Error: "LLM returned invalid JSON"

**Cause:** LLM output is not valid JSON

**Solution:** Check LLM provider supports JSON mode, verify API key, check LLM model

## File Structure

```
servers/
├── fastapi/
│   ├── services/
│   │   ├── placeholder_extractor.py      # NEW: Text placeholder extraction
│   │   ├── placeholder_injector.py       # NEW: Text injection into PPTX
│   │   └── llm_client.py                 # Existing: LLM integration
│   └── api/v1/ppt/
│       ├── endpoints/
│       │   ├── content_rewrite.py        # NEW: Content rewrite endpoints
│       │   └── prompts.py                # UPDATED: Added CONTENT_REWRITE_SYSTEM_PROMPT
│       └── router.py                     # UPDATED: Added CONTENT_REWRITE_ROUTER
└── nextjs/
    └── app/(presentation-generator)/
        └── content-rewrite/              # NEW: Frontend UI
            ├── page.tsx
            └── components/
                └── ContentRewritePage.tsx
```

## Contributing

When adding features to content rewrite:

1. **Backend:** Modify services in `servers/fastapi/services/`
2. **API:** Add endpoints to `content_rewrite.py`
3. **Frontend:** Update `ContentRewritePage.tsx`
4. **Prompts:** Modify `CONTENT_REWRITE_SYSTEM_PROMPT` in `prompts.py`
5. **Tests:** Add test cases for new functionality
6. **Docs:** Update this document with new features

## License

Same as Presenton project license.
