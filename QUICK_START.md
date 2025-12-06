# Multi-Agent Translation - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Install Dependencies
```bash
cd servers/fastapi
pip install deep-translator langdetect
```

### 2. Start Server
```bash
python server.py --port 8000
```

### 3. Test Translation
```bash
curl -X POST http://localhost:8000/api/v1/ppt/translate \
  -F "file=@presentation.pptx" \
  -F "source_language=hebrew" \
  -F "target_language=english"
```

### 4. Download Result
```bash
# Use the download_url from response
curl -O http://localhost:8000/api/v1/ppt/files/download/ABC123_translated.pptx
```

---

## 📋 API Cheat Sheet

### Basic Request
```bash
POST /api/v1/ppt/translate
```

**Required:**
- `file` - PPTX file
- `source_language` - Source language
- `target_language` - Target language

**Optional:**
- `translator_model` - Model for translation (default: gpt-4)
- `batch_size` - Elements per batch (default: 20)
- `max_retries` - Retry attempts (default: 1)

### Success Response
```json
{
  "status": "success",
  "download_url": "/api/v1/ppt/files/download/...",
  "stats": {...}
}
```

### Error Response
```json
{
  "status": "error",
  "stage": "translation",
  "message": "..."
}
```

---

## 🎯 Common Use Cases

### Hebrew → English
```bash
curl -X POST http://localhost:8000/api/v1/ppt/translate \
  -F "file=@hebrew_presentation.pptx" \
  -F "source_language=he" \
  -F "target_language=en"
```

### English → Hebrew (RTL Auto-Applied)
```bash
curl -X POST http://localhost:8000/api/v1/ppt/translate \
  -F "file=@english_presentation.pptx" \
  -F "source_language=en" \
  -F "target_language=he"
```

### High-Quality Translation
```bash
curl -X POST http://localhost:8000/api/v1/ppt/translate \
  -F "file=@presentation.pptx" \
  -F "source_language=en" \
  -F "target_language=he" \
  -F "translator_model=claude-opus-3" \
  -F "batch_size=15"
```

### Fast Translation
```bash
curl -X POST http://localhost:8000/api/v1/ppt/translate \
  -F "file=@presentation.pptx" \
  -F "source_language=en" \
  -F "target_language=he" \
  -F "translator_model=gpt-4o-mini" \
  -F "batch_size=30"
```

---

## 🔍 Troubleshooting

### Check Service Health
```bash
curl http://localhost:8000/api/v1/ppt/translate/health
```

### Check Translation Status
```bash
curl http://localhost:8000/api/v1/ppt/translate/status/YOUR_PRESENTATION_ID
```

### View Logs
```bash
# Server logs show detailed pipeline execution
tail -f logs/server.log
```

### Common Issues

**"Translation failed at stage: translation"**
- Check API keys for LLM provider
- Verify model name is correct
- Try reducing batch_size

**"File not found"**
- Ensure file is `.pptx` format
- Check file size limits

**"RTL not applied"**
- Verify target_language is "he" or "hebrew" (or "ar" for Arabic)
- Check response for `"rtl": true`

---

## 📊 Configuration Examples

### Maximum Quality (Recommended for important content)
```bash
export TRANSLATION_MODEL=claude-opus-3
export TRANSLATION_BATCH_SIZE=15
export TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini
```

### Balanced (Default)
```bash
export TRANSLATION_MODEL=gpt-4
export TRANSLATION_BATCH_SIZE=20
export TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini
```

### Fast & Cheap (High-volume)
```bash
export TRANSLATION_MODEL=gpt-4o-mini
export TRANSLATION_BATCH_SIZE=30
export TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini
```

---

## 📚 Full Documentation

- **API Reference:** [TRANSLATION_API.md](TRANSLATION_API.md)
- **Implementation Details:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Agent Architecture:** [TRANSLATION_AGENTS.md](TRANSLATION_AGENTS.md)

---

## 🎉 You're Ready!

The multi-agent translation pipeline is now fully integrated into your Presenton instance.

Start translating presentations with:
```bash
curl -X POST http://localhost:8000/api/v1/ppt/translate \
  -F "file=@your_presentation.pptx" \
  -F "source_language=SOURCE" \
  -F "target_language=TARGET"
```
