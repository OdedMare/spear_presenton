# Multi-Agent Translation API - Complete Documentation

## Overview

The Multi-Agent Translation API uses a **3-agent architecture** to translate PowerPoint presentations with high quality, cost optimization, and fault tolerance.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Upload PPTX File                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AGENT 1: Structure Agent (with retry)                      │
│  ─────────────────────────────────────────────              │
│  Tools:                                                      │
│    - validate_structure()                                   │
│    - extract_placeholders()                                 │
│    - detect_language()                                      │
│    - write_translation_map()                                │
│  ─────────────────────────────────────────────              │
│  Output: Translation contexts for each element              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AGENT 2: Translation Agent (with retry)                    │
│  ─────────────────────────────────────────────              │
│  Tools:                                                      │
│    - translate_text()                                       │
│    - batch_translate()                                      │
│    - terminology_guard()                                    │
│    - quality_check_translation()                            │
│  ─────────────────────────────────────────────              │
│  Output: Translated text for all elements                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AGENT 3: Assembler Agent (with retry)                      │
│  ─────────────────────────────────────────────              │
│  Tools:                                                      │
│    - merge_translations()                                   │
│    - resize_text_if_overflow()                              │
│    - preserve_rtl_layout()                                  │
│    - validate_structure()                                   │
│  ─────────────────────────────────────────────              │
│  Output: Final translated presentation structure            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Inject into PPTX & Download                     │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### 1. **POST /api/v1/ppt/translate**

Translate a PowerPoint presentation from source to target language.

#### Request

**Content-Type:** `multipart/form-data`

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | File | ✅ Yes | - | PPTX file to translate |
| `source_language` | string | ✅ Yes | - | Source language (e.g., "en", "hebrew", "he") |
| `target_language` | string | ✅ Yes | - | Target language (e.g., "he", "english", "en") |
| `presentation_id` | string | No | auto-generated | Unique ID for tracking |
| `use_llm_parser` | boolean | No | `false` | Use LLM for parsing (vs rule-based) |
| `parser_model` | string | No | `gpt-4o-mini` | Model for Structure Agent |
| `translator_model` | string | No | `gpt-4` | Model for Translation Agent |
| `validator_model` | string | No | `gpt-4o-mini` | Model for Assembler Agent |
| `batch_size` | integer | No | `20` | Number of elements per translation batch |
| `max_retries` | integer | No | `1` | Max retry attempts per agent |

#### Success Response (200)

```json
{
  "status": "success",
  "presentation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "output_path": "/tmp/a1b2c3d4_translated.pptx",
  "download_url": "/api/v1/ppt/files/download/a1b2c3d4_translated.pptx",
  "stats": {
    "total_elements": 150,
    "translatable_elements": 120,
    "skipped_elements": 30,
    "total_slides": 25,
    "source_language": "hebrew",
    "target_language": "english"
  }
}
```

#### Error Response (400)

```json
{
  "status": "error",
  "stage": "translation",
  "message": "Translation failed: API rate limit exceeded",
  "details": {
    "presentation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "source_language": "hebrew",
    "target_language": "english"
  }
}
```

**Error Stages:**
- `structure` - Failed during placeholder extraction/analysis
- `translation` - Failed during translation
- `assembly` - Failed during validation/merging

---

### 2. **GET /api/v1/ppt/translate/status/{presentation_id}**

Check translation status and retrieve translation map.

#### Request

```
GET /api/v1/ppt/translate/status/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

#### Response

```json
{
  "status": "completed",
  "presentation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "total_translations": 120,
  "map_path": "/app_data/translation_maps/a1b2c3d4_map.json"
}
```

---

### 3. **GET /api/v1/ppt/translate/health**

Health check for translation service.

#### Response

```json
{
  "status": "healthy",
  "service": "multi-agent-translation",
  "version": "1.0.0",
  "agents": ["structure", "translation", "assembler"],
  "configuration": {
    "parser_use_llm": "false",
    "parser_model": "gpt-4o-mini",
    "translator_model": "gpt-4",
    "validator_model": "gpt-4o-mini",
    "batch_size": "20"
  }
}
```

---

## Usage Examples

### Example 1: Basic Translation (cURL)

```bash
curl -X POST http://localhost:8000/api/v1/ppt/translate \
  -F "file=@presentation.pptx" \
  -F "source_language=hebrew" \
  -F "target_language=english"
```

### Example 2: With Custom Models (cURL)

```bash
curl -X POST http://localhost:8000/api/v1/ppt/translate \
  -F "file=@presentation.pptx" \
  -F "source_language=en" \
  -F "target_language=he" \
  -F "translator_model=claude-opus-3" \
  -F "batch_size=15" \
  -F "max_retries=2"
```

### Example 3: Python Requests

```python
import requests

url = "http://localhost:8000/api/v1/ppt/translate"

with open("presentation.pptx", "rb") as f:
    files = {"file": f}
    data = {
        "source_language": "hebrew",
        "target_language": "english",
        "translator_model": "gpt-4",
        "batch_size": 20
    }

    response = requests.post(url, files=files, data=data)

    if response.status_code == 200:
        result = response.json()
        print(f"Success! Download: {result['download_url']}")
        print(f"Stats: {result['stats']}")
    else:
        error = response.json()
        print(f"Error at {error['stage']}: {error['message']}")
```

### Example 4: JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('source_language', 'hebrew');
formData.append('target_language', 'english');

const response = await fetch('http://localhost:8000/api/v1/ppt/translate', {
  method: 'POST',
  body: formData
});

const result = await response.json();

if (result.status === 'success') {
  console.log('Download URL:', result.download_url);
  console.log('Stats:', result.stats);
} else {
  console.error(`Failed at ${result.stage}:`, result.message);
}
```

---

## Supported Languages

The API supports all languages available in Google Translate. Common examples:

| Language | Codes |
|----------|-------|
| English | `en`, `english` |
| Hebrew | `he`, `hebrew` |
| Arabic | `ar`, `arabic` |
| Spanish | `es`, `spanish` |
| French | `fr`, `french` |
| German | `de`, `german` |
| Chinese | `zh-CN`, `chinese` |
| Japanese | `ja`, `japanese` |
| Russian | `ru`, `russian` |

---

## RTL (Right-to-Left) Support

The API **automatically detects** RTL languages (Hebrew, Arabic) and applies proper text direction:

```json
{
  "rtl": true,
  "textDirection": "rtl"
}
```

No additional configuration needed!

---

## Environment Variables

Configure the translation service via environment variables:

```bash
# Enable/disable multi-agent system (default: true)
TRANSLATION_USE_AGENTS=true

# Agent 1: Parser Configuration
TRANSLATION_PARSER_USE_LLM=false      # Use LLM vs rule-based
TRANSLATION_PARSER_MODEL=gpt-4o-mini  # Model if using LLM

# Agent 2: Translator Configuration
TRANSLATION_MODEL=gpt-4               # Main translation model
TRANSLATION_BATCH_SIZE=20             # Elements per batch

# Agent 3: Validator Configuration
TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini

# Storage location for translation maps
APP_DATA_DIRECTORY=./app_data
```

---

## Cost Optimization

### Recommended Configurations

#### 🌟 **Maximum Quality** (Best for important content)
```bash
TRANSLATION_PARSER_USE_LLM=false
TRANSLATION_MODEL=claude-opus-3  # or gpt-4
TRANSLATION_BATCH_SIZE=15
TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini
```
**Cost:** ~$15-30 per 1M tokens
**Quality:** ⭐⭐⭐⭐⭐

#### ⚖️ **Balanced** (Recommended default)
```bash
TRANSLATION_PARSER_USE_LLM=false
TRANSLATION_MODEL=gpt-4
TRANSLATION_BATCH_SIZE=20
TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini
```
**Cost:** ~$5-10 per 1M tokens
**Quality:** ⭐⭐⭐⭐

#### ⚡ **Fast & Cheap** (High-volume drafts)
```bash
TRANSLATION_PARSER_USE_LLM=false
TRANSLATION_MODEL=gpt-4o-mini
TRANSLATION_BATCH_SIZE=30
TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini
```
**Cost:** ~$0.30 per 1M tokens
**Quality:** ⭐⭐⭐

---

## Error Handling & Retry Logic

Each agent has **automatic retry logic**:

1. If an agent fails, it retries up to `max_retries` times
2. Brief delay (1 second) between retries
3. If all retries fail, returns structured error with stage info

Example error flow:
```
[Translation Agent] Attempt 1/2 failed: API timeout
[Translation Agent] Retry attempt 1/1
[Translation Agent] Success!
```

---

## Tool Registry

All agents use a **centralized tool registry** for consistency and testability.

### Structure Tools (Agent 1)
- `read_json(path)` - Read JSON files
- `extract_placeholders(structure)` - Extract all placeholders
- `detect_language(text)` - Detect language from text
- `validate_structure(structure)` - Validate structure schema
- `write_translation_map(id, map)` - Persist translation map

### Translation Tools (Agent 2)
- `translate_text(text, from, to)` - Translate single text
- `batch_translate(items, from, to)` - Batch translation
- `terminology_guard(text, terms)` - Protect brand names
- `quality_check_translation(source, translated)` - Quality validation

### Assembler Tools (Agent 3)
- `read_translation_map(id)` - Load translation map
- `merge_translations(base, translations)` - Merge into structure
- `resize_text_if_overflow(text, max_length, max_lines)` - Smart truncation
- `preserve_rtl_layout(structure, lang)` - Apply RTL layout
- `write_final_presentation(structure, path)` - Save output

---

## File Structure

```
servers/fastapi/
├── api/v1/ppt/endpoints/
│   └── translation.py              # API endpoint
├── services/
│   ├── translation_tools.py        # Tool registry
│   ├── translation_agents.py       # Original agent classes
│   ├── translation_orchestrator.py # Enhanced orchestrator
│   ├── placeholder_extractor.py    # Extract from PPTX
│   └── placeholder_injector.py     # Inject into PPTX
└── requirements.txt                # Dependencies (deep-translator, langdetect)
```

---

## Testing

### Run Unit Tests
```bash
cd servers/fastapi
pytest tests/test_translation_api.py -v
```

### Manual Testing
```bash
# 1. Start the server
python server.py --port 8000

# 2. Test translation
curl -X POST http://localhost:8000/api/v1/ppt/translate \
  -F "file=@test_presentation.pptx" \
  -F "source_language=en" \
  -F "target_language=he"

# 3. Check health
curl http://localhost:8000/api/v1/ppt/translate/health
```

---

## Troubleshooting

### Issue: Translation quality is poor
**Solution:** Use a better model for the Translation Agent:
```bash
TRANSLATION_MODEL=claude-opus-3  # or gpt-4
```

### Issue: Translation too slow
**Solution:** Increase batch size or use faster model:
```bash
TRANSLATION_BATCH_SIZE=30
TRANSLATION_MODEL=gpt-4o-mini
```

### Issue: Text doesn't fit in slides
**Solution:** The Assembler Agent auto-truncates, but you can:
- Use smaller batch sizes for better quality
- Manually adjust `maxLength` constraints in structure

### Issue: Missing translations
**Solution:** Check the translation map for debugging:
```bash
GET /api/v1/ppt/translate/status/{presentation_id}
```

---

## Security Considerations

1. **File Upload Validation:** Only `.pptx` files accepted
2. **File Size Limits:** Enforced by FastAPI configuration
3. **Temporary File Cleanup:** Auto-cleanup via `TempFileService`
4. **API Rate Limiting:** Handled by LLM provider (OpenAI, Anthropic, etc.)

---

## Future Enhancements

- [ ] Parallel batch processing for faster translation
- [ ] Translation caching for repeated phrases
- [ ] Custom glossaries for domain-specific terminology
- [ ] Quality scoring with LLM evaluation
- [ ] Streaming translation progress
- [ ] Support for other file formats (PDF, DOCX)

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/anthropics/presenton/issues
- Documentation: See `TRANSLATION_AGENTS.md` for architecture details

---

## License

This feature is part of Presenton, an open-source project licensed under MIT.
